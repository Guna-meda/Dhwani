'use client'

import { Loader2, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Tool } from '@/lib/api/client'
import DynamicIcon from './DynamicIcon'

interface ToolCardProps {
  tool: Tool
  onAdd: (toolId: string) => void
  adding: boolean
}

export default function ToolCard({ tool, onAdd, adding }: ToolCardProps) {
  return (
    <div className="flex flex-col bg-brand-card border border-brand-border rounded-xl p-4 gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center text-brand-accent shrink-0">
          <DynamicIcon name={tool.icon} className="w-4.5 h-4.5" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wide text-brand-muted px-2 py-0.5 rounded-full border border-brand-border">
          {tool.category}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-brand-text">{tool.name}</h3>
        <p className="text-xs text-brand-muted mt-1 leading-relaxed">{tool.description}</p>
      </div>

      {!tool.playground_compatible && (
        <span className="text-[10px] font-mono text-brand-muted">Standalone only — can&apos;t be added to a Flow</span>
      )}

      <Button
        variant={tool.in_library ? 'secondary' : 'default'}
        size="sm"
        disabled={tool.in_library || adding}
        onClick={() => onAdd(tool._id)}
        className="w-full justify-center"
      >
        {adding ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : tool.in_library ? (
          <>
            <Check className="w-3.5 h-3.5" />
            In your library
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" />
            Add to library
          </>
        )}
      </Button>
    </div>
  )
}
