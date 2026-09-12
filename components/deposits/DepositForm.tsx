'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DepositForm() {
  const router = useRouter()
  const [txHash, setTxHash] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const parsedAmount = Number(amount)
    if (!txHash.trim()) {
      setError('Inserisci l\'hash della transazione')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Importo non valido')
      return
    }

    setLoading(true)

    const res = await fetch('/api/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash: txHash.trim(), amount: parsedAmount }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Errore sconosciuto')
      return
    }

    setTxHash('')
    setAmount('')
    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold">Segnala un deposito</h2>
      <p className="text-white/60 text-sm">
        Dopo aver inviato gli USDT (rete TRC20) all&apos;indirizzo sopra, inserisci qui l&apos;hash
        della transazione e l&apos;importo inviato. Il credito verrà accreditato dopo la verifica
        manuale da parte di un amministratore.
      </p>

      {error && (
        <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-xl">{error}</p>
      )}
      {success && (
        <p className="bg-[var(--energy)]/15 text-[var(--energy)] text-sm p-3 rounded-xl">
          Richiesta inviata. Riceverai il credito dopo la verifica.
        </p>
      )}

      <div>
        <label className="block text-sm text-white/60 mb-1">Hash della transazione (TXID)</label>
        <input
          type="text"
          required
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="Es. a1b2c3d4e5f6..."
          className="w-full input-glass rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50 font-mono text-base sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1">Importo inviato (USDT)</label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full input-glass rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 py-3 rounded-full font-medium"
      >
        {loading ? 'Invio...' : 'Segnala deposito'}
      </button>
    </form>
  )
}
