import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import CopyReferralLink from '@/components/referral/CopyReferralLink'
import { UsersIcon, LinkIcon, CoinIcon } from '@/components/icons/Icons'

export default async function ReferralPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const { data: profile } = await supabase
    .from('profiles')
    .select('ref_code')
    .eq('id', user.id)
    .single()

  const { data: referrals, error } = await supabase
    .from('profiles')
    .select('id, email, balance, created_at')
    .eq('referred_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-display text-3xl">Invita i tuoi amici</h1>
          <p className="text-white/60">Condividi il tuo link e tieni traccia di chi si iscrive</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-6 items-start">
          <div className="glass rounded-3xl p-6 hover-lift">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
              <LinkIcon className="w-4 h-4" />
              <p>Il tuo link di invito</p>
            </div>

            {profile?.ref_code ? (
              <CopyReferralLink refCode={profile.ref_code} baseUrl={baseUrl} />
            ) : (
              <p className="text-white/45 text-sm">Codice referral non disponibile.</p>
            )}

            <p className="text-white/45 text-xs mt-3">
              Chi si registra da questo link avrà già il codice{' '}
              <span className="text-white/80 font-mono">{profile?.ref_code}</span> precompilato.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <UsersIcon className="w-4 h-4" />
              <p>I tuoi iscritti</p>
            </div>
            <span className="text-sm font-bold">{referrals?.length ?? 0}</span>
          </div>

          {error && (
            <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-2xl mb-4">
              Errore: {error.message}
            </p>
          )}

          {referrals && referrals.length > 0 ? (
            <div className="divide-y divide-white/10 stagger-children">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{referral.email}</p>
                    <p className="text-white/45 text-xs">
                      Iscritto il{' '}
                      {new Date(referral.created_at).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/60 text-sm">
                    <CoinIcon className="w-3.5 h-3.5" />
                    {referral.balance}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !error && (
              <div className="flex flex-col items-center text-center py-10">
                <div className="w-14 h-14 rounded-3xl input-glass text-white/35 flex items-center justify-center mb-3">
                  <UsersIcon className="w-6 h-6" />
                </div>
                <p className="text-white/45 text-sm">
                  Nessun iscritto ancora. Condividi il tuo link per iniziare!
                </p>
              </div>
            )
          )}
          </div>
        </div>
      </div>
    </main>
  )
}
