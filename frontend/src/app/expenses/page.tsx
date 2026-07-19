'use client'

import { useState, useEffect } from 'react'
import { Wallet, Calendar, Plus, Trash2, X, Search } from 'lucide-react'
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns'

type Expense = {
  id: string
  amount: number
  reason: string
  date: string
  createdAt: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [dateRange, setDateRange] = useState<'today' | 'weekly' | 'monthly' | 'custom'>('today')
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ amount: '', reason: '', date: format(new Date(), 'yyyy-MM-dd') })

  useEffect(() => {
    if (dateRange !== 'custom') {
      fetchExpenses()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      let url = '/api/expenses?'
      if (startDate && endDate) {
        url += `startDate=${startDate}T00:00:00.000Z&endDate=${endDate}T23:59:59.999Z`
      }
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' })
      let data: any = []
      if (res.ok) {
        try { data = await res.json() } catch(e) {}
      }
      if (!data.error && Array.isArray(data)) setExpenses(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFilter = (range: 'today' | 'weekly' | 'monthly') => {
    setDateRange(range)
    const today = new Date()
    if (range === 'today') {
      setStartDate(format(startOfDay(today), 'yyyy-MM-dd'))
      setEndDate(format(endOfDay(today), 'yyyy-MM-dd'))
    } else if (range === 'weekly') {
      setStartDate(format(subDays(today, 6), 'yyyy-MM-dd'))
      setEndDate(format(endOfDay(today), 'yyyy-MM-dd'))
    } else if (range === 'monthly') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'))
      setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/expenses', { credentials: 'include', method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: formData.amount,
          reason: formData.reason,
          date: formData.date
        })
      })
      if (res.ok) {
        setFormData({ amount: '', reason: '', date: format(new Date(), 'yyyy-MM-dd') })
        setIsModalOpen(false)
        fetchExpenses()
      } else {
        alert('Failed to save expense')
      }
    } catch (e) {
      alert('Error saving expense')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses/${id}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) {
        fetchExpenses()
      }
    } catch (e) {
      alert('Error deleting expense')
    }
  }

  const filteredExpenses = expenses.filter(e => 
    e.reason.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold flex items-center"><Wallet className="w-6 h-6 mr-2 text-red-500" /> Expenses</h1>
           <p className="text-zinc-500 text-sm mt-1">Track and manage your daily shop expenses</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 ml-auto sm:ml-0">
          <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <button onClick={() => handleQuickFilter('today')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateRange === 'today' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}>Today</button>
            <button onClick={() => handleQuickFilter('weekly')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateRange === 'weekly' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}>7 Days</button>
            <button onClick={() => handleQuickFilter('monthly')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateRange === 'monthly' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}>This Month</button>
          </div>
          
          <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-md transition-all active:scale-95 text-sm font-bold h-[38px]">
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Start Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input 
              type="date" value={startDate}
              onChange={e => { setStartDate(e.target.value); setDateRange('custom') }}
              className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">End Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input 
              type="date" value={endDate}
              onChange={e => { setEndDate(e.target.value); setDateRange('custom') }}
              className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>
        </div>
        <button onClick={fetchExpenses} className="bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white px-6 py-2 rounded-xl flex items-center shadow-md active:scale-95 transition-all text-sm font-bold h-[38px]">
          Filter
        </button>

        <div className="ml-auto bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 px-6 py-2 rounded-xl flex items-center">
           <span className="text-red-700 dark:text-red-400 font-medium mr-3">Total Expenses:</span>
           <span className="text-xl font-bold text-red-600 dark:text-red-500">₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search expenses by reason..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/30 text-xs uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-6 font-medium">Date</th>
                <th className="py-3 px-6 font-medium">Reason</th>
                <th className="py-3 px-6 font-medium text-right">Amount</th>
                <th className="py-3 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-zinc-500">Loading expenses...</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-zinc-500">No expenses found for this period.</td></tr>
              ) : filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="py-4 px-6">{format(new Date(expense.date), 'MMM d, yyyy')}</td>
                  <td className="py-4 px-6 font-medium">{expense.reason}</td>
                  <td className="py-4 px-6 text-right font-bold text-red-600 dark:text-red-500">
                    ₹{expense.amount.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => handleDelete(expense.id)} className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg text-zinc-500 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Add Expense</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason (e.g. Tea, Cleaning)</label>
                <input required type="text" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                <input required type="number" step="0.01" min="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-colors font-medium">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

