'use client'

import { useState } from 'react'
import { useApp } from '@/lib/context/AppContext'
import { submitProductOnboarding, ApiError } from '@/lib/api/client'
import OnboardingShell from './OnboardingShell'
import { Globe, Loader2 } from 'lucide-react'

export default function ProductOnboarding() {
  const { getToken, setScreen, setProductId } = useApp()

  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [domain, setDomain] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName || !domain || !country) {
      setError('Product name, domain, and country are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      const product = await submitProductOnboarding(token, {
        product_name: productName,
        product_description: productDescription || undefined,
        domain,
        country,
      })
      setProductId(product._id)
      setScreen('choose-audit')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <OnboardingShell step={3} totalSteps={3} title="Add your first product" subtitle="We'll scan your website and build tailored audit prompts automatically.">
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

        {loading && (
          <p className="text-center text-xs text-brand-muted">
            This takes 5–15 seconds. We're reading your site and extracting context.
          </p>
        )}
      </form>
    </OnboardingShell>
  )
}
