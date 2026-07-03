'use client'

/**
 * lib/context/AppContext.tsx
 *
 * Replaces the localStorage-based mock approach with real backend calls.
 * The context drives an onboarding state machine:
 *
 *   not signed in → landing page
 *   signed in, next_step = user    → Screen 1
 *   signed in, next_step = company → Screen 2
 *   signed in, next_step = product → Screen 3
 *   signed in, next_step = done    → Screen 4 / 5 / 6 / 7
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  ApiError,
  getBrandHealthProgress,
  getDiscoveryProgress,
  getOnboardingStatus,
  type OnboardingStatus,
  type Prompt,
  type ProgressResponse,
} from '@/lib/api/client'

// ─── screen enum ──────────────────────────────────────────────────────────────

export type AppScreen =
  | 'landing'       // not signed in
  | 'loading'       // waiting for Clerk / status check
  | 'error'         // status check failed for a reason other than "brand new user"
  | 'onboarding-user'
  | 'onboarding-company'
  | 'onboarding-product'
  | 'choose-audit'  // Screen 4
  | 'review-prompts'// Screen 5
  | 'audit-progress'// Screen 6
  | 'dashboard'     // Screen 7

export type DashboardView = 'overview' | 'audits' | 'competitors' | 'reports' | 'billing' | 'settings'
export type AuditType = 'discovery' | 'brandhealth'

type AuthModalView = 'signIn' | 'signUp'

// ─── context shape ────────────────────────────────────────────────────────────

interface AppContextType {
  // screen routing
  screen: AppScreen
  setScreen: (s: AppScreen) => void

  // product set after onboarding step 3
  productId: string | null
  setProductId: (id: string | null) => void
  productName: string | null

  // company / account info — drives the sidebar workspace switcher
  companyId: string | null
  companyName: string | null
  role: 'individual' | 'agency' | null

  // audit flow chosen on Screen 4
  auditType: AuditType | null
  setAuditType: (f: AuditType) => void

  // prompts on Screen 5
  prompts: Prompt[]
  setPrompts: (p: Prompt[]) => void

  // progress on Screen 6
  progress: ProgressResponse | null
  setProgress: (p: ProgressResponse | null) => void
  setAuditProgress: (p: ProgressResponse | null) => void

  // real summary from backend (Screen 7)
  summary: Record<string, unknown> | null
  setSummary: (s: Record<string, unknown> | null) => void

  // dashboard sub-view
  currentView: DashboardView
  setView: (v: DashboardView) => void

  // auth modal
  isAuthModalOpen: boolean
  setAuthModalOpen: (open: boolean) => void
  authModalView: AuthModalView
  setAuthModalView: (v: AuthModalView) => void

  // upgrade modal
  isUpgradeModalOpen: boolean
  setUpgradeModalOpen: (open: boolean) => void

  // helper: refresh onboarding status from server
  getToken: () => Promise<string>
  refreshOnboardingStatus: () => Promise<void>
}

// ─── context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined)

// Key used to remember "the auth modal was open, showing signIn/signUp" across
// the full-page reload that happens when an OAuth provider redirects back to
// `#/sso-callback`. Without this, the modal (and the <SignIn>/<SignUp>
// component that actually finishes the OAuth handshake) never remounts, so
// the callback is silently abandoned on the first attempt.
const AUTH_MODAL_STORAGE_KEY = 'dhwani_auth_modal_state'

function getInitialAuthModalState(): { open: boolean; view: AuthModalView } {
  if (typeof window === 'undefined') return { open: false, view: 'signIn' }

  const isSsoCallback = window.location.hash.includes('sso-callback')
  if (!isSsoCallback) return { open: false, view: 'signIn' }

  try {
    const saved = window.sessionStorage.getItem(AUTH_MODAL_STORAGE_KEY)
    if (saved === 'signIn' || saved === 'signUp') {
      return { open: true, view: saved }
    }
  } catch {
    // sessionStorage unavailable (privacy mode, etc.) — fall through
  }
  // We know we're mid-callback but don't know which flow started it;
  // signIn handles both sign-in and "sign in with this oauth account" cases.
  return { open: true, view: 'signIn' }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken: getClerkToken } = useAuth()

  const [screen, setScreen] = useState<AppScreen>('loading')
  const [productId, setProductId] = useState<string | null>(null)
  const [productName, setProductName] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [role, setRole] = useState<'individual' | 'agency' | null>(null)
  const [auditType, setAuditType] = useState<AuditType | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [progress, setProgress] = useState<ProgressResponse | null>(null)
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [currentView, setView] = useState<DashboardView>('overview')

  const [initialAuthModal] = useState(getInitialAuthModalState)
  const [isAuthModalOpen, setAuthModalOpenState] = useState(initialAuthModal.open)
  const [authModalView, setAuthModalViewState] = useState<AuthModalView>(initialAuthModal.view)
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false)

  // Wrap the raw setters so we persist "modal is open, showing X" to
  // sessionStorage — that's what survives the OAuth redirect's full reload.
  const setAuthModalView = useCallback((v: AuthModalView) => {
    setAuthModalViewState(v)
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(AUTH_MODAL_STORAGE_KEY, v)
      } catch {
        // ignore
      }
    }
  }, [])

  const setAuthModalOpen = useCallback((open: boolean) => {
    setAuthModalOpenState(open)
    if (typeof window === 'undefined') return
    try {
      if (open) {
        window.sessionStorage.setItem(AUTH_MODAL_STORAGE_KEY, authModalView)
      } else {
        window.sessionStorage.removeItem(AUTH_MODAL_STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [authModalView])

  const getToken = useCallback(async () => {
    if (typeof window !== 'undefined' && userId) {
      window.localStorage.setItem('dhwani_dev_clerk_id', userId)
    }
    return (await getClerkToken()) ?? ''
  }, [getClerkToken, userId])

  // ── resolve which screen a returning user should see ─────────────────────
  const resolveScreenFromStatus = useCallback(
    async (status: OnboardingStatus, token: string) => {
      const { next_step, product_id, product_name, company_id, company_name, role: userRole } = status

      // Account-level info is known as soon as we have a status response at
      // all, regardless of which onboarding step they're on — keep it in
      // sync every time so the sidebar always reflects the real account.
      setRole(userRole ?? null)
      setCompanyId(company_id ?? null)
      setCompanyName(company_name ?? null)
      setProductName(product_name ?? null)

      if (next_step !== 'done') {
        setScreen(`onboarding-${next_step}` as AppScreen)
        return
      }

      // Onboarding complete — we have a product
      if (product_id) {
        setProductId(product_id)
      }

      // Check whether any audit has already been confirmed and is running/done
      if (product_id) {
        let progressData: ProgressResponse | null = null

        // Try discovery first, then brandhealth
        for (const flow of ['discovery', 'brandhealth'] as AuditType[]) {
          try {
            const p = flow === 'discovery'
              ? await getDiscoveryProgress(token, product_id)
              : await getBrandHealthProgress(token, product_id)
            if (p.total > 0) {
              progressData = p
              setAuditType(flow)
              break
            }
          } catch {
            // 404 / not started — try next
          }
        }

        if (progressData) {
          if (progressData.status === 'DONE') {
            setScreen('dashboard')
          } else if (progressData.status === 'RUNNING') {
            setProgress(progressData)
            setScreen('audit-progress')
          } else {
            // IDLE with total > 0 means prompts were initialised but not confirmed
            setScreen('review-prompts')
          }
          return
        }
      }

      // No audit started yet
      setScreen('choose-audit')
    },
    []
  )

  const refreshOnboardingStatus = useCallback(async () => {
    // Wait for Clerk session to be fully ready.
    await new Promise(r => setTimeout(r, 500))

    const MAX_ATTEMPTS = 5
    const RETRY_DELAY_MS = 1200

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const token = await getToken()

      if (!token) {
        // Clerk hasn't handed us a session token yet — retry instead of
        // silently leaving `screen` stuck at 'loading' forever. This is a
        // transient Clerk-readiness issue, not evidence the account is new —
        // never map it to onboarding-user.
        if (attempt === MAX_ATTEMPTS) {
          console.error('Failed to obtain Clerk token after retries')
          setScreen('error')
          return
        }
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
        continue
      }

      try {
        const status = await getOnboardingStatus(token)
        await resolveScreenFromStatus(status, token)
        return
      } catch (err) {
        const isUserNotFound = err instanceof ApiError && err.status === 404

        if (isUserNotFound && attempt < MAX_ATTEMPTS) {
          console.warn(`Onboarding status: user not found yet, retrying (${attempt}/${MAX_ATTEMPTS})…`)
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
          continue
        }

        console.error('Failed to fetch onboarding status', err)
        // A confirmed 404 after retries genuinely means "no user record yet" —
        // onboarding-user is the right screen. Anything else (network error,
        // 500, timeout) is NOT evidence this is a new user — surface a real
        // error state with a retry option instead of silently regressing a
        // returning user back to the onboarding form.
        setScreen(isUserNotFound ? 'onboarding-user' : 'error')
        return
      }
    }
  }, [getToken, resolveScreenFromStatus])

  // ── close the auth modal the moment sign-in actually succeeds ────────────
  // This is the missing piece from before: without it, <SignIn>/<SignUp>
  // stays mounted after a successful OAuth sign-in (because nothing ever
  // toggles isAuthModalOpen back to false), and Clerk itself then refuses to
  // render it — "<SignIn/> cannot render when a user is already signed in" —
  // and force-navigates via its own afterSignIn redirect. That extra,
  // uncontrolled redirect is what was bouncing people back to the landing
  // page. Closing the modal as soon as we're signed in prevents it entirely.
  useEffect(() => {
    if (!isSignedIn) return

    setAuthModalOpenState(false)

    if (typeof window === 'undefined') return
    try {
      window.sessionStorage.removeItem(AUTH_MODAL_STORAGE_KEY)
    } catch {
      // ignore
    }
    if (window.location.hash.includes('sso-callback')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [isSignedIn])

  // ── react to Clerk auth changes ───────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !userId) {
      setScreen('landing')
      setProductId(null)
      setProductName(null)
      setCompanyId(null)
      setCompanyName(null)
      setRole(null)
      setAuditType(null)
      setPrompts([])
      setProgress(null)
      setSummary(null)
      return
    }

    // Signed in — check where they are in onboarding
    refreshOnboardingStatus()
  }, [isLoaded, isSignedIn, userId, refreshOnboardingStatus])

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        productId,
        productName,
        setProductId,
        companyId,
        companyName,
        role,
        auditType,
        setAuditType,
        prompts,
        setPrompts,
        progress,
        setProgress,
        setAuditProgress: setProgress,
        summary,
        setSummary,
        currentView,
        setView,
        isAuthModalOpen,
        setAuthModalOpen,
        authModalView,
        setAuthModalView,
        isUpgradeModalOpen,
        setUpgradeModalOpen,
        getToken,
        refreshOnboardingStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}