'use client'

import { useMemo } from 'react'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Skeleton, EngineChips } from '../UIBits'
import { pct } from '../utils'
import { groupByPrompt } from '../utils'
import {
  ENGINE_META,
  INTENT_LABELS,
  SENTIMENT_META,
  type BrandHealthEngineMetric,
  type BrandHealthPerPrompt,
  type BrandHealthSummaryData,
  type DiscoveryEngineMetric,
  type DiscoveryPerPrompt,
  type DiscoverySummaryData,
  type Engine,
  type NavId,
} from '../types'

interface OverviewTabProps {
  loading: boolean
  discovery: DiscoverySummaryData | null
  brandHealth: BrandHealthSummaryData | null
  enginesRun: Engine[]
  perEngine: Record<string, DiscoveryEngineMetric | BrandHealthEngineMetric>
  intentBreakdown: Record<string, BrandHealthEngineMetric>
  // Lets the summary boxes below ("View more") jump straight to the tab
  // with the full data, instead of duplicating that tab's UI here.
  onNavigate?: (nav: NavId) => void
  // Docs lives at its own top-level route (/docs), not as a tab inside this
  // dashboard, so it gets its own navigation callback instead of onNavigate.
  onOpenDocs?: () => void
}

// One row in the "Top cited prompts" box — a prompt that was mentioned by
// at least one engine, collapsed across engines the same way PromptsTab
// does, plus whatever ranking signal each audit type actually has
// (position for Discovery, sentiment for Brand Health).
interface TopPromptRow {
  promptId: string
  prompt_text: string
  engines: Engine[]
  position: number | null
  sentiment: string | null
}

function ViewMoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-mono text-brand-accent hover:underline shrink-0"
    >
      {label}
      <ArrowRight className="w-3 h-3" />
    </button>
  )
}

