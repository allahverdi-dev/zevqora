import type { ApprovalHistoryEntry, ApprovalRequest } from '@/domain'

import { agoIso, HOUR, MINUTE } from './demo-context'

/**
 * Pending human-in-the-loop approvals.
 *
 * The dashboard's Pending Approvals panel and the dedicated Approval Queue
 * screen (`/approvals`) both read this list through the same repository, so
 * the first two entries reproduce the dashboard panel exactly, while
 * `AG-992-FX` / `AG-410-DP` / `AG-105-NW` reproduce the approved Approvals
 * screen's queue exactly. The queue totals 12, matching both screens'
 * "Awaiting Approval" / "PENDING APPROVALS (12)" literals.
 */
export const MOCK_APPROVALS: readonly ApprovalRequest[] = [
  {
    id: 'apr_7741',
    kind: 'deployment',
    title: 'Deployment: CodeAnalyzer_v4',
    detail:
      'Promote CodeAnalyzer_v4 from staging to production. Introduces two new high-risk tools.',
    status: 'pending',
    severity: 'high',
    requestedBy: 'user_jdoe',
    requestedAt: agoIso(22 * MINUTE),
    resolvedAt: null,
    resolvedBy: null,
    runId: null,
    agentId: 'agt_900x',
    policyId: null,
    requestCode: 'AG-900X-DE',
    action: 'deploy_release',
    subsystem: 'Release Subsystem',
    riskScore: 58,
    riskNote: 'New tool grants introduced in this release have not been reviewed.',
    context: [
      { label: 'Release', value: 'CodeAnalyzer_v4' },
      { label: 'Target', value: 'production' },
      { label: 'New tools', value: '2 (deploy_preview, rollback_release)' },
    ],
    executionSummary: [
      {
        label: 'Step 1: Release candidate built and staged.',
        detail: 'CodeAnalyzer_v4 passed the staging regression suite.',
        state: 'complete',
      },
      {
        label: 'Step 2: Diffed tool grants against the production profile.',
        detail: '2 new high-risk tools detected relative to v3.',
        state: 'complete',
      },
      {
        label: 'Step 3: Requesting promotion to production.',
        detail: 'Blocked by Policy: New high-risk tool grants require review.',
        state: 'blocked',
      },
    ],
  },
  {
    id: 'apr_7738',
    kind: 'policy_override',
    title: 'Policy Override: SupportBot_v2',
    detail:
      'Temporarily bypass POL-018 rate limiting during the backlog drain window.',
    status: 'pending',
    severity: 'medium',
    requestedBy: 'System',
    requestedAt: agoIso(48 * MINUTE),
    resolvedAt: null,
    resolvedBy: null,
    runId: null,
    agentId: 'agt_8921',
    policyId: 'pol_018',
    requestCode: 'AG-8921-PO',
    action: 'override_rate_limit',
    subsystem: 'Support Subsystem',
    riskScore: 34,
    riskNote: 'Backlog has exceeded SLA; override is time-boxed to 2 hours.',
    context: [
      { label: 'Policy', value: 'POL-018 Rate Limit Ext. API Calls' },
      { label: 'Requested window', value: '2 hours' },
      { label: 'Backlog depth', value: '340 conversations' },
    ],
    executionSummary: [
      {
        label: 'Step 1: Backlog depth crossed the SLA threshold.',
        detail: '340 conversations waiting, 15 minute SLA breached.',
        state: 'complete',
      },
      {
        label: 'Step 2: Auto-mitigation evaluated a temporary rate override.',
        detail: 'Override would restore throughput within the drain window.',
        state: 'complete',
      },
      {
        label: 'Step 3: Requesting temporary override of POL-018.',
        detail: 'Blocked by Policy: Rate limit overrides require human approval.',
        state: 'blocked',
      },
    ],
  },
  {
    id: 'apr_ag992fx',
    kind: 'tool_execution',
    title: 'refund_payment',
    detail: 'Refund exceeds the automated threshold and requires finance sign-off.',
    status: 'pending',
    severity: 'high',
    requestedBy: 'agt_114a',
    requestedAt: agoIso(2 * MINUTE),
    resolvedAt: null,
    resolvedBy: null,
    runId: null,
    agentId: 'agt_114a',
    policyId: 'pol_042',
    requestCode: 'AG-992-FX',
    action: 'refund_payment',
    subsystem: 'Finance Subsystem',
    riskScore: 85,
    riskNote: 'Transaction anomaly detected in user history.',
    context: [
      { label: 'User ID', value: 'USR-8812-B' },
      { label: 'Transaction', value: 'TXN-404091-XYZ' },
      { label: 'Amount', value: '$4,500.00 USD', emphasis: 'critical' },
      { label: 'Risk Score', value: '85/100', emphasis: 'critical' },
    ],
    executionSummary: [
      {
        label: 'Step 1: User requested refund via support chat.',
        detail: '"I accidentally purchased the Enterprise tier instead of Pro."',
        state: 'complete',
      },
      {
        label: 'Step 2: Verified transaction TXN-404091-XYZ.',
        detail: 'Transaction age: 4 hours. Status: Settled.',
        state: 'complete',
      },
      {
        label: 'Step 3: Calculated refund eligibility.',
        detail: 'Within 14-day window. Full refund applicable.',
        state: 'complete',
      },
      {
        label: 'Step 4: Executing refund_payment.',
        detail: 'Blocked by Policy: High Value Refund > $1k. Human verification required.',
        state: 'blocked',
      },
    ],
  },
  {
    id: 'apr_ag410dp',
    kind: 'tool_execution',
    title: 'delete_database_records',
    detail: 'Bulk delete requested against the User table ahead of a GDPR erasure job.',
    status: 'pending',
    severity: 'medium',
    requestedBy: 'agt_7734',
    requestedAt: agoIso(15 * MINUTE),
    resolvedAt: null,
    resolvedBy: null,
    runId: null,
    agentId: 'agt_7734',
    policyId: null,
    requestCode: 'AG-410-DP',
    action: 'delete_database_records',
    subsystem: 'Data Platform',
    riskScore: 62,
    riskNote: 'Destructive, irreversible action against a production table.',
    context: [
      { label: 'Table', value: 'User Table (12 rows)' },
      { label: 'Reason', value: 'GDPR erasure request #GD-2291' },
      { label: 'Backup', value: 'Snapshot taken 4m ago' },
    ],
    executionSummary: [
      {
        label: 'Step 1: Received GDPR erasure request GD-2291.',
        detail: '12 matching rows identified in the User table.',
        state: 'complete',
      },
      {
        label: 'Step 2: Took a pre-deletion snapshot.',
        detail: 'Snapshot db-user-2291 stored for 30 days.',
        state: 'complete',
      },
      {
        label: 'Step 3: Executing delete_database_records.',
        detail: 'Blocked by Policy: Destructive Data Action. Human verification required.',
        state: 'blocked',
      },
    ],
  },
  {
    id: 'apr_ag105nw',
    kind: 'tool_execution',
    title: 'update_api_keys',
    detail: 'Rotating production gateway credentials ahead of scheduled expiry.',
    status: 'pending',
    severity: 'low',
    requestedBy: 'agt_4417',
    requestedAt: agoIso(1 * HOUR),
    resolvedAt: null,
    resolvedBy: null,
    runId: null,
    agentId: 'agt_4417',
    policyId: null,
    requestCode: 'AG-105-NW',
    action: 'update_api_keys',
    subsystem: 'Production Gateway',
    riskScore: 28,
    riskNote: 'Scheduled credential rotation, low blast radius.',
    context: [
      { label: 'Gateway', value: 'Production Gateway' },
      { label: 'Keys affected', value: '1' },
      { label: 'Expiry', value: 'In 6 hours' },
    ],
    executionSummary: [
      {
        label: 'Step 1: Detected an API key nearing expiry.',
        detail: 'Production Gateway key expires in 6 hours.',
        state: 'complete',
      },
      {
        label: 'Step 2: Generated a replacement credential.',
        detail: 'New key staged, not yet activated.',
        state: 'complete',
      },
      {
        label: 'Step 3: Executing update_api_keys.',
        detail: 'Blocked by Policy: Credential Rotation. Human verification required.',
        state: 'blocked',
      },
    ],
  },
  ...Array.from({ length: 7 }, (_, index): ApprovalRequest => ({
    id: `apr_${7700 - index}`,
    kind: index % 2 === 0 ? 'tool_execution' : 'budget_increase',
    title:
      index % 2 === 0
        ? `Tool Execution: refund_payment (#${9000 + index})`
        : `Budget Increase: ${1000 + index * 250} USD monthly cap`,
    detail:
      index % 2 === 0
        ? 'Refund exceeds the automated threshold and requires finance sign-off.'
        : 'Requested increase to the workspace model-spend cap for the current cycle.',
    status: 'pending',
    severity: index % 3 === 0 ? 'high' : 'medium',
    requestedBy: index % 2 === 0 ? 'agt_114a' : 'user_jdoe',
    requestedAt: agoIso((2 + index) * HOUR),
    resolvedAt: null,
    resolvedBy: null,
    runId: null,
    agentId: index % 2 === 0 ? 'agt_114a' : null,
    policyId: index % 2 === 0 ? 'pol_042' : null,
    requestCode: `AG-${7700 - index}-${index % 2 === 0 ? 'FX' : 'BU'}`,
    action: index % 2 === 0 ? 'refund_payment' : 'increase_budget_cap',
    subsystem: index % 2 === 0 ? 'Finance Subsystem' : 'Billing Subsystem',
    riskScore: index % 2 === 0 ? 71 : 40,
    riskNote: null,
    context: [
      { label: 'Requested by', value: index % 2 === 0 ? 'agt_114a' : 'user_jdoe' },
    ],
    executionSummary: [
      {
        label: 'Step 1: Threshold exceeded automated approval limits.',
        detail: 'Escalated to the human approval queue.',
        state: 'blocked',
      },
    ],
  })),
]

