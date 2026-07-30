import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, MapPin, Building2, Utensils, Users, Star, ArrowRight,
  CheckCircle, Shield, Zap, Smartphone, ChevronRight, Play
} from 'lucide-react'
import PropertyCard from '../components/property/PropertyCard'
import MessCard from '../components/mess/MessCard'
import { fetchMesses, fetchProperties } from '../lib/platformData'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { gatewayFetch } from '../lib/apiGateway'
import { useAuthStore } from '../store/authStore'

const cities = ['Pune', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad']

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCity, setSearchCity] = useState('Pune')
  const [searchTab, setSearchTab] = useState<'property' | 'mess'>('property')
  const [properties, setProperties] = useState<any[]>([])
  const [messes, setMesses] = useState<any[]>([])
  const [dynamicStats, setDynamicStats] = useState({ properties: '0+', messes: '0+', students: '0+' })
  const navigate = useNavigate()
  const scrollTimerRef = useRef<any>(null)

  const { user, profile } = useAuthStore()
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState('general')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  const [avgRating, setAvgRating] = useState(4.8)
  const [happyUsersCount, setHappyUsersCount] = useState(5000)

  const loadFeedbackStats = async () => {
    try {
      const { data: fbData } = await supabase.from('platform_feedback').select('rating')
      if (fbData && fbData.length > 0) {
        const sum = fbData.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0)
        setAvgRating(Number((sum / fbData.length).toFixed(1)))
        const positiveFeedbackCount = fbData.filter((f: any) => f.rating >= 4).length
        setHappyUsersCount(5000 + positiveFeedbackCount)
      }
    } catch (err) {
      console.warn('Failed to load dynamic rating stats:', err)
    }
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) {
      setFeedbackError('Please log in to submit feedback')
      return
    }

    setSubmittingFeedback(true)
    setFeedbackError('')

    try {
      const { error: submitError } = await supabase.from('platform_feedback').insert([
        {
          user_id: user.id,
          rating: feedbackRating,
          feedback_text: feedbackText || null,
          category: feedbackCategory,
          full_name: profile.full_name || user.email?.split('@')[0] || 'Anonymous'
        },
      ])

      if (submitError) throw submitError

      setFeedbackSubmitted(true)
      setFeedbackRating(5)
      setFeedbackText('')
      setFeedbackCategory('general')
      await loadFeedbackStats()
      
      setTimeout(() => {
        setFeedbackSubmitted(false)
      }, 4000)
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to submit feedback')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const handleTabChange = (tab: 'property' | 'mess') => {
    setSearchTab(tab)
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current)
    }
    scrollTimerRef.current = setTimeout(() => {
      const targetId = tab === 'property' ? 'featured-properties-section' : 'top-mess-section'
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [propertyRows, messRows] = await Promise.all([fetchProperties(), fetchMesses()])
        setProperties((propertyRows || []).filter((p: any) => !p.rejected && (!(p.is_student_request === true || p.profiles?.role === 'student') || p.verified === true)))
        setMesses((messRows || []).filter((m: any) => !m.rejected && m.verified === true))
        
        const propsCount = propertyRows?.length || 0
        const messesCount = messRows?.length || 0
        
        const countRes = await gatewayFetch('/auth/users/count')
        const studentsCount = countRes.success && typeof countRes.count === 'number' ? countRes.count : 0
        
        setDynamicStats({
          properties: `${propsCount}+`,
          messes: `${messesCount}+`,
          students: `${studentsCount}+`
        })
        
        await loadFeedbackStats()
      } catch (error) {
        console.error('Failed to load homepage data from Supabase:', error)
      }
    }

    load()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTab === 'mess') {
      navigate(`/mess?q=${searchQuery}&city=${searchCity}`)
    } else {
      navigate(`/properties?q=${searchQuery}&city=${searchCity}`)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 lg:py-24 flex items-center justify-center overflow-hidden min-h-[75vh]">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1920&q=80"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950/90 via-slate-900/85 to-slate-900/75" />
          <div className="absolute inset-0 bg-grid opacity-10" />
        </div>

        {/* Floating Elements with Out-of-Sync Bobbing */}
        <div className="absolute top-24 left-10 lg:left-24 hidden lg:block animate-float-left z-10">
          <div className="glass rounded-2xl p-3.5 text-white shadow-2xl border border-white/15 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/25 flex items-center justify-center text-lg">🏠</div>
              <div>
                <p className="text-xs font-semibold">New Listing!</p>
                <p className="text-[10px] opacity-75">Sunshine PG, Kothrud</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-32 right-10 lg:right-24 hidden lg:block animate-float-right z-10">
          <div className="glass rounded-2xl p-3.5 text-white shadow-2xl border border-white/15 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/25 flex items-center justify-center text-lg">✅</div>
              <div>
                <p className="text-xs font-semibold">Tasty Meal</p>
                <p className="text-[10px] opacity-75">Annapurna - Lunch</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-medium mb-4 shadow-sm backdrop-blur-md",
                searchTab === 'mess' 
                  ? "bg-accent-500/20 border-accent-500/30 text-accent-300" 
                  : "bg-brand-500/20 border-brand-500/30 text-brand-300"
              )}
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
              {searchTab === 'mess' ? " #1 Digital Mess Platform" : " #1 Smart Student Housing Platform"}
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-5xl lg:text-6xl font-display not-italic font-extrabold text-white leading-tight mb-3 sm:mb-4 tracking-tight"
            >
              Find Your Perfect
              <br />
              {searchTab === 'mess' ? (
                <span className="shimmer-text-orange font-pacifico not-italic font-normal text-[1.05em] inline-block mt-1 pb-2 pt-1 px-1 leading-snug">Daily Meals</span>
              ) : (
                <span className="shimmer-text font-pacifico not-italic font-normal text-[1.05em] inline-block mt-1 pb-2 pt-1 px-1 leading-snug">Campus Home</span>
              )}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-slate-300 text-xs sm:text-base max-w-xl mx-auto mb-6 leading-relaxed"
            >
              {searchTab === 'mess' ? (
                "Discover verified messes, tiffin services & meal plans near your college."
              ) : (
                "Discover PGs, hostels, flats & digital mess services near your college."
              )}
            </motion.p>

            {/* Search Tabs with Sliding Active Indicator Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.38 }}
              className="relative flex justify-center gap-1.5 mb-4 max-w-[260px] mx-auto p-1 bg-black/40 rounded-2xl border border-white/15 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => handleTabChange('property')}
                className={cn(
                  "relative z-10 flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
                  searchTab === 'property' ? "text-white" : "text-white/70 hover:text-white"
                )}
              >
                {searchTab === 'property' && (
                  <motion.div
                    layoutId="activeHeroTabPill"
                    className="absolute inset-0 bg-brand-500 rounded-xl shadow-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">🏠 Housing</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('mess')}
                className={cn(
                  "relative z-10 flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
                  searchTab === 'mess' ? "text-white" : "text-white/70 hover:text-white"
                )}
              >
                {searchTab === 'mess' && (
                  <motion.div
                    layoutId="activeHeroTabPill"
                    className="absolute inset-0 bg-accent-500 rounded-xl shadow-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">🍽️ Mess</span>
              </button>
            </motion.div>

            {/* Ultra-Compact Single-Row Search Bar */}
            <motion.form 
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSearch} 
              className="max-w-lg mx-auto"
            >
              <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-full shadow-lg border border-white/30 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 flex-1 min-w-0 pl-2.5 sm:pl-3 pr-1">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-500 dark:text-brand-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchTab === 'mess' ? 'Search messes...' : 'Try "PG near VIT"...'}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm py-1"
                  />
                </div>
                
                <div className="flex items-center gap-1 px-1.5 py-0.5 border-l border-slate-200 dark:border-slate-700/80 flex-shrink-0">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 flex-shrink-0" />
                  <select
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="bg-transparent outline-none text-xs text-slate-700 dark:text-slate-200 font-medium cursor-pointer max-w-[68px] sm:max-w-none pr-0.5"
                  >
                    {cities.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{c}</option>)}
                  </select>
                </div>

                <button
                  type="submit"
                  className={cn(
                    "rounded-full p-2 sm:px-4 sm:py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-white shadow-sm flex-shrink-0 active:scale-95",
                    searchTab === 'mess'
                      ? 'bg-accent-500 hover:bg-accent-600'
                      : 'bg-brand-600 hover:bg-brand-700'
                  )}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </motion.form>

            {/* Quick Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {(searchTab === 'mess' 
                ? ['Veg Only', 'Non-Veg', 'Jain Food', 'Monthly Pass']
                : ['PG below ₹8000', 'Girls Hostel', 'AC Flat', 'Veg Mess']
              ).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (searchTab === 'mess') {
                      if (tag === 'Veg Only') navigate('/mess?foodType=veg')
                      else if (tag === 'Non-Veg') navigate('/mess?foodType=non_veg')
                      else navigate(`/mess?q=${encodeURIComponent(tag)}`)
                    } else {
                      if (tag === 'PG below ₹8000') navigate('/properties?type=pg&maxRent=8000')
                      else if (tag === 'Girls Hostel') navigate('/properties?type=hostel&gender=female')
                      else if (tag === 'AC Flat') navigate('/properties?type=flat&ac=true')
                      else if (tag === 'Veg Mess') navigate('/mess?foodType=veg')
                      else navigate(`/properties?q=${encodeURIComponent(tag)}`)
                    }
                  }}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-xs border border-white/15 backdrop-blur-sm transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-brand-600 dark:bg-brand-700 py-5 sm:py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-6 divide-x divide-brand-500/40">
            {[
              { value: dynamicStats.properties, label: 'Properties Listed' },
              { value: dynamicStats.messes, label: 'Mess Services' },
              { value: dynamicStats.students, label: 'Happy Students' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-center text-white px-1 sm:px-4 cursor-default transition-all"
              >
                <div className="text-2xl sm:text-3xl font-display font-bold">{stat.value}</div>
                <div className="text-brand-200 text-[10px] sm:text-sm mt-0.5 sm:mt-1 leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties (shown when Housing option is active) */}
      {searchTab === 'property' && (
        <section id="featured-properties-section" className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-10 text-center sm:text-left">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}>
                <h2 className="text-3xl sm:text-5xl font-display font-bold text-brand-600 dark:text-brand-400 tracking-tight">
                 Featured Properties
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 sm:mt-1">Top-rated, verified accommodations near colleges</p>
              </motion.div>
              <Link to="/properties" className="btn-secondary hidden sm:flex text-sm mt-4 sm:mt-0">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 3).map((property, i) => (
                <PropertyCard key={property.id} property={property} index={i} />
              ))}
            </div>
            <div className="text-center mt-6 sm:hidden">
              <Link to="/properties" className="btn-secondary text-sm w-full justify-center">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Mess Sections (shown when Mess option is active) */}
      {searchTab === 'mess' && (
        <>
          {/* Mess Section */}
          <section id="top-mess-section" className="py-16 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-10 text-center sm:text-left">
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-accent-600 dark:text-accent-400 tracking-tight">
                    🍽️ Top Mess Services
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 sm:mt-1">Verified messes with digital attendance system</p>
                </motion.div>
                <Link to="/mess" className="btn-secondary hidden sm:flex text-sm mt-4 sm:mt-0">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {messes.slice(0, 3).map((mess, i) => (
                  <MessCard key={mess.id} mess={mess} index={i} />
                ))}
              </div>
              <div className="text-center mt-6 sm:hidden">
                <Link to="/mess" className="btn-secondary text-sm w-full justify-center">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Smart Mess System Explainer */}
          <section className="py-10 sm:py-20 bg-gradient-to-br from-brand-950 to-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="max-w-6xl mx-auto px-4 relative z-10">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} className="text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/20 border border-accent-500/30 text-accent-300 text-xs sm:text-sm mb-3 sm:mb-6 animate-pulse-slow shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    🚀 Revolutionary Feature
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-serif italic font-bold mb-3 sm:mb-6 leading-tight">
                    Smart Digital Mess<br />
                    <span className="gradient-text-orange font-dancing not-italic font-normal block mt-1">Attendance System</span>
                  </h2>
                  {/* Description — hidden on mobile to save space */}
                  <p className="hidden sm:block text-slate-300 text-lg mb-8 leading-relaxed">
                    No more paper registers. Our streamlined static QR-based attendance system ensures authentic meal tracking seamlessly linked to your active subscription.
                  </p>

                  {/* Mobile: compact 2-col step grid */}
                  <div className="grid grid-cols-2 gap-3 sm:hidden mb-5">
                    {[
                      { icon: '📱', title: 'Open App' },
                      { icon: '📷', title: 'Scan QR' },
                      { icon: '🎫', title: 'Validated' },
                      { icon: '✅', title: 'Logged!' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="text-[10px] text-brand-300 font-medium">Step {i + 1}</p>
                          <p className="text-xs text-white font-semibold">{item.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: full step list */}
                  <div className="hidden sm:block space-y-4">
                    {[
                      { icon: '📱', step: '1', title: 'Open Your App', desc: 'Launch the FlatsNFood app when you arrive at the mess.' },
                      { icon: '📷', step: '2', title: 'Scan QR Poster', desc: 'Scan the mess\'s static QR code poster right from your dashboard.' },
                      { icon: '🎫', step: '3', title: 'System Validation', desc: 'The system instantly verifies your active meal plan and daily limits.' },
                      { icon: '✅', step: '4', title: 'Attendance Recorded', desc: 'Your meal is automatically logged and your plan count is updated!' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4 group cursor-default">
                        <div className="w-10 h-10 rounded-full bg-brand-500/30 border border-brand-500/50 flex items-center justify-center flex-shrink-0 text-lg group-hover:scale-110 transition-transform duration-300 shadow-glow">
                          <span className="group-hover:animate-bounce-subtle">{item.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{item.title}</h4>
                          <p className="text-slate-400 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 sm:mt-8 flex justify-center sm:justify-start">
                    <Link to="/mess" className="btn-accent text-sm sm:text-base hover:scale-105 transition-transform duration-300 shadow-glow-orange">
                      Explore Mess Services <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>

                {/* Mock phone UI — hidden on mobile */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="relative hidden lg:block"
                >
                  <div className="relative rounded-3xl overflow-hidden bg-slate-800/50 border border-slate-700 p-6 animate-float shadow-2xl shadow-brand-500/20">
                    <div className="bg-slate-900 rounded-2xl p-4 mb-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-brand-500/30 flex items-center justify-center text-xl">🍽️</div>
                        <div>
                          <p className="text-white font-semibold text-sm">Jagdamba Mess</p>
                          <p className="text-emerald-400 text-xs flex items-center gap-1">🟢 Open Now</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800">
                          <span className="text-slate-300 text-sm">📊 Daily Limit</span>
                          <span className="text-emerald-400 text-sm font-medium">✓ 1 of 2 scans used</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800">
                          <span className="text-slate-300 text-sm">🎫 Subscription</span>
                          <span className="text-emerald-400 text-sm font-medium">✓ Active (18 days left)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-brand-300 font-semibold">Ready to Scan QR</p>
                      <p className="text-slate-400 text-xs mt-1">Point camera at mess QR code</p>
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                      <p className="text-emerald-400 font-bold">🎉 Lunch Attended!</p>
                      <p className="text-slate-400 text-xs mt-1">Meals Left: <span className="text-white font-mono">24</span></p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Small Feedback Section */}
      <section className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mb-3">
                💭 Share Your Experience
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Your feedback directly shapes the future of FlatsNFood. Whether you found a bug, want to request a feature, or simply want to rate your experience, we would love to hear from you!
              </p>
              <div className="flex gap-4 items-center">
                <div className="p-4 bg-brand-50 dark:bg-brand-950/20 rounded-2xl border border-brand-100 dark:border-brand-900/40">
                  <p className="text-2xl font-black text-brand-600 dark:text-brand-400">{avgRating}★</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Average User Rating</p>
                </div>
                <div className="p-4 bg-brand-50 dark:bg-brand-950/20 rounded-2xl border border-brand-100 dark:border-brand-900/40">
                  <p className="text-2xl font-black text-brand-600 dark:text-brand-400">{happyUsersCount}+</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Happy Users</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/30 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              {feedbackSubmitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-4xl text-emerald-500">🎉</div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">Thank You!</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your feedback has been submitted successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  {feedbackError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl font-semibold">
                      {feedbackError}
                    </div>
                  )}

                  {/* Rating Stars */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Rate Us</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`transition-all ${star <= feedbackRating ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-600'} hover:scale-125 cursor-pointer`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Feedback Type</label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                      className="input-field py-1.5 text-xs font-semibold"
                    >
                      <option value="general">💭 General Feedback</option>
                      <option value="feature_request">✨ Feature Request</option>
                      <option value="bug_report">🐛 Bug Report</option>
                      <option value="improvement">⚡ Improvement Suggestion</option>
                    </select>
                  </div>

                  {/* Suggestion Text */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Message / Suggestion</label>
                    <textarea
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Tell us what you think..."
                      className="input-field py-2 text-xs font-semibold"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="w-full btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-20 bg-gradient-to-br from-brand-600 to-brand-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-white mb-2 sm:mb-4">
              Ready to find your Campus Home?
            </h2>
            <p className="text-brand-200 text-sm sm:text-lg mb-5 sm:mb-8">
              Join 5,000+ students already using FlatsNFood across India
            </p>
            <div className="flex flex-row gap-3 justify-center">
              <Link to="/auth?tab=register" className="btn-accent btn-light-sweep group text-sm sm:text-base px-5 sm:px-8 inline-flex items-center gap-2">
                Get Started Free <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
              </Link>
              <Link to={searchTab === 'mess' ? "/mess" : "/properties"} className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl border-2 border-white/30 text-white text-sm sm:text-base font-semibold hover:bg-white/10 transition-all inline-flex items-center gap-2">
                {searchTab === 'mess' ? "Browse Mess Services" : "Browse Properties"}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
