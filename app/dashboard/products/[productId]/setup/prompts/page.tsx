'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { initDiscovery, initBrandHealth, ApiError, type Prompt } from '@/lib/api/client'
import ReviewPrompts from '@/components/onboarding/ReviewPrompts'
import SetupBackBar from '@/components/dashboard/setup/SetupBackBar'
import { Signal, AlertCircle } from 'lucide-react'
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

// Setup step 2 of 3. auditType is carried via the URL (?auditType=), not
// AppContext or cross-page client state — that's what makes this route
// bookmarkable and safe to refresh mid-setup. Prompts themselves are
// re-fetched on mount via the (idempotent) init call rather than passed
// through the URL, since init* already returns the existing set if one was
// generated in step 1.
export default function ReviewPromptsPage() {
  const params = useParams<{ productId: string }>()
  const productId = params.productId
  const searchParams = useSearchParams()
  const auditType = searchParams.get('auditType') as AuditType | null
  const router = useRouter()
  const { getToken } = useApp()

  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  // Same self-heal as the progress page: a stale history/bfcache entry
  // without ?auditType shouldn't dead-end here — send it back through the
  // resolver, which recomputes setup-state fresh.
  useEffect(() => {
    if (!auditType) {
      router.replace(`/dashboard/products/${productId}`)
    }
  }, [auditType, productId, router])

  useEffect(() => {
    if (!auditType) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = auditType === 'discovery'
          ? await initDiscovery(token, productId)
          : await initBrandHealth(token, productId)
        if (!cancelled) { setPrompts(res.prompts); setLoaded(true) }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load prompts.')
      }
    })()
    return () => { cancelled = true }
  }, [productId, auditType, getToken])

  let body: React.ReactNode

  if (!auditType) {
    body = <LoadingScreen />
  } else if (error) {
    body = (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-9 h-9 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-brand-text">{error}</p>
        </div>
      </div>
    )
  } else if (!loaded) {
    body = <LoadingScreen />
  } else {
    body = (
      <ReviewPrompts
        productId={productId}
        auditType={auditType}
        prompts={prompts}
        getToken={getToken}
        onPromptsChange={setPrompts}
        onConfirmed={() => {
          router.push(`/dashboard/products/${productId}`)
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