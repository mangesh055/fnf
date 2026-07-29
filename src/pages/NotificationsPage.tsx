import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '../store/notificationStore'
import type { AppNotification } from '../store/notificationStore'
import toast from 'react-hot-toast'

// ── Swipeable notification row ──────────────────────────────
interface SwipeableRowProps {
  notif: AppNotification
  onDelete: (id: string) => void
  onMarkRead: (id: string) => void
  getIcon: (type: string) => React.ReactNode
  getTimeAgo: (d: string) => string
}

function SwipeableRow({ notif, onDelete, onMarkRead, getIcon, getTimeAgo }: SwipeableRowProps) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const startXRef = useRef(0)
  const THRESHOLD = 100 // px needed to trigger delete

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const delta = e.touches[0].clientX - startXRef.current
    // Only allow left-to-right swipe (positive delta)
    if (delta > 0) setDragX(delta)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (dragX >= THRESHOLD) {
      setDismissed(true)
      setTimeout(() => {
        onDelete(notif.id)
        toast.success('Notification deleted')
      }, 300)
    } else {
      setDragX(0)
    }
  }

  // Also support mouse drag for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX
    setIsDragging(true)
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const delta = e.clientX - startXRef.current
    if (delta > 0) setDragX(delta)
  }
  const handleMouseUp = () => {
    setIsDragging(false)
    if (dragX >= THRESHOLD) {
      setDismissed(true)
      setTimeout(() => {
        onDelete(notif.id)
        toast.success('Notification deleted')
      }, 300)
    } else {
      setDragX(0)
    }
  }

  const progress = Math.min(dragX / THRESHOLD, 1)
  const bgOpacity = progress

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          layout
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.25 }}
          className="relative overflow-hidden select-none"
        >
          {/* Red delete background revealed on swipe */}
          <div
            className="absolute inset-0 flex items-center pl-5 gap-2 bg-red-500 rounded-none"
            style={{ opacity: bgOpacity }}
          >
            <Trash2 className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-semibold">
              {progress >= 1 ? 'Release to delete' : 'Swipe to delete'}
            </span>
          </div>

          {/* Notification content — slides right on drag */}
          <div
            className={`relative flex gap-3 sm:gap-4 p-4 sm:p-5 cursor-pointer transition-colors
              ${notif.read
                ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                : 'bg-brand-50/60 dark:bg-brand-900/10 hover:bg-brand-50 dark:hover:bg-brand-900/20'
              }`}
            style={{
              transform: `translateX(${dragX}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.8,0.25,1)',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => {
              if (!notif.read && dragX === 0) {
                onMarkRead(notif.id)
                toast.success('Marked as read')
              }
            }}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notif.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <h3 className={`font-semibold text-sm sm:text-base leading-snug
                  ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                  {notif.title}
                </h3>
                <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap mt-0.5 shrink-0">
                  {getTimeAgo(notif.createdAt)}
                </span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed
                ${notif.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                {notif.message}
              </p>
            </div>

            {/* Unread dot */}
            {!notif.read && (
              <div className="flex-shrink-0 flex items-center">
                <div className="w-2 h-2 bg-brand-500 rounded-full shadow shadow-brand-500/50" />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main page ───────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate = useNavigate()
  const { notifications, unreadCount, init, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotificationStore()

  useEffect(() => { init() }, [init])

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'error':   return <XCircle className="w-5 h-5 text-red-500" />
      default:        return <Info className="w-5 h-5 text-brand-500" />
    }
  }

  const getTimeAgo = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
    toast.success('All notifications marked as read!')
  }

  const handleClearAll = () => {
    if (notifications.length === 0) return
    if (window.confirm('Delete all notifications? This cannot be undone.')) {
      clearAll()
      toast.success('All notifications cleared!')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 sm:p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 mt-1 sm:mt-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-brand-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Swipe right on a notification to delete it
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="btn-secondary py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 sm:flex-none"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Mark all read
            </button>
            <button
              onClick={handleClearAll}
              disabled={notifications.length === 0}
              className="p-2 sm:p-2.5 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 shrink-0"
              title="Delete all notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hint pill */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-600">
            <span className="inline-block w-6 h-0.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            Swipe right to delete a notification
            <span className="inline-block w-6 h-0.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notif) => (
                <SwipeableRow
                  key={notif.id}
                  notif={notif}
                  onDelete={deleteNotification}
                  onMarkRead={markAsRead}
                  getIcon={getIcon}
                  getTimeAgo={getTimeAgo}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-10 sm:p-14 text-center flex flex-col items-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">All caught up!</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-xs">
                You have no notifications right now. We'll let you know when something arrives.
              </p>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  )
}
