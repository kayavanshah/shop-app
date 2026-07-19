'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, AlertCircle, X, Settings2 } from 'lucide-react'

type Product = {
  id: string
  name: string
  category: string | null
  buyPrice: number
  sellPrice: number
  quantity: number
  minStock: number
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [adjustData, setAdjustData] = useState({ type: 'REMOVE', quantity: '', reason: 'BROKEN' })

  const [formData, setFormData] = useState({
    name: '', category: '', buyPrice: '', sellPrice: '', quantity: '', minStock: '10'
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
        return
      }
      
      if ((e.key === 'a' || e.key === 'A') && !isModalOpen) {
        e.preventDefault()
        openForm()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/products', { credentials: 'include' })
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (e) {
      setProducts([])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`, { credentials: 'include', method: 'DELETE' })
    fetchProducts()
  }

  const openForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        category: product.category || '',
        buyPrice: product.buyPrice.toString(),
        sellPrice: product.sellPrice.toString(),
        quantity: product.quantity.toString(),
        minStock: product.minStock?.toString() || '10'
      })
    } else {
      setEditingProduct(null)
      setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', quantity: '', minStock: '10' })
    }
    setIsModalOpen(true)
  }

  const openAdjust = (product: Product) => {
    setAdjustingProduct(product)
    setAdjustData({ type: 'REMOVE', quantity: '', reason: 'BROKEN' })
    setIsAdjustModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let res;
      if (editingProduct) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${editingProduct.id}`, { credentials: 'include', method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
      } else {
        res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/products', { credentials: 'include', method: 'POST',
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
      fetchProducts()
    } catch (err: any) {
      alert('Network Error: ' + err.message);
    }
  }

  const handleAdjustSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustingProduct) return

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/inventory/adjust', { credentials: 'include', method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustingProduct.id,
          type: adjustData.type,
          quantity: Number(adjustData.quantity),
          reason: adjustData.reason
        })
      })

      if (res.ok) {
        fetchProducts()
        setIsAdjustModalOpen(false)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to adjust stock')
      }
    } catch (e) {
      alert('Error adjusting stock')
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <button 
          onClick={() => openForm()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-sm border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400">Name</th>
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400">Category</th>
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Buy Price</th>
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Sell Price</th>
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Qty</th>
                <th className="py-3 px-6 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                   <td colSpan={6} className="text-center py-8 text-zinc-500">Loading products...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                   <td colSpan={6} className="text-center py-8 text-zinc-500">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium flex items-center gap-2">
                        {product.name}
                        {product.quantity < product.minStock && (
                          <span title="Low stock"><AlertCircle className="w-4 h-4 text-amber-500" /></span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-zinc-600 dark:text-zinc-400">{product.category || '-'}</td>
                    <td className="py-4 px-6 text-right text-sm">₹{product.buyPrice.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right text-sm">₹{product.sellPrice.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.quantity < product.minStock ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                         {product.quantity}
                       </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openAdjust(product)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors" title="Adjust Stock">
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => openForm(product)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors" title="Edit Product">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg text-zinc-500 transition-colors" title="Delete">
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
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Buy Price *</label>
                  <input required type="number" step="0.01" value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sell Price *</label>
                  <input required type="number" step="0.01" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                  <input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Stock Limit *</label>
                  <input required type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-colors font-medium">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold">Adjust Stock</h2>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdjustSave} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-zinc-500 mb-4">Adjusting inventory for: <strong className="text-zinc-900 dark:text-zinc-100">{adjustingProduct.name}</strong> (Current: {adjustingProduct.quantity})</p>
                <label className="block text-sm font-medium mb-1">Adjustment Type</label>
                <select value={adjustData.type} onChange={e => setAdjustData({...adjustData, type: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-4">
                  <option value="REMOVE" className="bg-white dark:bg-zinc-900 text-black dark:text-white">Remove Stock (Reduce)</option>
                  <option value="ADD" className="bg-white dark:bg-zinc-900 text-black dark:text-white">Add Stock (Increase)</option>
                </select>

                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input required type="number" min="1" value={adjustData.quantity} onChange={e => setAdjustData({...adjustData, quantity: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-4" />

                <label className="block text-sm font-medium mb-1">Reason</label>
                <select value={adjustData.reason} onChange={e => setAdjustData({...adjustData, reason: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-4">
                  <option value="BROKEN" className="bg-white dark:bg-zinc-900 text-black dark:text-white">Broken</option>
                  <option value="DAMAGED" className="bg-white dark:bg-zinc-900 text-black dark:text-white">Damaged</option>
                  <option value="LOST" className="bg-white dark:bg-zinc-900 text-black dark:text-white">Lost</option>
                  <option value="PERSONAL_USE" className="bg-white dark:bg-zinc-900 text-black dark:text-white">Personal Use</option>
                  <option value="FOUND" className="bg-white dark:bg-zinc-900 text-black dark:text-white">Found</option>
                  <option value="OTHER" className="bg-white dark:bg-zinc-900 text-black dark:text-white">Other</option>
                </select>
              </div>
              
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-colors font-medium">
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

