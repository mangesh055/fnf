import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, ShieldCheck, LogIn, UserPlus, Mail, Lock, User, Phone } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types'
import logoImg from '../assets/logo.jpeg'
import { fetchMesses, fetchProperties } from '../lib/platformData'
import { gatewayFetch } from '../lib/apiGateway'

const roles: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'student', label: 'Student', icon: '🎓', desc: 'Find PGs, messes & roommates near college' },
  { value: 'property_owner', label: 'Property Owner', icon: '🏠', desc: 'List your PGs, hostels & flats for free' },
  { value: 'mess_owner', label: 'Mess Owner', icon: '🍽️', desc: 'Manage meal plans & digital QR attendance' },
]

export default function AuthPage() {
  const { session, user, signIn, signUp, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin')
  const [selectedRole, setSelectedRole] = useState<UserRole>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDevFallback, setShowDevFallback] = useState(false)

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  const [stats, setStats] = useState({
    properties: '0+',
    messes: '0+',
    students: '0+',
    rating: '4.8'
  })

  // Load dynamic statistics from backend services
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [propertyRows, messRows] = await Promise.all([fetchProperties(), fetchMesses()])
        const propsCount = propertyRows?.length || 0
        const messesCount = messRows?.length || 0
        
        const countRes = await gatewayFetch('/auth/users/count') as any
        const studentsCount = countRes.success && typeof countRes.count === 'number' ? countRes.count : 0
        
        setStats({
          properties: `${propsCount}+`,
          messes: `${messesCount}+`,
          students: `${studentsCount}+`,
          rating: '4.8'
        })
      } catch (err) {
        console.error('Failed to load stats on AuthPage:', err)
      }
    }
    void loadStats()
  }, [])

  // Auto-redirect logged-in users away from /auth unless they sign out
  useEffect(() => {
    if (session || user) {
      navigate('/', { replace: true })
    }
  }, [session, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (activeTab === 'signin') {
        if (!email || !password) {
          setError('Email and password are required.')
          setLoading(false)
          return
        }
        const res = await signIn(email, password)
        if (!res.success) {
          setError(res.error || 'Invalid credentials.')
        }
      } else {
        if (!email || !password || !fullName || !phone) {
          setError('All fields are required for registration.')
          setLoading(false)
          return
        }
        const res = await signUp(email, password, selectedRole, fullName, phone)
        if (!res.success) {
          setError(res.error || 'Registration failed.')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  if (session || user) {
    return null
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-brand-950 via-slate-900 to-slate-950">
      {/* Left Panel - Branding & Highlights */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <Link to="/" className="flex items-center gap-3 mb-12">
            <img 
              src={logoImg} 
              alt="CampusNest Logo" 
              className="w-11 h-11 object-contain rounded-2xl shadow-glow" 
            />
            <span className="text-2xl font-display font-bold text-white">CampusNest</span>
          </Link>

          <h1 className="text-5xl font-display font-bold text-white leading-tight mb-4">
            Your perfect<br />
            <span className="gradient-text">student life</span><br />
            starts here
          </h1>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            Find PGs, hostels, flats & mess services near your college. 
            India's smartest zero-brokerage student housing platform.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🏠', label: `${stats.properties} Properties`, sub: 'PGs, Hostels & Flats' },
              { icon: '🍽️', label: `${stats.messes} Mess Services`, sub: 'Digital attendance' },
              { icon: '👥', label: `${stats.students} Students`, sub: 'Active community' },
              { icon: '⭐', label: `${stats.rating} Rating`, sub: 'Trusted platform' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all"
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-white font-semibold text-sm">{stat.label}</div>
                <div className="text-slate-400 text-xs">{stat.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Login/Registration form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
            
            {/* Top Navigation Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setError(''); }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'signin'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <AnimatePresence mode="wait">
                {activeTab === 'signin' ? (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-2 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                        Welcome Back
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Sign in with Google to access your properties, messes & community posts
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {/* Select Account Type */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
                        Select Account Type
                      </label>
                      <div className="flex gap-2">
                        {roles.map(role => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setSelectedRole(role.value)}
                            className={`flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center cursor-pointer ${
                              selectedRole === role.value
                                ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                            }`}
                          >
                            <span className="text-xl mb-1">{role.icon}</span>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">{role.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <p className="text-xs text-red-500 font-medium text-center">{error}</p>
              )}

              <div className="pt-2 flex justify-center w-full">
                <div className="w-full max-w-[280px] flex justify-center">
                  {loading ? (
                    <div className="py-2.5 px-6 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold rounded-full animate-pulse">
                      Signing in with Google...
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        if (credentialResponse.credential) {
                          setError('')
                          setLoading(true)
                          const res = await signInWithGoogle(
                            credentialResponse.credential,
                            activeTab === 'register' ? selectedRole : undefined,
                            activeTab
                          )
                          setLoading(false)
                          if (!res.success) {
                            setError(res.error || 'Google Authentication failed.')
                          }
                        }
                      }}
                      onError={() => {
                        setError('Google sign in failed. Please try again.')
                      }}
                      theme="filled_blue"
                      shape="pill"
                      size="large"
                    />
                  )}
                </div>
              </div>
            </form>

            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed px-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              By continuing, you agree to CampusNest's{' '}
              <Link to="/terms-conditions" className="underline hover:text-brand-500">Terms of Service</Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="underline hover:text-brand-500">Privacy Policy</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
