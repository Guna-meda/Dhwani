'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  Signal,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  Quote,
  Users,
  ChevronsUpDown,
  Plus,
  LogOut,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react'
import type { NavId } from './types'
import { listCompanies, listProducts, ApiError, type Company } from '@/lib/api/client'
import ProductSwitcher from './ProductSwitcher'

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
  companyId: string
  productId: string
  productName: string
  getToken: () => Promise<string>
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
  companyId,
  productId,
  productName,
  getToken,
  userLabel,
  onSignOut,
}: SidebarProps) {
  const router = useRouter()
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function loadCompanies() {
    if (companies) return
    setLoadError('')
    try {
      const token = await getToken()
      const list = await listCompanies(token)
      setCompanies(list)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load workspaces.')
    }
  }

  function toggleMenu() {
    if (!isAgency) return
    setWorkspaceMenuOpen(o => !o)
    loadCompanies()
  }

  // A company with no products yet isn't a useful place to land — chain
  // straight into product creation for it, same as right after creating a
  // brand-new company (Journey B). Otherwise jump to its most recent product;
  // /dashboard/products/[productId] resolves setup-state from there.
  async function handleSelectCompany(company: Company) {
    if (company._id === companyId) { setWorkspaceMenuOpen(false); return }
    setSwitchingTo(company._id)
    try {
      const token = await getToken()
      const products = await listProducts(token, company._id)
      setWorkspaceMenuOpen(false)
      if (products.length > 0) {
        router.push(`/dashboard/products/${products[0]._id}`)
      } else {
        router.push(`/dashboard/products/new?companyId=${company._id}`)
      }
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not switch workspace.')
    } finally {
      setSwitchingTo(null)
    }
  }

  function handleNewWorkspace() {
    setWorkspaceMenuOpen(false)
    router.push('/dashboard/companies/new')
  }

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
          <div className="relative mb-5 px-1" ref={menuRef}>
            <button
              onClick={toggleMenu}
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
                <div className="max-h-56 overflow-y-auto">
                  {!companies && !loadError && (
                    <div className="flex items-center gap-2 px-3 py-3 text-sm text-brand-muted">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading workspaces…
                    </div>
                  )}
                  {loadError && (
                    <div className="flex items-center gap-2 px-3 py-3 text-sm text-red-400">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {loadError}
                    </div>
                  )}
                  {companies?.map(c => {
                    const isActive = c._id === companyId
                    return (
                      <button
                        key={c._id}
                        onClick={() => handleSelectCompany(c)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-brand-card transition-colors ${
                          isActive ? 'bg-brand-primary/5' : ''
                        }`}
                      >
                        <div className="w-5 h-5 rounded bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-accent shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-brand-text font-medium truncate flex-1">{c.name}</span>
                        {switchingTo === c._id ? (
                          <Loader2 className="w-4 h-4 text-brand-muted animate-spin shrink-0" />
                        ) : isActive ? (
                          <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" />
                        ) : (
                          <span className="text-[10px] font-mono text-brand-muted shrink-0">
                            {c.product_count ?? 0} product{c.product_count === 1 ? '' : 's'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={handleNewWorkspace}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-brand-accent hover:bg-brand-card border-t border-brand-border transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New workspace
                </button>
              </div>
            )}
          </div>

          {/* My Workspace — workspace-level info + all products in it,
              independent of whichever product's dashboard is currently
              open. Always visible regardless of the active product. */}
          <button
            onClick={() => router.push(`/dashboard/companies/${companyId}`)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 mb-4 text-sm font-medium rounded-lg text-left text-brand-muted hover:text-brand-text hover:bg-brand-card/50 transition-colors border border-brand-border"
          >
            <Building2 className="w-4 h-4" />
            My Workspace
          </button>

          <span className="block px-3 text-[10px] font-mono text-brand-muted uppercase tracking-wider mb-2">
            Brand Report
          </span>

          {/* Product switcher — lists/creates products for the active company */}
          <ProductSwitcher
            companyId={companyId}
            activeProductId={productId}
            activeProductName={productName}
            getToken={getToken}
          />

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