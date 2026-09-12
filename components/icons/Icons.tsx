type IconProps = {
  className?: string
}

const base = 'shrink-0'

export function CoinIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.5 9.3c0-1 1-1.8 2.5-1.8s2.5.7 2.5 1.6c0 2.2-5 1.3-5 3.6 0 1 1 1.7 2.5 1.7s2.5-.7 2.5-1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M12 6.3v11.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function LinkIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`}>
      <path d="M9.5 14.5 14.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M11 8.2 12.6 6.6a3.3 3.3 0 1 1 4.7 4.7l-1.7 1.7M13 15.8l-1.7 1.7a3.3 3.3 0 1 1-4.7-4.7L8.3 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ShieldIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`}>
      <path
        d="M12 3.5 19 6v5.5c0 4.2-2.9 6.9-7 8.5-4.1-1.6-7-4.3-7-8.5V6l7-2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function UsersIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`}>
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19c.7-3.2 2.8-5 5.5-5s4.8 1.8 5.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.5 6.3a3 3 0 0 1 0 5.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 14.2c2.3.4 4 2.1 4.5 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function WithdrawIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`}>
      <rect x="4" y="8.5" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 11.5h16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 14.3v3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10.2 15.7 12 17.7l1.8-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8.5V6.8A2.3 2.3 0 0 1 10.3 4.5h3.4A2.3 2.3 0 0 1 16 6.8v1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function SunIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PanelIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`}>
      <rect x="3.5" y="6.5" width="17" height="12" rx="1.3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.5 10.5h17M3.5 14.5h17M9 6.5v12M15 6.5v12" stroke="currentColor" strokeWidth="1.1" />
      <path d="M12 3.6V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7.6 4 6.5 2.7M16.4 4l1.1-1.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function LeafIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`}>
      <path
        d="M6 18c-1.6-5.6 1-11.4 12-13 1.6 8.4-2.2 13.6-8.4 14.6-1.3.2-2.6.1-3.6-.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 17c2-3.4 5-7 10.6-11.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function LogoMarkIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`}>
      <rect x="3" y="8" width="14" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 12.3h14M8.3 8v10M12.7 8v10" stroke="currentColor" strokeWidth="1" />
      <path
        d="M15.4 8.3c.3-3.3 2.3-5 5.4-5.4-.1 3.6-1.8 5.9-5 6.5-.3-.3-.4-.7-.4-1.1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
