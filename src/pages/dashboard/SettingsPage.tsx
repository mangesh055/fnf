import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, CreditCard, Save, Phone, Camera, X, GraduationCap, FileText, CheckCircle2, MapPin } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { uploadToCloudinary } from '../../utils/cloudinary'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { profile, user, fetchProfile, updateProfile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'preferences'>('profile')
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || user?.user_metadata?.full_name || '',
    phone: profile?.phone || user?.phone || user?.user_metadata?.phone || '',
    address: profile?.address || '',
    gender: profile?.gender || 'male',
    college: profile?.college || '',
    branch: profile?.branch || '',
    bio: profile?.bio || '',
    emergencyContact: '',
    dietaryPreference: 'none',
    emailNotifications: profile?.email_notifications ?? true,
    pushNotifications: profile?.push_notifications ?? false
  })

  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const cameraInputRef = React.useRef<HTMLInputElement>(null)

  // Fetch fresh profile from DB on mount
  useEffect(() => {
    if (user?.id) {
      void fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  // Sync form state when profile changes
  useEffect(() => {
    if (profile || user) {
      const meta = user?.user_metadata || {}
      setFormData(prev => ({
        ...prev,
        fullName: profile?.full_name || meta.full_name || prev.fullName,
        phone: profile?.phone || user?.phone || meta.phone || prev.phone,
        address: profile?.address || meta.address || prev.address || '',
        gender: profile?.gender || meta.gender || 'male',
        college: profile?.college || meta.college || prev.college || '',
        branch: profile?.branch || meta.branch || prev.branch || '',
        bio: profile?.bio || meta.bio || prev.bio || '',
        emailNotifications: profile?.email_notifications ?? prev.emailNotifications,
        pushNotifications: profile?.push_notifications ?? prev.pushNotifications
      }))
    }
  }, [profile, user])

  const handleSave = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (profile) {
        const rawDigits = formData.phone.trim().replace(/\D/g, '')
        const cleanPhone = rawDigits ? rawDigits.slice(-10) : ''
        
        if (rawDigits && (cleanPhone.length !== 10 || !['6', '7', '8', '9'].includes(cleanPhone.charAt(0)))) {
          throw new Error('Invalid number')
        }

        const result = await updateProfile({
          full_name: formData.fullName.trim(),
          phone: cleanPhone,
          address: formData.address.trim(),
          gender: formData.gender as any,
          college: formData.college.trim(),
          branch: formData.branch.trim(),
          bio: formData.bio.trim(),
          email_notifications: formData.emailNotifications,
          push_notifications: formData.pushNotifications,
        })

        if (!result.success) throw new Error(result.error || 'Failed to update profile')
        
        // Refresh profile state from Supabase DB
        await fetchProfile(profile.id)
      }

      setMessage({ type: 'success', text: 'Profile details saved and updated successfully!' })
      toast.success('Settings updated successfully!')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile.' })
      toast.error(error.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingAvatar(true)
    setMessage({ type: '', text: '' })
    
    try {
      const publicUrl = await uploadToCloudinary(file)

      const result = await updateProfile({
        avatar_url: publicUrl
      })

      if (!result.success) throw new Error(result.error || 'Failed to update profile picture')
      
      await fetchProfile(profile.id)
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' })
      toast.success('Profile picture updated!')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload profile picture.' })
      toast.error(error.message || 'Failed to upload profile picture')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!profile || !profile.avatar_url) return
    
    setUploadingAvatar(true)
    setMessage({ type: '', text: '' })
    
    try {
      const result = await updateProfile({
        avatar_url: ''
      })
      if (!result.success) throw new Error(result.error || 'Failed to remove profile picture')

      await fetchProfile(profile.id)
      setMessage({ type: 'success', text: 'Profile picture removed.' })
      toast.success('Profile picture removed')
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to remove profile picture.' })
      toast.error('Failed to remove profile picture')
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your profile details, security, and preferences</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <User className="w-4 h-4" /> Profile Info
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'notifications' ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          {profile?.role === 'student' && (
            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'preferences' ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Preferences
            </button>
          )}
        </div>

        {/* Form Content Area */}
        <div className="md:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm"
          >
            {message.text && (
              <div className={`p-4 mb-6 rounded-2xl text-sm font-bold flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200' 
                  : 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200'
              }`}>
                {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {/* TAB 1: PROFILE INFO */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative shrink-0">
                    {profile?.avatar_url ? (
                      <>
                        <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-800" />
                        <button 
                          onClick={handleDeleteAvatar}
                          disabled={uploadingAvatar}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                          title="Remove Avatar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                        {formData.fullName.charAt(0) || 'U'}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 bg-brand-500 text-white rounded-full p-1 shadow-md border-2 border-white dark:border-slate-900 hover:bg-brand-600 transition-colors cursor-pointer"
                      title="Upload Photo"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAvatarUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {uploadingAvatar ? 'Uploading...' : 'Change Profile Picture'}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">JPG or PNG image file</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Rahul Sharma"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Email (Read-Only) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Email Address (Verified)</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || profile?.email || ''}
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Gender Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Business / Property / Full Address Field */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      {profile?.role === 'mess_owner' ? 'Mess / Business Address' : profile?.role === 'property_owner' ? 'Property / Operating Address' : 'Address'}
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder={profile?.role === 'mess_owner' ? 'e.g. Plot 12, Kothrud, Pune' : 'e.g. Flat 302, Sunrise Heights, Kothrud, Pune'}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* College & Branch (Student only) */}
                  {profile?.role === 'student' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">College / Institution</label>
                        <input
                          type="text"
                          value={formData.college}
                          onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                          placeholder="VIT Pune / MIT World Peace University"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Branch / Specialization</label>
                        <input
                          type="text"
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                          placeholder="Computer Engineering / Business"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* About / Bio */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Short Bio / About Yourself</label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us a little bit about yourself..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Email Notifications</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Receive account updates and alerts via email.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.emailNotifications}
                      onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Push Notifications</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Receive real-time alerts in your browser.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.pushNotifications}
                      onChange={(e) => setFormData({ ...formData, pushNotifications: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: PREFERENCES (STUDENT) */}
            {activeTab === 'preferences' && profile?.role === 'student' && (
              <div className="space-y-6">
                <div className="space-y-2 max-w-md">
                  <label className="text-xs font-bold text-slate-400 uppercase">Dietary Preferences</label>
                  <select
                    value={formData.dietaryPreference}
                    onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="none">None / Standard</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="jain">Jain (No Root Vegetables)</option>
                    <option value="halal">Halal</option>
                  </select>
                </div>
                <div className="space-y-2 max-w-md">
                  <label className="text-xs font-bold text-slate-400 uppercase">Emergency Contact Number</label>
                  <input
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    placeholder="Parent / Guardian 10-digit Phone"
                    maxLength={10}
                  />
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-xs shadow-lg shadow-red-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
