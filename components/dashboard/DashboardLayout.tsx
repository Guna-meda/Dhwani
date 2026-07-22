'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { useApp } from '@/lib/context/AppContext'
import { getDiscoverySummary, getBrandHealthSummary, getProductSetupState, ApiError, type SetupState } from '@/lib/api/client'
import { AlertCircle, RefreshCw, Search, Activity, Loader2, Plus, Check } from 'lucide-react'

import Sidebar from './Sidebar'
import TopBar from './TopBar'
import OverviewTab from './tabs/OverviewTab'
import PromptsTab from './tabs/PromptsTab'
import RecommendationsTab from './tabs/RecommendationsTab'
import CitationsTab from './tabs/CitationsTab'
import CompetitorsTab from './tabs/CompetitorsTab'
import ExportPdfButton from './ExportPdfButton'
import AuditPendingCard from './AuditPendingCard'

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
  // time we're here, at least one of `audits` is dashboard-ready. Local, not
  // from AppContext: summary here is scoped to whichever product route is
  // currently open, so switching products (via ProductSwitcher's
  // router.push) always lands on a fresh instance of this component with
  // the right data — no stale-summary risk.
  productId: string
  productName: string
  // THIS product's actual owning company — fetched by the parent page via
  // product.companyId / getCompany, NOT AppContext's companyId/companyName.
  // AppContext's version only ever reflects whichever company the account's
  // one-time onboarding flow resolved to; for any account with more than
  // one company, that's frequently NOT the company that owns the product
  // currently being viewed. Sourcing it from the product itself is what
  // makes "My Workspace", the product switcher, and "New product" all
  // resolve against the right (or any) company instead of a stale/empty one.
  companyId: string
  companyName: string
  // Discovery and Brand Health are independent — one can be DONE, RUNNING,
  // or still NOT_STARTED while the other is in any of those states, on the
  // same product. Both ride along here so the tab strip below can represent
  // each one honestly instead of one audit hiding or overwriting the other.
  // Initial value only — kept fresh locally afterward, see liveAudits below.
  audits: SetupState['audits']
  initialTab: AuditType
}

const AUDIT_TABS: { type: AuditType; label: string; icon: typeof Search }[] = [
  { type: 'discovery', label: 'Discovery', icon: Search },
  { type: 'brandhealth', label: 'Brand Health', icon: Activity },
]

