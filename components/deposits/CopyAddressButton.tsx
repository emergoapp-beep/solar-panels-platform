'use client'

import { useState } from 'react'

export default function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard non disponibile, nessuna azione
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="input-glass rounded-2xl px-4 py-3 font-mono text-sm break-all text-left w-full hover:bg-white/10 transition-colors flex items-center justify-between gap-3"
    >
      <span className="break-all">{address}</span>
      <span className="text-xs shrink-0 text-[var(--sun)] font-sans font-medium">
        {copied ? 'Copiato!' : 'Copia'}
      </span>
    </button>
  )
}
