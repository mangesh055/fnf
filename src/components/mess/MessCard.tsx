import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Star, Heart, Clock, Phone, Pencil } from 'lucide-react'
import { cn, formatCurrency, messStatusConfig, mealTypeLabels, computeMessStatus } from '../../lib/utils'
import type { Mess } from '../../types'
import { useAuthStore } from '../../store/authStore'

import { useFavoriteStore } from '../../store/favoriteStore'

interface MessCardProps {
  mess: Mess
  index?: number
}

export default function MessCard({ mess, index = 0 }: MessCardProps) {
  const { isMessFavorite, toggleMessFavorite } = useFavoriteStore()
  const favorited = isMessFavorite(mess.id)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [editableMess, setEditableMess] = useState<Mess>(mess)
  const navigate = useNavigate()

  useEffect(() => {
    if (!mess.photos || mess.photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % mess.photos.length)
    }, 3000 + (index * 500));

    return () => clearInterval(interval);
  }, [mess.photos, index])

  useEffect(() => {
    setEditableMess(mess)
  }, [mess])

  const { profile } = useAuthStore()
  const currentStatus = computeMessStatus(editableMess.day_service_time, editableMess.evening_service_time, editableMess.service_hours)
  const statusCfg = messStatusConfig[currentStatus] || messStatusConfig.open
  const canEdit = profile?.role === 'admin'

  const defaultPhoto = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600'
  const photoUrl = (editableMess.photos && editableMess.photos.length > 0) ? editableMess.photos[currentImageIndex] : defaultPhoto

  const handleOpenEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canEdit) return
    navigate(`/dashboard/admin/messes/${editableMess.id}/edit`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.015, transition: { type: 'spring', stiffness: 350, damping: 22 } }}
      whileTap={{ scale: 0.985 }}
      className="h-full"
    >
      <Link to={`/mess/${mess.id}`} className="card-property card-shine group flex flex-col h-full p-2 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/15 border border-transparent hover:border-brand-500/30">
        {/* Image */}
        <div className="relative overflow-hidden h-40 sm:h-48 rounded-xl shrink-0">
          <img
            key={photoUrl}
            src={photoUrl}
            alt={mess.name}
            className="property-image w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out animate-in fade-in"
          />
          {/* Slideshow Dots */}
          {mess.photos && mess.photos.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/30 p-1 rounded-full backdrop-blur-md">
              {mess.photos.map((_, i) => (
                <div
                  key={i}
                  className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300",
                    i === currentImageIndex ? "bg-white scale-125 shadow-sm" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
          {/* Status Badge */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            <span className={cn('badge shadow-sm text-[10px] items-center gap-1.5', statusCfg.color)}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
              </span>
              {statusCfg.label}
            </span>
            {mess.featured && (
              <span className="badge badge-orange text-[10px] shadow-sm animate-badge-pulse">⭐ Featured</span>
            )}
          </div>
          {/* Favorite */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={(e) => { e.preventDefault(); toggleMessFavorite(editableMess.id) }}
            className={cn(
              'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 shadow-md backdrop-blur-sm z-10',
              favorited ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:bg-white hover:text-red-500'
            )}
          >
            <Heart className={cn('w-4 h-4 transition-transform duration-200', favorited && 'fill-current scale-110')} />
          </motion.button>
          {canEdit && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={handleOpenEdit}
              className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 shadow-md backdrop-blur-sm z-10"
              title="Edit mess"
            >
              <Pencil className="w-4 h-4" />
            </motion.button>
          )}
          {/* Verified */}
          {mess.verified && (
            <div className="absolute bottom-3 right-3 badge badge-green text-[10px] shadow-sm z-10">
              ✓ Verified
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-2 pt-3 pb-1 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-sans font-semibold tracking-tight text-slate-900 dark:text-white text-sm leading-tight group-hover:text-brand-600 transition-colors">
              {editableMess.name}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 star-filled" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{editableMess.rating}</span>
              <span className="text-[10px] text-slate-400">({editableMess.review_count})</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{editableMess.address}, {editableMess.city}</span>
          </div>

          {/* Meal Types */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {editableMess.food_type && editableMess.food_type !== 'both' && (
              <span className={cn('tag text-[10px] border', editableMess.food_type === 'veg' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800')}>
                {editableMess.food_type === 'veg' ? 'Pure Veg' : 'Non-Veg'}
              </span>
            )}
            {editableMess.food_type === 'both' && (
              <span className="tag text-[10px] border bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                Veg & Non-Veg
              </span>
            )}
            {editableMess.meal_types.map(meal => (
              <span key={meal} className="tag text-[10px]">
                {mealTypeLabels[meal]}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatCurrency(editableMess.monthly_charge)}
                </span>
                <span className="text-xs text-slate-400">/month</span>
              </div>
              {editableMess.per_meal_charge && (
                <p className="text-[10px] text-slate-400">{formatCurrency(editableMess.per_meal_charge)}/meal</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Digital Attendance</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
