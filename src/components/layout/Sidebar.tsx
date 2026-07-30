import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Home, Building2, Utensils, Users, MessageCircle, User,
  Bell, Heart, Search, Settings, BarChart2, QrCode, Calendar,
  CreditCard, FileText, Shield, LogOut, ChevronRight, Star, X, ShoppingBag
} from 'lucide-react'
import { cn, getInitials } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { useVisitStore } from '../../store/visitStore'

import logoImg from '../../assets/logo.jpeg'

const studentLinks = [
  { label: 'Request Property', path: '/dashboard/student/add-property', icon: Building2 },
  { label: 'My Visits', path: '/dashboard/student/visits', icon: Calendar },
  { label: 'Favorites', path: '/favorites', icon: Heart },
  { label: 'Reviews', path: '/dashboard/student/reviews', icon: Star },
  { label: 'Profile', path: '/dashboard/settings', icon: User },
]

const messOwnerLinks = [
  { label: 'Overview', path: '/dashboard/mess', icon: LayoutDashboard },
  { label: 'Menu Card Manager', path: '/dashboard/mess/menucard', icon: FileText },
  { label: 'Daily Menu Manager', path: '/dashboard/mess/menu', icon: Utensils },
  { label: 'Profile', path: '/dashboard/settings', icon: User },
]

const adminLinks = [
  { label: 'Overview', path: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Users', path: '/dashboard/admin/users', icon: Users },
  { label: 'Properties', path: '/dashboard/admin/properties', icon: Building2 },
  { label: 'Messes', path: '/dashboard/admin/messes', icon: Utensils },
  { label: 'Roommates', path: '/dashboard/admin/roommates', icon: Users },
  { label: 'Marketplace Posts', path: '/dashboard/admin/community', icon: ShoppingBag },
  { label: 'Analytics', path: '/dashboard/admin/analytics', icon: BarChart2 },
  { label: 'Profile', path: '/dashboard/settings', icon: User },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const visits = useVisitStore(state => state.visits)
  const pendingVisitsCount = visits.filter(v => v.status === 'pending').length

  const ownerLinks = [
    { label: 'Overview', path: '/dashboard/owner', icon: LayoutDashboard },
    { label: 'Visit Requests', path: '/dashboard/owner/visits', icon: Calendar, badge: pendingVisitsCount > 0 ? pendingVisitsCount : undefined },
    { label: 'My Listings', path: '/dashboard/owner/listings', icon: Building2 },
    { label: 'Profile', path: '/dashboard/settings', icon: User },
  ]

  const links = profile?.role === 'student' ? studentLinks
    : profile?.role === 'property_owner' ? ownerLinks
      : profile?.role === 'mess_owner' ? messOwnerLinks
        : adminLinks

  const roleLabel = profile?.role?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <aside className="w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img 
            src={logoImg} 
            alt="FlatsNFood Logo" 
            className="w-9 h-9 object-contain rounded-xl" 
          />
          <span className="text-lg font-display font-bold">
            <span className="text-slate-900 dark:text-white">Flats</span>
            <span className="gradient-text">N</span>
            <span className="text-slate-900 dark:text-white">Food</span>
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 -mr-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Summary */}
      {profile && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {getInitials(profile.full_name || 'User')}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider px-4 mb-2">Navigation</p>
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path

            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={cn('sidebar-item', isActive && 'active')}
                >
                  <link.icon className={cn('w-4 h-4', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400')} />
                  <span className="text-sm">{link.label}</span>
                  {(link as any).badge !== undefined && (
                    <span className="ml-auto bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                      {(link as any).badge}
                    </span>
                  )}
                  {isActive && (link as any).badge === undefined && (
                    <ChevronRight className="w-3 h-3 ml-auto text-brand-500" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Quick Links */}
        <div className="mt-6">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider px-4 mb-2">Quick Access</p>
          <ul className="space-y-1">
            <li>
              <Link to="/" className="sidebar-item text-sm">
                <Home className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Home</span>
              </Link>
            </li>
            <li>
              <Link to="/notifications" className="sidebar-item">
                <Bell className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Notifications</span>
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={signOut}
          className="w-full sidebar-item text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
