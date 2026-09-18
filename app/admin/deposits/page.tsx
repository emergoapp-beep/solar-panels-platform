import { ComponentProps } from 'react'
import { createClient } from '@/lib/supabase/server'
import DepositRow from '@/components/admin/DepositRow'

type DepositData = ComponentProps<typeof DepositRow>['deposit']

export default async function AdminDepositsPage() {
  const supabase = await createClient()

  const { data: deposits, error } = await supabase
    .from('deposits')
    .select('*, profiles!deposits_user_id_fkey(email)')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })

  const pendingCount = deposits?.filter((d) => d.status === 'pending').length ?? 0

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        Depositi {pendingCount > 0 && <span className="text-[var(--sun)] text-sm font-normal">({pendingCount} in attesa)</span>}
      </h2>

      {error && (
        <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-2xl mb-4">
          Errore: {error.message}
        </p>
      )}

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-white/10 text-white/60 text-left">
              <th className="py-3 px-4 font-medium">Data</th>
              <th className="py-3 px-4 font-medium">Utente</th>
              <th className="py-3 px-4 font-medium">TXID</th>
              <th className="py-3 px-4 font-medium">Importo dichiarato</th>
              <th className="py-3 px-4 font-medium">Stato</th>
              <th className="py-3 px-4 font-medium">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {deposits?.map((deposit) => (
              <DepositRow key={deposit.id} deposit={deposit as DepositData} />
            ))}
          </tbody>
        </table>

        {(!deposits || deposits.length === 0) && !error && (
          <p className="text-white/45 text-center py-12">Nessun deposito segnalato.</p>
        )}
      </div>
    </div>
  )
}
