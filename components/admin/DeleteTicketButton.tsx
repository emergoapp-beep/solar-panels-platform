'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteTicketButton({
  ticketId,
  redirectTo,
}: {
  ticketId: string
  redirectTo?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Eliminare definitivamente questo ticket e tutti i suoi messaggi?')) {
      return
    }

    setLoading(true)

    const res = await fetch(`/api/admin/tickets/${ticketId}`, { method: 'DELETE' })

    if (!res.ok) {
      setLoading(false)
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Errore durante l\'eliminazione')
      return
    }

    if (redirectTo) {
      router.push(redirectTo)
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-400 hover:text-red-300 text-xs font-medium disabled:opacity-50 shrink-0"
    >
      {loading ? '...' : 'Elimina'}
    </button>
  )
}
