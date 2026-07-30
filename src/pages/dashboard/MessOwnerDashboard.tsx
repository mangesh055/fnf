import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Calendar, QrCode, TrendingUp, DollarSign, Bell, RefreshCw, BarChart2, Search, Plus, Trash2, Edit2, Sparkles, ChefHat, MapPin, Phone, Building, Download, CreditCard, FileText, BookOpen, ToggleLeft, ToggleRight, Camera, Link2, X } from 'lucide-react'
import { BarChart, Bar as ReBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { gatewayFetch } from '../../lib/apiGateway'
import { cn, formatCurrency, formatDate, mealTypeLabels, computeMessStatus, getMessServiceStatusDetails } from '../../lib/utils'
import type { InstallmentRecord } from '../../types'
import { uploadToCloudinary } from '../../utils/cloudinary'
import { invalidatePlatformCache } from '../../lib/platformData'
import { usePersistedForm } from '../../hooks/usePersistedForm'
import toast from 'react-hot-toast'

type MessRow = {
  id: string
  owner_id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  contact_phone: string
  monthly_charge: number
  per_meal_charge: number
  status: string
  verified: boolean
  featured: boolean
  rating: number
  review_count: number
  meal_types: string[]
  latitude?: number | null
  longitude?: number | null
  google_maps_url?: string | null
  service_hours?: string | null
  day_service_time?: string | null
  evening_service_time?: string | null
  photos?: string[] | null
  qr_token?: string | null
  menu_card?: { name: string; price: string }[] | null
}

type PlanRow = {
  id: string
  mess_id: string
  name: string
  description: string
  price: number
  duration_days: number
  total_meals?: number | null
  daily_scan_limit?: number | null
  meal_types: string[]
  active: boolean
}

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
  installments?: InstallmentRecord[]
  created_at: string
}

type AttendanceRow = {
  id: string
  student_id: string
  mess_id?: string | null
  date: string
  breakfast: boolean
  lunch: boolean
  dinner: boolean
  snack: boolean
}

type TransactionRow = {
  id: string
  owner_id: string
  student_name: string
  amount: number
  date: string
  method: string
  status: string
}

type PaymentSettingsRow = {
  owner_id: string
  upi_id: string
  phone_number: string
}

type MenuRow = {
  id: string
  owner_id: string
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
  date: string
}

type StudentProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

const defaultMenu: MenuRow = {
  id: '',
  owner_id: '',
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
  breakfast_image: null,
  lunch_image: null,
  dinner_image: null,
  snack_image: null,
  category_images: null,
  image_url: null,
  date: '',
}

const defaultStatistics = [
  { label: 'Total Subscribers', value: '0', icon: '👥', color: 'from-brand-400 to-brand-600', sub: 'No users yet' },
  { label: 'Today\'s Attendance', value: '0', icon: '✅', color: 'from-emerald-400 to-emerald-600', sub: 'No scans yet' },
  { label: 'Monthly Revenue', value: '₹0', icon: '💰', color: 'from-amber-400 to-amber-600', sub: 'Calculated from paid users' },
  { label: 'Unpaid Accounts', value: '0', icon: '⚠️', color: 'from-red-400 to-red-600', sub: 'Requires review' },
]

