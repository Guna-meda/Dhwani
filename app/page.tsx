'use client'

import { useApp } from '@/lib/context/AppContext'
import LandingPage from '@/components/landing/LandingPage'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import AuthModal from '@/components/auth/AuthModal'
import UpgradeModal from '@/components/ui/UpgradeModal'

export default function Page() {
  const { user } = useApp()

  return (
    <>
      {/* Dynamic Screen Routing */}
      {!user ? <LandingPage /> : <DashboardLayout />}

      {/* Global Emulated Modals */}
      <AuthModal />
      <UpgradeModal />
    </>
  )
}
