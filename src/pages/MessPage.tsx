import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import MessCard from '../components/mess/MessCard'
import { fetchMesses } from '../lib/platformData'
import { cn, messStatusConfig } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import type { MessStatus } from '../types'

export default function MessPage() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [foodType, setFoodType] = useState(searchParams.get('foodType') || '')
  const [status, setStatus] = useState<MessStatus | ''>('')
  const [maxPrice, setMaxPrice] = useState('')
  const [city, setCity] = useState(searchParams.get('city') || '')

  const [allMesses, setAllMesses] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        setAllMesses(await fetchMesses())
      } catch (error) {
        console.error('Failed to load messes from Supabase:', error)
        setAllMesses([])
      }
    }

    load()
  }, [])

  useEffect(() => {
    const qParam = searchParams.get('q') || ''
    const foodTypeParam = searchParams.get('foodType') || ''
    const cityParam = searchParams.get('city') || ''
    if (qParam !== search) setSearch(qParam)
    if (foodTypeParam !== foodType) setFoodType(foodTypeParam)
    if (cityParam !== city) setCity(cityParam)
  }, [searchParams])

  const filtered = allMesses.filter(m => {
    // Strictly hide unverified / unapproved or rejected messes from public platform view
    if (m.rejected === true || !m.verified) return false

    if (search) {
      const q = search.toLowerCase()
      const matchesText = m.name.toLowerCase().includes(q) || 
                          m.address.toLowerCase().includes(q) || 
                          m.city.toLowerCase().includes(q) ||
                          (m.description && m.description.toLowerCase().includes(q))
      if (!matchesText) return false
    }
    if (city && m.city.toLowerCase() !== city.toLowerCase()) return false
    if (foodType && m.food_type !== foodType) return false
    if (status && m.status !== status) return false
    if (maxPrice && Number(m.monthly_charge || 0) > Number(maxPrice)) return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 via-orange-600 to-red-600 text-white py-4 sm:py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-xl sm:text-3xl font-display font-extrabold mb-1 sm:mb-1.5 leading-tight tracking-tight drop-shadow-sm">Find Your Perfect Mess</h1>
            <p className="text-white/90 text-xs sm:text-sm mb-3 sm:mb-4 mx-auto leading-normal font-medium max-w-xl">Daily menu updates, digital records & verified student messes</p>
            <div className="max-w-md mx-auto relative group">
              <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search mess by name or location..."
                className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 rounded-xl bg-white text-slate-900 placeholder-slate-400 outline-none shadow-md focus:ring-2 focus:ring-brand-500/20 transition-all text-xs sm:text-sm font-medium" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Zomato Style Filters */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar pb-2 pt-2">
          {/* Filter Icon button */}
          <button className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          <button
            onClick={() => { setSearch(''); setFoodType(''); setStatus(''); setMaxPrice(''); setCity('') }}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" /> Clear Filters
          </button>
          
          {/* Food Type Segmented Control (Zomato style) */}
          <div className="flex-shrink-0 flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full shadow-sm overflow-hidden p-0.5">
            <button 
              onClick={() => setFoodType('veg')}
              className={cn(
                "px-4 py-1 text-sm font-medium transition-all rounded-full",
                foodType === 'veg' 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              Pure Veg
            </button>
            <button 
              onClick={() => setFoodType('')}
              className={cn(
                "px-4 py-1 text-sm font-medium transition-all rounded-full",
                foodType === '' 
                  ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-white" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              Both
            </button>
            <button 
              onClick={() => setFoodType('non_veg')}
              className={cn(
                "px-4 py-1 text-sm font-medium transition-all rounded-full",
                foodType === 'non_veg' 
                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              Non-Veg
            </button>
          </div>

          {/* Status Toggle - Open */}
          <button 
            onClick={() => setStatus(status === 'open' ? '' : 'open')}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors shadow-sm",
              status === 'open' 
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            Open Now
          </button>

          {/* Status Toggle - Closed */}
          <button 
            onClick={() => setStatus(status === 'closed' ? '' : 'closed')}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors shadow-sm",
              status === 'closed' 
                ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            Closed
          </button>

          {/* Max Price Dropdown styled as pill */}
          <div className="flex-shrink-0 relative">
            <select 
              value={maxPrice} 
              onChange={e => setMaxPrice(e.target.value)}
              className={cn(
                "appearance-none pl-3.5 pr-8 py-1.5 rounded-full border text-sm font-medium transition-colors outline-none cursor-pointer shadow-sm",
                maxPrice 
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400" 
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <option value="">Price: Any</option>
              <option value="2500">Under ₹2500</option>
              <option value="3000">Under ₹3000</option>
              <option value="3500">Under ₹3500</option>
              <option value="4000">Under ₹4000</option>
              <option value="5000">Under ₹5000</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">{filtered.length} Mess Services Found</h2>
            {city && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-semibold">
                📍 {city}
                <button onClick={() => setCity('')} className="hover:text-brand-900 dark:hover:text-brand-100 font-bold ml-1">✕</button>
              </span>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No mess found</h3>
            <button onClick={() => { setSearch(''); setFoodType(''); setStatus(''); setMaxPrice(''); setCity('') }} className="btn-primary mt-4">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((mess, i) => <MessCard key={mess.id} mess={mess} index={i} />)}
          </div>
        )}

       
       
      </div>
    </div>
  )
}
