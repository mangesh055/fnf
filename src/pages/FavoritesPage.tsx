import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Building2, Utensils, ShoppingBag, Trash2 } from 'lucide-react'
import { useFavoriteStore } from '../store/favoriteStore'
import PropertyCard from '../components/property/PropertyCard'
import MessCard from '../components/mess/MessCard'
import { fetchProperties, fetchMesses, fetchCommunityPosts } from '../lib/platformData'
import type { Property, Mess, CommunityPost } from '../types'
import { useNavigate } from 'react-router-dom'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { favoriteProperties, favoriteMesses, favoritePosts, togglePostFavorite } = useFavoriteStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [messes, setMesses] = useState<Mess[]>([])
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'properties' | 'messes' | 'marketplace'>('properties')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, m, c] = await Promise.all([
          fetchProperties(),
          fetchMesses(),
          fetchCommunityPosts()
        ])
        setProperties(p)
        setMesses(m)
        setPosts(c)
      } catch (err) {
        console.error('Failed to load favorites', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const savedProps = properties.filter(p => (favoriteProperties || []).includes(p.id) && (!((p as any).is_student_request === true || p.profiles?.role === 'student') || p.verified === true))
  const savedMesses = messes.filter(m => (favoriteMesses || []).includes(m.id))
  const savedPosts = posts.filter(cp => (favoritePosts || []).includes(cp.id))

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center text-slate-500">
        Loading favorites...
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-surface-muted dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="w-8 h-8 text-brand-500" />
              Your Favorites
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Manage all your saved properties, mess services, and marketplace items in one place.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('properties')}
            className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'properties'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Properties ({savedProps.length})
          </button>
          <button
            onClick={() => setActiveTab('messes')}
            className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'messes'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Utensils className="w-4 h-4" />
            Messes ({savedMesses.length})
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'marketplace'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Marketplace ({savedPosts.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'properties' && (
          <div>
            {savedProps.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Heart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No properties saved yet</h3>
                <p className="text-slate-500">Explore properties and click the heart icon to save them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedProps.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'messes' && (
          <div>
            {savedMesses.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Heart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No messes saved yet</h3>
                <p className="text-slate-500">Explore mess services and click the heart icon to save them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedMesses.map(mess => (
                  <MessCard key={mess.id} mess={mess} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div>
            {savedPosts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Heart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No marketplace items saved yet</h3>
                <p className="text-slate-500">Explore marketplace listings and click the heart icon on any post to save it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPosts.map((post) => {
                  let textContent = post.content || ''
                  let location = (post as any).location || 'Campus Area'
                  let images: string[] = Array.isArray(post.images) ? post.images : []
                  try {
                    if (post.content && typeof post.content === 'string' && post.content.startsWith('{')) {
                      const parsed = JSON.parse(post.content)
                      if (parsed && typeof parsed === 'object') {
                        if (parsed.text !== undefined) textContent = parsed.text
                        location = parsed.location || location
                        if (Array.isArray(parsed.images) && parsed.images.length > 0) {
                          images = parsed.images
                        }
                      }
                    }
                  } catch (e) {}

                  const authorName = (post as any).profiles?.full_name || (post as any).full_name || 'Campus Student'
                  const postDate = post.created_at ? formatDate(post.created_at) : 'Recently'

                  return (
                    <motion.div
                      layout
                      key={post.id}
                      onClick={() => navigate(`/community/${post.id}`, { state: { post } })}
                      className="card p-4 border-slate-200 hover:border-slate-300 transition-all dark:border-slate-800 cursor-pointer hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
                          {images.length > 0 ? (
                            <img src={images[0]} alt={post.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ShoppingBag className="w-10 h-10 opacity-40" />
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePostFavorite(post.id)
                              toast.success('Removed from favorites')
                            }}
                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-md backdrop-blur-md flex items-center justify-center cursor-pointer"
                            title="Remove from favorites"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex justify-between items-start mb-2">
                          <span className="badge badge-orange text-[10px] px-2 py-0.5 font-semibold capitalize">
                            {post.category || 'General'}
                          </span>
                          <span className="text-[10px] text-slate-400">{postDate}</span>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 mb-1">{post.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{textContent}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-slate-500 font-medium truncate">{authorName}</span>
                          {post.price ? (
                            <span className="text-xs font-black text-brand-600 dark:text-brand-400">{formatCurrency(post.price)}</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-600">Free / Info</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePostFavorite(post.id)
                            toast.success('Removed from favorites')
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
