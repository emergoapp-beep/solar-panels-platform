import { ComponentProps } from 'react'
import { createClient } from '@/lib/supabase/server'
import WithdrawalRow from '@/components/admin/WithdrawalRow'

type WithdrawalData = ComponentProps<typeof WithdrawalRow>['withdrawal']

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient()

  const { data: withdrawals, error } = await supabase
    .from('withdrawals')
    .select('*, profiles(email)')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })

  const pendingCount = withdrawals?.filter((w) => w.status === 'pending').length ?? 0

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        Prelievi {pendingCount > 0 && <span className="text-[var(--sun)] text-sm font-normal">({pendingCount} in attesa)</span>}
      </h2>

      {error && (
        <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-lg mb-4">
          Errore: {error.message}
        </p>
      )}

      <div className="glass rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/60 text-left">
              <th className="py-3 px-4 font-medium">Data</th>
              <th className="py-3 px-4 font-medium">Utente</th>
              <th className="py-3 px-4 font-medium">Wallet</th>
              <th className="py-3 px-4 font-medium">Importo</th>
              <th className="py-3 px-4 font-medium">Stato</th>
              <th className="py-3 px-4 font-medium">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals?.map((withdrawal) => (
              <WithdrawalRow key={withdrawal.id} withdrawal={withdrawal as WithdrawalData} />
            ))}
          </tbody>
        </table>

        {(!withdrawals || withdrawals.length === 0) && !error && (
          <p className="text-white/45 text-center py-12">Nessun prelievo richiesto.</p>
        )}
      </div>
    </div>
  )
}
