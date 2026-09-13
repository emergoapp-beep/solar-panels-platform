const STATUS_STYLES: Record<string, string> = {
  open: 'bg-[var(--sun)]/15 text-[var(--sun)]',
  answered: 'bg-[var(--energy)]/15 text-[var(--energy)]',
  closed: 'input-glass text-white/60',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'In attesa',
  answered: 'Risposto',
  closed: 'Chiuso',
}

export default function TicketStatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[status] ?? 'input-glass text-white/80'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
