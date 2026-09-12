'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SunIcon } from '@/components/icons/Icons'

type PanelType = {
  id: string
  name: string
  description: string | null
  price: number
  daily_yield_type: 'percent' | 'fixed'
  daily_yield_value: number
  duration_days: number | null
}

export default function PanelTypeCard({ panelType, balance }: { panelType: PanelType; balance: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dailyEstimate =
    panelType.daily_yield_type === 'percent'
      ? (Number(panelType.price) * Number(panelType.daily_yield_value)) / 100
      : Number(panelType.daily_yield_value)

  const canAfford = balance >= Number(panelType.price)

  async function handleBuy() {
    setError('')
    if (!confirm(`Acquistare "${panelType.name}" per ${panelType.price} crediti?`)) return

    setLoading(true)
    const res = await fetch('/api/panels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panelTypeId: panelType.id }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Errore sconosciuto')
      return
    }

    router.refresh()
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-3 hover-lift">
      <div className="flex items-center gap-2 text-yellow-400">
        <SunIcon className="w-5 h-5" />
        <h3 className="font-bold text-white">{panelType.name}</h3>
      </div>

      {panelType.description && <p className="text-gray-400 text-sm">{panelType.description}</p>}

      <div className="text-sm text-gray-300 space-y-1">
        <p>
          Prezzo: <span className="font-bold text-white">{Number(panelType.price)} crediti</span>
        </p>
        <p>
          Ricavo stimato: <span className="font-bold text-green-400">+{dailyEstimate.toFixed(2)} crediti/giorno</span>
        </p>
        <p className="text-gray-500">
          {panelType.duration_days ? `Attivo per ${panelType.duration_days} giorni` : 'Nessuna scadenza'}
        </p>
      </div>

      {error && <p className="bg-red-900/50 text-red-300 text-xs p-2 rounded-lg">{error}</p>}

      <button
        onClick={handleBuy}
        disabled={loading || !canAfford}
        className="mt-auto w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-medium py-2 rounded-lg"
      >
        {loading ? 'Acquisto...' : canAfford ? 'Acquista' : 'Saldo insufficiente'}
      </button>
    </div>
  )
}
