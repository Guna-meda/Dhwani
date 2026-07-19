'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import {
  Signal, ArrowLeft, BookOpen, Rocket, Layers, Radar, Store, Code2,
  HelpCircle, ExternalLink, CheckCircle2, ArrowRight,
} from 'lucide-react'

// ─── nav config ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'getting-started', label: 'Getting started', icon: Rocket },
  { id: 'concepts', label: 'Core concepts', icon: Layers },
  { id: 'engines', label: 'How AI engines pick sources', icon: Radar },
  { id: 'marketplace', label: 'Marketplace & tools', icon: Store },
  { id: 'api', label: 'API reference', icon: Code2 },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
]

// Each AI engine's official bot documentation — used as the source of truth,
// verified directly rather than assumed. If a platform changes its crawler
// setup (as Anthropic did in Feb 2026, splitting one bot into three), this
// is the page that goes stale first — check it against the linked source
// before trusting it blindly.
const ENGINE_PLAYBOOKS = [
  {
    key: 'google',
    name: 'Google AI Overviews',
    reach: '~45% of all Google searches',
    color: '#8EE6DD',
    summary:
      "Built on Google's normal Search index, layered with retrieval-augmented generation. Google's own guidance is unambiguous: no special AI markup, no llms.txt, no content chunked into AI-bait fragments — just do high-quality, crawlable, well-structured SEO.",
    doThis: [
      'Write genuinely first-hand content — a unique point of view outranks a summary of what already exists',
      'Keep the site technically clean: indexable, crawlable, fast, mobile-friendly',
      'Add Article / FAQPage / HowTo / Product schema where it genuinely applies',
      'Track results in Search Console\u2019s Generative AI performance report',
    ],
    bot: 'Google-Extended',
    officialDocs: 'https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers',
    officialDocsLabel: 'Google — crawler overview',
  },
  {
    key: 'chatgpt',
    name: 'ChatGPT',
    reach: '~63% of B2B software research (largest standalone AI search tool)',
    color: '#2AA198',
    summary:
      "Runs on a Bing-based index plus its own trained knowledge. \u201cContent-answer fit\u201d — how closely your structure matches ChatGPT's own answer format — outweighs domain authority alone. Freshness compounds fast: content updated in the last 30 days is cited roughly 3.2x more often.",
    doThis: [
      'Invest in backlinks and overall domain authority',
      'Refresh competitive content at least monthly',
      'Write conversationally, mirroring how ChatGPT itself structures an answer',
      'Use a clean H1 > H2 > H3 hierarchy with descriptive headings',
    ],
    bot: 'GPTBot (training) · OAI-SearchBot (search) · ChatGPT-User (live fetch)',
    officialDocs: 'https://platform.openai.com/docs/gptbot',
    officialDocsLabel: 'OpenAI — GPTBot & crawler docs',
  },
  {
    key: 'perplexity',
    name: 'Perplexity',
    reach: 'Always cites — the most transparent of the group',
    color: '#F0B94D',
    summary:
      'Blends its own index with Google\u2019s, then runs an initial relevance pass, a ranking-factor pass, and a final AI quality check. Keeps a curated trust list (Amazon, GitHub, major academic sites) and rewards fresh, short, self-contained content.',
    doThis: [
      'Allow PerplexityBot in robots.txt',
      'Add FAQPage schema to any page with real Q&A content',
      'Publish PDFs (whitepapers, guides) publicly rather than gating them',
      'Write short, self-contained paragraphs that work as standalone answers',
    ],
    bot: 'PerplexityBot',
    officialDocs: 'https://docs.perplexity.ai/guides/bots',
    officialDocsLabel: 'Perplexity — crawler guide',
  },
  {
    key: 'copilot',
    name: 'Microsoft Copilot',
    reach: 'Edge, Windows, Microsoft 365, Bing Search',
    color: '#7C9CF0',
    summary:
      "Runs entirely on Bing's index. If Bing hasn't indexed you, Copilot cannot cite you — full stop, regardless of content quality. LinkedIn/GitHub presence and sub-2-second page loads matter more here than almost anywhere else.",
    doThis: [
      'Submit your site to Bing Webmaster Tools (most teams skip this entirely)',
      'Use the IndexNow protocol for faster re-indexing',
      'Get page load time under 2 seconds',
      'Confirm Bingbot has full, unblocked crawl access',
    ],
    bot: 'Bingbot',
    officialDocs: 'https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a',
    officialDocsLabel: 'Bing — webmaster guidelines',
  },
  {
    key: 'claude',
    name: 'Claude',
    reach: 'Selective — processes a lot, cites comparatively little',
    color: '#D97757',
    summary:
      "Uses Brave Search as its backend when web search is on — a completely different index from Google or Bing, so Brave visibility specifically gates whether Claude can find you at all. Rewards factual density and precision over promotional tone.",
    doThis: [
      'Check whether your content appears in Brave Search results (search.brave.com)',
      'Allow ClaudeBot in robots.txt — note Anthropic now runs 3 separate bots (see box below)',
      'Maximize factual density: specific numbers, named sources, dated statistics',
      'Aim to be the single most accurate source on the topic, not just the most promotional one',
    ],
    bot: 'ClaudeBot · Claude-User · Claude-SearchBot',
    officialDocs: 'https://support.anthropic.com/en/articles/8896518',
    officialDocsLabel: 'Anthropic — crawler & robots.txt docs',
  },
]