export default function MessOwnerDashboard() {
  const location = useLocation()
  const { profile } = useAuthStore()

  const [mess, setMess] = useState<MessRow | null>(null)
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [subscribers, setSubscribers] = useState<Array<SubscriptionRow & { student?: StudentProfile; plan?: PlanRow }>>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [menu, setMenu] = useState<MenuRow | null>(null)
  const [menuCard, setMenuCard] = useState<{ name: string, price: string }[]>([])
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsRow>({ owner_id: profile?.id || '', upi_id: '', phone_number: '' })
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingMenuImg, setIsUploadingMenuImg] = useState(false)
  const [bannerMsg, setBannerMsg] = useState('')

  // Mess registration form — persisted in sessionStorage so camera round-trips don't wipe it
  const MESS_FORM_KEY = `mess_form_${profile?.id || 'guest'}`
  const { form: messForm, setForm: setMessForm, clearPersistedForm: clearMessForm } = usePersistedForm(MESS_FORM_KEY, {
    messName: '',
    description: '',
    address: '',
    contactPhone: '',
    dayServiceTime: '11:30 AM - 03:00 PM',
    eveningServiceTime: '07:00 PM - 10:30 PM',
    monthlyCharge: '3200',
    perMealCharge: '110',
    selectedMealTypes: ['breakfast', 'lunch', 'dinner'] as string[],
    latitude: 18.5204,
    longitude: 73.8567,
    googleMapsUrl: '',
    photos: [] as string[],
    foodType: 'both' as 'veg' | 'non_veg' | 'both',
  })

  // Convenience destructures so existing code referencing these names keeps working
  const messName = messForm.messName
  const description = messForm.description
  const address = messForm.address
  const contactPhone = messForm.contactPhone
  const serviceHours = `${messForm.dayServiceTime} | ${messForm.eveningServiceTime}`
  const dayServiceTime = messForm.dayServiceTime
  const eveningServiceTime = messForm.eveningServiceTime
  const monthlyCharge = messForm.monthlyCharge
  const perMealCharge = messForm.perMealCharge
  const selectedMealTypes = messForm.selectedMealTypes
  const latitude = messForm.latitude
  const longitude = messForm.longitude
  const googleMapsUrl = messForm.googleMapsUrl
  const photos = messForm.photos
  const foodType = messForm.foodType

  // Setters that write through to the persisted form
  const setMessName = (v: string) => setMessForm(p => ({ ...p, messName: v }))
  const setDescription = (v: string) => setMessForm(p => ({ ...p, description: v }))
  const setAddress = (v: string) => setMessForm(p => ({ ...p, address: v }))
  const setContactPhone = (v: string) => setMessForm(p => ({ ...p, contactPhone: v }))
  const setDayServiceTime = (v: string) => setMessForm(p => ({ ...p, dayServiceTime: v }))
  const setEveningServiceTime = (v: string) => setMessForm(p => ({ ...p, eveningServiceTime: v }))
  const setMonthlyCharge = (v: string) => setMessForm(p => ({ ...p, monthlyCharge: v }))
  const setPerMealCharge = (v: string) => setMessForm(p => ({ ...p, perMealCharge: v }))
  const setSelectedMealTypes = (v: string[] | ((prev: string[]) => string[])) =>
    setMessForm(p => ({ ...p, selectedMealTypes: typeof v === 'function' ? v(p.selectedMealTypes) : v }))
  const setLatitude = (v: number) => setMessForm(p => ({ ...p, latitude: v }))
  const setLongitude = (v: number) => setMessForm(p => ({ ...p, longitude: v }))
  const setGoogleMapsUrl = (v: string) => setMessForm(p => ({ ...p, googleMapsUrl: v }))
  const setPhotos = (v: string[] | ((prev: string[]) => string[])) =>
    setMessForm(p => ({ ...p, photos: typeof v === 'function' ? v(p.photos) : v }))
  const setFoodType = (v: 'veg' | 'non_veg' | 'both') => setMessForm(p => ({ ...p, foodType: v }))

  const [hasDraftData, setHasDraftData] = useState(false)

  // localStorage keys for draft persistence
  const DRAFT_KEY = 'mess_registration_draft'

  // Save form data to localStorage
  const saveDraftToStorage = (
    name: string,
    desc: string,
    addr: string,
    phone: string,
    dayTime: string,
    evenTime: string,
    monthly: string,
    perMeal: string,
    mealTypes: string[],
    lat: number,
    lng: number,
    mapsUrl: string,
    photosList: string[],
    food: 'veg' | 'non_veg' | 'both'
  ) => {
    const draft = {
      messName: name,
      description: desc,
      address: addr,
      contactPhone: phone,
      dayServiceTime: dayTime,
      eveningServiceTime: evenTime,
      monthlyCharge: monthly,
      perMealCharge: perMeal,
      selectedMealTypes: mealTypes,
      latitude: lat,
      longitude: lng,
      googleMapsUrl: mapsUrl,
      photos: photosList,
      foodType: food,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }

  // Load draft data from localStorage
  const loadDraftFromStorage = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        setMessName(draft.messName || '')
        setDescription(draft.description || '')
        setAddress(draft.address || '')
        setContactPhone(draft.contactPhone || '')
        setDayServiceTime(draft.dayServiceTime || '11:30 AM - 03:00 PM')
        setEveningServiceTime(draft.eveningServiceTime || '07:00 PM - 10:30 PM')
        setMonthlyCharge(draft.monthlyCharge || '3200')
        setPerMealCharge(draft.perMealCharge || '110')
        setSelectedMealTypes(draft.selectedMealTypes || ['breakfast', 'lunch', 'dinner'])
        setLatitude(draft.latitude || 18.5204)
        setLongitude(draft.longitude || 73.8567)
        setGoogleMapsUrl(draft.googleMapsUrl || '')
        setPhotos(draft.photos || [])
        setFoodType(draft.foodType || 'both')
        setHasDraftData(true)
        setBannerMsg('📝 Recovered your unsaved changes from last session')
        setTimeout(() => setBannerMsg(''), 4000)
      }
    } catch (error) {
      console.error('Failed to restore draft:', error)
    }
  }

  // Clear draft from localStorage
  const clearDraftFromStorage = () => {
    localStorage.removeItem(DRAFT_KEY)
    setHasDraftData(false)
  }

  // Restore draft on component mount if not already a registered mess
  useEffect(() => {
    if (!mess) {
      loadDraftFromStorage()
    }
  }, [])

  // Automatically pre-fill contact phone from profile when creating a new mess listing
  const phoneInitialized = useRef(false)
  useEffect(() => {
    if (profile && !mess && !phoneInitialized.current) {
      if (profile.phone) {
        setContactPhone(profile.phone)
        phoneInitialized.current = true
      }
    }
  }, [profile, mess])

  // Auto-save form data whenever it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mess) {
        saveDraftToStorage(
          messName,
          description,
          address,
          contactPhone,
          dayServiceTime,
          eveningServiceTime,
          monthlyCharge,
          perMealCharge,
          selectedMealTypes,
          latitude,
          longitude,
          googleMapsUrl,
          photos,
          foodType
        )
      }
    }, 1000) // Save 1 second after last change
    return () => clearTimeout(timer)
  }, [messName, description, address, contactPhone, dayServiceTime, eveningServiceTime, monthlyCharge, perMealCharge, selectedMealTypes, latitude, longitude, googleMapsUrl, photos, foodType, mess])

  const renderServiceHoursInputs = () => {
    const liveDetails = getMessServiceStatusDetails(dayServiceTime, eveningServiceTime, serviceHours)
    return (
      <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" /> Service Hours & Live Mess Status
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Mess status dynamically shows OPEN or CLOSED based on current local time against these windows.
            </p>
          </div>
          <div>
            <span className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border w-fit",
              liveDetails.isOpen
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
            )}>
              <span className={cn("w-2 h-2 rounded-full animate-pulse", liveDetails.isOpen ? "bg-emerald-500" : "bg-red-500")} />
              Status: {liveDetails.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
              ☀️ Day Service Time (Lunch)
            </label>
            <input
              type="text"
              value={dayServiceTime}
              onChange={(e) => setDayServiceTime(e.target.value)}
              placeholder="e.g. 11:30 AM - 03:00 PM"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
              🌙 Evening Service Time (Dinner)
            </label>
            <input
              type="text"
              value={eveningServiceTime}
              onChange={(e) => setEveningServiceTime(e.target.value)}
              placeholder="e.g. 07:00 PM - 10:30 PM"
              className="input-field"
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2.5 gap-2">
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {liveDetails.message}
          </span>
          <button
            type="button"
            onClick={() => {
              setDayServiceTime('11:30 AM - 03:00 PM')
              setEveningServiceTime('07:00 PM - 10:30 PM')
            }}
            className="text-brand-600 dark:text-brand-400 hover:underline text-[11px] font-semibold"
          >
            Reset Standard Times
          </button>
        </div>
      </div>
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file))
      const urls = await Promise.all(uploadPromises)

      setPhotos(prev => [...prev, ...urls])
    } catch (error: any) {
      alert('Failed to upload image: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const newItemRef = useRef<HTMLInputElement>(null)
  const newItemPriceRef = useRef<HTMLInputElement>(null)
  const [activeMenuCategory, setActiveMenuCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')
  const [planForm, setPlanForm] = useState({ name: '', description: '', price: '', duration_days: '30', total_meals: '', daily_scan_limit: '', meal_types: [] as string[] })
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanRow | null>(null)
  const [paymentForm, setPaymentForm] = useState({ upi_id: '', phone_number: '' })

  const [searchCountryCode, setSearchCountryCode] = useState('+91')
  const [searchPhone, setSearchPhone] = useState('')
  const [foundUser, setFoundUser] = useState<any>(null)
  const [selectedAddPlanId, setSelectedAddPlanId] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [addPlanPaymentStatus, setAddPlanPaymentStatus] = useState<'paid' | 'pending'>('paid')
  const [addPlanAmountPaid, setAddPlanAmountPaid] = useState('')
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editPaymentAmount, setEditPaymentAmount] = useState<string>('')
  const [ledgerSub, setLedgerSub] = useState<any | null>(null)
  const [installmentForm, setInstallmentForm] = useState({
    amount: '',
    payment_mode: 'upi' as 'cash' | 'upi' | 'card' | 'bank_transfer',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0]
  })

  const path = location.pathname
  const view = path.endsWith('/menu') ? 'menu' : path.endsWith('/menucard') ? 'menucard' : path.endsWith('/plans') ? 'plans' : path.endsWith('/subscribers') ? 'subscribers' : path.endsWith('/attendance') ? 'attendance' : path.endsWith('/qr') ? 'qr' : path.endsWith('/analytics') ? 'analytics' : path.endsWith('/payments') ? 'payments' : path.endsWith('/reports') ? 'reports' : path.endsWith('/settings') ? 'settings' : 'overview'

  const loadDashboard = async () => {
    if (!profile) return
    setLoading(true)
    try {
      const gatewayRes = await gatewayFetch(`/messes?owner_id=${profile.id}`)
      const messRows = (gatewayRes.success && gatewayRes.data && gatewayRes.data.length > 0) ? gatewayRes.data[0] : null;
      if (!messRows) {
        setMess(null)
        setPlans([])
        setSubscribers([])
        setAttendance([])
        setTransactions([])
        setMenu(null)
        setPaymentSettings({ owner_id: profile.id, upi_id: '', phone_number: '' })
        return
      }

      const currentMess = messRows as MessRow
      setMess(currentMess)
      setMessName(currentMess.name || '')
      setDescription(currentMess.description || '')
      setAddress(currentMess.address || '')
      setContactPhone(currentMess.contact_phone || '')
      setDayServiceTime(currentMess.day_service_time || '11:30 AM - 03:00 PM')
      setEveningServiceTime(currentMess.evening_service_time || '07:00 PM - 10:30 PM')
      setMonthlyCharge(String(currentMess.monthly_charge || 3200))
      setPerMealCharge(String(currentMess.per_meal_charge || 110))
      setSelectedMealTypes(currentMess.meal_types || ['breakfast', 'lunch', 'dinner'])
      setFoodType((currentMess as any).food_type || 'both')
      setLatitude(currentMess.latitude || 18.5204)
      setLongitude(currentMess.longitude || 73.8567)
      setGoogleMapsUrl(currentMess.google_maps_url || '')
      setPhotos(currentMess.photos || [])
      setMenuCard(currentMess.menu_card || [])

      const [plansResult, subscriptionsResult, attendanceResult, transactionsResult, paymentResult, menuResult] = await Promise.all([
        supabase.from('mess_plans').select('*').eq('mess_id', currentMess.id).order('created_at', { ascending: false }),
        supabase.from('student_subscriptions').select('*').eq('mess_id', currentMess.id).order('created_at', { ascending: false }),
        supabase.from('student_attendance').select('*').eq('mess_id', currentMess.id).order('date', { ascending: false }),
        supabase.from('mess_transactions').select('*').eq('owner_id', profile.id).order('date', { ascending: false }),
        supabase.from('mess_payment_settings').select('*').eq('owner_id', profile.id).maybeSingle(),
        gatewayFetch<MenuRow[]>(`/messes/menus?owner_id=${profile.id}`),
      ])

      const planRows = (plansResult.data || []) as PlanRow[]
      const subscriptionRows = (subscriptionsResult.data || []) as SubscriptionRow[]
      const attendanceRows = (attendanceResult.data || []) as AttendanceRow[]
      const transactionRows = (transactionsResult.data || []) as TransactionRow[]
      const menuRows = (menuResult.data || []) as MenuRow[]

      const studentIds = Array.from(new Set(subscriptionRows.map((row) => row.student_id)))
      const planIds = Array.from(new Set(subscriptionRows.map((row) => row.plan_id)))
      const [profileRows, planLookupResult] = await Promise.all([
        studentIds.length ? supabase.from('profiles').select('id, full_name, email, phone').in('id', studentIds) : Promise.resolve({ data: [] }),
        planIds.length ? supabase.from('mess_plans').select('*').in('id', planIds) : Promise.resolve({ data: [] }),
      ])

      const profilesById = new Map<string, any>((profileRows.data || []).map((p: any) => [p.id, p]))
      const plansById = new Map<string, PlanRow>((planLookupResult.data || []).map((p: any) => [p.id, p]))

      setPlans(planRows)
      setSubscribers(subscriptionRows.map((row) => ({
        ...row,
        student: profilesById.get(row.student_id),
        plan: plansById.get(row.plan_id),
      })))
      setAttendance(attendanceRows)
      setTransactions(transactionRows)
      setPaymentSettings((paymentResult.data || { owner_id: profile.id, upi_id: '', phone_number: '' }) as PaymentSettingsRow)
      setPaymentForm({
        upi_id: (paymentResult.data as PaymentSettingsRow | null)?.upi_id || '',
        phone_number: (paymentResult.data as PaymentSettingsRow | null)?.phone_number || '',
      })
      const fetchedMenu = menuRows[0] || null
      console.log('[MessOwnerDashboard] menuResult:', menuResult)
      console.log('[MessOwnerDashboard] fetchedMenu:', fetchedMenu)
      console.log('[MessOwnerDashboard] todayStr:', todayStr)
      if (fetchedMenu && fetchedMenu.date === todayStr) {
        console.log('[MessOwnerDashboard] Date matches! Setting menu state.')
        setMenu(fetchedMenu)
      } else {
        console.log('[MessOwnerDashboard] Date mismatch or no menu found. Setting menu to null.')
        setMenu(null)
      }
    } catch (error) {
      console.error('Failed to load mess owner dashboard data:', error)
      setBannerMsg('Failed to load database data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [profile])

  const currentMenu = useMemo<MenuRow>(() => menu || defaultMenu, [menu])
  const todayStr = new Date().toISOString().split('T')[0]
  const todaysScans = attendance.filter((row) => row.date === todayStr)

  useEffect(() => {
    if (googleMapsUrl) {
      const match = googleMapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
        googleMapsUrl.match(/[?&](?:q|query|ll|pb=!-?\d+d)(-?\d+\.\d+)[,!](-?\d+\.\d+)/);
      if (match) {
        setLatitude(parseFloat(match[1]));
        setLongitude(parseFloat(match[2]));
      }
    }
  }, [googleMapsUrl]);

  const stats = useMemo(() => ([
    { label: 'Total Subscribers', value: subscribers.length.toString(), icon: '👥', color: 'from-brand-400 to-brand-600', sub: subscribers.length > 0 ? `${subscribers.length} active users` : 'No users registered' },
    { label: "Today's Attendance", value: todaysScans.length.toString(), icon: '✅', color: 'from-emerald-400 to-emerald-600', sub: todaysScans.length > 0 ? `${todaysScans.length} scans logged` : 'No logs yet' },
    { label: 'Monthly Revenue', value: formatCurrency(subscribers.filter((s) => s.payment_status === 'paid').reduce((sum, s) => sum + s.amount_paid, 0)), icon: '💰', color: 'from-amber-400 to-amber-600', sub: 'Calculated from paid subscriptions' },
    { label: 'Unpaid Accounts', value: subscribers.filter((s) => s.payment_status !== 'paid').length.toString(), icon: '⚠️', color: 'from-red-400 to-red-600', sub: 'Requires review' },
  ]), [subscribers, todaysScans])

  const dynamicWeeklyData = useMemo(() => Array.from({ length: 7 }).map((_, index) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - index))
    const dateStr = d.toISOString().split('T')[0]
    const dayScans = attendance.filter((row) => row.date === dateStr)
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      breakfast: dayScans.filter((row) => row.breakfast).length,
      lunch: dayScans.filter((row) => row.lunch).length,
      dinner: dayScans.filter((row) => row.dinner).length,
    }
  }), [attendance])

  const dynamicPieData = useMemo(() => ([
    { name: 'Breakfast', value: todaysScans.filter((row) => row.breakfast).length, color: '#f59e0b' },
    { name: 'Lunch', value: todaysScans.filter((row) => row.lunch).length, color: '#6366f1' },
    { name: 'Dinner', value: todaysScans.filter((row) => row.dinner).length, color: '#8b5cf6' },
  ].filter((row) => row.value > 0)), [todaysScans])

  const handleAddCardItem = () => {
    const itemName = newItemRef.current?.value || ''
    const itemPrice = newItemPriceRef.current?.value || ''
    if (!itemName.trim()) return

    setMenuCard(prev => [...prev, { name: itemName.trim(), price: itemPrice.trim() }])

    if (newItemRef.current) newItemRef.current.value = ''
    if (newItemPriceRef.current) newItemPriceRef.current.value = ''
  }

  const handleAddDailyItem = () => {
    const itemName = newItemRef.current?.value || ''
    const itemPrice = newItemPriceRef.current?.value || ''
    if (!itemName.trim()) return
    const text = itemPrice.trim() ? `${itemName.trim()} - ₹${itemPrice.trim()}` : itemName.trim()
    setMenu((prev) => {
      const p = prev || { id: `menu-${Date.now()}`, owner_id: profile?.id || '', breakfast: [], lunch: [], dinner: [], snack: [], date: todayStr }
      return {
        ...p,
        [activeMenuCategory]: [...(p[activeMenuCategory] || []), text]
      }
    })
    if (newItemRef.current) newItemRef.current.value = ''
    if (newItemPriceRef.current) newItemPriceRef.current.value = ''
  }

  const updateMenuCard = async () => {
    if (!profile || !mess) return
    const res = await gatewayFetch(`/messes/${mess.id}`, {
      method: 'PUT',
      body: JSON.stringify({ menu_card: menuCard })
    })
    console.log('[updateMenuCard] response:', res);
    if (!res.success) {
      console.error('Failed to save menu card:', res.error)
      alert(`Database Error: ${res.error || 'Failed to save menu card'}`)
      return
    }
    setBannerMsg('Menu Card saved successfully')
    setTimeout(() => setBannerMsg(''), 2500)
  }

  const getActiveCategoryImage = () => {
    if (!currentMenu) return null
    const key = `${activeMenuCategory}_image`
    const val = (currentMenu as any)[key]
    if (val && typeof val === 'string') return val
    if (currentMenu.category_images && currentMenu.category_images[activeMenuCategory]) {
      return currentMenu.category_images[activeMenuCategory]
    }
    return null
  }

  const handleMenuImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setIsUploadingMenuImg(true)
    try {
      const url = await uploadToCloudinary(files[0])
      setMenu((prev) => {
        const p = prev || { id: `menu-${Date.now()}`, owner_id: profile?.id || '', breakfast: [], lunch: [], dinner: [], snack: [], date: todayStr }
        const key = `${activeMenuCategory}_image`
        const category_images = { ...(p.category_images || {}), [activeMenuCategory]: url }
        return { ...p, [key]: url, category_images }
      })
    } catch (error: any) {
      alert('Failed to upload menu image: ' + error.message)
    } finally {
      setIsUploadingMenuImg(false)
    }
  }

  const removeMenuImage = () => {
    setMenu((prev) => {
      if (!prev) return prev
      const key = `${activeMenuCategory}_image`
      const category_images = { ...(prev.category_images || {}) }
      delete category_images[activeMenuCategory]
      return { ...prev, [key]: null, category_images }
    })
  }

  const updateDailyMenu = async () => {
    if (!profile || !mess) return
    const payload: any = {
      id: menu?.id || `menu-${Date.now()}`,
      owner_id: profile.id,
      date: todayStr,
      breakfast: currentMenu.breakfast || [],
      lunch: currentMenu.lunch || [],
      dinner: currentMenu.dinner || [],
      snack: currentMenu.snack || [],
      breakfast_image: currentMenu.breakfast_image || null,
      lunch_image: currentMenu.lunch_image || null,
      dinner_image: currentMenu.dinner_image || null,
      snack_image: currentMenu.snack_image || null,
      category_images: currentMenu.category_images || null,
      image_url: currentMenu.image_url || null,
      updated_at: new Date().toISOString(),
    }

    console.log('[updateDailyMenu] saving menu payload:', payload);
    const res = await gatewayFetch('/messes/menus', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    console.log('[updateDailyMenu] response:', res);

    if (!res.success) {
      console.error('Failed to save daily menu:', res.error)
      alert(`Database Error: ${res.error || 'Failed to save menu'}`)
      return
    }
    setMenu(payload as MenuRow)
    setBannerMsg('Daily Menu saved successfully')
    setTimeout(() => setBannerMsg(''), 2500)
  }

  const savePlan = async () => {
    if (!profile || !mess || !planForm.name.trim() || !planForm.price || planForm.meal_types.length === 0) return

    if (editingPlanId) {
      const payload = {
        name: planForm.name,
        description: planForm.description,
        price: Number(planForm.price),
        duration_days: Number(planForm.duration_days),
        total_meals: planForm.total_meals ? Number(planForm.total_meals) : null,
        daily_scan_limit: planForm.daily_scan_limit ? Number(planForm.daily_scan_limit) : null,
        meal_types: planForm.meal_types,
      }
      const { error } = await supabase.from('mess_plans').update(payload).eq('id', editingPlanId)
      if (error) {
        console.error('Failed to update plan:', error)
        alert(`Database Error: ${error.message}`)
        return
      }
      setPlans((prev) => prev.map((plan) => plan.id === editingPlanId ? { ...plan, ...payload } : plan))
      setEditingPlanId(null)
    } else {
      const payload = {
        id: `plan-${Date.now()}`,
        mess_id: mess.id,
        name: planForm.name,
        description: planForm.description,
        price: Number(planForm.price),
        duration_days: Number(planForm.duration_days),
        total_meals: planForm.total_meals ? Number(planForm.total_meals) : null,
        daily_scan_limit: planForm.daily_scan_limit ? Number(planForm.daily_scan_limit) : null,
        meal_types: planForm.meal_types,
        active: true,
      }
      const { error } = await supabase.from('mess_plans').insert(payload)
      if (error) {
        console.error('Failed to save plan:', error)
        alert(`Database Error: ${error.message}. Please make sure you added the 'total_meals' column to the 'mess_plans' table!`)
        return
      }
      setPlans((prev) => [payload as PlanRow, ...prev])
    }
    setPlanForm({ name: '', description: '', price: '', duration_days: '30', total_meals: '', daily_scan_limit: '', meal_types: [] })
  }

  const handleEditPlan = (plan: PlanRow) => {
    setEditingPlanId(plan.id)
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price: String(plan.price),
      duration_days: String(plan.duration_days),
      total_meals: plan.total_meals ? String(plan.total_meals) : '',
      daily_scan_limit: plan.daily_scan_limit ? String(plan.daily_scan_limit) : '',
      meal_types: plan.meal_types || [],
    })
  }

  const togglePlanActive = async (id: string) => {
    const target = plans.find((item) => item.id === id)
    if (!target) return
    const { error } = await supabase.from('mess_plans').update({ active: !target.active }).eq('id', id)
    if (error) return console.error('Failed to toggle plan:', error)
    setPlans((prev) => prev.map((plan) => plan.id === id ? { ...plan, active: !plan.active } : plan))
  }

  const deletePlan = async (id: string) => {
    if (!window.confirm('Delete this subscription plan?')) return
    const { error } = await supabase.from('mess_plans').delete().eq('id', id)
    if (error) return console.error('Failed to delete plan:', error)
    setPlans((prev) => prev.filter((plan) => plan.id !== id))
  }

  const savePaymentSettings = async () => {
    if (!profile) return
    const payload = { owner_id: profile.id, upi_id: paymentForm.upi_id, phone_number: paymentForm.phone_number }
    const { error } = await supabase.from('mess_payment_settings').upsert(payload)
    if (error) return console.error('Failed to save payment settings:', error)
    setPaymentSettings(payload)
    setBannerMsg('Payment settings saved successfully')
    setTimeout(() => setBannerMsg(''), 2500)
  }

  const saveProfile = async () => {
    if (!profile) {
      alert('User session not found. Please log in again.')
      return
    }

    if (!messName.trim()) {
      alert('Please enter a Mess Service Name.')
      return
    }

    if (!contactPhone.trim()) {
      alert('Please enter a Contact Phone number.')
      return
    }

    if (!address.trim()) {
      alert('Please enter the Address.')
      return
    }

    if (!selectedMealTypes.length) {
      alert('Please select at least one meal category served.')
      return
    }

    try {
      if (!mess?.id) {
        const checkRes = await gatewayFetch(`/messes?owner_id=${profile.id}`)
        const existingMess = (checkRes.success && checkRes.data && checkRes.data.length > 0) ? checkRes.data[0] : null;
        if (existingMess) {
          alert('You have already registered a mess.')
          await loadDashboard()
          return
        }
      }

      const computedStatus = computeMessStatus(dayServiceTime, eveningServiceTime, serviceHours)
      const combinedServiceHours = `Day: ${dayServiceTime} | Eve: ${eveningServiceTime}`

      const safeQrToken = mess?.qr_token || (
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'qr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11)
      )

      const payload = {
        id: mess?.id || `mess-${Date.now()}`,
        owner_id: profile.id,
        qr_token: safeQrToken,
        name: messName.trim(),
        description: description.trim(),
        address: address.trim(),
        city: mess?.city || 'Pune',
        state: mess?.state || 'Maharashtra',
        latitude,
        longitude,
        google_maps_url: googleMapsUrl.trim(),
        service_hours: combinedServiceHours,
        day_service_time: dayServiceTime,
        evening_service_time: eveningServiceTime,
        contact_phone: contactPhone.trim(),
        monthly_charge: Number(monthlyCharge) || 0,
        per_meal_charge: Number(perMealCharge) || 0,
        status: computedStatus,
        verified: mess?.verified || false,
        featured: mess?.featured || false,
        rating: mess?.rating || 5,
        review_count: mess?.review_count || 0,
        food_type: foodType,
        meal_types: selectedMealTypes,
        photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600'],
        created_at: mess?.id ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const isNewMess = !mess?.id;

      const gatewayRes = isNewMess
        ? await gatewayFetch('/messes', { method: 'POST', body: JSON.stringify(payload) })
        : await gatewayFetch(`/messes/${mess.id}`, { method: 'PUT', body: JSON.stringify(payload) });

      const error = gatewayRes.success ? null : { message: gatewayRes.error || 'Failed to save mess' };
      if (error) {
        console.error('Failed to save mess profile:', error)
        alert(`Failed to save: ${error.message}`)
        return
      }

      invalidatePlatformCache()

      if (isNewMess) {
        await supabase.from('app_notifications').insert({
          user_id: profile.id,
          type: 'info',
          title: 'Mess Registration Submitted',
          message: 'Your mess has been registered and is pending admin approval before it becomes visible on the platform.',
          read: false,
        })
        alert('Mess registered successfully!')
        toast.success('Mess registered successfully!')
      } else {
        alert('Mess profile updated successfully!')
        toast.success('Mess profile updated successfully!')
      }

      setBannerMsg('Mess profile saved successfully')
      setTimeout(() => setBannerMsg(''), 2500)
      clearDraftFromStorage()
      clearMessForm()  // also clear sessionStorage persisted form
      await loadDashboard()
    } catch (err: any) {
      console.error('Runtime error saving mess profile:', err)
      alert(`An error occurred: ${err.message || err}`)
    }
  }

  const handleGeneratePaymentQR = async (plan: PlanRow) => {
    if (!paymentSettings.upi_id) {
      alert('Please configure your UPI ID first.')
      return
    }
    const QRCode = (await import('qrcode')).default
    const url = await QRCode.toDataURL(`upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(mess?.name || 'Mess')}&am=${plan.price}&cu=INR`)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(`<img src="${url}" style="width:320px;height:320px" />`)
      win.document.close()
    }
  }



  const handleVerifyCash = async (txnId: string) => {
    const { error } = await supabase.from('mess_transactions').update({ status: 'Completed' }).eq('id', txnId)
    if (error) return console.error('Failed to update transaction:', error)
    setTransactions((prev) => prev.map((txn) => txn.id === txnId ? { ...txn, status: 'Completed' } : txn))
  }

  const handleSearchUser = async () => {
    if (!searchPhone.trim()) return
    setSearchLoading(true)
    setFoundUser(null)

    const searchPattern = `%${searchPhone.trim()}%`;
    const fullSearchPattern = `%${searchCountryCode}%${searchPhone.trim()}%`;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`phone.ilike.${searchPattern},phone.ilike.${fullSearchPattern}`)
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      console.error('Search error:', error);
      alert('User not found with this phone number.')
    } else {
      setFoundUser(data)
    }
    setSearchLoading(false)
  }

  const handleAddSubscriber = async () => {
    if (!foundUser || !selectedAddPlanId || !mess) return
    const plan = plans.find(p => p.id === selectedAddPlanId)
    if (!plan) return

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + plan.duration_days)

    const payload = {
      id: `sub-${Date.now()}`,
      student_id: foundUser.id,
      mess_id: mess.id,
      plan_id: plan.id,
      status: 'active',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      amount_paid: addPlanPaymentStatus === 'paid' ? (addPlanAmountPaid ? Number(addPlanAmountPaid) : plan.price) : 0,
      payment_status: addPlanPaymentStatus,
      remaining_days: plan.total_meals || plan.duration_days,
      total_meals: plan.total_meals || plan.duration_days,
      plan_name: plan.name,
      plan_description: plan.description
    }

    const { error } = await supabase.from('student_subscriptions').insert(payload)
    if (error) {
      console.error('Failed to add subscriber:', error)
      alert(`Database Error: ${error.message}`)
      return
    }

    // Push notifications
    const studentNotification = {
      user_id: foundUser.id,
      type: 'success',
      title: 'Plan Allocated Successfully',
      message: `You have successfully been subscribed to the ${plan.name} at ${mess.name}. Your plan is active until ${formatDate(endDate.toISOString())}.`,
      read: false,
    }

    const ownerNotification = {
      user_id: profile?.id || '',
      type: 'info',
      title: 'New Subscriber Added',
      message: `${foundUser.full_name} has been manually added to the ${plan.name} plan.`,
      read: false,
    }

    await supabase.from('app_notifications').insert([studentNotification, ownerNotification])

    setBannerMsg('Subscriber added successfully')
    setTimeout(() => setBannerMsg(''), 2500)

    // Clear form and reload data
    setSearchPhone('')
    setFoundUser(null)
    setSelectedAddPlanId('')
    setAddPlanPaymentStatus('paid')
    setAddPlanAmountPaid('')
    await loadDashboard()
  }

  const handleUpdatePayment = async (subId: string, planPrice: number) => {
    const newAmount = Math.max(0, Number(editPaymentAmount) || 0);
    const dueAmount = Math.max(0, planPrice - newAmount);
    const newStatus = dueAmount === 0 ? 'paid' : newAmount > 0 ? 'partial' : 'pending';

    const { error } = await supabase
      .from('student_subscriptions')
      .update({ amount_paid: newAmount, payment_status: newStatus })
      .eq('id', subId);

    if (!error) {
      setSubscribers(prev => prev.map(s => s.id === subId ? { ...s, amount_paid: newAmount, payment_status: newStatus } : s));
      setEditingPaymentId(null);
      setBannerMsg('Payment updated successfully');
      setTimeout(() => setBannerMsg(''), 2500);
    } else {
      alert(`Error updating payment: ${error.message}`);
    }
  }

  const handleRecordInstallment = async () => {
    if (!ledgerSub) return
    const instAmount = Number(installmentForm.amount)
    if (!instAmount || instAmount <= 0) {
      alert('Please enter a valid installment amount.')
      return
    }

    const planPrice = ledgerSub.plan?.price || 0
    const existingInstallments: InstallmentRecord[] = Array.isArray(ledgerSub.installments) && ledgerSub.installments.length > 0
      ? ledgerSub.installments
      : ledgerSub.amount_paid > 0
        ? [{ id: `inst-init-${ledgerSub.id}`, subscription_id: ledgerSub.id, amount: ledgerSub.amount_paid, payment_date: ledgerSub.start_date || new Date().toISOString(), payment_mode: 'upi', notes: 'Initial Payment' }]
        : []

    const newRecord: InstallmentRecord = {
      id: `inst-${Date.now()}`,
      subscription_id: ledgerSub.id,
      amount: instAmount,
      payment_date: installmentForm.payment_date || new Date().toISOString(),
      payment_mode: installmentForm.payment_mode,
      notes: installmentForm.notes.trim() || 'Installment Payment'
    }

    const updatedInstallments = [newRecord, ...existingInstallments]
    const updatedPaid = updatedInstallments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const dueAmount = Math.max(0, planPrice - updatedPaid)
    const updatedStatus = dueAmount === 0 ? 'paid' : updatedPaid > 0 ? 'partial' : 'pending'

    const payload = {
      amount_paid: updatedPaid,
      payment_status: updatedStatus,
      installments: updatedInstallments
    }

    const { error } = await supabase
      .from('student_subscriptions')
      .update(payload)
      .eq('id', ledgerSub.id)

    if (error) {
      await supabase.from('student_subscriptions').update({ amount_paid: updatedPaid, payment_status: updatedStatus }).eq('id', ledgerSub.id)
    }

    const updatedSub = { ...ledgerSub, ...payload }
    setLedgerSub(updatedSub)
    setSubscribers(prev => prev.map(s => s.id === ledgerSub.id ? updatedSub : s))
    setInstallmentForm({ amount: '', payment_mode: 'upi', notes: '', payment_date: new Date().toISOString().split('T')[0] })
    setBannerMsg(`Installment of ₹${instAmount} recorded successfully!`)
    setTimeout(() => setBannerMsg(''), 2500)
  }

  const handleDeleteInstallmentLog = async (recordId: string) => {
    if (!ledgerSub || !window.confirm('Are you sure you want to delete this installment payment entry?')) return
    const planPrice = ledgerSub.plan?.price || 0
    const existingInstallments: InstallmentRecord[] = Array.isArray(ledgerSub.installments) ? ledgerSub.installments : []
    const updatedInstallments = existingInstallments.filter(inst => inst.id !== recordId)
    const updatedPaid = updatedInstallments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const dueAmount = Math.max(0, planPrice - updatedPaid)
    const updatedStatus = dueAmount === 0 ? 'paid' : updatedPaid > 0 ? 'partial' : 'pending'

    const payload = {
      amount_paid: updatedPaid,
      payment_status: updatedStatus,
      installments: updatedInstallments
    }

    await supabase.from('student_subscriptions').update(payload).eq('id', ledgerSub.id)
    const updatedSub = { ...ledgerSub, ...payload }
    setLedgerSub(updatedSub)
    setSubscribers(prev => prev.map(s => s.id === ledgerSub.id ? updatedSub : s))
  }

  const handleDeleteSubscriber = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this subscriber? This will immediately revoke their plan.')) return;

    // Find subscriber details before deleting so we can notify them
    const sub = subscribers.find(s => s.id === id);

    const { error } = await supabase.from('student_subscriptions').delete().eq('id', id);
    if (error) {
      alert(`Error deleting subscriber: ${error.message}`);
      return;
    }

    // Send notification to the student about plan removal
    if (sub?.student_id && mess) {
      const planName = sub.plan?.name || 'your current plan';
      await supabase.from('app_notifications').insert({
        user_id: sub.student_id,
        type: 'warning',
        title: 'Subscription Cancelled',
        message: `Your subscription to "${planName}" at ${mess.name} has been removed by the mess owner. Please contact them for more details.`,
        read: false,
      });
    }

    setBannerMsg('Subscriber removed successfully');
    setTimeout(() => setBannerMsg(''), 2500);
    setSubscribers((prev) => prev.filter((sub) => sub.id !== id));
  }

  const handleDownloadReport = () => {
    // Generate CSV data for subscribers
    const headers = ['Student Name', 'Phone', 'Plan Name', 'Start Date', 'End Date', 'Payment Status']
    const rows = subscribers.map(sub => [
      `"${sub.student?.full_name || 'Unknown'}"`,
      `"${sub.student?.phone || 'N/A'}"`,
      `"${sub.plan?.name || 'Unknown Plan'}"`,
      `"${formatDate(sub.start_date)}"`,
      `"${formatDate(sub.end_date)}"`,
      `"${sub.payment_status}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `mess_subscribers_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderBanner = () => bannerMsg ? <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl border border-slate-800 flex items-center gap-2 shadow-xl"><Sparkles className="w-4 h-4 text-brand-400" />{bannerMsg}</motion.div> : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!mess) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center py-6 space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center mx-auto text-2xl shadow-glow text-white">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white">Mess Onboarding Setup</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">Register your kitchen or mess service details in Supabase.</p>
        </div>

        <div className="card p-8 space-y-4 max-w-2xl mx-auto">
          {renderBanner()}

          {hasDraftData && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">📝</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Draft Recovered</p>
                <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">Your previous unsaved form data has been restored. Save now or discard to start fresh.</p>
              </div>
              <button
                onClick={clearDraftFromStorage}
                className="flex-shrink-0 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 whitespace-nowrap ml-2 px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40"
              >
                Discard Draft
              </button>
            </div>
          )}

          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mess Service Name</label><input value={messName} onChange={(e) => setMessName(e.target.value)} placeholder="Mess Service Name" className="input-field" /></div>
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="input-field min-h-24" /></div>
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contact Phone</label><input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Contact Phone" className="input-field" /></div>
          {renderServiceHoursInputs()}
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="input-field" /></div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase">GPS Location</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLatitude(pos.coords.latitude)
                        setLongitude(pos.coords.longitude)
                        setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${pos.coords.latitude},${pos.coords.longitude}`)
                      },
                      (err) => alert('Unable to retrieve your location. Please ensure location permissions are granted.'),
                      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    )
                  } else {
                    alert('Geolocation is not supported by your browser.')
                  }
                }}
                className="btn-secondary whitespace-nowrap text-xs flex items-center"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Auto-Detect Location
              </button>
              {latitude && longitude ? (
                <span className="text-xs text-slate-500">
                  Lat: {latitude.toFixed(4)}, Long: {longitude.toFixed(4)}
                </span>
              ) : null}
            </div>
          </div>

          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Google Maps URL</label><input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="Paste Google Maps link here..." className="input-field" /></div>
          {googleMapsUrl && (
            <div className="text-sm">
              <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline flex items-center gap-1 mb-2">
                <MapPin className="w-4 h-4" /> Open Link
              </a>
              {googleMapsUrl.includes('embed') && (
                <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200">
                  <iframe src={googleMapsUrl.match(/src="([^"]+)"/)?.[1] || googleMapsUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Monthly Charge (₹)</label><input value={monthlyCharge} onChange={(e) => setMonthlyCharge(e.target.value)} placeholder="Monthly Charge" className="input-field" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Per Meal Charge (₹)</label><input value={perMealCharge} onChange={(e) => setPerMealCharge(e.target.value)} placeholder="Per Meal Charge" className="input-field" /></div>
          </div>

          {(latitude && longitude && (latitude !== 18.5204 || longitude !== 73.8567)) && (
            <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 mt-2">
              <iframe
                src={`https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Mess Photos</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {photos.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden group">
                  <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <label className={`flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                <Plus className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs text-slate-500 font-medium">{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
              </label>
              <label className={`flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                <Camera className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs text-slate-500 font-medium">Take Photo</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Meals Provided</label>
            <div className="flex flex-wrap gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(meal => (
                <button
                  key={meal}
                  type="button"
                  onClick={() => setSelectedMealTypes(prev => prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal])}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl border capitalize ${selectedMealTypes.includes(meal) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveProfile} className="btn-primary w-full mt-4">Register Mess Profile</button>
        </div>
      </div>
    )
  }

  if (view === 'overview') {
    return (
      <div className="p-6 space-y-6">
        {renderBanner()}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {mess.name} <Link to="/dashboard/mess/settings" className="text-slate-400 hover:text-brand-500"><Edit2 className="w-5 h-5" /></Link>
              </h1>
              {(() => {
                const liveDetails = getMessServiceStatusDetails(dayServiceTime, eveningServiceTime, serviceHours)
                return (
                  <span className={cn(
                    "badge shadow-sm text-xs items-center gap-1.5 px-3 py-1 font-bold",
                    liveDetails.isOpen ? "badge-green" : "badge-red"
                  )}>
                    <span className="relative flex h-2 w-2">
                      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", liveDetails.isOpen ? "bg-emerald-400" : "bg-red-400")} />
                      <span className={cn("relative inline-flex rounded-full h-2 w-2", liveDetails.isOpen ? "bg-emerald-500" : "bg-red-500")} />
                    </span>
                    {liveDetails.isOpen ? 'OPEN NOW' : 'CLOSED NOW'}
                  </span>
                )
              })()}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex flex-wrap items-center gap-2">
              <span>📍 {mess.address}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                ☀️ Day: {dayServiceTime}
              </span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                🌙 Eve: {eveningServiceTime}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/mess/menucard" className="btn-secondary text-sm flex items-center gap-1">
              <ChefHat className="w-4 h-4" /> Menu Card
            </Link>
            <Link to="/dashboard/mess/menu" className="btn-secondary text-sm flex items-center gap-1">
              <ChefHat className="w-4 h-4" /> Daily Menu
            </Link>
          </div>
        </div>

      </div>
    )
  }

  if (view === 'menucard') {
    return (
      <div className="p-6 space-y-6">
        {renderBanner()}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-brand-500" /> Mess Menu Card Manager
            </h1>
            <p className="text-slate-500 text-sm mt-1">Publish and edit the standard menu card for {mess.name}</p>
          </div>
          <Link to="/dashboard/mess" className="btn-secondary text-sm">Back to Overview</Link>
        </div>

        <div className="card p-6 space-y-6 max-w-4xl">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-bold">Active Menu Card Items</h3>
            <button onClick={() => setMenuCard([])} className="text-xs text-red-500 hover:underline font-medium">Clear All</button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuCard.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-sm font-medium text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="min-w-0 flex-1 flex justify-between pr-3">
                  <span className="truncate">{item.name}</span>
                  <span className="font-bold ml-2 shrink-0">₹{item.price}</span>
                </div>
                <button
                  onClick={() => setMenuCard(prev => prev.filter((_, i) => i !== idx))}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
            {menuCard.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-10 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed">
                No items added to the menu card yet.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-100">
            <input ref={newItemRef} className="input-field flex-1" placeholder="Item Name (e.g. Paneer Butter Masala)" />
            <input ref={newItemPriceRef} className="input-field w-full sm:w-32" placeholder="Price (₹)" type="number" />
            <button onClick={handleAddCardItem} className="btn-secondary whitespace-nowrap">Add Item</button>
            <button onClick={updateMenuCard} className="btn-primary whitespace-nowrap">Save Menu Card</button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'menu') {
    const activeCategories = (['breakfast', 'lunch', 'dinner', 'snack'] as const).filter((cat) => mess.meal_types.includes(cat))
    return (
      <div className="p-6 space-y-6">
        {renderBanner()}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-brand-500" /> Daily Menu Manager
            </h1>
            <p className="text-slate-500 text-sm mt-1">Publish & edit today's menu or upload a menu card image for {mess.name}</p>
          </div>
          <Link to="/dashboard/mess" className="btn-secondary text-sm self-start sm:self-auto">Back to Overview</Link>
        </div>

        {/* Next Day Expiration Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs">
          <span className="text-base">📅</span>
          <div>
            <span className="font-bold">Auto-Reset Notice:</span> Daily menu items & uploaded menu photos are tied to today's date ({todayStr}) and will automatically reset when the next day starts.
          </div>
        </div>

        {/* Daily Menu Editor */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="card p-5 space-y-1 lg:col-span-1">
            <h3 className="font-bold text-xs uppercase text-slate-400 mb-2 px-1">Meal Categories</h3>
            {activeCategories.map((cat) => (
              <button key={cat} onClick={() => setActiveMenuCategory(cat)} className={cn('w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold capitalize', activeMenuCategory === cat ? 'bg-brand-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                {cat}
                <span className="badge text-[9px]">{(currentMenu[cat] || []).length} Items</span>
              </button>
            ))}
          </div>

          <div className="card p-6 lg:col-span-2 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white capitalize">Editing: {activeMenuCategory}</h3>
                <p className="text-xs text-slate-400">Add typed items or upload today's menu photo below</p>
              </div>
              <button onClick={() => setMenu({ id: menu?.id || '', owner_id: profile?.id || '', breakfast: [], lunch: [], dinner: [], snack: [], image_url: currentMenu.image_url || null, date: todayStr })} className="text-xs text-red-500 hover:underline font-medium">Clear Typed Items</button>
            </div>

            {/* Menu Photo upload option directly inside category editor */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 capitalize">
                  📸 {activeMenuCategory} Photo (Optional)
                </span>
                {getActiveCategoryImage() && (
                  <button onClick={removeMenuImage} className="text-[11px] text-red-500 hover:underline flex items-center gap-1 font-medium">
                    <Trash2 className="w-3 h-3" /> Remove Photo
                  </button>
                )}
              </div>

              {getActiveCategoryImage() ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 group bg-black/5">
                  <img src={getActiveCategoryImage()!} alt={`${activeMenuCategory} Photo`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="btn-secondary text-xs cursor-pointer py-1 px-3">
                      Replace Photo
                      <input type="file" accept="image/*" onChange={handleMenuImageUpload} disabled={isUploadingMenuImg} className="hidden" />
                    </label>
                    <button onClick={removeMenuImage} className="btn-primary text-xs py-1 px-3 bg-red-600 hover:bg-red-700">Delete</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <label className={`btn-secondary text-xs cursor-pointer flex items-center gap-1.5 py-2 px-3 ${isUploadingMenuImg ? 'opacity-50 cursor-wait' : ''}`}>
                    <Plus className="w-4 h-4 text-slate-500" />
                    <span className="capitalize">{isUploadingMenuImg ? 'Uploading...' : `Upload ${activeMenuCategory} Photo`}</span>
                    <input type="file" accept="image/*" onChange={handleMenuImageUpload} disabled={isUploadingMenuImg} className="hidden" />
                  </label>
                  <label className={`btn-secondary text-xs cursor-pointer flex items-center gap-1.5 py-2 px-3 ${isUploadingMenuImg ? 'opacity-50 cursor-wait' : ''}`}>
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span className="capitalize">Take Photo</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleMenuImageUpload} disabled={isUploadingMenuImg} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Typed Menu Items */}
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {(currentMenu[activeMenuCategory] || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-sm font-medium text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <span className="truncate pr-2">{item}</span>
                    <button onClick={() => setMenu((prev) => prev ? { ...prev, [activeMenuCategory]: (prev[activeMenuCategory] || []).filter((_: string, i: number) => i !== idx) } : prev)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
                {(currentMenu[activeMenuCategory] || []).length === 0 && (
                  <div className="sm:col-span-2 text-center py-6 text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    No typed items for {activeMenuCategory} yet.
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input ref={newItemRef} className="input-field flex-1" placeholder={`Add ${activeMenuCategory} item (e.g. Paneer Masala)`} />
                <input ref={newItemPriceRef} className="input-field w-full sm:w-32" placeholder="Price (₹)" type="number" />
                <button onClick={handleAddDailyItem} className="btn-secondary whitespace-nowrap">Add Item</button>
                <button onClick={updateDailyMenu} className="btn-primary whitespace-nowrap">Save Today's Menu</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'plans') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-brand-500" /> Subscription Plans Manager
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage meal plans stored in Supabase.</p>
          </div>
          <button onClick={() => { setEditingPlanId(null); setPlanForm({ name: '', description: '', price: '', duration_days: '30', total_meals: '', daily_scan_limit: '', meal_types: [] }) }} className="btn-secondary self-start sm:self-auto">New Plan</button>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Plan Name</label>
              <input className="input-field" value={planForm.name} onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. Monthly Standard" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
              <textarea className="input-field min-h-24" value={planForm.description} onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="What is included?" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price (₹)</label>
                <input className="input-field" value={planForm.price} onChange={(e) => setPlanForm((prev) => ({ ...prev, price: e.target.value }))} placeholder="e.g. 3000" type="number" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Validity (Days)</label>
                <input className="input-field" value={planForm.duration_days} onChange={(e) => setPlanForm((prev) => ({ ...prev, duration_days: e.target.value }))} placeholder="e.g. 30" type="number" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Meal Count</label>
                <input className="input-field" value={planForm.total_meals} onChange={(e) => setPlanForm((prev) => ({ ...prev, total_meals: e.target.value }))} placeholder="e.g. 60" type="number" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Included Meals</label>
              <div className="grid grid-cols-2 gap-2">
                {(['lunch', 'dinner'] as const).map((meal) =>
                  <button
                    key={meal}
                    type="button"
                    onClick={() => setPlanForm((prev) => {
                      const isSelected = prev.meal_types.includes(meal);
                      const newMeals = isSelected ? prev.meal_types.filter((item) => item !== meal) : [...prev.meal_types, meal];
                      return {
                        ...prev,
                        meal_types: newMeals,
                        daily_scan_limit: newMeals.length > 0 ? newMeals.length.toString() : ''
                      };
                    })}
                    className={cn('p-2 rounded-xl border text-xs capitalize transition-colors', planForm.meal_types.includes(meal) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}
                  >
                    {meal}
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Daily Scan Limit</label>
              <div className="flex gap-2 items-center">
                <input
                  className="input-field w-32"
                  value={planForm.daily_scan_limit}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, daily_scan_limit: e.target.value }))}
                  placeholder="e.g. 2"
                  type="number"
                  disabled={planForm.daily_scan_limit === '' && planForm.meal_types.length === 0}
                />
                <button
                  type="button"
                  onClick={() => setPlanForm(prev => ({ ...prev, daily_scan_limit: prev.daily_scan_limit === '' ? (prev.meal_types.length > 0 ? prev.meal_types.length.toString() : '2') : '' }))}
                  className={cn('px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors', planForm.daily_scan_limit === '' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}
                >
                  Unlimited
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">If unlimited, leave blank or click the button.</p>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={savePlan} className="btn-primary flex-1">{editingPlanId ? 'Update Plan' : 'Save Plan'}</button>
              {editingPlanId && (
                <button onClick={() => { setEditingPlanId(null); setPlanForm({ name: '', description: '', price: '', duration_days: '30', total_meals: '', daily_scan_limit: '', meal_types: [] }) }} className="btn-secondary">Cancel</button>
              )}
            </div>
          </div>
          <div className="card p-6 lg:col-span-2 space-y-3">
            {plans.map((plan) =>
              <div key={plan.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold">{plan.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatCurrency(plan.price)} • {plan.duration_days} days {plan.total_meals ? `• ${plan.total_meals} meals` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                  <button onClick={() => handleGeneratePaymentQR(plan)} className="btn-secondary text-xs">QR</button>
                  <button onClick={() => handleEditPlan(plan)} className="btn-secondary text-xs text-brand-600">Edit</button>
                  <button onClick={() => togglePlanActive(plan.id)} className="btn-secondary text-xs">{plan.active ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => deletePlan(plan.id)} className="btn-secondary text-xs text-red-500">Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (view === 'subscribers') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-display font-bold">Active Subscribers</h1>
        </div>

        <div className="card p-6 space-y-4 bg-brand-50/50 dark:bg-brand-900/10 border-brand-100 dark:border-brand-900/30">
          <h3 className="font-bold text-sm">Add New Subscriber Manually</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 gap-2">
              <select
                className="input-field w-24 shrink-0"
                value={searchCountryCode}
                onChange={(e) => setSearchCountryCode(e.target.value)}
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+61">+61 (AU)</option>
              </select>
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Search user by phone number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
            </div>
            <button onClick={handleSearchUser} disabled={searchLoading} className="btn-secondary whitespace-nowrap">
              {searchLoading ? 'Searching...' : 'Search User'}
            </button>
          </div>

          {foundUser && (
            <div className="flex flex-col gap-4 mt-4 p-4 border border-brand-200 dark:border-brand-800 rounded-xl bg-white dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Selected User</label>
                  <div className="font-medium">{foundUser.full_name || 'No Name'} ({foundUser.phone})</div>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Plan</label>
                  <select
                    className="input-field py-2"
                    value={selectedAddPlanId}
                    onChange={(e) => {
                      setSelectedAddPlanId(e.target.value);
                      const p = plans.find(plan => plan.id === e.target.value);
                      if (p) setAddPlanAmountPaid(p.price.toString());
                    }}
                  >
                    <option value="">-- Choose a Plan --</option>
                    {plans.filter(p => p.active).map(p => (
                      <option key={p.id} value={p.id}>{p.name} - ₹{p.price} ({p.duration_days} days)</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedAddPlanId && (
                <div className="flex flex-col sm:flex-row gap-4 items-end border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Payment Status</label>
                    <select className="input-field py-2" value={addPlanPaymentStatus} onChange={(e) => setAddPlanPaymentStatus(e.target.value as any)}>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  {addPlanPaymentStatus === 'paid' && (
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount Paid (₹)</label>
                      <input type="number" className="input-field" value={addPlanAmountPaid} onChange={(e) => setAddPlanAmountPaid(e.target.value)} placeholder="e.g. 2000" />
                    </div>
                  )}
                  <button
                    onClick={handleAddSubscriber}
                    disabled={!selectedAddPlanId}
                    className="btn-primary w-full sm:w-auto mb-1"
                  >
                    Add Subscriber
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="text-left py-3.5 px-3">Student</th>
                <th className="text-left py-3.5 px-3">Plan</th>
                <th className="text-left py-3.5 px-3">Total Amt</th>
                <th className="text-left py-3.5 px-3">Paid Amt</th>
                <th className="text-left py-3.5 px-3">Due Amt</th>
                <th className="text-left py-3.5 px-3">Expiry</th>
                <th className="text-left py-3.5 px-3">Status</th>
                <th className="text-right py-3.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subscribers.map((sub) => {
                const planPrice = sub.plan?.price || 0;
                const dueAmount = Math.max(0, planPrice - sub.amount_paid);
                const statusLabel = dueAmount === 0 ? 'paid' : sub.amount_paid > 0 ? 'partial' : 'pending';

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-3 font-medium text-slate-900 dark:text-white">
                      {sub.student?.full_name || sub.student?.email || sub.student_id}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-600 dark:text-slate-300">
                      {sub.plan?.name || sub.plan_id}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      ₹{planPrice.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      ₹{sub.amount_paid.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3">
                      {dueAmount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                          ₹{dueAmount.toLocaleString()} Due
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          ✓ ₹0
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {formatDate(sub.end_date)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={cn('badge text-[10px] font-bold uppercase', statusLabel === 'paid' ? 'badge-green' : statusLabel === 'partial' ? 'badge-orange' : 'badge-red')}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setLedgerSub(sub)}
                          className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-950/30 dark:hover:bg-brand-900/50 dark:text-brand-400 rounded-xl transition-all font-bold text-xs flex items-center gap-1 border border-brand-200 dark:border-brand-800 cursor-pointer"
                          title="Manage Installments & View Payment Ledger"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Ledger
                        </button>
                        <button onClick={() => handleDeleteSubscriber(sub.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500 rounded-lg transition-colors" title="Delete Plan">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {renderInstallmentModal()}
      </div>
    )
  }

  if (view === 'attendance') {
    return (
      <div className="p-6 space-y-6">
        <div><h1 className="text-2xl font-display font-bold">Attendance Scan Logs</h1><p className="text-slate-500 text-sm mt-1">Loaded from the database.</p></div>
        <div className="card p-6 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-3 px-3">Date</th><th className="text-left py-3 px-3">Student</th><th className="text-center py-3 px-3">Meal</th></tr></thead><tbody>{attendance.slice(0, 20).map((row) => <tr key={row.id} className="border-b"><td className="py-3 px-3">{formatDate(row.date)}</td><td className="py-3 px-3">{subscribers.find((sub) => sub.student_id === row.student_id)?.student?.full_name || row.student_id}</td><td className="py-3 px-3 text-center">{['breakfast', 'lunch', 'dinner', 'snack'].filter((meal) => row[meal as keyof AttendanceRow]).map((meal) => mealTypeLabels[meal as keyof typeof mealTypeLabels]).join(', ')}</td></tr>)}</tbody></table></div>
      </div>
    )
  }

  if (view === 'analytics') {
    const totalRevenue = subscribers.reduce((sum, sub) => sum + sub.amount_paid, 0)
    const activeSubscribersCount = subscribers.filter(s => s.status === 'active' || s.payment_status === 'paid').length
    const mealsServed = attendance.length
    const totalPlans = plans.length

    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-brand-500" /> Dashboard Analytics
            </h1>
            <p className="text-slate-500 text-sm mt-1">Key metrics and performance of your mess.</p>
          </div>
          <button onClick={handleDownloadReport} className="btn-secondary self-start sm:self-auto flex items-center gap-2">
            <FileText className="w-4 h-4" /> Generate Report
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 border-l-4 border-l-orange-500">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</h3>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="card p-5 border-l-4 border-l-green-500">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Subscribers</h3>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeSubscribersCount}</div>
          </div>
          <div className="card p-5 border-l-4 border-l-blue-500">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Meals Served</h3>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{mealsServed}</div>
          </div>
          <div className="card p-5 border-l-4 border-l-purple-500">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Plans</h3>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalPlans}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" /> Subscriber Breakdown
            </h3>
            {plans.length > 0 ? (
              <div className="space-y-4">
                {plans.map(plan => {
                  const subsForPlan = subscribers.filter(s => s.plan_id === plan.id).length
                  const percentage = subscribers.length > 0 ? Math.round((subsForPlan / subscribers.length) * 100) : 0

                  return (
                    <div key={plan.id}>
                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span>{plan.name}</span>
                        <span>{subsForPlan} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No plans available to show breakdown.</p>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" /> Recent Attendance Activity
            </h3>
            <div className="space-y-3">
              {attendance.length > 0 ? (
                attendance.slice(0, 5).map(record => (
                  <div key={record.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {subscribers.find(s => s.student_id === record.student_id)?.student?.full_name || 'Unknown Student'}
                    </span>
                    <span className="text-slate-500">{formatDate(record.date)}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No recent attendance recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'settings') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-display font-bold">Mess Settings</h1><p className="text-slate-500 text-sm mt-1">Edit your mess profile and save it to the database.</p></div><button onClick={loadDashboard} className="btn-secondary text-xs">Refresh</button></div>
        <div className="card p-6 space-y-4">
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mess Name</label><input className="input-field" value={messName} onChange={(e) => setMessName(e.target.value)} placeholder="Mess name" /></div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Food Type</label>
            <select className="input-field" value={foodType} onChange={(e) => setFoodType(e.target.value as any)}>
              <option value="both">Veg & Non-Veg (Both)</option>
              <option value="veg">Pure Veg</option>
              <option value="non_veg">Non-Veg</option>
            </select>
          </div>
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label><textarea className="input-field min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" /></div>
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contact Phone</label><input className="input-field" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Contact Phone" /></div>
          {renderServiceHoursInputs()}
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Address</label><input className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" /></div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase">GPS Location</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLatitude(pos.coords.latitude)
                        setLongitude(pos.coords.longitude)
                        setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${pos.coords.latitude},${pos.coords.longitude}`)
                      },
                      (err) => alert('Unable to retrieve your location. Please ensure location permissions are granted.'),
                      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    )
                  } else {
                    alert('Geolocation is not supported by your browser.')
                  }
                }}
                className="btn-secondary whitespace-nowrap text-xs flex items-center"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Auto-Detect Location
              </button>
              {latitude && longitude ? (
                <span className="text-xs text-slate-500">
                  Lat: {latitude.toFixed(4)}, Long: {longitude.toFixed(4)}
                </span>
              ) : null}
            </div>
          </div>

          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Google Maps URL</label><input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="Paste Google Maps link here..." className="input-field" /></div>
          {googleMapsUrl && (
            <div className="text-sm">
              <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline flex items-center gap-1 mb-2">
                <MapPin className="w-4 h-4" /> Open Link
              </a>
              {googleMapsUrl.includes('embed') && (
                <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200">
                  <iframe src={googleMapsUrl.match(/src="([^"]+)"/)?.[1] || googleMapsUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Monthly Charge (₹)</label><input className="input-field" value={monthlyCharge} onChange={(e) => setMonthlyCharge(e.target.value)} placeholder="Monthly charge" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Per Meal Charge (₹)</label><input className="input-field" value={perMealCharge} onChange={(e) => setPerMealCharge(e.target.value)} placeholder="Per meal charge" /></div>
          </div>

          {(latitude && longitude && (latitude !== 18.5204 || longitude !== 73.8567)) && (
            <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 mt-2">
              <iframe
                src={`https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Mess Photos</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {photos.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden group">
                  <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 flex flex-col items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs text-slate-500 font-medium">Upload Image</span>
                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              <label className="flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 flex flex-col items-center justify-center transition-colors">
                <Camera className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs text-slate-500 font-medium">Take Photo</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Meals Provided</label>
            <div className="flex gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(meal => (
                <button
                  key={meal}
                  type="button"
                  onClick={() => setSelectedMealTypes(prev => prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal])}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl border capitalize ${selectedMealTypes.includes(meal) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveProfile} className="btn-primary mt-4">Save Mess Profile</button>
        </div>
      </div>
    )
  }

  if (view === 'qr') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Printable QR Poster</h1>
            <p className="text-slate-500 text-sm mt-1">Students can scan this static QR code to log their meals.</p>
          </div>
          <Link to="/dashboard/mess" className="btn-secondary text-xs">Back</Link>
        </div>
        <div className="card p-10 flex flex-col items-center justify-center max-w-md mx-auto mt-10">
          <h2 className="text-xl font-bold mb-6 text-center">{mess.name}</h2>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            {mess.qr_token ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(mess.qr_token)}`}
                alt="Mess Check-in QR"
                className="w-48 h-48 sm:w-64 sm:h-64 object-contain"
              />
            ) : (
              <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400">
                No QR Token found
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-6 text-center">Scan this to mark your meal entry automatically.</p>
          <button onClick={() => window.print()} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4" /> Print Poster
          </button>
        </div>
      </div>
    )
  }

  function renderInstallmentModal() {
    if (!ledgerSub) return null

    const planPrice = ledgerSub.plan?.price || 0
    const paidAmt = ledgerSub.amount_paid || 0
    const dueAmt = Math.max(0, planPrice - paidAmt)

    const instList: InstallmentRecord[] = Array.isArray(ledgerSub.installments) && ledgerSub.installments.length > 0
      ? ledgerSub.installments
      : ledgerSub.amount_paid > 0
        ? [{ id: `inst-init-${ledgerSub.id}`, subscription_id: ledgerSub.id, amount: ledgerSub.amount_paid, payment_date: ledgerSub.start_date || ledgerSub.created_at || new Date().toISOString(), payment_mode: 'upi', notes: 'Initial Payment' }]
        : []

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-500" /> Payment Ledger & Installments
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Student: <span className="font-bold text-slate-700 dark:text-slate-300">{ledgerSub.student?.full_name || ledgerSub.student?.email || ledgerSub.student_id}</span> ({ledgerSub.plan?.name || ledgerSub.plan_id})
                </p>
              </div>
              <button onClick={() => setLedgerSub(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Plan Price</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">₹{planPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Paid So Far</p>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{paidAmt.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Remaining Due</p>
                <p className={`text-lg font-extrabold mt-0.5 ${dueAmt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {dueAmt > 0 ? `₹${dueAmt.toLocaleString()}` : '✓ ₹0 Settled'}
                </p>
              </div>
            </div>

            {/* Record New Installment Form */}
            <div className="card p-5 bg-brand-50/40 dark:bg-brand-950/10 border-brand-200 dark:border-brand-900/40 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-500" /> Record Installment Payment
              </h4>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Installment Amount (₹)</label>
                  <input
                    type="number"
                    value={installmentForm.amount}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, amount: e.target.value })}
                    placeholder={`e.g. ${dueAmt > 0 ? dueAmt : 0}`}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Payment Method</label>
                  <select
                    value={installmentForm.payment_mode}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, payment_mode: e.target.value as any })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="cash">Cash Payment</option>
                    <option value="card">Card / POS Terminal</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={installmentForm.payment_date}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, payment_date: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Notes / Ref No.</label>
                  <input
                    type="text"
                    value={installmentForm.notes}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, notes: e.target.value })}
                    placeholder="e.g. 2nd installment via PhonePe"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                onClick={handleRecordInstallment}
                className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-extrabold py-2.5 rounded-xl shadow-brand hover:scale-[1.01] active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Record Payment Entry
              </button>
            </div>

            {/* Installment History Log */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Payment History Timeline</h4>
              {instList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No installment payments recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {instList.map((inst) => (
                    <div key={inst.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                          <span className="text-emerald-600 dark:text-emerald-400">+ ₹{Number(inst.amount).toLocaleString()}</span>
                          <span className="uppercase text-[9px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-extrabold">
                            {inst.payment_mode || 'UPI'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {inst.notes || 'Installment Payment'} • {formatDate(inst.payment_date)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteInstallmentLog(inst.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete Installment Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    )
  }

  return (
    <>
      {renderInstallmentModal()}
    </>
  )
}
