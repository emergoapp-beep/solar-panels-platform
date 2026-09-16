import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoMarkIcon } from '@/components/icons/Icons'
import HowItWorks from '@/components/HowItWorks'
import InstallAppButton from '@/components/InstallAppButton'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="order-2 lg:order-1">
          <HowItWorks />
        </div>

        <div className="order-1 lg:order-2 glass glow-corner p-8 rounded-3xl w-full max-w-sm mx-auto space-y-4 animate-fade-in-up">
          <div className="w-12 h-12 rounded-3xl btn-primary flex items-center justify-center mb-1">
            <LogoMarkIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Benvenuto</h1>
          <p className="text-sm text-white/60 mb-4">
            Accedi al tuo account o registrati per iniziare
          </p>

          <Link
            href="/login"
            className="w-full block text-center btn-primary py-3 rounded-full font-medium"
          >
            Accedi
          </Link>

          <Link
            href="/register"
            className="w-full block text-center input-glass py-3 rounded-full font-medium"
          >
            Registrati
          </Link>

          <div className="pt-4 border-t border-white/10">
            <InstallAppButton />
          </div>
        </div>
      </div>
    </main>
  )
}
