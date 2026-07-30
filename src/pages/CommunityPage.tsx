import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Search, Plus, MapPin, X, Pencil, ArrowRight, ShieldAlert, BadgeCheck, MessageSquare, BookOpen, Notebook, Bike, Music, Speaker, Check, Upload, Video, HelpCircle, Calendar, Megaphone, Send, Share2, ThumbsUp, Heart, ShoppingBag, Camera, Phone, ChevronDown, Laptop, Tag } from 'lucide-react'
import { uploadToCloudinary } from '../utils/cloudinary'
import { useAuthStore } from '../store/authStore'
import { useNavigate, useLocation } from 'react-router-dom'
import type { CommunityPost } from '../types'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import { fetchCommunityComments, fetchCommunityPosts, getCommunityCache, invalidatePlatformCache } from '../lib/platformData'
import { supabase } from '../lib/supabase'
import { gatewayFetch } from '../lib/apiGateway'
import { usePersistedForm } from '../hooks/usePersistedForm'

const categoryConfig = {
  all: { label: 'All Board', icon: HelpCircle, color: 'text-slate-500 bg-slate-100' },
  notes: { label: 'Study Notes', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20' },
  books: { label: 'Textbooks', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20' },
  cycles: { label: 'Bicycles', icon: Bike, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20' },
  bikes: { label: 'Motorbikes', icon: Bike, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20' },
  electronics: { label: 'Electronics & Accessories', icon: Laptop, color: 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/20' },
  custom: { label: 'Other / Custom', icon: Tag, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20' },
  general: { label: 'General', icon: HelpCircle, color: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800' }
}

export default function CommunityPage() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // State initialized from instant cache to prevent white screens or delay on navigate back
  const [posts, setPosts] = useState<any[]>(() => getCommunityCache())
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [showAllPosts, setShowAllPosts] = useState(false)
  const [isEditingPostId, setIsEditingPostId] = useState<string | null>(null)

  // Category Dropdown Menu State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCategoryDropdownOpen])

  // Form State — persisted in sessionStorage so camera round-trips don't wipe it
  const COMMUNITY_FORM_KEY = `community_form_${profile?.id || 'guest'}`
  const { form, setForm, clearPersistedForm } = usePersistedForm(COMMUNITY_FORM_KEY, {
    title: '',
    content: '',
    category: 'general' as keyof typeof categoryConfig,
    custom_category: '',
    price: '',
    phone: '',
    phone_code: '+91',
    location: '',
    images: [] as string[],
    video_url: ''
  })
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, images: [...prev.images, reader.result as string].slice(0, 3) }))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingVideo(true)
    try {
      const url = await uploadToCloudinary(file)
      setForm(prev => ({ ...prev, video_url: url }))
    } catch (error: any) {
      alert('Failed to upload video: ' + error.message)
    } finally {
      setIsUploadingVideo(false)
    }
  }

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [showModal])

  // Automatically pre-fill phone field from user profile when creating a new marketplace post
  useEffect(() => {
    if (profile && !isEditingPostId) {
      setForm(prev => ({
        ...prev,
        phone: profile.phone || prev.phone
      }))
    }
  }, [profile, isEditingPostId])

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const postRows = await fetchCommunityPosts()
        if (isMounted && postRows) {
          const merged = postRows.map((post: any) => ({
            ...post,
            profiles: { id: post.author_id, full_name: post.full_name || 'Campus Student', email: post.email }
          }))
          setPosts(merged)
        }
      } catch (error) {
        console.error('Failed to load community data:', error)
      }
    }

    load()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (posts && posts.length > 0 && location.state?.editPostId) {
      const editPostId = location.state.editPostId;
      const post = posts.find((p: any) => String(p.id) === String(editPostId));
      if (post) {
        // Parse content
        let textContent = post.content;
        let phoneNo = '';
        let locationVal = '';
        let images: string[] = post.images || [];
        let video_url = '';
        let customCategoryName = '';
        
        try {
          const parsed = JSON.parse(post.content);
          if (parsed.text !== undefined) {
            textContent = parsed.text;
            phoneNo = parsed.phone || '';
            locationVal = parsed.location || '';
            if (parsed.images && parsed.images.length > 0) {
              images = parsed.images;
            }
            if (parsed.video_url) {
              video_url = parsed.video_url;
            }
            customCategoryName = parsed.custom_category || '';
          }
        } catch (e) {}

        let phoneNoCode = phoneNo;
        let phoneCode = '+91';
        const validCodes = ['+91', '+1', '+44', '+61', '+971'];
        for (const c of validCodes) {
          if (phoneNo.startsWith(c)) {
            phoneCode = c;
            phoneNoCode = phoneNo.slice(c.length);
            break;
          }
        }

        setForm({
          title: post.title,
          content: textContent,
          category: post.category as any,
          custom_category: customCategoryName,
          price: post.price ? post.price.toString() : '',
          phone: phoneNoCode,
          phone_code: phoneCode,
          location: locationVal,
          images: images,
          video_url: video_url
        });
        setIsEditingPostId(post.id);
        setShowModal(true);

        // Clear location state to prevent repeating the modal pop
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [posts, location.state]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) {
      navigate('/auth')
      return
    }

    const contentObj = JSON.stringify({
      text: form.content,
      phone: `${form.phone_code}${form.phone}`,
      location: form.location,
      images: form.images,
      video_url: form.video_url,
      custom_category: form.category === 'custom' ? form.custom_category : undefined
    })

    const parsedPrice = form.price.trim() !== '' && !isNaN(Number(form.price)) && Number(form.price) >= 0 ? Number(form.price) : null

    if (isEditingPostId) {
      void (async () => {
        const res = await gatewayFetch(`/community/posts/${isEditingPostId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: form.title,
            content: contentObj,
            category: form.category,
            price: parsedPrice,
          })
        })
        const error = res.success ? null : { message: res.error }
        if (error) {
          console.error('Failed to update community post in Gateway:', error)
          alert(`Failed to update post: ${error.message || 'Unknown backend error'}`)
          return
        }

        setPosts(prev => prev.map(p => p.id === isEditingPostId ? {
          ...p,
          title: form.title,
          content: contentObj,
          category: form.category,
          price: parsedPrice !== null ? parsedPrice : undefined,
        } : p))
        
        invalidatePlatformCache()
        alert('Your changes are saved!')
        setShowModal(false)
        setIsEditingPostId(null)
        clearPersistedForm()
        setForm({ title: '', content: '', category: 'general', custom_category: '', price: '', phone: '', phone_code: '+91', location: '', images: [], video_url: '' })
      })()
      return
    }

    const newPost = {
      id: `post-${Date.now()}`,
      author_id: profile.id,
      title: form.title,
      content: contentObj,
      category: form.category as any,
      price: parsedPrice,
      likes: 0,
      comment_count: 0,
      created_at: new Date().toISOString(),
      full_name: profile.full_name,
      email: profile.email,
    }

    void (async () => {
      const res = await gatewayFetch('/community/posts', {
        method: 'POST',
        body: JSON.stringify(newPost)
      })
      const error = res.success ? null : { message: res.error }
      if (error) {
        console.error('Failed to save community post to Gateway:', error)
        alert(`Failed to publish post: ${error.message || 'Unknown backend error. Did you restart the server?'}`)
        return
      }

      setPosts(prev => [{ ...newPost, profiles: profile }, ...prev])
      invalidatePlatformCache()
      setShowModal(false)
      clearPersistedForm()
      setForm({ title: '', content: '', category: 'general', custom_category: '', price: '', phone: '', phone_code: '+91', location: '', images: [], video_url: '' })
    })()
  }

  const handleDeletePost = (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    void (async () => {
      const res = await gatewayFetch(`/community/posts/${postId}`, {
        method: 'DELETE'
      })
      const error = res.success ? null : { message: res.error }
      if (error) {
        console.error('Failed to delete community post:', error)
        return
      }
      setPosts(prev => prev.filter(p => p.id !== postId))
      invalidatePlatformCache()
    })()
  }

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if ((post as any).rejected === true) return false
    if (selectedCategory !== 'all' && post.category !== selectedCategory) return false

    if (search) {
      const q = search.toLowerCase()
      const matchesTitle = post.title.toLowerCase().includes(q)
      const matchesContent = post.content.toLowerCase().includes(q)
      const matchesAuthor = post.profiles?.full_name?.toLowerCase().includes(q)
      if (!matchesTitle && !matchesContent && !matchesAuthor) return false
    }

    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-5 px-4 sm:py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center relative z-10 gap-3 sm:gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-display font-bold leading-tight">Campus Marketplace</h1>
            <p className="text-slate-300 mt-1 text-xs sm:text-sm md:text-base">
              Buy/sell books, check notices, find local events, and connect with other students.
            </p>
          </div>
          <button onClick={() => { if (!profile) navigate('/auth'); else setShowModal(true) }} className="btn-primary inline-flex items-center justify-center gap-2 text-xs sm:text-sm py-2 px-4 sm:py-2.5 sm:px-5 shrink-0 w-fit">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Sell Item
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Mobile Search & Category Dropdown Menu (< lg) */}
        <div className="lg:hidden">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes, cycles, events..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-sm"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown Menu */}
            <div className="relative shrink-0" ref={categoryDropdownRef}>
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Filter className="w-3.5 h-3.5 text-brand-500" />
                <span className="max-w-[85px] sm:max-w-[130px] truncate">
                  {categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label || 'All Board'}
                </span>
                <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200', isCategoryDropdownOpen && 'rotate-180')} />
              </button>

              {/* Dropdown Menu Popup */}
              <AnimatePresence>
                {isCategoryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-1.5 space-y-0.5"
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Filter by Category
                    </div>
                    {Object.entries(categoryConfig).map(([key, value]) => {
                      const Icon = value.icon
                      const isSelected = selectedCategory === key
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedCategory(key)
                            setIsCategoryDropdownOpen(false)
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer',
                            isSelected
                              ? 'bg-brand-500 text-white shadow-sm'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn('w-3.5 h-3.5', isSelected ? 'text-white' : 'text-slate-400')} />
                            <span>{value.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar: Categories & Search (>= lg) */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-6">
          {/* Search */}
          <div className="card p-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Search Posts</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search notes, cycles..." className="input-field pl-10 text-xs py-2" />
            </div>
          </div>

          {/* Categories: Desktop Sidebar List */}
          <div className="card p-4 space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Categories</label>
            {Object.entries(categoryConfig).map(([key, value]) => {
              const Icon = value.icon
              const isSelected = selectedCategory === key
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer',
                    isSelected
                      ? 'bg-brand-500 text-white shadow-brand'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 hover:text-brand-600'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isSelected ? 'text-white' : 'text-slate-400')} />
                  {value.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Area: Posts Feed */}
        <div className="flex-1 space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No board posts found</h3>
              <p className="text-slate-500 mt-2 mb-4">Be the first to share an update, announcement, or item for sale!</p>
              <button onClick={() => { setSearch(''); setSelectedCategory('all') }} className="btn-primary">
                View All Board
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch">
                {filteredPosts.slice(0, (showAllPosts || search.trim() !== '' || selectedCategory !== 'all') ? undefined : 3).map(post => {
                  if (!post) return null
                  const config = categoryConfig[post.category as keyof typeof categoryConfig] || categoryConfig.general || { label: 'General', icon: HelpCircle, color: 'text-slate-600 bg-slate-50' }
                  const CategoryIcon = config.icon || HelpCircle
                  
                  let textContent = post.content || ''
                  let phone = ''
                  let location = ''
                  let images: string[] = Array.isArray(post.images) ? post.images : []
                  let video_url = ''
                  let customCategoryName = ''
                  try {
                    if (post.content && typeof post.content === 'string' && post.content.startsWith('{')) {
                      const parsed = JSON.parse(post.content)
                      if (parsed && typeof parsed === 'object') {
                        if (parsed.text !== undefined) textContent = parsed.text
                        phone = parsed.phone || ''
                        location = parsed.location || ''
                        if (Array.isArray(parsed.images) && parsed.images.length > 0) {
                          images = parsed.images
                        }
                        if (parsed.video_url) video_url = parsed.video_url
                        if (parsed.custom_category) customCategoryName = parsed.custom_category
                      }
                    }
                  } catch (e) {}

                  const authorName = post.profiles?.full_name || post.full_name || 'Campus Student'
                  const authorInitials = (authorName.split(' ').filter(Boolean).map((n: string) => n[0]).join('') || 'CS').toUpperCase().slice(0, 2)
                  const postDate = post.created_at ? formatDate(post.created_at) : 'Recently'
                  const categoryDisplayName = (post.category === 'custom' && customCategoryName) ? customCategoryName : (config.label || 'General')

                  return (
                    <motion.div
                      layout
                      key={post.id}
                      onClick={() => navigate(`/community/${post.id}`, { state: { post } })}
                      className="card p-3 sm:p-4 border-slate-200 hover:border-slate-300 transition-all dark:border-slate-800 cursor-pointer hover:shadow-md flex flex-col h-full"
                    >
                      {/* Post Meta */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-brand-600 shrink-0">
                            {authorInitials}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                              {authorName}
                              {post.author_id === profile?.id && (
                                <span className="badge badge-purple text-[8px] px-1.5 py-0">You</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {postDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={cn('badge text-[10px] px-2 py-0.5 inline-flex items-center gap-1 font-semibold', config.color)}>
                            <CategoryIcon className="w-3 h-3" />
                            {categoryDisplayName}
                          </span>
                        
                        {post.author_id === profile?.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                let phoneNoCode = phone;
                                let phoneCode = '+91';
                                const validCodes = ['+91', '+1', '+44', '+61', '+971'];
                                for (const c of validCodes) {
                                  if (phone.startsWith(c)) {
                                    phoneCode = c;
                                    phoneNoCode = phone.slice(c.length);
                                    break;
                                  }
                                }
                                setForm({
                                  title: post.title,
                                  content: textContent,
                                  category: post.category as any,
                                  custom_category: customCategoryName,
                                  price: post.price ? post.price.toString() : '',
                                  phone: phoneNoCode,
                                  phone_code: phoneCode,
                                  location: location,
                                  images: images,
                                  video_url: video_url
                                })
                                setIsEditingPostId(post.id)
                                setShowModal(true)
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                              title="Edit Post"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id) }}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
                              title="Delete Post"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    {(images.length > 0 || video_url) && (
                      <div className="mb-3 h-28 sm:h-32 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative shrink-0">
                        {images.length > 0 ? (
                          <img src={images[0]} alt="Post attachment" className="w-full h-full object-cover" />
                        ) : (
                          <video src={`${video_url}#t=0.001`} className="w-full h-full object-cover opacity-80" preload="metadata" playsInline muted />
                        )}
                        {images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                            1 of {images.length}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 leading-tight line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {textContent}
                      </p>

                      {/* Price Tag if available */}
                      {post.price !== undefined && post.price !== null && post.price !== '' && (
                        <div className="mt-3 flex items-center gap-1">
                          <span className="text-xs text-slate-400">Asking Price:</span>
                          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg">
                            {Number(post.price) === 0 ? 'Free' : formatCurrency(Number(post.price))}
                          </span>
                        </div>
                      )}

                      {location && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="shrink-0">📍</span>
                          <span className="truncate">{location}</span>
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs">
                      {phone ? (
                        <>
                          <a href={`tel:${phone}`} onClick={(e) => e.stopPropagation()} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 rounded-xl justify-center shadow-brand text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95">
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                          <a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=Hi, I saw your post "${post.title}" on FlatsNFood!`} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="flex-1 font-bold py-2 rounded-xl justify-center text-xs flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 transition-all hover:scale-[1.02] active:scale-95">
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No contact details provided.</p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
              </div>
              
              {!showAllPosts && search.trim() === '' && selectedCategory === 'all' && filteredPosts.length > 3 && (
                <div className="flex justify-center mt-6">
                  <button onClick={() => setShowAllPosts(true)} className="btn-secondary">
                    View all {filteredPosts.length} posts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowModal(false); setIsEditingPostId(null); setForm({ title: '', content: '', category: 'general', custom_category: '', price: '', phone: '', phone_code: '+91', location: '', images: [], video_url: '' }) }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md h-full sm:h-auto max-h-screen overflow-y-auto bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-glass z-10 p-6 space-y-4">
              
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">{isEditingPostId ? '📝 Edit Item' : '🛒 Sell Item on Marketplace'}</h3>
                <button type="button" onClick={() => { setShowModal(false); setIsEditingPostId(null); setForm({ title: '', content: '', category: 'general', custom_category: '', price: '', phone: '', phone_code: '+91', location: '', images: [], video_url: '' }) }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Item Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Second-Hand Laptop Table, Engineering Textbooks" className="input-field text-sm" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Item Category *</label>
                  <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value as any }))} className="input-field text-sm">
                    <option value="general">General</option>
                    <option value="notes">Study Notes</option>
                    <option value="books">Textbooks</option>
                    <option value="cycles">Bicycles</option>
                    <option value="bikes">Motorbikes / Scooters</option>
                    <option value="electronics">Electronics & Accessories</option>
                    <option value="custom">Other / Custom Category</option>
                  </select>
                </div>

                {form.category === 'custom' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Custom Category Name *</label>
                    <input
                      type="text"
                      value={form.custom_category}
                      onChange={e => setForm(prev => ({ ...prev, custom_category: e.target.value }))}
                      placeholder="e.g. Furniture, Sports Equipment, Instruments..."
                      className="input-field text-sm"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Selling Price / Asking Price (₹, optional)</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. 500" className="input-field text-sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Number</label>
                    <div className="flex gap-2">
                      <select value={form.phone_code} onChange={e => setForm(prev => ({ ...prev, phone_code: e.target.value }))} className="input-field text-sm w-[85px] px-2 font-medium">
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+61">+61</option>
                        <option value="+971">+971</option>
                      </select>
                      <input type="tel" maxLength={10} pattern="[0-9]{10}" title="Invalid number" value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                        placeholder="9876543210" className="input-field text-sm flex-1" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Location (Optional)</label>
                    <input type="text" value={form.location} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Campus Library" className="input-field text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Upload Media (Max 3 Images, 1 Video)</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                        <img src={img} alt="Upload" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    {form.images.length < 3 && (
                      <>
                        <label className="w-16 h-16 shrink-0 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors" title="Upload Image">
                          <Plus className="w-5 h-5" />
                          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        <label className="w-16 h-16 shrink-0 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors" title="Take Photo">
                          <Camera className="w-5 h-5" />
                          <span className="text-[9px] mt-1">Camera</span>
                          <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </>
                    )}
                    
                    {form.video_url ? (
                      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-black">
                        <video src={`${form.video_url}#t=0.001`} className="w-full h-full object-cover opacity-70" preload="metadata" playsInline muted autoPlay loop />
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, video_url: '' }))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg"><X className="w-3 h-3" /></button>
                        <Video className="absolute inset-0 m-auto w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <>
                        <label className="w-16 h-16 shrink-0 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors" title="Upload Video">
                          {isUploadingVideo ? (
                            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Video className="w-5 h-5" />
                              <span className="text-[9px] mt-1">Video</span>
                            </>
                          )}
                          <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={isUploadingVideo} />
                        </label>
                        <label className="w-16 h-16 shrink-0 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors" title="Record Video">
                          {isUploadingVideo ? (
                            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Camera className="w-5 h-5" />
                              <span className="text-[9px] mt-1">Record</span>
                            </>
                          )}
                          <input type="file" accept="video/*" capture="environment" onChange={handleVideoUpload} className="hidden" disabled={isUploadingVideo} />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Post Body Content *</label>
                  <textarea rows={4} value={form.content} onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Provide details about your post or notice..." className="input-field py-2 text-sm" required />
                </div>

                <button type="submit" className="btn-primary w-full justify-center py-2.5 text-sm mt-3">
                  {isEditingPostId ? '💾 Save Changes' : '🚀 Publish Post'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
