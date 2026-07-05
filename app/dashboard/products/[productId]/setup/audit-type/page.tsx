'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { getProductSetupState, ApiError, type SetupState } from '@/lib/api/client'
import ChooseAudit from '@/components/onboarding/ChooseAudit'
import SetupBackBar from '@/components/dashboard/setup/SetupBackBar'
import { Signal, AlertCircle } from 'lucide-react'

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

// Dashboard-native setup flow, step 1 of 3. Deliberately does NOT touch
// AppContext.productId/auditType/prompts — only the onboarding gate (app/
// page.tsx) writes those. This keeps whatever dashboard is open in another
// tab untouched while this setup flow runs.
//
// Fetches current setup-state on mount so ChooseAudit can show each type's
// REAL state — a product can have Discovery done while Brand Health hasn't
// started, and this is the one place that decision surfaces before the
// user picks anything.
export default function ChooseAuditTypePage() {
  const params = useParams<{ productId: string }>()
  const productId = params.productId
  const router = useRouter()
  const { getToken } = useApp()

  const [setupState, setSetupState] = useState<SetupState | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const state = await getProductSetupState(token, productId)
        if (!cancelled) setSetupState(state)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this product.')
      }
    })()
    return () => { cancelled = true }
  }, [productId, getToken])

  let body
  if (error) {
    body = (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-9 h-9 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-brand-text">{error}</p>
        </div>
      </div>
    )
  } else if (!setupState) {
    body = <LoadingScreen />
  } else {
    body = (
      <ChooseAudit
        productId={productId}
        getToken={getToken}
        existingAudits={setupState.audits}
        onChosen={(type) => {
          router.push(`/dashboard/products/${productId}/setup/prompts?auditType=${type}`)
        }}
        onAlreadyStarted={(type, status) => {
          if (status === 'DONE') {
            // Resolver picks the right default tab from here — no need to
            // guess which one to force-open.
            router.push(`/dashboard/products/${productId}`)
          } else if (status === 'RUNNING') {
            router.push(`/dashboard/products/${productId}/setup/progress?auditType=${type}`)
          }
        }}
      />
    )
  }

  return (
    <>
      <SetupBackBar dashboardHref={`/dashboard/products/${productId}`} />
      {body}
    </>
  )
}
