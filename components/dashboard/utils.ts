import type { Engine } from './types'

// Defensive: Mongoose `Map`-typed schema fields (per_engine, per_intent_category)
// can round-trip oddly through JSON depending on driver/version. This just
// keeps the UI from crashing if one ever arrives as something unexpected —
// it can't recover data that genuinely wasn't sent.
export function asRecord<T>(value: unknown): Record<string, T> {
  if (!value) return {}
  if (value instanceof Map) return Object.fromEntries(value as Map<string, T>)
  if (typeof value === 'object') return value as Record<string, T>
  return {}
}

export function pct(n: number | undefined | null): string {
  return `${Math.round(n ?? 0)}%`
}

export function formatDate(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

// Group flat per-prompt × engine rows into one row per prompt, with each
// engine's result attached — this is what makes a 30-75 row flat list into a
// readable pivot table instead of a wall of near-duplicate text.
export function groupByPrompt<T extends { promptId: string; prompt_text: string; engine: Engine }>(
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
