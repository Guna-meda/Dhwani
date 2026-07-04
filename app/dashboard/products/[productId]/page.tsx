import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getProductSetupState, getProduct, ApiError, type SetupState, type Product } from '@/lib/api/client'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { AlertCircle } from 'lucide-react'

/**
 * The resolver.
 *
 * This is the ONLY place that knows what a `next_step` value means. Every
 * path into a product — the product switcher, the workspace switcher, a
 * bookmarked link, a browser refresh mid-setup — always lands here first,
 * because every one of those just does `router.push('/dashboard/products/'
 * + id)`. Nobody else inspects `next_step`, so nobody else has to change
 * when the backend adds one.
 *
 * It's an async Server Component: it resolves setup-state on the server
 * and calls next/navigation's `redirect()` before any HTML is sent, so
 * there's no client-side loading flash for the redirect cases — only the
 * `dashboard` case actually renders something here.
 *
 * Adding a new step (e.g. a hypothetical `billing-required`) is a two-line
 * change: one `case` here, and the setup page it points to. ProductSwitcher,
 * Sidebar, DashboardLayout, and AppContext don't get touched — they've
 * never heard of `next_step` and don't need to.
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params

  const { userId, getToken } = await auth()
  const token = await getToken()

  // No session at all — let the root page's auth gate (landing / sign-in
  // modal) handle it rather than duplicating that logic here.
  if (!token && !userId) redirect('/')

  // Dev-only: mirrors what every client-side call already does via
  // localStorage (see AppContext.getToken() / lib/api/client.ts). Server
  // Components have no window/localStorage to read that from, so it's
  // passed explicitly here instead. Ignored by the backend entirely unless
  // DEV_AUTH_BYPASS=true is set there — safe to always pass in non-prod.
  const devClerkId = process.env.NODE_ENV !== 'production' ? (userId ?? undefined) : undefined

  let setupState: SetupState
  let product: Product | null = null

  try {
    setupState = await getProductSetupState(token ?? '', productId, devClerkId)
    // Only fetch the product itself when we're actually about to render
    // the dashboard — every other branch redirects immediately and never
    // needs it.
    if (setupState.next_step === 'dashboard') {
      product = await getProduct(token ?? '', productId, devClerkId)
    }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load this product.'
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-9 h-9 text-red-400 mx-auto mb-3" />
          <p className="text-base text-brand-text font-medium">{message}</p>
        </div>
      </div>
    )
  }

  // redirect() throws internally — it must not be inside the try/catch
  // above, or Next.js's own redirect signal gets swallowed as an error.
  switch (setupState.next_step) {
    case 'choose-audit':
      redirect(`/dashboard/products/${productId}/setup/audit-type`)

    case 'review-prompts':
      redirect(`/dashboard/products/${productId}/setup/prompts?auditType=${setupState.active_audit_type}`)

    case 'audit-progress':
      redirect(`/dashboard/products/${productId}/setup/progress?auditType=${setupState.active_audit_type}`)

    case 'context-failed':
      // The audit run itself failed after a type was chosen — send them
      // back to choose-audit so they can retry or switch type rather than
      // getting stuck on a dead end.
      redirect(`/dashboard/products/${productId}/setup/audit-type`)

    case 'dashboard':
      return (
        <DashboardLayout
          productId={productId}
          productName={product!.product_name}
          auditType={setupState.active_audit_type!}
        />
      )

    // Example of what adding a step looks like later:
    // case 'billing-required':
    //   redirect(`/dashboard/products/${productId}/setup/billing`)
  }
}
