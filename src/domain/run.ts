import type {
  AgentId,
  Environment,
  IsoTimestamp,
  RunId,
  SortSpec,
} from './common'

/**
 * Lifecycle state of an agent run.
 *
 * `awaiting_approval` is a first-class terminal-ish state rather than a flag on
 * `running`: it is the state a human acts on, and the whole control-plane
 * premise depends on it being explicit.
 */
export type RunStatus =
  | 'success'
  | 'running'
  | 'failed'
  | 'awaiting_approval'
  | 'cancelled'

export const RUN_STATUSES: readonly RunStatus[] = [
  'success',
  'running',
  'failed',
  'awaiting_approval',
  'cancelled',
] as const

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  success: 'Success',
  running: 'Running',
  failed: 'Failed',
  awaiting_approval: 'Awaiting Approval',
  cancelled: 'Cancelled',
}

export interface TokenUsage {
  readonly input: number
  readonly output: number
  readonly total: number
}

export interface Run {
  readonly id: RunId
  readonly agentId: AgentId
  readonly agentName: string
  readonly modelId: string
  readonly modelLabel: string
  readonly status: RunStatus
  readonly environment: Environment
  readonly startedAt: IsoTimestamp
  readonly completedAt: IsoTimestamp | null
  readonly durationMs: number
  readonly tokens: TokenUsage
  readonly costUsd: number
  /** The request that opened the run — searchable from the explorer. */
  readonly input: string
  readonly output: string | null
  /** True while token/cost figures are still accruing on a live run. */
  readonly estimated: boolean
}

export type RunSortField =
  | 'startedAt'
  | 'durationMs'
  | 'costUsd'
  | 'tokens'
  | 'status'
  | 'agentName'

export type RunSort = SortSpec<RunSortField>

export interface RunFilter {
  readonly search?: string
  readonly environment?: Environment | 'all'
  readonly status?: RunStatus | 'all'
  readonly agentId?: AgentId | 'all'
  readonly modelId?: string | 'all'
  readonly period?: RunPeriod
}

/** Relative time window applied by the explorer's period control. */
export type RunPeriod = '1h' | '24h' | '7d' | '30d' | 'all'

export const RUN_PERIODS: readonly RunPeriod[] = [
  '1h',
  '24h',
  '7d',
  '30d',
  'all',
] as const

export const RUN_PERIOD_LABELS: Record<RunPeriod, string> = {
  '1h': 'Last 1h',
  '24h': 'Last 24h',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  all: 'All time',
}

export interface RunQuery {
  readonly filter?: RunFilter
  readonly sort?: RunSort
  readonly page?: number
  readonly pageSize?: number
}

/** Aggregate shown in the explorer's summary card. */
export interface RunSummary {
  readonly successRate: number
  readonly avgLatencyMs: number
  readonly totalCostUsd: number
  readonly totalRuns: number
}
