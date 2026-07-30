import { supabase } from './supabase'
import type { CommunityPost, Mess, MessPlan, Property, Review, RoommateProfile } from '../types'
import { gatewayFetch } from './apiGateway'

const cache = {
  properties: null as Property[] | null,
  propertiesPromise: null as Promise<Property[]> | null,
  messes: null as Mess[] | null,
  messesPromise: null as Promise<Mess[]> | null,
  roommates: null as RoommateProfile[] | null,
  roommatesPromise: null as Promise<RoommateProfile[]> | null,
  posts: null as CommunityPost[] | null,
  postsPromise: null as Promise<CommunityPost[]> | null,
}

export function getCommunityCache(): CommunityPost[] {
  return cache.posts || []
}

export function invalidatePlatformCache() {
  cache.properties = null
  cache.propertiesPromise = null
  cache.messes = null
  cache.messesPromise = null
  cache.roommates = null
  cache.roommatesPromise = null
  cache.posts = null
  cache.postsPromise = null
}

export async function fetchProperties(forceRefresh = false) {
  if (forceRefresh) cache.propertiesPromise = null
  if (cache.properties && !forceRefresh) return cache.properties

  if (!cache.propertiesPromise) {
    cache.propertiesPromise = (async () => {
      const res = await gatewayFetch('/properties')
      if (res.success && Array.isArray(res.data)) {
        cache.properties = res.data as Property[]
      } else {
        cache.properties = []
      }
      return cache.properties
    })().catch((err: any) => {
      cache.propertiesPromise = null
      throw err
    })
  }
  return cache.propertiesPromise as Promise<Property[]>
}

export async function fetchMesses(forceRefresh = false) {
  if (forceRefresh) cache.messesPromise = null
  if (cache.messes && !forceRefresh) return cache.messes

  if (!cache.messesPromise) {
    cache.messesPromise = (async () => {
      const res = await gatewayFetch('/messes')
      if (res.success && Array.isArray(res.data)) {
        cache.messes = res.data as Mess[]
      } else {
        cache.messes = []
      }
      return cache.messes
    })().catch((err: any) => {
      cache.messesPromise = null
      throw err
    })
  }
  return cache.messesPromise as Promise<Mess[]>
}

export async function fetchRoommateProfiles(forceRefresh = false) {
  if (forceRefresh) cache.roommatesPromise = null
  if (cache.roommates && !forceRefresh) return cache.roommates

  if (!cache.roommatesPromise) {
    cache.roommatesPromise = (async () => {
      const res = await gatewayFetch('/community/roommates')
      if (res.success && Array.isArray(res.data)) {
        cache.roommates = res.data as RoommateProfile[]
      } else {
        cache.roommates = []
      }
      return cache.roommates
    })().catch((err: any) => {
      cache.roommatesPromise = null
      throw err
    })
  }
  return cache.roommatesPromise as Promise<RoommateProfile[]>
}

export async function fetchCommunityPosts(forceRefresh = false) {
  if (forceRefresh) cache.postsPromise = null
  if (cache.posts && cache.posts.length > 0 && !forceRefresh) return cache.posts

  if (!cache.postsPromise) {
    cache.postsPromise = (async () => {
      const res = await gatewayFetch('/community/posts')
      if (res.success && Array.isArray(res.data)) {
        cache.posts = res.data as CommunityPost[]
      } else {
        cache.posts = []
      }
      return cache.posts
    })().catch((err: any) => {
      cache.postsPromise = null
      cache.posts = []
      console.error('Failed to fetch community posts:', err)
      return []
    }) as Promise<CommunityPost[]>
  }
  return cache.postsPromise as Promise<CommunityPost[]>
}

export async function fetchMessPlans(messId: string) {
  const { data, error } = await supabase
    .from('mess_plans')
    .select('*')
    .eq('mess_id', messId)
    .order('created_at', { ascending: true })

  if (error) return []
  return (data || []) as MessPlan[]
}

export async function fetchReviews(options: { propertyId?: string; messId?: string }) {
  const params = new URLSearchParams()
  if (options.propertyId) params.append('propertyId', options.propertyId)
  if (options.messId) params.append('messId', options.messId)

  const res = await gatewayFetch<Review[]>(`/properties/reviews?${params.toString()}`)
  if (res.success && Array.isArray(res.data)) {
    return res.data
  }
  return []
}

export async function fetchCommunityComments(postId?: string) {
  let query = supabase.from('community_comments').select('*').order('created_at', { ascending: true })

  if (postId) {
    query = query.eq('post_id', postId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}
