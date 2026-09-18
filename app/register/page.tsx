'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoMarkIcon } from '@/components/icons/Icons'
import HowItWorks from '@/components/HowItWorks'

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [refCode, setRefCode] = useState(() => searchParams.get('ref') ?? '')
  const [refFromLink, setRefFromLink] = useState(() => Boolean(searchParams.get('ref')))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone,
          ref_code: refCode || null,
        },
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    router.push('/login')
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
          <h1 className="text-2xl font-bold mb-2">Registrati</h1>

          {error && (
            <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-2xl">{error}</p>
          )}

          {refFromLink && refCode && (
            <p className="bg-[var(--sun)]/12 text-[var(--sun)] text-sm p-3 rounded-2xl">
              Sei stato invitato con il codice <span className="font-mono">{refCode}</span>
            </p>
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
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-glass rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Telefono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full input-glass rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Codice Referral (opzionale)</label>
            <input
              type="text"
              value={refCode}
              onChange={(e) => {
                setRefCode(e.target.value)
                setRefFromLink(false)
              }}
              className="w-full input-glass rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--sun)]/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 py-3 rounded-full font-medium"
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
        </form>
      </div>
    </main>
  )
}
