import { useState, useEffect, useCallback } from 'react'

/**
 * usePersistedForm — drops form state into sessionStorage keyed by `storageKey`.
 * Automatically rehydrates on mount so that camera round-trips on mobile don't
 * wipe the form.  Call `clearPersistedForm()` when the form is submitted or closed.
 */
export function usePersistedForm<T extends object>(storageKey: string, initialState: T) {
  const [form, setFormRaw] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        return { ...initialState, ...JSON.parse(saved) }
      }
    } catch {
      // ignore parse errors
    }
    return initialState
  })

  // Persist every change
  const setForm = useCallback((updater: T | ((prev: T) => T)) => {
    setFormRaw(prev => {
      const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // storage full or unavailable — silent fail
      }
      return next
    })
  }, [storageKey])

  const clearPersistedForm = useCallback(() => {
    sessionStorage.removeItem(storageKey)
  }, [storageKey])

  return { form, setForm, clearPersistedForm }
}
