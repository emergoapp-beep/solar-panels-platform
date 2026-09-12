-- ============================================================================
-- SCHEMA GENERICO: iscrizione con referral + depositi + prelievi
-- Estratto e ripulito dal progetto PrintFarm il 3 agosto 2026.
-- Da eseguire nell'SQL Editor di un progetto Supabase nuovo (schema "public").
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABELLE
-- ----------------------------------------------------------------------------

-- Profilo utente: un record per ogni utente registrato (collegato a auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id),
  email text unique,
  phone text,
  ref_code text unique default substr(md5(random()::text), 1, 8),
  referred_by uuid references public.profiles(id),
  role text not null default 'user' check (role in ('user', 'admin')),
  balance numeric not null default 0 check (balance >= 0),
  is_blocked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Log di ogni movimento di saldo (a scopo di controllo/storico)
create table public.balance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  amount numeric not null,
  type text not null check (
    type in ('deposit', 'withdrawal', 'withdrawal_refund', 'admin_adjustment', 'referral_bonus')
  ),
  reference_id uuid,
  admin_id uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

-- Indirizzo su cui gli utenti devono inviare i depositi (es. wallet USDT)
create table public.deposit_address (
  id uuid primary key default gen_random_uuid(),
  network text not null default 'TRC20',
  address text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

-- Richieste di deposito: l'utente dichiara di aver inviato fondi, un admin verifica e accredita
create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  tx_hash text not null unique,
  amount_claimed numeric not null check (amount_claimed > 0),
  amount_credited numeric,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Richieste di prelievo: il saldo viene scalato subito, un admin approva o rifiuta (con rimborso)
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  wallet_address text not null,
  amount numeric not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  tx_hash text,
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.balance_transactions enable row level security;
alter table public.deposit_address enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;

-- ----------------------------------------------------------------------------
-- 2. FUNZIONI DI SUPPORTO
-- ----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Crea il profilo al momento della registrazione, collegando referred_by
-- se in fase di signup è stato passato un ref_code valido (vedi app/register).
-- NOTA: nel progetto originale (PrintFarm) questa funzione assegnava anche
-- una risorsa di benvenuto specifica del gioco (una stampante gratuita).
-- Qui è rimossa: se il tuo progetto ha un "bonus di benvenuto" o un
-- "bonus referral", aggiungilo tu in questo punto della funzione.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, phone, referred_by)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'phone',
    (select id from public.profiles where ref_code = new.raw_user_meta_data->>'ref_code')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. FUNZIONI RPC: DEPOSITI E PRELIEVI
--    (chiamate dal client via supabase.rpc(...); vedi le API routes)
-- ----------------------------------------------------------------------------

create or replace function public.admin_confirm_deposit(
  p_deposit_id uuid,
  p_amount_credited numeric,
  p_note text default null
)
returns deposits
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin_id uuid := auth.uid();
  v_deposit public.deposits;
begin
  if not is_admin() then
    raise exception 'Accesso negato';
  end if;

  if p_amount_credited is null or p_amount_credited <= 0 then
    raise exception 'Importo non valido';
  end if;

  select * into v_deposit from public.deposits where id = p_deposit_id for update;

  if v_deposit.id is null then
    raise exception 'Deposito non trovato';
  end if;
  if v_deposit.status <> 'pending' then
    raise exception 'Deposito già gestito';
  end if;

  update public.deposits
  set status = 'confirmed',
      amount_credited = p_amount_credited,
      admin_note = p_note,
      reviewed_by = v_admin_id,
      reviewed_at = now()
  where id = p_deposit_id
  returning * into v_deposit;

  update public.profiles
  set balance = balance + p_amount_credited
  where id = v_deposit.user_id;

  insert into public.balance_transactions (user_id, amount, type, reference_id, admin_id, note)
  values (v_deposit.user_id, p_amount_credited, 'deposit', v_deposit.id, v_admin_id, coalesce(p_note, 'Deposito confermato'));

  return v_deposit;
end;
$$;

create or replace function public.admin_reject_deposit(
  p_deposit_id uuid,
  p_note text default null
)
returns deposits
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin_id uuid := auth.uid();
  v_deposit public.deposits;
begin
  if not is_admin() then
    raise exception 'Accesso negato';
  end if;

  select * into v_deposit from public.deposits where id = p_deposit_id for update;

  if v_deposit.id is null then
    raise exception 'Deposito non trovato';
  end if;
  if v_deposit.status <> 'pending' then
    raise exception 'Deposito già gestito';
  end if;

  update public.deposits
  set status = 'rejected',
      admin_note = p_note,
      reviewed_by = v_admin_id,
      reviewed_at = now()
  where id = p_deposit_id
  returning * into v_deposit;

  return v_deposit;
end;
$$;

create or replace function public.request_withdrawal(
  p_wallet_address text,
  p_amount numeric
)
returns withdrawals
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_is_blocked boolean;
  v_withdrawal public.withdrawals;
