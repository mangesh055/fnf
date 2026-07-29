import { create } from 'zustand'
import { gatewayFetch } from '../lib/apiGateway'

export interface PropertyVisit {
  id: string
  property_id: string
  property_title: string
  property_image?: string
  owner_id: string
  student_id: string
  student_name: string
  student_phone: string
  visit_date: string // e.g. "Jul 24, 2026"
  day_label: string // e.g. "Tomorrow"
  time_slot: string // e.g. "11:00 AM"
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  created_at: string
}

interface VisitState {
  visits: PropertyVisit[]
  loading: boolean
  loadVisits: () => Promise<void>
  addVisit: (visit: Omit<PropertyVisit, 'id' | 'created_at' | 'status'>) => Promise<PropertyVisit>
  updateVisitStatus: (id: string, status: PropertyVisit['status']) => Promise<void>
  updateVisit: (id: string, updates: Partial<PropertyVisit>) => Promise<boolean>
  getVisitsForOwner: (ownerId: string, propertyIds?: string[]) => PropertyVisit[]
  getVisitsForStudent: (studentId: string) => PropertyVisit[]
}

export const useVisitStore = create<VisitState>()((set, get) => ({
  visits: [],
  loading: false,

  loadVisits: async () => {
    set({ loading: true })
    const res = await gatewayFetch('/visits')
    if (res.success && Array.isArray(res.data)) {
      const mappedData: PropertyVisit[] = res.data.map((item: any) => ({
        id: item.id,
        property_id: item.property_id || '',
        property_title: item.property_title || 'Property Visit',
        property_image: item.property_image || '',
        owner_id: item.owner_id || '',
        student_id: item.student_id || '',
        student_name: item.student_name || 'Student',
        student_phone: item.student_phone || '',
        visit_date: item.visit_date || '',
        day_label: item.day_label || 'Scheduled',
        time_slot: item.time_slot || '10:00 AM',
        status: item.status || 'pending',
        created_at: item.created_at || new Date().toISOString()
      }))
      set({ visits: mappedData, loading: false })
    } else {
      console.error('Failed to load visits from Gateway:', res.error)
      set({ visits: [], loading: false })
    }
  },

  addVisit: async (newVisitData) => {
    const tempId = `visit-${Date.now()}`
    const newVisit: PropertyVisit = {
      ...newVisitData,
      id: tempId,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    // Optimistic UI update
    set((state) => ({ visits: [newVisit, ...state.visits] }))

    const res = await gatewayFetch('/visits', {
      method: 'POST',
      body: JSON.stringify(newVisit)
    })

    if (res.success && res.data) {
      const saved = res.data as PropertyVisit
      set((state) => ({
        visits: state.visits.map(v => v.id === tempId ? saved : v)
      }))
      return saved
    } else {
      console.error('Failed to save visit:', res.error)
      return newVisit
    }
  },

  updateVisitStatus: async (id, status) => {
    const current = get().visits.find(v => v.id === id)
    if (!current) return

    // Optimistic UI update
    set((state) => ({
      visits: state.visits.map((v) => (v.id === id ? { ...v, status } : v)),
    }))

    const res = await gatewayFetch(`/visits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })

    if (!res.success) {
      console.error('Failed to update visit status on Gateway:', res.error)
      // Rollback
      set((state) => ({
        visits: state.visits.map((v) => (v.id === id ? current : v)),
      }))
    }
  },

  updateVisit: async (id, updates) => {
    const current = get().visits.find(v => v.id === id)
    if (!current) return false

    // Optimistic UI update
    set((state) => ({
      visits: state.visits.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    }))

    const res = await gatewayFetch(`/visits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })

    if (!res.success) {
      console.error('Failed to update visit on Gateway:', res.error)
      // Rollback
      set((state) => ({
        visits: state.visits.map((v) => (v.id === id ? current : v)),
      }))
      return false
    }
    return true
  },

  getVisitsForOwner: (ownerId, propertyIds = []) => {
    const state = get()
    const propIdSet = new Set(propertyIds)
    return state.visits.filter((v) =>
      (ownerId && v.owner_id === ownerId) ||
      (v.property_id && propIdSet.has(v.property_id))
    )
  },

  getVisitsForStudent: (studentId) => {
    const state = get()
    return state.visits.filter((v) => studentId && v.student_id === studentId)
  },
}))
