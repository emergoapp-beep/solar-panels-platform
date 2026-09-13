import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  // La RLS su "tickets" limita già la lettura al proprietario o all'admin:
  // se non trovato, o non esiste o non si ha accesso.
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*, profiles!tickets_user_id_fkey(email)')
    .eq('id', id)
    .single()

  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Ticket non trovato' }, { status: 404 })
  }

  const { data: messages, error: messagesError } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 400 })
  }

  return NextResponse.json({ ticket, messages })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { body } = await request.json()

  if (typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Messaggio vuoto' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('reply_ticket', {
    p_ticket_id: id,
    p_body: body.trim(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, message: data })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { action } = await request.json()

  if (action !== 'close') {
    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('close_ticket', {
    p_ticket_id: id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, ticket: data })
}
