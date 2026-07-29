import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, TrendingUp, CreditCard, Calendar, QrCode, Download, ArrowUpRight, Search, Utensils, Building2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import StudentPropertyRequestView from '../../components/StudentPropertyRequestView'
import { useAuthStore } from '../../store/authStore'
import { useVisitStore } from '../../store/visitStore'
import { supabase } from '../../lib/supabase'
import { cn, formatCurrency, formatDate, getRemainingDays } from '../../lib/utils'
import { X, Clock, Edit2, Trash2 } from 'lucide-react'


type SubscriptionRow = {
  id: string
  student_id: string
  mess_id: string
  plan_id: string
  status: string
  start_date: string
  end_date: string
  amount_paid: number
  payment_status: string
  created_at: string
  remaining_days?: number
  total_meals?: number
  plan_name?: string
  plan_description?: string
}

type AttendanceRow = {
  id: string
  date: string
  breakfast: boolean
  lunch: boolean
  dinner: boolean
  snack: boolean
  mess_id?: string | null
}

type MessRow = {
  id: string
  name: string
  owner_id: string
  monthly_charge: number
}

type PlanRow = {
  id: string
  mess_id: string
  name: string
  description: string
  price: number
  duration_days: number
  meal_types: string[]
  active: boolean
}

type MenuRow = {
  breakfast: string[] | null
  lunch: string[] | null
  dinner: string[] | null
  snack: string[] | null
  breakfast_image?: string | null
  lunch_image?: string | null
  dinner_image?: string | null
  snack_image?: string | null
  category_images?: Record<string, string> | null
  image_url?: string | null
  date?: string
}

const emptyMenu: MenuRow = { breakfast: [], lunch: [], dinner: [], snack: [], image_url: null }

