import type {
  AgentId,
  IsoTimestamp,
  PolicyId,
  Severity,
} from './common'

/**
 * What a policy does when its matchers fire.
 *
 * `require_approval` is the effect that produces the human-in-the-loop gate
 * visible in the trace and the simulator.
 */
export type PolicyEffect =
  | 'allow'
  | 'deny'
  | 'require_approval'
  | 'rate_limit'
  | 'redact'

export const POLICY_EFFECTS: readonly PolicyEffect[] = [
  'allow',
  'deny',
  'require_approval',
  'rate_limit',
  'redact',
] as const

export const POLICY_EFFECT_LABELS: Record<PolicyEffect, string> = {
  allow: 'Allow',
  deny: 'Deny',
  require_approval: 'Require Approval',
  rate_limit: 'Rate Limit',
  redact: 'Redact',
}

/** Enforcement state. Disabled policies stay listed but do not evaluate. */
export type PolicyStatus = 'enforced' | 'disabled'

export type PolicyCategory = 'security' | 'finance' | 'infra' | 'compliance'

export const POLICY_CATEGORY_LABELS: Record<PolicyCategory, string> = {
  security: 'Security',
  finance: 'Finance',
  infra: 'Infra',
  compliance: 'Compliance',
}

export interface PolicyMatcher {
  readonly pattern: string
  readonly label: string
}

export interface Policy {
  readonly id: PolicyId
  /** Display id used across the UI, e.g. `POL-001`. */
  readonly displayId: string
  readonly name: string
  readonly description: string
  readonly status: PolicyStatus
  readonly effect: PolicyEffect
  readonly severity: Severity
  readonly category: PolicyCategory
  readonly matchers: readonly PolicyMatcher[]
  /** Declarative rule source shown in the detail pane. */
  readonly definition: string
  readonly appliedToAgentIds: readonly AgentId[]
  readonly lastModifiedAt: IsoTimestamp
  readonly lastModifiedBy: string
}

export interface PolicyFilter {
  readonly search?: string
  readonly status?: PolicyStatus | 'all'
  readonly category?: PolicyCategory | 'all'
}

/** Fields the demo configuration editor is allowed to change. */
export interface PolicyDraft {
  readonly name: string
  readonly description: string
  readonly definition: string
  readonly status: PolicyStatus
  readonly severity: Severity
}
