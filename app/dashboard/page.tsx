import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoinIcon, LinkIcon, ShieldIcon, PanelIcon, WithdrawIcon, UsersIcon } from '@/components/icons/Icons'
import InstallAppButton from '@/components/InstallAppButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const quickActions = [
    {
      href: '/panels',
      title: 'Pannelli',
      description: 'Acquista e monitora i tuoi pannelli',
      icon: PanelIcon,
      accent: 'bg-[var(--sun)]/15 text-[var(--sun)]',
    },
    {
      href: '/deposits',
      title: 'Deposita',
      description: 'Ricarica il saldo',
      icon: CoinIcon,
      accent: 'bg-[var(--energy)]/15 text-[var(--energy)]',
    },
    {
      href: '/withdrawals',
      title: 'Preleva',
      description: 'Richiedi un prelievo',
      icon: WithdrawIcon,
      accent: 'bg-white/10 text-white/80',
    },
    {
      href: '/referral',
      title: 'Invita',
      description: 'Condividi il tuo link referral',
      icon: UsersIcon,
      accent: 'bg-[var(--sun)]/15 text-[var(--sun)]',
    },
  ]

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl mb-1 animate-fade-in-up">Dashboard</h1>
        <p className="text-white/60 mb-8 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          Bentornato, {profile?.email}
        </p>

        <div className="glass glow-corner rounded-3xl p-8 mb-6 grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div>
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <CoinIcon className="w-4 h-4" />
              <p>Saldo</p>
            </div>
            <p className="font-display text-4xl text-[var(--sun)]">
              {Number(profile?.balance ?? 0)} <span className="text-lg text-white/50 font-sans">crediti</span>
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 md:border-l md:border-white/10 md:pl-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                Referral
              </span>
              <span className="font-medium">{profile?.ref_code}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60 flex items-center gap-1.5">
                <ShieldIcon className="w-3.5 h-3.5" />
                Ruolo
              </span>
              <span className="font-medium capitalize">{profile?.role}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-bold mb-0.5">Porta l&apos;app sul tuo telefono</h2>
              <p className="text-white/60 text-sm">Accedi più velocemente installando l&apos;app</p>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[220px]">
              <InstallAppButton />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <a
                key={action.href}
                href={action.href}
                className="glass hover:bg-white/10 rounded-3xl p-6 transition-colors hover-lift flex items-center gap-4"
              >
                <span className={`w-11 h-11 rounded-3xl flex items-center justify-center shrink-0 ${action.accent}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold mb-0.5">{action.title} →</h2>
                  <p className="text-white/60 text-sm">{action.description}</p>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </main>
  )
}
