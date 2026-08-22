import type {
  AgentId,
  ApprovalId,
  IsoTimestamp,
  PolicyId,
  RunId,
  Severity,
} from './common'

/**
 * A human-in-the-loop decision point.
 *
 * Approvals are surfaced on the dashboard's Pending Approvals panel and on the
 * dedicated Approval Queue screen (`/approvals`), which resolves against the
 * same repository — approving or rejecting a request in either place updates
 * the other, since both read through `ApprovalRepository`.
 */
export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'auto_approved'

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
  auto_approved: 'Auto-approved',
}

export type ApprovalKind =
  | 'tool_execution'
  | 'deployment'
  | 'policy_override'
  | 'budget_increase'

/** Urgency reuses the shared `Severity` union — the two are the same scale. */
export type ApprovalUrgency = Severity

/** A single labelled fact shown in the approval's Context panel. */
export interface ApprovalContextFact {
  readonly label: string
  readonly value: string
  readonly emphasis?: 'default' | 'critical'
}

export type ApprovalStepState = 'complete' | 'active' | 'blocked'

/**
 * One step of the approval's execution summary.
 *
 * This is an application-authored record of what the control plane observed
 * and did — the request received, the checks it ran, the policy it hit — not
 * a model's private chain-of-thought. ZEVQORA does not expose provider-internal
 * reasoning; see the README for the same note as it applies to trace events.
 */
export interface ApprovalStep {
  readonly label: string
  readonly detail: string
  readonly state: ApprovalStepState
}

export interface ApprovalRequest {
  readonly id: ApprovalId
  readonly kind: ApprovalKind
  readonly title: string
  readonly detail: string
  readonly status: ApprovalStatus
  readonly severity: Severity
  readonly requestedBy: string
  readonly requestedAt: IsoTimestamp
  readonly resolvedAt: IsoTimestamp | null
  readonly resolvedBy: string | null
  readonly runId: RunId | null
  readonly agentId: AgentId | null
  readonly policyId: PolicyId | null

  /** Short action-request code shown on the queue, e.g. `AG-992-FX`. */
  readonly requestCode: string
  /** The gated tool/action name, e.g. `refund_payment`. */
  readonly action: string
  /** The subsystem the action runs against, e.g. `Finance Subsystem`. */
  readonly subsystem: string
  readonly riskScore: number | null
  readonly riskNote: string | null
  readonly context: readonly ApprovalContextFact[]
  readonly executionSummary: readonly ApprovalStep[]
}

export type ApprovalDecision = 'approved' | 'rejected'

export interface ApprovalHistoryEntry {
  readonly id: string
  readonly requestCode: string
  readonly action: string
  readonly decision: ApprovalDecision
  readonly admin: string
  readonly decidedAt: IsoTimestamp
}

export interface ApprovalFilter {
  readonly urgency?: ApprovalUrgency | 'all'
  readonly search?: string
}
