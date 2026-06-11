export interface PlatformBreakdown {
  chatgpt: number;
  claude: number;
  gemini: number;
  perplexity: number;
}

export interface CitationGap {
  source: string;
  coverage: string; // e.g. "No mention", "Partial citation", "Low density"
  type: string; // e.g. "Community Forums", "Documentation Sync", "Wikipedia"
}

export interface ContentSuggestion {
  title: string;
  platformHint: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface Audit {
  id: string;
  businessName: string;
  category: string;
  city: string;
  visibilityScore: number;
  topCompetitor: string;
  competitorVisibilityScore: number;
  competitorAdvantageFactor: number; // e.g. "12x more often"
  missingQueriesCount: number;
  citationGapsCount: number;
  timestamp: string;
  platformBreakdown: PlatformBreakdown;
  missingQueriesList: string[];
  citationGapsList: CitationGap[];
  recommendations: string[];
  contentSuggestions: ContentSuggestion[];
}

export interface ClerkUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

export type DashboardView = 'overview' | 'audits' | 'competitors' | 'reports' | 'billing' | 'settings';