export default function StudentDashboard() {
  const { profile } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const [messes, setMesses] = useState<MessRow[]>([])
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null)
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionRow[]>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [menu, setMenu] = useState<MenuRow | null>(null)
  const [selectedMenuPhotoModal, setSelectedMenuPhotoModal] = useState<string | null>(null)
  const [selectedMess, setSelectedMess] = useState<MessRow | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanRow | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi')
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'qr' | 'paying' | 'success'>('details')
  const [checkoutQRUrl, setCheckoutQRUrl] = useState('')

  // Tour Reschedule States
  const [rescheduleVisitId, setRescheduleVisitId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('11:00 AM')

  const visitsList = useVisitStore(state => state.visits).filter(v => v.student_id === profile?.id)
  const updateVisitStatus = useVisitStore(state => state.updateVisitStatus)
  const updateVisit = useVisitStore(state => state.updateVisit)
  const loadVisits = useVisitStore(state => state.loadVisits)


  const view = location.pathname.endsWith('/subscription') ? 'subscription' : location.pathname.endsWith('/attendance') ? 'attendance' : location.pathname.endsWith('/add-property') ? 'add-property' : location.pathname.endsWith('/visits') ? 'visits' : 'overview'

  useEffect(() => {
    const load = async () => {
      if (!profile) return
      
      // Load visits
      await useVisitStore.getState().loadVisits()

      const [messesResult, subscriptionsResult, attendanceResult] = await Promise.all([
        supabase.from('messes').select('id, name, owner_id, monthly_charge').order('created_at', { ascending: false }),
        supabase.from('student_subscriptions').select('*').eq('student_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('student_attendance').select('*').eq('student_id', profile.id).order('date', { ascending: false }),
      ])

      const messRows = (messesResult.data || []) as MessRow[]
      const subscriptionRows = (subscriptionsResult.data || []) as SubscriptionRow[]
      const attendanceRows = (attendanceResult.data || []) as AttendanceRow[]

      setMesses(messRows)
      setAttendance(attendanceRows)

      const active = subscriptionRows.find((row) => row.status === 'active' && (row.remaining_days === undefined || row.remaining_days === null || row.remaining_days > 0)) || null
      setSubscription(active)
      setSubscriptionHistory(subscriptionRows.filter((row) => row.id !== active?.id))
      setSelectedMess(active ? messRows.find((mess) => mess.id === active.mess_id) || messRows[0] || null : messRows[0] || null)
    }

    void load()
  }, [profile])

  useEffect(() => {
    const loadPlansAndMenu = async () => {
      if (!selectedMess) return
      const todayStr = new Date().toISOString().split('T')[0]
      const [plansResult, menuResult] = await Promise.all([
        supabase.from('mess_plans').select('*').eq('mess_id', selectedMess.id).eq('active', true).order('price', { ascending: true }),
        supabase.from('mess_menus').select('breakfast, lunch, dinner, snack, breakfast_image, lunch_image, dinner_image, snack_image, category_images, image_url, date').eq('owner_id', selectedMess.owner_id).order('date', { ascending: false }).limit(1),
      ])
      const planRows = (plansResult.data || []) as PlanRow[]
      setPlans(planRows)
      
      let initialPlan = planRows[0] || null
      if (subscription && subscription.mess_id === selectedMess.id) {
        const activePlan = planRows.find(p => p.id === subscription.plan_id)
        if (activePlan) initialPlan = activePlan
      }
      
      setSelectedPlan(initialPlan)
      const fetchedMenu = (menuResult.data || [])[0] as MenuRow | undefined
      if (fetchedMenu && fetchedMenu.date === todayStr) {
        setMenu(fetchedMenu)
      } else {
        setMenu(null)
      }
    }

    void loadPlansAndMenu()
  }, [selectedMess, subscription])

  const filteredAttendance = useMemo(() => {
    if (!subscription) return attendance
    return attendance.filter((row) => new Date(row.date) >= new Date(subscription.start_date))
  }, [attendance, subscription])

  const totalMeals = filteredAttendance.reduce((acc, row) => acc + [row.breakfast, row.lunch, row.dinner, row.snack].filter(Boolean).length, 0)
  const remaining = subscription ? getRemainingDays(subscription.end_date) : 0

  const weeklyData = useMemo(() => {
    const buckets = Array.from({ length: 4 }, (_, index) => ({ week: `Week ${index + 1}`, meals: 0 }))
    const now = new Date()
    filteredAttendance.forEach((row) => {
      const recordDate = new Date(row.date)
      const diffDays = Math.floor((now.getTime() - recordDate.getTime()) / (24 * 60 * 60 * 1000))
      const bucketIndex = diffDays < 7 ? 3 : diffDays < 14 ? 2 : diffDays < 21 ? 1 : 0
      buckets[bucketIndex].meals += [row.breakfast, row.lunch, row.dinner, row.snack].filter(Boolean).length
    })
    return buckets
  }, [filteredAttendance])

  const spendingData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map((month, index) => ({ month, amount: subscription && index >= 3 ? subscription.amount_paid : 0 }))
  }, [subscription])

  const handlePurchase = async () => {
    if (!profile || !selectedMess || !selectedPlan) return

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + selectedPlan.duration_days)

    if (paymentMethod === 'upi') {
      const { data: settings } = await supabase.from('mess_payment_settings').select('*').eq('owner_id', selectedMess.owner_id).maybeSingle()
      if (!settings?.upi_id) {
        alert('This mess has not configured UPI payments yet.')
        return
      }

      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(`upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(selectedMess.name)}&am=${selectedPlan.price}&cu=INR`)
      setCheckoutQRUrl(url)
      setCheckoutStep('qr')
      return
    }

    setCheckoutStep('paying')
    const { error } = await supabase.from('student_subscriptions').insert({
      id: `sub-${Date.now()}`,
      student_id: profile.id,
      mess_id: selectedMess.id,
      plan_id: selectedPlan.id,
      status: 'active',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      amount_paid: selectedPlan.price,
      payment_status: 'paid',
    })

    if (error) {
      console.error('Failed to create subscription:', error)
      setCheckoutStep('details')
      return
    }

    setCheckoutStep('success')
  }

  const stats = [
    { label: 'Active Plan', value: subscription ? selectedPlan?.name || 'Active' : 'No Plan', icon: '💳', sub: subscription ? `${remaining} days left` : 'Subscribe now' },
    { label: 'Meals This Month', value: totalMeals, icon: '🍽️', sub: subscription ? `${subscriptionHistory.length + 1} subscription record(s)` : 'No data' },
    { label: 'Amount Paid', value: subscription ? formatCurrency(subscription.amount_paid) : '₹0', icon: '💰', sub: 'This period' },
    { label: 'Days Remaining', value: remaining, icon: '📅', sub: subscription ? 'Current plan' : '-' },
  ]

  if (view === 'overview') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Good morning, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Your campus life at a glance</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-1"><h3 className="font-display font-bold text-slate-900 dark:text-white mb-4">⚡ Quick Links</h3><div className="space-y-3"><Link to="/roommates" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">👥 Match Roommates</span><ArrowUpRight className="w-4 h-4 text-slate-400" /></Link><Link to="/community" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">📢 Campus Board</span><ArrowUpRight className="w-4 h-4 text-slate-400" /></Link><button onClick={() => navigate('/dashboard/student/add-property')} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">🏠 Request to Add Property</span><ArrowUpRight className="w-4 h-4 text-slate-400" /></button></div></div>
        </div>
      </div>
    )
  }

  if (view === 'subscription') {
    const activeMenu = menu || emptyMenu

    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Mess Subscriptions</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">View your active meal plan and today's menu.</p>
        </div>

        {subscription ? (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 md:col-span-1 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Utensils className="w-24 h-24" /></div>
              <p className="text-brand-100 text-[10px] uppercase font-bold tracking-wider">Active Meal Plan</p>
              <h3 className="text-2xl font-display font-bold mt-1">{subscription.plan_name || selectedPlan?.name || 'Active Plan'}</h3>
              <p className="text-sm font-semibold text-brand-100 mt-2 flex items-center gap-1">📍 {selectedMess?.name}</p>
              
              <div className="mt-6 bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/20">
                <p className="text-xs text-brand-100 uppercase tracking-wider mb-1 font-bold">Meals Left</p>
                <div className="text-3xl font-black">{subscription.remaining_days ?? remaining}</div>
              </div>

              <div className="mt-4 text-xs text-brand-100 space-y-1"><p>Start Date: {formatDate(subscription.start_date)}</p><p>End Date: {formatDate(subscription.end_date)}</p></div>
            </div>
            <div className="card p-6 md:col-span-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-display font-bold">Today's Menu</h3>
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  Updated Today
                </span>
              </div>

              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => {
                const catImg = (activeMenu as any)[`${meal}_image`] || activeMenu.category_images?.[meal] || (meal === 'lunch' ? activeMenu.image_url : null)
                const items = activeMenu[meal] || []
                if (!catImg && items.length === 0) return null
                return (
                  <div key={meal} className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                      <span>{meal === 'breakfast' ? '🌅' : meal === 'lunch' ? '☀️' : meal === 'dinner' ? '🌙' : '🍪'}</span>
                      {meal}
                    </p>

                    {catImg && (
                      <div 
                        onClick={() => setSelectedMenuPhotoModal(catImg)}
                        className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 cursor-pointer max-h-48 mb-2"
                      >
                        <img src={catImg} alt={`${meal} Menu Photo`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold">
                          🔍 Tap to expand {meal} photo
                        </div>
                      </div>
                    )}

                    {items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((item, i) => <span key={i} className="badge bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] shadow-sm">{item}</span>)}
                      </div>
                    )}
                  </div>
                )
              })}

              {!activeMenu.image_url && !activeMenu.breakfast_image && !activeMenu.lunch_image && !activeMenu.dinner_image && !activeMenu.snack_image && !activeMenu.category_images && !activeMenu.breakfast?.length && !activeMenu.lunch?.length && !activeMenu.dinner?.length && !activeMenu.snack?.length && (
                <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  Today's menu has not been updated yet by mess owner.
                </div>
              )}
            </div>

            {/* Menu Photo Zoom Modal */}
            {selectedMenuPhotoModal && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedMenuPhotoModal(null)}>
                <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2">
                  <img src={selectedMenuPhotoModal} alt="Menu Photo Fullscreen" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
                  <button onClick={() => setSelectedMenuPhotoModal(null)} className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black">
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Active Subscription</h3>
            <p className="text-slate-500 dark:text-slate-400">You don't have an active meal plan right now. Mess owners can allocate a plan to you.</p>
          </div>
        )}

        {subscriptionHistory.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-display font-bold text-lg mb-4">Previous Plans</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptionHistory.map((sub) => (
                <div key={sub.id} className="card p-4 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm">{sub.plan_name || 'Legacy Plan'}</h4>
                    <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] uppercase">{sub.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Paid: {formatCurrency(sub.amount_paid)}</p>
                    <p>Ended: {formatDate(sub.end_date)}</p>
                    {sub.total_meals && <p>Total Meals: {sub.total_meals}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (view === 'attendance') {
    const now = new Date()
    const monthName = now.toLocaleString('default', { month: 'long' })
    const currentYear = now.getFullYear()
    const daysInMonthCount = new Date(currentYear, now.getMonth() + 1, 0).getDate()
    const daysInMonth = Array.from({ length: daysInMonthCount }, (_, index) => {
      const day = index + 1
      const dateStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const record = attendance.find((row) => row.date === dateStr)
      return { day, status: record ? ([record.breakfast, record.lunch, record.dinner, record.snack].some(Boolean) ? 'attended' : 'missed') : 'none' }
    })

    return (
      <div className="p-6 space-y-6">
        <div><h1 className="text-2xl font-display font-bold">Meal Attendance Log</h1><p className="text-slate-500 text-sm mt-1">Attendance rows are loaded from the database.</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="card p-5"><div className="text-2xl font-extrabold">{totalMeals}</div><div className="text-xs text-slate-500 mt-1">Scanned Meals</div></div><div className="card p-5"><div className="text-2xl font-extrabold">{subscription ? Math.min(100, Math.round((totalMeals / Math.max(1, filteredAttendance.length * 3)) * 100)) : 0}%</div><div className="text-xs text-slate-500 mt-1">Attendance rate</div></div><div className="card p-5"><div className="text-2xl font-extrabold text-brand-500">{remaining}</div><div className="text-xs text-slate-500 mt-1">Days remaining</div></div><div className="card p-5"><div className="text-2xl font-extrabold text-emerald-600">{subscriptionHistory.length}</div><div className="text-xs text-slate-500 mt-1">Past subscriptions</div></div></div>
        <div className="card p-6"><h3 className="font-display font-bold mb-4">Attendance Calendar ({monthName} {currentYear})</h3><div className="grid grid-cols-7 gap-2 max-w-md">{daysInMonth.map((day) => (<div key={day.day} className={cn('aspect-square rounded-xl flex items-center justify-center text-xs font-bold', day.status === 'attended' ? 'bg-emerald-500 text-white' : day.status === 'missed' ? 'bg-slate-200 text-slate-500' : 'bg-slate-50 text-slate-400')}>{day.day}</div>))}</div></div>
      </div>
    )
  }

  if (view === 'add-property') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold">Property Listing Request</h1>
            <p className="text-slate-500 text-sm mt-1">Submit your property details for admin approval.</p>
          </div>
          <button onClick={() => navigate('/dashboard/student')} className="btn-secondary text-sm">
            &larr; Back to Dashboard
          </button>
        </div>
        <StudentPropertyRequestView />
      </div>
    )
  }

  if (view === 'visits') {
    const timeSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
      '05:00 PM', '06:00 PM', '07:00 PM'
    ]

    const handleRescheduleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!rescheduleVisitId || !newDate) return

      const dateObj = new Date(newDate)
      const dayLabel = dateObj.toDateString() === new Date().toDateString() ? 'Today' : 'Scheduled'

      const success = await updateVisit(rescheduleVisitId, {
        visit_date: newDate,
        time_slot: newTime,
        day_label: dayLabel,
        status: 'pending' // Reset to pending approval
      })

      if (success) {
        alert('Visit rescheduled successfully! Sent to owner for approval.')
        setRescheduleVisitId(null)
        loadVisits()
      } else {
        alert('Failed to reschedule visit. Please try again.')
      }
    }

    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold">📅 My Scheduled Visits</h1>
            <p className="text-slate-500 text-sm mt-1">Manage tours and view replies from property owners.</p>
          </div>
        </div>

        {visitsList.length === 0 ? (
          <div className="card p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Scheduled Visits</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">You haven't scheduled any property tours yet. Find a property and click "Schedule Visit" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitsList.map((visit) => {
              const isPending = visit.status === 'pending'
              const isAccepted = visit.status === 'accepted'
              const isDeclined = visit.status === 'declined'

              return (
                <div key={visit.id} className="card p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{visit.property_title}</h4>
                        <p className="text-xs text-slate-400 mt-1">Visit ID: {visit.id.substring(0, 8)}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider',
                        isAccepted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        isDeclined ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                      )}>
                        {visit.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-brand-500" />
                        <span>Date: <strong>{new Date(visit.visit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> ({visit.day_label})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-brand-500" />
                        <span>Time Slot: <strong>{visit.time_slot}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                    <button
                      onClick={() => {
                        setRescheduleVisitId(visit.id)
                        setNewDate(visit.visit_date ? new Date(visit.visit_date).toISOString().split('T')[0] : '')
                        setNewTime(visit.time_slot)
                      }}
                      className="btn-secondary text-[11px] py-1.5 px-3 flex-1 flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Reschedule
                    </button>
                    {!isDeclined && (
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to cancel this visit request?')) {
                            await updateVisitStatus(visit.id, 'declined')
                            loadVisits()
                          }
                        }}
                        className="py-1.5 px-3 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-xl text-[11px] flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Reschedule Tour Modal */}
        <AnimatePresence>
          {rescheduleVisitId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRescheduleVisitId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 15, opacity: 0 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-glass overflow-hidden z-10 p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-lg font-display font-bold">📅 Reschedule Property Tour</h3>
                  <button onClick={() => setRescheduleVisitId(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Select New Tour Date *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Select Preferred Time Slot *</label>
                    <select
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="input-field text-sm font-semibold"
                    >
                      {timeSlots.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 border-t flex justify-end gap-2">
                    <button type="button" onClick={() => setRescheduleVisitId(null)} className="btn-secondary text-xs">Close</button>
                    <button type="submit" className="btn-primary text-xs shadow-glow">Confirm Reschedule</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return null
}
