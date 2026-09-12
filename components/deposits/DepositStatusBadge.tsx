const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--sun)]/15 text-[var(--sun)]',
  confirmed: 'bg-[var(--energy)]/15 text-[var(--energy)]',
  approved: 'bg-[var(--energy)]/15 text-[var(--energy)]',
  rejected: 'bg-red-900/50 text-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'In verifica',
  confirmed: 'Confermato',
  approved: 'Approvato',
  rejected: 'Rifiutato',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${STATUS_STYLES[status] ?? 'input-glass text-white/80'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
