import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoinIcon, LinkIcon, ShieldIcon } from '@/components/icons/Icons'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-1 animate-fade-in-up">Dashboard</h1>
        <p className="text-gray-400 mb-8 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          Bentornato, {profile?.email}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-6 hover-lift">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <CoinIcon className="w-4 h-4" />
              <p>Saldo</p>
            </div>
            <p className="text-2xl font-bold">{Number(profile?.balance ?? 0)} crediti</p>
          </div>
          <a href="/referral" className="bg-gray-900 rounded-xl p-6 hover-lift block">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <LinkIcon className="w-4 h-4" />
              <p>Codice Referral</p>
            </div>
            <p className="text-2xl font-bold">{profile?.ref_code}</p>
          </a>
          <div className="bg-gray-900 rounded-xl p-6 hover-lift">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <ShieldIcon className="w-4 h-4" />
              <p>Ruolo</p>
            </div>
            <p className="text-2xl font-bold capitalize">{profile?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <a href="/panels" className="block bg-gray-900 hover:bg-gray-800 rounded-xl p-6 transition-colors hover-lift">
            <h2 className="text-lg font-bold mb-1">Pannelli →</h2>
            <p className="text-gray-400 text-sm">Acquista e monitora i tuoi pannelli</p>
          </a>
          <a href="/deposits" className="block bg-gray-900 hover:bg-gray-800 rounded-xl p-6 transition-colors hover-lift">
            <h2 className="text-lg font-bold mb-1">Deposita →</h2>
            <p className="text-gray-400 text-sm">Ricarica il saldo</p>
          </a>
          <a href="/withdrawals" className="block bg-gray-900 hover:bg-gray-800 rounded-xl p-6 transition-colors hover-lift">
            <h2 className="text-lg font-bold mb-1">Preleva →</h2>
            <p className="text-gray-400 text-sm">Richiedi un prelievo</p>
          </a>
          <a href="/referral" className="block bg-gray-900 hover:bg-gray-800 rounded-xl p-6 transition-colors hover-lift">
            <h2 className="text-lg font-bold mb-1">Invita →</h2>
            <p className="text-gray-400 text-sm">Condividi il tuo link referral</p>
          </a>
        </div>
      </div>
    </main>
  )
}
