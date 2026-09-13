-- ============================================================================
-- SISTEMA TICKET / ASSISTENZA
-- - L'utente può aprire un ticket verso l'admin.
-- - L'admin può rispondere, oppure scrivere per primo a un singolo utente
--   o in broadcast a tutti gli iscritti (un ticket per destinatario).
-- Da eseguire nell'SQL Editor di Supabase dopo gli script precedenti.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABELLE
-- ----------------------------------------------------------------------------

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  origin text not null check (origin in ('user', 'admin')),
  subject text not null,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  sender_role text not null check (sender_role in ('user', 'admin')),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- ----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (sola lettura diretta: le scritture passano dalle RPC)
-- ----------------------------------------------------------------------------

create policy "Utenti vedono i propri ticket, admin li vede tutti"
on public.tickets for select
using (auth.uid() = user_id or is_admin());

create policy "Utenti vedono i messaggi dei propri ticket, admin tutti"
on public.ticket_messages for select
using (
  exists (
    select 1 from public.tickets t
    where t.id = ticket_id and (t.user_id = auth.uid() or is_admin())
  )
);

-- ----------------------------------------------------------------------------
-- 3. FUNZIONI RPC
-- ----------------------------------------------------------------------------

-- L'utente apre un nuovo ticket verso l'admin.
create or replace function public.create_support_ticket(
  p_subject text,
  p_body text
)
returns tickets
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_ticket public.tickets;
begin
  if v_user_id is null then
    raise exception 'Non autenticato';
  end if;

  if p_subject is null or length(trim(p_subject)) = 0 then
    raise exception 'Oggetto mancante';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'Messaggio mancante';
  end if;

  insert into public.tickets (user_id, created_by, origin, subject, status)
  values (v_user_id, v_user_id, 'user', trim(p_subject), 'open')
  returning * into v_ticket;

  insert into public.ticket_messages (ticket_id, sender_id, sender_role, body)
  values (v_ticket.id, v_user_id, 'user', trim(p_body));

  return v_ticket;
end;
$$;

-- Risposta di un utente (proprietario del ticket) o dell'admin.
create or replace function public.reply_ticket(
  p_ticket_id uuid,
  p_body text
)
returns ticket_messages
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_ticket public.tickets;
  v_role text;
  v_message public.ticket_messages;
begin
  if v_uid is null then
    raise exception 'Non autenticato';
  end if;

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'Messaggio vuoto';
  end if;

  select * into v_ticket from public.tickets where id = p_ticket_id for update;

  if v_ticket.id is null then
    raise exception 'Ticket non trovato';
  end if;

  if v_ticket.status = 'closed' then
    raise exception 'Ticket chiuso';
  end if;

  if is_admin() then
    v_role := 'admin';
  elsif v_ticket.user_id = v_uid then
    v_role := 'user';
  else
    raise exception 'Accesso negato';
  end if;

  insert into public.ticket_messages (ticket_id, sender_id, sender_role, body)
  values (p_ticket_id, v_uid, v_role, trim(p_body))
  returning * into v_message;

  update public.tickets
  set status = case when v_role = 'admin' then 'answered' else 'open' end,
      updated_at = now()
  where id = p_ticket_id;

  return v_message;
end;
$$;

-- Chiusura di un ticket (dal proprietario o dall'admin).
create or replace function public.close_ticket(
  p_ticket_id uuid
)
returns tickets
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_ticket public.tickets;
begin
  if v_uid is null then
    raise exception 'Non autenticato';
  end if;

  select * into v_ticket from public.tickets where id = p_ticket_id for update;

  if v_ticket.id is null then
    raise exception 'Ticket non trovato';
  end if;

  if v_ticket.user_id <> v_uid and not is_admin() then
    raise exception 'Accesso negato';
  end if;

  update public.tickets
  set status = 'closed', updated_at = now()
  where id = p_ticket_id
  returning * into v_ticket;

  return v_ticket;
end;
$$;

-- L'admin scrive per primo a un singolo utente.
create or replace function public.admin_send_message(
  p_user_id uuid,
  p_subject text,
  p_body text
)
returns tickets
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin_id uuid := auth.uid();
  v_ticket public.tickets;
begin
  if not is_admin() then
    raise exception 'Accesso negato';
  end if;

  if p_user_id is null or not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Utente non valido';
  end if;
  if p_subject is null or length(trim(p_subject)) = 0 then
    raise exception 'Oggetto mancante';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'Messaggio mancante';
  end if;

  insert into public.tickets (user_id, created_by, origin, subject, status)
  values (p_user_id, v_admin_id, 'admin', trim(p_subject), 'answered')
  returning * into v_ticket;

  insert into public.ticket_messages (ticket_id, sender_id, sender_role, body)
  values (v_ticket.id, v_admin_id, 'admin', trim(p_body));

  return v_ticket;
end;
$$;

-- L'admin scrive in broadcast a tutti gli utenti (un ticket per destinatario).
-- Ritorna il numero di destinatari raggiunti.
create or replace function public.admin_send_broadcast(
  p_subject text,
  p_body text
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin_id uuid := auth.uid();
  v_recipient record;
  v_ticket_id uuid;
  v_count integer := 0;
begin
  if not is_admin() then
    raise exception 'Accesso negato';
  end if;

  if p_subject is null or length(trim(p_subject)) = 0 then
    raise exception 'Oggetto mancante';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'Messaggio mancante';
  end if;

  for v_recipient in
    select id from public.profiles where role = 'user'
  loop
    insert into public.tickets (user_id, created_by, origin, subject, status)
    values (v_recipient.id, v_admin_id, 'admin', trim(p_subject), 'answered')
    returning id into v_ticket_id;

    insert into public.ticket_messages (ticket_id, sender_id, sender_role, body)
    values (v_ticket_id, v_admin_id, 'admin', trim(p_body));

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
