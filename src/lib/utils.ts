import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy')
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'hh:mm a')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy, hh:mm a')
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function getRemainingDays(endDate: string): number {
  const end = parseISO(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function generateTokenCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'TOKEN-'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const propertyTypeLabels: Record<string, string> = {
  pg: 'PG',
  hostel: 'Hostel',
  flat: 'Flat',
  shared_room: 'Shared Room',
  private_room: 'Private Room',
}

export const mealTypeLabels: Record<string, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍪 Snack',
}

export const messStatusConfig = {
  open: { label: 'Open', color: 'badge-green', dot: '🟢' },
  busy: { label: 'Busy', color: 'badge-yellow', dot: '🟡' },
  closed: { label: 'Closed', color: 'badge-red', dot: '🔴' },
}

export const roleLabels: Record<string, string> = {
  student: 'Student',
  property_owner: 'Property Owner',
  mess_owner: 'Mess Owner',
  admin: 'Admin',
}

export function parseTimeString(timeStr: string): number | null {
  if (!timeStr) return null
  const cleaned = timeStr.trim().toUpperCase()
  const match12 = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/)
  if (match12) {
    let hours = parseInt(match12[1], 10)
    const minutes = parseInt(match12[2], 10)
    const period = match12[3]
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }
  const match24 = cleaned.match(/(\d{1,2}):(\d{2})/)
  if (match24) {
    const hours = parseInt(match24[1], 10)
    const minutes = parseInt(match24[2], 10)
    return hours * 60 + minutes
  }
  return null
}

export function isTimeInRange(rangeStr?: string | null, now: Date = new Date()): boolean {
  if (!rangeStr || !rangeStr.trim()) return false
  const parts = rangeStr.split(/[-–—]|to/i)
  if (parts.length < 2) return false
  const startMin = parseTimeString(parts[0])
  const endMin = parseTimeString(parts[1])
  if (startMin === null || endMin === null) return false

  const currentMin = now.getHours() * 60 + now.getMinutes()

  if (startMin <= endMin) {
    return currentMin >= startMin && currentMin <= endMin
  } else {
    return currentMin >= startMin || currentMin <= endMin
  }
}

export function computeMessStatus(
  dayServiceTime?: string | null,
  eveningServiceTime?: string | null,
  fallbackHours?: string | null
): 'open' | 'closed' {
  const now = new Date()
  const hasDay = Boolean(dayServiceTime && dayServiceTime.trim())
  const hasEve = Boolean(eveningServiceTime && eveningServiceTime.trim())

  if (hasDay || hasEve) {
    const inDay = hasDay && isTimeInRange(dayServiceTime, now)
    const inEve = hasEve && isTimeInRange(eveningServiceTime, now)
    return (inDay || inEve) ? 'open' : 'closed'
  }

  if (fallbackHours && fallbackHours.trim()) {
    return isTimeInRange(fallbackHours, now) ? 'open' : 'closed'
  }

  return 'open'
}

export function getMessServiceStatusDetails(
  dayServiceTime?: string | null,
  eveningServiceTime?: string | null,
  fallbackHours?: string | null
): { isOpen: boolean; status: 'open' | 'closed'; message: string } {
  const now = new Date()
  const hasDay = Boolean(dayServiceTime && dayServiceTime.trim())
  const hasEve = Boolean(eveningServiceTime && eveningServiceTime.trim())

  if (hasDay || hasEve) {
    const inDay = hasDay && isTimeInRange(dayServiceTime, now)
    const inEve = hasEve && isTimeInRange(eveningServiceTime, now)
    if (inDay) {
      return { isOpen: true, status: 'open', message: `Open now (Day Service: ${dayServiceTime})` }
    }
    if (inEve) {
      return { isOpen: true, status: 'open', message: `Open now (Evening Service: ${eveningServiceTime})` }
    }
    return {
      isOpen: false,
      status: 'closed',
      message: `Closed now (Day: ${dayServiceTime || 'N/A'}, Eve: ${eveningServiceTime || 'N/A'})`
    }
  }

  if (fallbackHours && fallbackHours.trim()) {
    const inFallback = isTimeInRange(fallbackHours, now)
    return {
      isOpen: inFallback,
      status: inFallback ? 'open' : 'closed',
      message: inFallback ? `Open (${fallbackHours})` : `Closed (${fallbackHours})`
    }
  }

  return { isOpen: true, status: 'open', message: 'Open for service' }
}