begin
  if v_user_id is null then
    raise exception 'Non autenticato';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Importo non valido';
  end if;

  if p_wallet_address is null or length(trim(p_wallet_address)) = 0 then
    raise exception 'Indirizzo wallet mancante';
  end if;

  select balance, is_blocked into v_balance, v_is_blocked
  from public.profiles
  where id = v_user_id
  for update;

  if v_is_blocked then
    raise exception 'Account bloccato';
  end if;

  if v_balance < p_amount then
    raise exception 'Saldo insufficiente';
  end if;

  update public.profiles
  set balance = balance - p_amount
  where id = v_user_id;

  insert into public.withdrawals (user_id, wallet_address, amount)
  values (v_user_id, trim(p_wallet_address), p_amount)
  returning * into v_withdrawal;

  insert into public.balance_transactions (user_id, amount, type, reference_id, note)
  values (v_user_id, -p_amount, 'withdrawal', v_withdrawal.id, 'Richiesta di prelievo');

  return v_withdrawal;
end;
$$;

create or replace function public.admin_approve_withdrawal(
  p_withdrawal_id uuid,
  p_tx_hash text default null,
  p_note text default null
)
returns withdrawals
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin_id uuid := auth.uid();
  v_withdrawal public.withdrawals;
begin
  if not is_admin() then
    raise exception 'Accesso negato';
  end if;

  select * into v_withdrawal from public.withdrawals where id = p_withdrawal_id for update;

  if v_withdrawal.id is null then
    raise exception 'Prelievo non trovato';
  end if;
  if v_withdrawal.status <> 'pending' then
    raise exception 'Prelievo già gestito';
  end if;

  update public.withdrawals
  set status = 'approved',
      tx_hash = p_tx_hash,
      admin_note = p_note,
      reviewed_by = v_admin_id,
      reviewed_at = now()
  where id = p_withdrawal_id
  returning * into v_withdrawal;

  return v_withdrawal;
end;
$$;

create or replace function public.admin_reject_withdrawal(
  p_withdrawal_id uuid,
  p_note text default null
)
returns withdrawals
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin_id uuid := auth.uid();
  v_withdrawal public.withdrawals;
begin
  if not is_admin() then
    raise exception 'Accesso negato';
  end if;

  select * into v_withdrawal from public.withdrawals where id = p_withdrawal_id for update;

  if v_withdrawal.id is null then
    raise exception 'Prelievo non trovato';
  end if;
  if v_withdrawal.status <> 'pending' then
    raise exception 'Prelievo già gestito';
  end if;

  update public.withdrawals
  set status = 'rejected',
      admin_note = p_note,
      reviewed_by = v_admin_id,
      reviewed_at = now()
  where id = p_withdrawal_id
  returning * into v_withdrawal;

  update public.profiles
  set balance = balance + v_withdrawal.amount
  where id = v_withdrawal.user_id;

  insert into public.balance_transactions (user_id, amount, type, reference_id, admin_id, note)
  values (v_withdrawal.user_id, v_withdrawal.amount, 'withdrawal_refund', v_withdrawal.id, v_admin_id, coalesce(p_note, 'Prelievo rifiutato: saldo ripristinato'));

  return v_withdrawal;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

-- profiles
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Utenti possono vedere i propri iscritti"
on public.profiles for select
using (referred_by = auth.uid());

create policy "Admins possono leggere tutti i profili"
on public.profiles for select
using (is_admin() or id = auth.uid());

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

create policy "Admins possono modificare tutti i profili"
on public.profiles for update
using (is_admin())
with check (is_admin());

-- balance_transactions
create policy "Users can view own transactions"
on public.balance_transactions for select
using (auth.uid() = user_id);

create policy "Users can create own transactions"
on public.balance_transactions for insert
with check (auth.uid() = user_id);

create policy "Admins possono inserire transazioni per altri utenti"
on public.balance_transactions for insert
with check (is_admin());

-- deposit_address (letto da chiunque sia loggato, scritto solo dagli admin)
create policy "Utenti autenticati leggono l'indirizzo di deposito"
on public.deposit_address for select
to authenticated
using (true);

create policy "Solo admin gestisce l'indirizzo di deposito"
on public.deposit_address for all
using (is_admin())
with check (is_admin());

-- deposits
create policy "Utenti vedono i propri depositi"
on public.deposits for select
using (auth.uid() = user_id or is_admin());

create policy "Utenti creano i propri depositi in stato pending"
on public.deposits for insert
with check (
  auth.uid() = user_id
  and status = 'pending'
  and amount_credited is null
  and reviewed_by is null
);

create policy "Solo admin aggiorna i depositi"
on public.deposits for update
using (is_admin())
with check (is_admin());

-- withdrawals
create policy "Utenti vedono i propri prelievi"
on public.withdrawals for select
using (auth.uid() = user_id or is_admin());

create policy "Utenti creano i propri prelievi in stato pending"
on public.withdrawals for insert
with check (
  auth.uid() = user_id
  and status = 'pending'
  and tx_hash is null
  and reviewed_by is null
);

create policy "Solo admin aggiorna i prelievi"
on public.withdrawals for update
using (is_admin())
with check (is_admin());

-- ----------------------------------------------------------------------------
-- 5. DATI INIZIALI (facoltativo)
-- ----------------------------------------------------------------------------

-- Imposta qui il tuo indirizzo di deposito reale prima di andare in produzione:
-- insert into public.deposit_address (network, address) values ('TRC20', 'IL_TUO_INDIRIZZO_QUI');

-- Per rendere un utente admin dopo la registrazione:
-- update public.profiles set role = 'admin' where email = 'tuo@email.com';
