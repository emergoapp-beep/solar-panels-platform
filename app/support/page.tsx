import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewTicketForm from '@/components/support/NewTicketForm'
import TicketStatusBadge from '@/components/support/TicketStatusBadge'
import { TicketIcon } from '@/components/icons/Icons'

export default async function SupportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">Assistenza</h1>
            <p className="text-white/60">Scrivici per qualsiasi domanda o problema</p>
          </div>
        </div>

        <NewTicketForm />

        {error && (
          <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-2xl">Errore: {error.message}</p>
        )}

        <div className="glass rounded-3xl overflow-hidden divide-y divide-white/10">
          {tickets?.map((ticket) => (
            <a
              key={ticket.id}
              href={`/support/${ticket.id}`}
              className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{ticket.subject}</p>
                <p className="text-white/45 text-xs mt-0.5">
                  {new Date(ticket.updated_at).toLocaleString('it-IT')}
                </p>
              </div>
              <TicketStatusBadge status={ticket.status} />
            </a>
          ))}

          {(!tickets || tickets.length === 0) && !error && (
            <div className="flex flex-col items-center text-center py-12">
              <div className="w-14 h-14 rounded-3xl input-glass text-white/35 flex items-center justify-center mb-3">
                <TicketIcon className="w-6 h-6" />
              </div>
              <p className="text-white/45 text-sm">Nessun ticket ancora. Apri il tuo primo ticket sopra.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
