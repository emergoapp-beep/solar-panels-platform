import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TicketStatusBadge from '@/components/support/TicketStatusBadge'

export default async function AdminTicketsPage() {
  const supabase = await createClient()

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*, profiles!tickets_user_id_fkey(email)')
    .order('status', { ascending: true })
    .order('updated_at', { ascending: false })

  const openCount = tickets?.filter((t) => t.status === 'open').length ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          Ticket {openCount > 0 && <span className="text-[var(--sun)] text-sm font-normal">({openCount} in attesa)</span>}
        </h2>
        <Link href="/admin/tickets/new" className="btn-primary px-5 py-2.5 rounded-full font-medium text-sm shrink-0">
          Nuovo messaggio
        </Link>
      </div>

      {error && (
        <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-2xl">Errore: {error.message}</p>
      )}

      <div className="glass rounded-3xl overflow-hidden divide-y divide-white/10">
        {tickets?.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/admin/tickets/${ticket.id}`}
            className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{ticket.subject}</p>
              <p className="text-white/45 text-xs mt-0.5 truncate">
                {ticket.profiles?.email ?? '—'} · {new Date(ticket.updated_at).toLocaleString('it-IT')}
              </p>
            </div>
            <TicketStatusBadge status={ticket.status} />
          </Link>
        ))}

        {(!tickets || tickets.length === 0) && !error && (
          <p className="text-white/45 text-center py-12">Nessun ticket ancora.</p>
        )}
      </div>
    </div>
  )
}
