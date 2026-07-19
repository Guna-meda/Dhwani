'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertCircle, Pencil, Check } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { getFlow, createFlow, updateFlow, listLibraryTools, ApiError, type FlowDetail, type Tool } from '@/lib/api/client'
import PlaygroundCanvas, { type SaveNodePayload } from '@/components/flows/PlaygroundCanvas'
import type { FlowEdge } from '@/lib/api/client'

export default function FlowEditorPage() {
  const params = useParams<{ flowId: string }>()
  const flowId = params.flowId
  const router = useRouter()
  const { getToken } = useApp()

  const [flow, setFlow] = useState<FlowDetail | null>(null)
  const [libraryTools, setLibraryTools] = useState<Tool[] | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setError('')
      try {
        const token = await getToken()

        if (flowId === 'new') {
          // Nothing to fetch — this flow doesn't exist in the backend yet.
          // It's created for real on the first save, once it has a node
          // (see handleSaveCanvas below).
          const { tools } = await listLibraryTools(token)
          if (cancelled) return
          setFlow({ _id: 'new', name: 'Untitled flow', nodes: [], edges: [], createdAt: '', updatedAt: '' })
          setNameDraft('Untitled flow')
          setLibraryTools(tools)
          return
        }

        const [{ flow: fetchedFlow }, { tools }] = await Promise.all([
          getFlow(token, flowId),
          listLibraryTools(token),
        ])
        if (cancelled) return
        setFlow(fetchedFlow)
        setNameDraft(fetchedFlow.name)
        setLibraryTools(tools)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this flow.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [flowId, getToken])

  async function handleSaveCanvas(payload: { nodes: SaveNodePayload[]; edges: FlowEdge[] }) {
    setSaving(true)
    setSaveError('')
    try {
      const token = await getToken()

      if (flowId === 'new') {
        // First real save of a draft — this is the only place a Flow row
        // actually gets created. Swap the URL to the real id afterwards so
        // every subsequent save goes through the normal updateFlow path
        // instead of re-creating a duplicate flow.
        const { flow: created } = await createFlow(token, {
          name: flow?.name ?? 'Untitled flow',
          nodes: payload.nodes,
          edges: payload.edges,
        })
        setFlow(created)
        router.replace(`/flows/${created._id}`)
        return
      }

      const { flow: updated } = await updateFlow(token, flowId, { nodes: payload.nodes, edges: payload.edges })
      setFlow(updated)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save this flow.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRename() {
    if (!nameDraft.trim() || nameDraft === flow?.name) {
      setRenaming(false)
      return
    }
    if (flowId === 'new') {
      // Nothing to PATCH yet — just update local state. Persisted together
      // with the first real save, in handleSaveCanvas.
      setFlow(f => (f ? { ...f, name: nameDraft.trim() } : f))
      setRenaming(false)
      return
    }
    try {
      const token = await getToken()
      const { flow: updated } = await updateFlow(token, flowId, { name: nameDraft.trim() })
      setFlow(updated)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not rename this flow.')
    } finally {
      setRenaming(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-9 h-9 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-brand-text">{error}</p>
        </div>
      </div>
    )
  }

  if (!flow || !libraryTools) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-brand-accent" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-brand-bg flex flex-col">
      <div className="flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-brand-border shrink-0">
        <button
          onClick={() => router.push('/flows')}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Flows
        </button>

        {renaming ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="text-sm font-display font-semibold text-brand-text bg-brand-card border border-brand-border rounded-md px-2 py-1 outline-none focus:border-brand-accent"
            />
            <button onClick={handleRename} className="text-brand-accent">
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setRenaming(true)}
            className="flex items-center gap-1.5 text-sm font-display font-semibold text-brand-text hover:text-brand-accent transition-colors"
          >
            {flow.name}
            <Pencil className="w-3 h-3 text-brand-muted" />
          </button>
        )}
      </div>

      <PlaygroundCanvas
        libraryTools={libraryTools}
        initialNodes={flow.nodes}
        initialEdges={flow.edges}
        onSave={handleSaveCanvas}
        saving={saving}
        saveError={saveError}
      />
    </div>
  )
}