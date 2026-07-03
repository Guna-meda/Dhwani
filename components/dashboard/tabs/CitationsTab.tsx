'use client'

import { useMemo, useState } from 'react'
import { Skeleton } from '../UIBits'
import { pct } from '../utils'
import { LIST_LIMIT_OPTIONS, type CitationEntry, type ListLimit } from '../types'

interface CitationsTabProps {
  loading: boolean
  isDiscovery: boolean
  citations: CitationEntry[]
}

export default function CitationsTab({ loading, isDiscovery, citations }: CitationsTabProps) {
  const [limit, setLimit] = useState<ListLimit>(10)

  const sorted = useMemo(() => [...citations].sort((a, b) => b.citation_share_pct - a.citation_share_pct), [citations])
  const visible = limit === 'all' ? sorted : sorted.slice(0, limit)

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-medium text-brand-text">Cited sources</h3>
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
          Citation source tracking isn&apos;t available for Brand Health audits.
        </p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-brand-muted py-8 text-center">No citation sources were detected.</p>
      ) : (
        <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden divide-y divide-brand-border/40">
          {visible.map((c, i) => (
            <div key={c.domain} className="flex items-center justify-between px-4 py-3 hover:bg-brand-card/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-brand-muted w-5 shrink-0">{i + 1}</span>
                <span className="text-sm font-medium text-brand-text truncate">{c.domain}</span>
              </div>
              <div className="flex items-center gap-4 text-sm font-mono text-brand-muted shrink-0">
                <span>{c.citation_count} citation{c.citation_count !== 1 ? 's' : ''}</span>
                <span className="text-brand-accent font-semibold w-12 text-right">{pct(c.citation_share_pct)}</span>
              </div>
            </div>
          ))}
          {limit !== 'all' && sorted.length > visible.length && (
            <div className="px-4 py-2.5 text-xs text-brand-muted font-mono">
              Showing {visible.length} of {sorted.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
