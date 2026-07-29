import type { Session, User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '../types'
//bbfa
const LOCAL_AUTH_STORAGE_KEY = 'flatsnfoods-local-auth'

interface LocalAuthAccount {
  email: string
  password: string
  fullName: string
  phone: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

interface LocalAuthState {
  currentEmail: string | null
  accounts: LocalAuthAccount[]
}

function readState(): LocalAuthState {
  if (typeof window === 'undefined') {
    return { currentEmail: null, accounts: [] }
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY)
    if (!raw) return { currentEmail: null, accounts: [] }
    const parsed = JSON.parse(raw) as Partial<LocalAuthState>
    return {
      currentEmail: parsed.currentEmail ?? null,
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
    }
  } catch {
    return { currentEmail: null, accounts: [] }
  }
}

function writeState(state: LocalAuthState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(state))
}

function buildLocalUser(account: LocalAuthAccount): User {
  return {
    id: `local-${account.email}`,
    app_metadata: {},
    user_metadata: {
      full_name: account.fullName,
      phone: account.phone,
      role: account.role,
    },
    aud: 'authenticated',
    created_at: account.createdAt,
    confirmed_at: account.createdAt,
    email: account.email,
    phone: account.phone || undefined,
    last_sign_in_at: account.updatedAt,
    role: 'authenticated',
    identities: [],
    factors: [],
    is_anonymous: false,
  } as User
}

function buildLocalSession(user: User): Session {
  return {
    access_token: `local-access-${user.id}`,
    refresh_token: `local-refresh-${user.id}`,
    expires_in: 60 * 60 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    token_type: 'bearer',
    user,
  } as Session
}

function buildProfile(account: LocalAuthAccount): Profile {
  return {
    id: `local-${account.email}`,
    email: account.email,
    full_name: account.fullName,
    phone: account.phone,
    role: account.role,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
  }
}

export function upsertLocalAccount(input: {
  email: string
  password: string
  fullName: string
  phone: string
  role: UserRole
}) {
  const state = readState()
  const now = new Date().toISOString()
  const normalizedEmail = input.email.trim().toLowerCase()
  const existingAccount = state.accounts.find((item) => item.email === normalizedEmail)

  const account: LocalAuthAccount = {
    email: normalizedEmail,
    password: input.password,
    fullName: input.fullName,
    phone: input.phone,
    role: input.role,
    createdAt: existingAccount?.createdAt ?? now,
    updatedAt: now,
  }

  const nextAccounts = state.accounts.filter((item) => item.email !== normalizedEmail)
  nextAccounts.push(account)

  writeState({
    currentEmail: normalizedEmail,
    accounts: nextAccounts,
  })

  return getLocalAuthSnapshot(normalizedEmail)
}

export function authenticateLocalAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const state = readState()
  const account = state.accounts.find((item) => item.email === normalizedEmail && item.password === password)
  if (!account) return null

  writeState({
    currentEmail: normalizedEmail,
    accounts: state.accounts,
  })

  return getLocalAuthSnapshot(normalizedEmail)
}

export function getLocalAuthSnapshot(email?: string) {
  const state = readState()
  const targetEmail = email?.trim().toLowerCase() ?? state.currentEmail
  if (!targetEmail) return null

  const account = state.accounts.find((item) => item.email === targetEmail)
  if (!account) return null

  const user = buildLocalUser(account)
  return {
    user,
    session: buildLocalSession(user),
    profile: buildProfile(account),
  }
}

export function getCurrentLocalAuthSnapshot() {
  return getLocalAuthSnapshot()
}

export function clearLocalAuth() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY)
}

export function clearSupabaseAuthStorage() {
  if (typeof window === 'undefined') return

  const keysToRemove = Object.keys(window.localStorage).filter(
    (key) => (key.startsWith('sb-') && key.endsWith('-auth-token')) || key === 'supabase.auth.token'
  )

  keysToRemove.forEach((key) => window.localStorage.removeItem(key))
}
