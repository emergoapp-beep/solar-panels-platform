'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LeafIcon } from '@/components/icons/Icons'
import SolarPanelIllustration from '@/components/icons/SolarPanelIllustration'

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
    <div className="glass cell-texture rounded-3xl p-6 flex flex-col gap-3 hover-lift">
      <SolarPanelIllustration active={false} animated />

      <div className="flex items-center gap-2 relative">
        <h3 className="font-bold text-white">{panelType.name}</h3>
      </div>

      {panelType.description && <p className="text-white/60 text-sm relative">{panelType.description}</p>}

      <div className="text-sm text-white/80 space-y-1 relative">
        <p>
          Prezzo: <span className="font-bold text-white">{Number(panelType.price)} crediti</span>
        </p>
        <p className="flex items-center gap-1.5">
          Ricavo stimato: <LeafIcon className="w-3.5 h-3.5 text-[var(--energy)]" />{' '}
          <span className="font-bold text-[var(--energy)]">+{dailyEstimate.toFixed(2)} crediti/giorno</span>
        </p>
        <p className="text-white/45">
          {panelType.duration_days ? `Attivo per ${panelType.duration_days} giorni` : 'Nessuna scadenza'}
        </p>
      </div>

      {error && <p className="bg-red-900/50 text-red-300 text-xs p-2 rounded-2xl">{error}</p>}

      <button
        onClick={handleBuy}
        disabled={loading || !canAfford}
        className="mt-auto w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed font-medium py-2 rounded-full"
      >
        {loading ? 'Acquisto...' : canAfford ? 'Acquista' : 'Saldo insufficiente'}
      </button>
    </div>
  )
}
