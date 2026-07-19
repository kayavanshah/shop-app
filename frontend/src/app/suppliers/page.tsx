'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, User, X } from 'lucide-react'

type Supplier = {
  id: string
  name: string
  mobile: string | null
  whatsapp: string | null
  address: string | null
  gstNumber: string | null
  openingBalance: number
  notes: string | null
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  
  const [formData, setFormData] = useState({
    name: '', mobile: '', whatsapp: '', address: '', gstNumber: '', openingBalance: '0', notes: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers', { credentials: 'include', cache: 'no-store' })
      const data = await res.json()
      if (!data.error && Array.isArray(data)) setSuppliers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return
    const res = await fetch(`/api/suppliers/${id}`, { credentials: 'include', method: 'DELETE' })
    const data = await res.json()
    if (data.error) {
      alert(data.error)
    } else {
      fetchSuppliers()
    }
  }

  const openForm = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        mobile: supplier.mobile || '',
        whatsapp: supplier.whatsapp || '',
        address: supplier.address || '',
        gstNumber: supplier.gstNumber || '',
        openingBalance: supplier.openingBalance.toString(),
        notes: supplier.notes || ''
      })
    } else {
      setEditingSupplier(null)
      setFormData({ name: '', mobile: '', whatsapp: '', address: '', gstNumber: '', openingBalance: '0', notes: '' })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let res;
      if (editingSupplier) {
        res = await fetch(`/api/suppliers/${editingSupplier.id}`, { credentials: 'include', method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
      } else {
        res = await fetch('/api/suppliers', { credentials: 'include', method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        alert('Error saving: ' + (errorData.error || res.statusText));
        return;
      }
      
      setIsModalOpen(false)
      fetchSuppliers()
    } catch (err: any) {
      alert('Network Error: ' + err.message);
    }
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.mobile && s.mobile.includes(searchTerm)) ||
    (s.gstNumber && s.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold flex items-center"><User className="w-6 h-6 mr-2 text-blue-600" /> Supplier Management</h1>
           <p className="text-zinc-500 text-sm mt-1">Manage your suppliers, contact details, and balances</p>
        </div>
        <button 
          onClick={() => openForm()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search suppliers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/30 text-xs uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400">Supplier Name</th>
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400">Contact</th>
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400">GST Number</th>
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Opening Bal.</th>
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {loading ? (
                <tr>
                   <td colSpan={5} className="text-center py-8 text-zinc-500">Loading suppliers...</td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                   <td colSpan={5} className="text-center py-8 text-zinc-500">No suppliers found.</td>
                </tr>
              ) : (
                filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-blue-600 dark:text-blue-400">{supplier.name}</td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400">
                      {supplier.mobile && <div>📱 {supplier.mobile}</div>}
                      {supplier.whatsapp && <div className="text-emerald-600 dark:text-emerald-500 text-xs mt-1">💬 WA: {supplier.whatsapp}</div>}
                      {!supplier.mobile && !supplier.whatsapp && '-'}
                    </td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{supplier.gstNumber || '-'}</td>
                    <td className="py-4 px-6 text-right font-medium text-amber-600 dark:text-amber-500">₹{supplier.openingBalance.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openForm(supplier)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(supplier.id)} className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg text-zinc-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Supplier Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Number</label>
                  <input type="text" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                  <input type="text" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GST Number</label>
                  <input type="text" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Opening Balance (₹)</label>
                  <input type="number" step="0.01" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm"></textarea>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-colors font-bold text-sm">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

