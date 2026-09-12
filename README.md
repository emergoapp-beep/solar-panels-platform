# Scheletro: iscrizione + referral + depositi + prelievi

Estratto da PrintFarm il 3 agosto 2026, ripulito da tutto ciò che è specifico
di quel progetto (stampanti, progetti di stampa, ticket di assistenza).
Contiene **solo** il sistema di:

- registrazione utente con tracciamento referral (`?ref=CODICE`)
- saldo utente e log dei movimenti (`balance_transactions`)
- depositi (l'utente dichiara una transazione, un admin la verifica e accredita)
- prelievi (il saldo viene scalato subito, un admin approva o rifiuta con rimborso)
- pannello admin minimo (utenti, depositi, prelievi)

## Stack

Next.js (App Router) + Supabase (Postgres + Auth) + Tailwind CSS.
Stesso stack di PrintFarm, quindi i file si integrano senza modifiche
in un progetto con la stessa struttura.

## Come usarlo in un progetto NUOVO (da zero)

1. Crea un nuovo progetto Next.js con Tailwind e App Router (oppure usa
   direttamente questa cartella come base: contiene già `package.json`,
   `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`).
2. `npm install`
3. Crea un progetto Supabase nuovo, apri l'SQL Editor ed esegui **`sql/schema.sql`**
   per intero: crea tabelle, funzioni, trigger e policy RLS.
4. Copia `.env.local.example` in `.env.local` e inserisci URL e anon key
   del tuo progetto Supabase (Project Settings → API).
5. Imposta un indirizzo di deposito reale:
   ```sql
   insert into public.deposit_address (network, address)
   values ('TRC20', 'IL_TUO_INDIRIZZO');
   ```
6. Rendi il tuo utente admin dopo la prima registrazione:
   ```sql
   update public.profiles set role = 'admin' where email = 'tuo@email.com';
   ```
7. `npm run dev` e verifica login, registrazione, depositi, prelievi, referral, admin.

## Come usarlo DENTRO un progetto Next.js+Supabase già esistente

Copia le cartelle `app/`, `components/`, `lib/` dentro il progetto esistente
(senza sovrascrivere pagine con lo stesso nome che già usi), poi esegui
`sql/schema.sql` sul progetto Supabase di quel progetto. Se il progetto ha
già una tabella `profiles`, confronta le colonne con lo schema qui incluso
e aggiungi solo quelle mancanti (`ref_code`, `referred_by`, `balance`,
`is_blocked`) invece di ricreare la tabella da zero.

## Struttura dei file

```
sql/schema.sql                          → tabelle, funzioni, trigger, RLS

lib/supabase/client.ts                  → connettore Supabase lato browser
lib/supabase/server.ts                  → connettore Supabase lato server

app/layout.tsx, app/globals.css         → layout radice, font, tema (dark/neon)
components/layout/Navbar.tsx            → barra di navigazione (con menu mobile)
components/layout/NeonBackground.tsx    → sfondo decorativo (puramente estetico)
components/icons/Icons.tsx              → set minimo di icone SVG usate

app/login/page.tsx                      → login
app/register/page.tsx                   → registrazione (legge ?ref= dall'URL)

app/dashboard/page.tsx                  → saldo, ruolo, codice referral

app/referral/page.tsx                   → link da condividere + elenco iscritti
components/referral/CopyReferralLink.tsx

app/deposits/page.tsx                   → indirizzo di deposito + form + storico
components/deposits/DepositForm.tsx
components/deposits/DepositStatusBadge.tsx
app/api/deposits/route.ts               → POST: crea un deposito "pending"

app/withdrawals/page.tsx                → form + storico prelievi
components/withdrawals/WithdrawalForm.tsx
app/api/withdrawals/route.ts            → POST: chiama la funzione request_withdrawal

app/admin/layout.tsx                    → protegge /admin/* (solo role='admin')
app/admin/page.tsx                      → statistiche aggregate
app/admin/users/page.tsx + UserRow.tsx           → saldo/ruolo/blocco utenti
app/admin/deposits/page.tsx + DepositRow.tsx     → conferma/rifiuta depositi
app/admin/withdrawals/page.tsx + WithdrawalRow.tsx → approva/rifiuta prelievi
app/api/admin/users/[id]/route.ts
app/api/admin/deposits/[id]/route.ts
app/api/admin/withdrawals/[id]/route.ts
```

## Come funziona il referral

1. Ogni profilo ha un `ref_code` generato automaticamente alla creazione
   (8 caratteri casuali, colonna `unique`).
2. `/referral` mostra il link `https://tuosito.com/register?ref=CODICE`.
3. `app/register/page.tsx` legge `?ref=` dall'URL e lo passa come
   `ref_code` nei metadati di `supabase.auth.signUp()`.
4. Il trigger `handle_new_user()` (in `schema.sql`), eseguito da Postgres alla
   creazione dell'utente in `auth.users`, cerca il profilo con quel `ref_code`
   e lo salva in `referred_by` sul nuovo profilo.
5. `/referral` interroga `profiles` filtrando `referred_by = auth.uid()` per
   mostrare l'elenco di chi hai invitato.

**Nota**: nello schema esiste già il tipo `referral_bonus` in
`balance_transactions`, ma **non è collegato a nessuna logica automatica** —
in PrintFarm non è mai stato implementato un bonus referral. Se nel tuo
prossimo progetto vuoi dare un bonus a chi invita (o a chi viene invitato),
il punto giusto dove aggiungerlo è dentro `handle_new_user()` in `schema.sql`:
dopo aver inserito il nuovo profilo, se `referred_by` non è null, aggiorna il
saldo di chi ha invitato e inserisci una riga in `balance_transactions` con
`type = 'referral_bonus'`.

## Come funzionano depositi e prelievi

**Deposito** (l'utente dichiara, l'admin verifica):
1. L'utente invia fondi a un indirizzo esterno (mostrato in `/deposits`,
   gestito dalla tabella `deposit_address`).
