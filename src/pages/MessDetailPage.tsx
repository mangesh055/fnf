import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Star, Phone, CheckCircle, ChevronLeft, Navigation2, Clock, ShieldCheck, ExternalLink, User, Utensils, Image, MessageSquare, Info, Trash2, X, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchMesses, fetchMessPlans, fetchReviews, invalidatePlatformCache } from '../lib/platformData'
import { gatewayFetch } from '../lib/apiGateway'
import { formatCurrency, mealTypeLabels, messStatusConfig, computeMessStatus, getMessServiceStatusDetails } from '../lib/utils'
import { cn } from '../lib/utils'
import type { MealType } from '../types'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

type Tab = 'dine' | 'photos' | 'menu' | 'review'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dine', label: 'DINE', icon: <Utensils className="w-3.5 h-3.5" /> },
  { id: 'photos', label: 'PHOTOS', icon: <Image className="w-3.5 h-3.5" /> },
  { id: 'menu', label: 'MENU', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: 'review', label: 'REVIEW', icon: <Star className="w-3.5 h-3.5" /> },
]

export default function MessDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState<Tab>('dine')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const { profile } = useAuthStore()

  const [newReview, setNewReview] = useState('')
  const [newRating, setNewRating] = useState(0)
  const [reviewsList, setReviewsList] = useState<any[]>([])
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [mess, setMess] = useState<any | null>(null)
  const [displayPlans, setDisplayPlans] = useState<any[]>([])
  const [todayMenu, setTodayMenu] = useState<Record<MealType, string[]>>({ breakfast: [], lunch: [], dinner: [], snack: [] })
  const [categoryMenuImages, setCategoryMenuImages] = useState<Record<string, string>>({})
  const [menuImageUrl, setMenuImageUrl] = useState<string | null>(null)
  const [menuCard, setMenuCard] = useState<{ name: string, price: string }[]>([])

  const handleShare = () => {
    const url = window.location.href
    const shareText = `Check this out on FlatsNFood: ${url}`
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
  }

  useEffect(() => {
    const load = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0]

        // Fire mess list and reviews in parallel
        const [messes, reviews] = await Promise.all([
          fetchMesses(),
          id ? fetchReviews({ messId: id }) : Promise.resolve([]),
        ])

        const targetMess = messes?.find((item) => item.id === id) || messes?.[0] || null
        setMess(targetMess)
        setReviewsList(reviews)
        setMenuCard(targetMess?.menu_card || [])

        if (targetMess) {
          // Fire plans and today's menu in parallel
          const [plans, menuRes] = await Promise.all([
            fetchMessPlans(targetMess.id),
            gatewayFetch(`/messes/menus?owner_id=${targetMess.owner_id}&date=${todayStr}`)
          ])

          setDisplayPlans(plans)

          const menuData = (menuRes.success && Array.isArray(menuRes.data) && menuRes.data.length > 0) ? menuRes.data[0] : null
          console.log('[MessDetailPage] menuRes:', menuRes)
          console.log('[MessDetailPage] menuData:', menuData)
          console.log('[MessDetailPage] todayStr:', todayStr)
          if (menuData) {
            console.log('[MessDetailPage] Setting todayMenu state with menuData')
            setTodayMenu({
              breakfast: menuData.breakfast || [],
              lunch: menuData.lunch || [],
              dinner: menuData.dinner || [],
              snack: menuData.snack || []
            })
            const catImgs: Record<string, string> = { ...(menuData.category_images || {}) }
            if (menuData.breakfast_image) catImgs.breakfast = menuData.breakfast_image
            if (menuData.lunch_image) catImgs.lunch = menuData.lunch_image
            if (menuData.dinner_image) catImgs.dinner = menuData.dinner_image
            if (menuData.snack_image) catImgs.snack = menuData.snack_image
            setCategoryMenuImages(catImgs)
            setMenuImageUrl(menuData.image_url || null)
          } else {
            console.log('[MessDetailPage] No menuData found for today. Resetting state.')
            setTodayMenu({ breakfast: [], lunch: [], dinner: [], snack: [] })
            setCategoryMenuImages({})
            setMenuImageUrl(null)
          }
        }
      } catch (error) {
        console.error('Failed to load mess detail:', error)
        setMess(null)
        setReviewsList([])
        setDisplayPlans([])
      }
    }

    load()
  }, [id])

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReview.trim() || newRating === 0) return

    if (!mess) return

    const newR = {
      id: `review-${Date.now()}`,
      mess_id: mess.id,
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
          mess_id: newR.mess_id,
          reviewer_id: newR.reviewer_id,
          reviewer_name: newR.full_name,
          rating: newR.rating,
          comment: newR.comment
        })
      })
      if (!res.success) {
        console.error('Failed to save mess review:', res.error)
        return
      }

      const newReviewsList = [{ ...newR, profiles: { full_name: newR.full_name } }, ...reviewsList]
      setReviewsList(newReviewsList)
      setNewReview('')
      setNewRating(0)

      const newCount = newReviewsList.length
      const newAvgRating = Number((newReviewsList.reduce((acc, curr) => acc + curr.rating, 0) / newCount).toFixed(1))
      setMess((prev: any) => ({ ...prev, rating: newAvgRating, review_count: newCount }))

      invalidatePlatformCache()
    })()
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Delete this review?')) return
    const res = await gatewayFetch(`/properties/reviews/${reviewId}`, { method: 'DELETE' })
    if (!res.success) {
      console.error('Failed to delete review', res.error)
      return
    }
    const newReviewsList = reviewsList.filter(r => r.id !== reviewId)
    setReviewsList(newReviewsList)

    const newCount = newReviewsList.length
    const newAvgRating = newCount > 0 ? Number((newReviewsList.reduce((acc, curr) => acc + curr.rating, 0) / newCount).toFixed(1)) : 5.0

    setMess((prev: any) => ({ ...prev, rating: newAvgRating, review_count: newCount }))

    invalidatePlatformCache()
  }

  if (!mess) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center text-slate-500">
        Loading mess details...
      </div>
    )
  }

  if (mess && !mess.verified && (!profile || (profile.role !== 'admin' && profile.id !== mess.owner_id))) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center p-4 text-center">
        <div className="card p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">⏳</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mess Pending Admin Approval</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            This mess listing has been registered and is currently under review by platform admins. It will become publicly visible once approved.
          </p>
          <Link to="/mess" className="btn-primary inline-block text-sm px-4 py-2">Back to Mess List</Link>
        </div>
      </div>
    )
  }

  const currentStatus = computeMessStatus(mess.day_service_time, mess.evening_service_time, mess.service_hours)
  const statusCfg = messStatusConfig[currentStatus] || messStatusConfig.open
  const statusDetails = getMessServiceStatusDetails(mess.day_service_time, mess.evening_service_time, mess.service_hours)

  const photos = mess.photos && mess.photos.length > 0
    ? mess.photos
    : [
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400',
    ]

  const googleMapsUrl = mess.google_maps_url || (mess.latitude && mess.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${mess.latitude},${mess.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mess.name} ${mess.address} ${mess.city}`)}`)

  const dayTimeDisplay = mess.day_service_time || '11:30 AM - 03:00 PM'
  const eveTimeDisplay = mess.evening_service_time || '07:00 PM - 10:30 PM'
  const serviceHours = `Day: ${dayTimeDisplay} | Eve: ${eveTimeDisplay}`

  const dynamicReviewCount = reviewsList.length
  const dynamicRating = dynamicReviewCount > 0
    ? (reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / dynamicReviewCount).toFixed(1)
    : (mess.rating || '5.0')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/mess" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-600 mb-6 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Mess List
        </Link>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 sm:gap-8">
          {/* ── 1. Hero Card (Mobile Order 1) ── */}
          <div className="lg:col-span-2 order-1">
            <div className="card overflow-hidden">
              <div className="relative h-48 sm:h-64">
                <img
                  src={photos[0]}
                  alt={mess.name}
                  className="w-full h-full object-cover"
                />
                <div className="hero-overlay absolute inset-0" />
                <div className="absolute bottom-3 left-3 text-white">
                  <h1 className="text-xl sm:text-3xl font-sans font-bold drop-shadow tracking-tight">{mess.name}</h1>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs opacity-90">
                    <MapPin className="w-3 h-3" />{mess.address}, {mess.city}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-xs opacity-80 font-medium">
                    <Clock className="w-3 h-3" /> Service Hours: {serviceHours}
                  </div>
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={cn('badge', statusCfg.color)}>{statusCfg.dot} {statusCfg.label}</span>
                  {mess.verified && <span className="badge badge-green">✓ Verified</span>}
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={handleShare}
                    title="Share Mess"
                    className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white text-slate-600 hover:text-brand-600 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-5">
                <div className="flex flex-wrap gap-2.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 star-filled" />
                    <span className="font-bold">{dynamicRating}</span>
                    <span className="text-slate-400 text-sm">({dynamicReviewCount} reviews)</span>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(mess.monthly_charge)}</span>/month
                  </span>
                  {mess.per_meal_charge && (
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(mess.per_meal_charge)}</span>/meal
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{mess.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {mess.food_type && mess.food_type !== 'both' && (
                    <span className={cn('tag border', mess.food_type === 'veg' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800')}>
                      {mess.food_type === 'veg' ? 'Pure Veg' : 'Non-Veg'}
                    </span>
                  )}
                  {mess.food_type === 'both' && (
                    <span className="tag border bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                      Veg & Non-Veg
                    </span>
                  )}
                  {mess.meal_types.map((m: any) => <span key={m} className="tag">{mealTypeLabels[m as MealType]}</span>)}
                </div>

                {/* CALL + DIRECTION */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <a href={`tel:${mess.contact_phone}`}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-brand-500 text-brand-600 dark:text-brand-400 font-bold text-[10px] sm:text-sm hover:bg-brand-500 hover:text-white transition-all">
                    <Phone className="w-3 h-3" /> CALL
                  </a>
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-orange-500 text-orange-600 font-bold text-[10px] sm:text-sm hover:bg-orange-500 hover:text-white transition-all">
                    <Navigation2 className="w-3 h-3" /> DIRECTION
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Tab Sections (Mobile Order 4) ── */}
          <div className="lg:col-span-2 lg:col-start-1 space-y-5 order-4">
            {/* ── Tab Bar ── */}
            <div className="card p-1 sm:p-2 sticky top-16 z-20 shadow-sm">
              <div className="grid grid-cols-4 gap-0.5 sm:gap-1">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2.5 px-1 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[8px] sm:text-xs transition-all',
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >

                {/* DINE TAB — Menu Card */}
                {activeTab === 'dine' && (
                  <div className="space-y-6">
                    {/* Today's Menu Section */}
                    <div className="card p-4 sm:p-6 space-y-4 sm:space-y-5">
                      <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        🍳 Mess Menu Card
                      </h3>
                      {menuCard && menuCard.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {menuCard.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</span>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white shrink-0">
                                ₹{item.price}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-sm text-slate-500">Menu card is not uploaded yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PHOTOS TAB */}
                {activeTab === 'photos' && (
                  <div className="card p-6">
                    <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-5 flex items-center justify-between">
                      <span>📸 Photos</span>
                      <span className="text-xs font-normal text-slate-400">{photos.length} images</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photos.map((photo: string, i: number) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.03 }}
                          onClick={() => setSelectedImage(photo)}
                          className="relative rounded-2xl overflow-hidden aspect-square cursor-pointer group"
                        >
                          <img src={photo} alt={`${mess.name} ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-200 flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MENU TAB */}
                {activeTab === 'menu' && (
                  <div className="card p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Daily Menu</h3>
                        <p className="text-xs text-slate-500">Resets automatically every day</p>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> TODAY'S MENU
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {mess.meal_types.map((meal: any) => {
                        const items = todayMenu[meal as MealType] || []
                        const catImg = categoryMenuImages[meal] || (Object.keys(categoryMenuImages).length === 0 ? menuImageUrl : null)
                        return (
                          <div key={meal} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/40">
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm capitalize flex items-center gap-2">
                                <span>{meal === 'breakfast' ? '🌅' : meal === 'lunch' ? '☀️' : meal === 'dinner' ? '🌙' : '🍪'}</span>
                                {mealTypeLabels[meal as MealType]}
                              </h4>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                                AVAILABLE
                              </span>
                            </div>

                            <div className="p-4 space-y-3">
                              {/* Category Photo */}
                              {catImg && (
                                <div
                                  onClick={() => setSelectedImage(catImg)}
                                  className="relative group rounded-xl overflow-hidden cursor-pointer max-h-56 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"
                                >
                                  <img src={catImg} alt={`${meal} Menu Photo`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                                    🔍 Click to expand {meal} photo
                                  </div>
                                </div>
                              )}

                              {/* Category Typed Items */}
                              {items.length > 0 && (
                                <ul className="space-y-1.5">
                                  {items.map((item: string) => (
                                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {!catImg && items.length === 0 && (
                                <p className="text-xs text-slate-400 italic text-center py-3">Menu not updated yet</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* REVIEW TAB */}
                {activeTab === 'review' && (
                  <div className="card p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">⭐ Reviews</h3>
                      <span className="badge badge-green text-xs">{dynamicReviewCount} total</span>
                    </div>

                    {/* Rating summary */}
                    {reviewsList.length > 0 && (
                      <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-slate-900 dark:text-white">{dynamicRating}</div>
                          <div className="flex gap-0.5 mt-1 justify-center">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={cn('w-3.5 h-3.5', s <= Math.floor(Number(dynamicRating)) ? 'star-filled' : 'star-empty')} />
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">out of 5</p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 w-3">{star}</span>
                              <Star className="w-3 h-3 text-amber-400" />
                              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${star === 5 ? 65 : star === 4 ? 20 : star === 3 ? 10 : star === 2 ? 3 : 2}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Review Form */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Write a Review</h4>
                      <form onSubmit={handleAddReview} className="space-y-3">
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

                    {/* Review cards */}
                    <div className="space-y-4">
                      {reviewsList.slice(0, 3).map(r => (
                        <div key={r.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                {(r.profiles?.full_name || r.full_name || 'A')[0]}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">{r.profiles?.full_name || r.full_name || 'Anonymous'}</p>
                                <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={cn('w-3 h-3', s <= r.rating ? 'star-filled' : 'star-empty')} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{r.comment}</p>
                        </div>
                      ))}
                    </div>

                    {reviewsList.length > 3 && (
                      <button
                        onClick={() => setShowAllReviews(true)}
                        className="w-full py-3 mt-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        Show all {reviewsList.length} reviews
                      </button>
                    )}

                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>


          {/* ── 2 & 3. Info Sidebar (Mobile Order 2) ── */}
          <div className="space-y-4 order-2 lg:col-start-3 lg:row-span-2 lg:self-start">
            {/* Location Details */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" /> Location Details
                </p>
                {mess.pincode && <span className="text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{mess.pincode}</span>}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{mess.address}</p>
                <p className="text-xs text-slate-500 mt-1">{mess.city}, {mess.state || 'Maharashtra'}</p>
              </div>
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-md shadow-orange-500/20">
                <Navigation2 className="w-4 h-4" /> Open in Google Maps <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>

            {/* Owner Details */}
            <div className="card p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Owner Details
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                    {((mess.profiles?.full_name || mess.name)?.[0] || 'M').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Verified Provider</p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{mess.profiles?.full_name || mess.name}</p>
                    <p className="text-xs text-slate-500">{mess.contact_phone}</p>
                  </div>
                </div>
                {mess.verified && (
                  <div className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-full px-2.5 py-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
                  </div>
                )}
              </div>
            </div>

            {/* Operating Details */}
            <div className="card p-5 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-500" /> Operating Details
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">☀️ Day Service</span><span className="font-bold text-slate-900 dark:text-white">{dayTimeDisplay}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">🌙 Evening Service</span><span className="font-bold text-slate-900 dark:text-white">{eveTimeDisplay}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Monthly</span><span className="font-bold text-slate-900 dark:text-white">{formatCurrency(mess.monthly_charge)}</span></div>
                {mess.per_meal_charge && <div className="flex justify-between"><span className="text-slate-500">Per Meal</span><span className="font-bold text-slate-900 dark:text-white">{formatCurrency(mess.per_meal_charge)}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Live Status</span>
                  <span className={cn('font-bold', currentStatus === 'open' ? 'text-emerald-500' : 'text-red-500')}>
                    {statusCfg.dot} {statusCfg.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Plan summary hidden on mobile since full plans are below */}
            <div className="card p-4 hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl flex-shrink-0">💳</div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Monthly Subscription</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {displayPlans.length > 0
                      ? `${displayPlans.length} plan${displayPlans.length > 1 ? 's' : ''} • from ${formatCurrency(Math.min(...displayPlans.map((p: any) => p.price)))}/mo`
                      : 'Not currently available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Show All Reviews Modal */}
      <AnimatePresence>
        {showAllReviews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
          >
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 star-filled" /> All Reviews ({reviewsList.length})
                </h3>
                <button
                  onClick={() => setShowAllReviews(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-4">
                {reviewsList.map(r => (
                  <div key={r.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                          {(r.profiles?.full_name || r.full_name || 'A')[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{r.profiles?.full_name || r.full_name || 'Anonymous'}</p>
                          <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={cn('w-3 h-3', s <= r.rating ? 'star-filled' : 'star-empty')} />
                          ))}
                        </div>
                        {profile?.id && r.reviewer_id === profile.id && (
                          <button
                            onClick={() => handleDeleteReview(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 max-w-5xl w-full h-full flex flex-col items-center justify-center pointer-events-none"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-0 right-0 sm:-right-4 sm:-top-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors pointer-events-auto"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedImage}
                alt="Fullscreen view"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl pointer-events-auto"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
