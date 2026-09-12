'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PanelTypeForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [yieldType, setYieldType] = useState<'percent' | 'fixed'>('percent')
  const [yieldValue, setYieldValue] = useState('')
  const [durationDays, setDurationDays] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const parsedPrice = Number(price)
    const parsedYieldValue = Number(yieldValue)
    const parsedDuration = durationDays.trim() ? Number(durationDays) : null

    if (!name.trim()) {
      setError('Inserisci un nome')
      return
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Prezzo non valido')
      return
    }
    if (!Number.isFinite(parsedYieldValue) || parsedYieldValue <= 0) {
      setError('Resa giornaliera non valida')
      return
    }
    if (parsedDuration !== null && (!Number.isInteger(parsedDuration) || parsedDuration <= 0)) {
      setError('Durata non valida (lascia vuoto per nessuna scadenza)')
      return
    }

    setLoading(true)

    const res = await fetch('/api/admin/panels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        dailyYieldType: yieldType,
        dailyYieldValue: parsedYieldValue,
        durationDays: parsedDuration,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Errore sconosciuto')
      return
    }

    setName('')
    setDescription('')
    setPrice('')
    setYieldValue('')
    setDurationDays('')
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2 rounded-lg font-medium"
      >
        + Nuovo tipo di pannello
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Nuovo tipo di pannello</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-sm">
          Annulla
        </button>
      </div>

      {error && <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-lg">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nome</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Pannello Base"
            className="w-full bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Prezzo (crediti)</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tipo di resa giornaliera</label>
          <select
            value={yieldType}
            onChange={(e) => setYieldType(e.target.value as 'percent' | 'fixed')}
            className="w-full bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="percent">Percentuale sul prezzo pagato</option>
            <option value="fixed">Importo fisso al giorno</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Valore resa {yieldType === 'percent' ? '(% al giorno)' : '(crediti al giorno)'}
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={yieldValue}
            onChange={(e) => setYieldValue(e.target.value)}
            className="w-full bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Durata in giorni (vuoto = nessuna scadenza)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="Es. 365"
            className="w-full bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Descrizione (opzionale)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg font-medium"
      >
        {loading ? 'Creazione...' : 'Crea pannello'}
      </button>
    </form>
  )
}
