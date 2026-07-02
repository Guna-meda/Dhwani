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
  Users,
  Tags,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Link2,
  Clock,
  AlertCircle,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Real backend shapes — mirrors models/discoverySummary.model.js and
// models/brandhealthsummary.model.js exactly. This dashboard renders nothing
// that isn't actually computed by the backend.
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
  comparison:           'Comparison',
  legitimacy:           'Legitimacy',
}

const SENTIMENT_META: Record<string, { label: string; className: string }> = {
  recommended: { label: 'Recommended', className: 'text-brand-accent bg-brand-accent/10 border-brand-accent/30' },
  mentioned:   { label: 'Mentioned',   className: 'text-brand-primary bg-brand-primary/10 border-brand-primary/30' },
  not_found:   { label: 'Not found',   className: 'text-brand-muted bg-brand-card border-brand-border' },
  negative:    { label: 'Negative',    className: 'text-red-300 bg-red-950/30 border-red-900/40' },
}

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

// Defensive: Mongoose `Map`-typed schema fields (per_engine, per_intent_category)
// can round-trip oddly through JSON depending on driver/version. This just
// keeps the UI from crashing if one ever arrives as something unexpected —
// it can't recover data that genuinely wasn't sent.
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

// Group flat per-prompt × engine rows into one row per prompt, with each
// engine's result attached — this is what makes a 30–75 row flat list into a
// readable pivot table instead of a wall of near-duplicate text.
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

type NavId = 'overview' | 'prompts' | 'landscape'

