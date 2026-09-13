import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PanelCard from '@/components/panels/PanelCard'
import { LeafIcon } from '@/components/icons/Icons'

export default async function OwnedPanelsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: userPanels } = await supabase
    .from('user_panels')
    .select('*')
    .eq('user_id', user.id)
    .order('purchased_at', { ascending: false })

  const activePanels = userPanels?.filter((p) => p.status === 'active') ?? []
  const totalDaily = activePanels.reduce((sum, p) => {
    const daily = p.daily_yield_type === 'percent' ? (Number(p.purchase_price) * Number(p.daily_yield_value)) / 100 : Number(p.daily_yield_value)
    return sum + daily
  }, 0)
  const totalEarned = userPanels?.reduce((sum, p) => sum + Number(p.total_earned), 0) ?? 0

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">I miei pannelli</h1>
            <p className="text-white/60">I pannelli che hai acquistato e il loro stato</p>
          </div>
          <a href="/panels" className="text-white/60 hover:text-white text-sm shrink-0">
            Vai al market →
          </a>
        </div>

        <p className="text-white/45 text-xs -mt-4">
          Il &quot;prossimo accredito&quot; è una stima (24h dopo l&apos;ultimo accredito): l&apos;orario esatto dipende da quando gira il cron giornaliero.
        </p>

        <div className="glass glow-corner rounded-3xl p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1">Pannelli attivi</p>
            <p className="font-display text-2xl">{activePanels.length}</p>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-4">
            <p className="text-white/60 text-sm mb-1 flex items-center gap-1.5">Ricavo stimato al giorno <LeafIcon className="w-3.5 h-3.5 text-[var(--energy)]" /></p>
            <p className="font-display text-2xl text-[var(--energy)]">+{totalDaily.toFixed(2)}</p>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-4">
            <p className="text-white/60 text-sm mb-1">Totale guadagnato</p>
            <p className="font-display text-2xl text-[var(--sun)]">{totalEarned.toFixed(2)}</p>
          </div>
        </div>

        {userPanels && userPanels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {userPanels.map((userPanel) => (
              <PanelCard key={userPanel.id} userPanel={userPanel} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-12 text-center">
            <p className="text-white/45">
              Non possiedi ancora nessun pannello. Vai al{' '}
              <a href="/panels" className="text-[var(--sun)] hover:underline">market</a> per acquistarne uno.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
