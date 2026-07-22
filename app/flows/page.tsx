'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Workflow, Plus, Trash2, Loader2, AlertCircle, ChevronRight } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { listFlows, deleteFlow, ApiError, type FlowSummary } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/components/dashboard/utils'

export default function FlowsPage() {
  return (
    <Suspense fallback={null}>
      <FlowsPageInner />
    </Suspense>
  )
}

function FlowsPageInner() {
  const router = useRouter()
  const { getToken } = useApp()
  const searchParams = useSearchParams()
  const fromProductId = searchParams.get('from')
  const marketplaceHref = fromProductId ? `/marketplace?from=${fromProductId}` : '/marketplace'

  const [flows, setFlows] = useState<FlowSummary[] | null>(null)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setError('')
    try {
      const token = await getToken()
      const { flows: fetched } = await listFlows(token)
      setFlows(fetched)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your flows.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A brand-new flow starts with zero nodes and is saved right away, then
  // The backend requires every Flow to have at least one node, on create AND
  // update (validateFlowShape) — a flow can never be saved empty. So "New
  // flow" can't eagerly POST /flows with nodes: [] like it used to; that
  // 400s every time. Instead it's a client-only draft until the person adds
  // a node and saves — see app/flows/[flowId]/page.tsx's "new" handling.
  function handleNewFlow() {
    router.push('/flows/new')
  }

  async function handleDelete(flowId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm('Delete this flow? Past run history for it is kept, but the flow itself can\'t be recovered.')) {
      return
    }
    setDeletingId(flowId)
    try {
      const token = await getToken()
      await deleteFlow(token, flowId)
      setFlows(prev => prev?.filter(f => f._id !== flowId) ?? prev)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete that flow.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="border-b border-brand-border px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push(marketplaceHref)}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Marketplace
        </button>
        <Button size="sm" onClick={handleNewFlow}>
          <Plus className="w-3.5 h-3.5" />
          New flow
        </Button>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Workflow className="w-4.5 h-4.5 text-brand-accent" />
          <h1 className="text-xl font-display font-semibold text-brand-text">Flows</h1>
        </div>
        <p className="text-sm text-brand-muted mb-6">
          Saved Playground arrangements. These belong to your account, not any one workspace or product — run the
          same flow against any product from that product&apos;s dashboard.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!flows && !error && <div className="text-center py-24 text-brand-muted text-sm">Loading…</div>}

        {flows && flows.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <div className="w-14 h-14 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center text-brand-muted mb-4">
              <Workflow className="w-7 h-7" />
            </div>
            <h2 className="text-base font-display font-semibold text-brand-text">No flows yet</h2>
            <p className="text-sm text-brand-muted mt-1.5 max-w-sm mb-4">
              Add a few tools to your library first, then create a flow to wire them together.
            </p>
            <Button size="sm" onClick={handleNewFlow}>
              <Plus className="w-3.5 h-3.5" />
              New flow
            </Button>
          </div>
        )}

        {flows && flows.length > 0 && (
          <div className="space-y-2">
            {flows.map(flow => (
              <div
                key={flow._id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/flows/${flow._id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    router.push(`/flows/${flow._id}`)
                  }
                }}
                className="w-full flex items-center gap-3 bg-brand-card border border-brand-border rounded-xl p-4 text-left hover:bg-brand-surface transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-brand-text truncate">{flow.name}</h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {flow.node_count} node{flow.node_count === 1 ? '' : 's'} · updated {formatDate(flow.updatedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => handleDelete(flow._id, e)}
                  disabled={deletingId === flow._id}
                >
                  {deletingId === flow._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-brand-muted" />
                  )}
                </Button>
                <ChevronRight className="w-4 h-4 text-brand-muted shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}