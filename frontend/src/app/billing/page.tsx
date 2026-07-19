'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Trash2, ShoppingCart, User } from 'lucide-react'

type Product = { id: string, name: string, sellPrice: number, quantity: number }
type BillItem = { productId: string, name: string, quantity: number, price: number, subtotal: number }

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [inputQty, setInputQty] = useState('1')
  
  const [items, setItems] = useState<BillItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [discount, setDiscount] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
      fetch(`/api/products?q=${encodeURIComponent(searchTerm)}`, { credentials: 'include', cache: 'no-store' })
        .then(async res => {
          if (!res.ok) return []
          try {
            return await res.json()
          } catch(e) { return [] }
        })
        .then(data => {
            if(!data.error && Array.isArray(data)) setSuggestions(data)
            else setSuggestions([])
        })
        .catch(() => setSuggestions([]))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm])

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setSearchTerm(product.name)
    setShowSuggestions(false)
    setInputQty('1')
  }

  const handleAddItem = () => {
    if (!selectedProduct) return
    const qty = parseInt(inputQty)
    if (qty <= 0 || isNaN(qty)) return

    if (qty > selectedProduct.quantity) {
      alert(`Only ${selectedProduct.quantity} units available in stock.`)
      return
    }

    const existingItem = items.find(i => i.productId === selectedProduct.id)
    if (existingItem) {
      if (existingItem.quantity + qty > selectedProduct.quantity) {
        alert('Cannot add more than available stock.')
        return
      }
      setItems(items.map(i => i.productId === selectedProduct.id 
        ? { ...i, quantity: i.quantity + qty, subtotal: (i.quantity + qty) * i.price } 
        : i))
    } else {
      setItems([...items, {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.sellPrice,
        quantity: qty,
        subtotal: qty * selectedProduct.sellPrice
      }])
    }
    
    setSelectedProduct(null)
    setSearchTerm('')
    setInputQty('1')
  }

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId))
  }

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0)
  const discountAmount = parseFloat(discount) || 0
  const total = subtotal - discountAmount

  const handleSubmitBill = async () => {
    if (items.length === 0) return
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/bills', { credentials: 'include', method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          discount: discountAmount,
          totalAmount: total,
          paymentMethod,
          items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.subtotal
          }))
        })
      })
      
      if (res.ok) {
        alert('Bill created successfully!')
        setItems([])
        setCustomerName('')
        setDiscount('0')
      } else {
        alert('Failed to create bill')
      }
    } catch (e) {
      alert('Error creating bill')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3' || (e.ctrlKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start h-full">
      <div className="flex-1 space-y-6 w-full">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center"><ShoppingCart className="w-5 h-5 mr-2" /> Add Products</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative" ref={searchRef}>
              <label className="block text-sm font-medium mb-1">Search Product</label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <input 
                  ref={searchInputRef}
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
                      disabled={p.quantity <= 0}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex justify-between items-center transition-colors disabled:opacity-50"
                    >
                      <span className="font-medium text-sm">{p.name} <span className="text-zinc-500 text-xs ml-2">(₹{p.sellPrice})</span></span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.quantity > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                        {p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}
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
            
            <div className="flex items-end">
              <button 
                onClick={handleAddItem}
                disabled={!selectedProduct}
                className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Add
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="font-semibold">Current Bill Items</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/30 text-xs uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-3 px-6 font-medium">Product</th>
                  <th className="py-3 px-6 font-medium text-right">Price</th>
                  <th className="py-3 px-6 font-medium text-right">Qty</th>
                  <th className="py-3 px-6 font-medium text-right">Subtotal</th>
                  <th className="py-3 px-6 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-zinc-500">No items added to bill.</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <td className="py-3 px-6 font-medium">{item.name}</td>
                    <td className="py-3 px-6 text-right">₹{item.price.toFixed(2)}</td>
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
        <h2 className="text-lg font-bold mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">Bill Summary</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center text-zinc-600 dark:text-zinc-400"><User className="w-4 h-4 mr-2" /> Customer Name (Optional)</label>
            <input 
              type="text" 
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Walk-in customer"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-600 dark:text-zinc-400">Discount (₹)</label>
            <input 
              type="number" 
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">Payment Method</label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" value="CASH" checked={paymentMethod === 'CASH'} onChange={e => setPaymentMethod(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium">Cash</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" value="UPI" checked={paymentMethod === 'UPI'} onChange={e => setPaymentMethod(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium">UPI</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3 py-4 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 mb-6 font-medium text-sm">
          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-red-500">
            <span>Discount</span>
            <span>-₹{discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
            <span>Total</span>
            <span className="text-blue-600 dark:text-blue-500">₹{Math.max(0, total).toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={handleSubmitBill}
          disabled={items.length === 0 || isSubmitting}
          className="w-full py-3 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 font-bold"
        >
          {isSubmitting ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </div>
  )
}

