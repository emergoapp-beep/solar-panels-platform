import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TicketThread from '@/components/support/TicketThread'
import TicketStatusBadge from '@/components/support/TicketStatusBadge'

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !ticket) {
    notFound()
  }

  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <a href="/support" className="text-white/60 hover:text-white text-sm">
              ← Assistenza
            </a>
            <h1 className="font-display text-2xl mt-1 truncate">{ticket.subject}</h1>
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>

        <TicketThread
          ticketId={ticket.id}
          messages={messages ?? []}
          status={ticket.status}
          currentUserId={user.id}
          isAdminView={false}
        />
      </div>
    </main>
  )
}
