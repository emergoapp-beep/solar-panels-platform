import { createClient } from '@/lib/supabase/server'
import UserRow from '@/components/admin/UserRow'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('email', { ascending: true })

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Utenti ({profiles?.length ?? 0})</h2>

      {error && (
        <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-2xl mb-4">
          Errore: {error.message}
        </p>
      )}

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-white/10 text-white/60 text-left">
              <th className="py-3 px-4 font-medium">Utente</th>
              <th className="py-3 px-4 font-medium">Saldo</th>
              <th className="py-3 px-4 font-medium">Ruolo</th>
              <th className="py-3 px-4 font-medium">Stato</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="stagger-children">
            {profiles?.map((profile) => (
              <UserRow key={profile.id} profile={profile} />
            ))}
          </tbody>
        </table>

        {(!profiles || profiles.length === 0) && !error && (
          <p className="text-white/45 text-center py-12">Nessun utente registrato.</p>
        )}
      </div>
    </div>
  )
}