export default function DashboardLayout({ productId, productName, companyId, companyName, audits, initialTab }: DashboardLayoutProps) {
  // role/getToken genuinely are account-level and don't vary by which
  // product is open, so those still come from AppContext. companyId/
  // companyName do NOT — see the prop comment above for why.
  const { role, getToken } = useApp()
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const [activeType, setActiveType] = useState<AuditType>(initialTab)
  const [nav, setNav] = useState<NavId>('overview')
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  // Starts from the prop, then kept fresh independently — a RUNNING audit
  // needs to flip to DONE (and NOT_STARTED-with-prompts needs to reflect a
  // just-confirmed audit) without the whole page reloading.
  const [liveAudits, setLiveAudits] = useState(audits)

  const activeAuditState = liveAudits[activeType]

  // Polls setup-state while anything is still RUNNING, so a tab currently
  // showing "running" flips over to real results on its own once the audit
  // actually finishes — no manual refresh needed, and nothing here blocks
  // navigating elsewhere in the meantime since this is just a background poll.
  useEffect(() => {
    const anyRunning = liveAudits.discovery.status === 'RUNNING' || liveAudits.brandhealth.status === 'RUNNING'
    if (!anyRunning) return

    const interval = setInterval(async () => {
      try {
        const token = await getToken()
        const state = await getProductSetupState(token, productId)
        setLiveAudits(state.audits)
      } catch {
        // Silent — this is a background refresh; a real error surfaces
        // next time the person actually interacts with the affected tab.
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [liveAudits.discovery.status, liveAudits.brandhealth.status, productId, getToken])

  // Reset summary whenever the routed product or active tab changes, so we
  // never render one audit's data for a moment while another's request is
  // in flight.
  useEffect(() => {
    setSummary(null)
    setError('')
  }, [productId, activeType])

  useEffect(() => {
    // Only DONE audits have a summary to fetch — a RUNNING or NOT_STARTED
    // tab renders its own inline state below instead of hitting the
    // summary endpoint (which would just 404-loop for nothing).
    if (summary || !productId || activeAuditState.status !== 'DONE') return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      const MAX_ATTEMPTS = 4
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const token = await getToken()
          const data =
            activeType === 'discovery'
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
  }, [summary, productId, activeType, activeAuditState.status, getToken])

  const isDiscovery = activeType === 'discovery'
  const discovery = isDiscovery ? (summary as unknown as DiscoverySummaryData | null) : null
  const brandHealth = !isDiscovery ? (summary as unknown as BrandHealthSummaryData | null) : null

  const enginesRun = (discovery?.engines_run ?? brandHealth?.engines_run ?? []) as Engine[]
  const perEngine = asRecord<DiscoveryEngineMetric | BrandHealthEngineMetric>(
    discovery?.per_engine ?? brandHealth?.per_engine
  )
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

  // Every tab switches in place now, whatever its status — the main content
  // area below picks DONE results vs. AuditPendingCard based on
  // activeAuditState. Used to navigate away to a full-page setup/progress
  // screen for RUNNING, which hid the sidebar and blocked reaching anything
  // else (Marketplace, Playground, Docs, other products) while it ran.
  function handleTabClick(type: AuditType) {
    setActiveType(type)
  }

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
      <div className="no-print contents">
        <Sidebar
          nav={nav}
          onNavChange={setNav}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          workspaceLabel={workspaceLabel}
          isAgency={isAgency}
          companyId={companyId}
          productId={productId}
          productName={productName}
          getToken={getToken}
          userLabel={userLabel}
          onSignOut={() => signOut({ redirectUrl: '/' })}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="no-print">
          <TopBar
            title={isDiscovery ? 'Discovery Audit' : 'Brand Health Audit'}
            status={discovery?.status ?? brandHealth?.status}
            createdAt={createdAt}
            loading={loading}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        </div>

        {/* Audit-type tab strip — Discovery and Brand Health are shown as
            two independent tabs, each reflecting its own state, instead of
            one silently replacing the other on this product. */}
        <div className="flex items-center gap-1 px-4 sm:px-6 lg:px-8 pt-3 border-b border-brand-border no-print">
          {AUDIT_TABS.map(({ type, label, icon: Icon }) => {
            const state = liveAudits[type]
            const isActive = type === activeType
            return (
              <button
                key={type}
                onClick={() => handleTabClick(type)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                  isActive
                    ? 'border-brand-accent text-brand-text'
                    : 'border-transparent text-brand-muted hover:text-brand-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {state.status === 'DONE' && isActive && <Check className="w-3.5 h-3.5 text-brand-accent" />}
                {state.status === 'RUNNING' && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-brand-muted">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    running
                  </span>
                )}
                {state.status === 'NOT_STARTED' && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-brand-accent">
                    <Plus className="w-3 h-3" />
                    run
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeAuditState.status !== 'DONE' ? (
            <AuditPendingCard productId={productId} auditType={activeType} state={activeAuditState} />
          ) : (
            <>
          <div className="flex justify-end no-print">
            <ExportPdfButton label={`Export ${isDiscovery ? 'Discovery' : 'Brand Health'} report as PDF`} />
          </div>
          <div className="print-content space-y-6">
          {nav === 'overview' && (
            <OverviewTab
              loading={loading}
              discovery={discovery}
              brandHealth={brandHealth}
              enginesRun={enginesRun}
              perEngine={perEngine}
              intentBreakdown={intentBreakdown}
              onNavigate={setNav}
              onOpenDocs={() => router.push('/docs')}
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
          </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
