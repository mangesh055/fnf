import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Users, DollarSign, Shield, Compass, MessageSquare, ArrowLeft,
  Phone, Check, ExternalLink, X, ChevronLeft, Star, Heart, Share2,
  ShieldCheck, Navigation2, Building2, CheckCircle, Sparkles, User
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { gatewayFetch } from '../lib/apiGateway'
import { useAuthStore } from '../store/authStore'
import type { RoommateProfile } from '../types'
import { cn, formatCurrency, getInitials } from '../lib/utils'
import toast from 'react-hot-toast'

export default function RoommateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const [roommate, setRoommate] = useState<RoommateProfile & { full_name?: string | null; email?: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)

  const handleShare = () => {
    const url = window.location.href
    const shareText = `Check this out on FlatsNFood: ${url}`
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
  }
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const specificationsEndRef = useRef<HTMLDivElement>(null)
  const [showStickyMobileBar, setShowStickyMobileBar] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    const load = async () => {
      try {
        const res = await gatewayFetch(`/community/roommates/${id}`)
        const data = res.success ? res.data : null
        const error = res.success ? null : { message: res.error }

        if (error) throw new Error(error.message)
        setRoommate(data)
      } catch (err) {
        console.error('Failed to load roommate details:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    const handleScroll = () => {
      if (specificationsEndRef.current) {
        const rect = specificationsEndRef.current.getBoundingClientRect()
        if (rect.bottom < window.innerHeight - 50) {
          setShowStickyMobileBar(false)
        } else {
          setShowStickyMobileBar(true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading roommate details...</p>
      </div>
    )
  }

  if (!roommate) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-5xl mb-3">👥</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Room Listing Not Found</h2>
        <p className="text-sm text-slate-500 mb-5">The roommate post you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/roommates')} className="btn-primary">Back to Roommates</button>
      </div>
    )
  }

  let descObj = {
    text: roommate.description,
    deposit: 0,
    total_roommates: 1,
    location: '',
    amenities: [] as string[],
    images: [] as string[],
    video_url: '',
    phone: '',
    whatsapp: ''
  }
  try {
    const parsed = JSON.parse(roommate.description || '{}')
    if (parsed.text !== undefined) descObj = { ...descObj, ...parsed }
  } catch (e) { }

  const ownerName = (roommate as any).full_name || 'Anonymous Student'
  const displayPhone = descObj.phone || '9876543210'
  const digitsOnly = displayPhone.replace(/[^0-9]/g, '')
  const phone10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly
  const formattedPhone = `+91 ${phone10}`
  const whatsappUrl = `https://wa.me/91${phone10}?text=${encodeURIComponent(
    `Hi ${ownerName}, I saw your room post on FlatsNFood. Is it currently available?`
  )}`

  const googleMapsUrl = descObj.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${descObj.location} ${roommate.city}`)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${roommate.college} ${roommate.city}`)}`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16 pb-24 lg:pb-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link to="/roommates" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-600 transition-colors mb-6 text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> Back to Roommate Listings
        </Link>

        {/* Two Column Grid Format (Matching PropertyDetailPage) */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">

          {/* LEFT COLUMN: Media & Detailed Roommate Specs */}
          <div className="order-1 lg:col-span-2 space-y-6 w-full">

            {/* Hero Image Showcase Card */}
            <div className="card overflow-hidden rounded-3xl shadow-card border border-slate-100 dark:border-slate-800">
              <div className="relative h-64 sm:h-80 w-full bg-slate-200 dark:bg-slate-800">
                {(descObj.images?.length || 0) > 0 ? (
                  <img
                    onClick={() => setSelectedImage(descObj.images?.[0] || null)}
                    src={descObj.images?.[0]}
                    alt={ownerName}
                    className="w-full h-full object-cover cursor-pointer transform-gpu"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 flex flex-col items-center justify-center text-white p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid opacity-15" />
                    <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold text-3xl flex items-center justify-center shadow-xl mb-2 z-10">
                      {getInitials(ownerName)}
                    </div>
                    <span className="text-base font-bold text-white z-10">{ownerName}</span>
                    <span className="text-xs text-white/80 z-10">{roommate.college}</span>
                  </div>
                )}

                {/* Top Left Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
                  <span className={cn(
                    'badge shadow-md',
                    roommate.gender === 'male' ? 'bg-blue-500 text-white' :
                      roommate.gender === 'female' ? 'bg-pink-500 text-white' :
                        'bg-emerald-500 text-white'
                  )}>
                    {roommate.gender === 'male' ? '👨 Boys Only' : roommate.gender === 'female' ? '👩 Girls Only' : '👥 Any Gender'}
                  </span>
                  {((roommate as any).verified || (roommate as any).profiles?.verified) && (
                    <span className="badge badge-purple shadow-md">✓ Verified Student</span>
                  )}
                  <span className="badge badge-green shadow-md">🟢 Active Listing</span>
                </div>

                {/* Top Right Actions */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  <button
                    onClick={() => setFavorited(!favorited)}
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-md',
                      favorited ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:text-red-500'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', favorited && 'fill-current')} />
                  </button>
                  <button
                    onClick={handleShare}
                    title="Share Listing"
                    className="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center hover:bg-white text-slate-600 dark:text-slate-300 transition-all shadow-md backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 hover:text-brand-600"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Roommate Main Info Card */}
            <div className="card p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">

              {/* Header Title & Ratings */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-extrabold text-[11px] uppercase tracking-wide">
                      {roommate.looking_for}
                    </span>
                    {((roommate as any).verified || (roommate as any).profiles?.verified) ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Profile
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        Pending Admin Verification
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
                    {ownerName}
                  </h1>
                  <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 mt-1">
                    🎓 {roommate.college} {roommate.branch && `• ${roommate.branch}`}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{descObj.location || `${roommate.city}, India`}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                    <Star className="w-4 h-4 star-filled" />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">4.9</span>
                    <span className="text-slate-400 text-xs">(Top Match)</span>
                  </div>
                
                </div>
              </div>

              {/* 4-Stat Metric Box (Matching PropertyDetailPage) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Monthly Rent</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(roommate.budget_min)}
                    <span className="text-xs font-normal text-slate-400"> /mo</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Deposit</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {descObj.deposit ? formatCurrency(descObj.deposit) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Roommates</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {descObj.total_roommates} {descObj.total_roommates > 1 ? 'People' : 'Person'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Status</p>
                  <span className="badge badge-green">✓ Available</span>
                </div>
              </div>

              {/* GPS Navigation Link */}
              <div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-black text-sm tracking-wide transition-all shadow-md shadow-amber-500/25 cursor-pointer"
                >
                  <Navigation2 className="w-4 h-4 text-white fill-white" /> Get GPS Directions to Location
                </a>
              </div>

              {/* About the Room & Preferences */}
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white mb-3 text-base sm:text-lg">
                  📝 About the Room & Preferences
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {descObj.text || 'No description provided by the roommate seeker.'}
                </p>
              </div>

              {/* Media Gallery Grid */}
              {(descObj.images?.length > 0 || descObj.video_url) && (
                <div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between text-base sm:text-lg">
                    <span>📸 Photos & Video Tour</span>
                    <span className="text-xs font-normal text-slate-400">
                      {descObj.images?.length || 0} Photos {descObj.video_url && '• 1 Video Tour'}
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {descObj.video_url && (
                      <div
                        onClick={() => setSelectedVideo(descObj.video_url!)}
                        className="relative rounded-2xl overflow-hidden w-28 h-28 cursor-pointer group bg-black shrink-0 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform duration-150 transform-gpu"
                      >
                        <video src={descObj.video_url} className="w-full h-full object-cover opacity-80" preload="metadata" />
                        <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/40 transition-all duration-200 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                          </div>
                        </div>
                      </div>
                    )}
                    {descObj.images?.map((photo: string, i: number) => (
                      <div
                        key={i}
                        onClick={() => setSelectedImage(photo)}
                        className="relative rounded-2xl overflow-hidden w-28 h-28 cursor-pointer group shrink-0 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform duration-150 transform-gpu"
                      >
                        <img src={photo} alt={`Room photo ${i + 1}`} className="w-full h-full object-cover transform-gpu" decoding="async" />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-200 flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities & Rules Grid (Matching PropertyDetailPage format) */}
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white mb-3 text-base sm:text-lg flex items-center gap-2">
                  <span>🏢</span> Included Amenities & House Rules
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {roommate.gender && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/80 dark:bg-emerald-950/20">
                      <span className="text-base">👥</span>
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate capitalize">{roommate.gender} Only</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />
                    </div>
                  )}
                  {roommate.food_preference && roommate.food_preference !== 'both' && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/80 dark:bg-emerald-950/20">
                      <span className="text-base">🍲</span>
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate capitalize">{roommate.food_preference} Diet</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />
                    </div>
                  )}
                  {roommate.sleep_schedule && roommate.sleep_schedule !== 'flexible' && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/80 dark:bg-emerald-950/20">
                      <span className="text-base">🌙</span>
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate capitalize">{roommate.sleep_schedule.replace('_', ' ')}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />
                    </div>
                  )}
                  {roommate.smoking && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/80 dark:bg-emerald-950/20">
                      <span className="text-base">🚬</span>
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate capitalize">Smoking Allowed</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />
                    </div>
                  )}

                  {descObj.amenities?.filter(Boolean).map(am => (
                    <div key={am} className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/80 dark:bg-emerald-950/20">
                      <span className="text-base">✨</span>
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate capitalize">{am}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              <div ref={specificationsEndRef} />
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Contact Sidebar Card (Matching PropertyDetailPage) */}
          <div className="order-2 lg:col-span-1 space-y-6 w-full lg:sticky lg:top-20">
            <div className="card p-6 border-2 border-brand-500/20 bg-brand-50/20 dark:bg-slate-900 shadow-xl rounded-3xl space-y-5">

              {/* Owner Avatar & Verified Banner */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-brand-500/20 shrink-0">
                  {getInitials(ownerName)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{ownerName}</h3>
                    {((roommate as any).verified || (roommate as any).profiles?.verified) && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-0.5">{roommate.college}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-brand-500" /> Direct Roommate Seeker
                  </p>
                </div>
              </div>

              {/* Direct Phone Number display */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Contact Number:</span>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                  {formattedPhone}
                </span>
              </div>

              {/* Contact Action Buttons */}
              <div className="space-y-2.5">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  href={`tel:${phone10}`}
                  className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-brand-500/25 cursor-pointer"
                >
                  <Phone className="w-4 h-4" /> Call  Now
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-emerald-500/25 animate-pulse-ring cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> Chat on WhatsApp
                </motion.a>
              </div>

              {/* Trust Guarantee Note */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-700 dark:text-slate-200">100% Verified Student:</strong> FlatsNFood guarantees direct student-to-student contact with zero brokerage fee.
                </p>
              </div>
            </div>

            {/* Student Safety Card */}
            <div className="card p-5 rounded-3xl space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>🛡️</span> Safety & Student Trust
              </h4>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>College affiliation verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Zero brokerage or agent fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Direct phone & WhatsApp contact</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY CONTACT BAR (Matching PropertyDetailPage) */}
      <AnimatePresence>
        {showStickyMobileBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md lg:hidden z-40 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Monthly Rent</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(roommate.budget_min)}
                  <span className="text-[10px] font-normal text-slate-400"> /mo</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-1 justify-end">
                <a
                  href={`tel:${phone10}`}
                  className="py-2.5 px-4 rounded-xl bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Media Modal */}
      {(selectedImage || selectedVideo) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setSelectedImage(null); setSelectedVideo(null); }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 max-w-5xl w-full h-full flex flex-col items-center justify-center pointer-events-none"
          >
            <button
              onClick={() => { setSelectedImage(null); setSelectedVideo(null); }}
              className="absolute top-0 right-0 sm:-right-4 sm:-top-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors pointer-events-auto z-20"
            >
              <X className="w-6 h-6" />
            </button>

            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Fullscreen view"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl pointer-events-auto"
              />
            ) : selectedVideo ? (
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl pointer-events-auto bg-black"
              />
            ) : null}
          </motion.div>
        </div>
      )}
    </div>
  )
}
