import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Building2, Utensils, Users, MessageCircle, Bell,
  Heart, Search, Menu, X, Sun, Moon, ChevronDown, LogOut,
  Settings, User, LayoutDashboard, Shield, Star, QrCode
} from 'lucide-react'
import { cn, getInitials, computeMessStatus } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { supabase } from '../../lib/supabase'

import logoImg from '../../assets/logo.jpeg'

const navLinks = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Properties', path: '/properties', icon: Building2 },
  { label: 'Mess', path: '/mess', icon: Utensils },
  { label: 'Roommates', path: '/roommates', icon: Users },
  { label: 'Marketplace', path: '/community', icon: MessageCircle },
]

interface NavbarProps {
  darkMode: boolean
  toggleDarkMode: () => void
}

export default function Navbar({ darkMode, toggleDarkMode }: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const { unreadCount, init } = useNotificationStore()

  // Mess Status State (for Mess Owners only)
  const [myMess, setMyMess] = useState<any>(null)

  useEffect(() => {
    if (profile?.role === 'mess_owner') {
      const fetchMess = async () => {
        try {
          const { data } = await supabase.from('messes').select('*').eq('owner_id', profile.id).single()
          if (data) {
            setMyMess(data)
          }
        } catch (e) {
          console.warn('Failed to fetch mess profile for navbar', e)
        }
      }
      fetchMess()
    }
  }, [profile])

  const toggleMessStatus = async () => {
    if (!myMess || !profile) return
    const newStatus = myMess.status === 'open' ? 'closed' : 'open'
    const updated = { ...myMess, status: newStatus }
    setMyMess(updated)

    try {
      await supabase.from('messes').update({ status: newStatus }).eq('id', myMess.id)
    } catch (e) {
      console.warn('Failed to update status', e)
    }
  }

  // Auto-update mess status based on service hours (day & evening)
  useEffect(() => {
    if (!myMess) return

    const checkTimeAndUpdateStatus = async () => {
      try {
        const targetStatus = computeMessStatus(myMess.day_service_time, myMess.evening_service_time, myMess.service_hours)
        if (myMess.status !== targetStatus) {
          setMyMess((prev: any) => prev ? { ...prev, status: targetStatus } : prev)
          await supabase.from('messes').update({ status: targetStatus }).eq('id', myMess.id)
        }
      } catch (e) {
        console.warn('Auto status check failed', e)
      }
    }

    checkTimeAndUpdateStatus()
    const interval = setInterval(checkTimeAndUpdateStatus, 60000)
    return () => clearInterval(interval)
  }, [myMess?.id, myMess?.day_service_time, myMess?.evening_service_time, myMess?.service_hours, myMess?.status])

  useEffect(() => {
    init()
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      if (profileOpen) setProfileOpen(false)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [init, profileOpen])

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileOpen])

  useEffect(() => {
    setProfileOpen(false)
  }, [location])

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const getDashboardPath = () => {
    if (!profile) return '/auth'
    const paths: Record<string, string> = {
      student: '/dashboard/student',
      property_owner: '/dashboard/owner',
      mess_owner: '/dashboard/mess',
      admin: '/dashboard/admin',
    }
    return paths[profile.role] || '/dashboard/student'
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-md border-b border-slate-200/50 dark:border-slate-700/50'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group shrink-0">
            <img
              src={logoImg}
              alt="FlatsNFood Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl group-hover:scale-105 transition-transform"
            />
            <span className="text-base sm:text-xl font-display font-bold whitespace-nowrap">
              <span className="text-slate-900 dark:text-white">Flats</span>
              <span className="gradient-text">N</span>
              <span className="text-slate-900 dark:text-white">Food</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'nav-link text-sm hover:scale-105 active:scale-95 transition-transform duration-200',
                  location.pathname === path && 'active'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {profile ? (
              <>
                {/* Mess Status Toggle (Only for mess owners) */}
                {profile.role === 'mess_owner' && myMess && (
                  <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mr-1 sm:mr-2 items-center">
                    <button
                      onClick={() => { if (myMess.status !== 'open') toggleMessStatus() }}
                      className={cn(
                        'px-1.5 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-bold rounded-lg transition-all',
                        myMess.status === 'open'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      )}
                    >
                      OPEN
                    </button>
                    <button
                      onClick={() => { if (myMess.status === 'closed') return; toggleMessStatus() }}
                      className={cn(
                        'px-1.5 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-bold rounded-lg transition-all',
                        myMess.status === 'closed'
                          ? 'bg-white dark:bg-slate-700 text-red-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      )}
                    >
                      CLOSED
                    </button>
                  </div>
                )}

                {/* Notifications */}
                <Link to="/notifications" className="relative btn-ghost p-2 rounded-xl hover:scale-110 active:scale-95 transition-all duration-200 group">
                  <Bell className="w-4 h-4 group-hover:animate-bounce-subtle" />
                  {unreadCount > 0 && (
                    <span className="notif-dot text-[9px]">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </Link>

                {/* Favorites */}
                <Link to="/favorites" className="btn-ghost p-2 rounded-xl hidden sm:flex">
                  <Heart className="w-4 h-4" />
                </Link>


                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(profile.full_name || 'User')}
                      </div>
                    )}
                    <span className="text-sm font-medium hidden sm:block max-w-20 truncate text-slate-700 dark:text-slate-300">
                      {profile.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown className={cn('w-3 h-3 text-slate-500 transition-transform', profileOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-w-[calc(100vw-2rem)]"
                      >
                        <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{profile.full_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile.email}</p>
                          <span className="badge badge-purple mt-1 text-[10px]">
                            {profile.role.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="p-2 space-y-0.5">
                          {profile.role !== 'admin' && (
                            <Link to={getDashboardPath()} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                              <LayoutDashboard className="w-4 h-4 text-brand-500" /> Dashboard
                            </Link>
                          )}

                          {profile.role === 'property_owner' && (
                            <Link to="/dashboard/owner/add-property" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                              <Building2 className="w-4 h-4 text-brand-500" /> Add Property
                            </Link>
                          )}

                          <Link to="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                            <User className="w-4 h-4 text-brand-500" /> Profile
                          </Link>
                          {profile.role === 'student' && (
                            <Link to="/dashboard/student/add-property" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                              <Building2 className="w-4 h-4 text-brand-500" /> Property Post Request
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              toggleDarkMode()
                              setProfileOpen(false)
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                              <span>Theme Mode</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {darkMode ? 'Dark' : 'Light'}
                            </span>
                          </button>
                          {profile.role === 'admin' && (
                            <Link to="/dashboard/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                              <Shield className="w-4 h-4 text-brand-500" /> Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              setProfileOpen(false)
                              handleSignOut()
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 dark:text-red-400 transition-colors mt-1"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link to="/auth?tab=register" className="btn-primary text-xs sm:text-sm py-1.5 px-3 sm:py-2 sm:px-4 whitespace-nowrap">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </motion.header>
  )
}
