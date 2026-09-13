import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Utenti' },
  { href: '/admin/panels', label: 'Pannelli' },
  { href: '/admin/deposits', label: 'Depositi' },
  { href: '/admin/withdrawals', label: 'Prelievi' },
  { href: '/admin/tickets', label: 'Ticket' },
  { href: '/admin/analytics', label: 'Analitiche' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: tickets } = await supabase.from('tickets').select('id, updated_at')
  const { data: reads } = await supabase
    .from('ticket_reads')
    .select('ticket_id, last_read_at')
    .eq('user_id', user.id)

  const readMap = new Map((reads ?? []).map((r) => [r.ticket_id, r.last_read_at]))
  const unreadCount = (tickets ?? []).filter((ticket) => {
    const lastRead = readMap.get(ticket.id)
    return !lastRead || new Date(lastRead) < new Date(ticket.updated_at)
  }).length

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="font-display text-3xl">Pannello Admin</h1>
            <p className="text-white/60">Gestione della piattaforma</p>
          </div>
          <Link href="/dashboard" className="text-white/60 hover:text-white text-sm shrink-0">
            ← Dashboard
          </Link>
        </div>

        <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto">
          {links.map((link) => (
            <Link key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-t-3xl whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              {link.label}
              {link.href === '/admin/tickets' && unreadCount > 0 && (
                <span className="text-[10px] leading-none bg-[var(--sun)] text-[var(--sun-dark-text)] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>

        {children}
      </div>
    </main>
  )
}
