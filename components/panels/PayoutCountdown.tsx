'use client'

import { useEffect, useState } from 'react'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

// Il rendimento viene accreditato una volta al giorno (24h dopo l'ultimo
// accredito). Qui calcoliamo solo una stima lato client: se il cron gira
// più tardi del previsto, il countdown arriva a 0 e resta su "In elaborazione…"
// finché non arriva il prossimo accredito reale.
export default function PayoutCountdown({ lastAccruedAt }: { lastAccruedAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const target = new Date(lastAccruedAt).getTime() + 24 * 60 * 60 * 1000

    function update() {
      setRemaining(target - Date.now())
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [lastAccruedAt])

  if (remaining === null) {
    return <span className="text-white/40">…</span>
  }

  if (remaining <= 0) {
    return <span className="text-[var(--energy)]">In elaborazione…</span>
  }

  const totalSeconds = Math.floor(remaining / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return (
    <span className="font-mono text-white/80">
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  )
}
