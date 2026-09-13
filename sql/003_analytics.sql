-- ============================================================================
-- MIGRAZIONE: analitiche di base (visite al sito).
-- Da eseguire DOPO schema.sql e 002_panels.sql, nell'SQL Editor di Supabase.
-- ============================================================================

-- Una riga per ogni pagina caricata. Se chi visita è loggato, viene collegata
-- al suo profilo (quindi alla sua email, tramite join su profiles); altrimenti
-- resta anonima (user_id null). La geolocalizzazione NON viene calcolata né
-- salvata qui: si fa "al volo" solo quando un admin la richiede dal pannello,
-- partendo dall'indirizzo IP salvato in questa tabella.
create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  path text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index page_views_created_at_idx on public.page_views (created_at desc);
create index page_views_user_id_idx on public.page_views (user_id);

alter table public.page_views enable row level security;

-- Solo gli admin possono leggere le visite dal pannello.
create policy "Solo admin legge le visite"
on public.page_views for select
using (is_admin());

-- Nessuna policy di insert per utenti autenticati/anonimi: le righe vengono
-- scritte solo dall'endpoint /api/track tramite la service role key (che
-- bypassa la RLS), mai direttamente dal browser.

-- ----------------------------------------------------------------------------
-- Nota privacy (GDPR): l'indirizzo IP è un dato personale, e collegarlo a un
-- utente registrato (email) rientra nel trattamento dati che va dichiarato
-- nella privacy policy del sito, con una base giuridica adeguata (in genere
-- "legittimo interesse" per statistiche di base). Valuta anche una scadenza
-- per questi dati, es. cancellare le righe più vecchie di N mesi:
--   delete from public.page_views where created_at < now() - interval '6 months';
-- ----------------------------------------------------------------------------
