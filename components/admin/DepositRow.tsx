'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Deposit = {
  id: string
  user_id: string
  tx_hash: string
  amount_claimed: number
  amount_credited: number | null
  status: string
  admin_note: string | null
  created_at: string
  profiles: { email: string | null } | null
}

export default function DepositRow({ deposit }: { deposit: Deposit }) {
  const router = useRouter()
  const [creditAmount, setCreditAmount] = useState(String(deposit.amount_claimed))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAction(action: 'confirm' | 'reject') {
    setError('')
    setLoading(true)

    const body: Record<string, unknown> = { action, note: note || undefined }
    if (action === 'confirm') {
      const parsed = Number(creditAmount)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError('Importo da accreditare non valido')
        setLoading(false)
        return
      }
      body.amountCredited = parsed
    }

    const res = await fetch(`/api/admin/deposits/${deposit.id}`, {
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

  const isPending = deposit.status === 'pending'

  return (
    <tr className="border-b border-gray-800">
      <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
        {new Date(deposit.created_at).toLocaleString('it-IT')}
      </td>
      <td className="py-3 px-4">{deposit.profiles?.email ?? '—'}</td>
      <td className="py-3 px-4 font-mono text-xs break-all max-w-[200px]">{deposit.tx_hash}</td>
      <td className="py-3 px-4">{Number(deposit.amount_claimed)} USDT</td>
      <td className="py-3 px-4">
        {deposit.status === 'pending' && (
          <span className="text-xs px-2 py-1 rounded-lg font-medium bg-yellow-900/50 text-yellow-300">
            In verifica
          </span>
        )}
        {deposit.status === 'confirmed' && (
          <span className="text-xs px-2 py-1 rounded-lg font-medium bg-green-900/50 text-green-300">
            Confermato (+{deposit.amount_credited})
          </span>
        )}
        {deposit.status === 'rejected' && (
          <span className="text-xs px-2 py-1 rounded-lg font-medium bg-red-900/50 text-red-300">
            Rifiutato
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        {isPending ? (
          <div className="flex flex-col gap-2 min-w-[220px]">
            <div className="flex gap-2">
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-24 bg-gray-800 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
              <input
                type="text"
                placeholder="Nota (opzionale)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 bg-gray-800 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('confirm')}
                disabled={loading}
                className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 px-3 py-1 rounded-lg"
              >
                Conferma
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="text-xs bg-red-900/50 hover:bg-red-900 text-red-300 disabled:opacity-50 px-3 py-1 rounded-lg"
              >
                Rifiuta
              </button>
            </div>
            {error && <span className="text-red-400 text-xs">{error}</span>}
          </div>
        ) : (
          <span className="text-gray-500 text-xs">{deposit.admin_note ?? '—'}</span>
        )}
      </td>
    </tr>
  )
}
