'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { createCompany, ApiError } from '@/lib/api/client'
import { Loader2, LogOut, Signal, ArrowLeft } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'

// Agency "add another workspace". Server enforces the individual-account
// cap (403) — we surface that message as-is rather than duplicating the
// rule in the UI. On success, a brand-new company with zero products isn't
// a useful end state, so we chain straight into product creation for it
// (Journey B).
export default function NewCompanyPage() {
  const router = useRouter()
  const { getToken } = useApp()
  const { signOut } = useClerk()

  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !country) {
      setError('Workspace name and country are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      const company = await createCompany(token, { name, country })
      router.push(`/dashboard/products/new?companyId=${company._id}`)
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
          <h1 className="text-xl font-display font-semibold text-brand-text">Add a workspace</h1>
          <p className="text-sm text-brand-muted mt-1">
            Each workspace keeps a client&apos;s companies and products separate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-brand-muted mb-1">Company name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Client's company name"
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-brand-muted mb-1">Country</label>
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
