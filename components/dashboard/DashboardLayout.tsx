'use client'

import { useEffect, useMemo, useState } from 'react'
import { UserButton, useUser, useClerk } from '@clerk/nextjs'
import { useApp } from '@/lib/context/AppContext'
import {
  getDiscoverySummary,
  getBrandHealthSummary,
  ApiError,
} from '@/lib/api/client'
import {
  Signal,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  Quote,
  Users,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Plus,
  LogOut,
  RefreshCw,
  Menu,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Real backend shapes — mirrors models/discoverySummary.model.js and
// models/brandhealthsummary.model.js exactly.
// ─────────────────────────────────────────────────────────────────────────────

type Engine = 'chatgpt' | 'perplexity' | 'gemini'

const ENGINE_META: Record<Engine, { label: string; color: string }> = {
  chatgpt:    { label: 'ChatGPT',    color: '#2AA198' },
  perplexity: { label: 'Perplexity', color: '#8EE6DD' },
  gemini:     { label: 'Gemini',     color: '#1F7A72' },
}

const INTENT_LABELS: Record<string, string> = {
  pricing:              'Pricing',
  feature_integration:  'Features & Integration',
  reputation:           'Reputation',
  comparison:            'Comparison',
  legitimacy:            'Legitimacy',
}

const SENTIMENT_META: Record<string, { label: string; className: string }> = {
  recommended: { label: 'Recommended', className: 'text-brand-accent bg-brand-accent/10 border-brand-accent/30' },
  mentioned:   { label: 'Mentioned',   className: 'text-brand-primary bg-brand-primary/10 border-brand-primary/30' },
  not_found:   { label: 'Not found',   className: 'text-brand-muted bg-brand-card border-brand-border' },
  negative:    { label: 'Negative',    className: 'text-red-300 bg-red-950/30 border-red-900/40' },
}

const COMPETITOR_LIMIT_OPTIONS = [10, 15, 20, 30, 50, 'all'] as const
type CompetitorLimit = typeof COMPETITOR_LIMIT_OPTIONS[number]

interface DiscoveryEngineMetric {
  total_prompts?: number
  mentioned_count?: number
  mention_rate_pct?: number
  avg_position?: number | null
}

interface DiscoveryPerPrompt {
  promptId: string
  prompt_text: string
  engine: Engine
  mentioned: boolean
  position: number | null
  raw_text: string | null
}

interface CompetitorEntry {
  name: string
  appearances: number
  avg_mention_rank: number
  engines_seen_in: Engine[]
}

interface CitationEntry {
  domain: string
  citation_count: number
  citation_share_pct: number
}

interface DiscoverySummaryData {
  engines_run: Engine[]
  combined: DiscoveryEngineMetric
  per_engine: Record<string, DiscoveryEngineMetric>
  per_prompt: DiscoveryPerPrompt[]
  competitor_landscape: CompetitorEntry[]
  citation_source_map: CitationEntry[]
  status: 'PARTIAL' | 'COMPLETE'
  createdAt?: string
}

interface BrandHealthEngineMetric {
  prompts_run?: number
  mentioned_count?: number
  not_found_count?: number
  mention_rate_pct?: number
}

interface BrandHealthPerPrompt {
  promptId: string
  prompt_text: string
  intent_category: string | null
  engine: Engine
  mentioned: boolean
  sentiment: string | null
  raw_text: string | null
}

interface BrandHealthSummaryData {
  engines_run: Engine[]
  combined: BrandHealthEngineMetric
  per_engine: Record<string, BrandHealthEngineMetric>
  per_intent_category: Record<string, BrandHealthEngineMetric>
  per_prompt: BrandHealthPerPrompt[]
  status: 'PARTIAL' | 'COMPLETE'
  createdAt?: string
}

function asRecord<T>(value: unknown): Record<string, T> {
  if (!value) return {}
  if (value instanceof Map) return Object.fromEntries(value as Map<string, T>)
  if (typeof value === 'object') return value as Record<string, T>
  return {}
}

function pct(n: number | undefined | null): string {
  return `${Math.round(n ?? 0)}%`
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function groupByPrompt<T extends { promptId: string; prompt_text: string; engine: Engine }>(
  rows: T[]
) {
  const map = new Map<string, { prompt_text: string; byEngine: Partial<Record<Engine, T>> }>()
  for (const row of rows) {
    if (!map.has(row.promptId)) {
      map.set(row.promptId, { prompt_text: row.prompt_text, byEngine: {} })
    }
    map.get(row.promptId)!.byEngine[row.engine] = row
  }
  return Array.from(map.entries()).map(([promptId, v]) => ({ promptId, ...v }))
}

// ── Small reusable UI bits ────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-brand-card rounded-lg ${className}`} />
}

function MentionBadge({ mentioned }: { mentioned: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${
        mentioned
          ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent'
          : 'bg-brand-card border-brand-border text-brand-muted'
      }`}
    >
      {mentioned ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {mentioned ? 'Yes' : 'No'}
    </span>
  )
}

type NavId = 'overview' | 'prompts' | 'recommendations' | 'citations' | 'competitors'

const NAV_ITEMS: { id: NavId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'prompts', label: 'Prompts', icon: MessageSquareText },
  { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
  { id: 'citations', label: 'Citations', icon: Quote },
  { id: 'competitors', label: 'Competitors', icon: Users },
]

export default function DashboardLayout() {
  const {
    productId,
    productName,
    companyName,
    role,
    auditType,
    summary,
    setSummary,
    getToken,
  } = useApp()
  const { user } = useUser()
  const { signOut } = useClerk()

  const [nav, setNav] = useState<NavId>('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null)
  const [competitorLimit, setCompetitorLimit] = useState<CompetitorLimit>(10)

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [productMenuOpen, setProductMenuOpen] = useState(false)

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
          const data = auditType === 'discovery'
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
    return () => { cancelled = true }
  }, [summary, productId, auditType, getToken, setSummary])

  const isDiscovery = auditType === 'discovery'
  const discovery = isDiscovery ? (summary as unknown as DiscoverySummaryData | null) : null
  const brandHealth = !isDiscovery ? (summary as unknown as BrandHealthSummaryData | null) : null

  const enginesRun = (discovery?.engines_run ?? brandHealth?.engines_run ?? []) as Engine[]
  const combined = discovery?.combined ?? brandHealth?.combined
  const perEngine = asRecord<DiscoveryEngineMetric | BrandHealthEngineMetric>(
    discovery?.per_engine ?? brandHealth?.per_engine
  )
  const status = discovery?.status ?? brandHealth?.status
  const createdAt = discovery?.createdAt ?? brandHealth?.createdAt

  const groupedPrompts = useMemo(() => {
    if (discovery) return groupByPrompt(discovery.per_prompt ?? [])
    if (brandHealth) return groupByPrompt(brandHealth.per_prompt ?? [])
    return []
  }, [discovery, brandHealth])

  const intentBreakdown = useMemo(
    () => asRecord<BrandHealthEngineMetric>(brandHealth?.per_intent_category),
    [brandHealth]
  )

  const sortedCompetitors = useMemo(() => {
    const list = discovery?.competitor_landscape ?? []
    return [...list].sort((a, b) => b.appearances - a.appearances)
  }, [discovery])

  const visibleCompetitors = competitorLimit === 'all'
    ? sortedCompetitors
    : sortedCompetitors.slice(0, competitorLimit)

  const workspaceLabel = companyName || 'My Workspace'
  const isAgency = role === 'agency'

  // ── Guard / loading / error states ─────────────────────────────────────

  if (!productId || !auditType) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-8 h-8 text-brand-muted mx-auto mb-3" />
          <p className="text-sm text-brand-text font-medium">No active audit found</p>
          <p className="text-xs text-brand-muted mt-1">
            Something's missing from your session — try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-brand-text font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-accent hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  const mentionRate = combined?.mention_rate_pct ?? 0
  const totalPrompts = combined && ('total_prompts' in combined ? combined.total_prompts : combined.prompts_run)
  const mentionedCount = combined?.mentioned_count ?? 0

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex overflow-hidden font-sans">

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR — fixed drawer on mobile, static column on desktop */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-72 bg-brand-surface border-r border-brand-border shrink-0 z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between gap-2.5 px-5 border-b border-brand-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-bg border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <Signal className="w-3.5 h-3.5" />
            </div>
            <span className="font-display font-semibold text-sm tracking-tight text-brand-text">Dhwani</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1 text-brand-muted hover:text-brand-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">

          {/* Workspace switcher */}
          <div className="relative mb-5 px-1">
            <button
              onClick={() => isAgency && setWorkspaceMenuOpen(o => !o)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-brand-border bg-brand-bg/60 ${
                isAgency ? 'hover:bg-brand-card cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-accent shrink-0">
                {workspaceLabel.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="block text-[9px] font-mono text-brand-muted uppercase leading-none mb-0.5">
                  Workspace
                </span>
                <span className="block text-xs font-semibold text-brand-text truncate">
                  {workspaceLabel}
                </span>
              </div>
              {isAgency && <ChevronsUpDown className="w-3.5 h-3.5 text-brand-muted shrink-0" />}
            </button>

            {isAgency && workspaceMenuOpen && (
              <div className="absolute left-1 right-1 mt-1.5 bg-brand-surface border border-brand-border rounded-lg shadow-xl z-10 overflow-hidden">
                <div className="px-3 py-2 flex items-center gap-2.5 bg-brand-primary/5">
                  <div className="w-5 h-5 rounded bg-brand-primary/20 flex items-center justify-center text-[9px] font-bold text-brand-accent">
                    {workspaceLabel.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-brand-text font-medium truncate">{workspaceLabel}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent ml-auto shrink-0" />
                </div>
                <button
                  disabled
                  title="Multiple workspaces are coming soon"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-muted/50 cursor-not-allowed border-t border-brand-border"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New workspace
                  <span className="ml-auto text-[9px] font-mono uppercase border border-brand-border rounded px-1 py-0.5">Soon</span>
                </button>
              </div>
            )}
          </div>

          <span className="block px-3 text-[9px] font-mono text-brand-muted uppercase tracking-wider mb-2">
            Brand Report
          </span>

          {/* Product switcher */}
          <div className="relative mb-1 px-1">
            <button
              onClick={() => setProductMenuOpen(o => !o)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-brand-card/60 text-left"
            >
              <div className="w-5 h-5 rounded bg-brand-card border border-brand-border flex items-center justify-center text-[9px] font-bold text-brand-muted shrink-0">
                {(productName || 'P').charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-xs font-semibold text-brand-text truncate">
                {productName || 'Your product'}
              </span>
              {productMenuOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-brand-muted shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-brand-muted shrink-0" />
              )}
            </button>

            {productMenuOpen && (
              <div className="mt-1.5 bg-brand-bg/60 border border-brand-border rounded-lg mb-2 overflow-hidden">
                <button
                  disabled
                  title="Multiple products are coming soon"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-muted/50 cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New product
                  <span className="ml-auto text-[9px] font-mono uppercase border border-brand-border rounded px-1 py-0.5">Soon</span>
                </button>
              </div>
            )}
          </div>

          {/* Report nav */}
          <nav className="space-y-0.5 mb-6">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const isActive = nav === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { setNav(item.id); setMobileSidebarOpen(false) }}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-accent'
                      : 'text-brand-muted hover:text-brand-text hover:bg-brand-card/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-brand-border shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <UserButton />
            <div className="flex-1 min-w-0 truncate">
              <span className="block text-xs font-semibold text-brand-text truncate">
                {user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Account'}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="w-full flex items-center gap-2 px-2 py-2 text-xs text-brand-muted hover:text-brand-text hover:bg-brand-card rounded-lg transition-colors mt-0.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-brand-border bg-brand-surface flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 text-brand-muted hover:text-brand-text rounded-md hover:bg-brand-card"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-display font-semibold text-brand-text truncate">
                {isDiscovery ? 'Discovery Audit' : 'Brand Health Audit'}
              </h1>
              {!loading && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                    status === 'COMPLETE'
                      ? 'text-brand-accent bg-brand-accent/10 border-brand-accent/25'
                      : 'text-yellow-300 bg-yellow-950/20 border-yellow-900/30'
                  }`}>
                    {status === 'COMPLETE' ? 'Complete' : 'Partial'}
                  </span>
                  {createdAt && (
                    <span className="hidden sm:flex items-center gap-1 text-[10px] text-brand-muted font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(createdAt)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <UserButton />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

          {/* OVERVIEW */}
          {nav === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  <>
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                  </>
                ) : (
                  <>
                    <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
                      <span className="text-[10px] font-mono text-brand-muted uppercase">Mention rate</span>
                      <span className="block text-3xl font-bold text-brand-accent text-glow mt-2">{pct(mentionRate)}</span>
                      <div className="text-[10px] text-brand-muted mt-3 font-mono">
                        Across {enginesRun.length} model{enginesRun.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
                      <span className="text-[10px] font-mono text-brand-muted uppercase">Prompts run</span>
                      <span className="block text-3xl font-bold text-brand-text mt-2">{totalPrompts ?? '—'}</span>
                      <div className="text-[10px] text-brand-muted mt-3 font-mono">
                        {mentionedCount} mentioned you
                      </div>
                    </div>

                    {discovery ? (
                      <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
                        <span className="text-[10px] font-mono text-brand-muted uppercase">Avg. mention position</span>
                        <span className="block text-3xl font-bold text-brand-text mt-2">
                          {discovery.combined?.avg_position != null ? `#${Math.round(discovery.combined.avg_position)}` : '—'}
                        </span>
                        <div className="text-[10px] text-brand-muted mt-3 font-mono">
                          Among listed recommendations
                        </div>
                      </div>
                    ) : (
                      <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
                        <span className="text-[10px] font-mono text-brand-muted uppercase">Not mentioned</span>
                        <span className="block text-3xl font-bold text-brand-text mt-2">
                          {brandHealth?.combined?.not_found_count ?? 0}
                        </span>
                        <div className="text-[10px] text-brand-muted mt-3 font-mono">
                          Out of {totalPrompts ?? 0} prompts
                        </div>
                      </div>
                    )}

                    <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
                      <span className="text-[10px] font-mono text-brand-muted uppercase">
                        {discovery ? 'Competitors found' : 'Categories tracked'}
                      </span>
                      <span className="block text-3xl font-bold text-brand-text mt-2">
                        {discovery ? (discovery.competitor_landscape?.length ?? 0) : Object.keys(intentBreakdown).length}
                      </span>
                      <div className="text-[10px] text-brand-muted mt-3 font-mono">
                        {discovery ? 'Mentioned alongside you' : 'Intent angles tested'}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                <h3 className="text-sm font-medium text-brand-text mb-4">Mention rate by model</h3>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6" />
                    <Skeleton className="h-6" />
                    <Skeleton className="h-6" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enginesRun.length === 0 && (
                      <p className="text-xs text-brand-muted">No per-model data available.</p>
                    )}
                    {enginesRun.map(engine => {
                      const meta = ENGINE_META[engine] ?? { label: engine, color: '#2AA198' }
                      const m = perEngine[engine]
                      const rate = m?.mention_rate_pct ?? 0
                      const run = 'total_prompts' in (m ?? {}) ? (m as DiscoveryEngineMetric)?.total_prompts : (m as BrandHealthEngineMetric)?.prompts_run
                      return (
                        <div key={engine}>
                          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                            <span className="text-brand-text font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                              {meta.label}
                            </span>
                            <span className="text-brand-muted">
                              {m?.mentioned_count ?? 0} / {run ?? '—'} · <span className="text-brand-accent font-semibold">{pct(rate)}</span>
                            </span>
                          </div>
                          <div className="h-2 w-full bg-brand-card rounded-full overflow-hidden border border-white/[0.02]">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: meta.color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {brandHealth && Object.keys(intentBreakdown).length > 0 && (
                <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                  <h3 className="text-sm font-medium text-brand-text mb-4">Mention rate by intent category</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(intentBreakdown).map(([key, m]) => (
                      <div key={key} className="bg-brand-bg rounded-lg border border-brand-border p-4">
                        <span className="text-[10px] font-mono text-brand-muted uppercase">
                          {INTENT_LABELS[key] ?? key}
                        </span>
                        <span className="block text-2xl font-bold text-brand-accent mt-1.5">
                          {pct(m.mention_rate_pct)}
                        </span>
                        <div className="text-[10px] text-brand-muted mt-2 font-mono">
                          {m.mentioned_count ?? 0} of {m.prompts_run ?? 0} prompts
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROMPTS */}
          {nav === 'prompts' && (
            <div className="space-y-3 animate-fade-in">
              <h3 className="text-sm font-medium text-brand-text">
                {loading ? 'Loading prompts…' : `${groupedPrompts.length} prompt${groupedPrompts.length !== 1 ? 's' : ''} tested`}
              </h3>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : groupedPrompts.length === 0 ? (
                <p className="text-xs text-brand-muted py-8 text-center">No prompt results yet.</p>
              ) : (
                <div className="space-y-2">
                  {groupedPrompts.map(row => {
                    const isOpen = expandedPrompt === row.promptId
                    const firstResult = Object.values(row.byEngine)[0] as (DiscoveryPerPrompt | BrandHealthPerPrompt | undefined)
                    const intentCategory = firstResult && 'intent_category' in firstResult ? firstResult.intent_category : null

                    return (
                      <div key={row.promptId} className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedPrompt(isOpen ? null : row.promptId)}
                          className="w-full flex items-start gap-3 p-4 text-left hover:bg-brand-card/20 transition-colors"
                        >
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-brand-muted mt-0.5 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-brand-muted mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-brand-text leading-relaxed">{row.prompt_text}</p>
                            {intentCategory && (
                              <span className="inline-block mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded border border-brand-border text-brand-muted uppercase">
                                {INTENT_LABELS[intentCategory] ?? intentCategory}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-1.5 shrink-0">
                            {enginesRun.map(engine => {
                              const result = row.byEngine[engine]
                              if (!result) return null
                              return (
                                <div key={engine} className="flex items-center gap-1">
                                  <span className="text-[9px] font-mono text-brand-muted hidden sm:inline">{ENGINE_META[engine]?.label}</span>
                                  <MentionBadge mentioned={result.mentioned} />
                                </div>
                              )
                            })}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 space-y-2.5 border-t border-brand-border/60 pt-3">
                            {enginesRun.map(engine => {
                              const result = row.byEngine[engine]
                              if (!result) return null
                              const meta = ENGINE_META[engine]
                              const sentiment = 'sentiment' in result ? result.sentiment : null
                              const position = 'position' in result ? result.position : null
                              return (
                                <div key={engine} className="bg-brand-bg rounded-lg border border-brand-border/60 p-3">
                                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
                                    <span className="text-xs font-semibold text-brand-text flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta?.color }} />
                                      {meta?.label ?? engine}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <MentionBadge mentioned={result.mentioned} />
                                      {position != null && (
                                        <span className="text-[10px] font-mono text-brand-muted">#{position}</span>
                                      )}
                                      {sentiment && SENTIMENT_META[sentiment] && (
                                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${SENTIMENT_META[sentiment].className}`}>
                                          {SENTIMENT_META[sentiment].label}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {result.raw_text ? (
                                    <p className="text-[11px] text-brand-muted leading-relaxed whitespace-pre-wrap">
                                      {result.raw_text}
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-brand-muted/60 italic">No response text captured.</p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* RECOMMENDATIONS — intentionally blank per product decision */}
          {nav === 'recommendations' && (
            <div className="animate-fade-in flex flex-col items-center justify-center text-center py-20">
              <div className="w-12 h-12 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center text-brand-muted mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-brand-text">Recommendations are on the way</p>
              <p className="text-xs text-brand-muted mt-1.5 max-w-xs">
                We're building actionable, brand-specific suggestions for improving your AI visibility here.
              </p>
            </div>
          )}

          {/* CITATIONS */}
          {nav === 'citations' && (
            <div className="space-y-3 animate-fade-in">
              <h3 className="text-sm font-medium text-brand-text">Cited sources</h3>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : !discovery ? (
                <p className="text-xs text-brand-muted py-8 text-center">
                  Citation source tracking isn't available for Brand Health audits.
                </p>
              ) : (discovery.citation_source_map?.length ?? 0) === 0 ? (
                <p className="text-xs text-brand-muted py-8 text-center">No citation sources were detected.</p>
              ) : (
                <div className="space-y-2">
                  {[...discovery.citation_source_map]
                    .sort((a, b) => b.citation_share_pct - a.citation_share_pct)
                    .map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-brand-surface rounded-xl border border-brand-border">
                        <span className="text-xs font-medium text-brand-text truncate">{c.domain}</span>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-brand-muted shrink-0">
                          <span>{c.citation_count} citations</span>
                          <span className="text-brand-accent font-semibold">{pct(c.citation_share_pct)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* COMPETITORS */}
          {nav === 'competitors' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-medium text-brand-text">Competitor landscape</h3>
                {!loading && discovery && sortedCompetitors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-brand-muted uppercase">Show</span>
                    <select
                      value={competitorLimit}
                      onChange={e => setCompetitorLimit(e.target.value === 'all' ? 'all' : Number(e.target.value) as CompetitorLimit)}
                      className="bg-brand-surface border border-brand-border rounded-lg px-2.5 py-1 text-xs text-brand-text focus:outline-none focus:border-brand-accent"
                    >
                      {COMPETITOR_LIMIT_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt === 'all' ? 'All' : opt}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : !discovery ? (
                <p className="text-xs text-brand-muted py-8 text-center">
                  Competitor tracking isn't available for Brand Health audits.
                </p>
              ) : sortedCompetitors.length === 0 ? (
                <p className="text-xs text-brand-muted py-8 text-center">No competitors were named in the responses.</p>
              ) : (
                <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-brand-border/60 text-brand-muted text-[9px] font-mono uppercase">
                          <th className="py-2.5 px-4">Name</th>
                          <th className="py-2.5 px-4">Appearances</th>
                          <th className="py-2.5 px-4">Avg. rank</th>
                          <th className="py-2.5 px-4">Seen in</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/30">
                        {visibleCompetitors.map((c, i) => (
                          <tr key={i}>
                            <td className="py-2.5 px-4 font-medium text-brand-text">{c.name}</td>
                            <td className="py-2.5 px-4 text-brand-accent font-semibold">{c.appearances}</td>
                            <td className="py-2.5 px-4 text-brand-muted">#{Math.round(c.avg_mention_rank)}</td>
                            <td className="py-2.5 px-4">
                              <div className="flex gap-1">
                                {c.engines_seen_in?.map(e => (
                                  <span key={e} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ENGINE_META[e]?.color ?? '#2AA198' }} title={ENGINE_META[e]?.label} />
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {competitorLimit !== 'all' && sortedCompetitors.length > visibleCompetitors.length && (
                    <div className="px-4 py-2.5 border-t border-brand-border/60 text-[10px] text-brand-muted font-mono">
                      Showing {visibleCompetitors.length} of {sortedCompetitors.length}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}