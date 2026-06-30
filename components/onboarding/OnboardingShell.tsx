'use client'

import { Signal } from 'lucide-react'

interface Props {
  step: number
  totalSteps: number
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function OnboardingShell({ step, totalSteps, title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-card border border-brand-border text-brand-accent">
          <Signal className="w-4 h-4" />
        </div>
        <span className="font-display font-semibold text-brand-text tracking-tight">Dhwani</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i < step ? 'w-6 bg-brand-accent' : i === step - 1 ? 'w-6 bg-brand-primary' : 'w-3 bg-brand-border'
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-8">
        <div className="mb-6">
          <p className="text-xs font-mono text-brand-muted mb-1">Step {step} of {totalSteps}</p>
          <h1 className="text-xl font-display font-semibold text-brand-text">{title}</h1>
          <p className="text-sm text-brand-muted mt-1">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
