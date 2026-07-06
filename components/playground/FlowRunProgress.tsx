'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getFlowRun, ApiError, type FlowRunReport } from '@/lib/api/client'

const POLL_INTERVAL_MS = 4_000 // flow runs are much shorter-lived than audits — poll faster than AuditProgress's 25s

interface FlowRunProgressProps {
  flowRunId: string
  getToken: () => Promise<string>
  onUpdate: (report: FlowRunReport) => void
}

// Deliberately its own small polling component rather than reusing
// AuditProgress — the shapes are unrelated (stepResults/sections vs
// done/total prompt counts) and Playground stays fully separate from the
// audit system per the isolation requirement.
export default function FlowRunProgress({ flowRunId, getToken, onUpdate }: FlowRunProgressProps) {
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const token = await getToken()
        const { report } = await getFlowRun(token, flowRunId)
        if (cancelled) return
        onUpdate(report)
        if (report.status === 'DONE' || report.status === 'FAILED') {
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Error checking flow run status.')
      }
    }

    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowRunId])

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  return (
    <div className="flex items-center gap-2 text-sm text-brand-muted">
      <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
      Running your flow…
    </div>
  )
}
