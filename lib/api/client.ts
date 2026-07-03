/**
 * Dhwani API Client
 * All calls to the Express backend. Clerk token is injected by callers.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
const DEV_CLERK_ID_KEY = 'dhwani_dev_clerk_id'

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (typeof window !== 'undefined') {
    const devClerkId = window.localStorage.getItem(DEV_CLERK_ID_KEY)
    if (devClerkId) headers['x-dev-clerk-id'] = devClerkId
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers })
  const data = await res.json()

  if (!res.ok) {
    throw new ApiError(data?.message ?? `Request failed: ${res.status}`, res.status, data)
  }

  // Backend wraps every successful response in an ApiResponse envelope:
  // { statusCode, data, message, success }. Every controller does this
  // (see ApiResponse usage across onboarding/discovery/brandhealth/products routes).
  // Without unwrapping here, callers were reading fields (like next_step,
  // or _id on a freshly created product) off the *envelope* instead of the
  // real payload — which is why they came back undefined even though the
  // request succeeded and the server logs showed 200s.
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data as T
  }
  return data as T
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Onboarding ────────────────────────────────────────────────────────────

export type OnboardingStatus = {
  user_step_done: boolean
  company_step_done: boolean
  product_step_done: boolean
  next_step: 'user' | 'company' | 'product' | 'done'
  role: 'individual' | 'agency' | null
  company_id: string | null
  company_name: string | null
  product_id: string | null
  product_name: string | null
}

export function getOnboardingStatus(token: string) {
  return request<OnboardingStatus>('/onboarding/status', { token })
}

export function submitUserOnboarding(
  token: string,
  body: { name: string; country: string; hear_about_us: string; work_email: string; role: string }
) {
  return request<{ success: boolean }>('/onboarding/user', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
}

export function submitCompanyOnboarding(
  token: string,
  body: { name: string; country: string }
) {
  return request<{ success: boolean }>('/onboarding/company', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
}

export type ProductResponse = {
  _id: string
  product_name: string
  domain: string
  country: string
  business_summary?: string
  [key: string]: unknown
}

export function submitProductOnboarding(
  token: string,
  body: { product_name: string; product_description?: string; domain: string; country: string }
) {
  return request<ProductResponse>('/onboarding/product', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
}

// ─── Products ───────────────────────────────────────────────────────────────
// Dashboard-side product management — listing/creating/reading products for
// an already-onboarded company. Mirrors controllers/product.controller.js.

export type ProductAuditStatus = 'SCRAPING' | 'IDLE' | 'FAILED'

export type Product = {
  _id: string
  companyId: string
  client_name: string
  product_name: string
  product_description: string | null
  domain: string
  country: string
  audit_status: ProductAuditStatus
  context?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
}

export type CreateProductBody = {
  companyId: string
  product_name: string
  product_description?: string
  domain: string
  country: string
}

// POST /products — dashboard "add another product". Runs context extraction
// synchronously server-side (product comes back either IDLE with `context`
// populated, or the request itself fails with a 500 if extraction failed —
// there's no polling needed here, unlike discovery/brandhealth progress).
export function createProduct(token: string, body: CreateProductBody) {
  return request<Product>('/products', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
}

// GET /products?companyId=...
export function listProducts(token: string, companyId: string) {
  return request<Product[]>(`/products?${new URLSearchParams({ companyId })}`, { token })
}

// GET /products/:productId
export function getProduct(token: string, productId: string) {
  return request<Product>(`/products/${productId}`, { token })
}

// ─── Discovery ─────────────────────────────────────────────────────────────

export type Prompt = {
  _id: string
  prompt_text: string
}

export type PromptsResponse = {
  prompts: Prompt[]
}

export type ProgressResponse = {
  status: 'IDLE' | 'RUNNING' | 'DONE'
  done: number
  total: number
}

export function initDiscovery(token: string, productId: string) {
  return request<PromptsResponse>('/discovery/init', {
    method: 'POST',
    token,
    body: JSON.stringify({ productId }),
  })
}

export function editDiscoveryPrompt(token: string, promptId: string, prompt_text: string) {
  return request<{ success: boolean }>(`/discovery/prompt/${promptId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ prompt_text }),
  })
}

export function deleteDiscoveryPrompt(token: string, promptId: string) {
  return request<{ success: boolean }>(`/discovery/prompt/${promptId}`, {
    method: 'DELETE',
    token,
  })
}

export function addDiscoveryPrompt(token: string, productId: string, prompt_text: string) {
  return request<Prompt>('/discovery/prompt', {
    method: 'POST',
    token,
    body: JSON.stringify({ productId, prompt_text }),
  })
}

export function confirmDiscovery(token: string, productId: string) {
  return request<{ success: boolean }>('/discovery/confirm', {
    method: 'POST',
    token,
    body: JSON.stringify({ productId }),
  })
}

export function getDiscoveryProgress(token: string, productId: string) {
  return request<ProgressResponse>(`/discovery/progress/${productId}`, { token })
}

export function getDiscoverySummary(token: string, productId: string) {
  return request<Record<string, unknown>>(`/discovery/summary/${productId}`, { token })
}

// ─── Brand Health ───────────────────────────────────────────────────────────

export function initBrandHealth(token: string, productId: string) {
  return request<PromptsResponse>('/brandhealth/init', {
    method: 'POST',
    token,
    body: JSON.stringify({ productId }),
  })
}

export function editBrandHealthPrompt(token: string, promptId: string, prompt_text: string) {
  return request<{ success: boolean }>(`/brandhealth/prompt/${promptId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ prompt_text }),
  })
}

export function deleteBrandHealthPrompt(token: string, promptId: string) {
  return request<{ success: boolean }>(`/brandhealth/prompt/${promptId}`, {
    method: 'DELETE',
    token,
  })
}

export function addBrandHealthPrompt(token: string, productId: string, prompt_text: string) {
  return request<Prompt>('/brandhealth/prompt', {
    method: 'POST',
    token,
    body: JSON.stringify({ productId, prompt_text }),
  })
}

export function confirmBrandHealth(token: string, productId: string) {
  return request<{ success: boolean }>('/brandhealth/confirm', {
    method: 'POST',
    token,
    body: JSON.stringify({ productId }),
  })
}

export function getBrandHealthProgress(token: string, productId: string) {
  return request<ProgressResponse>(`/brandhealth/progress/${productId}`, { token })
}

export function getBrandHealthSummary(token: string, productId: string) {
  return request<Record<string, unknown>>(`/brandhealth/summary/${productId}`, { token })
}
