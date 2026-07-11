'use client'

import { Bell, Search } from 'lucide-react'

export default function Topbar() {
  return (
    <div className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-10 transition-all">
      <div className="flex-1 flex" />
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-200 transition-colors">
          <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">AD</span>
        </div>
      </div>
    </div>
  )
}

