'use client'

import { useState } from 'react'
import { useApp } from '@/lib/context/AppContext'
import { submitCompanyOnboarding, ApiError } from '@/lib/api/client'
import OnboardingShell from './OnboardingShell'

export default function CompanyOnboarding() {
  const { getToken, setScreen } = useApp()

  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !country) { setError('Both fields are required.'); return }
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      await submitCompanyOnboarding(token, { name, country })
      setScreen('onboarding-product')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <OnboardingShell step={2} totalSteps={3} title="Set up your company" subtitle="Your company provides context for generating accurate prompts.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-brand-muted mb-1">Company name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Acme Corp"
            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
          />
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
          className="w-full bg-brand-primary text-brand-bg font-semibold py-2.5 rounded-lg text-sm hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </OnboardingShell>
  )
}
