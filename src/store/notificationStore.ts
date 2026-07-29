import { create } from 'zustand'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  link?: string
}

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  init: () => void
  addNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  fetchServerNotifications: (userId: string) => Promise<void>
  subscribeToRealtime: (userId: string) => () => void
  reset: () => void
}

const defaultNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Welcome to CampusNest!',
    message: 'Complete your profile to get the best housing and mess recommendations.',
    type: 'info',
    read: false,
    createdAt: new Date().toISOString()
  }
]

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  init: () => {
    try {
      const saved = localStorage.getItem('flatsnfoods-notifications')
      if (saved) {
        const parsed = JSON.parse(saved)
        const cleaned = parsed.filter((n: any) => n.id !== 'n2' && n.id !== 'n3')
        set({ notifications: cleaned, unreadCount: cleaned.filter((n: any) => !n.read).length })
        localStorage.setItem('flatsnfoods-notifications', JSON.stringify(cleaned))
      } else {
        set({ notifications: defaultNotifications, unreadCount: defaultNotifications.filter(n => !n.read).length })
        localStorage.setItem('flatsnfoods-notifications', JSON.stringify(defaultNotifications))
      }
    } catch (e) {
      set({ notifications: defaultNotifications, unreadCount: defaultNotifications.filter(n => !n.read).length })
    }
  },
  addNotification: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString()
    }
    const updated = [newNotif, ...get().notifications]
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length })
    localStorage.setItem('flatsnfoods-notifications', JSON.stringify(updated))
  },
  markAsRead: (id) => {
    const updated = get().notifications.map(n => n.id === id ? { ...n, read: true } : n)
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length })
    localStorage.setItem('flatsnfoods-notifications', JSON.stringify(updated))
  },
  markAllAsRead: () => {
    const updated = get().notifications.map(n => ({ ...n, read: true }))
    set({ notifications: updated, unreadCount: 0 })
    localStorage.setItem('flatsnfoods-notifications', JSON.stringify(updated))
  },
  deleteNotification: (id: string) => {
    const updated = get().notifications.filter(n => n.id !== id)
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length })
    localStorage.setItem('flatsnfoods-notifications', JSON.stringify(updated))
  },
  clearAll: () => {
    set({ notifications: [], unreadCount: 0 })
    localStorage.setItem('flatsnfoods-notifications', JSON.stringify([]))
  },
  fetchServerNotifications: async (userId: string) => {
    // Local fallback - no backend notifications service initialized yet
    return Promise.resolve();
  },
  subscribeToRealtime: (userId: string) => {
    // Local fallback - no socket/realtime server subscription required for now
    return () => {}
  },
  reset: () => {
    set({ notifications: [], unreadCount: 0 })
    localStorage.removeItem('flatsnfoods-notifications')
  }
}))
