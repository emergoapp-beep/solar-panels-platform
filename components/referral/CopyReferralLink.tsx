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
      <div className="flex-1 flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-300 overflow-hidden">
        <LinkIcon className="w-4 h-4 text-gray-500 shrink-0" />
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
        className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shrink-0"
      >
        {copied ? 'Copiato ✓' : 'Copia link'}
      </button>
    </div>
  )
}
