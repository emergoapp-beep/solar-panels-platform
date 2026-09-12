import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PanelTypeCard from '@/components/panels/PanelTypeCard'
import UserPanelRow from '@/components/panels/UserPanelRow'

export default async function PanelsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: panelTypes }, { data: userPanels }] = await Promise.all([
    supabase.from('profiles').select('balance').eq('id', user.id).single(),
    supabase.from('panel_types').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('user_panels').select('*').eq('user_id', user.id).order('purchased_at', { ascending: false }),
  ])

  const balance = Number(profile?.balance ?? 0)
  const activePanels = userPanels?.filter((p) => p.status === 'active') ?? []
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
          <a href="/dashboard" className="text-white/60 hover:text-white text-sm shrink-0">
            ← Dashboard
          </a>
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
            <p className="text-white/60 text-sm mb-1">Ricavo stimato al giorno</p>
            <p className="font-display text-2xl text-[var(--energy)]">+{totalDaily.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">Pannelli disponibili</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {panelTypes?.map((panelType) => (
              <PanelTypeCard key={panelType.id} panelType={panelType} balance={balance} />
            ))}
          </div>
          {(!panelTypes || panelTypes.length === 0) && (
            <p className="text-white/45 text-center py-12 glass rounded-2xl">
              Nessun pannello disponibile al momento.
            </p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">I miei pannelli</h2>
          <div className="glass rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/60 text-left">
                  <th className="py-3 px-4 font-medium">Pannello</th>
                  <th className="py-3 px-4 font-medium">Acquistato</th>
                  <th className="py-3 px-4 font-medium">Resa</th>
                  <th className="py-3 px-4 font-medium">Guadagnato</th>
                  <th className="py-3 px-4 font-medium">Scadenza</th>
                  <th className="py-3 px-4 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody>
                {userPanels?.map((userPanel) => (
                  <UserPanelRow key={userPanel.id} userPanel={userPanel} />
                ))}
              </tbody>
            </table>

            {(!userPanels || userPanels.length === 0) && (
              <p className="text-white/45 text-center py-12">Non possiedi ancora nessun pannello.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
