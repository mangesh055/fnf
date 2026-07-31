import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Check, MapPin, Camera, Clock, CheckCircle, Building2, Pencil, Trash2, ArrowLeft, ToggleLeft, ToggleRight, Video } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { uploadToCloudinary } from '../utils/cloudinary'
import type { PropertyType, RoomSharingConfig, FlatConfig, HostelConfig } from '../types'
import { gatewayFetch } from '../lib/apiGateway'
//fs
export default function StudentPropertyRequestView() {
  const { profile } = useAuthStore()
  const [formStep, setFormStep] = useState<1 | 2>(1)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'form' | 'logs'>('logs')
  const [requests, setRequests] = useState<any[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null)
  const [customAmenityInput, setCustomAmenityInput] = useState('')

  const fetchRequests = async () => {
    if (!profile?.id) return
    setIsLoadingRequests(true)
    const res = await gatewayFetch(`/properties?owner_id=${profile.id}`)
    if (res.success && Array.isArray(res.data)) {
      setRequests(res.data)
    } else {
      setRequests([])
    }
    setIsLoadingRequests(false)
  }

  useEffect(() => {
    fetchRequests()
  }, [profile?.id])

  // Form State
  const initialFormState = {
    owner_name: profile?.full_name || '',
    contact_phone: profile?.phone || '',
    title: '',
    description: '',
    property_type: 'pg' as PropertyType,
    gender_preference: 'any' as 'male' | 'female' | 'any',
    rent: '7500',
    deposit: '15000',
    total_rooms: '10',
    available_rooms: '5',
    address: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '',
    latitude: '18.5204',
    longitude: '73.8567',
    google_maps_url: '',
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600'] as string[],
    video_url: '',
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
  }

  const [formData, setFormData] = useState(initialFormState)

  const [sharingConfigs, setSharingConfigs] = useState<RoomSharingConfig[]>([
    { sharing_type: '1_sharing', rent: 12000, deposit: 24000, available_beds: 2, total_beds: 4, attached_bathroom: true, ac: true, balcony: false, study_desk: true, personal_wardrobe: true },
    { sharing_type: '2_sharing', rent: 8000, deposit: 16000, available_beds: 4, total_beds: 8, attached_bathroom: true, ac: false, balcony: false, study_desk: true, personal_wardrobe: true },
    { sharing_type: '3_sharing', rent: 6000, deposit: 12000, available_beds: 6, total_beds: 12, attached_bathroom: false, ac: false, balcony: false, study_desk: true, personal_wardrobe: true },
  ])

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

  const [hostelConfig, setHostelConfig] = useState<HostelConfig>({
    category_configs: [
      { sharing_type: '2_sharing', rent: 8000, deposit: 16000, available_beds: 4, total_beds: 10, attached_bathroom: true, ac: true },
      { sharing_type: '3_sharing', rent: 7000, deposit: 14000, available_beds: 5, total_beds: 15, attached_bathroom: false, ac: false },
    ],
    warden_phone: profile?.phone || '+91 98765 00001',
    curfew_time: '21:30',
    mess_option: 'included',
    meals_offered: ['breakfast', 'lunch', 'dinner'],
  })

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

  const handleEditRequest = (req: any) => {
    setEditingRequestId(req.id)
    const existing = (req.amenities || {}) as Record<string, boolean>
    setFormData({
      owner_name: req.owner_name || profile?.full_name || '',
      contact_phone: req.contact_phone || profile?.phone || '',
      title: req.title || '',
      description: req.description || '',
      property_type: req.property_type || 'pg',
      gender_preference: req.gender_preference || 'any',
      rent: req.rent?.toString() || '7500',
      deposit: req.deposit?.toString() || '15000',
      total_rooms: req.total_rooms?.toString() || '10',
      available_rooms: req.available_rooms?.toString() || '5',
      address: req.address || '',
      city: req.city || 'Pune',
      state: req.state || 'Maharashtra',
      pincode: req.pincode || '',
      latitude: req.latitude?.toString() || '18.5204',
      longitude: req.longitude?.toString() || '73.8567',
      google_maps_url: req.google_maps_url || '',
      images: req.images && req.images.length > 0 ? req.images : ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600'],
      video_url: req.video_url || '',
      amenities: {
        wifi: !!existing.wifi,
        ac: !!existing.ac,
        laundry: !!existing.laundry,
        water: !!existing.water,
        electricity: !!existing.electricity,
        cctv: !!existing.cctv,
        security: !!existing.security,
        parking: !!existing.parking,
        attached_bathroom: !!existing.attached_bathroom,
        study_table: !!existing.study_table,
        furnished: !!existing.furnished,
        ...existing
      }
    })

    if (req.sharing_configs && req.sharing_configs.length > 0) {
      setSharingConfigs(req.sharing_configs)
    }
    if (req.flat_config) setFlatConfig(req.flat_config)
    if (req.hostel_config) setHostelConfig(req.hostel_config)

    setFormStep(1)
    setActiveTab('form')
  }

  const handleDeleteRequest = async (reqId: string, reqTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the property request for "${reqTitle}"?`)) return

    const res = await gatewayFetch(`/properties/${reqId}`, { method: 'DELETE' })
    if (!res.success) {
      alert('Failed to delete request: ' + (res.error || 'Server error'))
    } else {
      alert('Property request deleted successfully!')
      fetchRequests()
    }
  }

  const cancelEdit = () => {
    setEditingRequestId(null)
    setFormData(initialFormState)
    setFormStep(1)
    setActiveTab('logs')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile?.id) {
      alert('You must be logged in to submit a request.')
      return
    }

    const propertyData: any = {
      owner_name: formData.owner_name || profile?.full_name || 'Property Owner',
      contact_phone: formData.contact_phone || profile?.phone || '',
      title: formData.title || 'Cozy Room / Property',
      description: formData.description || 'Clean rooms with complete student amenities.',
      property_type: formData.property_type,
      rent: Number(formData.rent) || 6000,
      deposit: Number(formData.deposit) || 12000,
      address: formData.address || 'Kothrud, Pune',
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode || '411038',
      latitude: Number(formData.latitude) || 18.5204,
      longitude: Number(formData.longitude) || 73.8567,
      google_maps_url: formData.google_maps_url,
      gender_preference: formData.gender_preference,
      total_rooms: Number(formData.total_rooms) || 10,
      available_rooms: Number(formData.available_rooms) || 5,
      images: formData.images,
      video_url: formData.video_url,
      amenities: formData.amenities,
      sharing_configs: formData.property_type === 'pg' || formData.property_type === 'shared_room' || formData.property_type === 'private_room' ? sharingConfigs : [],
      flat_config: formData.property_type === 'flat' ? flatConfig : null,
      hostel_config: formData.property_type === 'hostel' ? hostelConfig : null,
      updated_at: new Date().toISOString()
    }

    if (editingRequestId) {
      // UPDATE Existing Request
      const res = await gatewayFetch(`/properties/${editingRequestId}`, {
        method: 'PUT',
        body: JSON.stringify(propertyData)
      })

      if (!res.success) {
        alert('Failed to update property request: ' + (res.error || 'Server error'))
        return
      }

      alert('Property listing request updated successfully!')
    } else {
      // CREATE New Request
      propertyData.id = 'prop-' + Date.now()
      propertyData.owner_id = profile.id
      propertyData.verified = false
      propertyData.rejected = false
      propertyData.is_student_request = true
      propertyData.availability = true
      propertyData.featured = false

      const res = await gatewayFetch('/properties', {
        method: 'POST',
        body: JSON.stringify(propertyData)
      })

      if (!res.success) {
        alert('Failed to submit property request: ' + (res.error || 'Server error'))
        return
      }

      alert('Property request submitted to admin for approval!')
    }

    setEditingRequestId(null)
    fetchRequests()
    setActiveTab('logs')

    // Reset Form
    setFormStep(1)
    setFormData(initialFormState)
  }

  return (
    <div className="card w-full max-w-4xl mx-auto flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden mt-2 sm:mt-6 shadow-xl">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <button
          onClick={() => {
            setEditingRequestId(null)
            setActiveTab('logs')
          }}
          className={`flex-1 py-3.5 px-2 sm:px-4 text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center ${activeTab === 'logs' ? 'text-brand-600 border-b-2 border-brand-500 bg-white dark:bg-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
        >
          My Requests History ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-3.5 px-2 sm:px-4 text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center ${activeTab === 'form' ? 'text-brand-600 border-b-2 border-brand-500 bg-white dark:bg-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {editingRequestId ? '✏️ Edit Request' : 'Submit New Request'}
        </button>
      </div>

      {activeTab === 'logs' ? (
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-white">Your Applied Property Requests</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage your property listing submissions and edit/delete anytime</p>
            </div>
            <button
              onClick={() => {
                setEditingRequestId(null)
                setFormData(initialFormState)
                setFormStep(1)
                setActiveTab('form')
              }}
              className="btn-primary text-xs py-2 px-4 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Add Request
            </button>
          </div>

          {isLoadingRequests ? (
            <div className="text-center py-12 text-slate-500 text-xs">Loading your property requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">You haven't submitted any property requests yet.</p>
              <button 
                onClick={() => {
                  setEditingRequestId(null)
                  setFormData(initialFormState)
                  setFormStep(1)
                  setActiveTab('form')
                }} 
                className="btn-primary mt-4 text-xs py-2 px-5"
              >
                Create Your First Request
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="flex flex-col sm:flex-row gap-4 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all relative group">
                  <div className="w-full sm:w-40 h-32 sm:h-28 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
                    {req.images && req.images.length > 0 ? (
                      <img src={req.images[0]} alt={req.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm sm:text-base">{req.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {req.address}, {req.city}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 flex items-center gap-1 w-fit ${
                          req.rejected
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : req.verified 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {req.rejected ? <X className="w-3 h-3" /> : req.verified ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {req.rejected ? 'Rejected by Admin' : req.verified ? 'Verified & Active' : 'Pending Approval'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
                        <span className="text-brand-600 dark:text-brand-400 font-extrabold text-xs sm:text-sm">₹{req.rent}/mo</span>
                        <span className="text-slate-300">•</span>
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] sm:text-xs">{req.property_type?.replace('_', ' ')}</span>
                      </div>

                      {/* Action Buttons: Edit & Delete */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditRequest(req)}
                          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(req.id, req.title)}
                          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-400 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900">
            <div>
              <div className="flex items-center gap-2">
                {editingRequestId && (
                  <button onClick={cancelEdit} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h3 className="text-base sm:text-xl font-display font-bold text-slate-900 dark:text-white">
                  {editingRequestId ? '✏️ Edit Property Request' : '🆕 Property Owner Listing Form'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingRequestId ? 'Update your property details for admin re-approval.' : 'Submit a detailed property listing request for admin approval.'}
              </p>
            </div>

            {/* Step Pills Header */}
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${formStep === 1 ? 'bg-brand-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                <span className="hidden sm:inline">1. Property Info & Tiers</span>
                <span className="sm:hidden">1. Property Info</span>
              </button>
              <button
                type="button"
                onClick={() => setFormStep(2)}
                className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${formStep === 2 ? 'bg-brand-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                <span className="hidden sm:inline">2. Location & GPS Coordinates</span>
                <span className="sm:hidden">2. Location & GPS</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden max-w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
            {formStep === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 sm:space-y-5">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm border-b pb-2">1. Basic Information, Host Contact & Category Configuration</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Owner / Host Name *</label>
                    <input
                      type="text"
                      name="owner_name"
                      required
                      value={formData.owner_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Ramesh Kumar"
                      className="input-field w-full min-w-0"
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
                      className="input-field font-mono w-full min-w-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Property Title / Name *</label>
                  <input
                    type="text" name="title" required value={formData.title} onChange={handleInputChange}
                    placeholder="e.g. Sunshine PG for Boys – Near MIT College" className="input-field w-full min-w-0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Description *</label>
                  <textarea
                    name="description" required rows={3} value={formData.description} onChange={handleInputChange}
                    placeholder="Detailed overview of PG layout, rules, and facilities..." className="input-field py-2 w-full min-w-0"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Property Category *</label>
                    <select name="property_type" value={formData.property_type} onChange={handleInputChange} className="input-field font-semibold text-brand-600 dark:text-brand-400 w-full max-w-full min-w-0 truncate cursor-pointer pr-8">
                      <option value="pg" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">PG (Paying Guest)</option>
                      <option value="flat" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Flat / Apartment</option>
                      <option value="hostel" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Hostel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Gender Preference</label>
                    <select name="gender_preference" value={formData.gender_preference} onChange={handleInputChange} className="input-field w-full max-w-full min-w-0 truncate cursor-pointer pr-8">
                      <option value="any" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Any (Co-ed)</option>
                      <option value="male" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Boys Only</option>
                      <option value="female" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Girls Only</option>
                    </select>
                  </div>
                </div>

                {/* 1. PG CATEGORY CONFIGURATION */}
                {(formData.property_type === 'pg' || formData.property_type === 'shared_room' || formData.property_type === 'private_room') && (
                  <div className="p-3.5 sm:p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-4 max-w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-200 dark:border-indigo-800/60 pb-2 gap-1">
                      <h5 className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <span>🛏️</span> Multi-Sharing Tiers & Pricing Configuration
                      </h5>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Configure Rent & Amenities per Sharing</span>
                    </div>

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
                                      type="number"
                                      value={config.rent || ''}
                                      placeholder="7000"
                                      onChange={(e) => {
                                        const val = Number(e.target.value) || 0
                                        setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, rent: val } : c))
                                      }}
                                      className="input-field py-1 text-xs font-semibold w-full min-w-0"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-500 font-medium">Deposit (₹/head)</label>
                                    <input
                                      type="number"
                                      value={config.deposit || ''}
                                      placeholder="14000"
                                      onChange={(e) => {
                                        const val = Number(e.target.value) || 0
                                        setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, deposit: val } : c))
                                      }}
                                      className="input-field py-1 text-xs font-semibold w-full min-w-0"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-500 font-medium">Avail. Beds</label>
                                    <input
                                      type="number"
                                      value={config.available_beds || ''}
                                      placeholder="3"
                                      onChange={(e) => {
                                        const val = Number(e.target.value) || 0
                                        setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, available_beds: val } : c))
                                      }}
                                      className="input-field py-1 text-xs font-semibold w-full min-w-0"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-500 font-medium">Total Beds</label>
                                    <input
                                      type="number"
                                      value={config.total_beds || ''}
                                      placeholder="6"
                                      onChange={(e) => {
                                        const val = Number(e.target.value) || 0
                                        setSharingConfigs(prev => prev.map(c => c.sharing_type === type ? { ...c, total_beds: val } : c))
                                      }}
                                      className="input-field py-1 text-xs font-semibold w-full min-w-0"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 2. FLAT CATEGORY CONFIGURATION */}
                {formData.property_type === 'flat' && (
                  <div className="p-3.5 sm:p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-4 max-w-full overflow-hidden">
                    <h5 className="font-bold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 border-b border-emerald-200 dark:border-emerald-800/60 pb-2">
                      <span>🏢</span> Apartment / Flat Specifications
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium">BHK Type</label>
                        <select
                          value={flatConfig.bhk_type}
                          onChange={(e) => setFlatConfig(prev => ({ ...prev, bhk_type: e.target.value as any }))}
                          className="input-field py-1 text-xs font-semibold w-full max-w-full min-w-0 truncate cursor-pointer"
                        >
                          <option value="1rk" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">1 RK</option>
                          <option value="1bhk" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">1 BHK</option>
                          <option value="2bhk" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">2 BHK</option>
                          <option value="3bhk" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">3 BHK</option>
                          <option value="4bhk" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">4+ BHK</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium">Furnishing</label>
                        <select
                          value={flatConfig.furnishing}
                          onChange={(e) => setFlatConfig(prev => ({ ...prev, furnishing: e.target.value as any }))}
                          className="input-field py-1 text-xs font-semibold w-full max-w-full min-w-0 truncate cursor-pointer"
                        >
                          <option value="fully_furnished" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Fully Furnished</option>
                          <option value="semi_furnished" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Semi Furnished</option>
                          <option value="unfurnished" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Unfurnished</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium">Maintenance (₹/mo)</label>
                        <input
                          type="number"
                          value={flatConfig.maintenance_charges}
                          onChange={(e) => setFlatConfig(prev => ({ ...prev, maintenance_charges: Number(e.target.value) || 0 }))}
                          className="input-field py-1 text-xs font-semibold w-full min-w-0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Base Pricing & Rooms */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1">Starting Rent (₹) *</label>
                    <input
                      type="number" name="rent" required value={formData.rent} onChange={handleInputChange}
                      placeholder="7500" className="input-field font-semibold w-full min-w-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1">Deposit (₹) *</label>
                    <input
                      type="number" name="deposit" required value={formData.deposit} onChange={handleInputChange}
                      placeholder="15000" className="input-field font-semibold w-full min-w-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1">Total Rooms</label>
                    <input
                      type="number" name="total_rooms" value={formData.total_rooms} onChange={handleInputChange}
                      className="input-field font-semibold w-full min-w-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1">Avail. Rooms</label>
                    <input
                      type="number" name="available_rooms" value={formData.available_rooms} onChange={handleInputChange}
                      className="input-field font-semibold w-full min-w-0"
                    />
                  </div>
                </div>

                {/* Media Uploads */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-500">Property Photos & Gallery</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700">
                        <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <label className={`flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-3 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                      <Plus className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[11px] sm:text-xs text-slate-500 font-medium">{isUploading ? 'Uploading...' : 'Upload Photos'}</span>
                      <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                    </label>
                    <label className={`flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-3 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Camera</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Property Walkthrough Video (Optional)</label>
                  {formData.video_url ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700">
                      <video src={formData.video_url} controls className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, video_url: '' }))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <label className={`cursor-pointer flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 flex flex-col items-center justify-center transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                        <Video className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-500 font-medium">{isUploading ? 'Uploading...' : 'Upload Video'}</span>
                        <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={isUploading} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {formStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 sm:space-y-5">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm border-b pb-2">2. Location Details, GPS Coordinates & Amenities</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Full Address / Landmark *</label>
                    <input
                      type="text" name="address" required value={formData.address} onChange={handleInputChange}
                      placeholder="e.g. Flat 302, Sunrise Heights, Kothrud" className="input-field w-full min-w-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">City</label>
                    <input
                      type="text" name="city" value={formData.city} onChange={handleInputChange}
                      className="input-field w-full min-w-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">City Pincode *</label>
                    <input
                      type="text" name="pincode" required value={formData.pincode} onChange={handleInputChange}
                      placeholder="e.g. 411038" className="input-field w-full min-w-0"
                    />
                  </div>
                </div>

                {/* Location Detection & Embed */}
                <div className="space-y-2 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GPS Coordinates</label>
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
                            () => alert('Unable to detect location. Please check browser permissions.'),
                            { enableHighAccuracy: true }
                          )
                        }
                      }}
                      className="btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
                    >
                      <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" /> Auto-Detect GPS Location
                    </button>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                    <iframe
                      width="100%"
                      height="180"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}&output=embed`}
                    ></iframe>
                    <div className="p-2 text-center text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 truncate px-2">
                      Live Preview ({formData.latitude}, {formData.longitude})
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Amenities & Facilities Provided</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.keys(formData.amenities).map((key) => {
                      const isChecked = formData.amenities[key]
                      return (
                        <button
                          key={key} type="button"
                          onClick={() => handleAmenityChange(key)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${isChecked ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'}`}
                        >
                          <span className="capitalize text-left truncate pr-1">{key.replace('_', ' ')}</span>
                          {isChecked ? <Check className="w-4 h-4 text-brand-500 shrink-0" /> : <Plus className="w-4 h-4 text-slate-300 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  {/* Add Custom Amenity */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={customAmenityInput}
                      onChange={(e) => setCustomAmenityInput(e.target.value)}
                      placeholder="Add custom amenity (e.g. Gym, Lift)"
                      className="input-field text-xs flex-1 min-w-0"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAmenity}
                      className="btn-secondary py-2 px-4 text-xs font-bold shrink-0 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Footer Submit Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 z-10 relative">
              <button
                type="button"
                disabled={formStep === 1}
                onClick={() => setFormStep(1)}
                className="btn-secondary text-xs disabled:opacity-50 cursor-pointer py-2.5 px-4"
              >
                Previous Step
              </button>

              {formStep === 1 ? (
                <button
                  type="button"
                  onClick={() => setFormStep(2)}
                  className="btn-primary text-xs cursor-pointer py-2.5 px-4 sm:px-5"
                >
                  Next: Location & Amenities →
                </button>
              ) : (
                <button type="submit" className="btn-primary text-xs shadow-glow py-2.5 px-5 sm:px-6 cursor-pointer">
                  {editingRequestId ? '💾 Save & Update Request' : '🚀 Submit Property Request'}
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  )
}
