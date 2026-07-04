'use client'

import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import ChooseAudit from '@/components/onboarding/ChooseAudit'
import SetupBackBar from '@/components/dashboard/setup/SetupBackBar'

// Dashboard-native setup flow, step 1 of 3. Deliberately does NOT touch
// AppContext.productId/auditType/prompts — only the onboarding gate (app/
// page.tsx) writes those. This keeps whatever dashboard is open in another
// tab untouched while this setup flow runs.
export default function ChooseAuditTypePage() {
  const params = useParams<{ productId: string }>()
  const productId = params.productId
  const router = useRouter()
  const { getToken } = useApp()

  return (
    <>
      <SetupBackBar dashboardHref={`/dashboard/products/${productId}`} />
      <ChooseAudit
        productId={productId}
        getToken={getToken}
        onChosen={(type) => {
          router.push(`/dashboard/products/${productId}/setup/prompts?auditType=${type}`)
        }}
      />
    </>
  )
}
