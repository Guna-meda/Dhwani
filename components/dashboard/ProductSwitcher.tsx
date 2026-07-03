'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Loader2, Globe, AlertCircle } from 'lucide-react'
import { createProduct, listProducts, ApiError, type Product } from '@/lib/api/client'

interface ProductSwitcherProps {
  companyId: string
  activeProductId: string
  activeProductName: string
  getToken: () => Promise<string>
  onProductChange: (product: Product) => void
}

export default function ProductSwitcher({
  companyId,
  activeProductId,
  activeProductName,
  getToken,
  onProductChange,
}: ProductSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowNewForm(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function loadProducts() {
    if (products || !companyId) return
    setLoadError('')
    try {
      const token = await getToken()
      const list = await listProducts(token, companyId)
      setProducts(list)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load products.')
    }
  }

  function handleOpen() {
    setOpen(o => !o)
    loadProducts()
  }

  function handleSelect(p: Product) {
    onProductChange(p)
    setOpen(false)
  }

  function handleCreated(p: Product) {
    setProducts(prev => (prev ? [p, ...prev] : [p]))
    setShowNewForm(false)
    setOpen(false)
    onProductChange(p)
  }

  return (
    <div className="relative mb-1 px-1" ref={rootRef}>
      <button
        onClick={handleOpen}
        className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded-lg hover:bg-brand-card/60 text-left"
      >
        <div className="w-6 h-6 rounded bg-brand-card border border-brand-border flex items-center justify-center text-[10px] font-bold text-brand-muted shrink-0">
          {(activeProductName || 'P').charAt(0).toUpperCase()}
        </div>
        <span className="flex-1 text-sm font-semibold text-brand-text truncate">
          {activeProductName || 'Your product'}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-brand-muted shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-brand-muted shrink-0" />
        )}
      </button>

      {open && (
        <div className="mt-1.5 bg-brand-bg/60 border border-brand-border rounded-lg mb-2 overflow-hidden">
          {showNewForm ? (
            <NewProductForm
              companyId={companyId}
              getToken={getToken}
              onCreated={handleCreated}
              onCancel={() => setShowNewForm(false)}
            />
          ) : (
            <>
              <div className="max-h-56 overflow-y-auto">
                {!products && !loadError && (
                  <div className="flex items-center gap-2 px-3 py-3 text-sm text-brand-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading products…
                  </div>
                )}
                {loadError && (
                  <div className="flex items-center gap-2 px-3 py-3 text-sm text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {loadError}
                  </div>
                )}
                {products?.map(p => (
                  <button
                    key={p._id}
                    onClick={() => handleSelect(p)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-brand-card transition-colors ${
                      p._id === activeProductId ? 'bg-brand-card/60' : ''
                    }`}
                  >
                    <div className="w-5 h-5 rounded bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-accent shrink-0">
                      {p.product_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-brand-text truncate flex-1">{p.product_name}</span>
                    {p.audit_status === 'SCRAPING' && (
                      <Loader2 className="w-3 h-3 text-brand-muted animate-spin shrink-0" />
                    )}
                    {p.audit_status === 'FAILED' && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"
                        title="Context extraction failed"
                      />
                    )}
                  </button>
                ))}
                {products && products.length === 0 && (
                  <p className="px-3 py-3 text-sm text-brand-muted/70">No other products yet.</p>
                )}
              </div>
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-brand-accent hover:bg-brand-card border-t border-brand-border transition-colors"
              >
                <Plus className="w-4 h-4" />
                New product
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Inline "new product" form ───────────────────────────────────────────────
// Same fields/flow as onboarding's ProductOnboarding, but hits POST /products
// (no one-product-per-company cap) and lives inside the switcher dropdown
// instead of a full onboarding screen.

function NewProductForm({
  companyId,
  getToken,
  onCreated,
  onCancel,
}: {
  companyId: string
  getToken: () => Promise<string>
  onCreated: (p: Product) => void
  onCancel: () => void
}) {
  const [productName, setProductName] = useState('')
  const [domain, setDomain] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productName || !domain || !country) {
      setError('Product name, domain, and country are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      const product = await createProduct(token, {
        companyId,
        product_name: productName,
        domain,
        country,
      })
      onCreated(product)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create product. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 space-y-2.5">
      <input
        value={productName}
        onChange={e => setProductName(e.target.value)}
        placeholder="Product name"
        className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent"
        autoFocus
      />
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="example.com"
          className="w-full bg-brand-surface border border-brand-border rounded-lg pl-8 pr-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent"
        />
      </div>
      <input
        value={country}
        onChange={e => setCountry(e.target.value)}
        placeholder="Operating country"
        className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent"
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg text-sm text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-brand-primary text-brand-bg font-semibold py-2 rounded-lg text-sm hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {loading ? 'Creating…' : 'Create'}
        </button>
      </div>
      {loading && (
        <p className="text-center text-xs text-brand-muted">
          Analyzing the website — this takes 5–15 seconds.
        </p>
      )}
    </form>
  )
}
