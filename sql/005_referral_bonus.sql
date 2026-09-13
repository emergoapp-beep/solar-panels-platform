-- ============================================================================
-- BONUS REFERRAL: il 10% di ogni deposito confermato di un iscritto viene
-- accreditato sul saldo di chi lo ha invitato (referred_by).
-- Da eseguire nell'SQL Editor di Supabase dopo schema.sql / 002 / 003 / 004.
-- ============================================================================

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
  v_referrer_id uuid;
  v_bonus numeric;
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

  -- Bonus referral: il 10% va a chi ha invitato l'utente, se presente.
  select referred_by into v_referrer_id
  from public.profiles
  where id = v_deposit.user_id;

  if v_referrer_id is not null then
    v_bonus := round(p_amount_credited * 0.10, 2);

    if v_bonus > 0 then
      update public.profiles
      set balance = balance + v_bonus
      where id = v_referrer_id;

      insert into public.balance_transactions (user_id, amount, type, reference_id, admin_id, note)
      values (
        v_referrer_id,
        v_bonus,
        'referral_bonus',
        v_deposit.id,
        v_admin_id,
        'Bonus 10% sul deposito di un iscritto'
      );
    end if;
  end if;

  return v_deposit;
end;
$$;
