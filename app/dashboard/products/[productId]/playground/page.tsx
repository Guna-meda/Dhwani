'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, Loader2, AlertCircle, Workflow, History } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import {
  getProduct,
  listFlows,
  runFlow,
  listProductFlowRuns,
  ApiError,
  type Product,
  type FlowSummary,
  type FlowRunReport,
  type FlowRunHistoryEntry,
} from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/components/dashboard/utils'
import FlowRunProgress from '@/components/playground/FlowRunProgress'
import FlowRunReportView from '@/components/playground/FlowRunReportView'

export default function ProductPlaygroundPage() {
  const params = useParams<{ productId: string }>()
  const productId = params.productId
  const router = useRouter()
  const { getToken } = useApp()

  const [product, setProduct] = useState<Product | null>(null)
  const [flows, setFlows] = useState<FlowSummary[] | null>(null)
  const [history, setHistory] = useState<FlowRunHistoryEntry[] | null>(null)
  const [error, setError] = useState('')

  const [selectedFlowId, setSelectedFlowId] = useState('')
  const [starting, setStarting] = useState(false)
  const [activeFlowRunId, setActiveFlowRunId] = useState<string | null>(null)
  const [activeReport, setActiveReport] = useState<FlowRunReport | null>(null)

  async function loadAll() {
    setError('')
    try {
      const token = await getToken()
      const [fetchedProduct, { flows: fetchedFlows }, { runs }] = await Promise.all([
        getProduct(token, productId),
        listFlows(token),
        listProductFlowRuns(token, productId),
      ])
      setProduct(fetchedProduct)
      setFlows(fetchedFlows)
      setHistory(runs)
      if (fetchedFlows.length > 0) setSelectedFlowId(prev => prev || fetchedFlows[0]._id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the Playground for this product.')
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  async function handleRun() {
    if (!selectedFlowId) return
    setStarting(true)
    setError('')
    setActiveReport(null)
    try {
      const token = await getToken()
      const { flow_run_id } = await runFlow(token, selectedFlowId, productId)
      setActiveFlowRunId(flow_run_id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start this flow run.')
    } finally {
      setStarting(false)
    }
  }

  function handleReportUpdate(report: FlowRunReport) {
    setActiveReport(report)
    if (report.status === 'DONE' || report.status === 'FAILED') {
      // Refresh history so the run we just watched shows up in the list below.
      getToken()
        .then(token => listProductFlowRuns(token, productId))
        .then(({ runs }) => setHistory(runs))
        .catch(() => {})
    }
  }

  function viewPastRun(flowRunId: string) {
    setActiveReport(null)
    setActiveFlowRunId(flowRunId)
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="border-b border-brand-border px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push(`/dashboard/products/${productId}`)}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {product ? product.product_name : 'Product'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Workflow className="w-4.5 h-4.5 text-brand-accent" />
          <h1 className="text-xl font-display font-semibold text-brand-text">Playground</h1>
        </div>
        <p className="text-sm text-brand-muted mb-6">
          Run one of your saved flows against this product. Results are kept per run — nothing here overwrites
          Discovery or Brand Health.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!flows && !error && <div className="text-center py-16 text-brand-muted text-sm">Loading…</div>}

        {flows && flows.length === 0 && (
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 text-center mb-8">
            <p className="text-sm text-brand-text mb-3">You don&apos;t have any saved flows yet.</p>
            <Button size="sm" onClick={() => router.push('/flows')}>
              Build a flow
            </Button>
          </div>
        )}

        {flows && flows.length > 0 && (
          <div className="flex items-center gap-2 bg-brand-card border border-brand-border rounded-xl p-3 mb-8">
            <select
              value={selectedFlowId}
              onChange={(e) => setSelectedFlowId(e.target.value)}
              className="flex-1 bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-accent"
            >
              {flows.map(flow => (
                <option key={flow._id} value={flow._id}>
                  {flow.name} ({flow.node_count} node{flow.node_count === 1 ? '' : 's'})
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleRun} disabled={starting || !selectedFlowId}>
              {starting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run
            </Button>
          </div>
        )}

        {activeFlowRunId && (
          <div className="mb-8">
            {(!activeReport || (activeReport.status !== 'DONE' && activeReport.status !== 'FAILED')) && (
              <div className="mb-4">
                <FlowRunProgress flowRunId={activeFlowRunId} getToken={getToken} onUpdate={handleReportUpdate} />
              </div>
            )}
            {activeReport && <FlowRunReportView report={activeReport} />}
          </div>
        )}

        {history && history.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-3.5 h-3.5 text-brand-muted" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-brand-muted">Past runs</h2>
            </div>
            <div className="space-y-1.5">
              {history.map(run => (
                <button
                  key={run.flow_run_id}
                  onClick={() => viewPastRun(run.flow_run_id)}
                  className="w-full flex items-center justify-between gap-3 bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-left hover:bg-brand-surface transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-brand-text truncate">{run.flow_name}</p>
                    <p className="text-xs text-brand-muted">{formatDate(run.created_at)}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      run.status === 'DONE'
                        ? 'text-brand-accent'
                        : run.status === 'FAILED'
                        ? 'text-red-400'
                        : 'text-brand-muted'
                    }`}
                  >
                    {run.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
