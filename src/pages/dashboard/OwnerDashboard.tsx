import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Building2, TrendingUp, DollarSign, Star, Eye, MessageSquare,
  Trash2, ToggleLeft, ToggleRight, X, Plus, Check, MapPin, Phone, Camera, Calendar
} from 'lucide-react'
import { usePropertyStore } from '../../store/propertyStore'
import { useAuthStore } from '../../store/authStore'
import { useVisitStore } from '../../store/visitStore'
import { formatCurrency, cn } from '../../lib/utils'
import { uploadToCloudinary } from '../../utils/cloudinary'
import { usePersistedForm } from '../../hooks/usePersistedForm'
import type { Property, PropertyType, RoomSharingConfig, FlatConfig, HostelConfig, PGConfig } from '../../types'

export default function OwnerDashboard() {
  const { properties, loadProperties, addProperty, updateProperty, toggleAvailability, deleteProperty } = usePropertyStore()
  const { getVisitsForOwner, updateVisitStatus, loadVisits, updateVisit } = useVisitStore()
  const { profile, initialized } = useAuthStore()

  const [rescheduleVisitId, setRescheduleVisitId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('11:00 AM')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formStep, setFormStep] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const [customAmenityInput, setCustomAmenityInput] = useState('')

  // Form State — persisted so camera round-trips don't reset it
  const PROPERTY_FORM_KEY = `property_form_${profile?.id || 'guest'}`
  const { form: formData, setForm: setFormData, clearPersistedForm: clearPropertyForm } = usePersistedForm(PROPERTY_FORM_KEY, {
    title: '',
    description: '',
    owner_name: profile?.full_name || '',
    property_type: 'pg' as PropertyType,
    rent: '',
    deposit: '',
    address: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '',
    latitude: '18.5204',
    longitude: '73.8567',
    google_maps_url: '',
    contact_phone: profile?.phone || '9876543210',
    gender_preference: 'any' as 'male' | 'female' | 'any',
    total_rooms: '10',
    available_rooms: '5',
    images: [] as string[],
    video_url: '',
    brokerage_applied: false,
    brokerage_amount: '',
    amenities: {
      wifi: true,
      ac: false,
      laundry: true,
      water: true,
      electricity: true,
      cctv: true,
      security: true,
      parking: false,
      attached_bathroom: false,
      study_table: true,
      furnished: true,
    } as Record<string, boolean>
  })

  // Dynamic Multi-Tier Sharing Configuration State (for PG and Hostel)
  const [sharingConfigs, setSharingConfigs] = useState<RoomSharingConfig[]>([
    { sharing_type: '1_sharing', rent: 12000, deposit: 24000, available_beds: 2, total_beds: 4, attached_bathroom: true, ac: true, balcony: false, study_desk: true, personal_wardrobe: true },
    { sharing_type: '2_sharing', rent: 8000, deposit: 16000, available_beds: 4, total_beds: 8, attached_bathroom: true, ac: false, balcony: false, study_desk: true, personal_wardrobe: true },
    { sharing_type: '3_sharing', rent: 6000, deposit: 12000, available_beds: 6, total_beds: 12, attached_bathroom: false, ac: false, balcony: false, study_desk: true, personal_wardrobe: true },
  ])

  // Flat Configuration State
  const [flatConfig, setFlatConfig] = useState<FlatConfig>({
    bhk_type: '2bhk',
    furnishing: 'fully_furnished',
    maintenance_charges: 1500,
    maintenance_type: 'extra',
    tenant_preference: 'students',
    parking_type: 'covered_car_bike',
    floor_number: 2,
    total_floors: 5,
    balconies: 2,
    bathrooms: 2,
  })

  // Hostel Configuration State
  const [hostelConfig, setHostelConfig] = useState<HostelConfig>({
    category_configs: [
      { sharing_type: '2_sharing', rent: 8000, deposit: 16000, available_beds: 4, total_beds: 10, attached_bathroom: true, ac: true },
      { sharing_type: '3_sharing', rent: 7000, deposit: 14000, available_beds: 5, total_beds: 15, attached_bathroom: false, ac: false },
      { sharing_type: 'dormitory', rent: 5000, deposit: 10000, available_beds: 8, total_beds: 20, attached_bathroom: false, ac: false },
    ],
    warden_phone: '+91 98765 00001',
    curfew_time: '21:30',
    mess_option: 'included',
    meals_offered: ['breakfast', 'lunch', 'evening_snacks', 'dinner'],
  })

  // PG Specific General Config State
  const [pgConfig, setPgConfig] = useState<PGConfig>({
    sharing_configs: [],
    food_option: 'included',
    food_type: 'veg',
    curfew_time: '22:30',
    housekeeping: 'daily',
    laundry: 'free_washing_machine',
  })

  useEffect(() => {
    if (initialized) {
      loadProperties()
      loadVisits()
    }
  }, [initialized, loadProperties, loadVisits])

  // Automatically pre-fill owner name and phone from profile when creating a new property listing
  useEffect(() => {
    if (profile && !editingId) {
      setFormData(prev => ({
        ...prev,
        owner_name: profile.full_name || prev.owner_name,
        contact_phone: profile.phone || prev.contact_phone
      }))
    }
  }, [profile, editingId])

  // We show properties associated with the active property owner
  const myProperties = profile?.id
    ? properties.filter(p => p.owner_id === profile.id || p.owner_id === 'owner1' || !p.owner_id)
    : properties
  const location = useLocation()
  const isVisitsTab = location.pathname.includes('/owner/visits')
  const isListingsTab = location.pathname.includes('/owner/listings')
  const isOverviewTab = !isVisitsTab && !isListingsTab

  const [visitFilter, setVisitFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all')

  const displayProperties = myProperties
  const myPropertyIds = displayProperties.map(p => p.id)

  const ownerVisits = getVisitsForOwner(profile?.id || '', myPropertyIds)
  const pendingVisitsCount = ownerVisits.filter(v => v.status === 'pending').length
  const acceptedVisitsCount = ownerVisits.filter(v => v.status === 'accepted').length
  const declinedVisitsCount = ownerVisits.filter(v => v.status === 'declined').length

  const filteredOwnerVisits = ownerVisits.filter(v => {
    if (visitFilter === 'all') return true
    return v.status === visitFilter
  })

  const totalRoomsCount = displayProperties.reduce((acc, p) => acc + (p.total_rooms || 10), 0)
  const totalAvailableCount = displayProperties.reduce((acc, p) => acc + (p.available_rooms || 5), 0)
  const totalOccupiedCount = Math.max(0, totalRoomsCount - totalAvailableCount)
  const occupancyPercentage = totalRoomsCount > 0 ? Math.round((totalOccupiedCount / totalRoomsCount) * 100) : 100
  const estimatedMonthlyRevenue = displayProperties.reduce((acc, p) => acc + ((p.rent || 0) * Math.max(1, (p.total_rooms || 1) - (p.available_rooms || 0))), 0)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let cleanVal = value
    if (name === 'rent' || name === 'deposit' || name === 'total_rooms' || name === 'available_rooms') {
      cleanVal = value.replace(/^0+(?=\d)/, '')
    }
    setFormData(prev => ({ ...prev, [name]: cleanVal }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file))
      const urls = await Promise.all(uploadPromises)

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }))
    } catch (error: any) {
      alert('Failed to upload image: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setFormData(prev => ({ ...prev, video_url: url }))
    } catch (error: any) {
      alert('Failed to upload video: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  // Tier-specific Photo & Video Upload Handlers
  const handleTierFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, sharingType: string) => {
    const files = e.target.files
    if (!files) return
    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file))
      const urls = await Promise.all(uploadPromises)
      setSharingConfigs(prev => prev.map(c => c.sharing_type === sharingType ? {
        ...c,
        images: [...(c.images || []), ...urls]
      } : c))
    } catch (error: any) {
      alert('Failed to upload image: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleTierVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, sharingType: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setSharingConfigs(prev => prev.map(c => c.sharing_type === sharingType ? {
        ...c,
        video_url: url
      } : c))
    } catch (error: any) {
      alert('Failed to upload video: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const removeTierImage = (sharingType: string, imgIdx: number) => {
    setSharingConfigs(prev => prev.map(c => c.sharing_type === sharingType ? {
      ...c,
      images: (c.images || []).filter((_, i) => i !== imgIdx)
    } : c))
  }

  const handleAmenityChange = (key: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [key]: !prev.amenities[key]
      }
    }))
  }

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenityInput.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase().replace(/\s+/g, '_')
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [key]: true
      }
    }))
    setCustomAmenityInput('')
  }

  const removeCustomAmenity = (keyToRemove: string) => {
    setFormData(prev => {
      const copy = { ...prev.amenities }
      delete copy[keyToRemove]
      return { ...prev, amenities: copy }
    })
  }

  const handleDeleteProperty = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }
    // Optimistic immediate UI state removal
    usePropertyStore.setState((state) => ({
      properties: state.properties.filter(p => String(p.id) !== String(id))
    }))
    await deleteProperty(id)
  }

  const handleEdit = (property: Property) => {
    setEditingId(property.id)
    const rawAmenities = property.amenities
    let existing: Record<string, boolean> = {}
    if (typeof rawAmenities === 'string') {
      try {
        existing = JSON.parse(rawAmenities)
      } catch (e) {
        existing = {}
      }
    } else if (rawAmenities && typeof rawAmenities === 'object') {
      existing = rawAmenities as Record<string, boolean>
    }

    setFormData({
      title: property.title,
      description: property.description || '',
      owner_name: property.owner_name || property.profiles?.full_name || profile?.full_name || '',
      property_type: property.property_type,
      rent: property.rent?.toString() || '0',
      deposit: property.deposit?.toString() || '0',
      address: property.address || '',
      city: property.city || 'Pune',
      state: property.state || 'Maharashtra',
      pincode: property.pincode || '',
      latitude: property.latitude?.toString() || '18.5204',
      longitude: property.longitude?.toString() || '73.8567',
      google_maps_url: property.google_maps_url || '',
      contact_phone: property.contact_phone || profile?.phone || '9876543210',
      gender_preference: property.gender_preference as any || 'any',
      total_rooms: property.total_rooms?.toString() || '10',
      available_rooms: property.available_rooms?.toString() || '5',
      images: property.images || [],
      video_url: property.video_url || '',
      brokerage_applied: property.brokerage_applied || false,
      brokerage_amount: property.brokerage_amount?.toString() || '',
      amenities: {
        wifi: existing.wifi !== undefined ? !!existing.wifi : true,
        ac: !!existing.ac,
        laundry: existing.laundry !== undefined ? !!existing.laundry : true,
        water: existing.water !== undefined ? !!existing.water : true,
        electricity: existing.electricity !== undefined ? !!existing.electricity : true,
        cctv: !!existing.cctv,
        security: !!existing.security,
        parking: !!existing.parking,
        attached_bathroom: !!existing.attached_bathroom,
        study_table: !!existing.study_table,
        furnished: !!existing.furnished,
        ...existing
      }
    })
    setSharingConfigs(
      property.sharing_configs && property.sharing_configs.length > 0
        ? property.sharing_configs
        : [
          { sharing_type: '1_sharing', rent: property.rent || 8000, deposit: property.deposit || 16000, available_beds: 2, total_beds: 4, attached_bathroom: !!existing.attached_bathroom, ac: !!existing.ac },
          { sharing_type: '2_sharing', rent: Math.round((property.rent || 8000) * 0.8), deposit: Math.round((property.deposit || 16000) * 0.8), available_beds: 4, total_beds: 8, attached_bathroom: !!existing.attached_bathroom, ac: !!existing.ac },
        ]
    )
    setFlatConfig(
      property.flat_config || {
        bhk_type: '2bhk',
        furnishing: 'semi_furnished',
        maintenance_charges: 1500,
        maintenance_type: 'extra',
        tenant_preference: 'any',
        parking_type: 'covered_car_bike',
        floor_number: 1,
        total_floors: 5,
      }
    )
    setHostelConfig(
      property.hostel_config || {
        warden_phone: property.contact_phone || '+91 98765 43210',
        curfew_time: '22:00',
        mess_option: 'included',
        meals_offered: ['breakfast', 'lunch', 'dinner'],
        category_configs: [],
      }
    )
    setPgConfig(
      property.pg_config || {
        curfew_time: 'no_curfew',
        food_option: 'included',
        housekeeping: 'daily',
        laundry: 'none',
        sharing_configs: [],
      }
    )
    setFormStep(1)
    setIsModalOpen(true)
  }

  const handleEditLocation = (property: Property) => {
    handleEdit(property)
    setFormStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formStep < 2) {
      setFormStep(2)
      return
    }

    if (!profile?.id) {
      alert('You must be logged in to create a property.')
      return
    }

    const primaryRent = Number(formData.rent) || (sharingConfigs[0]?.rent || 6000)
    const primaryDeposit = Number(formData.deposit) || (sharingConfigs[0]?.deposit || 12000)

    // Aggregate photos from main form AND all sharing tier configs
    const tierImages = sharingConfigs.flatMap(c => c.images || [])
    const finalImages = Array.from(new Set([...(formData.images || []), ...tierImages])).filter(Boolean) as string[]

    // Sync room-tier amenities into main property amenities map so PropertyCard amenity icons render
    const consolidatedAmenities = { ...(formData.amenities || {}) }
    sharingConfigs.forEach(c => {
      if (c.attached_bathroom && formData.amenities?.attached_bathroom !== false) consolidatedAmenities.attached_bathroom = true
      if (c.ac && formData.amenities?.ac !== false) consolidatedAmenities.ac = true
      if (c.study_desk && formData.amenities?.study_table !== false) consolidatedAmenities.study_table = true
    })

    const propertyData: any = {
      title: formData.title || 'Cozy Accommodation',
      description: formData.description || 'Clean rooms with complete student amenities.',
      owner_name: formData.owner_name || profile.full_name || 'Property Owner',
      property_type: formData.property_type,
      rent: primaryRent,
      deposit: primaryDeposit,
      address: formData.address || 'Kothrud, Pune',
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode || '411038',
      latitude: Number(formData.latitude) || 18.5204,
      longitude: Number(formData.longitude) || 73.8567,
      google_maps_url: formData.google_maps_url,
      contact_phone: formData.contact_phone,
      gender_preference: formData.gender_preference,
      total_rooms: Number(formData.total_rooms) || 10,
      available_rooms: Number(formData.available_rooms) || 5,
      images: finalImages,
      video_url: formData.video_url || sharingConfigs.find(c => c.video_url)?.video_url || '',
      amenities: consolidatedAmenities,
      sharing_configs: sharingConfigs,
      flat_config: flatConfig,
      hostel_config: { ...hostelConfig, category_configs: sharingConfigs },
      pg_config: { ...pgConfig, sharing_configs: sharingConfigs },
      brokerage_applied: formData.brokerage_applied || false,
      brokerage_amount: formData.brokerage_applied ? (Number(formData.brokerage_amount) || 0) : 0,
    }

    let result
    if (editingId) {
      result = await updateProperty(editingId, propertyData)
    } else {
      result = await addProperty({
        ...propertyData,
        owner_id: profile.id,
        availability: true,
        featured: false,
      })
    }

    if (!result.success) {
      alert('Failed to save property: ' + result.error)
      return
    }

    // Reset Form
    clearPropertyForm()
    setIsModalOpen(false)
    setEditingId(null)
    setFormStep(1)
    setFormData({
      owner_name: '',
      title: '',
      description: '',
      property_type: 'pg',
      rent: '',
      deposit: '',
      address: '',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '',
      latitude: '18.5204',
      longitude: '73.8567',
      google_maps_url: '',
      contact_phone: '+91 98765 43210',
      gender_preference: 'any',
      total_rooms: '10',
      available_rooms: '5',
      images: [] as string[],
      video_url: '',
      brokerage_applied: false,
      brokerage_amount: '',
      amenities: {
        wifi: true,
        ac: false,
        laundry: true,
        water: true,
        electricity: true,
        cctv: true,
        security: true,
        parking: false,
        attached_bathroom: false,
        study_table: true,
        furnished: true,
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {isVisitsTab ? '📅 Scheduled Visits & Inquiries' : isListingsTab ? '🏢 My Property Listings' : 'Property Owner Overview'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isVisitsTab
              ? 'Accept or manage free tour visit requests submitted by students'
              : isListingsTab
                ? 'Manage, edit, or add rental listings for your PGs, hostels, or apartments'
                : 'Real-time performance analytics, occupancy statistics, and quick actions'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="btn-primary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Listing
          </button>
        </div>
      </div>

      {/* OVERVIEW STATS & ANALYTICS (Shown strictly on Overview Tab) */}
      {isOverviewTab && (
        <div className="space-y-6">
          {/* Key Performance Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Active Listings Card */}
            <div className="card-interactive p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between group">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Listings</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{displayProperties.length} Properties</h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> 100% Live & Verified
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            {/* 2. Room Capacity & Occupancy Card */}
            <div className="card-interactive p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between group">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Occupancy Rate</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{occupancyPercentage}%</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {totalOccupiedCount} of {totalRoomsCount} rooms occupied
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* 3. Visit Requests Card */}
            <div className="card-interactive p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between group">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Visit Requests</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{ownerVisits.length} Requests</h3>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                  ⏳ {pendingVisitsCount} Pending Approval
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Quick Navigation Cards & Banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Visit Requests Quick Action Card */}
            <div className="card p-4 sm:p-6 border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 to-orange-50/20 dark:from-amber-950/20 dark:to-slate-900 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">Student Visit Requests</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {pendingVisitsCount > 0 ? `You have ${pendingVisitsCount} new visit request(s) waiting for response` : 'No pending visit requests'}
                    </p>
                  </div>
                </div>
                {pendingVisitsCount > 0 && (
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-extrabold animate-pulse shrink-0">
                    {pendingVisitsCount} Pending
                  </span>
                )}
              </div>

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-amber-200/60 dark:border-amber-900/40">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {acceptedVisitsCount} Confirmed Visits
                </span>
                <Link
                  to="/dashboard/owner/visits"
                  className="py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition-all text-center shadow-sm"
                >
                  Manage Visit Requests →
                </Link>
              </div>
            </div>

            {/* Property Listings Quick Action Card */}
            <div className="card p-4 sm:p-6 border border-brand-200/80 dark:border-brand-900/50 bg-gradient-to-br from-brand-50/50 to-indigo-50/20 dark:from-brand-950/20 dark:to-slate-900 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-md shadow-brand-600/20 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">Active Properties</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Manage your {displayProperties.length} active rental property listings
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-brand-200/60 dark:border-brand-900/40">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {displayProperties.filter(p => p.availability).length} Available for rent
                </span>
                <Link
                  to="/dashboard/owner/listings"
                  className="py-2.5 px-4 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-all text-center shadow-sm"
                >
                  Manage Property Listings →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Visits & Inquiries Management Section */}
      {isVisitsTab && (
        <div className="card p-6 space-y-5 border-2 border-brand-500/20 bg-gradient-to-br from-white via-slate-50/50 to-brand-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-brand-600 dark:text-brand-400" /> Scheduled Visits & Inquiries
                </h2>
                {pendingVisitsCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-xs animate-pulse shadow-sm">
                    {pendingVisitsCount} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Accept or manage free tour visit requests submitted by students
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                ⏳ {pendingVisitsCount} Pending
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                ✓ {acceptedVisitsCount} Confirmed
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setVisitFilter('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                visitFilter === 'all'
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              )}
            >
              All Requests ({ownerVisits.length})
            </button>
            <button
              type="button"
              onClick={() => setVisitFilter('pending')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                visitFilter === 'pending'
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/60"
              )}
            >
              ⏳ Pending ({pendingVisitsCount})
            </button>
            <button
              type="button"
              onClick={() => setVisitFilter('accepted')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                visitFilter === 'accepted'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/60"
              )}
            >
              ✓ Confirmed ({acceptedVisitsCount})
            </button>
            <button
              type="button"
              onClick={() => setVisitFilter('declined')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                visitFilter === 'declined'
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 border border-red-200/60"
              )}
            >
              ✗ Declined ({declinedVisitsCount})
            </button>
          </div>

          {filteredOwnerVisits.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              {visitFilter === 'all'
                ? 'No visit requests scheduled yet. When students click "Schedule Visit" on your properties, requests will appear here for your approval.'
                : `No ${visitFilter} visit requests found.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOwnerVisits.map((visit) => {
                const isPending = visit.status === 'pending'
                const isAccepted = visit.status === 'accepted'
                const isDeclined = visit.status === 'declined'

                const rawPhone = visit.student_phone || '9876543210'
                const digitsOnly = rawPhone.replace(/[^0-9]/g, '')
                const phone10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly
                const formattedStudentPhone = `+91 ${phone10}`

                const handleOwnerVisitResponse = (status: 'accepted' | 'declined') => {
                  void updateVisitStatus(visit.id, status)

                  const msg = status === 'accepted'
                    ? `Hi ${visit.student_name}! I have ACCEPTED your property visit request for "${visit.property_title}" on ${visit.day_label}, ${visit.visit_date} at ${visit.time_slot}. Looking forward to showing you the property!`
                    : `Hi ${visit.student_name}, regarding your property visit request for "${visit.property_title}" on ${visit.day_label}, ${visit.visit_date} at ${visit.time_slot} - unfortunately this time slot is currently unavailable. Please let me know if another date/time works for you!`

                  window.open(`https://wa.me/91${phone10}?text=${encodeURIComponent(msg)}`, '_blank')
                }

                return (
                  <div
                    key={visit.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${isPending
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-sm'
                        : isAccepted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                      }`}
                  >
                    <div>
                      {/* Header Info */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                            {visit.property_title}
                          </h4>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                            👤 {visit.student_name}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${isPending
                              ? 'bg-amber-500 text-white shadow-sm'
                              : isAccepted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-red-500 text-white'
                            }`}
                        >
                          {isPending ? '⏳ Pending' : isAccepted ? '✓ Accepted' : '✗ Declined'}
                        </span>
                      </div>

                      {/* Slot Details Box */}
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>📅 Date:</span>
                          <strong className="text-slate-900 dark:text-white font-bold">{visit.day_label}, {visit.visit_date}</strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>⏰ Time Slot:</span>
                          <strong className="text-brand-600 dark:text-brand-400 font-bold">{visit.time_slot}</strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span>📞 Phone:</span>
                          <a href={`tel:${phone10}`} className="font-mono font-bold text-slate-900 dark:text-white underline">
                            {formattedStudentPhone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Property Owner */}
                    <div className="pt-2 flex items-center gap-2">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOwnerVisitResponse('accepted')}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md shadow-emerald-600/20"
                          >
                            <Check className="w-4 h-4" /> Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleVisitId(visit.id)
                              setRescheduleDate(visit.visit_date ? new Date(visit.visit_date).toISOString().split('T')[0] : '')
                              setRescheduleTime(visit.time_slot)
                            }}
                            className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOwnerVisitResponse('declined')}
                            className="py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-xs transition-all"
                          >
                            Decline
                          </button>
                        </>
                      ) : isAccepted ? (
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Visit Accepted
                          </span>
                          <button
                            type="button"
                            onClick={() => updateVisitStatus(visit.id, 'pending')}
                            className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                          >
                            Change Status
                          </button>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="text-xs text-red-500 font-bold">Visit Declined</span>
                          <button
                            type="button"
                            onClick={() => handleOwnerVisitResponse('accepted')}
                            className="text-xs font-bold text-emerald-600 hover:underline"
                          >
                            Re-Accept & WhatsApp
                          </button>
                        </div>
                      )}

                      {/* WhatsApp direct contact */}
                      <a
                        href={`https://wa.me/91${phone10}?text=${encodeURIComponent(`Hi ${visit.student_name}, regarding your property visit request for "${visit.property_title}" on ${visit.visit_date} at ${visit.time_slot}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Listings Management Panel */}
      {!isVisitsTab && (
        <div className="card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Active Properties</h3>
              <p className="text-sm text-slate-500">Total: {displayProperties.length} active listings</p>
            </div>
          </div>

          {displayProperties.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800">
                <Building2 className="w-6 h-6 text-slate-405" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">No Active Listings</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Welcome to FlatsNFood Housing! List your PG, flat, or hostel room to start receiving views and student inquiries.</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="btn-primary py-2 px-5 text-xs mx-auto flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Your First Listing
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-sm text-left md:min-w-[800px] md:whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Property Details</th>
                    <th className="hidden sm:table-cell py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                    <th className="hidden sm:table-cell py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Rent</th>
                    <th className="hidden sm:table-cell py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Rooms Left</th>
                    <th className="hidden sm:table-cell py-3 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayProperties.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-4 px-4 flex items-center gap-3">
                        <img src={p.images[0]} alt={p.title} className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[220px]">{p.title}</p>
                          <button
                            onClick={() => handleEditLocation(p)}
                            className="text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 text-left cursor-pointer group/loc transition-colors"
                            title="Click to edit location & GPS coordinates"
                          >
                            <MapPin className="w-3 h-3 text-slate-400 group-hover/loc:text-brand-600" /> {p.address}, {p.city}
                          </button>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell py-4 px-4 capitalize text-xs text-slate-600 dark:text-slate-400 font-medium">{p.property_type.replace('_', ' ')}</td>
                      <td className="hidden sm:table-cell py-4 px-4 font-bold text-slate-800 dark:text-slate-200">{formatCurrency(p.rent)}/mo</td>
                      <td className="hidden sm:table-cell py-4 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{p.available_rooms}/{p.total_rooms}</td>
                      <td className="hidden sm:table-cell py-4 px-4 text-center">
                        <button onClick={() => toggleAvailability(p.id)} className="focus:outline-none">
                          {p.availability ? (
                            <span className="badge badge-green inline-flex items-center gap-1 cursor-pointer">
                              <ToggleRight className="w-4 h-4" /> Available
                            </span>
                          ) : (
                            <span className="badge badge-red inline-flex items-center gap-1 cursor-pointer">
                              <ToggleLeft className="w-4 h-4" /> Fully Booked
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleEditLocation(p)}
                          className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 rounded-lg text-slate-400 transition-colors inline-flex"
                          title="Edit Location & GPS"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1.5 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/20 rounded-lg text-slate-400 transition-colors inline-flex"
                          title="Edit Listing Info"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          onClick={(e) => handleDeleteProperty(e, p.id, p.title)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 rounded-lg text-slate-400 transition-colors inline-flex"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Listing Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-glass overflow-hidden z-10 flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-white">{editingId ? '✏️ Edit Rental Listing' : '🆕 Add New Rental Listing'}</h3>
                  <p className="text-xs text-slate-400">Switch tabs to edit basic info or location details</p>
                </div>
                <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Navigation Tabs */}
              <div className="px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap",
                    formStep === 1
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  <span>1. Property Info & Pricing</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormStep(2)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap",
                    formStep === 2
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>2. Location & GPS Coordinates</span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                {formStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm border-b pb-1">1. Basic Information, Owner Contact & Category</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Owner / Host Name *</label>
                        <input
                          type="text"
                          name="owner_name"
                          required
                          value={formData.owner_name}
                          onChange={handleInputChange}
                          placeholder="e.g. Ramesh Kumar"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Owner Mobile Phone Number *</label>
                        <input
                          type="tel"
                          name="contact_phone"
                          required
                          value={formData.contact_phone}
                          onChange={handleInputChange}
                          placeholder="e.g. 9876543210"
                          className="input-field font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Property Title / Name *</label>
                      <input
                        type="text" name="title" required value={formData.title} onChange={handleInputChange}
                        placeholder="e.g. Sunshine PG for Boys – Near MIT College" className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Description *</label>
                      <textarea
                        name="description" required rows={3} value={formData.description} onChange={handleInputChange}
                        placeholder="Detailed overview of PG layout, rules, and facilities..." className="input-field py-2"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Property Category *</label>
                        <select name="property_type" value={formData.property_type} onChange={handleInputChange} className="input-field font-semibold text-brand-600 dark:text-brand-400">
                          <option value="pg">PG (Paying Guest)</option>
                          <option value="flat">Flat / Apartment</option>
                          <option value="hostel">Hostel</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Gender Preference</label>
                        <select name="gender_preference" value={formData.gender_preference} onChange={handleInputChange} className="input-field">
                          <option value="any">Any (Co-ed)</option>
                          <option value="male">Boys Only</option>
                          <option value="female">Girls Only</option>
                        </select>
                      </div>
                    </div>

                    {/* DYNAMIC CATEGORY FORM SECTIONS */}

                    {/* 1. PG CATEGORY CONFIGURATION */}
                    {(formData.property_type === 'pg' || formData.property_type === 'shared_room' || formData.property_type === 'private_room') && (
                      <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-800/60 pb-2">
                          <h5 className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                            <span>🛏️</span> Multi-Sharing Tiers & Pricing Configuration
                          </h5>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Configure Rent & Amenities per Sharing</span>
                        </div>

                        {/* Sharing Tier Cards */}
                        <div className="space-y-3">
                          {['1_sharing', '2_sharing', '3_sharing', '4_sharing'].map((type) => {
                            const config = sharingConfigs.find(c => c.sharing_type === type)
                            const isSelected = Boolean(config)
                            const label = type.replace('_', ' ').toUpperCase()

                            return (
                              <div key={type} className={`p-3 rounded-xl border transition-all ${isSelected ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700 shadow-sm' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSharingConfigs(prev => [...prev, { sharing_type: type as any, rent: 7000, deposit: 14000, available_beds: 3, total_beds: 6, attached_bathroom: true, ac: false }])
                                        } else {
                                          setSharingConfigs(prev => prev.filter(c => c.sharing_type !== type))
                                        }
                                      }}
                                      className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <span>{label}</span>
                                  </label>
                                  {isSelected && (
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded font-semibold">
                                      Active Tier
                                    </span>
                                  )}
                                </div>

                                {isSelected && config && (
                                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Rent (₹/head)</label>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={config.rent === 0 ? '' : config.rent}
                                          placeholder="0"
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) => {
                                            const cleanStr = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
                                            const val = cleanStr === '' ? 0 : Number(cleanStr)
                                            setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, rent: val } : c))
                                          }}
                                          className="input-field py-1 text-xs font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Deposit (₹/head)</label>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={config.deposit === 0 ? '' : config.deposit}
                                          placeholder="0"
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) => {
                                            const cleanStr = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
                                            const val = cleanStr === '' ? 0 : Number(cleanStr)
                                            setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, deposit: val } : c))
                                          }}
                                          className="input-field py-1 text-xs font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Avail. Beds</label>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={config.available_beds === 0 ? '' : config.available_beds}
                                          placeholder="0"
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) => {
                                            const cleanStr = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
                                            const val = cleanStr === '' ? 0 : Number(cleanStr)
                                            setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, available_beds: val } : c))
                                          }}
                                          className="input-field py-1 text-xs font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Total Beds</label>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={config.total_beds === 0 ? '' : config.total_beds}
                                          placeholder="0"
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) => {
                                            const cleanStr = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
                                            const val = cleanStr === '' ? 0 : Number(cleanStr)
                                            setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, total_beds: val } : c))
                                          }}
                                          className="input-field py-1 text-xs font-semibold"
                                        />
                                      </div>
                                    </div>

                                    {/* Tier-specific Amenity Toggles */}
                                    <div className="flex flex-wrap gap-2 text-[10px]">
                                      <button
                                        type="button"
                                        onClick={() => setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, attached_bathroom: !c.attached_bathroom } : c))}
                                        className={`px-2.5 py-1 rounded-full border transition-all ${config.attached_bathroom ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                      >
                                        🚿 Attached Bath
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, ac: !c.ac } : c))}
                                        className={`px-2.5 py-1 rounded-full border transition-all ${config.ac ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                      >
                                        ❄️ AC Room
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, balcony: !c.balcony } : c))}
                                        className={`px-2.5 py-1 rounded-full border transition-all ${config.balcony ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                      >
                                        🌅 Private Balcony
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, study_desk: !c.study_desk } : c))}
                                        className={`px-2.5 py-1 rounded-full border transition-all ${config.study_desk ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                      >
                                        📚 Dedicated Study Desk
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, personal_wardrobe: !c.personal_wardrobe } : c))}
                                        className={`px-2.5 py-1 rounded-full border transition-all ${config.personal_wardrobe ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                      >
                                        🚪 Personal Wardrobe
                                      </button>
                                    </div>

                                    {/* Tier-Specific Photos & Video Upload */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                        📸 {label} Photos & Room Walkthrough
                                      </label>
                                      {(config.images && config.images.length > 0) && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                          {config.images.map((img, i) => (
                                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden group border border-slate-200 dark:border-slate-700">
                                              <img src={img} alt={`${label} Preview ${i}`} className="w-full h-full object-cover" />
                                              <button
                                                type="button"
                                                onClick={() => removeTierImage(type, i)}
                                                className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <div className="flex gap-2">
                                        <label className={`flex-1 cursor-pointer bg-indigo-50/50 hover:bg-indigo-100/50 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg p-2 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                          <Plus className="w-4 h-4 text-indigo-500 mb-0.5" />
                                          <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">{isUploading ? 'Uploading...' : 'Upload Photos'}</span>
                                          <input type="file" multiple accept="image/*" onChange={(e) => handleTierFileUpload(e, type)} disabled={isUploading} className="hidden" />
                                        </label>
                                        <label className={`flex-1 cursor-pointer bg-indigo-50/50 hover:bg-indigo-100/50 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg p-2 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                          <Camera className="w-4 h-4 text-indigo-500 mb-0.5" />
                                          <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">Camera</span>
                                          <input type="file" accept="image/*" capture="environment" onChange={(e) => handleTierFileUpload(e, type)} disabled={isUploading} className="hidden" />
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* General PG Rules & Mess */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-indigo-200 dark:border-indigo-800/60">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Food / Mess Facility</label>
                            <select
                              value={pgConfig?.food_option || 'included'}
                              onChange={(e) => setPgConfig(prev => ({ ...prev, food_option: e.target.value as any }))}
                              className="input-field py-1 text-xs"
                            >
                              <option value="included">Meals Included in Rent</option>
                              <option value="extra_charge">Available (Extra Charge)</option>
                              <option value="not_available">Not Available</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">In-Time / Curfew</label>
                            <select
                              value={pgConfig?.curfew_time || 'no_curfew'}
                              onChange={(e) => setPgConfig(prev => ({ ...prev, curfew_time: e.target.value as any }))}
                              className="input-field py-1 text-xs"
                            >
                              <option value="no_curfew">No Curfew (24/7 Entry)</option>
                              <option value="21:30">9:30 PM In-Time</option>
                              <option value="22:00">10:00 PM In-Time</option>
                              <option value="22:30">10:30 PM In-Time</option>
                              <option value="23:00">11:00 PM In-Time</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. HOSTEL CATEGORY CONFIGURATION */}
                    {formData.property_type === 'hostel' && (
                      <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800/60 pb-2">
                          <h5 className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                            <span>🛡️</span> Hostel Room Categories & Curfew
                          </h5>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Room Categories & Mess</span>
                        </div>

                        {/* Room Categories */}
                        <div className="space-y-3">
                          {['1_sharing', '2_sharing', '3_sharing', 'dormitory'].map((type) => {
                            const config = sharingConfigs.find(c => c.sharing_type === type)
                            const isSelected = Boolean(config)
                            const label = type === 'dormitory' ? 'Dormitory Hall' : `${type.split('_')[0]} Seater Room`

                            return (
                              <div key={type} className={`p-3 rounded-xl border transition-all ${isSelected ? 'bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-700 shadow-sm' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSharingConfigs(prev => [...prev, { sharing_type: type as any, rent: 6500, deposit: 13000, available_beds: 4, total_beds: 10 }])
                                        } else {
                                          setSharingConfigs(prev => prev.filter(c => c.sharing_type !== type))
                                        }
                                      }}
                                      className="w-4 h-4 text-purple-600 rounded"
                                    />
                                    <span>{label}</span>
                                  </label>
                                </div>

                                {isSelected && config && (
                                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Rent (₹/mo)</label>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={config.rent === 0 ? '' : config.rent}
                                          placeholder="0"
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) => {
                                            const cleanStr = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
                                            const val = cleanStr === '' ? 0 : Number(cleanStr)
                                            setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, rent: val } : c))
                                          }}
                                          className="input-field py-1 text-xs font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Deposit (₹)</label>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={config.deposit === 0 ? '' : config.deposit}
                                          placeholder="0"
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) => {
                                            const cleanStr = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
                                            const val = cleanStr === '' ? 0 : Number(cleanStr)
                                            setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, deposit: val } : c))
                                          }}
                                          className="input-field py-1 text-xs font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Avail. Beds</label>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={config.available_beds === 0 ? '' : config.available_beds}
                                          placeholder="0"
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) => {
                                            const cleanStr = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
                                            const val = cleanStr === '' ? 0 : Number(cleanStr)
                                            setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, available_beds: val } : c))
                                          }}
                                          className="input-field py-1 text-xs font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Total Beds</label>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={config.total_beds === 0 ? '' : config.total_beds}
                                          placeholder="0"
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) => {
                                            const cleanStr = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
                                            const val = cleanStr === '' ? 0 : Number(cleanStr)
                                            setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, total_beds: val } : c))
                                          }}
                                          className="input-field py-1 text-xs font-semibold"
                                        />
                                      </div>
                                    </div>

                                    {/* Tier-specific Amenity Toggles */}
                                    <div className="flex flex-wrap gap-2 text-[10px] pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, attached_bathroom: !c.attached_bathroom } : c))}
                                        className={`px-2.5 py-1 rounded-full border transition-all ${config.attached_bathroom ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                      >
                                        🚿 Attached Bath
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, ac: !c.ac } : c))}
                                        className={`px-2.5 py-1 rounded-full border transition-all ${config.ac ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                      >
                                        ❄️ AC Room
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, balcony: !c.balcony } : c))}
                                        className={`px-2.5 py-1 rounded-full border transition-all ${config.balcony ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                      >
                                        🌅 Private Balcony
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, study_desk: !c.study_desk } : c))}
                                        className={`px-2.5 py-1 rounded-full border transition-all ${config.study_desk ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                      >
                                        📚 Dedicated Study Desk
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, personal_wardrobe: !c.personal_wardrobe } : c))}
                                        className={`px-2.5 py-1 rounded-full border transition-all ${config.personal_wardrobe ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                      >
                                        🚪 Personal Wardrobe
                                      </button>
                                    </div>

                                    {/* Tier-Specific Photos Upload */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                        📸 {label} Room Photos
                                      </label>
                                      {(config.images && config.images.length > 0) && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                          {config.images.map((img, i) => (
                                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden group border border-slate-200 dark:border-slate-700">
                                              <img src={img} alt={`${label} Preview ${i}`} className="w-full h-full object-cover" />
                                              <button
                                                type="button"
                                                onClick={() => removeTierImage(type, i)}
                                                className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <div className="flex gap-2">
                                        <label className={`flex-1 cursor-pointer bg-purple-50/50 hover:bg-purple-100/50 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-2 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                          <Plus className="w-4 h-4 text-purple-500 mb-0.5" />
                                          <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">{isUploading ? 'Uploading...' : 'Upload Room Photos'}</span>
                                          <input type="file" multiple accept="image/*" onChange={(e) => handleTierFileUpload(e, type)} disabled={isUploading} className="hidden" />
                                        </label>
                                        <label className={`flex-1 cursor-pointer bg-purple-50/50 hover:bg-purple-100/50 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-2 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                          <Camera className="w-4 h-4 text-purple-500 mb-0.5" />
                                          <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">Camera</span>
                                          <input type="file" accept="image/*" capture="environment" onChange={(e) => handleTierFileUpload(e, type)} disabled={isUploading} className="hidden" />
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Hostel Warden & Curfew */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-200 dark:border-purple-800/60">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Hostel Warden Phone</label>
                            <input
                              type="text"
                              value={hostelConfig?.warden_phone || ''}
                              onChange={(e) => setHostelConfig(prev => ({ ...prev, warden_phone: e.target.value }))}
                              placeholder="+91 98765 00001"
                              className="input-field py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Curfew Time</label>
                            <select
                              value={hostelConfig?.curfew_time || '22:00'}
                              onChange={(e) => setHostelConfig(prev => ({ ...prev, curfew_time: e.target.value as any }))}
                              className="input-field py-1 text-xs"
                            >
                              <option value="21:30">9:30 PM Curfew</option>
                              <option value="22:00">10:00 PM Curfew</option>
                              <option value="22:30">10:30 PM Curfew</option>
                              <option value="23:00">11:00 PM Curfew</option>
                              <option value="no_curfew">No Curfew</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. FLAT CATEGORY CONFIGURATION (Includes Rent & Security Deposit!) */}
                    {formData.property_type === 'flat' && (
                      <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800/60 pb-2">
                          <h5 className="font-bold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                            <span>🏠</span> Flat Rent, BHK Layout & Maintenance Details
                          </h5>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Rent, Deposit, BHK, Maintenance</span>
                        </div>

                        {/* Flat Rent & Deposit Input Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">Monthly Rent (₹) *</label>
                            <input
                              type="number" name="rent" required
                              value={formData.rent === '0' ? '' : formData.rent}
                              onChange={handleInputChange}
                              placeholder="e.g. 18000" className="input-field py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">Security Deposit (₹) *</label>
                            <input
                              type="number" name="deposit" required
                              value={formData.deposit === '0' ? '' : formData.deposit}
                              onChange={handleInputChange}
                              placeholder="e.g. 36000" className="input-field py-1.5 text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">BHK Layout</label>
                            <select
                              value={flatConfig?.bhk_type || '2bhk'}
                              onChange={(e) => setFlatConfig(prev => ({ ...prev, bhk_type: e.target.value as any }))}
                              className="input-field py-1 text-xs"
                            >
                              <option value="1rk">1 RK</option>
                              <option value="1bhk">1 BHK</option>
                              <option value="2bhk">2 BHK</option>
                              <option value="3bhk">3 BHK</option>
                              <option value="4bhk">4 BHK</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Furnishing Status</label>
                            <select
                              value={flatConfig?.furnishing || 'semi_furnished'}
                              onChange={(e) => setFlatConfig(prev => ({ ...prev, furnishing: e.target.value as any }))}
                              className="input-field py-1 text-xs"
                            >
                              <option value="fully_furnished">Fully Furnished</option>
                              <option value="semi_furnished">Semi Furnished</option>
                              <option value="unfurnished">Unfurnished</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Maintenance Charges (₹/mo)</label>
                            <div className="flex gap-2">
                              <select
                                value={flatConfig?.maintenance_type || 'extra'}
                                onChange={(e) => setFlatConfig(prev => ({ ...prev, maintenance_type: e.target.value as any }))}
                                className="input-field py-1 text-xs w-28"
                              >
                                <option value="included">Included</option>
                                <option value="extra">Extra</option>
                              </select>
                              {flatConfig?.maintenance_type === 'extra' && (
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  value={flatConfig?.maintenance_charges || 1500}
                                  onChange={(e) => setFlatConfig(prev => ({ ...prev, maintenance_charges: Number(e.target.value) || 0 }))}
                                  className="input-field py-1 text-xs flex-1"
                                />
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Tenant Preference</label>
                            <select
                              value={flatConfig?.tenant_preference || 'any'}
                              onChange={(e) => setFlatConfig(prev => ({ ...prev, tenant_preference: e.target.value as any }))}
                              className="input-field py-1 text-xs"
                            >
                              <option value="students">Students Only</option>
                              <option value="bachelor_boys">Bachelor Boys</option>
                              <option value="bachelor_girls">Bachelor Girls</option>
                              <option value="family">Family Preferred</option>
                              <option value="any">Any Tenant</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Parking Facility</label>
                            <select
                              value={flatConfig?.parking_type || 'covered_car_bike'}
                              onChange={(e) => setFlatConfig(prev => ({ ...prev, parking_type: e.target.value as any }))}
                              className="input-field py-1 text-xs"
                            >
                              <option value="covered_car_bike">Covered Car & Bike</option>
                              <option value="bike_only">Bike Only</option>
                              <option value="open">Open Space</option>
                              <option value="none">No Parking</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Floor Info</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="Floor"
                                value={flatConfig?.floor_number ?? 1}
                                onChange={(e) => setFlatConfig(prev => ({ ...prev, floor_number: Number(e.target.value) || 0 }))}
                                className="input-field py-1 text-xs"
                              />
                              <input
                                type="number"
                                placeholder="Total"
                                value={flatConfig?.total_floors ?? 1}
                                onChange={(e) => setFlatConfig(prev => ({ ...prev, total_floors: Number(e.target.value) || 0 }))}
                                className="input-field py-1 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Brokerage Settings */}
                    <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
                          <input
                            type="checkbox"
                            name="brokerage_applied"
                            checked={!!formData.brokerage_applied}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                brokerage_applied: e.target.checked
                              }))
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span>Brokerage Applied?</span>
                        </label>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Commission / Brokerage Fee</span>
                      </div>

                      {formData.brokerage_applied && (
                        <div className="pt-2 border-t border-purple-100 dark:border-purple-900/40">
                          <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">Brokerage Amount (₹) *</label>
                          <input
                            type="number"
                            name="brokerage_amount"
                            required={formData.brokerage_applied}
                            value={formData.brokerage_amount === '0' ? '' : formData.brokerage_amount}
                            onChange={handleInputChange}
                            placeholder="e.g. 5000"
                            className="input-field py-1.5 text-xs font-semibold"
                          />
                        </div>
                      )}
                    </div>

                    {/* Amenities Provided & Custom Amenity Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Amenities Provided</label>

                      {/* Add Custom Amenity Bar */}
                      <div className="flex flex-col sm:flex-row gap-2 mb-3">
                        <input
                          type="text"
                          value={customAmenityInput}
                          onChange={(e) => setCustomAmenityInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddCustomAmenity()
                            }
                          }}
                          placeholder="Add custom amenity (e.g. Gym, Power Backup)..."
                          className="input-field text-xs py-2 flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomAmenity}
                          className="btn-primary py-2 px-4 text-xs font-semibold shrink-0 flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Amenity
                        </button>
                      </div>

                      {/* Amenities Selection Chips / Tags */}
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(formData.amenities).map((key) => {
                          const isChecked = formData.amenities[key]
                          const isStandard = ['wifi', 'ac', 'laundry', 'water', 'electricity', 'cctv', 'security', 'parking', 'attached_bathroom', 'study_table', 'furnished'].includes(key)
                          return (
                            <div key={key} className="inline-flex items-center">
                              <button
                                type="button"
                                onClick={() => handleAmenityChange(key)}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border",
                                  isChecked
                                    ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                              >
                                <span className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", isChecked ? "bg-white text-brand-600 border-white" : "border-slate-400 dark:border-slate-500")}>
                                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                              </button>
                              {!isStandard && (
                                <button
                                  type="button"
                                  onClick={() => removeCustomAmenity(key)}
                                  className="ml-1 p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Remove Custom Amenity"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* PROPERTY IMAGES & VIDEO UPLOADS (ONLY FOR FLAT CATEGORY) */}
                    {formData.property_type === 'flat' && (
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">Property Images *</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                            {formData.images.map((img, i) => (
                              <div key={i} className="relative aspect-video rounded-lg overflow-hidden group">
                                <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(i)}
                                  className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <label className={`flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                              <Plus className="w-5 h-5 text-slate-400 mb-1" />
                              <span className="text-xs text-slate-500 font-medium">{isUploading ? 'Uploading...' : 'Upload'}</span>
                              <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                            </label>
                            <label className={`flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                              <Camera className="w-5 h-5 text-slate-400 mb-1" />
                              <span className="text-xs text-slate-500 font-medium">Camera</span>
                              <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">Property Video (Optional)</label>
                          {formData.video_url ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden group mb-2 border border-slate-200 dark:border-slate-700">
                              <video src={formData.video_url} controls className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, video_url: '' }))}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 w-full">
                              <label className={`cursor-pointer flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                <Plus className="w-6 h-6 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500 font-medium">{isUploading ? 'Uploading...' : 'Upload Video'}</span>
                                <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={isUploading} className="hidden" />
                              </label>
                              <label className={`cursor-pointer flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                <Camera className="w-6 h-6 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500 font-medium">{isUploading ? 'Uploading...' : 'Record Video'}</span>
                                <input type="file" accept="video/*" capture="environment" onChange={handleVideoUpload} disabled={isUploading} className="hidden" />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 2: LOCATION DETAILS */}
                {formStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm border-b pb-1">2. Location Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Address *</label>
                        <input
                          type="text" name="address" required value={formData.address} onChange={handleInputChange}
                          placeholder="e.g. Flat 12, Baner Road" className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">City</label>
                        <input
                          type="text" name="city" value={formData.city} onChange={handleInputChange}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Pincode *</label>
                        <input
                          type="text" name="pincode" required value={formData.pincode} onChange={handleInputChange}
                          placeholder="e.g. 411038" className="input-field"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GPS Coordinates</label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    latitude: pos.coords.latitude.toString(),
                                    longitude: pos.coords.longitude.toString(),
                                    google_maps_url: `https://www.google.com/maps/search/?api=1&query=${pos.coords.latitude},${pos.coords.longitude}`
                                  }))
                                },
                                (err) => alert('Unable to retrieve your location. Please ensure location permissions are granted.'),
                                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                              )
                            } else {
                              alert('Geolocation is not supported by your browser.')
                            }
                          }}
                          className="btn-secondary whitespace-nowrap text-xs"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Auto-Detect Location
                        </button>
                      </div>

                      {/* Free Google Maps Embed Preview */}
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 mt-2">
                        <iframe
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}&output=embed`}
                        ></iframe>
                        <div className="p-2 text-center text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                          Live Preview of Auto-Detected Coordinates
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Latitude (for OSM map)</label>
                        <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} className="input-field py-1 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Longitude (for OSM map)</label>
                        <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} className="input-field py-1 text-xs" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Direct Google Maps Link (Optional)</label>
                      <input
                        type="url" name="google_maps_url" value={formData.google_maps_url} onChange={handleInputChange}
                        placeholder="https://maps.app.goo.gl/..." className="input-field text-xs"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <button
                    type="button" disabled={formStep === 1}
                    onClick={(e) => { e.preventDefault(); setFormStep(1); }}
                    className="btn-secondary text-xs disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {formStep < 2 ? (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setFormStep(2); }}
                      className="btn-primary text-xs cursor-pointer"
                    >
                      Next Step (Location & GPS) ➔
                    </button>
                  ) : (
                    <button type="submit" className="btn-primary text-xs shadow-glow cursor-pointer">
                      {editingId ? '💾 Save Changes' : '🚀 Launch Listing'}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Owner Reschedule Modal */}
      <AnimatePresence>
        {rescheduleVisitId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRescheduleVisitId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-glass overflow-hidden z-10 p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-display font-bold">📅 Reschedule Tour Request</h3>
                <button onClick={() => setRescheduleVisitId(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault()
                const success = await updateVisit(rescheduleVisitId, {
                  visit_date: rescheduleDate,
                  time_slot: rescheduleTime,
                  day_label: 'Scheduled',
                  status: 'accepted' // Confirmed on reschedule
                })

                if (success) {
                  alert('Visit rescheduled and confirmed successfully!')
                  setRescheduleVisitId(null)
                  loadVisits()
                } else {
                  alert('Failed to reschedule. Please try again.')
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Select New Tour Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Select Time Slot *</label>
                  <select
                    value={rescheduleTime}
                    onChange={e => setRescheduleTime(e.target.value)}
                    className="input-field text-sm font-semibold"
                  >
                    {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t flex justify-end gap-2">
                  <button type="button" onClick={() => setRescheduleVisitId(null)} className="btn-secondary text-xs">Close</button>
                  <button type="submit" className="btn-primary text-xs shadow-glow">Reschedule & Confirm</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
