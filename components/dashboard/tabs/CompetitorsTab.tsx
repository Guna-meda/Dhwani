'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Lock } from 'lucide-react'
import { Skeleton, EngineChips } from '../UIBits'
import {
  COMPETITOR_DRILLDOWN_RANK_LIMIT,
  LIST_LIMIT_OPTIONS,
  type CompetitorEntry,
  type ListLimit,
} from '../types'

interface CompetitorsTabProps {
  loading: boolean
  isDiscovery: boolean
  competitors: CompetitorEntry[]
}

export default function CompetitorsTab({ loading, isDiscovery, competitors }: CompetitorsTabProps) {
  const [limit, setLimit] = useState<ListLimit>(10)
  const [expanded, setExpanded] = useState<string | null>(null)

  const sorted = useMemo(() => [...competitors].sort((a, b) => b.appearances - a.appearances), [competitors])
  const visible = limit === 'all' ? sorted : sorted.slice(0, limit)

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-medium text-brand-text">Competitor landscape</h3>
        {!loading && isDiscovery && sorted.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-brand-muted uppercase">Show</span>
            <select
              value={limit}
              onChange={e => setLimit(e.target.value === 'all' ? 'all' : (Number(e.target.value) as ListLimit))}
              className="bg-brand-surface border border-brand-border rounded-lg px-2.5 py-1.5 text-sm text-brand-text focus:outline-none focus:border-brand-accent"
            >
              {LIST_LIMIT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'All' : opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : !isDiscovery ? (
        <p className="text-sm text-brand-muted py-8 text-center">
          Competitor tracking isn&apos;t available for Brand Health audits.
        </p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-brand-muted py-8 text-center">No competitors were named in the responses.</p>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map((c, i) => {
              const rank = i + 1
              const drillable = rank <= COMPETITOR_DRILLDOWN_RANK_LIMIT
              const isOpen = expanded === c.name
              return (
                <div key={c.name} className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => drillable && setExpanded(isOpen ? null : c.name)}
                    disabled={!drillable}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                      drillable ? 'hover:bg-brand-card/20 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span className="text-xs font-mono text-brand-muted w-5 shrink-0">{rank}</span>

                    {drillable ? (
                      isOpen ? (
                        <ChevronDown className="w-4 h-4 text-brand-muted shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-brand-muted shrink-0" />
                      )
                    ) : (
                      <span className="w-4 h-4 shrink-0" />
                    )}

                    <span className="flex-1 min-w-0 text-base font-medium text-brand-text truncate">{c.name}</span>

                    <div className="hidden sm:flex flex-col items-end shrink-0 w-24">
                      <span className="text-xs font-mono text-brand-muted uppercase">Appearances</span>
                      <span className="text-sm font-semibold text-brand-accent">{c.appearances}</span>
                    </div>

                    <div className="hidden sm:flex flex-col items-end shrink-0 w-20">
                      <span className="text-xs font-mono text-brand-muted uppercase">Avg. rank</span>
                      <span className="text-sm font-semibold text-brand-text">#{Math.round(c.avg_mention_rank)}</span>
                    </div>

                    <div className="shrink-0 w-auto sm:w-36 flex justify-end">
                      <EngineChips engines={c.engines_seen_in} size="xs" />
                    </div>
                  </button>

                  {/* Mobile-only stat row, since the columns above are hidden below sm */}
                  <div className="sm:hidden flex items-center gap-4 px-4 pb-3 -mt-1 text-xs font-mono text-brand-muted">
                    <span>{c.appearances} appearances</span>
                    <span>Avg. rank #{Math.round(c.avg_mention_rank)}</span>
                  </div>

                  {isOpen && drillable && (
                    <div className="px-4 pb-4 border-t border-brand-border/60 pt-3">
                      {c.mentioned_in && c.mentioned_in.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-mono text-brand-muted uppercase mb-1">
                            Appeared in {c.mentioned_in.length} prompt{c.mentioned_in.length !== 1 ? 's' : ''}
                          </p>
                          {c.mentioned_in.map(m => (
                            <div
                              key={m.promptId}
                              className="bg-brand-bg rounded-lg border border-brand-border/60 p-3 flex items-center justify-between gap-3"
                            >
                              <span className="text-sm text-brand-text leading-relaxed">{m.prompt_text}</span>
                              <div className="shrink-0">
                                <EngineChips engines={m.engines} size="xs" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-brand-muted/70 italic py-2">
                          Per-prompt detail for this competitor isn&apos;t available yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {sorted.length > COMPETITOR_DRILLDOWN_RANK_LIMIT && (
            <p className="flex items-center gap-1.5 text-xs text-brand-muted/70 font-mono px-1">
              <Lock className="w-3 h-3" />
              Prompt-level detail is available for the top {COMPETITOR_DRILLDOWN_RANK_LIMIT} competitors
            </p>
          )}

          {limit !== 'all' && sorted.length > visible.length && (
            <p className="text-xs text-brand-muted font-mono px-1">
              Showing {visible.length} of {sorted.length}
            </p>
          )}
        </>
      )}
    </div>
  )
}
