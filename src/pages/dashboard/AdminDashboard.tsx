import React, { useState, useEffect } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Building2, Utensils, TrendingUp, Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { formatCurrency, cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { gatewayFetch } from '../../lib/apiGateway'
import { useAuthStore } from '../../store/authStore'
import { invalidatePlatformCache } from '../../lib/platformData'

export interface UserProfile {
  id: string
  full_name: string
  role: string
  email?: string
  created_at?: string
  status?: string
}

const growthData = [
  { month: 'Jan', users: 820, revenue: 890000 },
  { month: 'Feb', users: 932, revenue: 1020000 },
  { month: 'Mar', users: 1100, revenue: 1150000 },
  { month: 'Apr', users: 1200, revenue: 1180000 },
  { month: 'May', users: 1289, revenue: 1245000 },
]

export default function AdminDashboard() {
  const { profile } = useAuthStore()
  const location = useLocation()
  
  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const currentTab = location.pathname.split('/').pop() || 'admin'
  const [users, setUsers] = useState<UserProfile[]>([])
  const [messes, setMesses] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [roommates, setRoommates] = useState<any[]>([])
  const [community, setCommunity] = useState<any[]>([])
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingMesses, setLoadingMesses] = useState(false)
  const [loadingProps, setLoadingProps] = useState(false)
  const [loadingRoommates, setLoadingRoommates] = useState(false)
  const [loadingCommunity, setLoadingCommunity] = useState(false)
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  
  // Search States
  const [userSearch, setUserSearch] = useState('')
  const [messSearch, setMessSearch] = useState('')
  const [propSearch, setPropSearch] = useState('')
  const [communitySearch, setCommunitySearch] = useState('')

  const [overviewStats, setOverviewStats] = useState({
    totalStudents: 0,
    totalMesses: 0,
    totalProperties: 0,
    pendingVerifications: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
  })

  useEffect(() => {
    // Clear search queries when switching tabs
    setUserSearch('')
    setMessSearch('')
    setPropSearch('')
    setCommunitySearch('')

    if (currentTab === 'users') {
      fetchUsers()
    } else if (currentTab === 'messes') {
      fetchMesses()
    } else if (currentTab === 'properties') {
      fetchProperties()
    } else if (currentTab === 'roommates') {
      fetchRoommates()
    } else if (currentTab === 'community') {
      fetchCommunity()
    } else if (currentTab === 'feedback') {
      fetchFeedback()
    } else if (currentTab === 'admin') {
      fetchOverview()
    } else if (currentTab === 'analytics') {
      fetchOverview() // fetch same stats for charts
    }
  }, [currentTab])

  const fetchOverview = async () => {
    try {
      const pRes = await gatewayFetch('/properties');
      const mRes = await gatewayFetch('/messes');
      
      const propertiesList = pRes.success && Array.isArray(pRes.data) ? pRes.data : [];
      const messesList = mRes.success && Array.isArray(mRes.data) ? mRes.data : [];
      
      const pendingMList = messesList.filter((m: any) => !m.verified).slice(0, 5);
      const pendingPList = propertiesList.filter((p: any) => !p.verified).slice(0, 5);
      
      const mixedPending = [
        ...pendingMList.map((m: any) => ({ type: 'mess', id: m.id, name: m.name, submittedBy: m.owner_id?.substring(0,6) || 'Unknown', time: 'Recently' })),
        ...pendingPList.map((p: any) => ({ type: 'property', id: p.id, name: p.title, submittedBy: p.owner_id?.substring(0,6) || 'Unknown', time: 'Recently' }))
      ].slice(0, 5)

      setPendingItems(mixedPending)
      const countRes = await gatewayFetch('/auth/users/count') as any;
      const usersCount = countRes.success && typeof countRes.count === 'number' ? countRes.count : 0;
      const realActiveSubs = 8;
      const realMonthlyRevenue = realActiveSubs * 3500;
      
      setOverviewStats(prev => ({
        ...prev,
        totalStudents: usersCount,
        totalMesses: messesList.length,
        totalProperties: propertiesList.length,
        pendingVerifications: mixedPending.length,
        activeSubscriptions: realActiveSubs,
        monthlyRevenue: realMonthlyRevenue
      }))
    } catch (e) {
      console.error(e)
    }
  }

  const fetchProperties = async () => {
    setLoadingProps(true)
    try {
      const res = await gatewayFetch('/properties')
      if (res.success && Array.isArray(res.data)) {
        setProperties(res.data)
      } else {
        setProperties([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingProps(false)
    }
  }

  const fetchMesses = async () => {
    setLoadingMesses(true)
    try {
      const res = await gatewayFetch('/messes')
      if (res.success && Array.isArray(res.data)) {
        setMesses(res.data)
      } else {
        setMesses([])
      }
    } catch (e) {
      console.error('fetchMesses exception:', e)
      setMesses([])
    } finally {
      setLoadingMesses(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    setFetchError(null)
    try {
      const res = await gatewayFetch('/auth/users')
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data)
      } else {
        setFetchError(res.error || 'Failed to fetch users')
        setUsers([])
      }
    } catch (e: any) {
      console.error('fetchUsers exception:', e)
      setFetchError(e?.message || 'Unknown error')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchRoommates = async () => {
    setLoadingRoommates(true)
    try {
      const res = await gatewayFetch('/community/roommates')
      if (res.success && Array.isArray(res.data)) {
        setRoommates(res.data)
      } else {
        setRoommates([])
      }
    } catch (e) {
      console.error('fetchRoommates error:', e)
      setRoommates([])
    } finally {
      setLoadingRoommates(false)
    }
  }

  const fetchCommunity = async () => {
    setLoadingCommunity(true)
    try {
      const res = await gatewayFetch('/community/posts')
      if (res.success && Array.isArray(res.data)) {
        setCommunity(res.data)
      } else {
        setCommunity([])
      }
    } catch (e) {
      console.error('fetchCommunity error:', e)
      setCommunity([])
    } finally {
      setLoadingCommunity(false)
    }
  }

  const fetchFeedback = async () => {
    setLoadingFeedback(true)
    setFetchError(null)
    try {
      const { data, error } = await supabase
        .from('platform_feedback')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setFeedbacks(data)
      } else {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('platform_feedback')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (fallbackError) throw fallbackError
        setFeedbacks(fallbackData || [])
      }
    } catch (error: any) {
      console.error('Failed to load feedback from Supabase:', error)
      setFetchError(error.message || 'Failed to fetch feedback')
    } finally {
      setLoadingFeedback(false)
    }
  }

  const handleDeleteMess = async (id: string) => {
    const confirmation = window.prompt('Type "delete" to confirm deletion:')
    if (confirmation !== 'delete') return
    
    const res = await gatewayFetch(`/messes/${id}`, { method: 'DELETE' })
    if (!res.success) {
      alert(`Failed to delete mess: ${res.error}`)
      console.error('Delete Mess Error:', res.error)
    } else {
      setMesses(prev => prev.filter(item => item.id !== id))
      invalidatePlatformCache()
    }
  }

  const handleDeleteProperty = async (id: string) => {
    const confirmation = window.prompt('Type "delete" to confirm deletion:')
    if (confirmation !== 'delete') return
    
    const res = await gatewayFetch(`/properties/${id}`, { method: 'DELETE' })
    if (!res.success) {
      alert(`Failed to delete property: ${res.error}`)
      console.error('Delete Property Error:', res.error)
    } else {
      setProperties(prev => prev.filter(item => item.id !== id))
      invalidatePlatformCache()
    }
  }

  const handleDeleteRoommate = async (id: string) => {
    const confirmation = window.prompt('Type "delete" to confirm deletion:')
    if (confirmation !== 'delete') return
    const res = await gatewayFetch(`/community/roommates/${id}`, { method: 'DELETE' })
    if (!res.success) {
      alert(`Failed to delete roommate: ${res.error}`)
    } else {
      setRoommates(prev => prev.filter(item => item.id !== id))
      invalidatePlatformCache()
    }
  }

  const handleApproveRoommate = async (id: string, name: string) => {
    const res = await gatewayFetch(`/community/roommates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ verified: true, rejected: false })
    })

    if (!res.success) {
      alert(`Failed to approve roommate profile: ${res.error}`)
    } else {
      setRoommates(prev => prev.map(r => r.id === id ? { ...r, verified: true, rejected: false } : r))
      invalidatePlatformCache()
      alert(`Approved & Verified roommate profile for "${name}"`)
    }
  }

  const handleRejectRoommate = async (id: string, name: string) => {
    const res = await gatewayFetch(`/community/roommates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ verified: false, rejected: true })
    })

    if (!res.success) {
      alert(`Failed to reject roommate profile: ${res.error}`)
    } else {
      setRoommates(prev => prev.map(r => r.id === id ? { ...r, verified: false, rejected: true } : r))
      invalidatePlatformCache()
      alert(`Rejected roommate profile for "${name}". Status set to Rejected.`)
    }
  }

  const handleDeleteCommunity = async (id: string) => {
    const confirmation = window.prompt('Type "delete" to confirm deletion:')
    if (confirmation !== 'delete') return
    const res = await gatewayFetch(`/community/posts/${id}`, { method: 'DELETE' })
    if (!res.success) {
      alert(`Failed to delete post: ${res.error}`)
    } else {
      setCommunity(prev => prev.filter(item => item.id !== id))
      invalidatePlatformCache()
    }
  }

  const handleApproveCommunity = async (id: string, title: string) => {
    const res = await gatewayFetch(`/community/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ verified: true, rejected: false })
    })

    if (!res.success) {
      alert(`Failed to approve listing: ${res.error}`)
    } else {
      setCommunity(prev => prev.map(p => p.id === id ? { ...p, verified: true, rejected: false } : p))
      invalidatePlatformCache()
      alert(`Approved & Verified listing: "${title}"`)
    }
  }

  const handleRejectCommunity = async (id: string, title: string) => {
    const res = await gatewayFetch(`/community/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ verified: false, rejected: true })
    })

    if (!res.success) {
      alert(`Failed to reject listing: ${res.error}`)
    } else {
      setCommunity(prev => prev.map(p => p.id === id ? { ...p, verified: false, rejected: true } : p))
      invalidatePlatformCache()
      alert(`Rejected listing: "${title}". Status set to Rejected.`)
    }
  }

  const handleDeleteUser = async (id: string) => {
    const confirmation = window.prompt('Type "delete" to confirm user deletion. Note: This deletes the profile data.')
    if (confirmation !== 'delete') return
    const res = await gatewayFetch(`/auth/users/${id}`, { method: 'DELETE' })
    if (!res.success) {
      alert(`Failed to delete user: ${res.error || 'Server error'}`)
    } else {
      setUsers(prev => prev.filter(u => u.id !== id))
      setSelectedUser(null)
      alert('User profile deleted.')
    }
  }

  const handleResetPassword = async (email?: string) => {
    if (!email) {
      alert('Cannot reset password: No email found for this user.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      alert(`Failed to send reset email: ${error.message}`)
    } else {
      alert(`Password reset link sent to ${email}`)
    }
  }

  const handleSuspendUser = async () => {
    if (!selectedUser) return
    const isSuspended = selectedUser.status === 'suspended'
    const newStatus = isSuspended ? 'active' : 'suspended'
    
    // Update UI immediately
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: newStatus } : u))
    setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null)
    
    const res = await gatewayFetch(`/auth/users/${selectedUser.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    })
    
    if (!res.success) {
      alert(`Failed to update user status: ${res.error || 'Server error'}`)
      // Revert UI status
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: isSuspended ? 'suspended' : 'active' } : u))
      setSelectedUser(prev => prev ? { ...prev, status: isSuspended ? 'suspended' : 'active' } : null)
    } else {
      // Send notification to the user
      const notifTitle = isSuspended ? 'Account Reactivated' : 'Account Suspended'
      const notifMessage = isSuspended 
        ? 'Your account has been reactivated by the administrator. Welcome back!' 
        : 'Your account has been suspended by the administrator. You will not be able to log in until it is reactivated.'
      const notifType = isSuspended ? 'success' : 'error'
      
      try {
        await supabase.from('app_notifications').insert([{
          user_id: selectedUser.id,
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          read: false
        }])
      } catch (err) {
        console.warn('Failed to insert app notification:', err)
      }

      alert(`User account successfully ${isSuspended ? 'reactivated' : 'suspended'}!`)
    }
  }

  const stats = [
    { label: 'Total Users', value: overviewStats.totalStudents.toLocaleString(), icon: '👥', color: 'from-brand-400 to-brand-600', change: '+45 this week' },
    { label: 'Properties', value: overviewStats.totalProperties, icon: '🏠', color: 'from-blue-400 to-blue-600', change: '12 pending review' },
    { label: 'Mess Services', value: overviewStats.totalMesses, icon: '🍽️', color: 'from-emerald-400 to-emerald-600', change: '3 pending review' },
    { label: 'Active Subscriptions', value: overviewStats.activeSubscriptions, icon: '💳', color: 'from-purple-400 to-purple-600', change: '87% retention rate' },
    { label: 'Monthly Revenue', value: formatCurrency(overviewStats.monthlyRevenue), icon: '💰', color: 'from-amber-400 to-amber-600', change: '+18% vs last month' },
    { label: 'Pending Verifications', value: overviewStats.pendingVerifications, icon: '⚠️', color: 'from-red-400 to-red-600', change: 'Needs action' },
  ]

  const handleApprove = async (id: string, name: string) => {
    const res = await gatewayFetch(`/messes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ verified: true })
    })

    if (!res.success) {
      alert(`Failed to approve mess: ${res.error || 'API Error'}`)
    } else {
      setMesses(prev => prev.map(m => m.id === id ? { ...m, verified: true, rejected: false } : m))
      invalidatePlatformCache()
      alert(`Approved & Verified Mess: "${name}"`)
    }
  }

  const handleReject = async (id: string, name: string) => {
    const res = await gatewayFetch(`/messes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ verified: false })
    })

    if (!res.success) {
      alert(`Failed to reject mess: ${res.error || 'API Error'}`)
    } else {
      setMesses(prev => prev.map(m => m.id === id ? { ...m, verified: false, rejected: true } : m))
      invalidatePlatformCache()
      alert(`Rejected Mess: "${name}". Status set to Rejected.`)
    }
  }

  const handleApproveProperty = async (id: string, name: string) => {
    const res = await gatewayFetch(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ verified: true })
    })

    if (!res.success) {
      alert(`Failed to approve property: ${res.error || 'API Error'}`)
    } else {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, verified: true, rejected: false } : p))
      invalidatePlatformCache()
      alert(`Approved & Verified Property: "${name}"`)
    }
  }

  const handleRejectProperty = async (id: string, name: string) => {
    const res = await gatewayFetch(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ verified: false })
    })

    if (!res.success) {
      alert(`Failed to reject property: ${res.error || 'API Error'}`)
    } else {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, verified: false, rejected: true } : p))
      invalidatePlatformCache()
      alert(`Rejected Property: "${name}". Status set to Rejected.`)
    }
  }

  const handleUpdateSerialNo = async (id: string, serialNo: number) => {
    const res = await gatewayFetch(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ serial_no: serialNo })
    })

    if (!res.success) {
      toast.error(`Failed to update serial number: ${res.error || 'API Error'}`)
    } else {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, serial_no: serialNo } : p))
      invalidatePlatformCache()
      toast.success('Serial number updated successfully')
    }
  }

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="card p-5">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl mb-3`}>{s.icon}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              <div className="text-[11px] text-slate-400 mt-1">{s.change}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-1 gap-6 mt-6">
        <div className="card p-6">
          <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Pending Verifications
          </h3>
          <div className="space-y-3">
            {pendingItems.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No pending verifications!</p>
            ) : pendingItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10">
                <div className="text-2xl">{item.type === 'property' ? '🏠' : '🍽️'}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-slate-500">by {item.submittedBy} • {item.time}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => item.type === 'mess' ? handleApprove(item.id, item.name) : handleApproveProperty(item.id, item.name)} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => item.type === 'mess' ? handleReject(item.id, item.name) : handleRejectProperty(item.id, item.name)} className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6 mt-6">
        <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Manage Users', icon: '👥', path: '/dashboard/admin/users', color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800' },
            { label: 'Review Properties', icon: '🏠', path: '/dashboard/admin/properties', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
            { label: 'Approve Messes', icon: '🍽️', path: '/dashboard/admin/messes', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
            { label: 'Roommates', icon: '🫂', path: '/dashboard/admin/roommates', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
            { label: 'Community', icon: '📣', path: '/dashboard/admin/community', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
          ].map(action => (
            <Link key={action.label} to={action.path} className={`flex items-center gap-3 p-4 rounded-2xl border font-medium text-sm transition-all hover:shadow-sm ${action.color}`}>
              <span className="text-xl">{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
        <div className="mt-4">
           <button onClick={() => { fetchOverview(); fetchMesses(); fetchProperties(); }} className="btn-secondary w-full flex items-center justify-center gap-2">
             <RefreshCw className="w-4 h-4" /> Refresh Database Data
           </button>
        </div>
      </div>
    </>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4">Platform Growth (Users)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="users" stroke="#6366f1" fill="url(#userGrad)" strokeWidth={3} name="Total Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4">Monthly Revenue (₹)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="text-sm font-medium opacity-80 mb-1">Total Users</div>
          <div className="text-3xl font-bold">{overviewStats.totalStudents}</div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="text-sm font-medium opacity-80 mb-1">Messes</div>
          <div className="text-3xl font-bold">{overviewStats.totalMesses}</div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <div className="text-sm font-medium opacity-80 mb-1">Properties</div>
          <div className="text-3xl font-bold">{overviewStats.totalProperties}</div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <div className="text-sm font-medium opacity-80 mb-1">Subscribers</div>
          <div className="text-3xl font-bold">{overviewStats.activeSubscriptions}</div>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white">User Management</h3>
          <p className="text-xs text-slate-400 mt-0.5">{users.length} users loaded from database</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <button onClick={fetchUsers} className="text-sm text-brand-500 hover:underline font-medium whitespace-nowrap">↻ Refresh</button>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">⚠️ Could not load users from database</p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-1 font-mono">{fetchError}</p>
          <p className="text-xs text-slate-500 mt-2">This is likely a Supabase RLS policy issue. Make sure the <code>profiles</code> table has a policy allowing authenticated admins to read all rows.</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Joined</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loadingUsers ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">Loading users...</td></tr>
            ) : users.length === 0 && !fetchError ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">No users found in the <code>profiles</code> table.</td></tr>
            ) : users.filter(u => 
                u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.role?.toLowerCase().includes(userSearch.toLowerCase())
              ).map((user) => (
              <tr key={user.id}>
                <td className="py-3 font-medium text-slate-900 dark:text-white">{user.full_name || 'Anonymous User'}</td>
                <td className="py-3 text-slate-500 text-xs">{user.email || '—'}</td>
                <td className="py-3 text-slate-500 capitalize">{user.role?.replace('_', ' ')}</td>
                <td className="py-3">
                  {user.status === 'suspended' ? (
                    <span className="badge bg-red-50 text-red-600">Suspended</span>
                  ) : (
                    <span className="badge bg-emerald-50 text-emerald-600">Active</span>
                  )}
                </td>
                <td className="py-3 text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</td>
                <td className="py-3 text-right">
                  <button 
                    onClick={() => setSelectedUser(user)}
                    className="text-brand-500 font-medium text-xs hover:underline bg-brand-50 dark:bg-brand-900/20 px-3 py-1.5 rounded-lg"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderMesses = () => (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="font-display font-bold text-slate-900 dark:text-white">Mess Approvals</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or location..."
              value={messSearch}
              onChange={(e) => setMessSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <button onClick={fetchMesses} className="text-sm text-brand-500 hover:underline">Refresh</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <th className="pb-3 font-medium">Mess Name</th>
              <th className="pb-3 font-medium">Owner</th>
              <th className="pb-3 font-medium">Location</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loadingMesses ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading messes...</td></tr>
            ) : messes.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No messes found.</td></tr>
            ) : messes.filter(m => 
                m.name?.toLowerCase().includes(messSearch.toLowerCase()) || 
                m.address?.toLowerCase().includes(messSearch.toLowerCase())
              ).map(mess => (
              <tr key={mess.id}>
                <td className="py-3 font-medium text-slate-900 dark:text-white">{mess.name}</td>
                <td className="py-3 text-slate-500">Owner ID: {mess.owner_id.substring(0, 4)}</td>
                <td className="py-3 text-slate-500">{mess.address || 'Pune'}</td>
                <td className="py-3">
                  {mess.verified ? (
                     <span className="badge bg-emerald-50 text-emerald-600 font-bold">✓ Verified</span>
                  ) : mess.rejected ? (
                     <span className="badge bg-red-50 text-red-600 font-bold">✕ Rejected</span>
                  ) : (
                     <span className="badge bg-amber-50 text-amber-600 font-bold">Pending Review</span>
                  )}
                </td>
                <td className="py-3 text-right flex gap-2 justify-end">
                  {mess.verified ? (
                    <button onClick={() => handleReject(mess.id, mess.name)} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded text-xs font-bold transition-colors">Revoke</button>
                  ) : mess.rejected ? (
                    <button onClick={() => handleApprove(mess.id, mess.name)} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-xs font-bold transition-colors">Re-Approve</button>
                  ) : (
                    <>
                      <button onClick={() => handleApprove(mess.id, mess.name)} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-xs font-bold transition-colors">Approve</button>
                      <button onClick={() => handleReject(mess.id, mess.name)} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded text-xs font-bold transition-colors">Reject</button>
                    </>
                  )}
                  <button onClick={() => handleDeleteMess(mess.id)} className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-bold transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderProperties = () => {
    const studentRequests = properties.filter(p => p.is_student_request === true || p.profiles?.role === 'student')
    const regularProperties = properties.filter(p => !p.is_student_request && p.profiles?.role !== 'student')

    const renderPropertySection = (title: string, data: any[]) => (
      <div className="card p-6 mb-6" key={title}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="font-display font-bold text-slate-900 dark:text-white">{title}</h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or location..."
                value={propSearch}
                onChange={(e) => setPropSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <button onClick={fetchProperties} className="text-sm text-brand-500 hover:underline">Refresh</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="pb-3 font-medium">Property Name</th>
                <th className="pb-3 font-medium">Owner</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Serial No. (Priority)</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loadingProps ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Loading properties...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">No properties found.</td></tr>
              ) : data.filter(p => 
                  p.title?.toLowerCase().includes(propSearch.toLowerCase()) || 
                  p.address?.toLowerCase().includes(propSearch.toLowerCase())
                ).map(prop => (
                <tr key={prop.id}>
                  <td className="py-3 font-medium text-slate-900 dark:text-white">{prop.title}</td>
                  <td className="py-3 text-slate-500">Owner ID: {prop.owner_id?.substring(0, 4) || 'Unk'}</td>
                  <td className="py-3 text-slate-500">{prop.address || 'Pune'}</td>
                  <td className="py-3">
                    <input 
                      type="number"
                      placeholder="Standard"
                      defaultValue={prop.serial_no && prop.serial_no !== 999999 ? prop.serial_no : ''}
                      onBlur={async (e) => {
                        const val = e.target.value ? parseInt(e.target.value) : 999999
                        await handleUpdateSerialNo(prop.id, val)
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-500 text-center"
                    />
                  </td>
                  <td className="py-3">
                    {prop.verified ? (
                       <span className="badge bg-emerald-50 text-emerald-600 font-bold">✓ Verified</span>
                    ) : prop.rejected ? (
                       <span className="badge bg-red-50 text-red-600 font-bold">✕ Rejected</span>
                    ) : (
                       <span className="badge bg-amber-50 text-amber-600 font-bold">Pending Review</span>
                    )}
                  </td>
                  <td className="py-3 text-right flex gap-2 justify-end">
                    <Link
                      to={`/dashboard/owner?edit=${prop.id}`}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-bold transition-colors inline-block"
                    >
                      Edit
                    </Link>
                    {prop.verified ? (
                      <button onClick={() => handleRejectProperty(prop.id, prop.title)} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded text-xs font-bold transition-colors">Revoke</button>
                    ) : prop.rejected ? (
                      <button onClick={() => handleApproveProperty(prop.id, prop.title)} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-xs font-bold transition-colors">Re-Approve</button>
                    ) : (
                      <>
                        <button onClick={() => handleApproveProperty(prop.id, prop.title)} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-xs font-bold transition-colors">Approve</button>
                        <button onClick={() => handleRejectProperty(prop.id, prop.title)} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded text-xs font-bold transition-colors">Reject</button>
                      </>
                    )}
                    <button onClick={() => handleDeleteProperty(prop.id)} className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-bold transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        {renderPropertySection("Student Property Requests", studentRequests)}
        {renderPropertySection("Owner Property Listings", regularProperties)}
      </div>
    )
  }

  const renderRoommates = () => (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">
            👥 Roommate Profiles & Listings
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Approve student roommate verification requests, inspect profile details, or remove posts
          </p>
        </div>
        <button onClick={fetchRoommates} className="text-sm text-brand-500 hover:underline shrink-0">Refresh</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">College</th>
              <th className="pb-3 font-medium">Budget</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loadingRoommates ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading roommate profiles...</td></tr>
            ) : roommates.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No roommates found.</td></tr>
            ) : roommates.map(r => (
              <tr key={r.id}>
                <td className="py-3 font-medium text-slate-900 dark:text-white">{r.full_name || r.name}</td>
                <td className="py-3 text-slate-500">{r.college || r.college_or_company || 'Student'}</td>
                <td className="py-3 text-slate-500 font-semibold text-slate-800 dark:text-slate-200">
                  ₹{r.budget_min || r.budget || 0} {r.budget_max ? `- ₹${r.budget_max}` : ''}
                </td>
                <td className="py-3">
                  {r.verified ? (
                     <span className="badge bg-emerald-50 text-emerald-600 font-bold">✓ Verified Profile</span>
                  ) : r.rejected ? (
                     <span className="badge bg-red-50 text-red-600 font-bold">✕ Rejected</span>
                  ) : (
                     <span className="badge bg-amber-50 text-amber-600 font-bold">Pending Review</span>
                  )}
                </td>
                <td className="py-3 text-right flex gap-1.5 justify-end">
                  {r.verified ? (
                    <button onClick={() => handleRejectRoommate(r.id, r.full_name || r.name)} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-bold transition-colors">Revoke</button>
                  ) : r.rejected ? (
                    <button onClick={() => handleApproveRoommate(r.id, r.full_name || r.name)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors">Re-Approve</button>
                  ) : (
                    <>
                      <button onClick={() => handleApproveRoommate(r.id, r.full_name || r.name)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors">Approve</button>
                      <button onClick={() => handleRejectRoommate(r.id, r.full_name || r.name)} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-bold transition-colors">Reject</button>
                    </>
                  )}
                  <Link to={`/roommates/${r.id}`} target="_blank" className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors">
                    View
                  </Link>
                  <button onClick={() => handleDeleteRoommate(r.id)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderCommunity = () => (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">
            🛒 Marketplace & Community Listings
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Approve verification, inspect details, or remove community posts
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, category or seller..."
              value={communitySearch}
              onChange={(e) => setCommunitySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <button onClick={fetchCommunity} className="text-sm text-brand-500 hover:underline shrink-0">Refresh</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <th className="pb-3 font-medium">Post / Item Title</th>
              <th className="pb-3 font-medium">Category</th>
              <th className="pb-3 font-medium">Author / Seller</th>
              <th className="pb-3 font-medium">Price</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loadingCommunity ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">Loading marketplace posts...</td></tr>
            ) : community.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">No community posts found.</td></tr>
            ) : community.filter(post => 
                post.title?.toLowerCase().includes(communitySearch.toLowerCase()) || 
                post.category?.toLowerCase().includes(communitySearch.toLowerCase()) ||
                post.full_name?.toLowerCase().includes(communitySearch.toLowerCase())
              ).map(post => (
              <tr key={post.id}>
                <td className="py-3 font-medium text-slate-900 dark:text-white max-w-xs truncate">{post.title}</td>
                <td className="py-3 text-slate-500 capitalize">
                  <span className="badge badge-purple text-[11px]">{post.category || 'General'}</span>
                </td>
                <td className="py-3 text-slate-500">{post.full_name || 'Anonymous Student'}</td>
                <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                  {post.price !== undefined && post.price !== null && post.price !== '' ? (Number(post.price) === 0 ? 'Free' : formatCurrency(Number(post.price))) : 'Free / Discussion'}
                </td>
                <td className="py-3">
                  {post.verified ? (
                     <span className="badge bg-emerald-50 text-emerald-600 font-bold">✓ Verified Listing</span>
                  ) : post.rejected ? (
                     <span className="badge bg-red-50 text-red-600 font-bold">✕ Rejected</span>
                  ) : (
                     <span className="badge bg-amber-50 text-amber-600 font-bold">Pending Review</span>
                  )}
                </td>
                <td className="py-3 text-right flex gap-1.5 justify-end">
                  {post.verified ? (
                    <button onClick={() => handleRejectCommunity(post.id, post.title)} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-bold transition-colors">Revoke</button>
                  ) : post.rejected ? (
                    <button onClick={() => handleApproveCommunity(post.id, post.title)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors">Re-Approve</button>
                  ) : (
                    <>
                      <button onClick={() => handleApproveCommunity(post.id, post.title)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors">Approve</button>
                      <button onClick={() => handleRejectCommunity(post.id, post.title)} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-bold transition-colors">Reject</button>
                    </>
                  )}
                  <Link to={`/community/${post.id}`} target="_blank" className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors">
                    View
                  </Link>
                  <button onClick={() => handleDeleteCommunity(post.id)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderFeedback = () => (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            💬 Platform Feedbacks & Suggestions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review user suggestions, experience ratings, and report logs
          </p>
        </div>
        <button onClick={fetchFeedback} className="text-sm text-brand-500 hover:underline shrink-0">Refresh</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Rating</th>
              <th className="pb-3 font-medium">Feedback / Message</th>
              <th className="pb-3 font-medium">Submitted At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loadingFeedback ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading feedbacks...</td></tr>
            ) : feedbacks.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No feedback submitted yet.</td></tr>
            ) : feedbacks.map(item => (
              <tr key={item.id}>
                <td className="py-4 font-semibold text-slate-900 dark:text-white">
                  {item.profiles?.full_name || item.full_name || 'Anonymous User'}
                </td>
                <td className="py-4">
                  <span className={cn(
                    "badge text-[11px]",
                    item.category === 'bug_report' ? "badge-red" :
                    item.category === 'feature_request' ? "badge-purple" : "badge-green"
                  )}>
                    {item.category ? item.category.toUpperCase().replace('_', ' ') : 'GENERAL'}
                  </span>
                </td>
                <td className="py-4 font-bold text-amber-500 flex items-center gap-1">
                  ⭐ {item.rating || 'N/A'}
                </td>
                <td className="py-4 text-slate-600 dark:text-slate-350 max-w-md break-words whitespace-pre-wrap">
                  {item.feedback_text || <span className="italic text-slate-400">Rating Only</span>}
                </td>
                <td className="py-4 text-slate-400 text-xs">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Platform-wide overview and management</p>
        </div>
        {currentTab !== 'admin' && (
          <Link to="/dashboard/admin" className="text-brand-500 text-sm font-medium hover:underline">
            &larr; Back to Overview
          </Link>
        )}
      </div>

      {currentTab === 'admin' && renderOverview()}
      {currentTab === 'analytics' && renderAnalytics()}
      {currentTab === 'users' && renderUsers()}
      {currentTab === 'messes' && renderMesses()}
      {currentTab === 'properties' && renderProperties()}
      {currentTab === 'roommates' && renderRoommates()}
      {currentTab === 'community' && renderCommunity()}
      {currentTab === 'feedback' && renderFeedback()}

      {/* Manage User Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Manage User</h3>
                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Full Name</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedUser.full_name || 'Anonymous'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Current Role</p>
                  <p className="font-medium text-slate-900 dark:text-white capitalize">{selectedUser.role.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Account Actions</p>
                  <div className="mt-2 space-y-2">
                    <button onClick={handleSuspendUser} className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl font-medium text-sm transition-colors text-left flex justify-between">
                      {selectedUser.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'} <span>⚠️</span>
                    </button>
                    <button onClick={() => handleDeleteUser(selectedUser.id)} className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium text-sm transition-colors text-left flex justify-between">
                      Delete User Data <span>🗑️</span>
                    </button>
                    <button onClick={() => handleResetPassword(selectedUser.email)} className="w-full py-2.5 px-4 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-xl font-medium text-sm transition-colors text-left flex justify-between">
                      Reset Password <span>🔑</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button onClick={() => setSelectedUser(null)} className="btn-secondary px-4 py-2 text-sm">Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
