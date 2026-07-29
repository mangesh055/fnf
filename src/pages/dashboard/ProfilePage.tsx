import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Camera, Save, Shield, Calendar, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { getInitials } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { uploadToCloudinary } from '../../utils/cloudinary'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { profile, updateProfile, fetchProfile } = useAuthStore()
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    course: profile?.college || '',
    year: profile?.branch || '',
    bio: profile?.bio || '',
    address: profile?.address || ''
  })

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        course: profile.college || '',
        year: profile.branch || '',
        bio: profile.bio || '',
        address: profile.address || ''
      })
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    setStatusMsg({ type: '', text: '' })

    const cleanPhone = formData.phone.trim().replace(/\D/g, '')
    if (cleanPhone && (cleanPhone.length !== 10 || !['6', '7', '8', '9'].includes(cleanPhone.charAt(0)))) {
      setSaving(false)
      setStatusMsg({ type: 'error', text: 'Invalid number' })
      toast.error('Invalid number')
      return
    }

    const result = await updateProfile({
      full_name: formData.full_name,
      phone: formData.phone,
      college: formData.course,
      branch: formData.year,
      bio: formData.bio,
      address: formData.address
    })

    setSaving(false)
    if (result?.success) {
      setIsEditing(false)
      setStatusMsg({ type: 'success', text: '✓ Profile updated and saved to database successfully!' })
      toast.success('Profile updated successfully!')
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000)
    } else {
      setStatusMsg({ type: 'error', text: result?.error || 'Failed to save profile changes' })
      toast.error(result?.error || 'Failed to save profile changes')
    }
  }

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingAvatar(true)
    try {
      const publicUrl = await uploadToCloudinary(file)

      const result = await updateProfile({ avatar_url: publicUrl })
      if (result.success) {
        setStatusMsg({ type: 'success', text: 'Profile picture updated successfully!' })
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000)
      }
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: 'Failed to upload profile picture: ' + error.message })
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (!profile) return null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your personal information and public profile</p>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-2xl border text-sm font-medium flex items-center gap-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="relative mb-4 group inline-block">
              <div className="relative w-32 h-32 rounded-full shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-4xl font-bold">
                    {getInitials(profile.full_name || 'User')}
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 text-brand-500 hover:text-brand-600 hover:scale-110 transition-transform z-10"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                capture="user"
                className="hidden" 
              />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.full_name || 'User'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">{profile.email}</p>
            <span className="badge badge-purple uppercase tracking-wider text-xs px-3 py-1">
              {profile.role.replace('_', ' ')}
            </span>
            
            <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 text-sm text-left">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Shield className="w-4 h-4 text-emerald-500" /> Account Verified
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-brand-500" /> Joined June 2026
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Profile Details */}
        <div className="md:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h3>
              <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={saving}
                className={`btn-${isEditing ? 'primary' : 'secondary'} py-2 px-4 text-sm flex items-center gap-2`}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isEditing ? (
                  <><Save className="w-4 h-4" /> Save Changes</>
                ) : (
                  'Edit Profile'
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900 dark:text-white font-medium text-sm">{profile.full_name || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number</label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      className="input-field" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900 dark:text-white font-medium text-sm">{profile.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>

              {profile.role === 'student' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Course / Degree</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="input-field" 
                        value={formData.course}
                        onChange={e => setFormData({...formData, course: e.target.value})}
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900 dark:text-white font-medium text-sm">{profile.college || formData.course}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Year of Study / Branch</label>
                    {isEditing ? (
                      <input 
                        type="text"
                        className="input-field"
                        value={formData.year}
                        onChange={e => setFormData({...formData, year: e.target.value})}
                        placeholder="e.g. 3rd Year / CS"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900 dark:text-white font-medium text-sm">{profile.branch || formData.year}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Address</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-900 dark:text-white font-medium text-sm">{profile?.address || formData.address || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bio / About</label>
                {isEditing ? (
                  <textarea 
                    className="input-field min-h-[100px] resize-none" 
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us a little about yourself..."
                  />
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[100px]">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{profile.bio || formData.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
