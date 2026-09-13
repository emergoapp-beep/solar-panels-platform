import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Utenti' },
  { href: '/admin/panels', label: 'Pannelli' },
  { href: '/admin/deposits', label: 'Depositi' },
  { href: '/admin/withdrawals', label: 'Prelievi' },
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
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-t-2xl whitespace-nowrap shrink-0"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {children}
      </div>
    </main>
  )
}
