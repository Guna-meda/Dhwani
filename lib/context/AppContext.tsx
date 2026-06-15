'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Audit, DashboardView } from '@/lib/types'
import { generateCustomAudit, BASELINE_DEMO_AUDIT } from '@/lib/data/mockAudits'

type AuthModalView = 'signIn' | 'signUp'

interface AppContextType {
  audits: Audit[]
  freeAuditsRemaining: number
  currentView: DashboardView
  setView: (view: DashboardView) => void
  triggerAudit: (
    businessName: string,
    category: string,
    city: string
  ) => Promise<{ success: boolean; audit?: Audit; error?: string }>
  isAuthModalOpen: boolean
  setAuthModalOpen: (open: boolean) => void
  authModalView: AuthModalView
  setAuthModalView: (view: AuthModalView) => void
  isUpgradeModalOpen: boolean
  setUpgradeModalOpen: (open: boolean) => void
  onboardingData: { businessName: string; category: string; city: string } | null
  setOnboardingData: (data: { businessName: string; category: string; city: string } | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser()
  const [audits, setAudits] = useState<Audit[]>([])
  const [freeAuditsRemaining, setFreeAuditsRemaining] = useState<number>(1)
  const [currentView, setView] = useState<DashboardView>('overview')

  // Modals
  const [isAuthModalOpen, setAuthModalOpen] = useState(false)
  const [authModalView, setAuthModalView] = useState<AuthModalView>('signIn')
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [onboardingData, setOnboardingData] = useState<{
    businessName: string
    category: string
    city: string
  } | null>(null)

  const clerkUser = useMemo(() => (isLoaded && isSignedIn ? user : null), [isLoaded, isSignedIn, user])

  // Load state from localStorage and react to Clerk auth state.
  useEffect(() => {
    if (!isLoaded) {
      return
    }
    if (!isSignedIn) {
      localStorage.removeItem('dhwani_audits')
      localStorage.removeItem('dhwani_free_count')
      setAudits([BASELINE_DEMO_AUDIT])
      setFreeAuditsRemaining(1)
      setAuthModalOpen(false)
      setAuthModalView('signIn')
      return
    }

    const savedAudits = localStorage.getItem('dhwani_audits')
    const savedCount = localStorage.getItem('dhwani_free_count')

    setAudits(savedAudits ? JSON.parse(savedAudits) : [BASELINE_DEMO_AUDIT])
    setFreeAuditsRemaining(savedCount !== null ? Number(savedCount) : 1)
    setAuthModalOpen(false)

    if (onboardingData) {
      const generated = generateCustomAudit(
        onboardingData.businessName,
        onboardingData.category,
        onboardingData.city
      )
      const updatedAudits = [generated]
      setAudits(updatedAudits)
      localStorage.setItem('dhwani_audits', JSON.stringify(updatedAudits))
      setFreeAuditsRemaining(0)
      localStorage.setItem('dhwani_free_count', '0')
      setOnboardingData(null)
      setView('overview')
    }
  }, [isLoaded, isSignedIn, onboardingData, setAuthModalOpen, setAuthModalView, setOnboardingData, setView])

  const triggerAudit = async (
    businessName: string,
    category: string,
    city: string
  ): Promise<{ success: boolean; audit?: Audit; error?: string }> => {
    if (!clerkUser) {
      setOnboardingData({ businessName, category, city })
      setAuthModalView('signIn')
      setAuthModalOpen(true)
      return { success: false, error: 'Auth required' }
    }

    if (freeAuditsRemaining <= 0) {
      setUpgradeModalOpen(true)
      return { success: false, error: 'Paywall triggered' }
    }

    const newAudit = generateCustomAudit(businessName, category, city)
    const updatedAudits = [newAudit, ...audits.filter((a) => a.id !== 'demo-acme-seo')]
    setAudits(updatedAudits)
    localStorage.setItem('dhwani_audits', JSON.stringify(updatedAudits))

    const remaining = freeAuditsRemaining - 1
    setFreeAuditsRemaining(remaining)
    localStorage.setItem('dhwani_free_count', String(remaining))

    return { success: true, audit: newAudit }
  }

  return (
    <AppContext.Provider
      value={{
        audits,
        freeAuditsRemaining,
        currentView,
        setView,
        triggerAudit,
        isAuthModalOpen,
        setAuthModalOpen,
        authModalView,
        setAuthModalView,
        isUpgradeModalOpen,
        setUpgradeModalOpen,
        onboardingData,
        setOnboardingData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
