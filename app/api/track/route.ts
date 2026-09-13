import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Endpoint interno chiamato dal middleware ad ogni pagina caricata.
// Usa la service role key perché scrive anche per i visitatori anonimi
// (non loggati), che non potrebbero altrimenti passare la RLS.
export async function POST(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Tracciamento non configurato: non blocchiamo comunque la navigazione.
    return NextResponse.json({ skipped: true })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.path !== 'string') {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  await supabase.from('page_views').insert({
    user_id: typeof body.userId === 'string' ? body.userId : null,
    path: body.path,
    ip_address: typeof body.ip === 'string' ? body.ip : null,
    user_agent: typeof body.userAgent === 'string' ? body.userAgent : null,
  })

  return NextResponse.json({ success: true })
}
