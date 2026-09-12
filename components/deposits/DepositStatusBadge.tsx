const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-300',
  confirmed: 'bg-green-900/50 text-green-300',
  approved: 'bg-green-900/50 text-green-300',
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
    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${STATUS_STYLES[status] ?? 'bg-gray-800 text-gray-300'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
