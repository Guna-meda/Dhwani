'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { Signal, LogOut, ArrowLeft, Store, Library, Workflow, AlertCircle } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { listMarketplaceTools, addToolToLibrary, ApiError, type Tool } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import ToolCard from '@/components/marketplace/ToolCard'

// General, product-agnostic marketplace — lives at its own route instead
// of inside a product's audit dashboard, same reasoning as /docs. Fully
// separate data model from Discovery/Brand Health (see models/tool.model.js).
export default function MarketplacePage() {
  const router = useRouter()
  const { signOut } = useClerk()
  const { getToken } = useApp()

  const [tools, setTools] = useState<Tool[] | null>(null)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [addingToolId, setAddingToolId] = useState<string | null>(null)

  async function load() {
    setError('')
    try {
      const token = await getToken()
      const { tools: fetched } = await listMarketplaceTools(token)
      setTools(fetched)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the marketplace.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categories = useMemo(() => {
    if (!tools) return []
    return Array.from(new Set(tools.map(t => t.category))).sort()
  }, [tools])

  const visibleTools = useMemo(() => {
    if (!tools) return []
    return activeCategory ? tools.filter(t => t.category === activeCategory) : tools
  }, [tools, activeCategory])

  async function handleAdd(toolId: string) {
    setAddingToolId(toolId)
    try {
      const token = await getToken()
      await addToolToLibrary(token, toolId)
      setTools(prev => prev?.map(t => (t._id === toolId ? { ...t, in_library: true } : t)) ?? prev)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add that tool.')
    } finally {
      setAddingToolId(null)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="border-b border-brand-border px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-brand-accent" />
            <span className="font-display font-semibold text-brand-text">Dhwani</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => router.push('/marketplace/library')}>
            <Library className="w-3.5 h-3.5" />
            My library
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/flows')}>
            <Workflow className="w-3.5 h-3.5" />
            Flows
          </Button>
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-display font-semibold text-brand-text">Marketplace</h1>
          <p className="text-sm text-brand-muted mt-1">
            Add tools to your library, then wire them into a Flow in the Playground.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {tools && categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === null
                  ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-accent'
                  : 'border-brand-border text-brand-muted hover:text-brand-text'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-accent'
                    : 'border-brand-border text-brand-muted hover:text-brand-text'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {!tools && !error && (
          <div className="flex items-center justify-center py-24 text-brand-muted text-sm">Loading tools…</div>
        )}

        {tools && visibleTools.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <div className="w-14 h-14 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center text-brand-muted mb-4">
              <Store className="w-7 h-7" />
            </div>
            <h2 className="text-base font-display font-semibold text-brand-text">No tools here yet</h2>
            <p className="text-sm text-brand-muted mt-1.5 max-w-sm">
              Check back soon — new tools land in the marketplace regularly.
            </p>
          </div>
        )}

        {tools && visibleTools.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleTools.map(tool => (
              <ToolCard key={tool._id} tool={tool} onAdd={handleAdd} adding={addingToolId === tool._id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}