/**
 * Decisions recorded before this session started — the Approvals screen's
 * "Recent History" strip and the "Last 24h: N Approved / M Rejected" summary.
 */
export const MOCK_APPROVAL_HISTORY: readonly ApprovalHistoryEntry[] = [
  {
    id: 'aprh_1',
    requestCode: 'AG-221-DB',
    action: 'drop_test_tables',
    decision: 'approved',
    admin: 'jsmith@acme.com',
    decidedAt: agoIso(4 * HOUR + 18 * MINUTE),
  },
  {
    id: 'aprh_2',
    requestCode: 'AG-992-FX',
    action: 'issue_credit',
    decision: 'rejected',
    admin: 'jsmith@acme.com',
    decidedAt: agoIso(5 * HOUR + 47 * MINUTE),
  },
  {
    id: 'aprh_3',
    requestCode: 'AG-114A-RF',
    action: 'refund_payment',
    decision: 'approved',
    admin: 's.miller@acme.com',
    decidedAt: agoIso(7 * HOUR),
  },
  {
    id: 'aprh_4',
    requestCode: 'AG-8921-TK',
    action: 'update_ticket',
    decision: 'approved',
    admin: 's.miller@acme.com',
    decidedAt: agoIso(9 * HOUR + 30 * MINUTE),
  },
]
