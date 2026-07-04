'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useApp } from '@/lib/context/AppContext'
import LandingPage from '@/components/landing/LandingPage'
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
  const router = useRouter()
  const {
    screen,
    setScreen,
    productId,
    auditType,
    setAuditType,
    prompts,
    setPrompts,
    setSummary,
    getToken,
  } = useApp()

  // The dashboard itself only ever renders at /dashboard/products/[productId]
  // — that route is the single place setup-state is resolved, so every path
  // into a dashboard (fresh onboarding completion, product switcher,
  // deep link, browser refresh) goes through the same check. Once onboarding
  // finishes here, hand off to that route instead of rendering the dashboard
  // inline from context.
  useEffect(() => {
    if (screen === 'dashboard' && productId) {
      router.replace(`/dashboard/products/${productId}`)
    }
  }, [screen, productId, router])

  if (!isLoaded || (isSignedIn && screen === 'loading') || (screen === 'dashboard' && productId)) {
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

      {screen === 'choose-audit' && productId && (
        <ChooseAudit
          productId={productId}
          getToken={getToken}
          onChosen={(type, newPrompts) => {
            setAuditType(type)
            setPrompts(newPrompts)
            setScreen('review-prompts')
          }}
        />
      )}

      {screen === 'review-prompts' && productId && auditType && (
        <ReviewPrompts
          productId={productId}
          auditType={auditType}
          prompts={prompts}
          getToken={getToken}
          onPromptsChange={setPrompts}
          onConfirmed={() => setScreen('audit-progress')}
        />
      )}

      {screen === 'audit-progress' && productId && auditType && (
        <AuditProgress
          productId={productId}
          auditType={auditType}
          getToken={getToken}
          onDone={(s) => {
            setSummary(s)
            setScreen('dashboard')
          }}
        />
      )}

      <AuthModal />
      <UpgradeModal />
    </>
  )
}