export default function DashboardLayout() {
  const {
    productId,
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

  // Fetch the summary ourselves if it isn't already in context — covers a
  // direct reload landing on the dashboard, where nothing upstream fetched it.
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

  const navItems: { id: NavId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'prompts', label: 'Prompt results', icon: MessageSquareText },
    isDiscovery
      ? { id: 'landscape', label: 'Competitors', icon: Users }
      : { id: 'landscape', label: 'Categories', icon: Tags },
  ]

  // ── Guard states ──────────────────────────────────────────────────────────

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

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-brand-muted">
          <Signal className="w-5 h-5 animate-pulse text-brand-accent" />
          <span className="text-sm font-mono">Loading your results…</span>
        </div>
      </div>
    )
  }

  if (error || !combined) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-brand-text font-medium">
            {error || 'Your audit results aren\u2019t ready yet.'}
          </p>
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

  const mentionRate = combined.mention_rate_pct ?? 0
  const totalPrompts = 'total_prompts' in combined ? combined.total_prompts : combined.prompts_run
  const mentionedCount = combined.mentioned_count ?? 0

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex overflow-hidden font-sans">

      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-60 bg-brand-surface border-r border-brand-border shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-brand-border">
          <div className="w-8 h-8 rounded-lg bg-brand-bg border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <Signal className="w-4 h-4" />
          </div>
          <span className="font-display font-semibold text-sm tracking-tight text-brand-text">Dhwani</span>
        </div>

        <div className="px-4 py-3.5 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="truncate">
              <span className="block text-xs font-semibold text-brand-text truncate">
                {user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Account'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = nav === item.id
            return (
              <button
                key={item.id}
                onClick={() => setNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-brand-primary/10 text-brand-accent border-l-2 border-brand-primary pl-[10px]'
                    : 'text-brand-muted hover:text-brand-text hover:bg-brand-card/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-brand-border">
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-muted hover:text-brand-text hover:bg-brand-card rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-brand-border bg-brand-surface flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-7 h-7 rounded-md bg-brand-bg border border-brand-primary/25 flex items-center justify-center text-brand-primary">
              <Signal className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-sm font-display font-semibold text-brand-text">
                {isDiscovery ? 'Discovery Audit' : 'Brand Health Audit'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                  status === 'COMPLETE'
                    ? 'text-brand-accent bg-brand-accent/10 border-brand-accent/25'
                    : 'text-yellow-300 bg-yellow-950/20 border-yellow-900/30'
                }`}>
                  {status === 'COMPLETE' ? 'Complete' : 'Partial'}
                </span>
                {createdAt && (
                  <span className="flex items-center gap-1 text-[10px] text-brand-muted font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <UserButton />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

          {/* OVERVIEW */}
          {nav === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Hero stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      {combined && 'avg_position' in combined && combined.avg_position != null
                        ? `#${Math.round(combined.avg_position)}`
                        : '—'}
                    </span>
                    <div className="text-[10px] text-brand-muted mt-3 font-mono">
                      Among listed recommendations
                    </div>
                  </div>
                ) : (
                  <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
                    <span className="text-[10px] font-mono text-brand-muted uppercase">Not mentioned</span>
                    <span className="block text-3xl font-bold text-brand-text mt-2">
                      {combined && 'not_found_count' in combined ? combined.not_found_count ?? 0 : 0}
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
              </div>

              {/* Per-engine breakdown */}
              <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                <h3 className="text-sm font-medium text-brand-text mb-4">Mention rate by model</h3>
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
              </div>
            </div>
          )}

          {/* PROMPT RESULTS */}
          {nav === 'prompts' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-brand-text">
                  {groupedPrompts.length} prompt{groupedPrompts.length !== 1 ? 's' : ''} tested
                </h3>
              </div>

              {groupedPrompts.length === 0 ? (
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
                          <div className="flex items-center gap-1.5 shrink-0">
                            {enginesRun.map(engine => {
                              const result = row.byEngine[engine]
                              if (!result) return null
                              return (
                                <span
                                  key={engine}
                                  title={ENGINE_META[engine]?.label}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                                    result.mentioned
                                      ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent'
                                      : 'bg-brand-card border-brand-border text-brand-muted'
                                  }`}
                                >
                                  {result.mentioned ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                </span>
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
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold text-brand-text flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta?.color }} />
                                      {meta?.label ?? engine}
                                    </span>
                                    <div className="flex items-center gap-1.5">
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

          {/* COMPETITORS (discovery) / CATEGORIES (brand health) */}
          {nav === 'landscape' && discovery && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                <h3 className="text-sm font-medium text-brand-text mb-4">Competitor landscape</h3>
                {(!discovery.competitor_landscape || discovery.competitor_landscape.length === 0) ? (
                  <p className="text-xs text-brand-muted py-4">No competitors were named in the responses.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-brand-border/40 text-brand-muted text-[9px] font-mono uppercase">
                          <th className="py-2.5">Name</th>
                          <th className="py-2.5">Appearances</th>
                          <th className="py-2.5">Avg. rank</th>
                          <th className="py-2.5">Seen in</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/20">
                        {[...discovery.competitor_landscape]
                          .sort((a, b) => b.appearances - a.appearances)
                          .map((c, i) => (
                            <tr key={i}>
                              <td className="py-2.5 font-medium text-brand-text">{c.name}</td>
                              <td className="py-2.5 text-brand-accent font-semibold">{c.appearances}</td>
                              <td className="py-2.5 text-brand-muted">#{Math.round(c.avg_mention_rank)}</td>
                              <td className="py-2.5">
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
                )}
              </div>

              <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                <h3 className="text-sm font-medium text-brand-text mb-4 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-brand-muted" />
                  Citation sources
                </h3>
                {(!discovery.citation_source_map || discovery.citation_source_map.length === 0) ? (
                  <p className="text-xs text-brand-muted py-4">No citation sources were detected.</p>
                ) : (
                  <div className="space-y-2">
                    {[...discovery.citation_source_map]
                      .sort((a, b) => b.citation_share_pct - a.citation_share_pct)
                      .map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-brand-bg rounded-lg border border-brand-border/60">
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
            </div>
          )}

          {nav === 'landscape' && brandHealth && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-medium text-brand-text">Mention rate by intent category</h3>
              {Object.keys(intentBreakdown).length === 0 ? (
                <p className="text-xs text-brand-muted py-4">No categorized prompts available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(intentBreakdown).map(([key, m]) => (
                    <div key={key} className="bg-brand-surface rounded-xl border border-brand-border p-4">
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
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}