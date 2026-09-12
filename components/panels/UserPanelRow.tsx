type UserPanel = {
  id: string
  name: string
  purchase_price: number
  daily_yield_type: 'percent' | 'fixed'
  daily_yield_value: number
  purchased_at: string
  expires_at: string | null
  total_earned: number
  status: 'active' | 'expired'
}

export default function UserPanelRow({ userPanel }: { userPanel: UserPanel }) {
  const dailyEstimate =
    userPanel.daily_yield_type === 'percent'
      ? (Number(userPanel.purchase_price) * Number(userPanel.daily_yield_value)) / 100
      : Number(userPanel.daily_yield_value)

  return (
    <tr className="border-b border-gray-800">
      <td className="py-3 px-4">{userPanel.name}</td>
      <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
        {new Date(userPanel.purchased_at).toLocaleDateString('it-IT')}
      </td>
      <td className="py-3 px-4 text-green-400">+{dailyEstimate.toFixed(2)}/giorno</td>
      <td className="py-3 px-4 font-medium">{Number(userPanel.total_earned).toFixed(2)}</td>
      <td className="py-3 px-4 text-gray-400">
        {userPanel.expires_at ? new Date(userPanel.expires_at).toLocaleDateString('it-IT') : 'Nessuna'}
      </td>
      <td className="py-3 px-4">
        {userPanel.status === 'active' ? (
          <span className="text-xs px-2 py-1 rounded-lg font-medium bg-green-900/50 text-green-300">Attivo</span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-lg font-medium bg-gray-800 text-gray-400">Scaduto</span>
        )}
      </td>
    </tr>
  )
}
