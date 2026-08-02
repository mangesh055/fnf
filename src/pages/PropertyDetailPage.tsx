import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Phone, Mail, Star, Heart, Share2, ChevronLeft, ChevronRight, CheckCircle, Navigation2, ExternalLink, ShieldCheck, Trash2, X, Calendar, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { usePropertyStore } from '../store/propertyStore'
import { formatCurrency, propertyTypeLabels, formatDate, getInitials } from '../lib/utils'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { fetchReviews } from '../lib/platformData'
import { gatewayFetch } from '../lib/apiGateway'
import { supabase } from '../lib/supabase'
import { getVITDistances } from '../utils/distanceUtils'
import ContactOwnerModal from '../components/property/ContactOwnerModal'
import ScheduleVisitModal from '../components/property/ScheduleVisitModal'

type ReviewRow = {
  id: string
  reviewer_id: string
  property_id?: string
  rating: number
  comment: string
  created_at: string
  full_name?: string
  profiles?: { full_name?: string | null }
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const { properties, loadProperties, incrementPropertyViews, updatePropertyRating } = usePropertyStore()
  const property = properties.find(p => p.id === id)
  const [currentImage, setCurrentImage] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  const specificationsEndRef = useRef<HTMLDivElement>(null)
  const [showStickyMobileBar, setShowStickyMobileBar] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      if (specificationsEndRef.current) {
        const rect = specificationsEndRef.current.getBoundingClientRect()
        // Hide sticky mobile bar when user scrolls past specifications section
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

  const { profile } = useAuthStore()
  const [reviewsList, setReviewsList] = useState<ReviewRow[]>([])
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [newReview, setNewReview] = useState('')
  const [newRating, setNewRating] = useState(0)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const handleShare = () => {
    const url = window.location.href
    const shareText = `Check this out on FlatsNFood: ${url}`
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
  }

  useEffect(() => {
    // Only fetch if we don't already have data in the store
    if (properties.length === 0) {
      void loadProperties()
    }
  }, [loadProperties, properties.length])

  useEffect(() => {
    const loadReviews = async () => {
      if (!id) return
      try {
        const rows = await fetchReviews({ propertyId: id })
        setReviewsList(rows as ReviewRow[])
      } catch (error) {
        console.error('Failed to load property reviews from Supabase:', error)
        setReviewsList([])
      }
    }

    loadReviews()
  }, [id])

  // Track property view
  useEffect(() => {
    if (property && id) {
      const viewedKey = `viewed_${id}`
      if (!sessionStorage.getItem(viewedKey)) {
        sessionStorage.setItem(viewedKey, 'true')
        void incrementPropertyViews(id)
      }
    }
  }, [property?.id, id]) // Run once when property resolves

  if (!property) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center text-slate-500">
        Loading property details...
      </div>
    )
  }

  const isStudentPost = (property as any).is_student_request === true || property.profiles?.role === 'student'
  const isOwnerOrAdmin = profile?.id === property.owner_id || profile?.role === 'admin'
  if (isStudentPost && property.verified !== true && !isOwnerOrAdmin) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Pending Admin Approval</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          This student property request is currently under review by Admin and has not yet been approved for public display on the platform.
        </p>
        <Link to="/properties" className="btn-primary">Back to Properties</Link>
      </div>
    )
  }

  const dynamicReviewCount = reviewsList.length
  const dynamicRating = dynamicReviewCount > 0
    ? (reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / dynamicReviewCount).toFixed(1)
    : (property?.rating || 0)

  const handleDeleteReview = async (reviewId: string) => {
    if (!profile?.id) return
    const res = await gatewayFetch(`/properties/reviews/${reviewId}`, { method: 'DELETE' })
    if (!res.success) {
      console.error('Failed to delete review:', res.error)
      return
    }
    const newReviewsList = reviewsList.filter(r => r.id !== reviewId)
    setReviewsList(newReviewsList)

    const newCount = newReviewsList.length
    const newAvgRating = newCount > 0 ? Number((newReviewsList.reduce((acc, curr) => acc + curr.rating, 0) / newCount).toFixed(1)) : 5.0
    void updatePropertyRating(property.id, newAvgRating, newCount)
  }

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReview.trim() || newRating === 0) return

    const newR = {
      id: `review-${Date.now()}`,
      property_id: property.id,
      reviewer_id: profile?.id || 'anon',
      rating: newRating,
      comment: newReview,
      created_at: new Date().toISOString(),
      full_name: profile?.full_name || 'Anonymous'
    }

    void (async () => {
      const res = await gatewayFetch('/properties/reviews', {
        method: 'POST',
        body: JSON.stringify({
          id: newR.id,
          property_id: newR.property_id,
          reviewer_id: newR.reviewer_id,
          reviewer_name: newR.full_name,
          rating: newR.rating,
          comment: newR.comment
        })
      })
      if (!res.success) {
        console.error('Failed to save review:', res.error)
        return
      }

      const newReviewsList = [{ ...newR, profiles: { full_name: newR.full_name } }, ...reviewsList]
      setReviewsList(newReviewsList)
      setNewReview('')
      setNewRating(0)

      const newCount = newReviewsList.length
      const newAvgRating = Number((newReviewsList.reduce((acc, curr) => acc + curr.rating, 0) / newCount).toFixed(1))
      void updatePropertyRating(property.id, newAvgRating, newCount)
    })()
  }

  // Google Maps URL
  const googleMapsUrl = property.latitude && property.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.title} ${property.address} ${property.city}`)}`

  const amenityList = [
    { key: 'wifi', icon: '📶', label: 'WiFi' },
    { key: 'ac', icon: '❄️', label: 'AC' },
    { key: 'laundry', icon: '👕', label: 'Laundry' },
    { key: 'water', icon: '💧', label: 'Water 24/7' },
    { key: 'electricity', icon: '⚡', label: 'Electricity' },
    { key: 'cctv', icon: '📷', label: 'CCTV' },
    { key: 'security', icon: '🔒', label: 'Security' },
    { key: 'parking', icon: '🚗', label: 'Parking' },
    { key: 'attached_bathroom', icon: '🚿', label: 'Attached Bathroom' },
    { key: 'study_table', icon: '📚', label: 'Study Table' },
    { key: 'furnished', icon: '🛋️', label: 'Furnished' },
  ]

  const rawAmenities = property.amenities
  const activeAmenities = typeof rawAmenities === 'string' ? (() => { try { return JSON.parse(rawAmenities) } catch { return {} } })() : (rawAmenities || {})

  const detailPhotos = Array.from(new Set([
    ...(property.images || []),
    ...(property.sharing_configs?.flatMap(c => c.images || []) || [])
  ])).filter(Boolean) as string[]
  const primaryHeroPhoto = detailPhotos[0] || null
  const activeVideoUrl = property.video_url || property.sharing_configs?.find(c => c.video_url)?.video_url || ''

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back */}
        <Link to="/properties" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-600 transition-colors mb-6 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to Properties
        </Link>

        {isStudentPost && property.verified !== true && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center gap-3">
            <span className="text-xl">⏳</span>
            <div className="text-xs sm:text-sm">
              <p className="font-bold">Pending Admin Approval</p>
              <p>This student property request is under review by Admin and is visible only to you and Admin until approved.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Left Top: Images + Details */}
          <div className="order-1 lg:col-span-2 space-y-6 w-full">
            {/* Hero Image */}
            <div className="card overflow-hidden">
              <div className="relative h-64 sm:h-80">
                {primaryHeroPhoto ? (
                  <img onClick={() => setSelectedImage(primaryHeroPhoto)} src={primaryHeroPhoto} alt={property.title} className="w-full h-full object-cover cursor-pointer" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                    <Building2 className="w-12 h-12 mb-2 opacity-50 text-slate-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">No Property Photo Uploaded</span>
                    <span className="text-xs text-slate-400 mt-0.5">Owner has not uploaded property photos yet</span>
                  </div>
                )}
                {/* Top badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="badge badge-purple">{propertyTypeLabels[property.property_type]}</span>
                  {property.verified && <span className="badge badge-green">✓ Verified</span>}
                  {property.featured && <span className="badge badge-orange">⭐ Featured</span>}
                </div>
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={() => setFavorited(!favorited)}
                    className={cn('w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm',
                      favorited ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-600 hover:text-red-500')}>
                    <Heart className={cn('w-4 h-4', favorited && 'fill-current')} />
                  </button>
                  <button 
                    onClick={handleShare} 
                    title="Share Property"
                    className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white text-slate-600 hover:text-brand-600 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Property Info */}
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{property.title}</h1>
                  <div className="flex items-start gap-1.5 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                    <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{property.address}, {property.city}, {property.state} - {property.pincode}</span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 star-filled" />
                    <span className="font-bold text-slate-900 dark:text-white">{dynamicRating}</span>
                    <span className="text-slate-400 text-sm">({dynamicReviewCount})</span>
                  </div>
                  <span className={cn('badge sm:mt-1.5', property.gender_preference === 'male' ? 'badge-blue' : property.gender_preference === 'female' ? 'bg-pink-100 text-pink-700' : 'badge-green')}>
                    {property.gender_preference === 'male' ? '👨 Boys Only' : property.gender_preference === 'female' ? '👩 Girls Only' : '👥 Any Gender'}
                  </span>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{property.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-6">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-1 whitespace-nowrap truncate">
                    {(property.property_type === 'pg' || property.property_type === 'hostel')
                      ? (property.sharing_configs?.length ? 'Rent Range (Yearly)' : 'Yearly Rent')
                      : 'Monthly Rent'}
                  </p>
                  <p className="text-xs sm:text-base md:text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap truncate">
                    {(() => {
                      if ((property.property_type === 'pg' || property.property_type === 'hostel') && property.sharing_configs?.length) {
                        const rents = property.sharing_configs.map(c => c.rent)
                        const min = Math.min(...rents)
                        const max = Math.max(...rents)
                        return min !== max ? `${formatCurrency(min)} - ${formatCurrency(max)}` : formatCurrency(min)
                      }
                      return formatCurrency(property.rent)
                    })()}
                    {(property.property_type === 'pg' || property.property_type === 'hostel') ? (
                      <span className="text-[10px] sm:text-xs font-normal text-slate-400"> /head/year</span>
                    ) : (
                      <span className="text-[10px] sm:text-xs font-normal text-slate-400"> / month</span>
                    )}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-1 whitespace-nowrap truncate">Security Deposit</p>
                  <p className="text-xs sm:text-base md:text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap truncate">{formatCurrency(property.deposit)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-1 whitespace-nowrap truncate">Brokerage</p>
                  <p className={cn("text-xs sm:text-base md:text-lg font-bold whitespace-nowrap truncate", property.brokerage_applied ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400")}>
                    {property.brokerage_applied ? formatCurrency(property.brokerage_amount || 0) : 'No Brokerage'}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-1 whitespace-nowrap truncate">
                    {(property.property_type === 'pg' || property.property_type === 'hostel') ? 'Total Beds Left' : 'Available Rooms'}
                  </p>
                  <p className="text-xs sm:text-base md:text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap truncate">
                    {(property.property_type === 'pg' || property.property_type === 'hostel') && property.sharing_configs?.length
                      ? `${property.sharing_configs.reduce((acc, c) => acc + (c.available_beds || 0), 0)} beds`
                      : (property.available_rooms ?? 'N/A')}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-1 whitespace-nowrap truncate">Status</p>
                  <span className={cn('badge text-[10px] sm:text-xs', property.availability ? 'badge-green' : 'badge-red')}>
                    {property.availability ? '✓ Available' : 'Full'}
                  </span>
                </div>
              </div>

              {/* GPS Directions Link */}
              <div className="mb-6">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-black text-sm tracking-wide transition-all shadow-md shadow-amber-500/25 cursor-pointer"
                >
                  <Navigation2 className="w-4 h-4 text-white fill-white" /> Get GPS Directions
                </a>
              </div>

              {/* VIT PUNE CAMPUS PROXIMITY CARD */}
              {(() => {
                const distances = getVITDistances(property.latitude, property.longitude)
                if (!distances.length) return null
                return (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 mb-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5 uppercase tracking-wide">
                        <span>🎓</span> Proximity to VIT Pune Campuses
                      </h4>
                      <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 px-2 py-0.5 rounded font-bold">
                        Auto-Calculated GPS
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {distances.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/40 shadow-xs">
                          <div>
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{c.name}</p>
                            <p className="text-[10px] text-slate-400">Direct GPS distance</p>
                          </div>
                          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-xs">
                            📍 {c.formattedDistance}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* BUILDING & COMMON FACILITIES (Amenities) */}
              {Object.entries(activeAmenities).some(([_, active]) => Boolean(active)) && (
                <div className="mb-6">
                  <h3 className="font-display font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-base">
                    <span>🏢</span> {(property.property_type === 'pg' || property.property_type === 'hostel') ? 'Building & Common Facilities' : 'Amenities Provided'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(activeAmenities)
                      .filter(([_, active]) => Boolean(active))
                      .map(([key]) => {
                        const standard = amenityList.find(a => a.key === key)
                        const icon = standard ? standard.icon : '✨'
                        const label = standard ? standard.label : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                        return (
                          <div key={key} className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/80 dark:bg-emerald-950/20">
                            <span className="text-base">{icon}</span>
                            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate">{label}</span>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* MULTI-SHARING TIERS DISPLAY (for PG & Hostel) */}
              {/* Multi-Tier Sharing Room Categories (For PG & Hostel Only) */}
              {property.property_type !== 'flat' && property.sharing_configs && property.sharing_configs.length > 0 && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                          🛏️ Available Room Categories & Pricing
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-extrabold text-[11px] border border-purple-200 dark:border-purple-800 shrink-0">
                          {property.sharing_configs.length} Tiers
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Choose your preferred sharing option to view room photos and features
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {property.sharing_configs.map((tier, idx) => {
                      const rawType = tier?.sharing_type || '1_sharing'
                      const label = rawType === 'dormitory' ? 'Dormitory Hall' : rawType.replace('_', ' ').toUpperCase()
                      const hasPhotos = tier?.images && tier.images.length > 0

                      return (
                        <div key={idx} className="card p-4 sm:p-5 border border-slate-200 dark:border-slate-800 hover:border-brand-500/60 transition-all flex flex-col justify-between space-y-4 shadow-sm">
                          <div>
                            {/* Tier Top Badges Row */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="px-3 py-1 rounded-lg bg-brand-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-xs">
                                {label}
                              </span>
                              <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold shrink-0', tier.available_beds > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300')}>
                                {tier.available_beds > 0 ? `🟢 ${tier.available_beds} beds left` : '🔴 Sold Out'}
                              </span>
                            </div>

                            {/* Rent & Deposit */}
                            <div className="space-y-0.5 mb-3">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(tier.rent)}</span>
                                <span className="text-xs font-semibold text-slate-400">/head/year</span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium">Security Deposit: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(tier.deposit)}</span></p>
                            </div>

                            {/* Room Photos Showcase */}
                            {hasPhotos && (
                              <div className="mt-3">
                                <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                                  <span>📸</span> {label} Room Photos
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {tier.images!.slice(0, 2).map((img, i) => (
                                    <div
                                      key={i}
                                      onClick={() => setSelectedImage(img)}
                                      className="relative h-24 rounded-xl overflow-hidden cursor-pointer group border border-slate-200 dark:border-slate-800"
                                    >
                                      <img src={img} alt={`${label} photo ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      {i === 1 && tier.images!.length > 2 && (
                                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-bold text-xs">
                                          +{tier.images!.length - 2} More
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Room Features Badges */}
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                              <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Included Room Features</p>
                              <div className="flex flex-wrap gap-1.5">
                                {tier.attached_bathroom ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">🚿 Attached Bathroom</span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] border border-slate-200 dark:border-slate-700">🚿 Shared Bathroom</span>
                                )}
                                {tier.ac ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-semibold border border-blue-200 dark:border-blue-800">❄️ AC Room</span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] border border-slate-200 dark:border-slate-700">🌀 Fan Room</span>
                                )}
                                {tier.balcony && <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[11px] border border-amber-200 dark:border-amber-800">🌅 Private Balcony</span>}
                                {tier.study_desk && <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[11px] border border-purple-200 dark:border-purple-800">📚 Dedicated Desk</span>}
                                {tier.personal_wardrobe && <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[11px] border border-indigo-200 dark:border-indigo-800">🚪 Personal Wardrobe</span>}
                                {tier.custom_amenities && tier.custom_amenities.length > 0 && tier.custom_amenities.map((amenity: string, aIdx: number) => (
                                  <span key={aIdx} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">✨ {amenity}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Button */}
                          <a
                            href={`https://wa.me/91${property.contact_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I am interested in booking the ${label} at ${property.title}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full btn-secondary text-xs py-2.5 justify-center font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-brand-200 dark:border-brand-800"
                          >
                            💬 Enquire For {label}
                          </a>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* FLAT CONFIGURATION DISPLAY */}
              {property.property_type === 'flat' && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>🏠</span> Flat Specifications & Maintenance
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900">
                    <div>
                      <p className="text-xs text-slate-500">BHK Configuration</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">{property.flat_config?.bhk_type || property.flat_details?.bhk_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Furnishing Level</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">{(property.flat_config?.furnishing || property.flat_details?.furnishing)?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Maintenance Charges</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {property.flat_config?.maintenance_type === 'included' ? 'Included in Rent' : `₹${property.flat_config?.maintenance_charges || 1500}/mo Extra`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tenant Preference</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">{(property.flat_config?.tenant_preference || property.flat_details?.tenant_preference)?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Parking Facility</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">{(property.flat_config?.parking_type || property.flat_details?.parking_type)?.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Floor Details</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        Floor {property.flat_config?.floor_number || property.flat_details?.floor_number || 1} of {property.flat_config?.total_floors || property.flat_details?.total_floors || 1}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* HOSTEL CONFIGURATION DISPLAY */}
              {property.property_type === 'hostel' && (property.hostel_config || property.hostel_details) && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>🛡️</span> Hostel Warden, Mess & Curfew Rules
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900">
                    <div>
                      <p className="text-xs text-slate-500">Resident Warden</p>
                      <p className="font-bold text-purple-600 dark:text-purple-400">Available On-Site</p>
                      {property.hostel_config?.warden_phone && <p className="text-xs text-slate-500 mt-0.5">📞 {property.hostel_config.warden_phone}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Night Curfew</p>
                      <p className="font-bold text-red-600 dark:text-red-400">
                        {property.hostel_config?.curfew_time === 'no_curfew' ? 'No Curfew (24/7)' : (property.hostel_config?.curfew_time || property.hostel_details?.curfew_time || '9:30 PM')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Mess / Dining</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                        {property.hostel_config?.mess_option?.replace('_', ' ') || (property.hostel_details?.mess_included ? 'Included' : 'Optional')}
                      </p>
                    </div>
                    {property.hostel_config?.meals_offered && property.hostel_config.meals_offered.length > 0 && (
                      <div className="col-span-2 sm:col-span-3">
                        <p className="text-xs text-slate-500">Meals Served Daily</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{property.hostel_config.meals_offered.join(' • ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Marker at bottom of specifications section */}
              <div ref={specificationsEndRef} />
            </div>

            {/* Unified Media Gallery */}
            <div className="card p-6">
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-5 flex items-center justify-between">
                <span>📸 Property Media Gallery</span>
                <span className="text-xs font-normal text-slate-400">
                  {detailPhotos.length} photos {activeVideoUrl && '• 1 video'}
                </span>
              </h3>

              <div className="flex flex-wrap gap-3">
                {activeVideoUrl && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedVideo(activeVideoUrl)}
                    className="relative rounded-2xl overflow-hidden w-24 h-24 sm:w-28 sm:h-28 cursor-pointer group bg-black shrink-0 shadow-sm border border-slate-200 dark:border-slate-700"
                  >
                    <video src={activeVideoUrl} className="w-full h-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-105" preload="metadata" />
                    <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/40 transition-all duration-200 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                      </div>
                    </div>
                  </motion.div>
                )}
                {detailPhotos.map((photo, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedImage(photo)}
                    className="relative rounded-2xl overflow-hidden w-24 h-24 sm:w-28 sm:h-28 cursor-pointer group shrink-0 shadow-sm border border-slate-200 dark:border-slate-700"
                  >
                    <img src={photo} alt={`${property.title} ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-200 flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Left Bottom: Reviews */}
          <div className="order-3 lg:col-span-2 w-full">
            <div className="card p-4 sm:p-6">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg sm:text-xl mb-4 sm:mb-6">
                Reviews ({dynamicReviewCount})
              </h3>
              {reviewsList.length > 0 && (
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">{dynamicRating}</div>
                    <div className="flex justify-center gap-0.5 my-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={cn('w-4 h-4', s <= Math.floor(Number(dynamicRating)) ? 'star-filled' : 'star-empty')} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{dynamicReviewCount} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviewsList.filter(r => r.rating === star).length;
                      const percentage = dynamicReviewCount > 0 ? (count / dynamicReviewCount) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-2">{star}</span>
                          <Star className="w-3 h-3 text-amber-400" />
                          <div className="flex-1 progress-bar">
                            <div className="progress-fill" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Add Review Form */}
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full py-3 mb-4 sm:mb-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4" /> Write a Review
                </button>
              ) : (
                <div className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Write a Review</h4>
                    <button type="button" onClick={() => setShowReviewForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                  <form onSubmit={(e) => { handleAddReview(e); setShowReviewForm(false); }} className="space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewRating(s)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={cn('w-6 h-6', s <= newRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600')} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Share your experience..."
                      className="input-field w-full min-h-[80px] text-sm resize-none"
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!newReview.trim() || newRating === 0}
                      className="btn-primary w-full text-sm py-2 disabled:opacity-50"
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              )}

              {reviewsList.length > 0 ? (
                <div className="space-y-4">
                  {reviewsList.slice(0, 3).map(review => (
                    <div key={review.id} className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {getInitials(review.profiles?.full_name || review.full_name || 'U')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">{review.profiles?.full_name || review.full_name || 'Anonymous'}</p>
                            <p className="text-xs text-slate-400">{formatDate(review.created_at)}</p>
                          </div>
                          <div className="flex items-center justify-between my-1">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={cn('w-3 h-3', s <= review.rating ? 'star-filled' : 'star-empty')} />
                              ))}
                            </div>
                            {profile?.id && review.reviewer_id === profile.id && (
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete review"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No reviews yet. Be the first to review!</p>
              )}

              {reviewsList.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(true)}
                  className="w-full py-3 mt-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Show all {dynamicReviewCount} reviews
                </button>
              )}
            </div>
          </div>

          {/* Right: Contact + Location Card (Desktop Only, hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-1 lg:row-span-2 space-y-4 w-full">
            <div className="card p-6 sticky top-24 space-y-5">
              {/* Price */}
              <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {(() => {
                    if ((property.property_type === 'pg' || property.property_type === 'hostel') && property.sharing_configs?.length) {
                      const rents = property.sharing_configs.map(c => c.rent)
                      const min = Math.min(...rents)
                      const max = Math.max(...rents)
                      return min !== max ? `${formatCurrency(min)} - ${formatCurrency(max)}` : formatCurrency(min)
                    }
                    return formatCurrency(property.rent)
                  })()}
                </div>
                <p className="text-slate-500 text-sm mt-0.5">
                  {(property.property_type === 'pg' || property.property_type === 'hostel') ? '/head/year' : '/ month'} + {formatCurrency(property.deposit)} deposit
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20"
                >
                  <Phone className="w-4 h-4" /> Contact Owner
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20"
                >
                  <Calendar className="w-4 h-4" /> Schedule Free Visit
                </button>
              </div>

              {/* Property details */}
              <div className="space-y-2 text-sm pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between"><span className="text-slate-500">Property Type</span><span className="font-medium text-slate-900 dark:text-white">{propertyTypeLabels[property.property_type]}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Gender</span><span className="font-medium text-slate-900 dark:text-white capitalize">{property.gender_preference}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Available Rooms</span><span className="font-medium text-slate-900 dark:text-white">{property.available_rooms}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Verified</span>
                  <span className={property.verified ? 'text-emerald-500 font-medium flex items-center gap-1' : 'text-red-400 font-medium'}>
                    {property.verified ? <><ShieldCheck className="w-3.5 h-3.5" /> Yes</> : '✗ No'}
                  </span>
                </div>
              </div>

              {/* Location section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" /> Location
                </p>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{property.address}</p>
                  <p className="text-xs text-slate-500 mt-1">{property.city}, {property.state} — {property.pincode}</p>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-md shadow-orange-500/20"
                >
                  <Navigation2 className="w-4 h-4" /> Open in Google Maps <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show All Reviews Modal */}
      {showAllReviews && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 star-filled" /> All Reviews ({dynamicReviewCount})
              </h3>
              <button
                onClick={() => setShowAllReviews(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              {reviewsList.map(review => (
                <div key={review.id} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {getInitials(review.profiles?.full_name || review.full_name || 'U')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{review.profiles?.full_name || review.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-slate-400">{formatDate(review.created_at)}</p>
                      </div>
                      <div className="flex items-center justify-between my-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={cn('w-3 h-3', s <= review.rating ? 'star-filled' : 'star-empty')} />
                          ))}
                        </div>
                        {profile?.id && review.reviewer_id === profile.id && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Media Modal */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* NoBroker style Sticky Bottom Action Bar for Mobile / Tablet View */}
      <div className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 px-4 shadow-2xl flex items-center gap-3 transition-all duration-300 transform",
        showStickyMobileBar ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}>
        <button
          type="button"
          onClick={() => setShowContactModal(true)}
          className="flex-1 py-3 px-4 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/20"
        >
          <Phone className="w-4 h-4" /> Contact
        </button>
        <button
          type="button"
          onClick={() => setShowScheduleModal(true)}
          className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/20"
        >
          <Calendar className="w-4 h-4" /> Schedule Visit
        </button>
      </div>

      {/* Contact & Schedule Visit Modals */}
      <ContactOwnerModal
        property={property}
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      <ScheduleVisitModal
        property={property}
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
      />
    </div>
  )
}
