import { createClient } from '@/lib/supabase/server'
import PanelTypeRow from '@/components/admin/PanelTypeRow'
import PanelTypeForm from '@/components/admin/PanelTypeForm'

export default async function AdminPanelsPage() {
  const supabase = await createClient()

  const { data: panelTypes, error } = await supabase
    .from('panel_types')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Pannelli solari</h2>
        <PanelTypeForm />
      </div>

      <p className="text-white/60 text-sm">
        Qui configuri i tipi di pannello acquistabili dagli utenti: prezzo, resa giornaliera e durata.
        I ricavi vengono accreditati automaticamente una volta al giorno (vedi README per impostare il cron).
      </p>

      {error && (
        <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-lg">Errore: {error.message}</p>
      )}

      <div className="glass rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/60 text-left">
              <th className="py-3 px-4 font-medium">Nome</th>
              <th className="py-3 px-4 font-medium">Prezzo</th>
              <th className="py-3 px-4 font-medium">Resa</th>
              <th className="py-3 px-4 font-medium">Durata</th>
              <th className="py-3 px-4 font-medium">Stato</th>
              <th className="py-3 px-4 font-medium">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {panelTypes?.map((panelType) => (
              <PanelTypeRow key={panelType.id} panelType={panelType} />
            ))}
          </tbody>
        </table>

        {(!panelTypes || panelTypes.length === 0) && !error && (
          <p className="text-white/45 text-center py-12">Nessun tipo di pannello configurato.</p>
        )}
      </div>
    </div>
  )
}
