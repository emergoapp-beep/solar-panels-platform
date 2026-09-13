import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ tickets: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { subject, body } = await request.json()

  if (typeof subject !== 'string' || !subject.trim()) {
    return NextResponse.json({ error: 'Oggetto mancante' }, { status: 400 })
  }
  if (typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Messaggio mancante' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('create_support_ticket', {
    p_subject: subject.trim(),
    p_body: body.trim(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, ticket: data })
}
