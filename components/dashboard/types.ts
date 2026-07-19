// ─────────────────────────────────────────────────────────────────────────────
// Real backend shapes — mirrors models/discoverySummary.model.js and
// models/brandhealthsummary.model.js exactly.
// ─────────────────────────────────────────────────────────────────────────────

export type Engine = 'chatgpt' | 'perplexity' | 'gemini'

export const ENGINE_META: Record<Engine, { label: string; short: string; color: string }> = {
  chatgpt: { label: 'ChatGPT', short: 'GPT', color: '#2AA198' },
  perplexity: { label: 'Perplexity', short: 'PPX', color: '#8EE6DD' },
  gemini: { label: 'Gemini', short: 'GEM', color: '#1F7A72' },
}

export const INTENT_LABELS: Record<string, string> = {
  pricing: 'Pricing',
  feature_integration: 'Features & Integration',
  reputation: 'Reputation',
  comparison: 'Comparison',
  legitimacy: 'Legitimacy',
}

export const SENTIMENT_META: Record<string, { label: string; className: string }> = {
  recommended: { label: 'Recommended', className: 'text-brand-accent bg-brand-accent/10 border-brand-accent/30' },
  mentioned: { label: 'Mentioned', className: 'text-brand-primary bg-brand-primary/10 border-brand-primary/30' },
  not_found: { label: 'Not found', className: 'text-brand-muted bg-brand-card border-brand-border' },
  negative: { label: 'Negative', className: 'text-red-300 bg-red-950/30 border-red-900/40' },
}

// Options shared by the Competitors and Citations "show N" controls.
export const LIST_LIMIT_OPTIONS = [10, 15, 20, 30, 50, 'all'] as const
export type ListLimit = (typeof LIST_LIMIT_OPTIONS)[number]

// Deep-dive (click a row to see which prompts it appeared in) is only
// offered for the top N competitors by appearance — regardless of how many
// rows are currently visible via the "show N" control. Re-running a
// per-prompt breakdown for 50 competitors isn't worth the cost when the
// long tail is barely mentioned anyway.
export const COMPETITOR_DRILLDOWN_RANK_LIMIT = 15

export interface DiscoveryEngineMetric {
  total_prompts?: number
  mentioned_count?: number
  mention_rate_pct?: number
  avg_position?: number | null
}

export interface DiscoveryPerPrompt {
  promptId: string
  prompt_text: string
  tier: 'category' | 'niche' | null
  engine: Engine
  mentioned: boolean
  position: number | null
  raw_text: string | null
}

// Per-prompt appearance of a single competitor. Optional because the
// backend doesn't populate it yet — see CompetitorsTab for the fallback UI
// this degrades to until `mentioned_in` is added to the API response.
export interface CompetitorPromptMention {
  promptId: string
  prompt_text: string
  engines: Engine[]
}

export interface CompetitorEntry {
  name: string
  appearances: number
  avg_mention_rank: number
  engines_seen_in: Engine[]
  mentioned_in?: CompetitorPromptMention[]
}

export interface CitationEntry {
  domain: string
  citation_count: number
  citation_share_pct: number
}

export interface DiscoverySummaryData {
  engines_run: Engine[]
  combined: DiscoveryEngineMetric
  // Same shape as `combined`, split by prompt tier. category = broad "best
  // X" prompts (expected to skew toward incumbents — this is landscape, not
  // a grade on the brand). niche = specific, persona/pain-point-driven
  // prompts (the tier a well-positioned niche brand should realistically be
  // winning). Prefer this over `combined` when actually judging performance.
  by_tier?: {
    category: DiscoveryEngineMetric
    niche: DiscoveryEngineMetric
  }
  per_engine: Record<string, DiscoveryEngineMetric>
  per_prompt: DiscoveryPerPrompt[]
  competitor_landscape: CompetitorEntry[]
  citation_source_map: CitationEntry[]
  status: 'PARTIAL' | 'COMPLETE'
  createdAt?: string
}

export interface BrandHealthEngineMetric {
  prompts_run?: number
  mentioned_count?: number
  not_found_count?: number
  mention_rate_pct?: number
}

export interface BrandHealthPerPrompt {
  promptId: string
  prompt_text: string
  intent_category: string | null
  engine: Engine
  mentioned: boolean
  sentiment: string | null
  raw_text: string | null
}

export interface BrandHealthSummaryData {
  engines_run: Engine[]
  combined: BrandHealthEngineMetric
  per_engine: Record<string, BrandHealthEngineMetric>
  per_intent_category: Record<string, BrandHealthEngineMetric>
  per_prompt: BrandHealthPerPrompt[]
  status: 'PARTIAL' | 'COMPLETE'
  createdAt?: string
}

export type NavId = 'overview' | 'prompts' | 'recommendations' | 'citations' | 'competitors'
