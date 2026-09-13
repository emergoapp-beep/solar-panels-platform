'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UserOption = {
  id: string
  email: string | null
}

export default function ComposeMessageForm({ users }: { users: UserOption[] }) {
  const router = useRouter()
  const [mode, setMode] = useState<'single' | 'broadcast'>('single')
  const [userId, setUserId] = useState(users[0]?.id ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!subject.trim() || !body.trim()) {
      setError('Compila oggetto e messaggio')
      return
    }
    if (mode === 'single' && !userId) {
      setError('Seleziona un destinatario')
      return
    }

    setLoading(true)

    const res = await fetch('/api/admin/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        userId: mode === 'single' ? userId : undefined,
        subject: subject.trim(),
        body: body.trim(),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Errore sconosciuto')
      return
    }

    setSubject('')
    setBody('')

    if (mode === 'broadcast') {
      setSuccess(`Messaggio inviato a ${data.recipients} iscritti.`)
    } else {
      router.push(`/admin/tickets/${data.ticket.id}`)
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-4">
      <h2 className="text-lg font-bold">Nuovo messaggio</h2>

      {error && <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-2xl">{error}</p>}
      {success && (
        <p className="bg-[var(--energy)]/15 text-[var(--energy)] text-sm p-3 rounded-2xl">{success}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`flex-1 text-sm rounded-2xl px-4 py-2.5 font-medium transition-colors ${
            mode === 'single' ? 'btn-primary' : 'input-glass text-white/70'
          }`}
        >
          A un singolo utente
        </button>
        <button
          type="button"
          onClick={() => setMode('broadcast')}
          className={`flex-1 text-sm rounded-2xl px-4 py-2.5 font-medium transition-colors ${
            mode === 'broadcast' ? 'btn-primary' : 'input-glass text-white/70'
          }`}
        >
          A tutti gli iscritti
        </button>
      </div>

      {mode === 'single' && (
        <div>
          <label className="block text-sm text-white/60 mb-1">Destinatario</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full input-glass rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id} className="bg-[#0a2536] text-white">
                {u.email ?? u.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'broadcast' && (
        <p className="text-white/45 text-xs bg-white/5 rounded-2xl p-3">
          Il messaggio verrà inviato come ticket separato a ciascuno dei {users.length} iscritti.
        </p>
      )}

      <div>
        <label className="block text-sm text-white/60 mb-1">Oggetto</label>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Es. Manutenzione programmata"
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
          placeholder="Scrivi il messaggio..."
          className="w-full input-glass rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 py-3 rounded-full font-medium"
      >
        {loading ? 'Invio...' : mode === 'broadcast' ? 'Invia a tutti' : 'Invia messaggio'}
      </button>
    </form>
  )
}
