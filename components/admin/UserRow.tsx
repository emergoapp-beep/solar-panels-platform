'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  email: string | null
  balance: number
  role: string
  is_blocked: boolean
  ref_code: string | null
}

export default function UserRow({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [balance, setBalance] = useState(String(profile.balance))
  const [role, setRole] = useState(profile.role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function saveUpdates(updates: Record<string, unknown>) {
    setSaving(true)
    setError('')

    const res = await fetch(`/api/admin/users/${profile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || 'Errore sconosciuto')
      return
    }

    router.refresh()
  }

  function handleSaveBalance() {
    const parsed = Number(balance)
    if (!Number.isFinite(parsed)) {
      setError('Saldo non valido')
      return
    }
    saveUpdates({ balance: parsed })
  }

  function handleRoleChange(newRole: string) {
    setRole(newRole)
    saveUpdates({ role: newRole })
  }

  function handleToggleBlock() {
    saveUpdates({ is_blocked: !profile.is_blocked })
  }

  return (
    <tr className="border-b border-white/10">
      <td className="py-3 px-4">
        <div className="font-medium">{profile.email ?? '—'}</div>
        <div className="text-white/45 text-xs">{profile.ref_code}</div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-24 input-glass rounded-2xl px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
          />
          <button
            onClick={handleSaveBalance}
            disabled={saving}
            className="text-xs btn-primary disabled:opacity-50 px-2 py-1 rounded-2xl"
          >
            Salva
          </button>
        </div>
      </td>
      <td className="py-3 px-4">
        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={saving}
          className="input-glass rounded-2xl px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </td>
      <td className="py-3 px-4">
        <button
          onClick={handleToggleBlock}
          disabled={saving}
          className={`text-xs px-3 py-1 rounded-full font-medium disabled:opacity-50 ${
            profile.is_blocked
              ? 'bg-red-900/50 text-red-300 hover:bg-red-900'
              : 'bg-[var(--energy)]/15 text-[var(--energy)] hover:bg-[var(--energy)]/25'
          }`}
        >
          {profile.is_blocked ? 'Bloccato' : 'Attivo'}
        </button>
      </td>
      <td className="py-3 px-4 text-right">
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </td>
    </tr>
  )
}
