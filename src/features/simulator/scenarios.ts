import type { Scenario } from './types'

/**
 * Deterministic simulation scripts.
 *
 * Each scenario walks the canonical control-plane story: the agent gathers
 * context with tools, requests a high-risk action, the policy engine halts
 * execution, and a human decides. The branch after the gate is what makes the
 * approval meaningful rather than decorative.
 *
 * Narrative text attributed to the agent is written as an execution or
 * decision summary the control plane recorded — never as a model's private
 * internal reasoning.
 */

const REFUND_SCENARIO: Scenario = {
  id: 'scn_refund_duplicate',
  agentId: 'agt_114a',
  title: 'Duplicate charge refund',
  steps: [
    {
      delayMs: 200,
      event: { type: 'run_started', label: 'Run started', tone: 'default' },
    },
    {
      delayMs: 620,
      event: {
        type: 'model_invocation',
        label: 'Model invoked',
        tokens: 1_240,
        costUsd: 0.0124,
        tone: 'secondary',
        text: 'Decision summary: request classified as a billing dispute. Resolving the customer record before any write action.',
      },
    },
    {
      delayMs: 520,
      event: {
        type: 'tool_call',
        label: 'Tool call',
        toolName: 'search_customer',
        tone: 'signal',
        payload: { query: 'ORD-9921' },
      },
    },
    {
      delayMs: 460,
      event: {
        type: 'tool_result',
        label: 'Tool result',
        toolName: 'search_customer',
        payload: {
          customer_id: 'cust_8219x',
          name: 'Alice Johnson',
          status: 'active',
        },
        text: 'customer found',
      },
    },
    {
      delayMs: 540,
      event: {
        type: 'tool_call',
        label: 'Tool call',
        toolName: 'get_transactions',
        tone: 'signal',
        payload: { customer_id: 'cust_8219x', order_id: 'ORD-9921' },
      },
    },
    {
      delayMs: 620,
      event: {
        type: 'tool_result',
        label: 'Tool result',
        toolName: 'get_transactions',
        payload: [
          { id: 'txn_01', amount: 49.99, status: 'settled' },
          {
            id: 'txn_02',
            amount: 49.99,
            status: 'settled',
            note: 'potential_duplicate',
          },
        ],
        text: 'duplicate payment detected',
      },
    },
    {
      delayMs: 480,
      event: {
        type: 'model_invocation',
        label: 'Model invoked',
        tokens: 880,
        costUsd: 0.0088,
        tone: 'secondary',
        text: 'Tool-selection summary: duplicate confirmed against txn_01. Requesting refund_payment for txn_02.',
      },
    },
    {
      delayMs: 420,
      event: {
        type: 'policy_intervention',
        label: 'Policy check',
        toolName: 'refund_payment',
        tone: 'danger',
        text: 'POL-042 matched. Execution halted pending human approval.',
        payload: {
          transaction_id: 'txn_02',
          amount: 49.99,
          currency: 'USD',
          reason: 'duplicate_charge',
        },
      },
      approval: {
        toolName: 'refund_payment',
        policyId: 'pol_042',
        policyName: 'Require Approval for Refunds > $100',
        rule: 'require_approval(tool == "refund_payment")',
        context:
          'The agent requested execution of refund_payment. This tool is classified high-risk and requires human-in-the-loop authorisation before it runs.',
        arguments: {
          transaction_id: 'txn_02',
          amount: 49.99,
          currency: 'USD',
          reason: 'duplicate_charge',
          bypass_fraud_check: false,
        },
      },
    },
  ],

  onApprove: [
    {
      delayMs: 300,
      event: {
        type: 'approval_decision',
        label: 'Human approved',
        tone: 'signal',
        text: 'Approved by s.miller@acme.com',
      },
    },
    {
      delayMs: 560,
      event: {
        type: 'tool_call',
        label: 'Tool executed',
        toolName: 'refund_payment',
        tone: 'signal',
        payload: { transaction_id: 'txn_02', amount: 49.99 },
      },
    },
    {
      delayMs: 480,
      event: {
        type: 'tool_result',
        label: 'Tool result',
        toolName: 'refund_payment',
        payload: { status: 'success', refund_id: 'rfnd_992' },
      },
    },
    {
      delayMs: 520,
      event: {
        type: 'agent_response',
        label: 'Response generated',
        tokens: 640,
        costUsd: 0.0064,
        tone: 'secondary',
      },
    },
    {
      delayMs: 260,
      event: { type: 'run_completed', label: 'Run complete', tone: 'signal' },
    },
  ],

  onReject: [
    {
      delayMs: 300,
      event: {
        type: 'approval_decision',
        label: 'Human rejected',
        tone: 'danger',
        text: 'Rejected by s.miller@acme.com',
      },
    },
    {
      delayMs: 420,
      event: {
        type: 'agent_response',
        label: 'Response generated',
        tokens: 310,
        costUsd: 0.0031,
        tone: 'secondary',
      },
    },
    {
      delayMs: 260,
      event: {
        type: 'run_failed',
        label: 'Run terminated',
        tone: 'danger',
        text: 'Execution denied by policy gate. No funds were moved.',
      },
    },
  ],

  finalOutput:
    'I have verified the duplicate charge on order #ORD-9921 and processed a refund of $49.99 (Refund ID: rfnd_992). The funds should appear in the customer’s account within 3-5 business days.',
  rejectedOutput:
    'I identified a duplicate charge of $49.99 on order #ORD-9921, but the refund was not authorised. I have escalated the case to the finance queue for manual review and taken no further action.',
}

