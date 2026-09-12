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
    <nav className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4 relative z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <a href="/dashboard" className="font-bold flex items-center gap-1.5 text-blue-400 shrink-0">
          <LogoMarkIcon className="w-5 h-5" />
          <span className="text-white">App</span>
        </a>

        <div className="hidden sm:flex items-center gap-6">
          <div className="flex gap-4">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={isActive ? 'text-sm text-white font-medium' : 'text-sm text-gray-400 hover:text-white'}
                >
                  {link.label}
                </a>
              )
            })}
            {role === 'admin' && (
              <a href="/admin" className="text-sm text-yellow-500 hover:text-yellow-400">
                Admin
              </a>
            )}
          </div>

          <div className="flex items-center gap-4">
            {email && <span className="text-gray-500 text-sm">{email}</span>}
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white">
              Logout
            </button>
          </div>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={menuOpen}
          className="sm:hidden flex items-center justify-center w-10 h-10 -mr-2 text-gray-300 hover:text-white"
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
        <div className="sm:hidden mt-4 pb-1 border-t border-gray-800 pt-3 animate-fade-in-up">
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              )
            })}
            {role === 'admin' && (
              <a
                href="/admin"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-yellow-500 hover:bg-gray-800 hover:text-yellow-400"
              >
                Admin
              </a>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-800 px-3">
            {email && <span className="text-gray-500 text-xs truncate">{email}</span>}
            <button onClick={handleLogout} className="text-sm text-gray-300 hover:text-white shrink-0 py-1">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
