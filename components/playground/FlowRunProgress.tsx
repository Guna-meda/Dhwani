'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getFlowRun, ApiError, type FlowRunReport } from '@/lib/api/client'

const POLL_INTERVAL_MS = 4_000 // flow runs are much shorter-lived than audits — poll faster than AuditProgress's 25s

// Past this point, show a reassuring note instead of a bare spinner. Tools
// that call a real external data source (e.g. Reddit Thread Finder's
// BrightData search, which can take up to ~80s per search term) can
// genuinely take a couple of minutes — without this, a static "Running
// your flow…" for that long could read as stuck rather than working.
const SLOW_RUN_THRESHOLD_MS = 20_000

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
  const [elapsedMs, setElapsedMs] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(Date.now())

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
          if (tickRef.current) clearInterval(tickRef.current)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Error checking flow run status.')
      }
    }

    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
    // Separate, more frequent tick just for the elapsed-time display — kept
    // apart from the actual poll interval so the "still working" message
    // updates smoothly regardless of the 4s poll cadence.
    tickRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 1_000)

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (tickRef.current) clearInterval(tickRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowRunId])

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  return (
    <div className="flex items-center gap-2 text-sm text-brand-muted">
      <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
      <span>
        Running your flow…
        {elapsedMs > SLOW_RUN_THRESHOLD_MS && (
          <span className="block text-xs text-brand-muted/80 mt-0.5">
            Tools that search external sources (like Reddit) can take a couple of minutes — still working.
          </span>
        )}
      </span>
    </div>
  )
}