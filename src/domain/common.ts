/**
 * Primitives shared across the ZEVQORA domain.
 *
 * Branded id aliases keep call sites readable without paying for nominal
 * typing ceremony. Where a domain state is finite it is modelled as a union so
 * the compiler — not a code review — catches an unhandled case.
 */

export type AgentId = string
export type RunId = string
export type TraceEventId = string
export type PolicyId = string
export type EvaluationId = string
export type EvaluationSuiteId = string
export type ApprovalId = string
export type IncidentId = string
export type WorkspaceId = string

/** ISO-8601 timestamp string. */
export type IsoTimestamp = string

/** Deployment target a run or agent belongs to. */
export type Environment = 'production' | 'staging' | 'sandbox' | 'development'

export const ENVIRONMENTS: readonly Environment[] = [
  'production',
  'staging',
  'sandbox',
  'development',
] as const

export const ENVIRONMENT_LABELS: Record<Environment, string> = {
  production: 'Production',
  staging: 'Staging',
  sandbox: 'Sandbox',
  development: 'Development',
}

/** Model vendors represented in the demo dataset. */
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'meta' | 'custom'

export interface AgentModel {
  readonly id: string
  readonly label: string
  readonly provider: ModelProvider
  /** USD per 1K input tokens — used by the deterministic cost estimator. */
  readonly inputCostPer1k: number
  readonly outputCostPer1k: number
}

export interface Workspace {
  readonly id: WorkspaceId
  readonly name: string
  readonly slug: string
  readonly environments: readonly Environment[]
}

/** Severity shared by incidents and policies. */
export type Severity = 'low' | 'medium' | 'high' | 'critical'

/** A page of results from a repository query. */
export interface Page<T> {
  readonly items: readonly T[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
}

export type SortDirection = 'asc' | 'desc'

export interface SortSpec<TField extends string> {
  readonly field: TField
  readonly direction: SortDirection
}
