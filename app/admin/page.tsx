import { createClient } from '@/lib/supabase/server'

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
    { label: 'Utenti registrati', value: usersCount ?? 0 },
    { label: 'Depositi in attesa', value: pendingDeposits },
    { label: 'Prelievi in attesa', value: pendingWithdrawals },
    { label: 'Totale depositato', value: `${totalDeposited} crediti` },
    { label: 'Totale prelevato', value: `${totalWithdrawn} crediti` },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="glass rounded-xl p-6 hover-lift">
          <p className="text-white/60 text-sm mb-1">{stat.label}</p>
          <p className="text-2xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
