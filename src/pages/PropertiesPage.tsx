import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, Grid3X3, List, Wifi, Zap, Shield, Car, Bath, Book } from 'lucide-react'
import PropertyCard from '../components/property/PropertyCard'
import { usePropertyStore } from '../store/propertyStore'
import { useAuthStore } from '../store/authStore'
import type { PropertyType } from '../types'
import { cn, propertyTypeLabels } from '../lib/utils'

const propertyTypes = [
  { value: '' as PropertyType | '', label: 'All' },
  { value: 'pg' as PropertyType, label: 'PG' },
  { value: 'hostel' as PropertyType, label: 'Hostel' },
  { value: 'flat' as PropertyType, label: 'Flat' },
  { value: 'shared_room' as PropertyType, label: 'Shared Room' },
  { value: 'private_room' as PropertyType, label: 'Private Room' },
]

const genderOptions = [
  { value: '', label: 'Any Gender' },
  { value: 'male', label: '👨 Boys' },
  { value: 'female', label: '👩 Girls' },
  { value: 'any', label: '👥 Co-ed' },
]

const amenitiesConfig = [
  { key: 'wifi', icon: Wifi, label: 'WiFi' },
  { key: 'ac', icon: Zap, label: 'AC' },
  { key: 'security', icon: Shield, label: 'Security' },
  { key: 'parking', icon: Car, label: 'Parking' },
  { key: 'attached_bathroom', icon: Bath, label: 'Bathroom' },
  { key: 'study_table', icon: Book, label: 'Study Table' },
]

