'use client'

import { useUser } from '@clerk/nextjs'
import LandingPage from '@/components/landing/LandingPage'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import AuthModal from '@/components/auth/AuthModal'
import UpgradeModal from '@/components/ui/UpgradeModal'

export default function Page() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return null
  }

  return (
    <>
      {/* Dynamic Screen Routing */}
      {!isSignedIn ? (
        <LandingPage />
      ) : (
        <DashboardLayout />
      )}

      {/* Global Emulated Modals */}
      <AuthModal />
      <UpgradeModal />
    </>
  )
}
