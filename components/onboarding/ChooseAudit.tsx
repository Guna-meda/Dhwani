'use client'

import { useState } from 'react'
import { useApp } from '@/lib/context/AppContext'
import { initDiscovery, initBrandHealth, ApiError } from '@/lib/api/client'
import type { AuditType } from '@/lib/context/AppContext'
import { Search, Activity, ArrowRight } from 'lucide-react'

const AUDIT_OPTIONS = [
  {
    id: 'discovery' as AuditType,
    icon: Search,
    title: 'Discovery',
    tagline: 'See how AI recommends solutions in your niche',
    description:
      'We run 15 prompts asking AI models to suggest tools and services in your category. Find out which competitors get mentioned - and why you\'re not.',
    prompts: '15 prompts',
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/5',
  },
  {
    id: 'brandhealth' as AuditType,
    icon: Activity,
    title: 'Brand Health',
    tagline: 'See exactly how AI talks about your brand',
    description:
      'We ask AI models directly about your product - what they know, what they say, how accurately they describe you to potential buyers.',
    prompts: '10 prompts',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/5',
  },
]

export default function ChooseAudit() {
  const { getToken, setScreen, setAuditType, setPrompts, productId } = useApp()
  const [loading, setLoading] = useState<AuditType | null>(null)
  const [error, setError] = useState('')

  const handleChoose = async (type: AuditType) => {
    if (!productId) { setError('Product ID missing. Refresh and try again.'); return }
    setLoading(type)
    setError('')
    try {
      const token = await getToken()
      const res = type === 'discovery'
        ? await initDiscovery(token, productId)
        : await initBrandHealth(token, productId)
      setAuditType(type)
      setPrompts(res.prompts)
      setScreen('review-prompts')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to initialize audit.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-display font-semibold text-brand-text">Choose your audit type</h1>
          <p className="text-sm text-brand-muted mt-2">You can run both — but start with the one that matters most right now.</p>
        </div>

        <div className="grid gap-4">
          {AUDIT_OPTIONS.map(opt => {
            const Icon = opt.icon
            const isLoading = loading === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => handleChoose(opt.id)}
                disabled={!!loading}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-200 group
                  ${opt.bg} ${opt.border}
                  hover:border-opacity-80 hover:scale-[1.01]
                  disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 p-2 rounded-lg bg-brand-card border border-brand-border ${opt.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-semibold text-brand-text">{opt.title}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${opt.color} ${opt.border} ${opt.bg}`}>
                          {opt.prompts}
                        </span>
                      </div>
                      <p className={`text-sm font-medium mb-2 ${opt.color}`}>{opt.tagline}</p>
                      <p className="text-xs text-brand-muted leading-relaxed">{opt.description}</p>
                    </div>
                  </div>
                  <div className={`mt-1 flex-shrink-0 ${opt.color} opacity-60 group-hover:opacity-100 transition-opacity`}>
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {error && <p className="text-red-400 text-xs text-center mt-4">{error}</p>}
      </div>
    </div>
  )
}
