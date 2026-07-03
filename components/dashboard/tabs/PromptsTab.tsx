'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Skeleton, MentionBadge } from '../UIBits'
import {
  ENGINE_META,
  INTENT_LABELS,
  SENTIMENT_META,
  type BrandHealthPerPrompt,
  type DiscoveryPerPrompt,
  type Engine,
} from '../types'
import { groupByPrompt } from '../utils'

interface PromptsTabProps {
  loading: boolean
  rows: (DiscoveryPerPrompt | BrandHealthPerPrompt)[]
  enginesRun: Engine[]
}

export default function PromptsTab({ loading, rows, enginesRun }: PromptsTabProps) {
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null)
  const groupedPrompts = groupByPrompt(rows)

  return (
    <div className="space-y-3 animate-fade-in">
      <h3 className="text-base font-medium text-brand-text">
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
        <p className="text-sm text-brand-muted py-8 text-center">No prompt results yet.</p>
      ) : (
        <div className="space-y-2">
          {groupedPrompts.map(row => {
            const isOpen = expandedPrompt === row.promptId
            const firstResult = Object.values(row.byEngine)[0] as DiscoveryPerPrompt | BrandHealthPerPrompt | undefined
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
                    <p className="text-base text-brand-text leading-relaxed">{row.prompt_text}</p>
                    {intentCategory && (
                      <span className="inline-block mt-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded border border-brand-border text-brand-muted uppercase">
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
                          <span className="text-[10px] font-mono text-brand-muted hidden sm:inline">
                            {ENGINE_META[engine]?.label}
                          </span>
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
                        <div key={engine} className="bg-brand-bg rounded-lg border border-brand-border/60 p-3 flex items-center justify-between flex-wrap gap-1.5">
                          <span className="text-sm font-semibold text-brand-text flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta?.color }} />
                            {meta?.label ?? engine}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <MentionBadge mentioned={result.mentioned} />
                            {position != null && (
                              <span className="text-xs font-mono text-brand-muted">#{position}</span>
                            )}
                            {sentiment && SENTIMENT_META[sentiment] && (
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${SENTIMENT_META[sentiment].className}`}>
                                {SENTIMENT_META[sentiment].label}
                              </span>
                            )}
                          </div>
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
  )
}
