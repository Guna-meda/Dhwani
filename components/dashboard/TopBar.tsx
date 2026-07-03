'use client'

import { UserButton } from '@clerk/nextjs'
import { Menu, Clock } from 'lucide-react'
import { formatDate } from './utils'

interface TopBarProps {
  title: string
  status?: 'PARTIAL' | 'COMPLETE'
  createdAt?: string
  loading: boolean
  onOpenMobileSidebar: () => void
}

export default function TopBar({ title, status, createdAt, loading, onOpenMobileSidebar }: TopBarProps) {
  return (
    <header className="h-16 border-b border-brand-border bg-brand-surface flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 -ml-1.5 text-brand-muted hover:text-brand-text rounded-md hover:bg-brand-card"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-display font-semibold text-brand-text truncate">{title}</h1>
          {!loading && (
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                  status === 'COMPLETE'
                    ? 'text-brand-accent bg-brand-accent/10 border-brand-accent/25'
                    : 'text-yellow-300 bg-yellow-950/20 border-yellow-900/30'
                }`}
              >
                {status === 'COMPLETE' ? 'Complete' : 'Partial'}
              </span>
              {createdAt && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-brand-muted font-mono">
                  <Clock className="w-3 h-3" />
                  {formatDate(createdAt)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <UserButton />
    </header>
  )
}
