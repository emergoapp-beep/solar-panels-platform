import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { supabase, error: NextResponse.json({ error: 'Non autenticato' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { supabase, error: NextResponse.json({ error: 'Accesso negato' }, { status: 403 }) }
  }

  return { supabase, error: null }
}

export async function GET() {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { data, error } = await supabase
    .from('tickets')
    .select('*, profiles!tickets_user_id_fkey(email)')
    .order('status', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ tickets: data })
}

export async function POST(request: NextRequest) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { mode, userId, subject, body } = await request.json()

  if (typeof subject !== 'string' || !subject.trim()) {
    return NextResponse.json({ error: 'Oggetto mancante' }, { status: 400 })
  }
  if (typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Messaggio mancante' }, { status: 400 })
  }

  if (mode === 'broadcast') {
    const { data, error } = await supabase.rpc('admin_send_broadcast', {
      p_subject: subject.trim(),
      p_body: body.trim(),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, recipients: data })
  }

  if (mode === 'single') {
    if (typeof userId !== 'string' || !userId) {
      return NextResponse.json({ error: 'Destinatario mancante' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('admin_send_message', {
      p_user_id: userId,
      p_subject: subject.trim(),
      p_body: body.trim(),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, ticket: data })
  }

  return NextResponse.json({ error: 'Modalità non valida' }, { status: 400 })
}
