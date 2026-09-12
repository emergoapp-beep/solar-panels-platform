import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WithdrawalForm from '@/components/withdrawals/WithdrawalForm'
import StatusBadge from '@/components/deposits/DepositStatusBadge'

export default async function WithdrawalsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: withdrawals }] = await Promise.all([
    supabase.from('profiles').select('balance').eq('id', user.id).single(),
    supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const balance = Number(profile?.balance ?? 0)

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">Prelievi</h1>
            <p className="text-white/60">Preleva il tuo saldo in USDT (rete TRC20)</p>
          </div>
          <a href="/dashboard" className="text-white/60 hover:text-white text-sm shrink-0">
            ← Dashboard
          </a>
        </div>

        <WithdrawalForm balance={balance} />

        <div>
          <h2 className="text-lg font-bold mb-3">Storico prelievi</h2>
          <div className="glass rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/60 text-left">
                  <th className="py-3 px-4 font-medium">Data</th>
                  <th className="py-3 px-4 font-medium">Wallet</th>
                  <th className="py-3 px-4 font-medium">Importo</th>
                  <th className="py-3 px-4 font-medium">TXID invio</th>
                  <th className="py-3 px-4 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals?.map((w) => (
                  <tr key={w.id} className="border-b border-white/10">
                    <td className="py-3 px-4 text-white/60">
                      {new Date(w.created_at).toLocaleString('it-IT')}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs break-all">{w.wallet_address}</td>
                    <td className="py-3 px-4">{Number(w.amount)} crediti</td>
                    <td className="py-3 px-4 font-mono text-xs break-all">{w.tx_hash ?? '—'}</td>
                    <td className="py-3 px-4"><StatusBadge status={w.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!withdrawals || withdrawals.length === 0) && (
              <p className="text-white/45 text-center py-12">Nessun prelievo ancora richiesto.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