const FUNDAMENTALS = [
  {
    title: 'Indexed',
    body: 'Each platform searches a different backend — Google, Bing, Brave, or their own. It can only ever cite what it has indexed, full stop.',
  },
  {
    title: 'Crawlable',
    body: 'AI bots need explicit permission in robots.txt. Block the bot, lose the citation — no amount of good content compensates for this.',
  },
  {
    title: 'Extractable',
    body: 'AI systems pull short passages, not whole pages. Clear headings, direct answers, and self-contained paragraphs win; walls of unstructured text lose.',
  },
]

const FAQ = [
  {
    q: 'What\u2019s the difference between a Discovery Audit and a Brand Health Audit?',
    a: 'Discovery measures how often your brand shows up at all across AI answer engines for queries relevant to your customers. Brand Health goes a layer deeper on the same queries — whether the mention is positive or negative, and what themes recur in how AI models describe you.',
  },
  {
    q: 'Do I need to run Discovery before Brand Health, or vice versa?',
    a: 'No — they\u2019re independent. One can be DONE while the other is untouched or still running, on the same product.',
  },
  {
    q: 'What is the Playground?',
    a: 'A canvas where you wire marketplace tools (like the AI Crawlability check) into a flow, run it against a product, and get back a single combined report — one run instead of using each tool separately.',
  },
  {
    q: 'Why did my crawlability score come back low even though my content is great?',
    a: 'Crawlability and content quality are separate gates. If an AI bot is blocked in robots.txt — or allowed there but blocked by a WAF/Cloudflare rule anyway — no amount of content quality gets you cited. Fix access first; it\u2019s the fundamental at the top of the AI engines section above.',
  },
  {
    q: 'Is llms.txt something I need?',
    a: 'For Google specifically: no — Google states plainly that no special AI markup or llms.txt is needed or used, and that chunking content into AI-bait fragments can actively hurt. Treat platform-specific advice as platform-specific, not universal.',
  },
]

