'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import {
  Signal,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  Quote,
  Users,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Plus,
  LogOut,
  X,
  CheckCircle2,
} from 'lucide-react'
import type { NavId } from './types'

export const NAV_ITEMS: { id: NavId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'prompts', label: 'Prompts', icon: MessageSquareText },
  { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
  { id: 'citations', label: 'Citations', icon: Quote },
  { id: 'competitors', label: 'Competitors', icon: Users },
]

interface SidebarProps {
  nav: NavId
  onNavChange: (id: NavId) => void
  mobileOpen: boolean
  onCloseMobile: () => void
  workspaceLabel: string
  isAgency: boolean
  productName: string
  userLabel: string
  onSignOut: () => void
}

export default function Sidebar({
  nav,
  onNavChange,
  mobileOpen,
  onCloseMobile,
  workspaceLabel,
  isAgency,
  productName,
  userLabel,
  onSignOut,
}: SidebarProps) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [productMenuOpen, setProductMenuOpen] = useState(false)

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 w-72 bg-brand-surface border-r border-brand-border shrink-0 z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between gap-2.5 px-5 border-b border-brand-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-bg border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <Signal className="w-3.5 h-3.5" />
            </div>
            <span className="font-display font-semibold text-base tracking-tight text-brand-text">Dhwani</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-brand-muted hover:text-brand-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {/* Workspace switcher */}
          <div className="relative mb-5 px-1">
            <button
              onClick={() => isAgency && setWorkspaceMenuOpen(o => !o)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg border border-brand-border bg-brand-bg/60 ${
                isAgency ? 'hover:bg-brand-card cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="w-7 h-7 rounded-md bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center text-xs font-bold text-brand-accent shrink-0">
                {workspaceLabel.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="block text-[10px] font-mono text-brand-muted uppercase leading-none mb-0.5">
                  Workspace
                </span>
                <span className="block text-sm font-semibold text-brand-text truncate">{workspaceLabel}</span>
              </div>
              {isAgency && <ChevronsUpDown className="w-4 h-4 text-brand-muted shrink-0" />}
            </button>

            {isAgency && workspaceMenuOpen && (
              <div className="absolute left-1 right-1 mt-1.5 bg-brand-surface border border-brand-border rounded-lg shadow-xl z-10 overflow-hidden">
                <div className="px-3 py-2.5 flex items-center gap-2.5 bg-brand-primary/5">
                  <div className="w-5 h-5 rounded bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-accent">
                    {workspaceLabel.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-brand-text font-medium truncate">{workspaceLabel}</span>
                  <CheckCircle2 className="w-4 h-4 text-brand-accent ml-auto shrink-0" />
                </div>
                <button
                  disabled
                  title="Multiple workspaces are coming soon"
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-brand-muted/50 cursor-not-allowed border-t border-brand-border"
                >
                  <Plus className="w-4 h-4" />
                  New workspace
                  <span className="ml-auto text-[10px] font-mono uppercase border border-brand-border rounded px-1 py-0.5">
                    Soon
                  </span>
                </button>
              </div>
            )}
          </div>

          <span className="block px-3 text-[10px] font-mono text-brand-muted uppercase tracking-wider mb-2">
            Brand Report
          </span>

          {/* Product switcher */}
          <div className="relative mb-1 px-1">
            <button
              onClick={() => setProductMenuOpen(o => !o)}
              className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded-lg hover:bg-brand-card/60 text-left"
            >
              <div className="w-6 h-6 rounded bg-brand-card border border-brand-border flex items-center justify-center text-[10px] font-bold text-brand-muted shrink-0">
                {(productName || 'P').charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-semibold text-brand-text truncate">
                {productName || 'Your product'}
              </span>
              {productMenuOpen ? (
                <ChevronDown className="w-4 h-4 text-brand-muted shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-brand-muted shrink-0" />
              )}
            </button>

            {productMenuOpen && (
              <div className="mt-1.5 bg-brand-bg/60 border border-brand-border rounded-lg mb-2 overflow-hidden">
                <button
                  disabled
                  title="Multiple products are coming soon"
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-brand-muted/50 cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  New product
                  <span className="ml-auto text-[10px] font-mono uppercase border border-brand-border rounded px-1 py-0.5">
                    Soon
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Report nav */}
          <nav className="space-y-0.5 mb-6">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const isActive = nav === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavChange(item.id); onCloseMobile() }}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-accent'
                      : 'text-brand-muted hover:text-brand-text hover:bg-brand-card/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-brand-border shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <UserButton />
            <div className="flex-1 min-w-0 truncate">
              <span className="block text-sm font-semibold text-brand-text truncate">{userLabel}</span>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-2 py-2.5 text-sm text-brand-muted hover:text-brand-text hover:bg-brand-card rounded-lg transition-colors mt-0.5"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
