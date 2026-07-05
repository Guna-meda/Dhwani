'use client'

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import AuditProgress from '@/components/onboarding/AuditProgress'
import SetupBackBar from '@/components/dashboard/setup/SetupBackBar'
import { Signal } from 'lucide-react'
import type { AuditType } from '@/lib/context/AppContext'

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

// Setup step 3 of 3. On completion we don't carry the summary forward via
// the URL or client state — we just route back to the resolver page
// (/dashboard/products/[productId]), which re-checks setup-state, sees
// next_step === 'dashboard', and renders DashboardLayout, which fetches the
// summary itself. One fewer thing to keep in sync.
export default function AuditProgressPage() {
  const params = useParams<{ productId: string }>()
  const productId = params.productId
  const searchParams = useSearchParams()
  const auditType = searchParams.get('auditType') as AuditType | null
  const router = useRouter()
  const { getToken } = useApp()

  // A stale browser history entry (e.g. the browser's back/forward cache,
  // or a bookmark from before this URL always carried ?auditType=) can land
  // here without the param. Rather than dead-ending on an error, route back
  // through the resolver — it recomputes setup-state fresh and sends the
  // user wherever they actually belong instead of leaving them stuck on a
  // page that can't render anything useful.
  useEffect(() => {
    if (!auditType) {
      router.replace(`/dashboard/products/${productId}`)
    }
  }, [auditType, productId, router])

  if (!auditType) {
    return (
      <>
        <SetupBackBar dashboardHref={`/dashboard/products/${productId}`} />
        <LoadingScreen />
      </>
    )
  }

  return (
    <>
      <SetupBackBar dashboardHref={`/dashboard/products/${productId}`} />
      <AuditProgress
        key={`${productId}-${auditType}`}
        productId={productId}
        auditType={auditType}
        getToken={getToken}
        onDone={() => {
          router.push(`/dashboard/products/${productId}`)
        }}
      />
    </>
  )
}