'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'

interface SetupBackBarProps {
  // When provided, also shows a "Dashboard" link pointing at
  // /dashboard/products/[productId]. That route re-resolves setup-state on
  // every visit, so this is always safe to show: if the product genuinely
  // has a finished audit, it lands on the real dashboard; if it doesn't yet,
  // it just returns to the correct setup step instead of leaving the user
  // stuck.
  dashboardHref?: string
}

export default function SetupBackBar({ dashboardHref }: SetupBackBarProps) {
  const router = useRouter()

  return (
    <div className="fixed top-4 left-4 z-20 flex items-center gap-2">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md bg-brand-bg/80 backdrop-blur border border-brand-border hover:bg-brand-card"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>
      {dashboardHref && (
        <Link
          href={dashboardHref}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded-md bg-brand-bg/80 backdrop-blur border border-brand-border hover:bg-brand-card"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Dashboard
        </Link>
      )}
    </div>
  )
}
