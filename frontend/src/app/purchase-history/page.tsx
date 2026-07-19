'use client'

import { useState, useEffect } from 'react'
import { FileText, Calendar, Search, Truck, CheckCircle2, Clock, Eye, X, CornerUpLeft } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

type Product = { id: string, name: string }
type PurchaseItem = { id: string, quantity: number, buyPrice: number, subtotal: number, product: Product }
type Purchase = { id: string, supplierName: string | null, supplier: { name: string } | null, totalAmount: number, status: string, createdAt: string, items: PurchaseItem[] }

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)

  const [dateRange, setDateRange] = useState<'today' | 'weekly' | 'monthly' | 'custom'>('weekly')
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      let url = '/api/purchases?'
      if (startDate && endDate) url += `startDate=${startDate}T00:00:00.000Z&endDate=${endDate}T23:59:59.999Z&`
      if (statusFilter !== 'ALL') url += `status=${statusFilter}`
      
      const res = await fetch(url, { credentials: 'include' })
      let data: any = []
      if (res.ok) {
        try { data = await res.json() } catch(e) {}
      }
      if (!data.error && Array.isArray(data)) setPurchases(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (dateRange !== 'custom') {
      fetchPurchases()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, statusFilter])

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

  const handleStatusToggle = async (purchaseId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/purchases/${purchaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchPurchases()
        if (selectedPurchase && selectedPurchase.id === purchaseId) {
          setSelectedPurchase({ ...selectedPurchase, status: newStatus })
        }
      } else {
        alert('Failed to update status')
      }
    } catch (e) {
      alert('Error updating status')
    }
  }

  const filteredPurchases = purchases.filter(p => 
    (p.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold flex items-center"><Truck className="w-6 h-6 mr-2 text-blue-600" /> Purchase History</h1>
           <p className="text-zinc-500 text-sm mt-1">Track and manage past purchases from suppliers</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 ml-auto sm:ml-0">
          <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <button onClick={() => handleQuickFilter('today')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateRange === 'today' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}>Today</button>
            <button onClick={() => handleQuickFilter('weekly')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateRange === 'weekly' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}>7 Days</button>
            <button onClick={() => handleQuickFilter('monthly')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateRange === 'monthly' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}>This Month</button>
          </div>
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
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Status</label>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all h-[38px] min-w-[120px]"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
        <button onClick={fetchPurchases} className="bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white px-6 py-2 rounded-xl flex items-center shadow-md active:scale-95 transition-all text-sm font-bold h-[38px]">
          Generate
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by supplier or purchase ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/30 text-xs uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-6 font-medium">Purchase ID</th>
                <th className="py-3 px-6 font-medium">Date</th>
                <th className="py-3 px-6 font-medium">Supplier</th>
                <th className="py-3 px-6 font-medium">Items</th>
                <th className="py-3 px-6 font-medium text-right">Total Bill</th>
                <th className="py-3 px-6 font-medium text-center">Status</th>
                <th className="py-3 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-zinc-500">Loading purchases...</td></tr>
              ) : filteredPurchases.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-zinc-500">No purchases found.</td></tr>
              ) : filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs text-zinc-500">{purchase.id.slice(-8).toUpperCase()}</td>
                  <td className="py-4 px-6">{format(new Date(purchase.createdAt), 'MMM d, yyyy HH:mm')}</td>
                  <td className="py-4 px-6 font-medium">{purchase.supplier ? purchase.supplier.name : (purchase.supplierName || 'Unknown')}</td>
                  <td className="py-4 px-6">
                    <div className="text-xs text-zinc-500 max-w-[200px] truncate" title={purchase.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}>
                      {purchase.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-blue-600 dark:text-blue-500">
                    ₹{purchase.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${purchase.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {purchase.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                      {purchase.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button 
                        onClick={() => handleStatusToggle(purchase.id, purchase.status)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors border border-blue-200 dark:border-blue-900/50 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20"
                      >
                        Mark {purchase.status === 'COMPLETED' ? 'Pending' : 'Completed'}
                      </button>
                      <button 
                        onClick={() => setSelectedPurchase(purchase)}
                        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors p-1" title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-xl font-bold flex items-center"><FileText className="w-5 h-5 mr-2 text-blue-600" /> Purchase Details</h2>
                <div className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <p><span className="font-semibold text-zinc-900 dark:text-white">ID:</span> {selectedPurchase.id.slice(-8).toUpperCase()}</p>
                  <p><span className="font-semibold text-zinc-900 dark:text-white">Date:</span> {format(new Date(selectedPurchase.createdAt), 'MMM d, yyyy HH:mm')}</p>
                  <p><span className="font-semibold text-zinc-900 dark:text-white">Supplier:</span> {selectedPurchase.supplier ? selectedPurchase.supplier.name : (selectedPurchase.supplierName || 'Unknown')}</p>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-zinc-900 dark:text-white">Status:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${selectedPurchase.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {selectedPurchase.status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/30 text-sm border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400">Product</th>
                    <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Buy Price</th>
                    <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Quantity</th>
                    <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {selectedPurchase.items.map(item => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <td className="py-3 px-6 font-medium text-sm">{item.product.name}</td>
                      <td className="py-3 px-6 text-right text-sm">₹{item.buyPrice.toFixed(2)}</td>
                      <td className="py-3 px-6 text-right text-sm">{item.quantity}</td>
                      <td className="py-3 px-6 text-right text-sm font-medium">₹{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
              <button 
                onClick={() => handleStatusToggle(selectedPurchase.id, selectedPurchase.status)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors font-medium text-sm"
              >
                Mark as {selectedPurchase.status === 'COMPLETED' ? 'Pending' : 'Completed'}
              </button>
              
              <div className="text-right">
                <span className="text-sm text-zinc-500 mr-4">Total Amount</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-500">₹{selectedPurchase.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

