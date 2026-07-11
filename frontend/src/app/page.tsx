'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, AlertTriangle, TrendingUp, RefreshCcw, DollarSign, ShoppingCart, Truck, PlusCircle } from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    todaySales: 0,
    todayReturns: 0,
    todayProfit: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + '/api/dashboard', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) return {}
        try {
          return await res.json()
        } catch(e) { return {} }
      })
      .then(d => {
        if (!d.error && Object.keys(d).length > 0) {
          setData(d)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800"></div>)}
      </div>
    </div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/billing" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm font-medium">
            <ShoppingCart className="w-4 h-4" />
            <span>New Bill</span>
          </Link>
          <Link href="/inventory" className="bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-md transition-all active:scale-95 text-sm font-medium">
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link href="/purchases" className="bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-md transition-all active:scale-95 text-sm font-medium">
            <Truck className="w-4 h-4" />
            <span>Add Purchase</span>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Total Products</p>
            <h3 className="text-2xl font-bold mt-1">{data.totalProducts}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Low Stock Alerts</p>
            <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-500">{data.lowStockItems}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Gross Sales (Today)</p>
            <h3 className="text-2xl font-bold mt-1 text-green-600 dark:text-green-500">
              ₹{data.todaySales.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl">
            <RefreshCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Returns (Today)</p>
            <h3 className="text-2xl font-bold mt-1 text-red-600 dark:text-red-500">
              ₹{data.todayReturns.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start space-x-4 lg:col-span-2">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Net Profit (Today)</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-500">
              ₹{data.todayProfit.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>
    </div>
  )
}

