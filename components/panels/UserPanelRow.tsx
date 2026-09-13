import PayoutCountdown from './PayoutCountdown'

type UserPanel = {
  id: string
  name: string
  purchase_price: number
  daily_yield_type: 'percent' | 'fixed'
  daily_yield_value: number
  purchased_at: string
  last_accrued_at: string
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
    <tr className="border-b border-white/10">
      <td className="py-3 px-4">{userPanel.name}</td>
      <td className="py-3 px-4 text-white/60 whitespace-nowrap">
        {new Date(userPanel.purchased_at).toLocaleDateString('it-IT')}
      </td>
      <td className="py-3 px-4 text-[var(--energy)]">+{dailyEstimate.toFixed(2)}/giorno</td>
      <td className="py-3 px-4 font-medium">{Number(userPanel.total_earned).toFixed(2)}</td>
      <td className="py-3 px-4 whitespace-nowrap">
        {userPanel.status === 'active' ? (
          <PayoutCountdown lastAccruedAt={userPanel.last_accrued_at} />
        ) : (
          <span className="text-white/40">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-white/60">
        {userPanel.expires_at ? new Date(userPanel.expires_at).toLocaleDateString('it-IT') : 'Nessuna'}
      </td>
      <td className="py-3 px-4">
        {userPanel.status === 'active' ? (
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-[var(--energy)]/15 text-[var(--energy)]">Attivo</span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full font-medium input-glass text-white/60">Scaduto</span>
        )}
      </td>
    </tr>
  )
}
