import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, MessageSquare, ShieldCheck, X, User, MapPin } from 'lucide-react'
import type { RoommateProfile } from '../../types'
import { formatCurrency, getInitials } from '../../lib/utils'

type RoommateRow = RoommateProfile & { 
  full_name?: string | null; 
  email?: string | null;
  phone?: string | null;
}

interface ContactRoommateModalProps {
  roommate: RoommateRow | null
  isOpen: boolean
  onClose: () => void
}

export default function ContactRoommateModal({ roommate, isOpen, onClose }: ContactRoommateModalProps) {
  if (!isOpen || !roommate) return null

  // Parse description for contact details or other fields if JSON
  let descObj = { 
    text: roommate.description || '', 
    deposit: 0, 
    total_roommates: 1, 
    location: '', 
    amenities: [] as string[], 
    images: [] as string[],
    phone: '',
    whatsapp: ''
  }
  
  try {
    const parsed = JSON.parse(roommate.description || '{}')
    if (parsed.text !== undefined) {
      descObj = { ...descObj, ...parsed }
    }
  } catch (e) {}

  const rawPhone = descObj.phone || roommate.phone || '9876543210'
  const digitsOnly = rawPhone.replace(/[^0-9]/g, '')
  const phone10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly
  const formattedPhone = `+91 ${phone10}`

  const rawWhatsapp = descObj.whatsapp || descObj.phone || roommate.phone || '9876543210'
  const waDigitsOnly = rawWhatsapp.replace(/[^0-9]/g, '')
  const waPhone10 = waDigitsOnly.length > 10 ? waDigitsOnly.slice(-10) : waDigitsOnly
  
  const whatsappUrl = `https://wa.me/91${waPhone10}?text=${encodeURIComponent(
    `Hi, I am interested in your roommate post on FlatsNFood. Are you still looking for a roommate near ${roommate.college}?`
  )}`
  const roommateName = roommate.full_name || 'Roommate Seeker'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-red-500 to-rose-600 p-5 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wide uppercase backdrop-blur-sm">
                No Brokerage Fee
              </span>
              {roommate.active ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Student
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[11px] font-semibold text-amber-200">
                  Pending Verification
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold font-display leading-tight">Get Roommate Contact</h3>
            <p className="text-xs text-rose-100 mt-1 line-clamp-1">{roommateName}</p>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            {/* Roommate Quick Info */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              {descObj.images?.[0] ? (
                <img
                  src={descObj.images[0]}
                  alt={roommateName}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                  {getInitials(roommateName)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">Looking for roommates in {descObj.location || roommate.city}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                  {roommate.college}
                </p>
                <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">
                  {roommate.budget_min === roommate.budget_max
                    ? formatCurrency(roommate.budget_min)
                    : `${formatCurrency(roommate.budget_min)} - ${formatCurrency(roommate.budget_max)}`
                  } <span className="text-[10px] font-normal text-slate-400">/month</span>
                </p>
              </div>
            </div>

            {/* Roommate Details Profile Card */}
            <div className="p-4 rounded-2xl border-2 border-red-100 dark:border-red-950/50 bg-red-50/40 dark:bg-red-950/10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-red-500/20 shrink-0">
                  {getInitials(roommateName)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-bold text-slate-900 dark:text-white text-base">{roommateName}</h5>
                    <span title="Verified Student"><ShieldCheck className="w-4 h-4 text-emerald-500" /></span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-red-500" /> Direct Roommate Seeker
                  </p>
                </div>
              </div>

              {/* Direct Phone Number display */}
              <div className="pt-2 border-t border-red-100 dark:border-red-900/30 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Roommate Number:</span>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                  {formattedPhone}
                </span>
              </div>
            </div>

            {/* Contact Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Call Button */}
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                href={`tel:${phone10}`}
                className="w-full py-3.5 px-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-red-500/25 cursor-pointer"
              >
                <Phone className="w-4 h-4" /> Call Roommate Now
              </motion.a>

              {/* WhatsApp Button with Conversion Pulse Ring */}
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

              {/* Email Button if available */}
              {roommate.email && (
                <a
                  href={`mailto:${roommate.email}?subject=${encodeURIComponent(`FlatsNFood Roommate Inquiry`)}`}
                  className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Mail className="w-4 h-4 text-slate-500" /> Send Email Inquiry
                </a>
              )}
            </div>

            {/* Trust badge note */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-700 dark:text-slate-200">100% Direct Student Contact:</strong> FlatsNFood guarantees direct connection with students, avoiding brokers and any middleman charges.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
