'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, ArrowRight, Printer, Plus } from 'lucide-react'
import { format } from 'date-fns'

type Expense = {
  id: string
  amount: number
  reason: string
  date: string
}

export default function DailyClosingReport() {
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [openingCash, setOpeningCash] = useState('0')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expenseData, setExpenseData] = useState({ amount: '', reason: '' })

  useEffect(() => {
    fetchReport()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/daily-closing?date=${date}`)
      const result = await res.json()
      if (!result.error) {
        setData(result)
        setErrorMsg(null)
      } else {
        setErrorMsg(result.error)
      }
    } catch (e) {
      setErrorMsg('Failed to load report. Check database connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: expenseData.amount,
          reason: expenseData.reason,
          date
        })
      })
      if (res.ok) {
        setExpenseData({ amount: '', reason: '' })
        setIsExpenseModalOpen(false)
        fetchReport() // Refresh report
      }
    } catch (e) {
      alert('Error adding expense')
    }
  }

  if (errorMsg) return (
    <div className="text-center py-10">
      <p className="text-red-500 font-bold mb-2">Error loading report</p>
      <p className="text-zinc-500 text-sm mb-4">{errorMsg}</p>
      <p className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl inline-block text-left">
        <strong>Did you update the database?</strong><br/><br/>
        This feature requires new database tables. Please run:<br/>
        <code>npx prisma db push</code><br/>
        <code>npx prisma generate</code><br/>
        And restart your server.
      </p>
    </div>
  )
  if (!data) return <div className="text-center py-10">Loading report...</div>

  const opening = Number(openingCash) || 0
  const closingCash = opening + data.cashSales - data.totalReturns - data.totalExpenses

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-wrap items-end gap-4 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Report Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input 
              type="date" value={date}
              onChange={e => setDate(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-medium"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Opening Cash (₹)</label>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input 
              type="number" value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all font-bold text-amber-700 dark:text-amber-500 w-40"
              placeholder="0.00"
            />
          </div>
        </div>
        <button onClick={() => window.print()} className="ml-auto bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2.5 rounded-xl flex items-center transition-all text-sm font-medium">
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="font-bold text-lg border-b border-zinc-100 dark:border-zinc-800 pb-2">Cash Flow (Physical Drawer)</h3>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">Opening Cash</span>
            <span className="font-medium text-amber-600 dark:text-amber-500">₹{opening.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">(+) Cash Sales</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-500">₹{data.cashSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">(-) Returns / Refunds</span>
            <span className="font-medium text-red-600 dark:text-red-500">₹{data.totalReturns.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500 flex items-center gap-2">
              (-) Expenses
              <button onClick={() => setIsExpenseModalOpen(true)} className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400">Add</button>
            </span>
            <span className="font-medium text-red-600 dark:text-red-500">₹{data.totalExpenses.toFixed(2)}</span>
          </div>

          <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <span className="font-bold text-lg">Expected Closing Cash</span>
            <span className="font-black text-2xl text-blue-600 dark:text-blue-500">₹{closingCash.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="font-bold text-lg border-b border-zinc-100 dark:border-zinc-800 pb-2">Digital & Profit</h3>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">UPI Sales (Bank)</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-500">₹{data.upiSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">Total Revenue (Cash + UPI)</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-500">₹{(data.cashSales + data.upiSales).toFixed(2)}</span>
          </div>
          
          <div className="pt-4 mt-auto border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="font-bold">Estimated Net Profit</span>
            <span className="font-bold text-xl text-emerald-600 dark:text-emerald-500">₹{data.netProfit.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {data.expensesList.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-sm">Today's Expenses</h3>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.expensesList.map((exp: Expense) => (
              <div key={exp.id} className="px-6 py-3 flex justify-between items-center text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{exp.reason}</span>
                <span className="font-medium text-red-600 dark:text-red-500">₹{exp.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold">Add Expense</h2>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                <input required type="number" step="0.01" min="0.01" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input required type="text" placeholder="e.g. Tea, Cleaning, Salary" value={expenseData.reason} onChange={e => setExpenseData({...expenseData, reason: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-colors font-medium text-sm">
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

