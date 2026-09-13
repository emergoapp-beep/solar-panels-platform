'use client'

import { useId } from 'react'

type SolarPanelIllustrationProps = {
  className?: string
  /** Mostra il puntino pulsante "in produzione" (per i pannelli posseduti attivi) */
  active?: boolean
  /** Attiva il riflesso animato che attraversa il pannello */
  animated?: boolean
}

// Illustrazione stilizzata di un pannello solare, coerente con il tema
// "liquid glass / ice" del progetto (usa le stesse variabili --sun / --energy
// definite in app/globals.css). Pensata per essere piccola e leggera: niente
// librerie esterne, solo SVG + le animazioni CSS aggiunte in globals.css.
export default function SolarPanelIllustration({
  className = '',
  active = true,
  animated = true,
}: SolarPanelIllustrationProps) {
  const clipId = useId()

  return (
    <svg
      viewBox="0 0 200 120"
      className={`w-full h-auto ${className}`}
      role="img"
      aria-label="Illustrazione di un pannello solare"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="6" y="14" width="188" height="86" rx="6" />
        </clipPath>
      </defs>

      {/* Corpo del pannello */}
      <rect
        x="6"
        y="14"
        width="188"
        height="86"
        rx="6"
        fill="rgba(56, 189, 248, 0.08)"
        stroke="var(--sun)"
        strokeWidth="1.4"
      />

      {/* Griglia delle celle */}
      <g stroke="var(--sun)" strokeOpacity="0.5" strokeWidth="0.8">
        <line x1="53" y1="14" x2="53" y2="100" />
        <line x1="100" y1="14" x2="100" y2="100" />
        <line x1="147" y1="14" x2="147" y2="100" />
        <line x1="6" y1="38" x2="194" y2="38" />
        <line x1="6" y1="62" x2="194" y2="62" />
        <line x1="6" y1="86" x2="194" y2="86" />
      </g>

      {/* Riflesso animato (luce che attraversa il pannello) */}
      {animated && (
        <g clipPath={`url(#${clipId})`}>
          <rect
            x="-40"
            y="12"
            width="34"
            height="90"
            fill="var(--energy)"
            opacity="0.16"
            transform="skewX(-18)"
            className="panel-sheen"
          />
        </g>
      )}

      {/* Sole stilizzato nell'angolo */}
      <circle cx="176" cy="12" r="7" fill="var(--sun)" opacity="0.9" />
      <g stroke="var(--sun)" strokeWidth="1.4" strokeLinecap="round" opacity="0.8">
        <line x1="176" y1="0" x2="176" y2="2.5" />
        <line x1="190" y1="12" x2="187.5" y2="12" />
        <line x1="186.3" y1="2.3" x2="184.5" y2="4.1" />
        <line x1="166.3" y1="2.3" x2="168.1" y2="4.1" />
      </g>

      {/* Piedistallo */}
      <rect x="90" y="100" width="20" height="8" fill="rgba(255, 255, 255, 0.12)" />
      <rect x="76" y="106" width="48" height="5" rx="2" fill="rgba(255, 255, 255, 0.16)" />

      {/* Indicatore "in produzione" */}
      {active && (
        <circle cx="16" cy="10" r="3.4" fill="var(--energy)" className="panel-active-dot" />
      )}
    </svg>
  )
}
