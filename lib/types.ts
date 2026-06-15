export interface PlatformBreakdown {
  chatgpt: number
  claude: number
  gemini: number
  perplexity: number
}

export interface CitationGap {
  source: string
  coverage: string
  type: string
}

export interface ContentSuggestion {
  title: string
  platformHint: string
  priority: 'High' | 'Medium' | 'Low'
}

export interface Audit {
  id: string
  businessName: string
  category: string
  city: string
  visibilityScore: number
  topCompetitor: string
  competitorVisibilityScore: number
  competitorAdvantageFactor: number
  missingQueriesCount: number
  citationGapsCount: number
  timestamp: string
  platformBreakdown: PlatformBreakdown
  missingQueriesList: string[]
  citationGapsList: CitationGap[]
  recommendations: string[]
  contentSuggestions: ContentSuggestion[]
}

export type DashboardView = 'overview' | 'audits' | 'competitors' | 'reports' | 'billing' | 'settings'
