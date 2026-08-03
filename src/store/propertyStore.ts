import { create } from 'zustand'
import type { Property } from '../types'
import { gatewayFetch } from '../lib/apiGateway'

interface PropertyState {
  properties: Property[]
  loading: boolean
  hasMore: boolean
  loadProperties: (params?: { page?: number; limit?: number; owner_id?: string; city?: string }, append?: boolean) => Promise<boolean>
  addProperty: (property: Omit<Property, 'id' | 'rating' | 'review_count' | 'verified' | 'created_at' | 'updated_at'>) => Promise<{success: boolean, error?: string}>
  updateProperty: (id: string, updates: Partial<Property>) => Promise<{success: boolean, error?: string}>
  incrementPropertyViews: (id: string) => Promise<void>
  updatePropertyRating: (id: string, rating: number, count: number) => Promise<void>
  toggleAvailability: (id: string) => void
  deleteProperty: (id: string) => void
}

export const usePropertyStore = create<PropertyState>()(
  (set, get) => ({
    properties: [],
    loading: false,
    hasMore: true,

    loadProperties: async (params = {}, append = false) => {
      set({ loading: true })
      const queryParts = []
      if (params.page) queryParts.push(`page=${params.page}`)
      if (params.limit) queryParts.push(`limit=${params.limit}`)
      if (params.owner_id) queryParts.push(`owner_id=${params.owner_id}`)
      if (params.city) queryParts.push(`city=${params.city}`)
      const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''

      const res = await gatewayFetch(`/properties${queryStr}`)
      if (res.success && Array.isArray(res.data)) {
        const newProps = res.data as Property[]
        const pagination = (res as any).pagination
        const total = pagination?.total ?? newProps.length

        let combined: Property[] = []
        if (append) {
          combined = [...get().properties]
          newProps.forEach(np => {
            if (!combined.some(ep => String(ep.id) === String(np.id))) {
              combined.push(np)
            }
          })
        } else {
          combined = newProps
        }

        const hasMore = combined.length < total
        set({ properties: combined, loading: false, hasMore })
        return hasMore
      } else {
        console.error('Failed to load properties from API Gateway:', res.error)
        set({ loading: false })
        return false
      }
    },

    addProperty: async (newProp) => {
      const tempId = `prop-${Date.now()}`
      const created: Property = {
        ...newProp,
        id: tempId,
        rating: 5.0,
        review_count: 0,
        views: 0,
        inquiries: 0,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Optimistic update
      set((state) => ({ properties: [created, ...state.properties] }))

      const res = await gatewayFetch('/properties', {
        method: 'POST',
        body: JSON.stringify(created)
      })

      if (res.success && res.data) {
        // Replace temp object with actual database saved object
        const savedProperty = res.data as Property
        set((state) => ({
          properties: state.properties.map(p => p.id === tempId ? savedProperty : p)
        }))
        return { success: true }
      } else {
        // Rollback optimistic update
        set((state) => ({ properties: state.properties.filter(p => p.id !== tempId) }))
        return { success: false, error: res.error || 'Failed to add property' }
      }
    },

    updateProperty: async (id, updates) => {
      const current = get().properties.find(p => String(p.id) === String(id))
      if (!current) return { success: false, error: 'Property not found' }

      const timestamp = new Date().toISOString()
      const updatedItem = { ...current, ...updates, updated_at: timestamp }

      // Optimistic update
      set((state) => ({
        properties: state.properties.map(p => String(p.id) === String(id) ? updatedItem : p)
      }))

      const res = await gatewayFetch(`/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      if (res.success && res.data) {
        const savedProperty = res.data as Property
        set((state) => ({
          properties: state.properties.map(p => String(p.id) === String(id) ? savedProperty : p)
        }))
        return { success: true }
      } else {
        // Rollback on failure
        set((state) => ({
          properties: state.properties.map(p => String(p.id) === String(id) ? current : p)
        }))
        return { success: false, error: res.error || 'Failed to update property' }
      }
    },

    incrementPropertyViews: async (id) => {
      // Views are tracked locally / in memory or via optional analytics endpoints
      set((state) => ({
        properties: state.properties.map(p => String(p.id) === String(id) ? { ...p, views: (p.views || 0) + 1 } : p)
      }))
    },

    updatePropertyRating: async (id, rating, count) => {
      set((state) => ({
        properties: state.properties.map(p => String(p.id) === String(id) ? { ...p, rating, review_count: count } : p)
      }))
    },

    toggleAvailability: async (id) => {
      const current = get().properties.find((item) => String(item.id) === String(id))
      if (!current) return
      const nextAvailability = !current.availability

      get().updateProperty(id, { availability: nextAvailability })
    },

    deleteProperty: async (id) => {
      const current = get().properties.find(p => String(p.id) === String(id))
      if (!current) return

      // Optimistic delete
      set((state) => ({
        properties: state.properties.filter(p => String(p.id) !== String(id))
      }))

      const res = await gatewayFetch(`/properties/${id}`, {
        method: 'DELETE'
      })

      if (!res.success) {
        console.error('Failed to delete property:', res.error)
        // Rollback optimistic delete
        set((state) => ({ properties: [current, ...state.properties] }))
      }
    }
  })
)
