'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import AuditProgress from '@/components/onboarding/AuditProgress'
import SetupBackBar from '@/components/dashboard/setup/SetupBackBar'
import { AlertCircle } from 'lucide-react'
import type { AuditType } from '@/lib/context/AppContext'

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

  if (!auditType) {
    return (
      <>
        <SetupBackBar dashboardHref={`/dashboard/products/${productId}`} />
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <AlertCircle className="w-9 h-9 text-brand-muted mx-auto mb-3" />
            <p className="text-sm text-brand-text">Missing audit type — go back and choose one.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SetupBackBar dashboardHref={`/dashboard/products/${productId}`} />
      <AuditProgress
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
