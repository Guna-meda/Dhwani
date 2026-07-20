'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { getProduct, getProductSetupState, getCompany, ApiError, type SetupState, type Product } from '@/lib/api/client'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { AlertCircle, Signal } from 'lucide-react'

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

// This is the resolver every other setup page routes back to (see the
// comments in setup/progress and setup/audit-type). Its one job: ask
// setup-state what's actually going on with this product, then either
// bounce to whichever setup step is still incomplete, or render the real
// dashboard. Nothing else in the app should assume "dashboard" is safe to
// render without going through this check first.
export default function ProductResolverPage() {
  const params = useParams<{ productId: string }>()
  const productId = params.productId
  const router = useRouter()
  const { getToken } = useApp()

  const [setupState, setSetupState] = useState<SetupState | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [companyName, setCompanyName] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const [state, prod] = await Promise.all([
          getProductSetupState(token, productId),
          getProduct(token, productId),
        ])
        if (cancelled) return

        // The account can own more than one company — this product's OWN
        // companyId (not whatever AppContext's global, onboarding-only
        // companyId happens to be pointing at right now) is the only
        // correct source for "which workspace is this." Fetching it here
        // and passing it down is what fixes My Workspace / the product
        // switcher / New Product all resolving against the wrong or empty
        // company when this account has more than one.
        getCompany(token, prod.companyId)
          .then(company => { if (!cancelled) setCompanyName(company.name) })
          .catch(() => { /* non-fatal — Sidebar falls back to "My Workspace" */ })

        // Context scrape failed — no audit can start until that's fixed.
        // Nothing to resolve into; show it directly instead of bouncing
        // into a setup step that will just fail again.
        if (state.context_status === 'FAILED') {
          setError("We couldn't analyze this product's website, so no audit can run yet.")
          return
        }

        // Either audit has progressed past choose-audit at all (queued,
        // running, or done) — that's enough to render the real dashboard.
        // DashboardLayout itself shows the right thing per-tab from here:
        // full results for DONE, an inline pending card otherwise (see
        // AuditPendingCard) — nobody has to wait for full completion to
        // reach Marketplace, Playground, Docs, or another product.
        if (state.default_view) {
          setSetupState(state)
          setProduct(prod)
          return
        }

        // default_view === null only when BOTH audits are still exactly at
        // choose-audit — genuinely nothing to resume, send them to pick one.
        router.replace(`/dashboard/products/${productId}/setup/audit-type`)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this product.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [productId, getToken, router])

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-9 h-9 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-brand-text">{error}</p>
        </div>
      </div>
    )
  }

  if (!setupState || !product) {
    return <LoadingScreen />
  }

  return (
    <DashboardLayout
      productId={productId}
      productName={product.product_name}
      companyId={product.companyId}
      companyName={companyName}
      audits={setupState.audits}
      initialTab={setupState.default_view!}
    />
  )
}