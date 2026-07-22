'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Library, Trash2, Loader2, AlertCircle, Store } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { listLibraryTools, removeToolFromLibrary, ApiError, type Tool } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import DynamicIcon from '@/components/marketplace/DynamicIcon'

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <LibraryPageInner />
    </Suspense>
  )
}

function LibraryPageInner() {
  const router = useRouter()
  const { getToken } = useApp()
  const searchParams = useSearchParams()
  const fromProductId = searchParams.get('from')
  const marketplaceHref = fromProductId ? `/marketplace?from=${fromProductId}` : '/marketplace'

  const [tools, setTools] = useState<Tool[] | null>(null)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function load() {
    setError('')
    try {
      const token = await getToken()
      const { tools: fetched } = await listLibraryTools(token)
      setTools(fetched)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your library.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRemove(toolId: string) {
    setRemovingId(toolId)
    try {
      const token = await getToken()
      await removeToolFromLibrary(token, toolId)
      setTools(prev => prev?.filter(t => t._id !== toolId) ?? prev)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove that tool.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="border-b border-brand-border px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push(marketplaceHref)}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Marketplace
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Library className="w-4.5 h-4.5 text-brand-accent" />
          <h1 className="text-xl font-display font-semibold text-brand-text">My library</h1>
        </div>
        <p className="text-sm text-brand-muted mb-6">
          Tools you&apos;ve added. Removing one here only blocks adding it to NEW flows — anything already in a
          saved Flow keeps working.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!tools && !error && <div className="text-center py-24 text-brand-muted text-sm">Loading…</div>}

        {tools && tools.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <div className="w-14 h-14 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center text-brand-muted mb-4">
              <Store className="w-7 h-7" />
            </div>
            <h2 className="text-base font-display font-semibold text-brand-text">Your library is empty</h2>
            <p className="text-sm text-brand-muted mt-1.5 max-w-sm mb-4">
              Add tools from the marketplace to start building a Flow.
            </p>
            <Button size="sm" onClick={() => router.push(marketplaceHref)}>
              Browse marketplace
            </Button>
          </div>
        )}

        {tools && tools.length > 0 && (
          <div className="space-y-2">
            {tools.map(tool => (
              <div
                key={tool._id}
                className="flex items-center gap-3 bg-brand-card border border-brand-border rounded-xl p-3"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center text-brand-accent shrink-0">
                  <DynamicIcon name={tool.icon} className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-brand-text truncate">{tool.name}</h3>
                    <span className="text-[10px] font-mono uppercase tracking-wide text-brand-muted px-2 py-0.5 rounded-full border border-brand-border shrink-0">
                      {tool.category}
                    </span>
                    {!tool.playground_compatible && (
                      <span className="text-[10px] font-mono text-brand-muted shrink-0">Standalone only</span>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted truncate mt-0.5">{tool.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemove(tool._id)}
                  disabled={removingId === tool._id}
                >
                  {removingId === tool._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-brand-muted" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}