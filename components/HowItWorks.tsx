import { PanelIcon, LeafIcon, CoinIcon, UsersIcon } from '@/components/icons/Icons'

const steps = [
  {
    icon: PanelIcon,
    title: 'Scegli un pannello solare',
    description:
      'Acquista un pannello con i tuoi crediti: ogni pannello ha un prezzo, una resa giornaliera e una durata.',
  },
  {
    icon: LeafIcon,
    title: 'Guadagna ogni giorno',
    description:
      'Il pannello genera automaticamente un ricavo ogni giorno, accreditato direttamente sul tuo saldo.',
  },
  {
    icon: CoinIcon,
    title: 'Deposita e preleva in USDT',
    description:
      'Ricarica il saldo con un deposito in USDT (rete TRC20) e preleva i tuoi guadagni quando vuoi.',
  },
  {
    icon: UsersIcon,
    title: 'Invita altre persone',
    description:
      'Condividi il tuo link referral: ricevi il 10% di bonus su ogni deposito confermato di chi inviti.',
  },
]

export default function HowItWorks() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl mb-1">Come funziona</h2>
        <p className="text-white/60 text-sm">Quattro passi per iniziare a generare energia (e guadagno).</p>
      </div>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.title} className="flex gap-4">
            <div className="w-10 h-10 rounded-2xl input-glass flex items-center justify-center shrink-0">
              <step.icon className="w-5 h-5 text-[var(--sun)]" />
            </div>
            <div>
              <h3 className="font-medium">{step.title}</h3>
              <p className="text-white/60 text-sm">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
