import React, { useState, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

export default function QRScanPage() {
  const { profile } = useAuthStore()
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [status, setStatus] = useState<'scanning' | 'processing' | 'success' | 'error'>('scanning')
  const [message, setMessage] = useState('')
  const [mealType, setMealType] = useState('')
  const [camError, setCamError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [myMesses, setMyMesses] = useState<{ mess_id: string, messes: { name: string } }[]>([])
  const [tokenData, setTokenData] = useState<{
    messName: string;
    timestamp: string;
    userName: string;
    mealsLeft: number;
    colorIndex: number;
    mealType?: string;
  } | null>(null)

  useEffect(() => {
    if (profile) {
      // Check for saved token
      const savedToken = localStorage.getItem(`meal_token_${profile.id}`)
      if (savedToken) {
        try {
          const parsed = JSON.parse(savedToken)
          if (parsed && parsed.mealsLeft > 0) {
            setTokenData(parsed)
            if (parsed.mealType) setMealType(parsed.mealType)
            setStatus('success')
          } else {
            localStorage.removeItem(`meal_token_${profile.id}`)
          }
        } catch (e) {
          localStorage.removeItem(`meal_token_${profile.id}`)
        }
      }

      supabase.from('student_subscriptions')
        .select('mess_id, messes(name)')
        .eq('student_id', profile.id)
        .eq('status', 'active')
        .then(({ data }: any) => {
          if (data) setMyMesses(data as any)
        })
    }
  }, [profile])

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    if (status === 'scanning') {
      setCamError('');
      // Delay prevents React StrictMode double-initialization clash
      const timer = setTimeout(() => {
        if (!isMounted) return;

        try {
          html5QrCode = new Html5Qrcode("reader");
          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 5, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              if (html5QrCode?.isScanning) {
                html5QrCode.stop().then(() => html5QrCode?.clear()).catch(() => { })
              }
              setScanResult(decodedText)
              setStatus('processing')
            },
            () => { } // ignore frame errors
          ).catch(() => {
            if (isMounted) setCamError("Please allow camera permissions in your browser to scan the QR code.")
          });
        } catch (e) {
          console.error("QR Init Error:", e)
        }
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (html5QrCode?.isScanning) {
          html5QrCode.stop().then(() => html5QrCode?.clear()).catch(() => { })
        }
      }
    }
  }, [status])

  useEffect(() => {
    if (status === 'processing' && scanResult) {
      processScan(scanResult)
    }
  }, [status, scanResult])

  const processScan = async (qrTokenOrMessId: string) => {
    try {
      if (!profile) throw new Error('User not found')

      let actualMessId = qrTokenOrMessId;
      const { data: messMatch } = await supabase
        .from('messes')
        .select('id')
        .eq('qr_token', qrTokenOrMessId)
        .maybeSingle();

      if (messMatch && messMatch.id) {
        actualMessId = messMatch.id;
      }

      // Check if the user has an active subscription to this mess
      const { data: sub, error: subError } = await supabase
        .from('student_subscriptions')
        .select('*, messes(name)')
        .eq('student_id', profile.id)
        .eq('mess_id', actualMessId)
        .eq('status', 'active')
        .maybeSingle()

      if (subError || !sub) {
        throw new Error('No active meal plan found for this mess.')
      }

      if (sub.remaining_days !== undefined && sub.remaining_days <= 0) {
        throw new Error('Insufficient meals. Your meal balance is 0. Please renew your plan.')
      }

      // Determine current meal
      const hour = new Date().getHours()
      let currentMeal = ''
      if (hour >= 6 && hour < 11) currentMeal = 'breakfast'
      else if (hour >= 11 && hour < 16) currentMeal = 'lunch'
      else if (hour >= 16 && hour < 19) currentMeal = 'snack'
      else currentMeal = 'dinner'

      setMealType(currentMeal)

      const todayStr = new Date().toISOString().split('T')[0]

      // Fetch plan's daily limit
      let dailyLimit: number | null = null;
      if (sub.plan_id) {
        const { data: planData } = await supabase
          .from('mess_plans')
          .select('daily_scan_limit')
          .eq('id', sub.plan_id)
          .maybeSingle();
        if (planData && planData.daily_scan_limit) {
          dailyLimit = planData.daily_scan_limit;
        }
      }

      // Check attendance
      const { data: attendance, error: attError } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('student_id', profile.id)
        .eq('mess_id', actualMessId)
        .eq('date', todayStr)
        .maybeSingle()

      if (attendance) {
        if ((attendance as any)[currentMeal]) {
          throw new Error(`You have already checked in for ${currentMeal} today!`)
        }

        let scansToday = 0;
        if ((attendance as any).breakfast) scansToday++;
        if ((attendance as any).lunch) scansToday++;
        if ((attendance as any).snack) scansToday++;
        if ((attendance as any).dinner) scansToday++;

        if (dailyLimit !== null && scansToday >= dailyLimit) {
          throw new Error(`Daily scan limit reached (${dailyLimit} meals/day). You cannot scan anymore today.`)
        }
      }

      // Mark attendance
      if (attendance) {
        const { error: updateError } = await supabase
          .from('student_attendance')
          .update({ [currentMeal]: true })
          .eq('id', attendance.id)
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('student_attendance')
          .insert({
            id: `att-${Date.now()}`,
            student_id: profile.id,
            mess_id: actualMessId,
            date: todayStr,
            [currentMeal]: true
          })
        if (insertError) throw insertError;
      }

      // Try to decrement remaining days/meals if column exists
      let newRemaining = sub.remaining_days;
      try {
        if (sub.remaining_days !== undefined && sub.remaining_days > 0) {
          newRemaining = sub.remaining_days - 1;
          const updatePayload: any = { remaining_days: newRemaining };
          if (newRemaining <= 0) {
            updatePayload.status = 'expired';
          }
          const { error: subUpdateError } = await supabase
            .from('student_subscriptions')
            .update(updatePayload)
            .eq('id', sub.id)
          if (subUpdateError) console.error('Error updating remaining days:', subUpdateError);
        }
      } catch (e) {
        console.error('Exception updating remaining days:', e);
      }

      const now = new Date();
      // Calculate day index for color cycling (0 to 6)
      // Since interval is 7 days, we can just use the day of the year or time in days
      const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
      const colorIndex = daysSinceEpoch % 7;

      const tokenPayload = {
        messName: sub.messes?.name || 'Mess',
        timestamp: now.toLocaleString(),
        userName: profile.full_name,
        mealsLeft: newRemaining !== undefined ? newRemaining : 0,
        colorIndex,
        mealType: currentMeal,
      }

      setTokenData(tokenPayload)
      localStorage.setItem(`meal_token_${profile.id}`, JSON.stringify(tokenPayload))

      setStatus('success')
    } catch (error: any) {
      setMessage(error.message || 'Invalid QR Code or Scan Error')
      setStatus('error')
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setStatus('scanning')
    setMessage('')
    setTokenData(null)
  }

  const tokenColors = [
    'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-500',
    'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-500',
    'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-500',
    'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-500',
    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-500',
    'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-500',
    'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-500',
  ];

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Mess QR Scanner</h1>
        <p className="text-slate-500 text-sm mt-1">Scan the mess QR code to mark your attendance</p>
      </div>

      <AnimatePresence mode="wait">
        {status === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="card p-4 overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-800">
              <div id="reader" className="w-full rounded-2xl overflow-hidden bg-black min-h-[300px] flex items-center justify-center" />
            </div>

            {camError ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center border border-red-200 dark:border-red-800/50">
                ⚠️ {camError}
              </div>
            ) : (
              <p className="text-center text-xs text-slate-500 mt-4">Point your camera at the mess QR code</p>
            )}
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-4"
            >
              <QrCode className="w-10 h-10 text-brand-600" />
            </motion.div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Verifying...</h3>
            <p className="text-slate-500 text-sm">Checking your active meal plan</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2"
            >
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Check-in Successful!</h3>

            {tokenData && (
              <div className={`mt-6 mb-6 p-6 rounded-2xl border-2 text-left relative overflow-hidden ${tokenColors[tokenData.colorIndex]}`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-5 rounded-bl-full pointer-events-none"></div>
                <h4 className="font-display text-xl font-bold mb-4 border-b border-current/20 pb-2">
                  Meal Token
                </h4>
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span className="opacity-80">Mess Name:</span>
                    <span className="font-semibold">{tokenData.messName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="opacity-80">Student Name:</span>
                    <span className="font-semibold">{tokenData.userName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="opacity-80">Meal Type:</span>
                    <span className="font-semibold capitalize">{mealType}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="opacity-80">Time:</span>
                    <span className="font-semibold">{tokenData.timestamp}</span>
                  </p>
                  <p className="flex justify-between pt-2 mt-2 border-t border-current/20">
                    <span className="opacity-80 font-medium">Meals Left:</span>
                    <span className="font-bold text-lg">{tokenData.mealsLeft}</span>
                  </p>
                </div>
              </div>
            )}

            <button onClick={resetScanner} className="btn-secondary w-full justify-center mt-4">
              <RefreshCw className="w-4 h-4 mr-2" /> Scan Again
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h3>
            <p className="text-red-500 text-sm font-medium">{message}</p>
            <button onClick={resetScanner} className="btn-primary w-full justify-center">
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
