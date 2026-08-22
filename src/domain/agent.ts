import type {
  AgentId,
  AgentModel,
  Environment,
  IsoTimestamp,
  PolicyId,
} from './common'

/**
 * Operational state of a deployed agent.
 *
 * `degraded` is distinct from `offline`: a degraded agent still serves traffic
 * but is breaching a health threshold, which is why the fleet view surfaces it
 * with a warning treatment rather than an error one.
 */
export type AgentStatus = 'active' | 'idle' | 'degraded' | 'paused' | 'offline'

export const AGENT_STATUSES: readonly AgentStatus[] = [
  'active',
  'idle',
  'degraded',
  'paused',
  'offline',
] as const

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  active: 'Active Runtime',
  idle: 'Idle',
  degraded: 'Degraded',
  paused: 'Paused',
  offline: 'Error State',
}

/** A capability the agent is permitted to invoke. */
export interface AgentTool {
  readonly name: string
  readonly description: string
  /** Tools flagged high-risk are the ones policies gate behind approval. */
  readonly highRisk: boolean
}

export interface Agent {
  readonly id: AgentId
  /** Human-facing display id shown on the fleet cards, e.g. `AGT-8921`. */
  readonly displayId: string
  readonly name: string
  readonly description: string
  readonly status: AgentStatus
  readonly environment: Environment
  readonly model: AgentModel
  readonly tools: readonly AgentTool[]
  readonly attachedPolicyIds: readonly PolicyId[]
  readonly createdAt: IsoTimestamp
  readonly updatedAt: IsoTimestamp
  /** Rolling 24h operational counters used by the fleet and dashboard views. */
  readonly metrics: AgentMetrics
}

export interface AgentMetrics {
  readonly runs24h: number
  readonly successRate: number
  readonly p50LatencyMs: number
  readonly cost24hUsd: number
  /** Utilisation samples (0–1), oldest first, for the fleet bar chart. */
  readonly utilization: readonly number[]
}

export interface AgentFilter {
  readonly search?: string
  readonly status?: AgentStatus | 'all'
  readonly environment?: Environment | 'all'
}
