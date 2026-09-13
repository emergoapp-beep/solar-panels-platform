import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ count: 0 })
  }

  // La RLS su "tickets" mostra solo i propri ticket a un utente normale,
  // e tutti i ticket a un admin: questa stessa query serve quindi per entrambi.
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, updated_at')

  if (ticketsError || !tickets || tickets.length === 0) {
    return NextResponse.json({ count: 0 })
  }

  const { data: reads } = await supabase
    .from('ticket_reads')
    .select('ticket_id, last_read_at')
    .eq('user_id', user.id)

  const readMap = new Map((reads ?? []).map((r) => [r.ticket_id, r.last_read_at]))

  const count = tickets.filter((ticket) => {
    const lastRead = readMap.get(ticket.id)
    return !lastRead || new Date(lastRead) < new Date(ticket.updated_at)
  }).length

  return NextResponse.json({ count })
}