export default function OverviewTab({
  loading,
  discovery,
  brandHealth,
  enginesRun,
  perEngine,
  intentBreakdown,
  onNavigate,
  onOpenDocs,
}: OverviewTabProps) {
  const combined = discovery?.combined ?? brandHealth?.combined
  const mentionRate = combined?.mention_rate_pct ?? 0
  const totalPrompts =
    combined && ('total_prompts' in combined ? combined.total_prompts : combined.prompts_run)
  const mentionedCount = combined?.mentioned_count ?? 0

  const promptRows = (discovery?.per_prompt ?? brandHealth?.per_prompt ?? []) as (
    | DiscoveryPerPrompt
    | BrandHealthPerPrompt
  )[]

  // Top 5 prompts the client was actually cited/mentioned in — sorted by
  // best position for Discovery (lower is better), or by best sentiment
  // for Brand Health (recommended beats a plain mention).
  const topPrompts = useMemo<TopPromptRow[]>(() => {
    const grouped = groupByPrompt(promptRows)

    const cited = grouped
      .map(g => {
        const entries = Object.entries(g.byEngine) as [Engine, DiscoveryPerPrompt | BrandHealthPerPrompt][]
        const mentionedEngines = entries.filter(([, r]) => r?.mentioned).map(([e]) => e)
        if (mentionedEngines.length === 0) return null

        const results = entries.map(([, r]) => r)
        const positions = results
          .map(r => ('position' in r ? r.position : null))
          .filter((p): p is number => p != null)
        const bestPosition = positions.length ? Math.min(...positions) : null

        const sentiments = results.map(r => ('sentiment' in r ? r.sentiment : null)).filter(Boolean) as string[]
        const bestSentiment: string | null = sentiments.includes('recommended')
          ? 'recommended'
          : sentiments.length > 0
            ? sentiments[0]
            : null

        return {
          promptId: g.promptId,
          prompt_text: g.prompt_text,
          engines: mentionedEngines,
          position: bestPosition,
          sentiment: bestSentiment,
        }
      })
      .filter((r): r is TopPromptRow => r !== null)

    cited.sort((a, b) => {
      if (discovery) {
        if (a.position == null) return 1
        if (b.position == null) return -1
        return a.position - b.position
      }
      const rank = (s: string | null) => (s === 'recommended' ? 0 : 1)
      return rank(a.sentiment) - rank(b.sentiment)
    })

    return cited.slice(0, 5)
  }, [promptRows, discovery])

  const topCitations = useMemo(
    () => [...(discovery?.citation_source_map ?? [])].sort((a, b) => b.citation_share_pct - a.citation_share_pct).slice(0, 5),
    [discovery]
  )

  const topCompetitors = useMemo(
    () => [...(discovery?.competitor_landscape ?? [])].sort((a, b) => b.appearances - a.appearances).slice(0, 10),
    [discovery]
  )

  return (
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
              <span className="text-xs font-mono text-brand-muted uppercase">Mention rate</span>
              <span className="block text-3xl font-bold text-brand-accent text-glow mt-2">{pct(mentionRate)}</span>
              <div className="text-xs text-brand-muted mt-3 font-mono">
                Across {enginesRun.length} model{enginesRun.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
              <span className="text-xs font-mono text-brand-muted uppercase">Prompts run</span>
              <span className="block text-3xl font-bold text-brand-text mt-2">{totalPrompts ?? '—'}</span>
              <div className="text-xs text-brand-muted mt-3 font-mono">{mentionedCount} mentioned you</div>
            </div>

            {discovery ? (
              <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
                <span className="text-xs font-mono text-brand-muted uppercase">Avg. mention position</span>
                <span className="block text-3xl font-bold text-brand-text mt-2">
                  {discovery.combined?.avg_position != null ? `#${Math.round(discovery.combined.avg_position)}` : '—'}
                </span>
                <div className="text-xs text-brand-muted mt-3 font-mono">Among listed recommendations</div>
              </div>
            ) : (
              <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
                <span className="text-xs font-mono text-brand-muted uppercase">Not mentioned</span>
                <span className="block text-3xl font-bold text-brand-text mt-2">
                  {brandHealth?.combined?.not_found_count ?? 0}
                </span>
                <div className="text-xs text-brand-muted mt-3 font-mono">Out of {totalPrompts ?? 0} prompts</div>
              </div>
            )}

            <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
              <span className="text-xs font-mono text-brand-muted uppercase">
                {discovery ? 'Competitors found' : 'Categories tracked'}
              </span>
              <span className="block text-3xl font-bold text-brand-text mt-2">
                {discovery ? discovery.competitor_landscape?.length ?? 0 : Object.keys(intentBreakdown).length}
              </span>
              <div className="text-xs text-brand-muted mt-3 font-mono">
                {discovery ? 'Mentioned alongside you' : 'Intent angles tested'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Category vs. niche tier breakdown — Discovery only (Brand Health
          prompts aren't tiered). Deliberately NOT blended into the single
          "Mention rate" stat above: a low category-tier score is expected
          for a challenger brand (broad "best X" queries skew toward
          incumbents) while a low niche-tier score is the signal actually
          worth acting on. Showing one blended number hides which is which. */}
      {discovery && discovery.by_tier && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
            <span className="text-xs font-mono text-brand-muted uppercase">Category tier</span>
            <span className="block text-3xl font-bold text-brand-text mt-2">
              {pct(discovery.by_tier.category?.mention_rate_pct ?? 0)}
            </span>
            <div className="text-xs text-brand-muted mt-2 font-mono">
              {discovery.by_tier.category?.mentioned_count ?? 0} / {discovery.by_tier.category?.total_prompts ?? 0} broad
              &quot;best X&quot; prompts
            </div>
            <p className="text-xs text-brand-muted/80 mt-3 leading-relaxed">
              Broad category searches are dominated by established players — a low score here is expected for a
              challenger brand and isn&apos;t a sign your AEO work isn&apos;t working.
            </p>
          </div>

          <div className="bg-brand-surface rounded-xl p-5 border border-brand-border">
            <span className="text-xs font-mono text-brand-muted uppercase">Niche tier</span>
            <span className="block text-3xl font-bold text-brand-accent mt-2">
              {pct(discovery.by_tier.niche?.mention_rate_pct ?? 0)}
            </span>
            <div className="text-xs text-brand-muted mt-2 font-mono">
              {discovery.by_tier.niche?.mentioned_count ?? 0} / {discovery.by_tier.niche?.total_prompts ?? 0} specific,
              pain-point-driven prompts
            </div>
            <p className="text-xs text-brand-muted/80 mt-3 leading-relaxed">
              This is where your positioning and content should show up. If this stays low, that&apos;s the real
              signal to act on — it usually means AI engines aren&apos;t finding citable content connecting you to
              these queries.
            </p>
          </div>
        </div>
      )}

      <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
        <h3 className="text-base font-medium text-brand-text mb-4">Mention rate by model</h3>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : (
          <div className="space-y-4">
            {enginesRun.length === 0 && <p className="text-sm text-brand-muted">No per-model data available.</p>}
            {enginesRun.map(engine => {
              const meta = ENGINE_META[engine] ?? { label: engine, short: engine, color: '#2AA198' }
              const m = perEngine[engine]
              const rate = m?.mention_rate_pct ?? 0
              const run =
                m && 'total_prompts' in m
                  ? (m as DiscoveryEngineMetric).total_prompts
                  : (m as BrandHealthEngineMetric)?.prompts_run
              return (
                <div key={engine}>
                  <div className="flex items-center justify-between text-sm font-mono mb-1.5">
                    <span className="text-brand-text font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                      {meta.label}
                    </span>
                    <span className="text-brand-muted">
                      {m?.mentioned_count ?? 0} / {run ?? '—'} ·{' '}
                      <span className="text-brand-accent font-semibold">{pct(rate)}</span>
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

      {/* Top cited prompts — relevant to both audit types, since both track
          per-prompt mentions. Ranked by position (Discovery) or sentiment
          (Brand Health). */}
      <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-brand-text">Top cited prompts</h3>
          {!loading && topPrompts.length > 0 && onNavigate && (
            <ViewMoreButton label="View more" onClick={() => onNavigate('prompts')} />
          )}
        </div>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : topPrompts.length === 0 ? (
          <p className="text-sm text-brand-muted py-6 text-center">No cited prompts yet.</p>
        ) : (
          <div className="space-y-2">
            {topPrompts.map((p, i) => (
              <div
                key={p.promptId}
                className="flex items-center gap-3 px-3 py-2.5 bg-brand-bg rounded-lg border border-brand-border/60"
              >
                <span className="text-xs font-mono text-brand-muted w-5 shrink-0">{i + 1}</span>
                <span className="flex-1 min-w-0 text-sm text-brand-text truncate">{p.prompt_text}</span>
                <div className="shrink-0 flex items-center gap-2">
                  {discovery && p.position != null && (
                    <span className="text-xs font-mono text-brand-muted">#{p.position}</span>
                  )}
                  {brandHealth && p.sentiment && SENTIMENT_META[p.sentiment] && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${SENTIMENT_META[p.sentiment].className}`}
                    >
                      {SENTIMENT_META[p.sentiment].label}
                    </span>
                  )}
                  <EngineChips engines={p.engines} size="xs" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Citation sources and competitor landscape only exist for Discovery
          audits — Brand Health tracks neither, so these boxes simply don't
          render on that tab instead of showing an empty/fake state. */}
      {discovery && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-brand-text">Top citation sources</h3>
              {!loading && topCitations.length > 0 && onNavigate && (
                <ViewMoreButton label="View more" onClick={() => onNavigate('citations')} />
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : topCitations.length === 0 ? (
              <p className="text-sm text-brand-muted py-6 text-center">No citation sources were detected.</p>
            ) : (
              <div className="space-y-2">
                {topCitations.map((c, i) => (
                  <div
                    key={c.domain}
                    className="flex items-center justify-between px-3 py-2.5 bg-brand-bg rounded-lg border border-brand-border/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-brand-muted w-5 shrink-0">{i + 1}</span>
                      <span className="text-sm font-medium text-brand-text truncate">{c.domain}</span>
                    </div>
                    <span className="text-sm font-mono text-brand-accent font-semibold shrink-0">
                      {pct(c.citation_share_pct)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-brand-text">Top competitors</h3>
              {!loading && topCompetitors.length > 0 && onNavigate && (
                <ViewMoreButton label="View more" onClick={() => onNavigate('competitors')} />
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : topCompetitors.length === 0 ? (
              <p className="text-sm text-brand-muted py-6 text-center">No competitors were named in the responses.</p>
            ) : (
              <div className="space-y-2">
                {topCompetitors.map((c, i) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between px-3 py-2.5 bg-brand-bg rounded-lg border border-brand-border/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-brand-muted w-5 shrink-0">{i + 1}</span>
                      <span className="text-sm font-medium text-brand-text truncate">{c.name}</span>
                    </div>
                    <span className="text-xs font-mono text-brand-muted shrink-0">
                      {c.appearances} appearance{c.appearances !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {brandHealth && Object.keys(intentBreakdown).length > 0 && (
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <h3 className="text-base font-medium text-brand-text mb-4">Mention rate by intent category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(intentBreakdown).map(([key, m]) => (
              <div key={key} className="bg-brand-bg rounded-lg border border-brand-border p-4">
                <span className="text-xs font-mono text-brand-muted uppercase">{INTENT_LABELS[key] ?? key}</span>
                <span className="block text-2xl font-bold text-brand-accent mt-1.5">{pct(m.mention_rate_pct)}</span>
                <div className="text-xs text-brand-muted mt-2 font-mono">
                  {m.mentioned_count ?? 0} of {m.prompts_run ?? 0} prompts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Docs is a fully separate route (/docs) — general, not scoped to
          this product or audit type — so this leaves the dashboard rather
          than switching an internal tab. */}
      {onOpenDocs && (
        <div className="flex justify-center pt-1">
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-text border border-brand-border rounded-lg px-4 py-2 transition-colors hover:bg-brand-card/40"
          >
            <BookOpen className="w-4 h-4" />
            View docs
          </button>
        </div>
      )}
    </div>
  )
}
