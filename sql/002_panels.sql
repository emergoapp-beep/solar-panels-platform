-- ============================================================================
-- MIGRAZIONE: pannelli solari (prodotti acquistabili che generano ricavi
-- giornalieri). Da eseguire DOPO schema.sql, nell'SQL Editor di Supabase.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABELLE
-- ----------------------------------------------------------------------------

-- Tipi di pannello configurabili dall'admin (es. "Pannello Base", "Pannello Pro").
-- Qui l'admin decide prezzo, resa giornaliera e durata di ogni tipo.
create table public.panel_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null check (price > 0),
  daily_yield_type text not null default 'percent' check (daily_yield_type in ('percent', 'fixed')),
  daily_yield_value numeric not null check (daily_yield_value > 0),
  duration_days integer check (duration_days is null or duration_days > 0), -- null = nessuna scadenza
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pannelli posseduti da un utente. I valori economici (prezzo, resa) vengono
-- "fotografati" al momento dell'acquisto: se l'admin cambia in seguito il
-- prezzo o la resa di un panel_type, i pannelli già acquistati non cambiano.
create table public.user_panels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  panel_type_id uuid not null references public.panel_types(id),
  name text not null,
  purchase_price numeric not null,
  daily_yield_type text not null check (daily_yield_type in ('percent', 'fixed')),
  daily_yield_value numeric not null,
  purchased_at timestamptz not null default now(),
  expires_at timestamptz, -- null = nessuna scadenza
  last_accrued_at timestamptz not null default now(),
  total_earned numeric not null default 0,
  status text not null default 'active' check (status in ('active', 'expired'))
);

alter table public.panel_types enable row level security;
alter table public.user_panels enable row level security;

-- I ricavi dei pannelli sono movimenti di saldo a tutti gli effetti:
-- aggiungiamo i due nuovi tipi allo stesso vincolo usato da depositi/prelievi.
alter table public.balance_transactions drop constraint balance_transactions_type_check;
alter table public.balance_transactions add constraint balance_transactions_type_check check (
  type in ('deposit', 'withdrawal', 'withdrawal_refund', 'admin_adjustment', 'referral_bonus', 'panel_purchase', 'panel_earning')
);

-- ----------------------------------------------------------------------------
-- 2. FUNZIONI RPC
-- ----------------------------------------------------------------------------

-- Acquisto di un pannello: scala subito il saldo e crea il pannello dell'utente.
create or replace function public.buy_panel(
  p_panel_type_id uuid
)
returns user_panels
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_is_blocked boolean;
  v_panel_type public.panel_types;
  v_expires_at timestamptz;
  v_user_panel public.user_panels;
begin
  if v_user_id is null then
    raise exception 'Non autenticato';
  end if;

  select * into v_panel_type from public.panel_types where id = p_panel_type_id;

  if v_panel_type.id is null or not v_panel_type.is_active then
    raise exception 'Pannello non disponibile';
  end if;

  select balance, is_blocked into v_balance, v_is_blocked
  from public.profiles
  where id = v_user_id
  for update;

  if v_is_blocked then
    raise exception 'Account bloccato';
  end if;

  if v_balance < v_panel_type.price then
    raise exception 'Saldo insufficiente';
  end if;

  if v_panel_type.duration_days is not null then
    v_expires_at := now() + (v_panel_type.duration_days || ' days')::interval;
  else
    v_expires_at := null;
  end if;

  update public.profiles
  set balance = balance - v_panel_type.price
  where id = v_user_id;

  insert into public.user_panels (
    user_id, panel_type_id, name, purchase_price,
    daily_yield_type, daily_yield_value, expires_at
  )
  values (
    v_user_id, v_panel_type.id, v_panel_type.name, v_panel_type.price,
    v_panel_type.daily_yield_type, v_panel_type.daily_yield_value, v_expires_at
  )
  returning * into v_user_panel;

  insert into public.balance_transactions (user_id, amount, type, reference_id, note)
  values (v_user_id, -v_panel_type.price, 'panel_purchase', v_user_panel.id, 'Acquisto ' || v_panel_type.name);

  return v_user_panel;
end;
$$;

-- Accredita i ricavi giornalieri maturati su tutti i pannelli attivi.
-- Pensata per essere chiamata una volta al giorno da un cron esterno
-- (service role, quindi auth.uid() è null) oppure manualmente da un admin.
-- È idempotente entro la stessa giornata: calcola i giorni interi passati
-- da last_accrued_at, quindi chiamarla più volte lo stesso giorno non paga due volte.
create or replace function public.accrue_panel_earnings()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_caller uuid := auth.uid();
  v_panel record;
  v_days_elapsed integer;
  v_earning numeric;
  v_count integer := 0;
begin
  if v_caller is not null and not is_admin() then
    raise exception 'Accesso negato';
  end if;

  for v_panel in
    select * from public.user_panels where status = 'active' for update
  loop
    v_days_elapsed := floor(extract(epoch from (now() - v_panel.last_accrued_at)) / 86400);

    if v_days_elapsed >= 1 then
      if v_panel.daily_yield_type = 'percent' then
        v_earning := v_panel.purchase_price * (v_panel.daily_yield_value / 100) * v_days_elapsed;
      else
        v_earning := v_panel.daily_yield_value * v_days_elapsed;
      end if;

      update public.profiles
      set balance = balance + v_earning
      where id = v_panel.user_id;

      insert into public.balance_transactions (user_id, amount, type, reference_id, note)
      values (
        v_panel.user_id, v_earning, 'panel_earning', v_panel.id,
        'Ricavo giornaliero ' || v_panel.name || ' (' || v_days_elapsed || ' gg)'
      );

      update public.user_panels
      set last_accrued_at = last_accrued_at + (v_days_elapsed || ' days')::interval,
          total_earned = total_earned + v_earning
      where id = v_panel.id;

      v_count := v_count + 1;
    end if;

    if v_panel.expires_at is not null and now() >= v_panel.expires_at then
      update public.user_panels set status = 'expired' where id = v_panel.id;
    end if;
  end loop;

  return v_count;
end;
$$;

-- Solo service role (cron) o admin possono eseguire l'accredito massivo.
revoke execute on function public.accrue_panel_earnings() from public, authenticated, anon;
grant execute on function public.accrue_panel_earnings() to service_role;

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

-- panel_types
create policy "Utenti autenticati vedono i pannelli attivi"
on public.panel_types for select
to authenticated
using (is_active = true or is_admin());

create policy "Solo admin gestisce i tipi di pannello"
on public.panel_types for all
using (is_admin())
with check (is_admin());

-- user_panels
create policy "Utenti vedono i propri pannelli"
on public.user_panels for select
using (auth.uid() = user_id or is_admin());

create policy "Admin può aggiornare i pannelli utente"
on public.user_panels for update
using (is_admin())
with check (is_admin());

-- Nota: non serve una policy di insert per gli utenti autenticati, perché
-- l'acquisto avviene solo tramite la funzione buy_panel() (security definer).

-- ----------------------------------------------------------------------------
-- 4. DATI DI ESEMPIO (facoltativo — cancellali o modificali dal pannello admin)
-- ----------------------------------------------------------------------------

-- insert into public.panel_types (name, description, price, daily_yield_type, daily_yield_value, duration_days)
-- values ('Pannello Base', 'Genera un ricavo giornaliero fisso', 100, 'percent', 1, 365);
