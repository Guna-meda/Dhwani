'use client'

import { useState } from 'react'
import { deleteProduct, ApiError } from '@/lib/api/client'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface DeleteProductModalProps {
  productId: string
  productName: string
  getToken: () => Promise<string>
  onClose: () => void
  onDeleted: (productId: string) => void
}

export default function DeleteProductModal({
  productId,
  productName,
  getToken,
  onClose,
  onDeleted,
}: DeleteProductModalProps) {
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const matches = typed === productName

  async function handleDelete() {
    if (!matches) return
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      await deleteProduct(token, productId, typed)
      onDeleted(productId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this product.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-brand-surface border border-red-500/30 rounded-2xl p-6 relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-text transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-display font-semibold text-brand-text">Delete this product?</h2>
            <p className="text-xs text-brand-muted mt-1">
              This permanently deletes <span className="text-brand-text font-medium">{productName}</span> and
              everything tied to it — prompts, audit reports, and both Discovery and Brand Health results.
              This can&apos;t be undone.
            </p>
          </div>
        </div>

        <label className="block text-xs text-brand-muted mb-1.5">
          Type <span className="font-mono text-brand-text">{productName}</span> to confirm
        </label>
        <input
          value={typed}
          onChange={e => setTyped(e.target.value)}
          autoFocus
          disabled={loading}
          className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-red-400/60 transition-colors disabled:opacity-50"
          placeholder={productName}
        />

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!matches || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-500/90 text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete product'}
          </button>
        </div>
      </div>
    </div>
  )
}