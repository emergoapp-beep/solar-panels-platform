import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DepositForm from '@/components/deposits/DepositForm'
import StatusBadge from '@/components/deposits/DepositStatusBadge'
import CopyAddressButton from '@/components/deposits/CopyAddressButton'

export default async function DepositsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const [{ data: depositAddress }, { data: deposits }] = await Promise.all([
    supabase.from('deposit_address').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('deposits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">Depositi</h1>
            <p className="text-white/60">Ricarica il tuo saldo in USDT (rete TRC20)</p>
          </div>
          <a href="/dashboard" className="text-white/60 hover:text-white text-sm shrink-0">
            ← Dashboard
          </a>
        </div>

        <div className="glass rounded-3xl p-6 space-y-3">
          <p className="text-white/60 text-sm">Invia USDT solo sulla rete TRC20 (Tron) a questo indirizzo:</p>
          {depositAddress ? (
            <CopyAddressButton address={depositAddress.address} />
          ) : (
            <p className="bg-[var(--sun)]/15 text-[var(--sun)] text-sm p-3 rounded-2xl">
              Indirizzo di deposito non ancora configurato. Contatta l&apos;assistenza.
            </p>
          )}
          <p className="text-red-300 text-xs">
            Attenzione: invia esclusivamente USDT sulla rete TRC20. Depositi su reti diverse
            o con altre criptovalute potrebbero andare persi.
          </p>
        </div>

        <DepositForm />

        <div>
          <h2 className="text-lg font-bold mb-3">Storico depositi</h2>
          <div className="glass rounded-3xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/60 text-left">
                  <th className="py-3 px-4 font-medium">Data</th>
                  <th className="py-3 px-4 font-medium">TXID</th>
                  <th className="py-3 px-4 font-medium">Importo dichiarato</th>
                  <th className="py-3 px-4 font-medium">Accreditato</th>
                  <th className="py-3 px-4 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody>
                {deposits?.map((d) => (
                  <tr key={d.id} className="border-b border-white/10">
                    <td className="py-3 px-4 text-white/60">
                      {new Date(d.created_at).toLocaleString('it-IT')}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs break-all">{d.tx_hash}</td>
                    <td className="py-3 px-4">{Number(d.amount_claimed)} USDT</td>
                    <td className="py-3 px-4">
                      {d.amount_credited != null ? `${Number(d.amount_credited)} crediti` : '—'}
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!deposits || deposits.length === 0) && (
              <p className="text-white/45 text-center py-12">Nessun deposito ancora segnalato.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
