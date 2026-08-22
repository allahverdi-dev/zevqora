import type { Policy } from '@/domain'

import { agoIso, DAY, HOUR } from './demo-context'

/**
 * Guardrail policies, reproducing the three shown on the approved Policies &
 * Guardrails screen including POL-001's YAML rule definition.
 *
 * `appliedToAgentIds` points at real fleet members so the detail pane's
 * "Applied To" list resolves to agents that exist elsewhere in the product.
 */
export const MOCK_POLICIES: readonly Policy[] = [
  {
    id: 'pol_001',
    displayId: 'POL-001',
    name: 'Block PII Disclosure',
    description:
      'Intercept and redact any output matching standard PII patterns (SSN, credit cards, phone numbers) before transmission.',
    status: 'enforced',
    effect: 'redact',
    severity: 'critical',
    category: 'security',
    matchers: [
      { pattern: 'regex(^(?!666|000|9\\d{2})\\d{3}-\\d{2}-\\d{4}$)', label: 'SSN' },
      { pattern: 'regex(?:4[0-9]{12}(?:[0-9]{3})?)', label: 'CREDIT_CARD' },
    ],
    definition: `policy:
  id: POL-001
  type: redaction
  severity: critical

  matchers:
    - pattern: "regex(^(?!666|000|9\\\\d{2})\\\\d{3}-\\\\d{2}-\\\\d{4}$)"
      label: SSN
    - pattern: "regex(?:4[0-9]{12}(?:[0-9]{3})?)"
      label: CREDIT_CARD

  actions:
    - on_match: redact_and_alert
      replacement: "[{label}_REDACTED]"
      alert_channel: #security-ops`,
    appliedToAgentIds: ['agt_8921', 'agt_114a', 'agt_4417'],
    lastModifiedAt: agoIso(2 * HOUR),
    lastModifiedBy: 'System',
  },
  {
    id: 'pol_042',
    displayId: 'POL-042',
    name: 'Require Approval for Refunds > $100',
    description:
      'Pause execution and request human-in-the-loop approval if a calculated refund amount exceeds the automated threshold.',
    status: 'disabled',
    effect: 'require_approval',
    severity: 'high',
    category: 'finance',
    matchers: [{ pattern: 'tool == "refund_payment"', label: 'REFUND_TOOL' }],
    definition: `policy:
  id: POL-042
  type: approval_gate
  severity: high

  matchers:
    - tool: refund_payment
      when: "amount > 100"

  actions:
    - on_match: require_approval
      queue: finance-admin
      timeout: 15m
      on_timeout: deny`,
    appliedToAgentIds: ['agt_114a'],
    lastModifiedAt: agoIso(3 * DAY),
    lastModifiedBy: 's.miller@acme.com',
  },
  {
    id: 'pol_018',
    displayId: 'POL-018',
    name: 'Rate Limit Ext. API Calls',
    description:
      'Throttle outgoing requests to third-party APIs to a maximum of 50 requests per minute per agent.',
    status: 'enforced',
    effect: 'rate_limit',
    severity: 'medium',
    category: 'infra',
    matchers: [{ pattern: 'tool.scope == "external"', label: 'EXTERNAL_TOOL' }],
    definition: `policy:
  id: POL-018
  type: rate_limit
  severity: medium

  matchers:
    - scope: external

  actions:
    - on_match: throttle
      limit: 50
      window: 1m
      key: agent_id
      on_exceed: queue`,
    appliedToAgentIds: ['agt_8921', 'agt_114a', 'agt_900x', 'agt_4417', 'agt_2261', 'agt_7734'],
    lastModifiedAt: agoIso(9 * DAY),
    lastModifiedBy: 'j.okafor@acme.com',
  },
]