2. L'utente compila `DepositForm` con l'hash della transazione e l'importo
   dichiarato → `POST /api/deposits` → riga in `deposits` con `status='pending'`.
3. Un admin, da `/admin/deposits`, conferma con un importo da accreditare
   (può differire da quello dichiarato) o rifiuta.
4. La conferma passa dalla funzione Postgres `admin_confirm_deposit`, che
   aggiorna lo stato, accredita il saldo e registra il movimento — tutto in
   un'unica transazione atomica lato database (non lato Next.js), così il
   saldo non può mai disallinearsi dal log dei movimenti.

**Prelievo** (il saldo si blocca subito, l'admin approva o rimborsa):
1. L'utente richiede un prelievo (`WithdrawalForm`) → `POST /api/withdrawals`
   → chiama la funzione Postgres `request_withdrawal`, che verifica saldo e
   blocco account, **scala subito il saldo** e crea la riga `withdrawals`
   con `status='pending'`.
2. Un admin, da `/admin/withdrawals`, approva (opzionalmente con un TXID di
   invio) o rifiuta.
3. Se rifiuta, `admin_reject_withdrawal` **restituisce automaticamente il
   saldo** all'utente e registra un movimento `withdrawal_refund`.

Tutta la logica sensibile (chi può fare cosa, calcoli di saldo) vive nelle
funzioni Postgres (`security definer`) e nelle policy RLS, non nel codice
Next.js — così anche se un domani aggiungi altri modi di chiamare queste
azioni (un'app mobile, un pannello diverso), le regole restano garantite a
livello di database.

## Cosa NON è incluso (specifico di PrintFarm, rimosso)

- Tabelle `printer_types`, `user_printers`, `print_jobs`, `projects`,
  `gifted_projects`.
- Assegnazione di una risorsa gratuita al nuovo utente (nel gioco originale:
  una stampante base) — rimossa da `handle_new_user()`.
- Sistema di ticket di assistenza (`support_tickets`, `ticket_messages`).
- Banner homepage (`banners`).

Se un progetto futuro ha bisogno di uno di questi, vanno riprogettati da
zero per quel progetto specifico — non fanno parte del nucleo riutilizzabile.

## Modulo aggiuntivo: pannelli solari (sql/002_panels.sql)

Aggiunge un sistema di prodotti acquistabili ("pannelli") che generano un
ricavo giornaliero accreditato sul saldo dell'utente.

**Dopo aver eseguito `sql/schema.sql`, esegui anche `sql/002_panels.sql`**
nell'SQL Editor di Supabase.

- `app/admin/panels/page.tsx` → tab admin per creare/modificare/attivare
  o disattivare/eliminare i tipi di pannello (nome, prezzo, resa giornaliera
  in percentuale o importo fisso, durata in giorni o nessuna scadenza).
- `app/panels/page.tsx` → pagina utente con i pannelli acquistabili e i
  pannelli già posseduti (ricavo stimato, totale guadagnato, scadenza).
- `app/api/panels/route.ts` → acquisto, tramite la funzione Postgres
  `buy_panel` (scala il saldo, crea il pannello, atomico lato database).
- La funzione Postgres `accrue_panel_earnings()` calcola e accredita i
  ricavi maturati su tutti i pannelli attivi. **Non viene chiamata da sola**:
  va eseguita una volta al giorno con uno di questi due metodi.

**Metodo A — endpoint + cron esterno (funziona su qualsiasi piano Supabase):**

1. Su Vercel (o dove ospiti il sito) imposta le variabili d'ambiente:
   - `SUPABASE_SERVICE_ROLE_KEY` (da Supabase → Project Settings → API;
     non è la anon key, va tenuta segreta, mai esposta al client)
   - `CRON_SECRET` (una stringa a caso generata da te)
2. Configura un cron (Vercel Cron, cron-job.org, GitHub Actions...) che
   chiami ogni giorno:
   ```
   POST https://tuosito.com/api/cron/accrue-panels
   Authorization: Bearer IL_TUO_CRON_SECRET
   ```

**Metodo B — pg_cron dentro Supabase (se l'estensione è disponibile sul tuo piano):**

```sql
select cron.schedule('accrue-panel-earnings-daily', '0 0 * * *', $$select public.accrue_panel_earnings();$$);
```

In entrambi i casi la funzione è idempotente entro la stessa giornata:
calcola i giorni interi passati dall'ultimo accredito, quindi chiamarla più
volte non paga due volte lo stesso giorno.
