'use client'

import { Skeleton } from '../UIBits'
import { pct } from '../utils'
import {
  ENGINE_META,
  INTENT_LABELS,
  type BrandHealthEngineMetric,
  type BrandHealthSummaryData,
  type DiscoveryEngineMetric,
  type DiscoverySummaryData,
  type Engine,
} from '../types'

interface OverviewTabProps {
  loading: boolean
  discovery: DiscoverySummaryData | null
  brandHealth: BrandHealthSummaryData | null
  enginesRun: Engine[]
  perEngine: Record<string, DiscoveryEngineMetric | BrandHealthEngineMetric>
  intentBreakdown: Record<string, BrandHealthEngineMetric>
}

export default function OverviewTab({
  loading,
  discovery,
  brandHealth,
  enginesRun,
  perEngine,
  intentBreakdown,
}: OverviewTabProps) {
  const combined = discovery?.combined ?? brandHealth?.combined
  const mentionRate = combined?.mention_rate_pct ?? 0
  const totalPrompts =
    combined && ('total_prompts' in combined ? combined.total_prompts : combined.prompts_run)
  const mentionedCount = combined?.mentioned_count ?? 0

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
    </div>
  )
}
