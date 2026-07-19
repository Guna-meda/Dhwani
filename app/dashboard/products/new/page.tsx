'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { createProduct, ApiError } from '@/lib/api/client'
import { Globe, Loader2, LogOut, Signal, ArrowLeft } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'

// Dashboard "add another product" — same fields as ProductOnboarding, but
// posts to POST /products (uncapped) instead of the onboarding-only
// endpoint. On success, always continues into choose-audit; a freshly
// created product with no audit type is never a useful end state.
export default function NewProductPage() {
  return (
    // useSearchParams() opts this page out of static prerendering unless
    // wrapped in Suspense — without this, `next build` fails outright.
    <Suspense fallback={null}>
      <NewProductForm />
    </Suspense>
  )
}

function NewProductForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('companyId') ?? ''
  const { getToken } = useApp()
  const { signOut } = useClerk()

  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [domain, setDomain] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) { setError('Missing workspace. Go back and pick a workspace first.'); return }
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
        product_description: productDescription || undefined,
        domain,
        country,
      })
      router.push(`/dashboard/products/${product._id}/setup/audit-type`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>
      <button
        onClick={() => signOut({ redirectUrl: '/' })}
        className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md hover:bg-brand-card"
      >
        <LogOut className="w-3.5 h-3.5" />
        Sign out
      </button>

      <div className="flex items-center gap-2 mb-10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-card border border-brand-border text-brand-accent">
          <Signal className="w-4 h-4" />
        </div>
        <span className="font-display font-semibold text-brand-text tracking-tight">Dhwani</span>
      </div>

      <div className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-8">
        <div className="mb-6">
          <h1 className="text-xl font-display font-semibold text-brand-text">Add a product</h1>
          <p className="text-sm text-brand-muted mt-1">
            We&apos;ll scan the website and build tailored audit prompts automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-brand-muted mb-1">Product name</label>
            <input
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="Acme CRM"
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-brand-muted mb-1">
              Description <span className="text-brand-muted/60">(optional)</span>
            </label>
            <textarea
              value={productDescription}
              onChange={e => setProductDescription(e.target.value)}
              placeholder="A short description of what your product does…"
              rows={2}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-brand-muted mb-1">Website domain</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
              <input
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full bg-brand-bg border border-brand-border rounded-lg pl-8 pr-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-brand-muted mb-1">Operating country</label>
            <input
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="India"
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-brand-bg font-semibold py-2.5 rounded-lg text-sm hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing your website…
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
