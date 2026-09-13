-- ============================================================================
-- ELIMINAZIONE TICKET (solo admin).
-- I messaggi e le letture collegate vengono rimossi automaticamente grazie
-- a "on delete cascade" già presente sulle tabelle ticket_messages e
-- ticket_reads.
-- Da eseguire nell'SQL Editor di Supabase dopo sql/007_ticket_reads.sql.
-- ============================================================================

create or replace function public.admin_delete_ticket(
  p_ticket_id uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not is_admin() then
    raise exception 'Accesso negato';
  end if;

  delete from public.tickets where id = p_ticket_id;
end;
$$;
