import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Phone, MessageSquare, MapPin, Tag, Calendar, ShieldCheck, 
  Heart, Share2, ExternalLink, X, ChevronLeft, ChevronRight, AlertTriangle, 
  User, Navigation2, ShoppingBag, Eye
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn, formatCurrency, formatDate, getInitials } from '../lib/utils'
import { fetchCommunityPosts, invalidatePlatformCache } from '../lib/platformData'
import { useFavoriteStore } from '../store/favoriteStore'
import { useAuthStore } from '../store/authStore'
import { gatewayFetch } from '../lib/apiGateway'
import toast from 'react-hot-toast'

export default function CommunityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const routeLocation = useLocation()
  const statePost = routeLocation.state?.post

  const [post, setPost] = useState<any>(statePost || null)
  const [loading, setLoading] = useState(!statePost)
  const { isPostFavorite, togglePostFavorite } = useFavoriteStore()
  const favorited = id ? isPostFavorite(id) : false

  const handleShare = () => {
    const url = window.location.href
    const shareText = `Check this out on FlatsNFood: ${url}`
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
  }
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    let isMounted = true

    const load = async () => {
      // Check cache first for instant load
      try {
        const cachedPosts = await fetchCommunityPosts()
        const found = cachedPosts.find((p: any) => String(p.id) === String(id))
        if (found && isMounted) {
          setPost(found)
          setLoading(false)
          return
        }
      } catch (e) {}

      // Direct Supabase query with timeout fallback
      try {
        const fetchPromise = supabase
          .from('community_posts')
          .select('*')
          .eq('id', id)
          .single()

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout loading post details')), 3500)
        )

        const res: any = await Promise.race([fetchPromise, timeoutPromise])
        if (res?.data && isMounted) {
          setPost(res.data)
        }
      } catch (err) {
        console.error('Failed to load community post details:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => { isMounted = false }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading item details...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-5xl mb-3">🛍️</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Item Listing Not Found</h2>
        <p className="text-sm text-slate-500 mb-5">This classified ad or post has been removed or is no longer active.</p>
        <button onClick={() => navigate('/community')} className="btn-primary">Back to Marketplace</button>
      </div>
    )
  }

  let textContent = post.content
  let phone = ''
  let location = ''
  let images: string[] = post.images || []
  let video_url = ''
  
  try {
    const parsed = JSON.parse(post.content)
    if (parsed.text !== undefined) {
      textContent = parsed.text
      phone = parsed.phone || ''
      location = parsed.location || ''
      if (parsed.images && parsed.images.length > 0) {
        images = parsed.images
      }
      if (parsed.video_url) {
        video_url = parsed.video_url
      }
    }
  } catch (e) {}

  const sellerName = post.full_name || post.profiles?.full_name || 'Campus Student'
  const displayPhone = phone || post.phone || post.profiles?.phone || '9876543210'
  const digitsOnly = displayPhone.replace(/[^0-9]/g, '')
  const phone10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly
  const formattedPhone = phone ? `+91 ${phone10}` : 'Not Provided'
  const whatsappUrl = `https://wa.me/91${phone10}?text=${encodeURIComponent(
    `Hi ${sellerName}, I am interested in your item "${post.title}" listed on FlatsNFood Marketplace. Is it still available?`
  )}`

  const googleMapsUrl = location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('VIT Pune, Kothrud')}`

  const postedDate = post.created_at ? formatDate(post.created_at) : 'Recently'

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pt-16 pb-24 lg:pb-16">
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* OLX Style Breadcrumb / Back Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/community" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-brand-600 transition-colors text-sm font-semibold">
            <ChevronLeft className="w-4 h-4" /> Back to Marketplace & Community
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Marketplace</span> / <span className="capitalize text-slate-600 dark:text-slate-300 font-medium">{post.category || 'General'}</span>
          </div>
        </div>

        {/* OLX Two-Column Layout Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT COLUMN: Main Media Carousel, Title, Specifications & Description */}
          <div className="order-1 lg:col-span-2 space-y-5 w-full">
            
            {/* OLX Hero Photo Gallery Carousel Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="relative h-72 sm:h-96 w-full bg-slate-900 flex items-center justify-center">
                {images.length > 0 ? (
                  <>
                    <img 
                      src={images[activeImageIndex % images.length]} 
                      alt={post.title} 
                      onClick={() => setSelectedImage(images[activeImageIndex % images.length])}
                      className="w-full h-full object-contain cursor-pointer transform-gpu" 
                      decoding="async"
                    />
                    
                    {/* Carousel Prev/Next Controls */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        
                        {/* Photo Counter Badge (OLX Style) */}
                        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-sm font-semibold">
                          📷 {activeImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
                    <ShoppingBag className="w-16 h-16 mb-2 opacity-40" />
                    <span className="text-base font-bold text-white/90">No Item Image Uploaded</span>
                    <span className="text-xs text-white/60 mt-0.5">Seller has not attached photos for this listing</span>
                  </div>
                )}

                {/* Top Action Buttons (Favorite & Share) */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  <button 
                    onClick={() => {
                      if (id) {
                        togglePostFavorite(id)
                        toast.success(favorited ? 'Removed from favorites' : 'Added to favorites!')
                      }
                    }}
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-md cursor-pointer',
                      favorited ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-red-500'
                    )}
                  >
                    <Heart className={cn('w-4.5 h-4.5', favorited && 'fill-current')} />
                  </button>
                  <button
                    onClick={handleShare}
                    title="Share Listing"
                    className="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-white hover:text-brand-600 transition-all shadow-md backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Share2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Photo Thumbnails Strip (OLX Style) */}
              {images.length > 1 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        'relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer',
                        idx === activeImageIndex ? 'border-brand-500 scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                      )}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* OLX Title & Overview Box (Mobile First Title Card) */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              
              {/* OLX Huge Asking Price Header */}
              {post.price !== undefined && post.price !== null && post.price !== '' && (
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {Number(post.price) === 0 ? 'Free' : formatCurrency(Number(post.price))}
                    </span>
                    <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Asking Price
                    </span>
                  </div>
                  <span className="badge badge-purple px-2.5 py-1 text-xs capitalize font-bold">
                    🏷️ {post.category || 'General'}
                  </span>
                </div>
              )}

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  {post.title}
                </h1>
              </div>

              {/* Location & Post Date Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{location || 'Kothrud, Pune'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Posted on {postedDate}</span>
                </div>
              </div>
            </div>

            {/* OLX Key Specifications Table */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋</span> Item Details & Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 font-semibold mb-0.5 uppercase tracking-wider text-[10px]">Category</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">{post.category || 'General'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 font-semibold mb-0.5 uppercase tracking-wider text-[10px]">Listed Date</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{postedDate}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 font-semibold mb-0.5 uppercase tracking-wider text-[10px]">Verification</p>
                  <p className={cn('font-bold flex items-center gap-1', (post.verified || post.profiles?.verified) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                    {(post.verified || post.profiles?.verified) ? <><ShieldCheck className="w-3.5 h-3.5" /> Verified Student</> : 'Pending Admin Verification'}
                  </p>
                </div>
                {location && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-3">
                    <p className="text-slate-400 font-semibold mb-0.5 uppercase tracking-wider text-[10px]">Pickup Location</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{location}</p>
                  </div>
                )}
              </div>
            </div>

            {/* OLX Item Description Box */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Description
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {textContent || 'No additional description provided by the seller.'}
              </div>
            </div>

            {/* Media Attachments Gallery */}
            {(images.length > 0 || video_url) && (
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>📸 Item Photos & Video</span>
                  <span className="text-xs font-normal text-slate-400">{images.length} images {video_url && '• 1 video'}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {video_url && (
                    <div
                      onClick={() => setSelectedVideo(video_url)}
                      className="relative rounded-xl overflow-hidden w-24 h-24 sm:w-28 sm:h-28 cursor-pointer group bg-black shrink-0 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform duration-150 transform-gpu"
                    >
                      <video src={video_url} className="w-full h-full object-cover opacity-80" preload="metadata" />
                      <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/40 transition-all duration-200 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                        </div>
                      </div>
                    </div>
                  )}
                  {images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className="relative rounded-xl overflow-hidden w-24 h-24 sm:w-28 sm:h-28 cursor-pointer group shrink-0 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform duration-150 transform-gpu"
                    >
                      <img src={img} alt={`Item photo ${i + 1}`} className="w-full h-full object-cover transform-gpu" decoding="async" />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-200 flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: OLX Seller Contact Sidebar Card */}
          <div className="order-2 lg:col-span-1 space-y-4 w-full lg:sticky lg:top-20">
            
            {/* OLX Price & Quick Buy Box (Desktop View) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hidden lg:block space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asking Price</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {post.price !== undefined && post.price !== null ? formatCurrency(post.price) : 'Contact Seller'}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" /> {location || 'Kothrud, Pune'}
              </p>
            </div>

            {/* OLX Seller Profile Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller Information</h3>
              
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-brand-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shrink-0">
                  {getInitials(sellerName)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{sellerName}</h4>
                    {(post.verified || post.profiles?.verified) && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {(post.verified || post.profiles?.verified) ? 'Verified Student Seller' : 'Student Seller'}
                  </p>
                  <p className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold mt-0.5">Member on FlatsNFood</p>
                </div>
              </div>

              {/* Direct Phone Display */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Seller Phone:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm tracking-wider">
                  {formattedPhone}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {post.author_id === profile?.id ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        navigate('/community', { state: { editPostId: post.id } })
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer border-none"
                    >
                      📝 Edit Listing
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this listing?')) {
                          const res = await gatewayFetch(`/community/posts/${post.id}`, {
                            method: 'DELETE'
                          })
                          if (res.success) {
                            invalidatePlatformCache()
                            toast.success('Listing deleted successfully!')
                            navigate('/community')
                          } else {
                            toast.error(res.error || 'Failed to delete listing')
                          }
                        }
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-red-500/20 cursor-pointer border-none"
                    >
                      ❌ Delete Listing
                    </motion.button>
                  </>
                ) : phone ? (
                  <>
                    <motion.a
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      href={`tel:${phone}`}
                      className="w-full py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
                    >
                      <Phone className="w-4 h-4" /> Call Seller Now
                    </motion.a>

                    <motion.a
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-emerald-500/20 animate-pulse-ring cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" /> Chat on WhatsApp
                    </motion.a>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500 font-medium">
                    No phone number provided for this listing.
                  </div>
                )}
              </div>
            </div>

            {/* OLX Safety Tips Card */}
          

            {/* Posted Location Map Button */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Navigation2 className="w-3.5 h-3.5 text-brand-500" /> View Location on Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY CONTACT & BUY BAR (OLX Style) */}
      {phone && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md lg:hidden z-40 shadow-2xl">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Asking Price</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                {post.price !== undefined && post.price !== null ? formatCurrency(post.price) : 'Contact Seller'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <a
                href={`tel:${phone}`}
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
        </div>
      )}

      {/* Fullscreen Media View Modal */}
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
