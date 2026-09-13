'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Message = {
  id: string
  sender_id: string
  sender_role: 'user' | 'admin'
  body: string
  created_at: string
}

export default function TicketThread({
  ticketId,
  messages,
  status,
  currentUserId,
  isAdminView,
}: {
  ticketId: string
  messages: Message[]
  status: string
  currentUserId: string
  isAdminView: boolean
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isClosed = status === 'closed'

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!body.trim()) return

    setLoading(true)

    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim() }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Errore sconosciuto')
      return
    }

    setBody('')
    router.refresh()
  }

  async function handleClose() {
    setError('')
    setLoading(true)

    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close' }),
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
    <div className="space-y-4">
      <div className="glass rounded-3xl p-6 space-y-4">
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId
          const isFromAdmin = message.sender_role === 'admin'
          return (
            <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-3xl px-4 py-3 text-sm ${
                  isFromAdmin ? 'btn-primary' : 'input-glass'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p className={`text-[11px] mt-1.5 ${isFromAdmin ? 'opacity-70' : 'text-white/45'}`}>
                  {isFromAdmin ? 'Admin' : 'Utente'} ·{' '}
                  {new Date(message.created_at).toLocaleString('it-IT')}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {error && <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-2xl">{error}</p>}

      {isClosed ? (
        <p className="text-white/45 text-sm text-center py-2">Questo ticket è chiuso.</p>
      ) : (
        <form onSubmit={handleReply} className="glass rounded-3xl p-4 space-y-3">
          <textarea
            required
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Scrivi una risposta..."
            className="w-full input-glass rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50 resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-xs text-white/45 hover:text-white disabled:opacity-50"
            >
              Chiudi ticket
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 px-5 py-2 rounded-full font-medium text-sm"
            >
              {loading ? 'Invio...' : isAdminView ? 'Rispondi' : 'Invia'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
