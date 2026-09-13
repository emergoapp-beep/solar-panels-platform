'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoMarkIcon } from '@/components/icons/Icons'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/panels', label: 'Pannelli' },
  { href: '/panels/posseduti', label: 'I miei pannelli' },
  { href: '/referral', label: 'Referral' },
  { href: '/deposits', label: 'Depositi' },
  { href: '/withdrawals', label: 'Prelievi' },
]

export default function Sidebar() {
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

  const allLinks = role === 'admin' ? [...links, { href: '/admin', label: 'Admin' }] : links

  function isLinkActive(href: string) {
    return pathname === href || (href === '/admin' && pathname.startsWith('/admin'))
  }

  return (
    <>
      {/* Sidebar desktop, fissa a sinistra */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 glass rounded-none border-y-0 border-l-0 p-5 z-30">
        <a href="/dashboard" className="font-bold flex items-center gap-2 mb-8 shrink-0">
          <span className="w-9 h-9 rounded-3xl flex items-center justify-center btn-primary shrink-0">
            <LogoMarkIcon className="w-4 h-4" />
          </span>
          <span className="text-white font-display">App</span>
        </a>

        <nav className="flex flex-col gap-1 flex-1">
          {allLinks.map((link) => {
            const active = isLinkActive(link.href)
            const isAdminLink = link.href === '/admin'
            return (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                } ${isAdminLink ? 'text-[var(--sun)]' : ''}`}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        <div className="pt-4 border-t border-white/10 flex flex-col gap-2 shrink-0">
          {email && <span className="text-white/45 text-xs truncate">{email}</span>}
          <button onClick={handleLogout} className="text-sm text-white/60 hover:text-white text-left">
            Logout
          </button>
        </div>
      </aside>

      {/* Barra mobile, in cima, con menu a comparsa */}
      <div className="md:hidden glass mx-3 mt-3 rounded-3xl px-4 py-3 relative z-30">
        <div className="flex items-center justify-between">
          <a href="/dashboard" className="font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-2xl flex items-center justify-center btn-primary shrink-0">
              <LogoMarkIcon className="w-4 h-4" />
            </span>
            <span className="text-white font-display">App</span>
          </a>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={menuOpen}
            className="flex items-center justify-center w-10 h-10 -mr-2 text-white/70 hover:text-white"
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
          <div className="mt-4 pb-1 border-t border-white/10 pt-3 animate-fade-in-up">
            <div className="flex flex-col gap-1">
              {allLinks.map((link) => {
                const active = isLinkActive(link.href)
                const isAdminLink = link.href === '/admin'
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    } ${isAdminLink ? 'text-[var(--sun)]' : ''}`}
                  >
                    {link.label}
                  </a>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/10 px-1">
              {email && <span className="text-white/45 text-xs truncate">{email}</span>}
              <button onClick={handleLogout} className="text-sm text-white/70 hover:text-white shrink-0 py-1">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
