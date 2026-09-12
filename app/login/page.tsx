'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoMarkIcon } from '@/components/icons/Icons'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError('Email o password non corretti')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center text-white p-6">
      <form onSubmit={handleSubmit} className="glass glow-corner p-8 rounded-3xl w-full max-w-sm space-y-4 animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl btn-primary flex items-center justify-center mb-1">
          <LogoMarkIcon className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Accedi</h1>

        {error && (
          <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-xl">{error}</p>
        )}

        <div>
          <label className="block text-sm text-white/60 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full input-glass rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full input-glass rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 py-3 rounded-full font-medium"
        >
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </form>
    </main>
  )
}