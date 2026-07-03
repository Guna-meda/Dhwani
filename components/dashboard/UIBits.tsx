import { CheckCircle2, XCircle } from 'lucide-react'
import { ENGINE_META, type Engine } from './types'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-brand-card rounded-lg ${className}`} />
}

/**
 * Always renders the word "Yes" or "No" next to the icon — a colored dot
 * alone makes people guess what it means.
 */
export function MentionBadge({ mentioned }: { mentioned: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${
        mentioned
          ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent'
          : 'bg-brand-card border-brand-border text-brand-muted'
      }`}
    >
      {mentioned ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {mentioned ? 'Yes' : 'No'}
    </span>
  )
}

/**
 * Labeled model chips — e.g. "GPT · PPX". Replaces a row of bare color dots,
 * which nobody can decode without a legend. Each chip carries its own text,
 * so the meaning survives without hovering for a tooltip.
 */
export function EngineChips({ engines, size = 'sm' }: { engines: Engine[]; size?: 'sm' | 'xs' }) {
  if (!engines || engines.length === 0) {
    return <span className="text-brand-muted/60 text-xs">—</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {engines.map(e => {
        const meta = ENGINE_META[e] ?? { label: e, short: e.slice(0, 3).toUpperCase(), color: '#2AA198' }
        return (
          <span
            key={e}
            title={meta.label}
            className={`inline-flex items-center rounded-md font-semibold border ${
              size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
            }`}
            style={{
              color: meta.color,
              borderColor: `${meta.color}55`,
              backgroundColor: `${meta.color}1A`,
            }}
          >
            {meta.short}
          </span>
        )
      })}
    </div>
  )
}
