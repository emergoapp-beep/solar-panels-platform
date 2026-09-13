import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TicketThread from '@/components/support/TicketThread'
import TicketStatusBadge from '@/components/support/TicketStatusBadge'

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*, profiles!tickets_user_id_fkey(email)')
    .eq('id', id)
    .single()

  if (error || !ticket || !user) {
    notFound()
  }

  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/tickets" className="text-white/60 hover:text-white text-sm">
            ← Ticket
          </Link>
          <h1 className="font-display text-2xl mt-1 truncate">{ticket.subject}</h1>
          <p className="text-white/45 text-sm truncate">{ticket.profiles?.email ?? '—'}</p>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <TicketThread
        ticketId={ticket.id}
        messages={messages ?? []}
        status={ticket.status}
        currentUserId={user.id}
        isAdminView
      />
    </div>
  )
}
