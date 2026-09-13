import { createClient } from '@/lib/supabase/server'
import AnalyticsRow from '@/components/admin/AnalyticsRow'

function getTimeWindows() {
  const now = Date.now()
  return {
    since24h: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    since7d: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    since30d: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const { since24h, since7d, since30d } = getTimeWindows()

  const [
    { count: views24h },
    { count: views7d },
    { count: views30d },
    { data: recentRows },
    { data: last30dRows },
  ] = await Promise.all([
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', since7d),
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', since30d),
    supabase
      .from('page_views')
      .select('id, path, ip_address, created_at, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('page_views').select('ip_address, user_id').gte('created_at', since30d),
  ])

  const uniqueIps = new Set((last30dRows ?? []).map((r) => r.ip_address).filter(Boolean)).size
  const uniqueUsers = new Set((last30dRows ?? []).map((r) => r.user_id).filter(Boolean)).size

  const stats = [
    { label: 'Visite 24h', value: views24h ?? 0 },
    { label: 'Visite 7 giorni', value: views7d ?? 0 },
    { label: 'Visite 30 giorni', value: views30d ?? 0 },
    { label: 'IP unici (30gg)', value: uniqueIps },
    { label: 'Utenti registrati (30gg)', value: uniqueUsers },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Analitiche</h2>
      <p className="text-white/60 text-sm">
        Ogni pagina caricata viene registrata automaticamente. La localizzazione dall&apos;IP
        non viene salvata: si calcola al momento, cliccando &quot;Localizza&quot; su una riga,
        tramite un servizio esterno (ipapi.co).
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-3xl p-4">
            <p className="text-white/60 text-xs mb-1">{stat.label}</p>
            <p className="font-display text-2xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-white/10 text-white/60 text-left">
              <th className="py-3 px-4 font-medium">Data</th>
              <th className="py-3 px-4 font-medium">Pagina</th>
              <th className="py-3 px-4 font-medium">Utente</th>
              <th className="py-3 px-4 font-medium">IP</th>
              <th className="py-3 px-4 font-medium">Localizzazione</th>
            </tr>
          </thead>
          <tbody>
            {recentRows?.map((row) => (
              <AnalyticsRow
                key={row.id}
                row={row as unknown as {
                  id: string
                  path: string
                  ip_address: string | null
                  created_at: string
                  profiles: { email: string | null } | null
                }}
              />
            ))}
          </tbody>
        </table>

        {(!recentRows || recentRows.length === 0) && (
          <p className="text-white/45 text-center py-12">Nessuna visita registrata ancora.</p>
        )}
      </div>
    </div>
  )
}
