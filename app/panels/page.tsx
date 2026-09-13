import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PanelTypeCard from '@/components/panels/PanelTypeCard'

import { PanelIcon, LeafIcon } from '@/components/icons/Icons'

export default async function PanelsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: panelTypes }, { data: activePanelsData }] = await Promise.all([
    supabase.from('profiles').select('balance').eq('id', user.id).single(),
    supabase.from('panel_types').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('user_panels').select('purchase_price, daily_yield_type, daily_yield_value').eq('user_id', user.id).eq('status', 'active'),
  ])

  const balance = Number(profile?.balance ?? 0)
  const activePanels = activePanelsData ?? []
  const totalDaily = activePanels.reduce((sum, p) => {
    const daily = p.daily_yield_type === 'percent' ? (Number(p.purchase_price) * Number(p.daily_yield_value)) / 100 : Number(p.daily_yield_value)
    return sum + daily
  }, 0)

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">Pannelli solari</h1>
            <p className="text-white/60">Acquista pannelli e genera un ricavo ogni giorno</p>
          </div>
          <div className="flex items-center gap-4 text-sm shrink-0">
            <a href="/panels/posseduti" className="text-[var(--sun)] hover:underline">
              I miei pannelli →
            </a>
            <a href="/dashboard" className="text-white/60 hover:text-white">
              ← Dashboard
            </a>
          </div>
        </div>

        <div className="glass glow-corner rounded-3xl p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1">Saldo</p>
            <p className="font-display text-2xl text-[var(--sun)]">{balance} crediti</p>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-4">
            <p className="text-white/60 text-sm mb-1">Pannelli attivi</p>
            <p className="font-display text-2xl">{activePanels.length}</p>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-4">
            <p className="text-white/60 text-sm mb-1 flex items-center gap-1.5">Ricavo stimato al giorno <LeafIcon className="w-3.5 h-3.5 text-[var(--energy)]" /></p>
            <p className="font-display text-2xl text-[var(--energy)]">+{totalDaily.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><PanelIcon className="w-4 h-4 text-[var(--sun)]" /> Pannelli disponibili</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {panelTypes?.map((panelType) => (
              <PanelTypeCard key={panelType.id} panelType={panelType} balance={balance} />
            ))}
          </div>
          {(!panelTypes || panelTypes.length === 0) && (
            <p className="text-white/45 text-center py-12 glass rounded-3xl">
              Nessun pannello disponibile al momento.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
