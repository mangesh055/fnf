import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Sparkles, CheckCircle2, X, MapPin, ShieldCheck, Flame, MessageSquare } from 'lucide-react'
import type { Property } from '../../types'
import { formatCurrency } from '../../lib/utils'
import { useVisitStore } from '../../store/visitStore'
import { useAuthStore } from '../../store/authStore'

interface ScheduleVisitModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
}

type Period = 'morning' | 'afternoon' | 'evening'

interface TimeSlot {
  id: string
  label: string
  period: Period
}

const TIME_SLOTS: TimeSlot[] = [
  // Morning slots
  { id: 'm1', label: '10:00 AM', period: 'morning' },
  { id: 'm2', label: '11:00 AM', period: 'morning' },
  { id: 'm3', label: '11:30 AM', period: 'morning' },
  // Afternoon slots
  { id: 'a1', label: '12:00 PM', period: 'afternoon' },
  { id: 'a2', label: '01:30 PM', period: 'afternoon' },
  { id: 'a3', label: '03:00 PM', period: 'afternoon' },
  { id: 'a4', label: '04:30 PM', period: 'afternoon' },
  { id: 'a5', label: '05:30 PM', period: 'afternoon' },
  // Evening slots
  { id: 'e1', label: '06:00 PM', period: 'evening' },
  { id: 'e2', label: '07:00 PM', period: 'evening' },
]

export default function ScheduleVisitModal({ property, isOpen, onClose }: ScheduleVisitModalProps) {
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0)
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('morning')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('11:00 AM')
  const [isBooked, setIsBooked] = useState<boolean>(false)

  const { addVisit } = useVisitStore()
  const { profile } = useAuthStore()

  // Generate 7 days starting from today
  const dates = useMemo(() => {
    const list = []
    const today = new Date()
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      list.push({
        fullDate: d,
        month: months[d.getMonth()],
        dateNum: d.getDate(),
        dayLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()],
        formattedStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })
    }
    return list
  }, [])

  if (!isOpen || !property) return null

  const handleConfirm = () => {
    const selectedDateObj = dates[selectedDateIndex]
    addVisit({
      property_id: property.id,
      property_title: property.title,
      property_image: property.images?.[0],
      owner_id: property.owner_id || 'owner1',
      student_id: profile?.id || 'student-demo',
      student_name: profile?.full_name || 'Student Visitor',
      student_phone: profile?.phone || '9876543210',
      visit_date: selectedDateObj.formattedStr,
      day_label: selectedDateObj.dayLabel,
      time_slot: selectedTimeSlot,
    })
    setIsBooked(true)
  }

  const handleResetAndClose = () => {
    setIsBooked(false)
    setSelectedDateIndex(0)
    setSelectedPeriod('morning')
    setSelectedTimeSlot('11:00 AM')
    onClose()
  }

  const periodSlots = TIME_SLOTS.filter(s => s.period === selectedPeriod)
  const morningCount = TIME_SLOTS.filter(s => s.period === 'morning').length
  const afternoonCount = TIME_SLOTS.filter(s => s.period === 'afternoon').length
  const eveningCount = TIME_SLOTS.filter(s => s.period === 'evening').length

  const selectedDateObj = dates[selectedDateIndex]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleResetAndClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Sheet Container */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col"
        >
          {!isBooked ? (
            <>
              {/* Header */}
              <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div>
                  <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Direct Owner Visit
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                    Schedule your FREE visit
                  </h3>
                </div>
                <button
                  onClick={handleResetAndClose}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 space-y-5 overflow-y-auto">
                {/* Social Proof Banner */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Flame className="w-4 h-4" />
                  </div>
                  <p className="font-medium leading-tight">
                    <strong className="font-bold">13 people</strong> are visiting this property today. Move fast or miss out!
                  </p>
                </div>

                {/* Property Context Header */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <img
                    src={property.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200'}
                    alt={property.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{property.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" /> {property.address}, {property.city}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      {formatCurrency(property.rent)}
                    </span>
                    <p className="text-[10px] text-slate-400">/month</p>
                  </div>
                </div>

                {/* Pick a Date */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Pick a Date
                  </h4>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {dates.map((d, idx) => {
                      const isSelected = selectedDateIndex === idx
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedDateIndex(idx)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[72px] border transition-all shrink-0 ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/50 dark:border-teal-400 text-teal-900 dark:text-teal-200 shadow-sm ring-2 ring-teal-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {d.month}
                          </span>
                          <span className="text-xl font-black my-0.5 leading-none">
                            {d.dateNum}
                          </span>
                          <span className={`text-[11px] font-semibold ${isSelected ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500'}`}>
                            {d.dayLabel}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Pick Time Slot */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Pick a Time Slot
                  </h4>

                  {/* Period Filter Tabs */}
                  <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPeriod('morning')
                        setSelectedTimeSlot(TIME_SLOTS.find(s => s.period === 'morning')?.label || '11:00 AM')
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        selectedPeriod === 'morning'
                          ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      🌅 Morning ({morningCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPeriod('afternoon')
                        setSelectedTimeSlot(TIME_SLOTS.find(s => s.period === 'afternoon')?.label || '12:00 PM')
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        selectedPeriod === 'afternoon'
                          ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      ☀️ Afternoon ({afternoonCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPeriod('evening')
                        setSelectedTimeSlot(TIME_SLOTS.find(s => s.period === 'evening')?.label || '06:00 PM')
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        selectedPeriod === 'evening'
                          ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      🌙 Evening ({eveningCount})
                    </button>
                  </div>

                  {/* Time Slot Options */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {periodSlots.map(slot => {
                      const isSelected = selectedTimeSlot === slot.label
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot.label)}
                          className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                            isSelected
                              ? 'border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/30 scale-[1.02]'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          {slot.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Sticky CTA */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Confirm Free Visit Booking
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  🔒 No obligation • Owner will be notified of your visit slot
                </p>
              </div>
            </>
          ) : (
            /* Success Booking Screen */
            <div className="p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 text-xs font-bold">
                  🎉 Visit Slot Confirmed!
                </span>
                <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-2">
                  Your Visit is Scheduled
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  The property owner has been notified and expects your visit at the selected time.
                </p>
              </div>

              {/* Slot summary card */}
              {(() => {
                const rawPhone = property.contact_phone || '9876543210'
                const digitsOnly = rawPhone.replace(/[^0-9]/g, '')
                const phone10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly
                const formattedPhone = `+91 ${phone10}`
                const whatsappMsg = `Hi! I have scheduled a FREE visit to inspect "${property.title}" on ${selectedDateObj.dayLabel}, ${selectedDateObj.formattedStr} at ${selectedTimeSlot} via FlatsNFood. Please confirm if this time slot works for you!`
                const whatsappLink = `https://wa.me/91${phone10}?text=${encodeURIComponent(whatsappMsg)}`

                return (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Property:</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{property.title}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Scheduled Date:</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400">{selectedDateObj.dayLabel}, {selectedDateObj.formattedStr}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Time Slot:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedTimeSlot}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Owner Contact:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formattedPhone}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-2 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      Free Property Tour • Direct Owner Guidance
                    </div>

                    {/* WhatsApp Redirect Button */}
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
                    >
                      <MessageSquare className="w-4 h-4" /> Send Visit Details on WhatsApp
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        window.open(whatsappLink, '_blank')
                        handleResetAndClose()
                      }}
                      className="w-full py-3 px-6 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm hover:bg-slate-800 transition-all shadow-md"
                    >
                      Done & Open WhatsApp
                    </button>
                  </div>
                )
              })()}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
