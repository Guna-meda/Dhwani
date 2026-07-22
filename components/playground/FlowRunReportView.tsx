import ExportPdfButton from '@/components/dashboard/ExportPdfButton'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import DynamicIcon from '@/components/marketplace/DynamicIcon'
import { formatDate } from '@/components/dashboard/utils'
import CrawlabilityReport, { isCrawlabilityOutput } from './CrawlabilityReport'
import type { FlowRunReport, FlowRunSection } from '@/lib/api/client'

function StatusBadge({ status }: { status: FlowRunSection['status'] }) {
  if (status === 'DONE') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Done
      </span>
    )
  }
  if (status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400">
        <XCircle className="w-3.5 h-3.5" />
        Failed
      </span>
    )
  }
  if (status === 'RUNNING') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-muted">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Running
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-muted">
      <Clock className="w-3.5 h-3.5" />
      Queued
    </span>
  )
}

// output_schema is documentation, not an enforced shape — falls back to a
// raw JSON dump for any tool that doesn't have a bespoke renderer below yet.
function OutputPreview({ output, toolSlug }: { output: unknown; toolSlug: string | null }) {
  if (output === null || output === undefined) {
    return <p className="text-xs text-brand-muted italic">No output yet.</p>
  }
  if (toolSlug === 'ai-search-crawler-sim' && isCrawlabilityOutput(output)) {
    return <CrawlabilityReport output={output} />
  }
  if (typeof output === 'object') {
    return (
      <pre className="text-xs text-brand-text bg-brand-bg border border-brand-border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(output, null, 2)}
      </pre>
    )
  }
  return <p className="text-xs text-brand-text">{String(output)}</p>
}

export default function FlowRunReportView({ report }: { report: FlowRunReport }) {
  return (
    <div>
      <div className="flex justify-end mb-2">
        <ExportPdfButton label="Export report as PDF" />
      </div>
      <div className="space-y-3 print-content">
      {report.sections.map(section => (
        <div key={section.node_id} className="bg-brand-card border border-brand-border rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-brand-bg border border-brand-border flex items-center justify-center text-brand-accent shrink-0">
                <DynamicIcon name={section.tool_icon} className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-brand-text truncate">{section.tool_name}</h3>
              <span className="text-[10px] font-mono text-brand-muted shrink-0">v{section.tool_version}</span>
            </div>
            <StatusBadge status={section.status} />
          </div>

          {section.status === 'FAILED' && section.error && (
            <p className="text-xs text-red-400 mb-2">{section.error}</p>
          )}

          <OutputPreview output={section.output} toolSlug={section.tool_slug} />

          {section.completed_at && (
            <p className="text-[10px] font-mono text-brand-muted mt-2">
              Completed {formatDate(section.completed_at)}
            </p>
          )}
        </div>
      ))}
      </div>
    </div>
  )
}
