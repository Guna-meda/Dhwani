'use client'

import { useState } from 'react'
import { useApp } from '@/lib/context/AppContext'
import {
  editDiscoveryPrompt, deleteDiscoveryPrompt, addDiscoveryPrompt,
  editBrandHealthPrompt, deleteBrandHealthPrompt, addBrandHealthPrompt,
  confirmDiscovery, confirmBrandHealth,
  ApiError,
} from '@/lib/api/client'
import type { Prompt } from '@/lib/api/client'
import { Pencil, Trash2, Plus, Check, X, Loader2, Play } from 'lucide-react'

export default function ReviewPrompts() {
  const { getToken, setScreen, auditType, productId, prompts, setPrompts } = useApp()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newPromptText, setNewPromptText] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [addingPrompt, setAddingPrompt] = useState(false)

  const isDiscovery = auditType === 'discovery'

  const startEdit = (p: Prompt) => {
    setEditingId(p._id)
    setEditText(p.prompt_text)
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = async (promptId: string) => {
    if (!editText.trim()) return
    setSavingId(promptId)
    setError('')
    try {
      const token = await getToken()
      if (isDiscovery) {
        await editDiscoveryPrompt(token, promptId, editText.trim())
      } else {
        await editBrandHealthPrompt(token, promptId, editText.trim())
      }
      setPrompts(prev => prev.map(p => p._id === promptId ? { ...p, prompt_text: editText.trim() } : p))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save.')
    } finally {
      setSavingId(null)
    }
  }

  const deletePrompt = async (promptId: string) => {
    setDeletingId(promptId)
    setError('')
    try {
      const token = await getToken()
      if (isDiscovery) {
        await deleteDiscoveryPrompt(token, promptId)
      } else {
        await deleteBrandHealthPrompt(token, promptId)
      }
      setPrompts(prev => prev.filter(p => p._id !== promptId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot delete — minimum prompt count reached.')
    } finally {
      setDeletingId(null)
    }
  }

  const addPrompt = async () => {
    if (!newPromptText.trim() || !productId) return
    setAddingPrompt(true)
    setError('')
    try {
      const token = await getToken()
      const created = isDiscovery
        ? await addDiscoveryPrompt(token, productId, newPromptText.trim())
        : await addBrandHealthPrompt(token, productId, newPromptText.trim())
      setPrompts(prev => [...prev, created as Prompt])
      setNewPromptText('')
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot add — maximum prompt count reached.')
    } finally {
      setAddingPrompt(false)
    }
  }

  const confirm = async () => {
    if (!productId) return
    setConfirming(true)
    setError('')
    try {
      const token = await getToken()
      if (isDiscovery) {
        await confirmDiscovery(token, productId)
      } else {
        await confirmBrandHealth(token, productId)
      }
      setScreen('audit-progress')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start audit.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Header */}
      <div className="border-b border-brand-border px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-display font-semibold text-brand-text">
            Review your {isDiscovery ? 'Discovery' : 'Brand Health'} prompts
          </h1>
          <p className="text-xs text-brand-muted mt-0.5">
            These are the queries we'll send to AI models. Edit or delete any, then run the audit.
          </p>
        </div>
      </div>

      {/* Prompts list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {prompts.map((prompt, i) => (
            <div
              key={prompt._id}
              className="bg-brand-surface border border-brand-border rounded-xl p-4 group"
            >
              {editingId === prompt._id ? (
                <div className="flex items-start gap-2">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    autoFocus
                    rows={2}
                    className="flex-1 bg-brand-bg border border-brand-accent rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none resize-none"
                  />
                  <div className="flex flex-col gap-1 mt-0.5">
                    <button
                      onClick={() => saveEdit(prompt._id)}
                      disabled={!!savingId}
                      className="p-1.5 rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 transition-colors"
                    >
                      {savingId === prompt._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-[10px] font-mono text-brand-muted mt-0.5 w-5 text-right flex-shrink-0">{i + 1}</span>
                  <p className="flex-1 text-sm text-brand-text leading-relaxed">{prompt.prompt_text}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(prompt)}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deletePrompt(prompt._id)}
                      disabled={deletingId === prompt._id}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      {deletingId === prompt._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add prompt */}
          {showAddForm ? (
            <div className="bg-brand-surface border border-dashed border-brand-accent/40 rounded-xl p-4">
              <textarea
                value={newPromptText}
                onChange={e => setNewPromptText(e.target.value)}
                placeholder="Type your custom prompt…"
                rows={2}
                autoFocus
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={addPrompt}
                  disabled={addingPrompt || !newPromptText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent/10 text-brand-accent border border-brand-accent/30 rounded-lg text-xs font-medium hover:bg-brand-accent/20 transition-colors disabled:opacity-50"
                >
                  {addingPrompt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewPromptText('') }}
                  className="px-3 py-1.5 text-brand-muted hover:text-brand-text text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-brand-border rounded-xl text-sm text-brand-muted hover:text-brand-text hover:border-brand-text/40 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add custom prompt
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-brand-border px-6 py-4">
        <div className="max-w-2xl mx-auto">
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-muted">{prompts.length} prompt{prompts.length !== 1 ? 's' : ''}</span>
            <button
              onClick={confirm}
              disabled={confirming || prompts.length === 0}
              className="flex items-center gap-2 bg-brand-primary text-brand-bg px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Starting audit…</>
              ) : (
                <><Play className="w-4 h-4" /> Confirm & Run Audit</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
