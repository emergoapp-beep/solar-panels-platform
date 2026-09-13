import SolarPanelIllustration from '@/components/icons/SolarPanelIllustration'
import { LeafIcon } from '@/components/icons/Icons'
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

export default function PanelCard({ userPanel }: { userPanel: UserPanel }) {
  const isActive = userPanel.status === 'active'

  const dailyEstimate =
    userPanel.daily_yield_type === 'percent'
      ? (Number(userPanel.purchase_price) * Number(userPanel.daily_yield_value)) / 100
      : Number(userPanel.daily_yield_value)

  return (
    <div
      className={`glass cell-texture rounded-3xl p-5 flex flex-col gap-3 hover-lift ${
        isActive ? '' : 'opacity-60'
      }`}
    >
      <SolarPanelIllustration active={isActive} animated={isActive} />

      <div className="flex items-center justify-between gap-2 relative">
        <h3 className="font-bold text-white">{userPanel.name}</h3>
        {isActive ? (
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-[var(--energy)]/15 text-[var(--energy)] shrink-0">
            Attivo
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full font-medium input-glass text-white/60 shrink-0">
            Scaduto
          </span>
        )}
      </div>

      <div className="text-sm text-white/80 space-y-1.5 relative">
        <p className="flex items-center gap-1.5">
          Resa <LeafIcon className="w-3.5 h-3.5 text-[var(--energy)]" />
          <span className="font-bold text-[var(--energy)]">+{dailyEstimate.toFixed(2)}/giorno</span>
        </p>
        <p>
          Guadagnato: <span className="font-bold text-white">{Number(userPanel.total_earned).toFixed(2)}</span>
        </p>
        <p className="text-white/45">
          Acquistato il {new Date(userPanel.purchased_at).toLocaleDateString('it-IT')}
        </p>
        {userPanel.expires_at && (
          <p className="text-white/45">
            Scade il {new Date(userPanel.expires_at).toLocaleDateString('it-IT')}
          </p>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-white/10 text-sm relative">
        {isActive ? (
          <p className="text-white/60">
            Prossimo accredito tra <PayoutCountdown lastAccruedAt={userPanel.last_accrued_at} />
          </p>
        ) : (
          <p className="text-white/40">Pannello scaduto</p>
        )}
      </div>
    </div>
  )
}
