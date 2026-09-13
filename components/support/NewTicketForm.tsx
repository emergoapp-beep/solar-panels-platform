'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTicketForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!subject.trim() || !body.trim()) {
      setError('Compila oggetto e messaggio')
      return
    }

    setLoading(true)

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Errore sconosciuto')
      return
    }

    setSubject('')
    setBody('')
    setOpen(false)
    router.push(`/support/${data.ticket.id}`)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary px-5 py-2.5 rounded-full font-medium text-sm">
        Nuovo ticket
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Nuovo ticket</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-white/45 hover:text-white text-sm">
          Annulla
        </button>
      </div>

      {error && <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-2xl">{error}</p>}

      <div>
        <label className="block text-sm text-white/60 mb-1">Oggetto</label>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Es. Problema con un deposito"
          className="w-full input-glass rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1">Messaggio</label>
        <textarea
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Descrivi la tua richiesta..."
          className="w-full input-glass rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 py-3 rounded-full font-medium"
      >
        {loading ? 'Invio...' : 'Invia ticket'}
      </button>
    </form>
  )
}
