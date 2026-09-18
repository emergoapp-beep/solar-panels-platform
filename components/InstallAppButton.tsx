'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))

    const ua = window.navigator.userAgent
    setIsIos(/iphone|ipad|ipod/i.test(ua))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      setInstalled(true)
    }
    setInstallEvent(null)
  }

  if (installed) {
    return (
      <p className="text-sm text-white/60 text-center">
        App già installata su questo dispositivo ✅
      </p>
    )
  }

  if (isIos) {
    return (
      <div className="glass rounded-2xl p-4 text-sm text-white/70 text-center">
        Su iPhone: tocca <span className="font-semibold">Condividi</span> e poi{' '}
        <span className="font-semibold">Aggiungi a schermata Home</span>
      </div>
    )
  }

  if (!installEvent) {
    return null
  }

  return (
    <button
      onClick={handleInstall}
      className="w-full btn-primary py-3 rounded-full font-medium"
    >
      Scarica la nostra app
    </button>
  )
}