export default function PropertiesPage() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedType, setSelectedType] = useState<PropertyType | ''>((searchParams.get('type') as PropertyType) || '')
  const [gender, setGender] = useState(searchParams.get('gender') || '')
  const [minRent, setMinRent] = useState(searchParams.get('minRent') || '')
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [amenityFilters, setAmenityFilters] = useState<Record<string, boolean>>(() => {
    const ac = searchParams.get('ac') === 'true'
    const initial: Record<string, boolean> = {}
    if (ac) initial.ac = true
    return initial
  })
  const [availableOnly, setAvailableOnly] = useState(false)

  const { properties, loadProperties } = usePropertyStore()
  const { initialized } = useAuthStore()

  useEffect(() => {
    void loadProperties()
  }, [loadProperties])

  // Synchronize state when searchParams change
  useEffect(() => {
    const qParam = searchParams.get('q') || ''
    const typeParam = (searchParams.get('type') as PropertyType) || ''
    const genderParam = searchParams.get('gender') || ''
    const minRentParam = searchParams.get('minRent') || ''
    const maxRentParam = searchParams.get('maxRent') || ''
    const cityParam = searchParams.get('city') || ''
    const acParam = searchParams.get('ac') === 'true'

    if (qParam !== search) setSearch(qParam)
    if (typeParam !== selectedType) setSelectedType(typeParam)
    if (genderParam !== gender) setGender(genderParam)
    if (minRentParam !== minRent) setMinRent(minRentParam)
    if (maxRentParam !== maxRent) setMaxRent(maxRentParam)
    if (cityParam !== city) setCity(cityParam)
    if (acParam && !amenityFilters.ac) setAmenityFilters(prev => ({ ...prev, ac: true }))
  }, [searchParams])

  const filtered = useMemo(() => {
    const fortyFiveDaysAgo = new Date()
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45)
    
    // Filter out unapproved student property requests until admin approves them. Regular owner listings & approved posts remain visible.
    let result = properties.filter(p => {
      if ((p as any).rejected === true) return false
      const isStudentPost = (p as any).is_student_request === true || p.profiles?.role === 'student'
      if (isStudentPost && !p.verified) return false
      if (p.created_at && !isNaN(new Date(p.created_at).getTime()) && new Date(p.created_at) < fortyFiveDaysAgo) return false
      return true
    })
    
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p => {
        const matchesDirect = (p.title || '').toLowerCase().includes(q) || 
                              (p.address || '').toLowerCase().includes(q) || 
                              (p.city || '').toLowerCase().includes(q) ||
                              (p.property_type || '').toLowerCase().includes(q)
        if (matchesDirect) return true

        // Keyword search matching
        const isPg = q.includes('pg')
        const isHostel = q.includes('hostel')
        const isFlat = q.includes('flat')
        const isGirls = q.includes('girl') || q.includes('female')
        const isBoys = q.includes('boy') || q.includes('male')
        const isAc = q.includes('ac')

        let matchesKeyword = false
        if (isPg && p.property_type === 'pg') matchesKeyword = true
        if (isHostel && p.property_type === 'hostel') matchesKeyword = true
        if (isFlat && p.property_type === 'flat') matchesKeyword = true
        if (isGirls && (p.gender_preference === 'female' || p.gender_preference === 'any')) matchesKeyword = true
        if (isBoys && (p.gender_preference === 'male' || p.gender_preference === 'any')) matchesKeyword = true
        const rawAm = p.amenities
        const pAm = typeof rawAm === 'string' ? (() => { try { return JSON.parse(rawAm) } catch { return {} } })() : (rawAm || {})
        if (isAc && pAm.ac) matchesKeyword = true

        const rentNumberMatch = q.match(/\d+/)
        if (rentNumberMatch && matchesKeyword) {
          const maxTarget = parseInt(rentNumberMatch[0], 10)
          if (p.rent > maxTarget + 2000) return false
        }

        return matchesKeyword
      })
    }
    if (city) {
      result = result.filter(p => p.city.toLowerCase() === city.toLowerCase())
    }
    if (selectedType) result = result.filter(p => p.property_type === selectedType)
    if (gender) result = result.filter(p => p.gender_preference === gender || p.gender_preference === 'any')
    if (minRent) result = result.filter(p => p.rent >= Number(minRent))
    if (maxRent) result = result.filter(p => p.rent <= Number(maxRent))
    if (availableOnly) result = result.filter(p => p.availability)
    Object.entries(amenityFilters).forEach(([key, val]) => {
      if (val) result = result.filter(p => {
        const rawAm = p.amenities
        const pAm = typeof rawAm === 'string' ? (() => { try { return JSON.parse(rawAm) } catch { return {} } })() : (rawAm || {})
        return Boolean(pAm[key])
      })
    })
    if (sortBy === 'rent_low') result.sort((a, b) => a.rent - b.rent)
    else if (sortBy === 'rent_high') result.sort((a, b) => b.rent - a.rent)
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating)
    return result
  }, [search, city, selectedType, gender, minRent, maxRent, sortBy, amenityFilters, availableOnly, properties])

  const activeFilters = [selectedType, gender, minRent, maxRent, availableOnly, city].filter(Boolean).length + Object.values(amenityFilters).filter(Boolean).length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
      {/* Sticky Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search PGs, hostels, flats..." className="input-field pl-10 py-2.5" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all',
                  showFilters ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400')}>
                <SlidersHorizontal className="w-4 h-4" />
                Filters {activeFilters > 0 && <span className="bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFilters}</span>}
              </button>
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={cn('p-2.5', viewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-slate-400')}><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={cn('p-2.5', viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-slate-400')}><List className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Gender</label>
                  <div className="flex flex-wrap gap-2">
                    {genderOptions.map(g => (
                      <button key={g.value} onClick={() => setGender(g.value)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          gender === g.value ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400')}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Rent (₹/month)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={minRent} onChange={e => setMinRent(e.target.value)} placeholder="Min" className="input-field py-1.5 w-24 text-sm" />
                    <span className="text-slate-400">–</span>
                    <input type="number" value={maxRent} onChange={e => setMaxRent(e.target.value)} placeholder="Max" className="input-field py-1.5 w-24 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {amenitiesConfig.map(({ key, icon: Icon, label }) => (
                      <button key={key} onClick={() => setAmenityFilters(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          amenityFilters[key] ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400')}>
                        <Icon className="w-3 h-3" />{label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} className="w-4 h-4 accent-brand-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Available only</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Type Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {propertyTypes.map(t => (
            <button key={t.value} onClick={() => setSelectedType(t.value)}
              className={cn('px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all',
                selectedType === t.value ? 'bg-brand-500 text-white border-brand-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-400')}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              {selectedType ? propertyTypeLabels[selectedType] : 'All Properties'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-slate-500">{filtered.length} results found</p>
              {city && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-semibold">
                  📍 {city}
                  <button onClick={() => setCity('')} className="hover:text-brand-900 dark:hover:text-brand-100 font-bold ml-1">✕</button>
                </span>
              )}
            </div>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field py-1.5 text-sm w-44">
            <option value="relevance">Relevance</option>
            <option value="rent_low">Rent: Low to High</option>
            <option value="rent_high">Rent: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No properties found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your filters</p>
            <button onClick={() => { setSearch(''); setSelectedType(''); setGender(''); setMinRent(''); setMaxRent(''); setCity(''); setAmenityFilters({}) }} className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <div className={cn('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-3xl')}>
            {filtered.map((property, i) => <PropertyCard key={property.id} property={property} index={i} />)}
          </div>
        )}
      </div>
    </div>
  )
}
