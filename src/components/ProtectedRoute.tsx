import React, { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Lock, KeyRound } from 'lucide-react'

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { profile, session, loading, initialized } = useAuthStore()

  const [adminVerified, setAdminVerified] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if admin is already verified in this session
    if (sessionStorage.getItem('admin_verified') === 'true') {
      setAdminVerified(true)
    }
  }, [])

  // Show loading only if not initialized AND actively loading
  // Once initialized (even with cached data), don't show loading spinner
  if (!initialized || (loading && !profile)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session || !profile) {
    return <Navigate to="/auth" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // MFA-like PIN verification for Admins
  if (allowedRoles?.includes('admin') && profile.role === 'admin' && !adminVerified) {
    const handleVerify = (e: React.FormEvent) => {
      e.preventDefault()
      // Use an environment variable or fallback to a secure default
      const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '7391' 
      
      if (pin === ADMIN_PIN) {
        sessionStorage.setItem('admin_verified', 'true')
        setAdminVerified(true)
      } else {
        setError('Incorrect PIN. Please try again.')
        setPin('')
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
            Admin Verification Required
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
            Please enter your administrative PIN to access the dashboard.
          </p>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Secure PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg tracking-widest text-center"
                  placeholder="••••"
                  maxLength={6}
                  autoFocus
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!pin}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Verify Access
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <Outlet />
}
