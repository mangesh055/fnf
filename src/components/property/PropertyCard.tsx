import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Wifi, Star, Heart, BedDouble, Bath, Shield, Zap, Car, Phone, Building2, Layers } from 'lucide-react'
import { cn, formatCurrency, propertyTypeLabels } from '../../lib/utils'
import type { Property } from '../../types'
import { useAuthStore } from '../../store/authStore'
import ContactOwnerModal from './ContactOwnerModal'
import { useFavoriteStore } from '../../store/favoriteStore'
import { getVITDistances } from '../../utils/distanceUtils'

interface PropertyCardProps {
  property: Property
  index?: number
}

export default function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const { profile } = useAuthStore()
  const { favoriteProperties, togglePropertyFavorite } = useFavoriteStore()
  const favorited = (favoriteProperties || []).includes(property.id)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showContactModal, setShowContactModal] = useState(false)

  const amenityIcons = [
    { key: 'wifi', icon: Wifi, label: 'WiFi' },
    { key: 'ac', icon: Zap, label: 'AC' },
    { key: 'parking', icon: Car, label: 'Parking' },
    { key: 'attached_bathroom', icon: Bath, label: 'Bathroom' },
    { key: 'security', icon: Shield, label: 'Security' },
  ]

  const cardPhotos = Array.from(new Set([
    ...(property.images || []),
    ...(property.sharing_configs?.flatMap(c => c.images || []) || [])
  ])).filter(Boolean) as string[]

  const rawAmenities = property.amenities
  const activeAmenities = typeof rawAmenities === 'string' ? (() => { try { return JSON.parse(rawAmenities) } catch { return {} } })() : (rawAmenities || {})

  // Format clean address without double spaces or comma spacing issues
  const cleanAddress = [property.address, property.city]
    .filter(Boolean)
    .join(', ')
    .replace(/\s+,\s+/g, ', ')

  useEffect(() => {
    if (cardPhotos.length <= 1) return
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % cardPhotos.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [cardPhotos.length])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.04 }}
        whileHover={{ y: -4 }}
        className="h-full"
      >
        <Link 
          to={`/properties/${property.id}`} 
          className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-xs hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col h-full overflow-hidden"
        >
          {/* Image Container with Soft Gradient Overlay */}
          <div className="relative overflow-hidden h-48 rounded-xl shrink-0 bg-slate-100 dark:bg-slate-800">
            {cardPhotos.length > 0 ? (
              <img
                key={cardPhotos[currentImageIndex % cardPhotos.length]}
                src={cardPhotos[currentImageIndex % cardPhotos.length]}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <Building2 className="w-8 h-8 mb-1.5 opacity-40 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">No Photo Uploaded</span>
              </div>
            )}

            {/* Top Gradient for Badge Readability */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900/60 via-slate-900/20 to-transparent pointer-events-none z-0" />

            {/* Top Left Property Type Badge */}
            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-white/20 text-white text-[10px] font-extrabold tracking-wide uppercase shadow-sm">
                {propertyTypeLabels[property.property_type] || property.property_type?.toUpperCase()}
              </span>
              {property.featured && (
                <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                  ★ Featured
                </span>
              )}
              {property.brokerage_applied ? (
                <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-extrabold shadow-sm">
                  Brokerage: ₹{property.brokerage_amount}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold shadow-sm">
                  No Brokerage
                </span>
              )}
            </div>

            {/* Top Right Favorite Button */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePropertyFavorite(property.id) }}
              className={cn(
                'absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-md z-10 cursor-pointer',
                favorited
                  ? 'bg-red-500 text-white shadow-red-500/30'
                  : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:bg-white hover:text-red-500'
              )}
            >
              <Heart className={cn('w-4 h-4 transition-transform duration-200', favorited && 'fill-current')} />
            </motion.button>

            {/* Bottom Dots for Slideshow */}
            {cardPhotos.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-slate-900/50 px-2 py-0.5 rounded-full backdrop-blur-md">
                {cardPhotos.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      i === (currentImageIndex % cardPhotos.length) ? "bg-white w-3" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Bottom Right Gender Badge */}
            <div className="absolute bottom-2.5 right-2.5 z-10">
              <span className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-extrabold backdrop-blur-md shadow-sm border border-white/20',
                property.gender_preference === 'male' ? 'bg-blue-600/90 text-white' :
                  property.gender_preference === 'female' ? 'bg-pink-600/90 text-white' :
                    'bg-emerald-600/90 text-white'
              )}>
                {property.gender_preference === 'male' ? '👨 Boys Only' :
                  property.gender_preference === 'female' ? '👩 Girls Only' : '👥 Any Gender'}
              </span>
            </div>
          </div>

          {/* Content Body */}
          <div className="pt-3 px-1 flex flex-col flex-1">
            {/* Title & Rating */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-1 group-hover:text-red-500 transition-colors">
                {property.title}
              </h3>
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md text-xs font-extrabold shrink-0">
                <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                <span>{property.rating || 4.5}</span>
                <span className="text-[10px] text-slate-400 font-normal">({property.review_count || 0})</span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-2.5 font-medium">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span className="truncate">{cleanAddress}</span>
            </div>

            {/* Distance Chips */}
            {(() => {
              const distances = getVITDistances(property.latitude, property.longitude)
              if (!distances.length) return null
              return (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {distances.map(c => (
                    <span 
                      key={c.id} 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 inline-flex items-center gap-1"
                    >
                      📍 {c.formattedDistance} from {c.shortName}
                    </span>
                  ))}
                </div>
              )
            })()}

            {/* Sharing Configuration Pills */}
            {property.sharing_configs && property.sharing_configs.length > 0 && (
              <div className="mb-2.5 flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                  <Layers className="w-3 h-3 text-slate-500" />
                  {property.sharing_configs.map(c => (c.sharing_type || '1_sharing').replace('_sharing', ' Occupancy')).join(', ')}
                </span>
              </div>
            )}

            {/* Amenities Line */}
            <div className="flex items-center gap-1.5 mb-3">
              {amenityIcons.map(({ key, icon: Icon, label }) =>
                activeAmenities[key as keyof typeof activeAmenities] ? (
                  <div 
                    key={key} 
                    title={label} 
                    className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                ) : null
              )}
              {activeAmenities.furnished && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                  Furnished
                </span>
              )}
            </div>

            {/* Card Footer: Price & Contact Button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs sm:text-base font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                    {(() => {
                      if ((property.property_type === 'pg' || property.property_type === 'hostel') && property.sharing_configs?.length) {
                        const rents = property.sharing_configs.map(c => c.rent)
                        const min = Math.min(...rents)
                        const max = Math.max(...rents)
                        return min !== max ? `${formatCurrency(min)} - ${formatCurrency(max)}` : formatCurrency(min)
                      }
                      return formatCurrency(property.rent)
                    })()}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 whitespace-nowrap">
                    {(property.property_type === 'pg' || property.property_type === 'hostel') ? '/head/mo' : '/mo'}
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-400 whitespace-nowrap truncate">Deposit: {formatCurrency(property.deposit)}</p>
              </div>

              {/* Red Contact Owner CTA Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowContactModal(true)
                }}
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-[11px] sm:text-xs shadow-md shadow-red-500/20 transition-all flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Contact Owner</span>
              </motion.button>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Contact Modal */}
      <ContactOwnerModal
        property={property}
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </>
  )
}
