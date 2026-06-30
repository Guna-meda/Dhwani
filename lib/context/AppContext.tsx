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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken: getClerkToken } = useAuth()

  const [screen, setScreen] = useState<AppScreen>('loading')
  const [productId, setProductId] = useState<string | null>(null)
  const [auditType, setAuditType] = useState<AuditType | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [progress, setProgress] = useState<ProgressResponse | null>(null)
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [currentView, setView] = useState<DashboardView>('overview')

  const [isAuthModalOpen, setAuthModalOpen] = useState(false)
  const [authModalView, setAuthModalView] = useState<AuthModalView>('signIn')
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const getToken = useCallback(async () => {
    if (typeof window !== 'undefined' && userId) {
      window.localStorage.setItem('dhwani_dev_clerk_id', userId)
    }
    return (await getClerkToken()) ?? ''
  }, [getClerkToken, userId])

  // ── resolve which screen a returning user should see ─────────────────────
  const resolveScreenFromStatus = useCallback(
    async (status: OnboardingStatus, token: string) => {
      const { next_step, product_id } = status

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
    const token = await getToken()
    if (!token) return
    try {
      const status = await getOnboardingStatus(token)
      await resolveScreenFromStatus(status, token)
    } catch (err) {
      console.error('Failed to fetch onboarding status', err)
      setScreen('onboarding-user')
    }
  }, [getToken, resolveScreenFromStatus])

  // ── react to Clerk auth changes ───────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !userId) {
      setScreen('landing')
      setProductId(null)
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
        setProductId,
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
