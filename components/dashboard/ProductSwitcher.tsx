'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Plus, Loader2, AlertCircle } from 'lucide-react'
import { listProducts, ApiError, type Product } from '@/lib/api/client'

interface ProductSwitcherProps {
  companyId: string
  activeProductId: string
  activeProductName: string
  getToken: () => Promise<string>
}

// Every row navigates to /dashboard/products/[productId], which resolves
// setup-state itself and redirects into the right setup step if the product
// isn't fully onboarded yet (still mid-audit-choice, prompts unconfirmed,
// audit running, etc). "New product" does the same — it navigates to the
// product-creation route instead of creating inline, so a freshly created
// product always goes through choose-audit before landing on a dashboard.
export default function ProductSwitcher({
  companyId,
  activeProductId,
  activeProductName,
  getToken,
}: ProductSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
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
    setOpen(false)
    if (p._id === activeProductId) return
    router.push(`/dashboard/products/${p._id}`)
  }

  function handleNewProduct() {
    setOpen(false)
    router.push(`/dashboard/products/new?companyId=${companyId}`)
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
                {(p.audit_status === 'SCRAPING' ||
                  p.audits?.discovery?.status === 'RUNNING' ||
                  p.audits?.brandhealth?.status === 'RUNNING') && (
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
            onClick={handleNewProduct}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-brand-accent hover:bg-brand-card border-t border-brand-border transition-colors"
          >
            <Plus className="w-4 h-4" />
            New product
          </button>
        </div>
      )}
    </div>
  )
}
