'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoMarkIcon } from '@/components/icons/Icons'
import HowItWorks from '@/components/HowItWorks'

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
    <main className="min-h-screen text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="order-2 lg:order-1">
          <HowItWorks />
        </div>

        <form onSubmit={handleSubmit} className="order-1 lg:order-2 glass glow-corner p-8 rounded-3xl w-full max-w-sm mx-auto space-y-4 animate-fade-in-up">
          <div className="w-12 h-12 rounded-3xl btn-primary flex items-center justify-center mb-1">
            <LogoMarkIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Accedi</h1>

          {error && (
            <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-2xl">{error}</p>
          )}

          <div>
            <label className="block text-sm text-white/60 mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-glass rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-glass rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
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
      </div>
    </main>
  )
}