'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PanelType = {
  id: string
  name: string
  description: string | null
  price: number
  daily_yield_type: 'percent' | 'fixed'
  daily_yield_value: number
  duration_days: number | null
  is_active: boolean
}

export default function PanelTypeRow({ panelType }: { panelType: PanelType }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(panelType.name)
  const [price, setPrice] = useState(String(panelType.price))
  const [yieldType, setYieldType] = useState(panelType.daily_yield_type)
  const [yieldValue, setYieldValue] = useState(String(panelType.daily_yield_value))
  const [durationDays, setDurationDays] = useState(panelType.duration_days ? String(panelType.duration_days) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function patch(body: Record<string, unknown>) {
    setError('')
    setLoading(true)

    const res = await fetch(`/api/admin/panels/${panelType.id}`, {
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

  async function handleSave() {
    const parsedPrice = Number(price)
    const parsedYieldValue = Number(yieldValue)
    const parsedDuration = durationDays.trim() ? Number(durationDays) : null

    if (!name.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isFinite(parsedYieldValue) || parsedYieldValue <= 0) {
      setError('Valori non validi')
      return
    }

    await patch({
      name: name.trim(),
      price: parsedPrice,
      dailyYieldType: yieldType,
      dailyYieldValue: parsedYieldValue,
      durationDays: parsedDuration,
    })
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`Eliminare "${panelType.name}"? I pannelli già acquistati dagli utenti non vengono toccati.`)) return

    setError('')
    setLoading(true)
    const res = await fetch(`/api/admin/panels/${panelType.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Errore sconosciuto')
      return
    }

    router.refresh()
  }

  if (editing) {
    const nameInput = (
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full input-glass rounded-2xl px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
      />
    )
    const priceInput = (
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-24 input-glass rounded-2xl px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
      />
    )
    const yieldInputs = (
      <div className="flex gap-1">
        <select
          value={yieldType}
          onChange={(e) => setYieldType(e.target.value as 'percent' | 'fixed')}
          className="input-glass rounded-2xl px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
        >
          <option value="percent">%/giorno</option>
          <option value="fixed">fisso/giorno</option>
        </select>
        <input
          type="number"
          value={yieldValue}
          onChange={(e) => setYieldValue(e.target.value)}
          className="w-20 input-glass rounded-2xl px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
        />
      </div>
    )
    const durationInput = (
      <input
        type="number"
        value={durationDays}
        onChange={(e) => setDurationDays(e.target.value)}
        placeholder="∞"
        className="w-20 input-glass rounded-2xl px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
      />
    )
    const saveCancelButtons = (
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={loading} className="text-xs btn-success disabled:opacity-50 px-3 py-1 rounded-2xl">
            Salva
          </button>
          <button onClick={() => setEditing(false)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-2xl">
            Annulla
          </button>
        </div>
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>
    )

    return (
      <>
        {/* Riga tabella (modifica), solo da tablet in su */}
        <tr className="hidden sm:table-row border-b border-white/10 bg-white/5">
          <td className="py-3 px-4">{nameInput}</td>
          <td className="py-3 px-4">{priceInput}</td>
          <td className="py-3 px-4">{yieldInputs}</td>
          <td className="py-3 px-4">{durationInput}</td>
          <td className="py-3 px-4">—</td>
          <td className="py-3 px-4">{saveCancelButtons}</td>
        </tr>

        {/* Card di modifica, solo su mobile */}
        <tr className="table-row sm:hidden border-b border-white/10 bg-white/5">
          <td className="p-4 space-y-3">
            <div>
              <span className="text-white/60 text-xs">Nome</span>
              {nameInput}
            </div>
            <div>
              <span className="text-white/60 text-xs block mb-1">Prezzo</span>
              {priceInput}
            </div>
            <div>
              <span className="text-white/60 text-xs block mb-1">Resa giornaliera</span>
              {yieldInputs}
            </div>
            <div>
              <span className="text-white/60 text-xs block mb-1">Durata (giorni, vuoto = infinita)</span>
              {durationInput}
            </div>
            {saveCancelButtons}
          </td>
        </tr>
      </>
    )
  }

  const statusButton = (
    <button
      onClick={() => patch({ isActive: !panelType.is_active })}
      disabled={loading}
      className={`text-xs px-2 py-1 rounded-full font-medium disabled:opacity-50 ${
        panelType.is_active ? 'bg-[var(--energy)]/15 text-[var(--energy)]' : 'input-glass text-white/60'
      }`}
    >
      {panelType.is_active ? 'Attivo' : 'Disattivo'}
    </button>
  )

  const editDeleteButtons = (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="text-xs input-glass hover:bg-white/15 px-3 py-1 rounded-2xl">
          Modifica
        </button>
        <button onClick={handleDelete} disabled={loading} className="text-xs bg-red-900/50 hover:bg-red-900 text-red-300 disabled:opacity-50 px-3 py-1 rounded-2xl">
          Elimina
        </button>
      </div>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )

  const yieldText =
    panelType.daily_yield_type === 'percent'
      ? `${Number(panelType.daily_yield_value)}%/giorno`
      : `${Number(panelType.daily_yield_value)} crediti/giorno`

  const durationText = panelType.duration_days ? `${panelType.duration_days} gg` : 'Nessuna scadenza'

  return (
    <>
      {/* Riga tabella, solo da tablet in su */}
      <tr className="hidden sm:table-row border-b border-white/10">
        <td className="py-3 px-4">{panelType.name}</td>
        <td className="py-3 px-4">{Number(panelType.price)}</td>
        <td className="py-3 px-4">{yieldText}</td>
        <td className="py-3 px-4">{durationText}</td>
        <td className="py-3 px-4">{statusButton}</td>
        <td className="py-3 px-4">{editDeleteButtons}</td>
      </tr>

      {/* Card impilata verticalmente, solo su mobile */}
      <tr className="table-row sm:hidden border-b border-white/10">
        <td className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{panelType.name}</span>
            {statusButton}
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-white/60">Prezzo</span>
              <span>{Number(panelType.price)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/60">Resa</span>
              <span>{yieldText}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/60">Durata</span>
              <span>{durationText}</span>
            </div>
          </div>
          {editDeleteButtons}
        </td>
      </tr>
    </>
  )
}
