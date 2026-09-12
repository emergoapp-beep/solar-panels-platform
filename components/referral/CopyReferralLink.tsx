'use client'

import { useState } from 'react'
import { LinkIcon } from '@/components/icons/Icons'

export default function CopyReferralLink({ refCode, baseUrl }: { refCode: string; baseUrl: string }) {
  const [copied, setCopied] = useState(false)
  const link = `${baseUrl}/register?ref=${encodeURIComponent(refCode)}`

  async function handleCopy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback per browser senza permesso clipboard: seleziona il testo
      const input = document.getElementById('referral-link-input') as HTMLInputElement | null
      input?.select()
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex items-center gap-2 input-glass rounded-xl px-4 py-2.5 text-sm text-white/80 overflow-hidden">
        <LinkIcon className="w-4 h-4 text-white/45 shrink-0" />
        <input
          id="referral-link-input"
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className="bg-transparent outline-none flex-1 truncate"
        />
      </div>
      <button
        onClick={handleCopy}
        className="btn-primary px-5 py-2.5 rounded-full font-medium text-sm transition-colors shrink-0"
      >
        {copied ? 'Copiato ✓' : 'Copia link'}
      </button>
    </div>
  )
}
