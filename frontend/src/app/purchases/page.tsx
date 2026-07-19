'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Trash2, Truck, User } from 'lucide-react'

type Product = { id: string, name: string, buyPrice: number, quantity: number }
type PurchaseItem = { productId: string, name: string, quantity: number, buyPrice: number, subtotal: number }

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [inputQty, setInputQty] = useState('1')
  const [inputBuyPrice, setInputBuyPrice] = useState('')
  
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + '/api/suppliers', { credentials: 'include' })
      .then(async res => {
      if (!res.ok) return {};
      try { return await res.json() } catch(e) { return {} }
    })
      .then(data => {
        if (!data.error) setSuppliers(data)
      })
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?q=${encodeURIComponent(searchTerm)}`, { credentials: 'include' })
        .then(async res => {
      if (!res.ok) return {};
      try { return await res.json() } catch(e) { return {} }
    })
        .then(data => {
            if(!data.error) setSuggestions(data)
        })
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm])

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setSearchTerm(product.name)
    setInputBuyPrice(product.buyPrice.toString())
    setShowSuggestions(false)
    setInputQty('1')
  }

  const handleAddItem = () => {
    let productToAdd = selectedProduct

    // If no product is explicitly selected but they typed something
    if (!productToAdd) {
      if (suggestions.length === 1) {
        productToAdd = suggestions[0]
      } else if (suggestions.length > 1) {
        const exactMatch = suggestions.find(s => s.name.toLowerCase() === searchTerm.toLowerCase())
        if (exactMatch) {
          productToAdd = exactMatch
        } else {
          alert('Please select a specific product from the dropdown list.')
          return
        }
      } else {
        alert('Product not found in inventory! Please add it to the Inventory first before purchasing.')
        return
      }
    }

    const qty = parseInt(inputQty)
    const price = parseFloat(inputBuyPrice)
    
    if (qty <= 0 || isNaN(qty) || isNaN(price) || price < 0) {
      alert('Please enter valid quantity and buy price.')
      return
    }

    const existingItem = items.find(i => i.productId === productToAdd!.id)
    if (existingItem) {
      setItems(items.map(i => i.productId === productToAdd!.id 
        ? { ...i, quantity: i.quantity + qty, buyPrice: price, subtotal: (i.quantity + qty) * price } 
        : i))
    } else {
      setItems([...items, {
        productId: productToAdd!.id,
        name: productToAdd!.name,
        buyPrice: price,
        quantity: qty,
        subtotal: qty * price
      }])
    }
    
    setSelectedProduct(null)
    setSearchTerm('')
    setInputQty('1')
    setInputBuyPrice('')
  }

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId))
  }

  const totalAmount = items.reduce((acc, item) => acc + item.subtotal, 0)

  const handleSubmitPurchase = async () => {
    if (items.length === 0) return
    if (!selectedSupplierId) {
      alert('Please select a supplier.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/purchases', { credentials: 'include', method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          totalAmount,
          items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            buyPrice: i.buyPrice,
            subtotal: i.subtotal
          }))
        })
      })
      
      if (res.ok) {
        alert('Purchase saved successfully! Stock has been updated.')
        setItems([])
        setSelectedSupplierId('')
      } else {
        alert('Failed to save purchase')
      }
    } catch (e) {
      alert('Error saving purchase')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start h-full">
      <div className="flex-1 space-y-6 w-full">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center"><Truck className="w-5 h-5 mr-2" /> Add Products to Purchase</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative" ref={searchRef}>
              <label className="block text-sm font-medium mb-1">Search Product</label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
              </div>
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {suggestions.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex justify-between items-center transition-colors"
                    >
                      <span className="font-medium text-sm">{p.name} <span className="text-zinc-500 text-xs ml-2">(Current Buy: ₹{p.buyPrice})</span></span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                        {p.quantity} in stock
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="w-24">
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input 
                type="number" 
                min="1"
                value={inputQty}
                onChange={e => setInputQty(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div className="w-32">
              <label className="block text-sm font-medium mb-1">Buy Price (₹)</label>
              <input 
                type="number" 
                step="0.01"
                value={inputBuyPrice}
                onChange={e => setInputBuyPrice(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={handleAddItem}
                className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Add
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="font-semibold">Current Purchase Items</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/30 text-xs uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-3 px-6 font-medium">Product</th>
                  <th className="py-3 px-6 font-medium text-right">Buy Price</th>
                  <th className="py-3 px-6 font-medium text-right">Qty</th>
                  <th className="py-3 px-6 font-medium text-right">Subtotal</th>
                  <th className="py-3 px-6 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-zinc-500">No items added to purchase order.</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <td className="py-3 px-6 font-medium">{item.name}</td>
                    <td className="py-3 px-6 text-right">₹{item.buyPrice.toFixed(2)}</td>
                    <td className="py-3 px-6 text-right">{item.quantity}</td>
                    <td className="py-3 px-6 text-right font-medium">₹{item.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-6 text-right">
                      <button onClick={() => removeItem(item.productId)} className="text-zinc-400 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-24">
        <h2 className="text-lg font-bold mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">Purchase Summary</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center text-zinc-600 dark:text-zinc-400"><User className="w-4 h-4 mr-2" /> Select Supplier *</label>
            <select
              value={selectedSupplierId}
              onChange={e => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-2">New supplier? Add them in the Suppliers tab first.</p>
          </div>
        </div>

        <div className="space-y-3 py-4 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 mb-6 font-medium text-sm">
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
            <span>Total</span>
            <span className="text-blue-600 dark:text-blue-500">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={handleSubmitPurchase}
          disabled={items.length === 0 || isSubmitting}
          className="w-full py-3 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 font-bold"
        >
          {isSubmitting ? 'Saving...' : 'Save Purchase Entry'}
        </button>
      </div>
    </div>
  )
}

