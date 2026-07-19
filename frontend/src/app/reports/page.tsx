'use client'

import { useState, useEffect, useMemo } from 'react'
import { FileText, Calendar, Download, TrendingUp, DollarSign, PackageOpen, Award, BarChart3, CornerUpLeft, X, Receipt } from 'lucide-react'
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import DailyClosingReport from '@/components/DailyClosingReport'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts'

type Product = { id: string, name: string, buyPrice: number, sellPrice: number }
type BillItem = {
  id: string
  product: Product
  quantity: number
  returnedQuantity: number
  price: number
  subtotal: number
}

type Bill = {
  id: string
  customerName: string | null
  totalAmount: number
  discount: number
  paymentMethod: string
  createdAt: string
  items: BillItem[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'DAILY_CLOSING'>('ANALYTICS')
  
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [returnModalBill, setReturnModalBill] = useState<Bill | null>(null)
  const [returnItems, setReturnItems] = useState<Record<string, number>>({})
  
  const [dateRange, setDateRange] = useState<'today' | 'weekly' | 'monthly' | 'custom'>('weekly')
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    fetchBills()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchBills = async () => {
    setLoading(true)
    try {
      let url = '/api/bills'
      if (startDate && endDate) {
        url += `?startDate=${startDate}T00:00:00.000Z&endDate=${endDate}T23:59:59.999Z`
      }
      const res = await fetch(url, { credentials: 'include' })
      let data = []
      if (res.ok) {
        try { data = await res.json() } catch(e) {}
      }
      if (!data.error && Array.isArray(data)) setBills(data)
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

  const openReturnModal = (bill: Bill) => {
    setReturnModalBill(bill)
    setReturnItems({})
  }

  const handleReturnSubmit = async () => {
    if (!returnModalBill) return
    const returns = Object.entries(returnItems)
      .map(([id, qty]) => ({ billItemId: id, quantity: qty }))
      .filter(r => r.quantity > 0)
      
    if (returns.length === 0) return
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bills/${returnModalBill.id}/return`, { credentials: 'include', method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returns })
      })
      if (res.ok) {
        alert('Returned successfully!')
        setReturnModalBill(null)
        fetchBills()
      } else {
        alert('Failed to return')
      }
    } catch(e) {
      alert('Error')
    }
  }

  useEffect(() => {
    if (dateRange !== 'custom') {
      fetchBills()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  // Analytics Computation
  const { totalRevenue, totalProfit, topProducts, chartData } = useMemo(() => {
    let rev = 0
    let prof = 0
    const productSales: Record<string, { name: string, qty: number, rev: number }> = {}
    const dailyData: Record<string, { date: string, revenue: number, profit: number }> = {}

    bills.forEach(bill => {
      rev += bill.totalAmount
      
      let billBuyCost = 0
      bill.items.forEach(item => {
        billBuyCost += (item.product.buyPrice * item.quantity)
        
        // Product Aggregation
        if (!productSales[item.product.id]) {
          productSales[item.product.id] = { name: item.product.name, qty: 0, rev: 0 }
        }
        productSales[item.product.id].qty += item.quantity
        productSales[item.product.id].rev += item.subtotal
      })
      
      const billProfit = bill.totalAmount - billBuyCost // totalAmount is after discounts
      prof += billProfit

      // Daily Aggregation
      const dateStr = format(new Date(bill.createdAt), 'MMM dd')
      if (!dailyData[dateStr]) dailyData[dateStr] = { date: dateStr, revenue: 0, profit: 0 }
      dailyData[dateStr].revenue += bill.totalAmount
      dailyData[dateStr].profit += billProfit
    })

    const top = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5)
    
    // Sort chart data ascending date order
    const sortedChartData = Object.values(dailyData).reverse() 

    return { totalRevenue: rev, totalProfit: prof, topProducts: top, chartData: sortedChartData }
  }, [bills])

  const handleExportExcel = () => {
    // 1. Transactions
    let csvContent = "TRANSACTIONS\n"
    csvContent += "Bill ID,Date,Customer,Payment Method,Total Items,Discount,Total Amount\n"
    bills.forEach(bill => {
      const itemsCount = bill.items.reduce((sum, i) => sum + i.quantity, 0)
      const dateStr = format(new Date(bill.createdAt), 'yyyy-MM-dd HH:mm')
      const customer = bill.customerName ? `"${bill.customerName}"` : 'Walk-in'
      csvContent += `${bill.id},${dateStr},${customer},${bill.paymentMethod},${itemsCount},${bill.discount},${bill.totalAmount}\n`
    })

    // 2. Summary
    csvContent += "\nSUMMARY\n"
    csvContent += `Total Revenue,${totalRevenue}\n`
    csvContent += `Total Profit,${totalProfit}\n`
    csvContent += `Total Invoices,${bills.length}\n`
    const totalItems = bills.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0)
    csvContent += `Total Items Sold,${totalItems}\n`

    // 3. Top Products
    csvContent += "\nTOP PRODUCTS\n"
    csvContent += "Rank,Product Name,Quantity Sold,Revenue\n"
    topProducts.forEach((prod, idx) => {
      csvContent += `${idx + 1},"${prod.name}",${prod.qty},${prod.rev}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `RetailShop_Report_${startDate}_to_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold flex items-center"><BarChart3 className="w-6 h-6 mr-2 text-blue-600" /> Reports & Analytics</h1>
           <p className="text-zinc-500 text-sm mt-1">Track your business performance and daily closing</p>
        </div>
        
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${activeTab === 'ANALYTICS' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-500' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <TrendingUp className="w-4 h-4 mr-2" /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab('DAILY_CLOSING')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${activeTab === 'DAILY_CLOSING' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-500' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <Receipt className="w-4 h-4 mr-2" /> Daily Closing
          </button>
        </div>
      </div>

      {activeTab === 'DAILY_CLOSING' && <DailyClosingReport />}

      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
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
        <button onClick={fetchBills} className="bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white px-6 py-2 rounded-xl flex items-center shadow-md active:scale-95 transition-all text-sm font-bold h-[38px]">
          Generate Report
        </button>
      </div>

      {loading && <div className="h-1 bg-blue-600/20 rounded-full overflow-hidden"><div className="h-full bg-blue-600 animate-pulse w-1/2"></div></div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center space-x-3 mb-2 relative z-10">
             <div className="p-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 rounded-lg"><DollarSign className="w-5 h-5" /></div>
             <p className="text-zinc-600 dark:text-zinc-400 font-medium">Total Revenue</p>
          </div>
          <h3 className="text-3xl font-bold mt-4 relative z-10">₹{totalRevenue.toFixed(2)}</h3>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center space-x-3 mb-2 relative z-10">
             <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
             <p className="text-zinc-600 dark:text-zinc-400 font-medium">Net Profit</p>
          </div>
          <h3 className="text-3xl font-bold mt-4 text-emerald-600 dark:text-emerald-500 relative z-10">₹{totalProfit.toFixed(2)}</h3>
          <p className="text-xs text-zinc-500 mt-2 relative z-10">{totalRevenue ? ((totalProfit/totalRevenue)*100).toFixed(1) : '0'}% Margin</p>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center space-x-3 mb-2 relative z-10">
             <div className="p-2 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400 rounded-lg"><FileText className="w-5 h-5" /></div>
             <p className="text-zinc-600 dark:text-zinc-400 font-medium">Total Invoices</p>
          </div>
          <h3 className="text-3xl font-bold mt-4 relative z-10">{bills.length}</h3>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center space-x-3 mb-2 relative z-10">
             <div className="p-2 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 rounded-lg"><PackageOpen className="w-5 h-5" /></div>
             <p className="text-zinc-600 dark:text-zinc-400 font-medium">Items Sold</p>
          </div>
          <h3 className="text-3xl font-bold mt-4 relative z-10">
             {bills.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0)}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="font-bold text-lg mb-6 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-zinc-400" /> Revenue & Profit Trend</h3>
            <div className="h-80 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} stroke="#a1a1aa" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} stroke="#a1a1aa" tickFormatter={(val) => `₹${val}`} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, undefined]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-400">No data available for this range</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm h-full">
            <h3 className="font-bold text-lg mb-6 flex items-center"><Award className="w-5 h-5 mr-2 text-amber-500" /> Top Selling Products</h3>
            {topProducts.length > 0 ? (
              <div className="space-y-5">
                {topProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between group p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : idx === 1 ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' : idx === 2 ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-none">{prod.name}</p>
                        <p className="text-xs text-zinc-500 mt-1">{prod.qty} units sold</p>
                      </div>
                    </div>
                    <p className="font-bold text-sm">₹{prod.rev.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-zinc-400">No products sold</div>
            )}
          </div>
        </div>
      </div>

      {/* Bill History Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <h3 className="font-semibold flex items-center"><FileText className="w-4 h-4 mr-2" /> Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/30 text-xs uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-6 font-medium">Bill ID</th>
                <th className="py-3 px-6 font-medium">Date</th>
                <th className="py-3 px-6 font-medium">Customer</th>
                <th className="py-3 px-6 font-medium text-center">Payment</th>
                <th className="py-3 px-6 font-medium text-right">Items</th>
                <th className="py-3 px-6 font-medium text-right">Discount</th>
                <th className="py-3 px-6 font-medium text-right">Total</th>
                <th className="py-3 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {bills.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-zinc-500">No bills found for this period.</td></tr>
              ) : bills.slice(0, 15).map((bill) => (
                <tr key={bill.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs text-zinc-500">{bill.id.slice(-8).toUpperCase()}</td>
                  <td className="py-4 px-6">{format(new Date(bill.createdAt), 'MMM d, yyyy HH:mm')}</td>
                  <td className="py-4 px-6 font-medium">{bill.customerName || <span className="text-zinc-400 italic font-normal">Walk-in</span>}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${bill.paymentMethod === 'UPI' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                      {bill.paymentMethod}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-medium">{bill.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                  </td>
                  <td className="py-4 px-6 text-right text-red-500">{bill.discount > 0 ? `-₹${bill.discount.toFixed(2)}` : '-'}</td>
                  <td className="py-4 px-6 text-right font-bold text-blue-600 dark:text-blue-500">₹{bill.totalAmount.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => openReturnModal(bill)} className="text-zinc-500 hover:text-blue-600 transition-colors p-1" title="Return Items"><CornerUpLeft className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {returnModalBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-xl font-bold flex items-center"><CornerUpLeft className="w-5 h-5 mr-2 text-blue-600" /> Return Items</h2>
                <p className="text-sm text-zinc-500 mt-1">Bill ID: {returnModalBill.id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setReturnModalBill(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/30 text-sm border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-2 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Product</th>
                    <th className="py-2 px-4 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Bought</th>
                    <th className="py-2 px-4 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Returned</th>
                    <th className="py-2 px-4 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {returnModalBill.items.map(item => {
                    const available = item.quantity - (item.returnedQuantity || 0)
                    return (
                    <tr key={item.id}>
                      <td className="py-3 px-4 font-medium">{item.product.name} <span className="text-xs text-zinc-500 ml-2">@ ₹{item.price}</span></td>
                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">{item.returnedQuantity || 0}</td>
                      <td className="py-3 px-4 text-right">
                        <input 
                          type="number" min="0" max={available}
                          value={returnItems[item.id] || ''}
                          onChange={e => {
                            let val = parseInt(e.target.value) || 0
                            if (val > available) val = available
                            if (val < 0) val = 0
                            setReturnItems(prev => ({ ...prev, [item.id]: val }))
                          }}
                          disabled={available === 0}
                          className="w-20 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-4 mt-auto">
               <button onClick={() => setReturnModalBill(null)} className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium">Cancel</button>
               <button onClick={handleReturnSubmit} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-colors font-medium">Process Return</button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  )
}

