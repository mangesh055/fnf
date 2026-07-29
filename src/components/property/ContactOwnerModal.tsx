import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, MessageSquare, ShieldCheck, X, User, MapPin, ExternalLink } from 'lucide-react'
import type { Property } from '../../types'
import { formatCurrency, getInitials } from '../../lib/utils'

interface ContactOwnerModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
}

export default function ContactOwnerModal({ property, isOpen, onClose }: ContactOwnerModalProps) {
  if (!isOpen || !property) return null

  const rawPhone = property.contact_phone || '9876543210'
  const digitsOnly = rawPhone.replace(/[^0-9]/g, '')
  const phone10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly
  const formattedPhone = `+91 ${phone10}`

  const whatsappUrl = `https://wa.me/91${phone10}?text=${encodeURIComponent(
    `Hi, I am interested in your property "${property.title}" listed on FlatsNFood (${property.city}). Is it currently available?`
  )}`
  const ownerName = property.owner_name || property.profiles?.full_name || 'Property Owner'

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
              {property.verified ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Owner
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[11px] font-semibold text-amber-200">
                  Pending Verification
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold font-display leading-tight">Get Owner Contact</h3>
            <p className="text-xs text-rose-100 mt-1 line-clamp-1">{property.title}</p>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            {/* Property Quick Info */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <img
                src={property.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200'}
                alt={property.title}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{property.title}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                  {property.address}, {property.city}
                </p>
                <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(property.rent)} <span className="text-[10px] font-normal text-slate-400">/month</span>
                </p>
              </div>
            </div>

            {/* Owner Details Profile Card */}
            <div className="p-4 rounded-2xl border-2 border-red-100 dark:border-red-950/50 bg-red-50/40 dark:bg-red-950/10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-red-500/20 shrink-0">
                  {getInitials(ownerName)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-bold text-slate-900 dark:text-white text-base">{ownerName}</h5>
                    {property.verified && <span title="Verified Owner"><ShieldCheck className="w-4 h-4 text-emerald-500" /></span>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-red-500" /> Direct Property Owner
                  </p>
                </div>
              </div>

              {/* Direct Phone Number display */}
              <div className="pt-2 border-t border-red-100 dark:border-red-900/30 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Owner Number:</span>
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
                <Phone className="w-4 h-4" /> Call Owner Now
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
              {property.contact_email && (
                <a
                  href={`mailto:${property.contact_email}?subject=${encodeURIComponent(`Inquiry about ${property.title}`)}`}
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
                <strong className="text-slate-700 dark:text-slate-200">100% Direct Owner Contact:</strong> FlatsNFood guarantees no brokers and zero brokerage commission on this listing.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
