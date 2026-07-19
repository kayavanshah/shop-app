'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/auth/login', { credentials: 'include', method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      })

      if (res.ok) {
        const data = await res.json();
        document.cookie = `session=${data.token}; path=/; max-age=86400; secure`;
        router.push('/')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Login failed')
      }
    } catch (err: any) {
      setError(`Error: ${err.message}. URL: ${process.env.NEXT_PUBLIC_API_URL}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full p-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
             <span className="text-white text-2xl font-bold">R</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">RetailShop</h1>
          <p className="text-zinc-500 text-sm">Sign in to manage your inventory and billing</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-6 border border-red-100 flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-70 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          <div className="text-center mt-6">
            <a href="/register" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400">
              Need a new shop account? Register here
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

