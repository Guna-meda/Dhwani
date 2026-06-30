'use client'

import { useUser } from '@clerk/nextjs'
import { useApp } from '@/lib/context/AppContext'
import LandingPage from '@/components/landing/LandingPage'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import AuthModal from '@/components/auth/AuthModal'
import UpgradeModal from '@/components/ui/UpgradeModal'
import UserOnboarding from '@/components/onboarding/UserOnboarding'
import CompanyOnboarding from '@/components/onboarding/CompanyOnboarding'
import ProductOnboarding from '@/components/onboarding/ProductOnboarding'
import ChooseAudit from '@/components/onboarding/ChooseAudit'
import ReviewPrompts from '@/components/onboarding/ReviewPrompts'
import AuditProgress from '@/components/onboarding/AuditProgress'
import { Signal } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="flex items-center gap-2 text-brand-muted">
        <Signal className="w-5 h-5 animate-pulse text-brand-accent" />
        <span className="text-sm font-mono">Loading…</span>
      </div>
    </div>
  )
}

export default function Page() {
  const { isLoaded, isSignedIn } = useUser()
  const { screen } = useApp()

  if (!isLoaded || (isSignedIn && screen === 'loading')) {
    return <LoadingScreen />
  }

  if (!isSignedIn) {
    return (
      <>
        <LandingPage />
        <AuthModal />
        <UpgradeModal />
      </>
    )
  }

  return (
    <>
      {screen === 'onboarding-user'    && <UserOnboarding />}
      {screen === 'onboarding-company' && <CompanyOnboarding />}
      {screen === 'onboarding-product' && <ProductOnboarding />}
      {screen === 'choose-audit'       && <ChooseAudit />}
      {screen === 'review-prompts'     && <ReviewPrompts />}
      {screen === 'audit-progress'     && <AuditProgress />}
      {screen === 'dashboard'          && <DashboardLayout />}

      <AuthModal />
      <UpgradeModal />
    </>
  )
}