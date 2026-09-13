'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Withdrawal = {
  id: string
  user_id: string
  wallet_address: string
  amount: number
  status: string
  tx_hash: string | null
  admin_note: string | null
  created_at: string
  profiles: { email: string | null } | null
}

export default function WithdrawalRow({ withdrawal }: { withdrawal: Withdrawal }) {
  const router = useRouter()
  const [txHash, setTxHash] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAction(action: 'approve' | 'reject') {
    setError('')
    setLoading(true)

    const body: Record<string, unknown> = { action, note: note || undefined }
    if (action === 'approve') {
      body.txHash = txHash || undefined
    }

    const res = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Errore sconosciuto')
      return
    }

    router.refresh()
  }

  const isPending = withdrawal.status === 'pending'

  const statusBadge = (
    <>
      {withdrawal.status === 'pending' && (
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-[var(--sun)]/15 text-[var(--sun)]">
          In attesa
        </span>
      )}
      {withdrawal.status === 'approved' && (
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-[var(--energy)]/15 text-[var(--energy)]">
          Approvato
        </span>
      )}
      {withdrawal.status === 'rejected' && (
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-900/50 text-red-300">
          Rifiutato (rimborsato)
        </span>
      )}
    </>
  )

  const actionForm = isPending ? (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="TXID invio (opzionale)"
        value={txHash}
        onChange={(e) => setTxHash(e.target.value)}
        className="input-glass rounded-2xl px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--sun)]/50 font-mono"
      />
      <input
        type="text"
        placeholder="Nota (opzionale)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="input-glass rounded-2xl px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
      />
      <div className="flex gap-2">
        <button
          onClick={() => handleAction('approve')}
          disabled={loading}
          className="text-xs btn-success disabled:opacity-50 px-3 py-1 rounded-2xl"
        >
          Approva
        </button>
        <button
          onClick={() => handleAction('reject')}
          disabled={loading}
          className="text-xs bg-red-900/50 hover:bg-red-900 text-red-300 disabled:opacity-50 px-3 py-1 rounded-2xl"
        >
          Rifiuta (rimborsa)
        </button>
      </div>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  ) : (
    <span className="text-white/45 text-xs">
      {withdrawal.tx_hash ? `TXID: ${withdrawal.tx_hash}` : withdrawal.admin_note ?? '—'}
    </span>
  )

  return (
    <>
      {/* Riga tabella, solo da tablet in su */}
      <tr className="hidden sm:table-row border-b border-white/10">
        <td className="py-3 px-4 text-white/60 whitespace-nowrap">
          {new Date(withdrawal.created_at).toLocaleString('it-IT')}
        </td>
        <td className="py-3 px-4">{withdrawal.profiles?.email ?? '—'}</td>
        <td className="py-3 px-4 font-mono text-xs break-all max-w-[200px]">{withdrawal.wallet_address}</td>
        <td className="py-3 px-4">{Number(withdrawal.amount)} crediti</td>
        <td className="py-3 px-4">{statusBadge}</td>
        <td className="py-3 px-4">
          <div className="min-w-[240px]">{actionForm}</div>
        </td>
      </tr>

      {/* Card impilata verticalmente, solo su mobile */}
      <tr className="table-row sm:hidden border-b border-white/10">
        <td className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-medium">{withdrawal.profiles?.email ?? '—'}</div>
              <div className="text-white/45 text-xs">
                {new Date(withdrawal.created_at).toLocaleString('it-IT')}
              </div>
            </div>
            {statusBadge}
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-white/60">Importo</span>
            <span>{Number(withdrawal.amount)} crediti</span>
          </div>
          <div>
            <span className="text-white/60 text-xs">Wallet</span>
            <p className="font-mono text-xs break-all">{withdrawal.wallet_address}</p>
          </div>
          {actionForm}
        </td>
      </tr>
    </>
  )
}
