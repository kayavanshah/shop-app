'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, CheckCircle, XCircle, Users } from 'lucide-react'

type User = {
  id: string
  username: string
  isActive: boolean
  isAdmin: boolean
  createdAt: string
  _count: {
    products: number
    bills: number
    purchases: number
  }
}

export default function SuperAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include', cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          setError('Access Denied. You are not a Super Admin.')
        } else {
          setError('Failed to fetch users')
        }
        setLoading(false)
        return
      }
      const data = await res.json()
      setUsers(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const confirmMsg = currentStatus 
      ? 'Are you sure you want to DEACTIVATE this shop? They will be instantly logged out.' 
      : 'Are you sure you want to ACTIVATE this shop?'
      
    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch(`/api/admin/users/${id}/toggle-status`, { 
        method: 'PUT',
        credentials: 'include' 
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to toggle status')
        return
      }
      
      const { isActive } = await res.json()
      setUsers(users.map(u => u.id === id ? { ...u, isActive } : u))
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Admin Dashboard...</div>
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
      <p className="text-zinc-500">{error}</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Super Admin</h1>
          <p className="text-zinc-500 text-sm">Manage shop access and subscriptions</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Shop Name (Username)</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Data Usage</th>
                <th className="px-6 py-4 text-center">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{user.username}</p>
                        {user.isAdmin && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Admin</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Locked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-4">
                      <span title="Products" className="flex items-center gap-1"><span className="font-medium">{user._count.products}</span> P</span>
                      <span title="Bills" className="flex items-center gap-1"><span className="font-medium">{user._count.bills}</span> B</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-zinc-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!user.isAdmin && (
                      <button
                        onClick={() => toggleStatus(user.id, user.isActive)}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                          user.isActive 
                            ? 'bg-zinc-100 hover:bg-red-100 text-zinc-700 hover:text-red-600' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate Shop'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No shops registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
