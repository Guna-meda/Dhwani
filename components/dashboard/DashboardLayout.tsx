'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useApp } from '@/lib/context/AppContext'
import { getDiscoverySummary, getBrandHealthSummary, ApiError } from '@/lib/api/client'
import { AlertCircle, RefreshCw } from 'lucide-react'

import Sidebar from './Sidebar'
import TopBar from './TopBar'
import OverviewTab from './tabs/OverviewTab'
import PromptsTab from './tabs/PromptsTab'
import RecommendationsTab from './tabs/RecommendationsTab'
import CitationsTab from './tabs/CitationsTab'
import CompetitorsTab from './tabs/CompetitorsTab'

import { asRecord } from './utils'
import type {
  BrandHealthEngineMetric,
  BrandHealthSummaryData,
  DiscoveryEngineMetric,
  DiscoverySummaryData,
  Engine,
  NavId,
} from './types'
import type { AuditType } from '@/lib/context/AppContext'

interface DashboardLayoutProps {
  // Always supplied by app/dashboard/products/[productId]/page.tsx, which
  // resolves setup-state before ever rendering this component — so by the
  // time we're here, this product is confirmed to be fully onboarded
  // (next_step === 'dashboard'). Local, not from AppContext: summary here
  // is scoped to whichever product route is currently open, so switching
  // products (via ProductSwitcher's router.push) always lands on a fresh
  // instance of this component with the right data — no stale-summary risk.
  productId: string
  productName: string
  auditType: AuditType
}

export default function DashboardLayout({ productId, productName, auditType }: DashboardLayoutProps) {
  // companyId/companyName/role are account-level, not product-level — the
  // signed-in user's current company context, which the workspace switcher
  // (Sidebar) reads and can change via router navigation.
  const { companyId, companyName, role, getToken } = useApp()
  const { user } = useUser()
  const { signOut } = useClerk()

  const [nav, setNav] = useState<NavId>('overview')
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Reset summary whenever the routed product changes, so we never render
  // product A's data for a moment while product B's request is in flight.
  useEffect(() => {
    setSummary(null)
    setError('')
  }, [productId, auditType])

  useEffect(() => {
    if (summary || !productId || !auditType) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      const MAX_ATTEMPTS = 4
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const token = await getToken()
          const data =
            auditType === 'discovery'
              ? await getDiscoverySummary(token, productId)
              : await getBrandHealthSummary(token, productId)
          if (!cancelled) setSummary(data)
          break
        } catch (err) {
          const notReadyYet = err instanceof ApiError && err.status === 404
          if (notReadyYet && attempt < MAX_ATTEMPTS) {
            await new Promise(r => setTimeout(r, 3000))
            continue
          }
          if (!cancelled) {
            setError(err instanceof ApiError ? err.message : 'Could not load your audit results.')
          }
          break
        }
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [summary, productId, auditType, getToken])

  const isDiscovery = auditType === 'discovery'
  const discovery = isDiscovery ? (summary as unknown as DiscoverySummaryData | null) : null
  const brandHealth = !isDiscovery ? (summary as unknown as BrandHealthSummaryData | null) : null

  const enginesRun = (discovery?.engines_run ?? brandHealth?.engines_run ?? []) as Engine[]
  const perEngine = asRecord<DiscoveryEngineMetric | BrandHealthEngineMetric>(
    discovery?.per_engine ?? brandHealth?.per_engine
  )
  const status = discovery?.status ?? brandHealth?.status
  const createdAt = discovery?.createdAt ?? brandHealth?.createdAt

  const promptRows = useMemo(() => {
    if (discovery) return discovery.per_prompt ?? []
    if (brandHealth) return brandHealth.per_prompt ?? []
    return []
  }, [discovery, brandHealth])

  const intentBreakdown = useMemo(
    () => asRecord<BrandHealthEngineMetric>(brandHealth?.per_intent_category),
    [brandHealth]
  )

  const workspaceLabel = companyName || 'My Workspace'
  const isAgency = role === 'agency'
  const userLabel = user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Account'

  // ── Guard states ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-9 h-9 text-red-400 mx-auto mb-3" />
          <p className="text-base text-brand-text font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex overflow-hidden font-sans">
      <Sidebar
        nav={nav}
        onNavChange={setNav}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        workspaceLabel={workspaceLabel}
        isAgency={isAgency}
        companyId={companyId ?? ''}
        productId={productId}
        productName={productName}
        getToken={getToken}
        userLabel={userLabel}
        onSignOut={() => signOut({ redirectUrl: '/' })}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={isDiscovery ? 'Discovery Audit' : 'Brand Health Audit'}
          status={status}
          createdAt={createdAt}
          loading={loading}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {nav === 'overview' && (
            <OverviewTab
              loading={loading}
              discovery={discovery}
              brandHealth={brandHealth}
              enginesRun={enginesRun}
              perEngine={perEngine}
              intentBreakdown={intentBreakdown}
            />
          )}

          {nav === 'prompts' && <PromptsTab loading={loading} rows={promptRows} enginesRun={enginesRun} />}

          {nav === 'recommendations' && <RecommendationsTab />}

          {nav === 'citations' && (
            <CitationsTab loading={loading} isDiscovery={isDiscovery} citations={discovery?.citation_source_map ?? []} />
          )}

          {nav === 'competitors' && (
            <CompetitorsTab
              loading={loading}
              isDiscovery={isDiscovery}
              competitors={discovery?.competitor_landscape ?? []}
            />
          )}
        </main>
      </div>
    </div>
  )
}
