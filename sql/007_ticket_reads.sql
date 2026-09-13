-- ============================================================================
-- NOTIFICHE / NON LETTI sui ticket.
-- Traccia, per ciascun utente (o admin), quando ha letto per l'ultima volta
-- un ticket. Un ticket è "non letto" per un viewer se è stato aggiornato
-- dopo la sua ultima lettura registrata qui.
-- Da eseguire nell'SQL Editor di Supabase dopo sql/006_tickets.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABELLA
-- ----------------------------------------------------------------------------

create table public.ticket_reads (
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  last_read_at timestamptz not null default now(),
  primary key (ticket_id, user_id)
);

alter table public.ticket_reads enable row level security;

create policy "Ognuno vede solo le proprie letture"
on public.ticket_reads for select
using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. FUNZIONE: segna un ticket come letto da chi la chiama
-- ----------------------------------------------------------------------------

create or replace function public.mark_ticket_read(
  p_ticket_id uuid
)
returns void
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

  select * into v_ticket from public.tickets where id = p_ticket_id;
  if v_ticket.id is null then
    raise exception 'Ticket non trovato';
  end if;
  if v_ticket.user_id <> v_uid and not is_admin() then
    raise exception 'Accesso negato';
  end if;

  insert into public.ticket_reads (ticket_id, user_id, last_read_at)
  values (p_ticket_id, v_uid, now())
  on conflict (ticket_id, user_id) do update set last_read_at = excluded.last_read_at;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Le funzioni esistenti vengono ri-create per segnare automaticamente
--    come "letto" il ticket per chi sta scrivendo (così non appare come
--    non letto a se stessi subito dopo aver inviato un messaggio).
-- ----------------------------------------------------------------------------

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

  insert into public.ticket_reads (ticket_id, user_id, last_read_at)
  values (v_ticket.id, v_user_id, now())
  on conflict (ticket_id, user_id) do update set last_read_at = excluded.last_read_at;

  return v_ticket;
end;
$$;

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

  insert into public.ticket_reads (ticket_id, user_id, last_read_at)
  values (p_ticket_id, v_uid, now())
  on conflict (ticket_id, user_id) do update set last_read_at = excluded.last_read_at;

  return v_message;
end;
$$;

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

  insert into public.ticket_reads (ticket_id, user_id, last_read_at)
  values (v_ticket.id, v_admin_id, now())
  on conflict (ticket_id, user_id) do update set last_read_at = excluded.last_read_at;

  return v_ticket;
end;
$$;

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

    insert into public.ticket_reads (ticket_id, user_id, last_read_at)
    values (v_ticket_id, v_admin_id, now())
    on conflict (ticket_id, user_id) do update set last_read_at = excluded.last_read_at;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
