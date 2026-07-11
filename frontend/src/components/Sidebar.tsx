'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LayoutDashboard, Package, FileText, LogOut, FileSearch, Truck, Users, Wallet } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Suppliers', href: '/suppliers', icon: Users },
  { name: 'Purchases', href: '/purchases', icon: Truck },
  { name: 'Purchase History', href: '/purchase-history', icon: FileText },
  { name: 'Billing', href: '/billing', icon: FileText },
  { name: 'Expenses', href: '/expenses', icon: Wallet },
  { name: 'Reports', href: '/reports', icon: FileSearch },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault()
            router.push('/billing')
            break
          case 'i':
            e.preventDefault()
            router.push('/inventory')
            break
          case 'r':
            e.preventDefault()
            router.push('/reports')
            break
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [router])

  const handleLogout = async () => {
    await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/login'
  }

  return (
    <div className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col fixed left-0 top-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
        <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg mr-3 shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-lg">R</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight">RetailShop</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" 
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-400")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl w-full text-zinc-600 hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

