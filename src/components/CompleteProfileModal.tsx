import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mail, CheckCircle2, AlertCircle, GraduationCap, Building2, Utensils, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types'
//njsbdjbf

const roles: { value: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap, desc: 'Find PGs, messes & roommates' },
  { value: 'property_owner', label: 'Property Owner', icon: Building2, desc: 'List your PGs & hostels' },
  { value: 'mess_owner', label: 'Mess Owner', icon: Utensils, desc: 'Manage your mess service' },
]

export default function CompleteProfileModal() {
  const { profile, updateProfile, session } = useAuthStore()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [role, setRole] = useState<UserRole>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setGender(profile.gender || 'male')
      if (profile.role && profile.role !== 'admin') {
        setRole(profile.role)
      }
      if (profile.is_profile_completed) {
        setDismissed(true)
      }
    }
  }, [profile])

  // Only render modal if user is logged in AND profile is incomplete AND not dismissed locally
  const isIncomplete = session && profile && (!profile.phone || !profile.gender || profile.is_profile_completed === false)

  if (!isIncomplete || dismissed) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanPhone = phone.trim().replace(/\D/g, '')
    if (cleanPhone.length !== 10 || !['6', '7', '8', '9'].includes(cleanPhone.charAt(0))) {
      setError('Invalid number')
      return
    }

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }

    setLoading(true)

    try {
      // 1. Immediately dismiss modal locally
      setDismissed(true)

      // 2. Perform profile update
      const result = await updateProfile({
        full_name: fullName.trim(),
        phone: cleanPhone,
        gender,
        role: role === 'admin' ? 'student' : role,
        is_profile_completed: true,
      })

      if (!result.success) {
        setDismissed(false)
        throw new Error(result.error || 'Failed to save profile')
      }

      // 3. Store completion marker in localStorage
      if (profile?.id) {
        localStorage.setItem(`flatsnfood_completed_profile_${profile.id}`, 'true')
      }

      // 4. Redirect to homepage
      navigate('/', { replace: true })
    } catch (err: any) {
      setDismissed(false)
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="bg-white rounded-[28px] shadow-2xl border border-slate-200/80 w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden my-auto p-6 sm:p-7 text-slate-900"
        >
          {/* Form Header */}
          <div className="text-center shrink-0 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/25 mx-auto mb-3">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Complete Your Profile</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Enter your mobile number, gender, and role to activate your account.
            </p>
          </div>

          {/* Form Body - Scrollable */}
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-0.5 no-scrollbar">
            
            {/* FULL NAME */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                FULL NAME
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Sharma"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* VERIFIED GOOGLE EMAIL */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                VERIFIED GOOGLE EMAIL
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200/80 rounded-xl pl-10 pr-4 py-3 text-xs font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* MOBILE NUMBER * */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                MOBILE NUMBER <span className="text-red-500">*</span>
              </label>
              <div className="bg-slate-50 rounded-xl border-2 border-red-500/60 p-1 flex items-center shadow-xs focus-within:bg-white focus-within:border-red-500 transition-all">
                <div className="px-3 py-1 flex items-center gap-1.5 text-slate-500 font-mono font-bold text-sm border-r border-slate-300">
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter mobile number"
                  maxLength={10}
                  required
                  className="w-full bg-transparent text-slate-900 font-mono font-bold text-sm tracking-wider px-3 py-1 focus:outline-none"
                />
              </div>
            </div>

            {/* GENDER * */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                GENDER <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value as any)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      gender === g.value
                        ? 'border-2 border-red-500 bg-red-50 text-red-600 shadow-xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SELECTED PLATFORM ROLE * */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                SELECTED PLATFORM ROLE <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => {
                  const Icon = r.icon
                  const isSelected = role === r.value

                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-2 border-red-500 bg-red-50/80 text-slate-900 shadow-sm'
                          : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-extrabold block truncate text-slate-900">{r.label}</span>
                        <span className="text-[9px] text-slate-500 block truncate mt-0.5">{r.desc}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ERROR BANNER */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SUBMIT CTA BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm shadow-xl shadow-red-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Activating Profile...</span>
                ) : (
                  <>
                    <span>Complete & Activate Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
