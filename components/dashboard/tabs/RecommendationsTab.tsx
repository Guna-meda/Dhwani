'use client'

import { Sparkles } from 'lucide-react'

export default function RecommendationsTab() {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center text-center py-20">
      <div className="w-14 h-14 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center text-brand-muted mb-4">
        <Sparkles className="w-7 h-7" />
      </div>
      <p className="text-base font-medium text-brand-text">Recommendations are on the way</p>
      <p className="text-sm text-brand-muted mt-1.5 max-w-xs">
        We&apos;re building actionable, brand-specific suggestions for improving your AI visibility here.
      </p>
    </div>
  )
}
