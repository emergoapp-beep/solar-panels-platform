import { createClient } from '@/lib/supabase/server'
import { UsersIcon, CoinIcon, WithdrawIcon, ShieldIcon } from '@/components/icons/Icons'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [{ count: usersCount }, { data: deposits }, { data: withdrawals }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('deposits').select('status, amount_credited'),
    supabase.from('withdrawals').select('status, amount'),
  ])

  const pendingDeposits = deposits?.filter((d) => d.status === 'pending').length ?? 0
  const pendingWithdrawals = withdrawals?.filter((w) => w.status === 'pending').length ?? 0
  const totalDeposited = deposits
    ?.filter((d) => d.status === 'confirmed')
    .reduce((sum, d) => sum + Number(d.amount_credited ?? 0), 0) ?? 0
  const totalWithdrawn = withdrawals
    ?.filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + Number(w.amount ?? 0), 0) ?? 0

  const stats = [
    { label: 'Utenti registrati', value: usersCount ?? 0, icon: UsersIcon, accent: 'bg-[var(--sun)]/15 text-[var(--sun)]' },
    { label: 'Depositi in attesa', value: pendingDeposits, icon: ShieldIcon, accent: 'bg-white/10 text-white/80' },
    { label: 'Prelievi in attesa', value: pendingWithdrawals, icon: WithdrawIcon, accent: 'bg-white/10 text-white/80' },
    { label: 'Totale depositato', value: `${totalDeposited} crediti`, icon: CoinIcon, accent: 'bg-[var(--energy)]/15 text-[var(--energy)]' },
    { label: 'Totale prelevato', value: `${totalWithdrawn} crediti`, icon: CoinIcon, accent: 'bg-[var(--energy)]/15 text-[var(--energy)]' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="glass rounded-2xl p-6 hover-lift flex items-center gap-4">
            <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${stat.accent}`}>
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="font-display text-xl">{stat.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
