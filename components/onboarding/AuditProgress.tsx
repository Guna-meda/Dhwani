'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/context/AppContext'
import {
  getDiscoveryProgress, getDiscoverySummary,
  getBrandHealthProgress, getBrandHealthSummary,
  ApiError,
} from '@/lib/api/client'
import { Signal, Loader2 } from 'lucide-react'

const POLL_INTERVAL_MS = 25_000 // 25 seconds

export default function AuditProgress() {
  const { getToken, auditType, productId, setScreen, setSummary, setAuditProgress } = useApp()
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [statusMsg, setStatusMsg] = useState('Initializing audit…')
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSummaryWithRetry = async (token: string, retries = 5): Promise<void> => {
    for (let i = 0; i < retries; i++) {
      try {
        const s = auditType === 'discovery'
          ? await getDiscoverySummary(token, productId!)
          : await getBrandHealthSummary(token, productId!)
        setSummary(s)
        setScreen('dashboard')
        return
      } catch (err) {
        if (err instanceof ApiError && err.status === 404 && i < retries - 1) {
          await new Promise(r => setTimeout(r, 5000))
          continue
        }
        throw err
      }
    }
  }

  const poll = async () => {
    if (!productId) return
    try {
      const token = await getToken()
      const progress = auditType === 'discovery'
        ? await getDiscoveryProgress(token, productId)
        : await getBrandHealthProgress(token, productId)

      setDone(progress.done)
      setTotal(progress.total)
      setAuditProgress(progress)

      if (progress.status === 'DONE' || progress.done >= progress.total) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setStatusMsg('Audit complete — building your report…')
        await fetchSummaryWithRetry(token)
      } else {
        setStatusMsg(`Running ${progress.done} of ${progress.total} prompts…`)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error fetching progress.')
    }
  }

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Animated icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-card border border-brand-border mx-auto mb-6 text-brand-accent">
          <Signal className="w-8 h-8 animate-pulse" />
        </div>

        <h1 className="text-xl font-display font-semibold text-brand-text mb-2">Running your audit</h1>
        <p className="text-sm text-brand-muted mb-8">{statusMsg}</p>

        {/* Progress bar */}
        <div className="bg-brand-card border border-brand-border rounded-full h-2 mb-3 overflow-hidden">
          <div
            className="h-full bg-brand-accent rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-brand-muted mb-8">
          <span>{done} of {total || '…'} complete</span>
          <span>{pct}%</span>
        </div>

        {/* Log-style rows */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-left space-y-2">
          {[
            { label: 'Sending prompts to AI models', done: done > 0 },
            { label: 'Collecting responses', done: done >= Math.ceil(total * 0.5) },
            { label: 'Processing results', done: done >= Math.ceil(total * 0.8) },
            { label: 'Building summary report', done: done >= total && total > 0 },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${step.done ? 'bg-brand-accent' : 'bg-brand-border'}`} />
              <span className={step.done ? 'text-brand-text' : 'text-brand-muted'}>{step.label}</span>
              {!step.done && i === (done === 0 ? 0 : done < Math.ceil(total * 0.5) ? 1 : done < Math.ceil(total * 0.8) ? 2 : 3) && (
                <Loader2 className="w-3 h-3 text-brand-muted animate-spin ml-auto" />
              )}
            </div>
          ))}
        </div>

        <p className="text-[11px] text-brand-muted mt-6">
          You can safely close this tab. We'll keep running in the background.
        </p>

        {error && <p className="text-red-400 text-xs mt-4">{error}</p>}
      </div>
    </div>
  )
}
