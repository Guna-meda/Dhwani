'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { InputSchemaField } from '@/lib/api/client'

interface NodeConfigPanelProps {
  toolName: string
  fields: InputSchemaField[]
  config: Record<string, unknown>
  hasUpstreamEdge: boolean
  onChange: (next: Record<string, unknown>) => void
  onClose: () => void
}

function StringArrayField({ field, value, onChange }: {
  field: InputSchemaField
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const atMax = field.maxItems !== undefined && value.length >= field.maxItems

  function commit() {
    const trimmed = draft.trim().slice(0, field.maxLength ?? 200)
    if (!trimmed) return
    if (atMax) return
    if (value.includes(trimmed)) {
      setDraft('')
      return
    }
    onChange([...value, trimmed])
    setDraft('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(v => (
          <span
            key={v}
            className="inline-flex items-center gap-1 text-xs bg-brand-bg border border-brand-border rounded-full pl-2.5 pr-1.5 py-1 text-brand-text"
          >
            {v}
            <button
              onClick={() => onChange(value.filter(x => x !== v))}
              className="text-brand-muted hover:text-red-400"
              aria-label={`Remove ${v}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={commit}
        placeholder={atMax ? `Max ${field.maxItems} reached` : 'Type and press Enter'}
        disabled={atMax}
        className="w-full text-xs bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text placeholder:text-brand-muted disabled:opacity-50 focus:outline-none focus:border-brand-accent"
      />
      {field.maxItems !== undefined && (
        <div className="text-[11px] text-brand-muted mt-1">{value.length}/{field.maxItems}</div>
      )}
    </div>
  )
}

export default function NodeConfigPanel({ toolName, fields, config, hasUpstreamEdge, onChange, onClose }: NodeConfigPanelProps) {
  function setField(key: string, value: unknown) {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="w-80 border-l border-brand-border bg-brand-surface flex flex-col shrink-0 animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
        <h3 className="text-sm font-semibold text-brand-text truncate">{toolName}</h3>
        <button onClick={onClose} className="text-brand-muted hover:text-brand-text">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {fields.length === 0 && (
          <p className="text-xs text-brand-muted">This tool needs no configuration — it runs off Brand Details.</p>
        )}

        {fields.map(field => {
          // Fields satisfiable by an upstream connection: if one is
          // present, show that instead of an input — nothing to configure
          // manually, the value will come from the connected tool at run time.
          const satisfiedUpstream = field.source === 'upstream' || (field.source === 'either' && hasUpstreamEdge)
          if (field.source === 'upstream' || (field.source === 'either' && hasUpstreamEdge)) {
            return (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-brand-text mb-1">{field.label}</label>
                <div className="text-[11px] text-brand-accent bg-brand-accent/10 border border-brand-accent/30 rounded-lg px-3 py-2">
                  Filled automatically from the connected tool
                </div>
              </div>
            )
          }

          return (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                {field.label}
                {field.required && !satisfiedUpstream && <span className="text-red-400 ml-1">*</span>}
              </label>
              {field.help && <p className="text-[11px] text-brand-muted mb-1.5">{field.help}</p>}

              {field.type === 'string[]' && (
                <StringArrayField
                  field={field}
                  value={(config[field.key] as string[]) ?? []}
                  onChange={v => setField(field.key, v)}
                />
              )}

              {field.type === 'string' && (
                <input
                  value={(config[field.key] as string) ?? ''}
                  onChange={e => setField(field.key, e.target.value.slice(0, field.maxLength ?? 500))}
                  className="w-full text-xs bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text focus:outline-none focus:border-brand-accent"
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={(config[field.key] as number) ?? ''}
                  onChange={e => setField(field.key, e.target.value === '' ? undefined : Number(e.target.value))}
                  className="w-full text-xs bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text focus:outline-none focus:border-brand-accent"
                />
              )}

              {field.type === 'boolean' && (
                <input
                  type="checkbox"
                  checked={Boolean(config[field.key])}
                  onChange={e => setField(field.key, e.target.checked)}
                  className="w-4 h-4 accent-brand-accent"
                />
              )}

              {field.type === 'select' && (
                <select
                  value={(config[field.key] as string) ?? ''}
                  onChange={e => setField(field.key, e.target.value)}
                  className="w-full text-xs bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text focus:outline-none focus:border-brand-accent"
                >
                  <option value="" disabled>Select…</option>
                  {(field.options ?? []).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-4 py-3 border-t border-brand-border text-[11px] text-brand-muted">
        Changes are kept with this flow when you hit Save.
      </div>
    </div>
  )
}