// ─── page ───────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="border-b border-brand-border px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 bg-brand-bg/95 backdrop-blur z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-brand-accent" />
            <span className="font-display font-semibold text-brand-text">Dhwani</span>
          </Link>
        </div>
        <Link
          href={isSignedIn ? '/dashboard' : '/'}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
        >
          {isSignedIn ? 'Go to dashboard' : 'Sign in'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        {/* ── sidebar ── */}
        <nav className="hidden lg:block sticky top-24 self-start space-y-0.5">
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-2.5 text-sm text-brand-muted hover:text-brand-text hover:bg-brand-card rounded-md px-3 py-2 transition-colors"
            >
              <s.icon className="w-3.5 h-3.5 shrink-0" />
              {s.label}
            </a>
          ))}
        </nav>

        {/* ── content ── */}
        <div className="min-w-0 space-y-20 scroll-smooth">
          {/* Overview */}
          <section id="overview" className="scroll-mt-24">
            <h1 className="text-3xl font-display font-semibold text-brand-text">Documentation</h1>
            <p className="text-brand-muted mt-3 max-w-2xl leading-relaxed">
              Dhwani measures and improves how your business shows up in AI answer engines — ChatGPT,
              Claude, Gemini, Perplexity, and Google AI Overviews. This page covers how the product
              works, and — separately — how these engines actually decide what to cite, so you can act
              on your results instead of just reading them.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mt-6">
              {[
                { icon: Radar, title: 'Discovery Audit', body: 'How often you show up for queries your customers actually ask.' },
                { icon: Layers, title: 'Brand Health Audit', body: 'Whether you\u2019re described positively, and what themes recur.' },
                { icon: Store, title: 'Playground & Marketplace', body: 'Wire tools like the crawlability check into a flow and run it on demand.' },
              ].map(c => (
                <div key={c.title} className="bg-brand-surface border border-brand-border rounded-xl p-4">
                  <c.icon className="w-4 h-4 text-brand-accent mb-2" />
                  <div className="text-sm font-semibold text-brand-text">{c.title}</div>
                  <div className="text-xs text-brand-muted mt-1 leading-relaxed">{c.body}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Getting started */}
          <section id="getting-started" className="scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-brand-text flex items-center gap-2">
              <Rocket className="w-4 h-4 text-brand-accent" /> Getting started
            </h2>
            <ol className="mt-5 space-y-4">
              {[
                { title: 'Create your workspace', body: 'Sign up, then set up your company — this gives every audit a shared context.' },
                { title: 'Add a product', body: 'Give us a domain. We scan it automatically and extract context — no manual brief needed.' },
                { title: 'Choose an audit type', body: 'Discovery, Brand Health, or both. They run independently and can be started in any order.' },
                { title: 'Review the generated prompts', body: 'We draft a starting prompt set from your product context. Edit, add, or remove before confirming.' },
                { title: 'Run it, then read the report', body: 'Track progress live, then dig into citations, competitors, and recommendations once it completes.' },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-xs font-semibold text-brand-accent">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-text">{step.title}</div>
                    <div className="text-xs text-brand-muted mt-0.5 leading-relaxed">{step.body}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Core concepts */}
          <section id="concepts" className="scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-brand-text flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-accent" /> Core concepts
            </h2>
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
                <div className="text-sm font-semibold text-brand-text">Discovery vs. Brand Health</div>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                  Discovery answers <em>&ldquo;do I show up at all?&rdquo;</em> for queries your customers ask.
                  Brand Health answers <em>&ldquo;when I do show up, how am I described?&rdquo;</em> — sentiment
                  and recurring themes on the same kind of queries. A product can be visible and still
                  be described poorly, or invisible and never get the chance to be judged either way —
                  that\u2019s why they\u2019re tracked separately.
                </p>
              </div>
              <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
                <div className="text-sm font-semibold text-brand-text">Flows &amp; the Playground</div>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                  A Flow is a small graph of marketplace tools wired together — add nodes, connect
                  outputs where a tool accepts another tool\u2019s result, and run the whole thing against
                  one product. The report comes back as one combined view instead of jumping between
                  tools individually.
                </p>
              </div>
              <div className="bg-brand-surface border border-brand-border rounded-xl p-5 sm:col-span-2">
                <div className="text-sm font-semibold text-brand-text">Marketplace vs. your Tool Library</div>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                  The Marketplace is the full catalog of available tools. Adding one to your Library
                  doesn\u2019t change anything about it — it just makes it available as a node when you\u2019re
                  building a Flow. Removing a tool from your library doesn\u2019t touch flows that already
                  use it; it only blocks adding new nodes with it going forward.
                </p>
              </div>
            </div>
          </section>

          {/* Engines */}
          <section id="engines" className="scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-brand-text flex items-center gap-2">
              <Radar className="w-4 h-4 text-brand-accent" /> How AI engines actually pick sources
            </h2>
            <p className="text-sm text-brand-muted mt-3 max-w-2xl leading-relaxed">
              &ldquo;AI visibility&rdquo; gets sold as one target, but each engine has a different retrieval
              mechanism and rewards different things — citation volume for the same brand has been
              measured to differ by up to <strong className="text-brand-text">615x</strong> between
              platforms. Get the fundamentals right first; they gate everything else.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mt-6">
              {FUNDAMENTALS.map(f => (
                <div key={f.title} className="bg-brand-card border border-brand-border rounded-xl p-4">
                  <div className="text-sm font-semibold text-brand-accent">{f.title}</div>
                  <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-brand-card/60 border border-brand-border rounded-xl p-4 text-xs text-brand-muted leading-relaxed">
              <strong className="text-brand-text">One safe exception:</strong> CCBot (Common Crawl) can
              be blocked without losing any citations — it only feeds AI training datasets, not live
              search or citation.
            </div>

            <div className="mt-10 space-y-5">
              {ENGINE_PLAYBOOKS.map(e => (
                <div key={e.key} className="bg-brand-surface border border-brand-border rounded-xl p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                      <h3 className="text-base font-display font-semibold text-brand-text">{e.name}</h3>
                    </div>
                    <span className="text-[11px] text-brand-muted bg-brand-card border border-brand-border rounded-full px-2.5 py-1">
                      {e.reach}
                    </span>
                  </div>

                  <p className="text-xs text-brand-muted mt-3 leading-relaxed">{e.summary}</p>

                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-[11px] font-semibold text-brand-text uppercase tracking-wide mb-1.5">
                        What to actually do
                      </div>
                      <ul className="space-y-1.5">
                        {e.doThis.map(d => (
                          <li key={d} className="flex gap-1.5 text-xs text-brand-muted leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-brand-text uppercase tracking-wide mb-1.5">
                          Bot to allow in robots.txt
                        </div>
                        <code className="text-xs text-brand-accent bg-brand-card border border-brand-border rounded-md px-2 py-1 inline-block">
                          {e.bot}
                        </code>
                      </div>
                      <a
                        href={e.officialDocs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-brand-accent hover:underline mt-4 w-fit"
                      >
                        {e.officialDocsLabel}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-brand-card/60 border border-brand-border rounded-xl p-4 text-xs text-brand-muted leading-relaxed">
              <strong className="text-brand-text">Where to start, in practical order:</strong> Google AI
              Overviews reaches the most people and needs the least new work if your SEO is already
              solid. Then ChatGPT — prioritize freshness and matching its answer style. Then Perplexity,
              especially if your audience skews technical. Copilot and Claude are lower priority unless
              your audience specifically skews Microsoft-enterprise or developer/analyst — but the three
              fundamentals above help on every platform regardless.
            </div>
          </section>

          {/* Marketplace */}
          <section id="marketplace" className="scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-brand-text flex items-center gap-2">
              <Store className="w-4 h-4 text-brand-accent" /> Marketplace &amp; tools
            </h2>
            <p className="text-sm text-brand-muted mt-3 max-w-2xl leading-relaxed">
              Tools you can drop into a Flow. Each one runs against a product and returns a section of
              the combined report.
            </p>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-text">AI Crawlability Check</span>
                  <span className="text-[10px] bg-brand-accent/10 text-brand-accent border border-brand-accent/30 rounded-full px-2 py-0.5">Live</span>
                </div>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                  Checks robots.txt <em>and</em> live server responses per AI bot — catching not just
                  robots.txt blocks but WAF/Cloudflare-level blocks that allow-in-robots.txt alone would
                  miss entirely.
                </p>
              </div>
              <div className="bg-brand-surface border border-dashed border-brand-border rounded-xl p-5 opacity-70">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-text">Extractability Check</span>
                  <span className="text-[10px] bg-brand-card text-brand-muted border border-brand-border rounded-full px-2 py-0.5">Coming soon</span>
                </div>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                  Heading structure, schema markup, and self-contained-paragraph scoring — the
                  &ldquo;extractable&rdquo; fundamental from the section above, checked automatically.
                </p>
              </div>
            </div>
          </section>

          {/* API */}
          <section id="api" className="scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-brand-text flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand-accent" /> API reference
            </h2>
            <p className="text-sm text-brand-muted mt-3 max-w-2xl leading-relaxed">
              The full REST API is documented with interactive Swagger UI, generated directly from the
              backend so it never drifts out of sync with what\u2019s actually deployed.
            </p>
            <a
              href={`${(process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/api\/v1\/?$/, '')}/api-docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-brand-bg bg-brand-primary hover:bg-brand-accent transition-colors rounded-lg px-4 py-2.5"
            >
              Open API docs
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-24 pb-16">
            <h2 className="text-xl font-display font-semibold text-brand-text flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-accent" /> FAQ
            </h2>
            <div className="mt-5 divide-y divide-brand-border border-y border-brand-border">
              {FAQ.map(item => (
                <details key={item.q} className="group py-4">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-brand-text list-none">
                    {item.q}
                    <span className="text-brand-muted group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                  </summary>
                  <p className="text-xs text-brand-muted mt-2.5 leading-relaxed max-w-2xl">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
