'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideChrome = pathname === '/' || pathname === '/login' || pathname === '/register'

  if (hideChrome) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <div className="md:pl-64 min-w-0">{children}</div>
    </>
  )
}
