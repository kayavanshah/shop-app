'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/login')

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

