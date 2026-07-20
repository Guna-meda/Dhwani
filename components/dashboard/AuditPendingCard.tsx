'use client'

import { useRouter } from 'next/navigation'
import { Loader2, ListChecks, PlayCircle, ArrowRight } from 'lucide-react'
import type { AuditTypeState } from '@/lib/api/client'

interface AuditPendingCardProps {
  productId: string
  auditType: 'discovery' | 'brandhealth'
  state: AuditTypeState
}

const LABELS = { discovery: 'Discovery', brandhealth: 'Brand Health' }

export default function AuditPendingCard({ productId, auditType, state }: AuditPendingCardProps) {
  const router = useRouter()
  const label = LABELS[auditType]

  if (state.status === 'RUNNING') {
    const pct = state.progress && state.progress.total > 0
      ? Math.round((state.progress.done / state.progress.total) * 100)
      : null
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-md mx-auto mt-12">
        <Loader2 className="w-6 h-6 text-brand-accent animate-spin mx-auto mb-4" />
        <h3 className="text-base font-semibold text-brand-text">{label} audit is running</h3>
        <p className="text-sm text-brand-muted mt-1.5">
          {state.progress
            ? `${state.progress.done} of ${state.progress.total} prompts completed${pct !== null ? ` (${pct}%)` : ''}.`
            : 'This updates automatically — no need to keep this tab open.'}
        </p>
        <p className="text-xs text-brand-muted mt-3">
          Feel free to use the Marketplace, Playground, or Docs in the meantime — this keeps running in the background.
        </p>
      </div>
    )
  }

  // NOT_STARTED with next_step === 'review-prompts': prompts were already
  // generated but never confirmed (e.g. the tab was closed mid-review).
  if (state.next_step === 'review-prompts') {
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-md mx-auto mt-12">
        <ListChecks className="w-6 h-6 text-brand-accent mx-auto mb-4" />
        <h3 className="text-base font-semibold text-brand-text">You have prompts waiting for review</h3>
        <p className="text-sm text-brand-muted mt-1.5">
          Pick up where you left off for the {label} audit — review or edit the prompt set, then confirm to start it.
        </p>
        <button
          onClick={() => router.push(`/dashboard/products/${productId}/setup/prompts?auditType=${auditType}`)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-bg bg-brand-primary hover:bg-brand-accent transition-colors rounded-lg px-4 py-2.5 mt-5"
        >
          Review prompts
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  // Genuinely never started.
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-md mx-auto mt-12">
      <PlayCircle className="w-6 h-6 text-brand-accent mx-auto mb-4" />
      <h3 className="text-base font-semibold text-brand-text">{label} audit hasn&apos;t run yet</h3>
      <p className="text-sm text-brand-muted mt-1.5">
        Run it whenever you&apos;re ready — everything else in the dashboard works regardless.
      </p>
      <button
        onClick={() => router.push(`/dashboard/products/${productId}/setup/audit-type`)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-bg bg-brand-primary hover:bg-brand-accent transition-colors rounded-lg px-4 py-2.5 mt-5"
      >
        Start {label} audit
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
