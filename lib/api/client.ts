/**
 * Dhwani API Client
 * All calls to the Express backend. Clerk token is injected by callers.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
const DEV_CLERK_ID_KEY = 'dhwani_dev_clerk_id'

async function request<T>(
  path: string,
  options: RequestInit & { token?: string; devClerkId?: string } = {}
): Promise<T> {
  const { token, devClerkId, ...fetchOptions } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  // Dev-only bypass header (see backend clerkAuth.middleware.js — only
  // honored when DEV_AUTH_BYPASS=true on the server, ignored otherwise).
  // Callers running in the browser get this from localStorage the same
  // way they always have; server-side callers (e.g. the resolver Server
  // Component, which has no window/localStorage) pass it explicitly since
  // they already have the Clerk userId from auth() with no extra round trip.
  if (devClerkId) {
    headers['x-dev-clerk-id'] = devClerkId
  } else if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(DEV_CLERK_ID_KEY)
    if (stored) headers['x-dev-clerk-id'] = stored
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
  // Backend returns the updated User document (see onboarding.controller.js),
  // not a bare {success} flag — callers here only await the promise and
  // don't read the payload, so this was a silent type/reality mismatch
  // rather than a live bug, but fixed to stop it from becoming one.
  return request<Record<string, unknown>>('/onboarding/user', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
}

export function submitCompanyOnboarding(
  token: string,
  body: { name: string; country: string }
) {
  // Backend returns the created Company document, same note as above.
  return request<Record<string, unknown>>('/onboarding/company', {
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

// Product-level context/scrape lifecycle only — unrelated to any specific
// audit run. See models/product.model.js.
export type ProductContextStatus = 'SCRAPING' | 'IDLE' | 'FAILED'

export type AuditRunStatus = 'NOT_STARTED' | 'RUNNING' | 'DONE' | 'FAILED'

export type Product = {
  _id: string
  companyId: string
  client_name: string
  product_name: string
  product_description: string | null
  domain: string
  country: string
  audit_status: ProductContextStatus
  audits: {
    discovery: { status: AuditRunStatus; startedAt: string | null; completedAt: string | null }
    brandhealth: { status: AuditRunStatus; startedAt: string | null; completedAt: string | null }
  }
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
export function getProduct(token: string, productId: string, devClerkId?: string) {
  return request<Product>(`/products/${productId}`, { token, devClerkId })
}

// DELETE /products/:productId — cascades on the backend across prompts,
// audit reports, and both summary types. `confirmName` must exactly match
// the product's name (server-side enforced, not just a UI gate) — same
// "type the name to confirm" pattern GitHub uses for repo deletion.
// Rejected with 409 if an audit is currently RUNNING on this product.
export function deleteProduct(token: string, productId: string, confirmName: string, devClerkId?: string) {
  return request<{ deleted_id: string }>(`/products/${productId}`, {
    method: 'DELETE',
    token,
    devClerkId,
    body: JSON.stringify({ confirm_name: confirmName }),
  })
}

// GET /products/:productId/setup-state
// Single source of truth for "what screen should this product resume on" —
// AND for both audits' state at once. Discovery and Brand Health are
// independent: one can be DONE while the other is RUNNING or never started,
// on the same product. `default_view` is which tab the dashboard should open
// on; `next_step` is only used by the resolver, for the case where NEITHER
// audit has any progress yet.
export type SetupStateNextStep =
  | 'choose-audit'
  | 'review-prompts'
  | 'audit-progress'
  | 'dashboard'
  | 'context-failed'

export type AuditTypeState = {
  status: AuditRunStatus
  next_step: SetupStateNextStep
  prompts?: Prompt[]
  progress?: { done: number; total: number }
}

export type SetupState = {
  product_id: string
  context_status: ProductContextStatus
  audits: {
    discovery: AuditTypeState
    brandhealth: AuditTypeState
  }
  default_view: 'discovery' | 'brandhealth' | null
  next_step: SetupStateNextStep
}

export function getProductSetupState(token: string, productId: string, devClerkId?: string) {
  return request<SetupState>(`/products/${productId}/setup-state`, { token, devClerkId })
}

// ─── Companies ─────────────────────────────────────────────────────────────
// Dashboard-side workspace management — mirrors controllers/company.controller.js.

export type Company = {
  _id: string
  ownerId: string
  name: string
  country: string
  product_count?: number
  stats?: { discovery_done: number; brandhealth_done: number }
  createdAt?: string
  updatedAt?: string
}

export type CreateCompanyBody = {
  name: string
  country: string
}

// POST /companies — dashboard "add another workspace". 403s server-side if
// the account is `individual` and already has one company.
export function createCompany(token: string, body: CreateCompanyBody) {
  return request<Company>('/companies', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
}

// GET /companies — powers the workspace switcher's dropdown list.
export function listCompanies(token: string) {
  return request<Company[]>('/companies', { token })
}

// GET /companies/:companyId
export function getCompany(token: string, companyId: string) {
  return request<Company>(`/companies/${companyId}`, { token })
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
  status: AuditRunStatus
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

// ─── Playground: Marketplace / Cart / Flows / Flow Runs ────────────────────
// Mirrors controllers/marketplace.controller.js, toolLibrary.controller.js,
// flow.controller.js, flowRun.controller.js. Fully separate from Discovery/
// Brand Health above — no shared types, no shared endpoints.

export type Tool = {
  _id: string
  name: string
  slug: string
  description: string
  category: string
  icon?: string | null
  playground_compatible: boolean
  input_schema?: Record<string, unknown>
  output_schema?: Record<string, unknown>
  accepts_tool_output_from: string[]
  version: number
  // Only present on GET /marketplace/tools — whether the calling account
  // already has this tool in its library.
  in_library?: boolean
  // Only present on GET /me/tool-library — when it was added.
  addedAt?: string
}

// GET /marketplace/tools?category=...
export function listMarketplaceTools(token: string, category?: string) {
  const qs = category ? `?${new URLSearchParams({ category })}` : ''
  return request<{ tools: Tool[] }>(`/marketplace/tools${qs}`, { token })
}

// POST /me/tool-library
export function addToolToLibrary(token: string, toolId: string) {
  return request<{ entry: { _id: string; ownerId: string; toolId: string; addedAt: string } }>(
    '/me/tool-library',
    { method: 'POST', token, body: JSON.stringify({ toolId }) }
  )
}

// GET /me/tool-library
export function listLibraryTools(token: string) {
  return request<{ tools: Tool[] }>('/me/tool-library', { token })
}

// DELETE /me/tool-library/:toolId — doesn't touch existing Flows, only
// blocks adding new nodes of this tool going forward.
export function removeToolFromLibrary(token: string, toolId: string) {
  return request<Record<string, never>>(`/me/tool-library/${toolId}`, { method: 'DELETE', token })
}

// ─── Flows ───────────────────────────────────────────────────────────────

export type FlowNodeInput = {
  nodeId: string
  toolId: string
  position: { x: number; y: number }
}

export type FlowNode = FlowNodeInput & {
  // Only present on GET /flows/:flowId — hydrated tool details for
  // rendering the node on the canvas without a second fetch.
  tool?: Pick<Tool, 'name' | 'slug' | 'icon' | 'category' | 'output_schema' | 'version' | 'accepts_tool_output_from'> | null
}

export type FlowEdge = { fromNodeId: string; toNodeId: string }

export type FlowSummary = {
  _id: string
  name: string
  node_count: number
  createdAt: string
  updatedAt: string
}

export type FlowDetail = {
  _id: string
  name: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  createdAt: string
  updatedAt: string
}

// POST /flows
export function createFlow(token: string, body: { name: string; nodes: FlowNodeInput[]; edges: FlowEdge[] }) {
  return request<{ flow: FlowDetail }>('/flows', { method: 'POST', token, body: JSON.stringify(body) })
}

// GET /flows
export function listFlows(token: string) {
  return request<{ flows: FlowSummary[] }>('/flows', { token })
}

// GET /flows/:flowId
export function getFlow(token: string, flowId: string) {
  return request<{ flow: FlowDetail }>(`/flows/${flowId}`, { token })
}

// PATCH /flows/:flowId — any subset of name/nodes/edges
export function updateFlow(
  token: string,
  flowId: string,
  body: Partial<{ name: string; nodes: FlowNodeInput[]; edges: FlowEdge[] }>
) {
  return request<{ flow: FlowDetail }>(`/flows/${flowId}`, { method: 'PATCH', token, body: JSON.stringify(body) })
}

// DELETE /flows/:flowId — doesn't cascade-delete past FlowRuns; history stays.
export function deleteFlow(token: string, flowId: string) {
  return request<Record<string, never>>(`/flows/${flowId}`, { method: 'DELETE', token })
}

// ─── Flow runs ───────────────────────────────────────────────────────────

export type FlowRunStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED'

// POST /flows/:flowId/run
export function runFlow(token: string, flowId: string, productId: string) {
  return request<{ flow_run_id: string; status: FlowRunStatus }>(`/flows/${flowId}/run`, {
    method: 'POST',
    token,
    body: JSON.stringify({ productId }),
  })
}

export type FlowRunSection = {
  node_id: string
  tool_name: string
  tool_slug: string | null
  tool_icon: string | null
  tool_version: number
  status: FlowRunStatus
  output: unknown
  error: string | null
  started_at: string | null
  completed_at: string | null
}

export type FlowRunReport = {
  flow_run_id: string
  status: FlowRunStatus
  started_at: string | null
  completed_at: string | null
  sections: FlowRunSection[]
}

// GET /flow-runs/:flowRunId — poll this until status is DONE or FAILED.
export function getFlowRun(token: string, flowRunId: string) {
  return request<{ report: FlowRunReport }>(`/flow-runs/${flowRunId}`, { token })
}

export type FlowRunHistoryEntry = {
  flow_run_id: string
  flow_id: string | null
  flow_name: string
  status: FlowRunStatus
  started_at: string | null
  completed_at: string | null
  created_at: string
}

// GET /products/:productId/flow-runs — history across all flows for this product.
export function listProductFlowRuns(token: string, productId: string) {
  return request<{ runs: FlowRunHistoryEntry[] }>(`/products/${productId}/flow-runs`, { token })
}
