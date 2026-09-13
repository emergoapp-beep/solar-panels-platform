'use client'

import { useState } from 'react'

type Row = {
  id: string
  path: string
  ip_address: string | null
  created_at: string
  profiles: { email: string | null } | null
}

// La localizzazione NON viene mai salvata: viene calcolata al momento del
// click, chiamando un servizio esterno (ipapi.co) dal browser dell'admin.
export default function AnalyticsRow({ row }: { row: Row }) {
  const [location, setLocation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLocate() {
    if (!row.ip_address) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`https://ipapi.co/${row.ip_address}/json/`)
      const data = await res.json()

      if (data.error) {
        setError('Non trovata')
      } else {
        const parts = [data.city, data.region, data.country_name].filter(Boolean)
        setLocation(parts.length ? parts.join(', ') : 'Sconosciuta')
      }
    } catch {
      setError('Errore nella ricerca')
    }

    setLoading(false)
  }

  return (
    <tr className="border-b border-white/10">
      <td className="py-3 px-4 text-white/60 whitespace-nowrap">
        {new Date(row.created_at).toLocaleString('it-IT')}
      </td>
      <td className="py-3 px-4 font-mono text-xs">{row.path}</td>
      <td className="py-3 px-4">
        {row.profiles?.email ?? <span className="text-white/45">Anonimo</span>}
      </td>
      <td className="py-3 px-4 text-white/60 whitespace-nowrap">{row.ip_address ?? '—'}</td>
      <td className="py-3 px-4 whitespace-nowrap">
        {location ? (
          <span className="text-[var(--energy)]">{location}</span>
        ) : error ? (
          <span className="text-red-300 text-xs">{error}</span>
        ) : row.ip_address ? (
          <button
            onClick={handleLocate}
            disabled={loading}
            className="text-[var(--sun)] hover:underline text-xs disabled:opacity-50"
          >
            {loading ? 'Ricerca...' : 'Localizza'}
          </button>
        ) : (
          '—'
        )}
      </td>
    </tr>
  )
}
