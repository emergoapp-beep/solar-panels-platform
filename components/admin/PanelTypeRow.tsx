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
    return (
      <tr className="border-b border-gray-800 bg-gray-800/40">
        <td className="py-3 px-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
        </td>
        <td className="py-3 px-4">
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-24 bg-gray-800 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-1">
            <select
              value={yieldType}
              onChange={(e) => setYieldType(e.target.value as 'percent' | 'fixed')}
              className="bg-gray-800 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="percent">%/giorno</option>
              <option value="fixed">fisso/giorno</option>
            </select>
            <input
              type="number"
              value={yieldValue}
              onChange={(e) => setYieldValue(e.target.value)}
              className="w-20 bg-gray-800 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </td>
        <td className="py-3 px-4">
          <input
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="∞"
            className="w-20 bg-gray-800 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
        </td>
        <td className="py-3 px-4">—</td>
        <td className="py-3 px-4">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={loading} className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 px-3 py-1 rounded-lg">
                Salva
              </button>
              <button onClick={() => setEditing(false)} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg">
                Annulla
              </button>
            </div>
            {error && <span className="text-red-400 text-xs">{error}</span>}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-gray-800">
      <td className="py-3 px-4">{panelType.name}</td>
      <td className="py-3 px-4">{Number(panelType.price)}</td>
      <td className="py-3 px-4">
        {panelType.daily_yield_type === 'percent'
          ? `${Number(panelType.daily_yield_value)}%/giorno`
          : `${Number(panelType.daily_yield_value)} crediti/giorno`}
      </td>
      <td className="py-3 px-4">{panelType.duration_days ? `${panelType.duration_days} gg` : 'Nessuna scadenza'}</td>
      <td className="py-3 px-4">
        <button
          onClick={() => patch({ isActive: !panelType.is_active })}
          disabled={loading}
          className={`text-xs px-2 py-1 rounded-lg font-medium disabled:opacity-50 ${
            panelType.is_active ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-400'
          }`}
        >
          {panelType.is_active ? 'Attivo' : 'Disattivo'}
        </button>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg">
              Modifica
            </button>
            <button onClick={handleDelete} disabled={loading} className="text-xs bg-red-900/50 hover:bg-red-900 text-red-300 disabled:opacity-50 px-3 py-1 rounded-lg">
              Elimina
            </button>
          </div>
          {error && <span className="text-red-400 text-xs">{error}</span>}
        </div>
      </td>
    </tr>
  )
}
