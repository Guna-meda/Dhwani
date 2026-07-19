'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="text-sm font-mono text-brand-muted">Loading…</div>
    </div>
  )
}

export default function DashboardIndexPage() {
  const router = useRouter()
  const { screen, productId } = useApp()

  useEffect(() => {
    if (screen === 'dashboard' && productId) {
      router.replace(`/dashboard/products/${productId}`)
    }
  }, [screen, productId, router])

  if (screen === 'dashboard' && productId) {
    return <LoadingScreen />
  }

  return <LoadingScreen />
}