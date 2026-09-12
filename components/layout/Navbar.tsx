'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoMarkIcon } from '@/components/icons/Icons'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(pathname)

  // Chiude il menu mobile ogni volta che cambia pagina (aggiornamento durante il render)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    if (menuOpen) setMenuOpen(false)
  }

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? null)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole(profile?.role ?? null)
    })
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/panels', label: 'Pannelli' },
    { href: '/referral', label: 'Referral' },
    { href: '/deposits', label: 'Depositi' },
    { href: '/withdrawals', label: 'Prelievi' },
  ]

  return (
    <nav className="glass mx-3 mt-3 sm:mx-6 sm:mt-4 rounded-2xl px-4 sm:px-6 py-4 relative z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <a href="/dashboard" className="font-bold flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center btn-primary">
            <LogoMarkIcon className="w-4 h-4" />
          </span>
          <span className="text-white font-display">App</span>
        </a>

        <div className="hidden sm:flex items-center gap-6">
          <div className="flex gap-4">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={isActive ? 'text-sm text-white font-medium' : 'text-sm text-[var(--foreground)]/60 hover:text-white'}
                >
                  {link.label}
                </a>
              )
            })}
            {role === 'admin' && (
              <a href="/admin" className="text-sm text-[var(--sun)] hover:brightness-110">
                Admin
              </a>
            )}
          </div>

          <div className="flex items-center gap-4">
            {email && <span className="text-[var(--foreground)]/45 text-sm">{email}</span>}
            <button onClick={handleLogout} className="text-sm text-[var(--foreground)]/60 hover:text-white">
              Logout
            </button>
          </div>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={menuOpen}
          className="sm:hidden flex items-center justify-center w-10 h-10 -mr-2 text-[var(--foreground)]/70 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden mt-4 pb-1 border-t border-[var(--glass-border)] pt-3 animate-fade-in-up">
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-[var(--foreground)]/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              )
            })}
            {role === 'admin' && (
              <a
                href="/admin"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--sun)] hover:bg-white/10"
              >
                Admin
              </a>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[var(--glass-border)] px-3">
            {email && <span className="text-[var(--foreground)]/45 text-xs truncate">{email}</span>}
            <button onClick={handleLogout} className="text-sm text-[var(--foreground)]/70 hover:text-white shrink-0 py-1">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
