import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Utensils, QrCode, Users, MessageCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'

export default function MobileBottomNav() {
  const location = useLocation()
  const { profile } = useAuthStore()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const checkFooter = () => {
      // 1. Distance to bottom of document
      const windowHeight = window.innerHeight
      const scrollY = window.scrollY
      const totalHeight = document.documentElement.scrollHeight
      const distanceToBottom = totalHeight - (scrollY + windowHeight)

      // 2. Check if footer element is intersecting in viewport
      const footerEl = document.querySelector('footer')
      let footerIntersecting = false
      if (footerEl) {
        const rect = footerEl.getBoundingClientRect()
        // Hide if top of footer is within 80px of bottom of screen or above it
        if (rect.top <= windowHeight - 40) {
          footerIntersecting = true
        }
      }

      // 3. Check scrollable dashboard container if present
      const mainContainer = document.querySelector('main .overflow-y-auto')
      let containerNearBottom = false
      if (mainContainer) {
        const { scrollTop, scrollHeight, clientHeight } = mainContainer
        if (scrollHeight - (scrollTop + clientHeight) < 120) {
          containerNearBottom = true
        }
      }

      if (distanceToBottom < 160 || footerIntersecting || containerNearBottom) {
        setHidden(true)
      } else {
        setHidden(false)
      }
    }

    window.addEventListener('scroll', checkFooter, { passive: true })
    const mainContainer = document.querySelector('main .overflow-y-auto')
    if (mainContainer) {
      mainContainer.addEventListener('scroll', checkFooter, { passive: true })
    }

    checkFooter()

    return () => {
      window.removeEventListener('scroll', checkFooter)
      if (mainContainer) {
        mainContainer.removeEventListener('scroll', checkFooter)
      }
    }
  }, [location.pathname])

  // Hide on auth page and certain detail pages with their own sticky bottom bars
  if (
    location.pathname === '/auth' ||
    /^\/(properties|mess|community|roommates)\/[\w-]+(?:\/.*)?$/.test(location.pathname)
  ) {
    return null
  }

  const isStudent = profile?.role === 'student'

  const items: Array<{ id: string; label: string; path: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; match: (path: string) => boolean; isCenter?: boolean }> = [
    {
      id: 'properties',
      label: 'Property',
      path: '/properties',
      icon: Building2,
      match: (path: string) => path.startsWith('/properties'),
    },
    {
      id: 'mess',
      label: 'Mess',
      path: '/mess',
      icon: Utensils,
      match: (path: string) => path.startsWith('/mess'),
    },
    // ...(isStudent ? [{
    //   id: 'qr',
    //   label: 'QR Scan',
    //   path: '/dashboard/student/scan',
    //   icon: QrCode,
    //   isCenter: true,
    //   match: (path: string) => path.includes('/scan'),
    // }] : []),
    {
      id: 'roommates',
      label: 'Roommate',
      path: '/roommates',
      icon: Users,
      match: (path: string) => path.startsWith('/roommates'),
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      path: '/community',
      icon: MessageCircle,
      match: (path: string) => path.startsWith('/community'),
    },
  ]

  return (
    <motion.div 
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: hidden ? 90 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn("fixed bottom-0 left-0 right-0 z-50 md:hidden w-full", hidden && "pointer-events-none")}
    >
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] px-2 py-2 flex items-center justify-around w-full">
        {items.map((item) => {
          const isActive = item.match(location.pathname)
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <Link
                key={item.id}
                to={item.path}
                className="flex flex-col items-center group -mt-5"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform",
                    "bg-gradient-to-tr from-brand-600 via-rose-500 to-amber-500 border-4 border-white dark:border-slate-900 shadow-brand-500/30 group-hover:scale-105"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className={cn(
                  "text-[10px] font-bold mt-0.5 transition-colors",
                  isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-600 dark:text-slate-400"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.id}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 py-1 px-1 group"
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                isActive 
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-105" 
                  : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={cn(
                  "text-[10px] transition-colors mt-0.5 leading-tight font-medium",
                  isActive
                    ? "text-brand-600 dark:text-brand-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </motion.div>
  )
}
