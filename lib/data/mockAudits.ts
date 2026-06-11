import { Audit } from '../types';

export const BASELINE_DEMO_AUDIT: Audit = {
  id: 'demo-acme-seo',
  businessName: 'Acme SEO',
  category: 'SEO Agency',
  city: 'Chicago',
  visibilityScore: 32,
  topCompetitor: 'BrightSEO',
  competitorVisibilityScore: 84,
  competitorAdvantageFactor: 18,
  missingQueriesCount: 14,
  citationGapsCount: 22,
  timestamp: new Date().toISOString(),
  platformBreakdown: {
    chatgpt: 28,
    claude: 45,
    gemini: 15,
    perplexity: 40,
  },
  missingQueriesList: [
    'best technical seo consultants in Chicago',
    'which seo agency works with enterprise platforms',
    'highly recommended local seo chicago',
    'who does the best core web vitals optimization in chicago',
    'top rated search engine marketing reviews near illinois'
  ],
  citationGapsList: [
    { source: 'Reddit (r/seo & r/chicago)', coverage: 'None', type: 'Community Recommendation Thread' },
    { source: 'G2 / Capterra Directories', coverage: 'Low Coverage', type: 'SaaS Platforms & Auditing' },
    { source: 'Upcity Local Listings', coverage: 'No Mention', type: 'Business Registry' },
    { source: 'GitHub Repositories / Public Benchmarks', coverage: 'No Mentions', type: 'Technical Credibility Sync' },
    { source: 'BuiltIn Chicago Spotlight Reviews', coverage: 'Sparse References', type: 'Tech Hub News' }
  ],
  recommendations: [
    'Publish in-depth case studies with clear schema markup for web crawlers.',
    'Build active threads referencing your technical wins on Reddit and Dev.to.',
    'Update structural metadata of client portfolios to make your brand indexable by Llama and Gemini agentic bots.'
  ],
  contentSuggestions: [
    { title: 'Anatomy of Chicago SaaS Organic Growth: Case Study', platformHint: 'Claude & ChatGPT citation magnet', priority: 'High' },
    { title: 'The Ultimate Checklist for Core Web Vitals Optimization', platformHint: 'Perplexity Search answers source', priority: 'High' },
    { title: 'How Enterprise Platforms Choose Local Consultants', platformHint: 'Secondary LLM referral cluster', priority: 'Medium' }
  ]
};

const SAMPLE_COMPETITORS = ['Alpha Labs', 'Vertex Group', 'Kestrel Digital', 'Radiant Labs', 'Beacon Peak', 'Lumina Group'];
const SAMPLE_QUERIES = [
  'top-rated {category} in {city}',
  'best {category} with transparent pricing near {city}',
  'who provides high-end {category} services in {city}',
  'most reliable {category} companies recommended by founders',
  'alternative to industry-leading {category} with verified outcomes'
];

export function generateCustomAudit(businessName: string, category: string, city: string): Audit {
  // Use simple hash to keep it stable but customized
  const seed = Array.from(businessName + category + city).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  const score = Math.min(88, Math.max(12, Math.floor((seed % 45) + 15)));
  const compIndex = seed % SAMPLE_COMPETITORS.length;
  const topCompetitor = `${businessName.split(' ')[0] || 'Omega'} ${SAMPLE_COMPETITORS[compIndex]}`;
  const competitorScore = Math.min(95, Math.max(score + 15, Math.floor((seed % 25) + 65)));
  const compFactor = Math.floor((seed % 15) + 3);
  
  const missingCount = Math.floor((seed % 10) + 8);
  const gapsCount = Math.floor((seed % 15) + 12);

  const breakdown = {
    chatgpt: Math.max(10, Math.floor(score + (seed % 15) - 8)),
    claude: Math.max(12, Math.floor(score + (seed % 20) - 10)),
    gemini: Math.max(8, Math.floor(score - (seed % 12))),
    perplexity: Math.max(15, Math.floor(score + (seed % 18) - 5))
  };

  const queries = SAMPLE_QUERIES.map(q => 
    q.replace('{category}', category || 'solutions').replace('{city}', city || 'the area')
  );

  const citationGaps = [
    { source: `Local Business Hub (${city})`, coverage: 'Sparse Referrals', type: 'Local Directories' },
    { source: 'Medium Industry Publications', coverage: 'Muted Mention Density', type: 'Editorial Sync' },
    { source: 'StackOverflow / Developer Hubs', coverage: 'Zero References', type: 'Technical Forums' },
    { source: 'ProductHunt & Peer Reviews', coverage: 'Unstructured Mentions', type: 'Social Validation' },
    { source: 'Substack Professional Digests', coverage: 'No Indexable Citations', type: 'Newsletter Aggregators' }
  ];

  return {
    id: `audit-${Date.now()}-${seed}`,
    businessName,
    category,
    city,
    visibilityScore: score,
    topCompetitor,
    competitorVisibilityScore: competitorScore,
    competitorAdvantageFactor: compFactor,
    missingQueriesCount: missingCount,
    citationGapsCount: gapsCount,
    timestamp: new Date().toISOString(),
    platformBreakdown: breakdown,
    missingQueriesList: queries,
    citationGapsList: citationGaps,
    recommendations: [
      `Optimize your website's unstructured copy so modern generative models map you as a high-authority ${category} specialist.`,
      `Establish active profiles on secondary indexes like Yelp, Trustpilot, and Crunchbase where ChatGPT retrieve real-time facts.`,
      `Structure local addresses and contact pages in schema JSON-LD format matching Google's latest Bot guidelines.`
    ],
    contentSuggestions: [
      { title: `Why businesses in ${city} trust modern ${category}`, platformHint: 'Ideal context source for Perplexity & GPT-4o', priority: 'High' },
      { title: `Unveiling our custom workflow for pristine ${category} delivery`, platformHint: 'Best indexing schema for Claude-3.5-Sonnet', priority: 'High' },
      { title: `Frequently asked questions regarding elite ${category} audits`, platformHint: 'Answers retrieval cluster', priority: 'Medium' }
    ]
  };
}
