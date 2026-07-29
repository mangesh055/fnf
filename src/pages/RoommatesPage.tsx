import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, Plus, Users, Shield, Compass, Sparkles, MessageSquare, Check, X, MapPin, DollarSign, BookOpen, Camera, Heart, Star, Building2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import type { RoommateProfile, UserRole } from '../types'
import { cn, formatCurrency } from '../lib/utils'
import { fetchRoommateProfiles, invalidatePlatformCache } from '../lib/platformData'
import { supabase } from '../lib/supabase'
import { gatewayFetch } from '../lib/apiGateway'
import { uploadToCloudinary } from '../utils/cloudinary'

type RoommateRow = RoommateProfile & { full_name?: string | null; email?: string | null }

export default function RoommatesPage() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [roommates, setRoommates] = useState<RoommateRow[]>([])
  const [myProfile, setMyProfile] = useState<RoommateRow | null>(null)
  
  const [search, setSearch] = useState('')
  const [selectedGender, setSelectedGender] = useState<string>('')
  const [selectedFood, setSelectedFood] = useState<string>('')
  const [maxBudget, setMaxBudget] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [customAmenity, setCustomAmenity] = useState('')
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  // Form Fields for new Roommate seeker
  const [form, setForm] = useState({
    budget_min: '4000',
    budget_max: '8000',
    deposit: '',
    total_roommates: '2',
    location: '',
    college: profile?.college || 'MIT WPU',
    branch: profile?.branch || 'Information Technology',
    gender: profile?.gender || 'male',
    food_preference: 'veg' as 'veg' | 'non-veg' | 'both',
    smoking: false,
    sleep_schedule: 'flexible' as 'early_bird' | 'night_owl' | 'flexible',
    looking_for: 'flat' as 'flat' | 'pg' | 'hostel' | 'any',
    amenities: [] as string[],
    images: [] as string[],
    video_url: '',
    description: '',
    phone: '',
    whatsapp: '',
    whatsapp_code: '+91',
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => setForm(prev => ({ ...prev, images: [...prev.images, reader.result as string] }))
      reader.readAsDataURL(file)
    })
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingVideo(true)
    try {
      const url = await uploadToCloudinary(file)
      setForm(prev => ({ ...prev, video_url: url }))
    } catch (error: any) {
      alert('Failed to upload video: ' + error.message)
    } finally {
      setIsUploadingVideo(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await fetchRoommateProfiles()
        setRoommates(rows as RoommateRow[])
        if (profile) {
          const myRow = (rows as RoommateRow[]).find((item) => item.student_id === profile.id) || null
          setMyProfile(myRow)
        }
      } catch (error) {
        console.error('Failed to load roommate profiles from Supabase:', error)
        setRoommates([])
        setMyProfile(null)
      }
    }

    load()
  }, [profile])

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) {
      navigate('/auth')
      return
    }

    const newProfile: RoommateRow = {
      id: `my-room-${profile.id}`,
      student_id: profile.id,
      budget_min: Number(form.budget_min) || 4000,
      budget_max: Number(form.budget_max) || 8000,
      city: 'Pune',
      college: form.college,
      branch: form.branch,
      gender: form.gender as 'male' | 'female' | 'other',
      food_preference: form.food_preference,
      smoking: form.smoking,
      sleep_schedule: form.sleep_schedule,
      looking_for: form.looking_for,
      description: JSON.stringify({
        text: form.description,
        deposit: Number(form.deposit) || 0,
        total_roommates: Number(form.total_roommates) || 1,
        location: form.location,
        amenities: form.amenities,
        images: form.images,
        video_url: form.video_url,
        phone: form.phone,
        whatsapp: `${form.whatsapp_code}${form.whatsapp}`
      }),
      active: true,
      created_at: new Date().toISOString(),
      full_name: profile.full_name,
      email: profile.email,
    }

    void (async () => {
      const res = await gatewayFetch('/community/roommates', {
        method: 'POST',
        body: JSON.stringify(newProfile)
      })
      const error = res.success ? null : { message: res.error }
      if (error) {
        console.error('Failed to save roommate profile to Gateway:', error)
        return
      }

      setMyProfile(newProfile)
      setRoommates(prev => {
        const filtered = prev.filter(r => r.student_id !== profile.id)
        return [newProfile, ...filtered]
      })
      invalidatePlatformCache()
      setShowForm(false)
      setIsEditing(false)
    })()
  }

  const handleDeleteProfile = (id: string = '') => {
    const targetId = id || (myProfile?.id)
    if (!targetId) return
    void (async () => {
      const res = await gatewayFetch(`/community/roommates/${targetId}`, {
        method: 'DELETE'
      })
      const error = res.success ? null : { message: res.error }
      if (error) {
        console.error('Failed to delete roommate profile from Gateway:', error)
        return
      }

      if (!id || id === myProfile?.id) {
        setMyProfile(null)
      }
      setRoommates(prev => prev.filter(r => r.id !== targetId))
      invalidatePlatformCache()
    })()
  }

  // Calculate Matching Score based on preferences
  const calculateMatchScore = (other: RoommateProfile) => {
    if (!myProfile) return null
    let score = 0
    let totalCriteria = 0

    // 1. Gender Match (High importance)
    totalCriteria += 3
    if (myProfile.gender === other.gender) {
      score += 3
    }

    // 2. Budget Overlap
    totalCriteria += 2
    const overlap = Math.max(0, Math.min(myProfile.budget_max, other.budget_max) - Math.max(myProfile.budget_min, other.budget_min))
    if (overlap > 0 || (myProfile.budget_min <= other.budget_max && other.budget_min <= myProfile.budget_max)) {
      score += 2
    }

    // 3. College Match
    totalCriteria += 2
    if (myProfile.college.toLowerCase().trim() === other.college.toLowerCase().trim()) {
      score += 2
    }

    // 4. Food Preference compatibility
    totalCriteria += 1
    if (myProfile.food_preference === 'both' || other.food_preference === 'both' || myProfile.food_preference === other.food_preference) {
      score += 1
    }

    // 5. Sleep Schedule
    totalCriteria += 1
    if (myProfile.sleep_schedule === 'flexible' || other.sleep_schedule === 'flexible' || myProfile.sleep_schedule === other.sleep_schedule) {
      score += 1
    }

    return Math.round((score / totalCriteria) * 100)
  }

  // Filter roommates feed
  const filteredRoommates = roommates.filter(item => {
    if ((item as any).rejected === true) return false
    if (search) {
      const q = search.toLowerCase()
      const matchesName = item.full_name?.toLowerCase().includes(q)
      const matchesCollege = item.college.toLowerCase().includes(q)
      const matchesBranch = item.branch.toLowerCase().includes(q)
      if (!matchesName && !matchesCollege && !matchesBranch) return false
    }

    if (selectedGender && item.gender !== selectedGender) return false
    if (selectedFood && item.food_preference !== selectedFood && item.food_preference !== 'both') return false
    if (maxBudget && item.budget_min > Number(maxBudget)) return false

    return true
  })

  // Sort: matching roommates first if myProfile exists
  const sortedRoommates = [...filteredRoommates].sort((a, b) => {
    if (!myProfile) return 0
    const matchA = calculateMatchScore(a) || 0
    const matchB = calculateMatchScore(b) || 0
    return matchB - matchA
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Banner */}
      <div className="bg-gradient-to-br from-brand-900 via-slate-900 to-brand-950 text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="absolute top-10 right-10 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
          <div className="text-center md:text-left">
            <span className="badge badge-purple bg-brand-500/20 text-brand-300 border-brand-500/30 text-xs px-2.5 py-1 mb-3">
              <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Smart Matching
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-bold">Find a Roommate for Your Room</h1>
            <p className="text-slate-300 mt-2 max-w-lg">
              Have an empty bed? Connect with students looking for accommodation near your college. Match based on rent, diet, and lifestyle.
            </p>
          </div>
          <div className="flex gap-3">
            {!myProfile ? (
              <button onClick={() => { if (!profile) navigate('/auth'); else setShowForm(true) }} className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" /> Post Your Room
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Your Card is Active</p>
                  <p className="text-sm font-semibold text-white">{myProfile.college} • {myProfile.branch}</p>
                </div>
                <button onClick={() => {
                  let descObj = { text: myProfile.description, deposit: 0, total_roommates: 1, location: '', amenities: [] as string[], images: [] as string[], video_url: '', phone: '', whatsapp: '' }
                  try {
                    const parsed = JSON.parse(myProfile.description || '{}')
                    if (parsed.text !== undefined) descObj = { ...descObj, ...parsed }
                  } catch (e) {}
                  
                  let rawWhatsapp = descObj.whatsapp || descObj.phone || ''
                  let parsedCode = '+91'
                  let parsedNumber = rawWhatsapp
                  const possibleCodes = ['+91', '+1', '+44', '+61', '+971']
                  for (const c of possibleCodes) {
                    if (rawWhatsapp.startsWith(c)) {
                      parsedCode = c
                      parsedNumber = rawWhatsapp.slice(c.length)
                      break
                    }
                  }
                  
                  setForm({
                    budget_min: myProfile.budget_min.toString(),
                    budget_max: myProfile.budget_max.toString(),
                    deposit: descObj.deposit ? descObj.deposit.toString() : '',
                    total_roommates: descObj.total_roommates.toString(),
                    location: descObj.location,
                    college: myProfile.college,
                    branch: myProfile.branch,
                    gender: myProfile.gender,
                    food_preference: myProfile.food_preference as any,
                    smoking: myProfile.smoking,
                    sleep_schedule: myProfile.sleep_schedule as any,
                    looking_for: myProfile.looking_for as any,
                    amenities: descObj.amenities,
                    images: descObj.images || [],
                    video_url: descObj.video_url || '',
                    description: descObj.text || '',
                    phone: descObj.phone || '',
                    whatsapp: parsedNumber,
                    whatsapp_code: parsedCode
                  })
                  setIsEditing(true)
                  setShowForm(true)
                }} className="btn-secondary py-1.5 px-3 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs">
                  Edit Card
                </button>
                <button onClick={() => {
                  if (!window.confirm("Are you sure you want to remove your roommate profile card?")) return
                  handleDeleteProfile(myProfile.id)
                }} className="btn-secondary py-1.5 px-3 bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs">
                  Remove Card
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, college, or branch..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={selectedGender} onChange={e => setSelectedGender(e.target.value)} className="input-field py-2 text-sm w-36">
              <option value="">Any Gender</option>
              <option value="male">Boys</option>
              <option value="female">Girls</option>
            </select>
            <select value={selectedFood} onChange={e => setSelectedFood(e.target.value)} className="input-field py-2 text-sm w-36">
              <option value="">Any Diet</option>
              <option value="veg">Veg Only</option>
              <option value="non-veg">Non-Veg</option>
            </select>
            <input
              type="number"
              value={maxBudget}
              onChange={e => setMaxBudget(e.target.value)}
              placeholder="Max Rent"
              className="input-field py-2 text-sm w-28"
            />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {sortedRoommates.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No matching roommate profiles found</h3>
            <p className="text-slate-500 mt-2 mb-4">Try removing some search parameters or custom filters</p>
            <button onClick={() => { setSearch(''); setSelectedGender(''); setSelectedFood(''); setMaxBudget('') }} className="btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedRoommates.map((item, idx) => {
              const score = calculateMatchScore(item)
              let descObj = { text: item.description, deposit: 0, total_roommates: 1, location: '', amenities: [] as string[], images: [] as string[] }
              try {
                const parsed = JSON.parse(item.description || '{}')
                if (parsed.text !== undefined) descObj = { ...descObj, ...parsed }
              } catch (e) {}

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
                  whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.3, ease: 'easeOut' } }}
                  whileTap={{ scale: 0.985 }}
                  className="h-full"
                >
                  <div 
                    className="card-property card-shine group flex flex-col h-full p-2 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/15 border border-transparent hover:border-brand-500/30 cursor-pointer bg-white dark:bg-slate-900 rounded-2xl shadow-sm"
                    onClick={() => navigate(`/roommates/${item.id}`)}
                  >
                    {/* Media Header (Matching PropertyCard image container) */}
                    <div className="relative overflow-hidden h-48 sm:h-52 rounded-xl shrink-0">
                      {(descObj.images?.length || 0) > 0 ? (
                        <img 
                          src={descObj.images?.[0]} 
                          alt={item.full_name || 'Roommate'} 
                          className="property-image w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out animate-in fade-in" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-grid opacity-15" />
                          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 mb-1 z-10">
                            {(item.full_name || 'U').split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-xs font-bold text-white/90 z-10">{item.full_name || 'Anonymous Seeker'}</span>
                          <span className="text-[10px] text-white/70 z-10">{item.college}</span>
                        </div>
                      )}

                      {/* Slideshow Counter Badge if photos exist */}
                      {(descObj.images?.length || 0) > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/30 p-1 rounded-full backdrop-blur-md">
                          <span className="text-[10px] font-bold text-white px-1.5">1 of {descObj.images?.length}</span>
                        </div>
                      )}

                      {/* Top-Left Badges */}
                      <div className="absolute top-3 left-3 flex gap-2 z-10">
                        <span className={cn(
                          'badge text-[10px] shadow-sm',
                          item.gender === 'male' ? 'bg-blue-500/90 text-white' :
                            item.gender === 'female' ? 'bg-pink-500/90 text-white' :
                              'bg-emerald-500/90 text-white'
                        )}>
                          {item.gender === 'male' ? '👨 Boys' : item.gender === 'female' ? '👩 Girls' : '👥 Any'}
                        </span>

                        {score !== null && (
                          <span className={cn('badge text-[10px] px-2 py-0.5 font-bold shadow-sm animate-badge-pulse',
                            score >= 80 ? 'badge-green' : score >= 60 ? 'badge-yellow' : 'badge-purple')}>
                            {score}% Match
                          </span>
                        )}
                      </div>

                      {/* Top-Right Favorite / Bookmark Button */}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:bg-white hover:text-red-500 flex items-center justify-center shadow-md backdrop-blur-sm z-10 transition-colors"
                      >
                        <Heart className="w-4 h-4 transition-transform duration-200" />
                      </motion.button>

                      {/* Bottom-Right Location Badge */}
                      <div className="absolute bottom-3 right-3">
                        <span className="badge bg-black/60 backdrop-blur-md text-white text-[10px] shadow-sm">
                          📍 {item.city}
                        </span>
                      </div>
                    </div>

                    {/* Content Section (Matching PropertyCard) */}
                    <div className="px-2 pt-3 pb-1 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight line-clamp-1 group-hover:text-brand-600 transition-colors">
                          {item.full_name || 'Anonymous Roommate Seeker'}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 star-filled" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">4.9</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mb-2">
                        <MapPin className="w-3 h-3 flex-shrink-0 animate-pin-pulse text-red-500" />
                        <span className="truncate">{descObj.location || item.college || item.city}</span>
                      </div>

                      {/* Attribute Pills */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="tag text-[10px]">
                          🍲 {item.food_preference}
                        </span>
                        <span className="tag text-[10px]">
                          👥 {descObj.total_roommates} Roommate{descObj.total_roommates > 1 ? 's' : ''}
                        </span>
                        <span className="tag text-[10px] capitalize">
                          🔍 {item.looking_for}
                        </span>
                      </div>

                      {/* Footer with NoBroker Red Connect Button */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto gap-2">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-extrabold text-slate-900 dark:text-white">
                              {formatCurrency(item.budget_min)}
                            </span>
                            <span className="text-[10px] text-slate-400">/month</span>
                          </div>
                          {descObj.deposit > 0 && (
                            <p className="text-[10px] text-slate-400">Deposit: {formatCurrency(descObj.deposit)}</p>
                          )}
                        </div>

                        {/* NoBroker Red Connect Action Button */}
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigate(`/roommates/${item.id}`)
                          }}
                          className="group/btn px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-red-500/25 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 group-hover/btn:-rotate-12 transition-transform duration-200" /> Connect
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Profile Setup Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-glass overflow-hidden z-10 max-h-[90vh] flex flex-col">
              
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">📝 {isEditing ? 'Edit Your Room Details' : 'Post Your Room Details'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateProfile} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Rent per person (₹/mo)</label>
                    <input type="number" value={form.budget_min} onChange={e => setForm(prev => ({ ...prev, budget_min: e.target.value, budget_max: e.target.value }))} className="input-field text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Deposit Amount (₹)</label>
                    <input type="number" value={form.deposit} onChange={e => setForm(prev => ({ ...prev, deposit: e.target.value }))} className="input-field text-sm" placeholder="e.g. 10000" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Location / Address</label>
                  <input type="text" value={form.location} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))} className="input-field text-sm" placeholder="e.g. Kothrud, near MIT Gate" required />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Number (Calling)</label>
                    <input type="tel" maxLength={10} value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))} className="input-field text-sm" placeholder="e.g. 9876543210" pattern="[0-9]{10}" title="Invalid number" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">WhatsApp Number</label>
                    <div className="flex gap-2">
                      <select value={form.whatsapp_code} onChange={e => setForm(prev => ({ ...prev, whatsapp_code: e.target.value }))} className="input-field text-sm w-[90px] px-2 font-medium">
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+61">+61 (AU)</option>
                        <option value="+971">+971 (UAE)</option>
                      </select>
                      <input type="tel" maxLength={10} value={form.whatsapp} onChange={e => setForm(prev => ({ ...prev, whatsapp: e.target.value.replace(/\D/g, '') }))} className="input-field text-sm flex-1" placeholder="9876543210" pattern="[0-9]{10}" title="Invalid number" required />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Total Roommates in Room</label>
                    <input type="number" value={form.total_roommates} onChange={e => setForm(prev => ({ ...prev, total_roommates: e.target.value }))} className="input-field text-sm" placeholder="e.g. 2" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Property Type</label>
                    <select value={form.looking_for} onChange={e => setForm(prev => ({ ...prev, looking_for: e.target.value as any }))} className="input-field text-sm">
                      <option value="flat">Flat sharing</option>
                      <option value="pg">PG partner</option>
                      <option value="hostel">Hostel roomie</option>
                      <option value="any">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Looking for Gender</label>
                    <select value={form.gender} onChange={e => setForm(prev => ({ ...prev, gender: e.target.value as any }))} className="input-field text-sm">
                      <option value="male">Boys Only</option>
                      <option value="female">Girls Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Your College</label>
                    <input type="text" value={form.college} onChange={e => setForm(prev => ({ ...prev, college: e.target.value }))} className="input-field text-sm" placeholder="e.g. MIT WPU" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Allowed Food / Diet</label>
                    <select value={form.food_preference} onChange={e => setForm(prev => ({ ...prev, food_preference: e.target.value as any }))} className="input-field text-sm">
                      <option value="veg">Vegetarian</option>
                      <option value="non-veg">Non-Vegetarian</option>
                      <option value="both">Both / Anything</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['WiFi', 'AC', 'Washing Machine', 'Attached Bath', 'Furnished', 'Maid'].map(am => (
                      <button type="button" key={am}
                        onClick={() => setForm(prev => ({ ...prev, amenities: prev.amenities.includes(am) ? prev.amenities.filter(a => a !== am) : [...prev.amenities, am] }))}
                        className={cn('px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors', form.amenities.includes(am) ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
                        {am}
                      </button>
                    ))}
                    {form.amenities.filter(a => !['WiFi', 'AC', 'Washing Machine', 'Attached Bath', 'Furnished', 'Maid'].includes(a)).map(am => (
                      <button type="button" key={am}
                        onClick={() => setForm(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== am) }))}
                        className="px-2.5 py-1.5 rounded-lg border border-brand-500 bg-brand-50 text-brand-600 text-xs font-semibold flex items-center gap-1">
                        {am} <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={customAmenity} onChange={e => setCustomAmenity(e.target.value)} placeholder="Add custom amenity..." className="input-field text-sm flex-1" />
                    <button type="button" onClick={() => {
                      if (customAmenity.trim() && !form.amenities.includes(customAmenity.trim())) {
                        setForm(prev => ({ ...prev, amenities: [...prev.amenities, customAmenity.trim()] }))
                        setCustomAmenity('')
                      }
                    }} className="btn-secondary px-4 text-sm">Add</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Room Images</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                        <img src={img} alt="Upload" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <label className="w-16 h-16 shrink-0 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors" title="Upload Image">
                      <Plus className="w-5 h-5" />
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <label className="w-16 h-16 shrink-0 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors" title="Take Photo">
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] mt-1">Camera</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Room Video (Optional)</label>
                  {form.video_url ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-black">
                      <video src={form.video_url} controls playsInline preload="metadata" className="w-full h-full object-contain" />
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, video_url: '' }))} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-sm hover:bg-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <label className="flex-1 h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors">
                        {isUploadingVideo ? (
                          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-6 h-6 mb-1" />
                            <span className="text-[10px] sm:text-xs font-medium">Upload Video</span>
                          </>
                        )}
                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={isUploadingVideo} />
                      </label>
                      <label className="flex-1 h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors">
                        {isUploadingVideo ? (
                          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-6 h-6 mb-1" />
                            <span className="text-[10px] sm:text-xs font-medium">Record Video</span>
                          </>
                        )}
                        <input type="file" accept="video/*" capture="environment" onChange={handleVideoUpload} className="hidden" disabled={isUploadingVideo} />
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Smoking</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, smoking: false }))} className={cn('flex-1 py-1.5 rounded-lg border text-xs font-semibold capitalize', !form.smoking ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200')}>No Smoking</button>
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, smoking: true }))} className={cn('flex-1 py-1.5 rounded-lg border text-xs font-semibold capitalize', form.smoking ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200')}>Smoking OK</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Sleep Schedule</label>
                    <select value={form.sleep_schedule} onChange={e => setForm(prev => ({ ...prev, sleep_schedule: e.target.value as any }))} className="input-field text-sm">
                      <option value="flexible">Flexible</option>
                      <option value="early_bird">Early Bird</option>
                      <option value="night_owl">Night Owl</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">About the Room & Roommate Preferences</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the room, amenities, location, and the kind of roommate you are looking for..." className="input-field py-2 text-sm" required />
                </div>

                <button type="submit" className="btn-primary w-full justify-center py-3 text-sm mt-2">
                  ✓ {isEditing ? 'Save Changes' : 'Publish Room Details'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
