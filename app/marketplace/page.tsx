'use client'

import { useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { Signal, LogOut, ArrowLeft, Store } from 'lucide-react'

// General, product-agnostic marketplace — lives at its own route instead
// of inside a product's audit dashboard, same reasoning as /docs.
export default function MarketplacePage() {
  const router = useRouter()
  const { signOut } = useClerk()

  return (
    <div className="min-h-screen bg-brand-bg">
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

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="w-14 h-14 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center text-brand-muted mb-4">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-display font-semibold text-brand-text">Marketplace is on the way</h1>
          <p className="text-sm text-brand-muted mt-1.5 max-w-sm">
            We&apos;re building a place to discover integrations and services that plug into your audits. Check back soon.
          </p>
        </div>
      </div>
    </div>
  )
}