const TRIAGE_SCENARIO: Scenario = {
  id: 'scn_security_triage',
  agentId: 'agt_4417',
  title: 'Suspicious login containment',
  steps: [
    {
      delayMs: 200,
      event: { type: 'run_started', label: 'Run started', tone: 'default' },
    },
    {
      delayMs: 600,
      event: {
        type: 'model_invocation',
        label: 'Model invoked',
        tokens: 1_480,
        costUsd: 0.0148,
        tone: 'secondary',
        text: 'Decision summary: alert classified as credential stuffing. Enriching the source indicator before containment.',
      },
    },
    {
      delayMs: 520,
      event: {
        type: 'tool_call',
        label: 'Tool call',
        toolName: 'search_alerts',
        tone: 'signal',
        payload: { window: 'last_1h', rule: 'auth.failed_login_burst' },
      },
    },
    {
      delayMs: 500,
      event: {
        type: 'tool_result',
        label: 'Tool result',
        toolName: 'search_alerts',
        payload: { matches: 47, distinct_accounts: 12, source_asn: 'AS20473' },
        text: '47 failed logins across 12 accounts',
      },
    },
    {
      delayMs: 540,
      event: {
        type: 'tool_call',
        label: 'Tool call',
        toolName: 'enrich_indicator',
        tone: 'signal',
        payload: { indicator: '198.51.100.42', type: 'ipv4' },
      },
    },
    {
      delayMs: 560,
      event: {
        type: 'tool_result',
        label: 'Tool result',
        toolName: 'enrich_indicator',
        payload: { reputation: 'malicious', confidence: 0.94 },
        text: 'indicator flagged malicious',
      },
    },
    {
      delayMs: 420,
      event: {
        type: 'policy_intervention',
        label: 'Policy check',
        toolName: 'quarantine_host',
        tone: 'danger',
        text: 'High-risk containment action requires approval.',
        payload: { host: 'srv-edge-11', scope: 'network_isolate' },
      },
      approval: {
        toolName: 'quarantine_host',
        policyId: 'pol_001',
        policyName: 'Block PII Disclosure',
        rule: 'require_approval(tool.risk == "high")',
        context:
          'The agent requested network isolation of srv-edge-11. Containment actions are disruptive and require an operator decision.',
        arguments: {
          host: 'srv-edge-11',
          scope: 'network_isolate',
          duration: '4h',
          notify: '#security-ops',
        },
      },
    },
  ],

  onApprove: [
    {
      delayMs: 300,
      event: {
        type: 'approval_decision',
        label: 'Human approved',
        tone: 'signal',
        text: 'Approved by s.miller@acme.com',
      },
    },
    {
      delayMs: 620,
      event: {
        type: 'tool_call',
        label: 'Tool executed',
        toolName: 'quarantine_host',
        tone: 'signal',
        payload: { host: 'srv-edge-11' },
      },
    },
    {
      delayMs: 480,
      event: {
        type: 'tool_result',
        label: 'Tool result',
        toolName: 'quarantine_host',
        payload: { status: 'isolated', incident_id: 'inc_2293' },
      },
    },
    {
      delayMs: 500,
      event: {
        type: 'agent_response',
        label: 'Response generated',
        tokens: 720,
        costUsd: 0.0072,
        tone: 'secondary',
      },
    },
    {
      delayMs: 260,
      event: { type: 'run_completed', label: 'Run complete', tone: 'signal' },
    },
  ],

  onReject: [
    {
      delayMs: 300,
      event: {
        type: 'approval_decision',
        label: 'Human rejected',
        tone: 'danger',
        text: 'Rejected by s.miller@acme.com',
      },
    },
    {
      delayMs: 420,
      event: {
        type: 'agent_response',
        label: 'Response generated',
        tokens: 280,
        costUsd: 0.0028,
        tone: 'secondary',
      },
    },
    {
      delayMs: 260,
      event: {
        type: 'run_failed',
        label: 'Run terminated',
        tone: 'danger',
        text: 'Containment denied by operator. Host remains online.',
      },
    },
  ],

  finalOutput:
    'srv-edge-11 has been isolated from the network for 4 hours and incident inc_2293 was opened. 12 affected accounts were flagged for credential reset. The source ASN has been added to the edge blocklist.',
  rejectedOutput:
    'Containment was not authorised, so srv-edge-11 remains online. I have documented the 47 failed logins and the malicious indicator in incident inc_2293 for manual review.',
}

export const SCENARIOS: readonly Scenario[] = [REFUND_SCENARIO, TRIAGE_SCENARIO]

/** Picks the scenario scripted for an agent, falling back to the refund flow. */
export function scenarioForAgent(agentId: string): Scenario {
  return (
    SCENARIOS.find((scenario) => scenario.agentId === agentId) ??
    REFUND_SCENARIO
  )
}
