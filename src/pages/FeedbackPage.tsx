import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Star, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

interface Feedback {
  id: string
  user_id: string
  rating: number
  feedback_text: string
  category: string
  created_at: string
}

interface RatingStats {
  average_rating: number | null
  total_feedback_count: number
  five_star_count: number
  four_star_count: number
  three_star_count: number
  two_star_count: number
  one_star_count: number
}

export default function FeedbackPage() {
  const { user, profile } = useAuthStore()
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  const categories = [
    { value: 'general', label: '💭 General Feedback' },
    { value: 'feature_request', label: '✨ Feature Request' },
    { value: 'bug_report', label: '🐛 Bug Report' },
    { value: 'improvement', label: '⚡ Improvement Suggestion' },
  ]

  useEffect(() => {
    loadStats()
  }, [submitted])

  const loadStats = async () => {
    try {
      setLoadingStats(true)
      
      // Fetch average rating stats
      const { data: statsData, error: statsError } = await supabase
        .from('platform_average_rating')
        .select('*')
        .single()

      if (statsError && statsError.code !== 'PGRST116') {
        console.warn('Error fetching stats:', statsError)
      } else if (statsData) {
        setStats(statsData)
      }

      // Fetch recent feedback (non-empty feedback only)
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('platform_feedback')
        .select('*')
        .not('feedback_text', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!feedbackError && feedbackData) {
        setRecentFeedback(feedbackData)
      }
    } catch (err) {
      console.warn('Error loading feedback stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) {
      setError('Please log in to submit feedback')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: submitError } = await supabase.from('platform_feedback').insert([
        {
          user_id: user.id,
          rating,
          feedback_text: feedback || null,
          category,
        },
      ])

      if (submitError) throw submitError

      setSubmitted(true)
      setRating(5)
      setFeedback('')
      setCategory('general')
      
      setTimeout(() => {
        setSubmitted(false)
        loadStats()
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && setRating(star)}
            className={`transition-all ${
              star <= rating
                ? 'text-amber-400 scale-110'
                : 'text-slate-300 dark:text-slate-600'
            } ${interactive ? 'cursor-pointer hover:scale-125' : ''}`}
            disabled={!interactive}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">
            💬 Help Us Improve
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Your feedback helps us build a better platform for everyone. Share your experience and help shape the future of FlatsNFood.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Feedback Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Share Your Feedback</h2>

            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-300">Thank You!</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">Your feedback has been submitted successfully.</p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-300">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Rate Your Experience
                </label>
                <div className="flex gap-1">{renderStars(rating, true)}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {rating === 1 && 'Poor - Needs significant improvement'}
                  {rating === 2 && 'Fair - Several issues to address'}
                  {rating === 3 && 'Good - Mostly satisfactory'}
                  {rating === 4 && 'Very Good - Impressed overall'}
                  {rating === 5 && 'Excellent - Exceeding expectations!'}
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Feedback Type
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Feedback Text */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Tell Us More (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or describe any issues..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Max 500 characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Stats & Recent Feedback */}
          <div className="space-y-8">
            {/* Rating Overview */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Platform Rating</h3>

              {loadingStats ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  {/* Average Rating */}
                  <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="text-5xl font-bold text-slate-900 dark:text-white mb-2">
                      {stats.average_rating || 'N/A'}
                    </div>
                    <div className="flex justify-center mb-3">
                      {stats.average_rating ? renderStars(Math.round(stats.average_rating)) : null}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Based on {stats.total_feedback_count} {stats.total_feedback_count === 1 ? 'rating' : 'ratings'}
                    </p>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = stats[`${stars}_star_count` as keyof typeof stats] || 0
                      const percentage = stats.total_feedback_count > 0 
                        ? Math.round((count / stats.total_feedback_count) * 100)
                        : 0

                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-12 flex-shrink-0">
                            {stars} ★
                          </span>
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-10 text-right">
                            {percentage}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                  No ratings yet. Be the first to share your feedback!
                </p>
              )}
            </div>

            {/* Recent Feedback */}
            {recentFeedback.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Feedback</h3>
                <div className="space-y-4">
                  {recentFeedback.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= item.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {item.feedback_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legal Links */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Legal Information</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                For more information about how we use your data and our platform guidelines:
              </p>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy-policy" className="text-brand-600 dark:text-brand-400 hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-conditions" className="text-brand-600 dark:text-brand-400 hover:underline">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                Have a complaint? Our grievance redressal team is here to help:
              </p>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:support.flatsnfoods@gmail.com" className="text-brand-600 dark:text-brand-400 hover:underline">
                    support.flatsnfoods@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
