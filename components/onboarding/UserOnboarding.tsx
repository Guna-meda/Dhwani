'use client'

import { useState } from 'react'
import { useApp } from '@/lib/context/AppContext'
import { submitUserOnboarding, ApiError } from '@/lib/api/client'
import OnboardingShell from './OnboardingShell'

const HEAR_OPTIONS = ['Twitter / X', 'Google', 'LinkedIn', 'Friend / Colleague', 'Other']

export default function UserOnboarding() {
  const { getToken, setScreen } = useApp()

  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [hearAboutUs, setHearAboutUs] = useState('')
  const [workEmail, setWorkEmail] = useState('')
  const [role, setRole] = useState<'individual' | 'agency'>('individual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !country || !hearAboutUs || !workEmail) {
      setError('All fields are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      await submitUserOnboarding(token, {
        name,
        country,
        hear_about_us: hearAboutUs,
        work_email: workEmail,
        role,
      })
      setScreen('onboarding-company')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <OnboardingShell step={1} totalSteps={3} title="Tell us about yourself" subtitle="We use this to tailor your audit experience.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-brand-muted mb-1">Full name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-brand-muted mb-1">Work email</label>
          <input
            type="email"
            value={workEmail}
            onChange={e => setWorkEmail(e.target.value)}
            placeholder="jane@company.com"
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

        <div>
          <label className="block text-xs text-brand-muted mb-1">How did you hear about us?</label>
          <select
            value={hearAboutUs}
            onChange={e => setHearAboutUs(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
          >
            <option value="" disabled>Select one…</option>
            {HEAR_OPTIONS.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-brand-muted mb-2">I am a…</label>
          <div className="grid grid-cols-2 gap-2">
            {(['individual', 'agency'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  role === r
                    ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                    : 'border-brand-border bg-brand-bg text-brand-muted hover:border-brand-text/40'
                }`}
              >
                {r === 'individual' ? 'Individual' : 'Agency'}
              </button>
            ))}
          </div>
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
