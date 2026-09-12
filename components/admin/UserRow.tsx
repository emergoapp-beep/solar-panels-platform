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
    <tr className="border-b border-gray-800">
      <td className="py-3 px-4">
        <div className="font-medium">{profile.email ?? '—'}</div>
        <div className="text-gray-500 text-xs">{profile.ref_code}</div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-24 bg-gray-800 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={handleSaveBalance}
            disabled={saving}
            className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-2 py-1 rounded-lg"
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
          className="bg-gray-800 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </td>
      <td className="py-3 px-4">
        <button
          onClick={handleToggleBlock}
          disabled={saving}
          className={`text-xs px-3 py-1 rounded-lg font-medium disabled:opacity-50 ${
            profile.is_blocked
              ? 'bg-red-900/50 text-red-300 hover:bg-red-900'
              : 'bg-green-900/50 text-green-300 hover:bg-green-900'
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
