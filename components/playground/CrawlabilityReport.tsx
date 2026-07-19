import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react'

type BotStatus = 'OPEN' | 'ROBOTS_BLOCKED' | 'WAF_BLOCKED' | 'RATE_LIMITED' | 'UNREACHABLE'

type CrawlabilityOutput = {
  crawlability_score: number | null
  robots_txt_found: boolean
  checked_url: string
  bots: { key: string; label: string; engine: string; status: BotStatus; detail: string | null }[]
  issues: { severity: string; bot: string; message: string }[]
  fixed_robots_txt_snippet: string | null
  checked_at: string
}

// Narrow, don't assume — output_schema is documentation, not an enforced
// runtime shape, so a malformed/older payload should fall back to the
// generic JSON view in FlowRunReportView rather than crash here.
export function isCrawlabilityOutput(output: unknown): output is CrawlabilityOutput {
  if (!output || typeof output !== 'object') return false
  const o = output as Record<string, unknown>
  return Array.isArray(o.bots) && typeof o.checked_url === 'string'
}

const STATUS_META: Record<BotStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  OPEN: { icon: CheckCircle2, color: 'text-brand-accent', label: 'Open' },
  ROBOTS_BLOCKED: { icon: XCircle, color: 'text-red-400', label: 'Blocked in robots.txt' },
  WAF_BLOCKED: { icon: XCircle, color: 'text-red-400', label: 'Blocked by server/WAF' },
  RATE_LIMITED: { icon: AlertTriangle, color: 'text-amber-400', label: 'Rate limited' },
  UNREACHABLE: { icon: HelpCircle, color: 'text-brand-muted', label: 'Unreachable' },
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-brand-muted'
  if (score >= 80) return 'text-brand-accent'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

export default function CrawlabilityReport({ output }: { output: CrawlabilityOutput }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className={`text-3xl font-display font-semibold ${scoreColor(output.crawlability_score)}`}>
          {output.crawlability_score ?? '—'}
          <span className="text-sm text-brand-muted font-normal">/100</span>
        </div>
        <div className="text-xs text-brand-muted leading-relaxed">
          <div className="truncate max-w-70">{output.checked_url}</div>
          <div>{output.robots_txt_found ? 'robots.txt found' : 'No robots.txt — everything allowed by default'}</div>
        </div>
      </div>

      <div className="space-y-1.5">
        {output.bots.map(bot => {
          const meta = STATUS_META[bot.status]
          const Icon = meta.icon
          return (
            <div key={bot.key} className="flex items-start gap-2 text-xs">
              <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${meta.color}`} />
              <div className="min-w-0">
                <span className="text-brand-text font-medium">{bot.label}</span>
                <span className="text-brand-muted"> — {meta.label}</span>
                {bot.detail && <div className="text-brand-muted mt-0.5">{bot.detail}</div>}
              </div>
            </div>
          )
        })}
      </div>

      {output.fixed_robots_txt_snippet && (
        <div>
          <div className="text-[11px] font-semibold text-brand-text uppercase tracking-wide mb-1.5">
            Suggested robots.txt fix
          </div>
          <pre className="text-xs text-brand-accent bg-brand-bg border border-brand-border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
            {output.fixed_robots_txt_snippet}
          </pre>
        </div>
      )}
    </div>
  )
}