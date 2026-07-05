'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { useApp } from '@/lib/context/AppContext'
import { getCompany, listProducts, ApiError, type Company, type Product } from '@/lib/api/client'
import DeleteProductModal from '@/components/dashboard/DeleteProductModal'
import {
  Signal,
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Building2,
  Globe,
  Calendar,
} from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="flex items-center gap-2 text-brand-muted">
        <Signal className="w-5 h-5 animate-pulse text-brand-accent" />
        <span className="text-sm font-mono">Loading…</span>
      </div>
    </div>
  )
}

function AuditBadge({ status, label }: { status: Product['audits']['discovery']['status']; label: string }) {
  const styles: Record<string, string> = {
    DONE: 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent',
    RUNNING: 'border-brand-border bg-brand-card text-brand-muted',
    NOT_STARTED: 'border-brand-border bg-transparent text-brand-muted/70',
    FAILED: 'border-red-500/40 bg-red-500/10 text-red-400',
  }
  const text: Record<string, string> = {
    DONE: 'Done',
    RUNNING: 'Running',
    NOT_STARTED: 'Not started',
    FAILED: 'Failed',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${styles[status]}`}>
      {status === 'RUNNING' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
      {label}: {text[status]}
    </span>
  )
}

export default function WorkspacePage() {
  const params = useParams<{ companyId: string }>()
  const companyId = params.companyId
  const router = useRouter()
  const { getToken } = useApp()
  const { signOut } = useClerk()

  const [company, setCompany] = useState<Company | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const [companyData, productsData] = await Promise.all([
          getCompany(token, companyId),
          listProducts(token, companyId),
        ])
        if (!cancelled) {
          setCompany(companyData)
          setProducts(productsData)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this workspace.')
      }
    })()
    return () => { cancelled = true }
  }, [companyId, getToken])

  function handleDeleted(productId: string) {
    setProducts(prev => prev?.filter(p => p._id !== productId) ?? null)
    setDeleteTarget(null)
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

  if (!company || !products) return <LoadingScreen />

  const discoveryDone = company.stats?.discovery_done ?? 0
  const brandhealthDone = company.stats?.brandhealth_done ?? 0

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Top bar */}
      <div className="border-b border-brand-border px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-brand-accent" />
            <span className="font-display font-semibold text-brand-text">Dhwani</span>
          </div>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: '/' })}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Workspace header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center text-brand-accent shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-display font-semibold text-brand-text">{company.name}</h1>
              <div className="flex items-center gap-3 text-xs text-brand-muted mt-0.5">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {company.country}
                </span>
                {company.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Created {new Date(company.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <span className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">Products</span>
            <p className="text-2xl font-display font-semibold text-brand-text mt-1">{products.length}</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <span className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">Discovery done</span>
            <p className="text-2xl font-display font-semibold text-brand-text mt-1">{discoveryDone}</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <span className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">Brand Health done</span>
            <p className="text-2xl font-display font-semibold text-brand-text mt-1">{brandhealthDone}</p>
          </div>
        </div>

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand-text">Products</h2>
            <button
              onClick={() => router.push(`/dashboard/products/new?companyId=${companyId}`)}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-accent hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add product
            </button>
          </div>

          {products.length === 0 ? (
            <div className="border border-dashed border-brand-border rounded-xl p-8 text-center">
              <p className="text-sm text-brand-muted">No products in this workspace yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(product => (
                <div
                  key={product._id}
                  className="flex items-center justify-between gap-4 bg-brand-surface border border-brand-border rounded-xl p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-brand-text truncate">{product.product_name}</span>
                      {product.audit_status === 'SCRAPING' && (
                        <Loader2 className="w-3 h-3 text-brand-muted animate-spin shrink-0" />
                      )}
                      {product.audit_status === 'FAILED' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">
                          context failed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-muted truncate mb-2">{product.domain} · {product.country}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <AuditBadge status={product.audits.discovery.status} label="Discovery" />
                      <AuditBadge status={product.audits.brandhealth.status} label="Brand Health" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => router.push(`/dashboard/products/${product._id}`)}
                      title="Open"
                      className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      title="Delete"
                      className="p-2 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <DeleteProductModal
          productId={deleteTarget._id}
          productName={deleteTarget.product_name}
          getToken={getToken}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}