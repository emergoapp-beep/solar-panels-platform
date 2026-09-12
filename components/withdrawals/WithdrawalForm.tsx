'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WithdrawalForm({ balance }: { balance: number }) {
  const router = useRouter()
  const [wallet, setWallet] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const parsedAmount = Number(amount)
    if (!wallet.trim()) {
      setError('Inserisci il tuo indirizzo wallet USDT (TRC20)')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Importo non valido')
      return
    }
    if (parsedAmount > balance) {
      setError('Saldo insufficiente')
      return
    }

    setLoading(true)

    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: wallet.trim(), amount: parsedAmount }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Errore sconosciuto')
      return
    }

    setWallet('')
    setAmount('')
    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-bold">Richiedi un prelievo</h2>
      <p className="text-white/60 text-sm">
        L&apos;importo richiesto verrà sottratto subito dal tuo saldo e la richiesta resterà in
        attesa di autorizzazione. Se la richiesta viene rifiutata, il saldo ti sarà restituito.
      </p>

      {error && (
        <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="bg-[var(--energy)]/15 text-[var(--energy)] text-sm p-3 rounded-lg">
          Richiesta di prelievo inviata. Attendi l&apos;autorizzazione.
        </p>
      )}

      <div>
        <label className="block text-sm text-white/60 mb-1">Il tuo wallet USDT (TRC20)</label>
        <input
          type="text"
          required
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="Es. TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className="w-full input-glass rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50 font-mono text-base sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1">Importo da prelevare (crediti)</label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          max={balance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full input-glass rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
        />
        <p className="text-white/45 text-xs mt-1">Saldo disponibile: {balance} crediti</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 py-3 rounded-lg font-medium"
      >
        {loading ? 'Invio...' : 'Richiedi prelievo'}
      </button>
    </form>
  )
}
