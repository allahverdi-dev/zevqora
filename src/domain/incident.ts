import type { AgentId, Environment, IncidentId, IsoTimestamp } from './common'

export type IncidentStatus = 'open' | 'investigating' | 'mitigated' | 'resolved'

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: 'Open',
  investigating: 'Investigating',
  mitigated: 'Mitigated',
  resolved: 'Resolved',
}

/** Paging severity, matching the SEV-n convention shown across the product. */
export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4'

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  sev1: 'SEV-1',
  sev2: 'SEV-2',
  sev3: 'SEV-3',
  sev4: 'SEV-4',
}

export const INCIDENT_SEVERITIES: readonly IncidentSeverity[] = [
  'sev1',
  'sev2',
  'sev3',
  'sev4',
]

export type IncidentEventSource = 'sys' | 'agent' | 'api' | 'human'

export const INCIDENT_EVENT_SOURCE_LABELS: Record<IncidentEventSource, string> = {
  sys: 'SYS',
  agent: 'AGENT',
  api: 'API',
  human: 'HUMAN',
}

/** One entry in an incident's timeline, optionally carrying a code payload. */
export interface IncidentEvent {
  readonly id: string
  readonly timestamp: IsoTimestamp
  readonly source: IncidentEventSource
  readonly message: string
  /** Pretty-printable JSON-ish payload rendered as a code block, if present. */
  readonly payload?: string
}

export interface Incident {
  readonly id: IncidentId
  readonly title: string
  readonly detail: string
  readonly severity: IncidentSeverity
  readonly status: IncidentStatus
  readonly environment: Environment
  readonly openedAt: IsoTimestamp
  readonly resolvedAt: IsoTimestamp | null
  readonly owner: string | null
  /** The agent primarily responsible, shown in the command-center header. */
  readonly primaryAgentId: AgentId | null
  /** Agents observed to be affected — drives the "affecting N groups" copy. */
  readonly affectedAgentIds: readonly AgentId[]
  readonly timeline: readonly IncidentEvent[]
  /** Set once a demo mitigation (Pause Agent / Rollback) has been applied. */
  readonly mitigations: readonly string[]
}

export interface IncidentFilter {
  readonly severity?: IncidentSeverity | 'all'
}

export interface DeclareIncidentInput {
  readonly title: string
  readonly severity: IncidentSeverity
  readonly agentId: AgentId | null
  readonly detail: string
}
