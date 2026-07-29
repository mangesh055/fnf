import { create } from 'zustand'
import type { Profile, UserRole } from '../types'
import { gatewayFetch } from '../lib/apiGateway'

export interface User {
  id: string
  email: string
  role: string
  full_name?: string;
  phone?: string;
}

export interface Session {
  access_token: string
  user: User
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signUp: (email: string, password: string, role: UserRole, name: string, phone: string) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: (credential: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false,

    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),

    signUp: async (email, password, role, name, phone) => {
      set({ loading: true })
      const res = await gatewayFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role, name, phone })
      })

      if (res.success && res.data) {
        const { user, token } = res.data;
        localStorage.setItem('campusnest_jwt_token', token)
        
        const mappedUser: User = {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          phone: user.phone
        }

        const mappedSession: Session = {
          access_token: token,
          user: mappedUser
        }

        const mappedProfile: Profile = {
          ...user,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString()
        }

        set({
          user: mappedUser,
          session: mappedSession,
          profile: mappedProfile,
          initialized: true,
          loading: false
        })
        return { success: true }
      } else {
        set({ loading: false })
        return { success: false, error: res.error || 'Registration failed' }
      }
    },

    signIn: async (email, password) => {
      set({ loading: true })
      const res = await gatewayFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      if (res.success && res.data) {
        const { user, token } = res.data;
        localStorage.setItem('campusnest_jwt_token', token)

        const mappedUser: User = {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          phone: user.phone
        }

        const mappedSession: Session = {
          access_token: token,
          user: mappedUser
        }

        const mappedProfile: Profile = {
          ...user,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString()
        }

        set({
          user: mappedUser,
          session: mappedSession,
          profile: mappedProfile,
          initialized: true,
          loading: false
        })
        return { success: true }
      } else {
        set({ loading: false })
        return { success: false, error: res.error || 'Invalid credentials' }
      }
    },

    signInWithGoogle: async (credential, role) => {
      set({ loading: true })
      const res = await gatewayFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential, role })
      })

      if (res.success && res.data) {
        const { token, profile: userProfile } = res.data;
        localStorage.setItem('campusnest_jwt_token', token)

        const mappedUser: User = {
          id: userProfile.id,
          email: userProfile.email,
          role: userProfile.role,
          full_name: userProfile.full_name,
          phone: userProfile.phone
        }

        const mappedSession: Session = {
          access_token: token,
          user: mappedUser
        }

        const mappedProfile: Profile = {
          ...userProfile,
          created_at: userProfile.created_at || new Date().toISOString(),
          updated_at: userProfile.updated_at || new Date().toISOString()
        }

        set({
          user: mappedUser,
          session: mappedSession,
          profile: mappedProfile,
          initialized: true,
          loading: false
        })
        return { success: true }
      } else {
        set({ loading: false })
        return { success: false, error: res.error || 'Google login failed' }
      }
    },

    fetchProfile: async (userId: string) => {
      try {
        const res = await gatewayFetch('/auth/me')
        if (res.success && res.data) {
          const user = res.data
          const mappedUser: User = {
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            phone: user.phone
          }

          const token = localStorage.getItem('campusnest_jwt_token') || ''
          const mappedSession: Session = {
            access_token: token,
            user: mappedUser
          }

          const mappedProfile: Profile = {
            ...user,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.updated_at || new Date().toISOString()
          }

          set({
            user: mappedUser,
            session: mappedSession,
            profile: mappedProfile,
            initialized: true,
            loading: false
          })
        } else {
          throw new Error(res.error || 'Failed to retrieve profile')
        }
      } catch (error) {
        console.warn('Error fetching profile from Gateway:', error)
        localStorage.removeItem('campusnest_jwt_token')
        set({ user: null, session: null, profile: null, initialized: true, loading: false })
      }
    },

    updateProfile: async (updates: Partial<Profile>) => {
      const currentProfile = get().profile
      if (!currentProfile) return { success: false, error: 'No profile logged in' }

      // Optimistically update store
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updated_at: new Date().toISOString()
      }
      set({ profile: updatedProfile })

      try {
        const res = await gatewayFetch('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(updates)
        })

        if (res.success && res.data) {
          const updatedUser = res.data
          const mappedProfile: Profile = {
            ...updatedUser,
            created_at: updatedUser.created_at || new Date().toISOString(),
            updated_at: updatedUser.updated_at || new Date().toISOString()
          }
          set({ profile: mappedProfile })
          return { success: true }
        } else {
          // Revert optimistic update
          set({ profile: currentProfile })
          return { success: false, error: res.error || 'Failed to update profile' }
        }
      } catch (err: any) {
        set({ profile: currentProfile })
        return { success: false, error: err.message || 'Failed to update profile' }
      }
    },

    signOut: async () => {
      localStorage.removeItem('campusnest_jwt_token')
      set({ user: null, session: null, profile: null, initialized: true, loading: false })
    },
  })
)
