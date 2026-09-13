-- ============================================================================
-- MIGRAZIONE: pianifica il cron giornaliero dei ricavi pannelli con pg_cron.
-- Già eseguita direttamente sul progetto Supabase. Questo file serve solo
-- da documentazione/riferimento nel repository.
--
-- In alternativa a pg_cron (se in futuro il piano Supabase non lo includesse
-- più, o si preferisse gestirlo da fuori), esiste già l'endpoint
-- /api/cron/accrue-panels pensato per essere chiamato da un cron esterno
-- (Vercel Cron, cron-job.org, ecc.) — vedi quel file per i dettagli.
-- ============================================================================

select cron.schedule(
  'accrue-panel-earnings-daily',
  '0 2 * * *',  -- ogni giorno alle 02:00 UTC
  $$ select public.accrue_panel_earnings(); $$
);
