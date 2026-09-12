import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Endpoint pensato per essere chiamato una volta al giorno da un cron esterno
// (es. Vercel Cron, cron-job.org, GitHub Actions). Protetto da un secret
// condiviso, NON dalla sessione utente: usa la service role key, che bypassa
// la RLS, esattamente come farebbe pg_cron dentro il database.
//
// Configurazione:
// 1. In Supabase: Project Settings → API → copia la "service_role" key
//    (NON la anon key) e mettila in una variabile d'ambiente
//    SUPABASE_SERVICE_ROLE_KEY (solo lato server, mai esposta al client).
// 2. Genera un secret a caso e mettilo in CRON_SECRET.
// 3. Configura il tuo cron per chiamare ogni giorno:
//      POST https://tuosito.com/api/cron/accrue-panels
//      Header: Authorization: Bearer IL_TUO_CRON_SECRET
//
// In alternativa, se il tuo progetto Supabase ha l'estensione pg_cron
// disponibile, puoi schedulare direttamente la funzione nel database invece
// di usare questo endpoint (vedi README).

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' }, { status: 500 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase.rpc('accrue_panel_earnings')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, panelsUpdated: data })
}
