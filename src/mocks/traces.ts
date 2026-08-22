import type { Trace, TraceEvent } from '@/domain'

import { MOCK_RUNS } from './runs'

/**
 * Execution traces.
 *
 * The featured trace reproduces the approved Trace Inspection screen exactly:
 * the same ten events, timestamps, tool payloads, policy intervention and
 * human approval. Every other run gets a structurally valid trace generated
 * from its own metadata, so any row in the explorer opens something real.
 *
 * A note on `summary` fields: these are execution records the control plane
 * writes about a step — what was requested, which tool was selected, what the
 * application did next. They are not a model's private internal reasoning, and
 * ZEVQORA does not claim to expose that.
 */

const TRACE_DAY = '2026-08-21'

function at(time: string): string {
  return `${TRACE_DAY}T${time}Z`
}

const FEATURED_RUN_ID = 'rn_8b9f4e2d_c1'

const FEATURED_EVENTS: readonly TraceEvent[] = [
  {
    id: 'evt_01',
    runId: FEATURED_RUN_ID,
    type: 'run_started',
    label: 'Run Started',
    timestamp: at('14:32:01.000'),
    offsetMs: 0,
    durationMs: 0,
    status: 'ok',
    summary:
      'Run accepted from the support queue and dispatched to the Billing Resolver agent.',
    input:
      'A customer is requesting a refund for a duplicate charge on order #ORD-9921. Please investigate.',
  },
  {
    id: 'evt_02',
    runId: FEATURED_RUN_ID,
    type: 'model_invocation',
    label: 'Model Invocation',
    timestamp: at('14:32:01.045'),
    offsetMs: 45,
    durationMs: 845,
    status: 'ok',
    modelId: 'gpt-5.6',
    tokens: 1_240,
    costUsd: 0.0186,
    input:
      '"A customer is requesting a refund for a duplicate charge on order #ORD-9921. Please investigate."',
    summary:
      'Tool-selection summary: request classified as a billing dispute. The agent selected search_customer to resolve the order reference before acting.',
    output:
      'Selected tool `search_customer` with query "ORD-9921" to resolve the customer record.',
  },
  {
    id: 'evt_03',
    runId: FEATURED_RUN_ID,
    type: 'tool_call',
    label: 'Tool Call',
    timestamp: at('14:32:01.890'),
    offsetMs: 890,
    durationMs: 120,
    status: 'ok',
    toolCall: {
      name: 'search_customer',
      arguments: { query: 'ORD-9921' },
      durationMs: 120,
    },
  },
  {
    id: 'evt_04',
    runId: FEATURED_RUN_ID,
    type: 'tool_result',
    label: 'Tool Result',
    timestamp: at('14:32:02.010'),
    offsetMs: 2_010,
    durationMs: null,
    status: 'ok',
    toolResult: {
      name: 'search_customer',
      payload: {
        customer_id: 'cust_8219x',
        name: 'Alice Johnson',
        status: 'active',
        recent_orders: ['ORD-9921', 'ORD-8812'],
      },
    },
  },
  {
    id: 'evt_05',
    runId: FEATURED_RUN_ID,
    type: 'tool_call',
    label: 'Tool Call',
    timestamp: at('14:32:02.450'),
    offsetMs: 2_450,
    durationMs: 245,
    status: 'ok',
    toolCall: {
      name: 'get_transactions',
      arguments: { customer_id: 'cust_8219x', order_id: 'ORD-9921' },
      durationMs: 245,
    },
  },
  {
    id: 'evt_06',
    runId: FEATURED_RUN_ID,
    type: 'tool_result',
    label: 'Tool Result',
    timestamp: at('14:32:02.695'),
    offsetMs: 2_695,
    durationMs: null,
    status: 'warning',
    toolResult: {
      name: 'get_transactions',
      annotation: 'DATA MATCH',
      payload: [
        { id: 'txn_01', amount: 49.99, status: 'settled' },
        {
          id: 'txn_02',
          amount: 49.99,
          status: 'settled',
          note: 'potential_duplicate',
        },
      ],
    },
  },
  {
    id: 'evt_07',
    runId: FEATURED_RUN_ID,
    type: 'policy_intervention',
    label: 'High-Risk Action',
    timestamp: at('14:32:03.102'),
    offsetMs: 3_102,
    durationMs: 1_448,
    status: 'error',
    policy: {
      policyId: 'pol_042',
      policyName: 'Require Approval for Refunds > $100',
      riskLevel: 'high',
      toolName: 'refund_payment',
      context:
        'Execution halted. Tool refund_payment exceeds automated threshold ($0.00 without human-in-the-loop for non-subscription charges). Escalated to admin queue.',
      toolInputs: {
        transaction_id: 'txn_02',
        amount: 49.99,
        currency: 'USD',
        reason: 'duplicate_charge',
        bypass_fraud_check: false,
      },
    },
  },
  {
    id: 'evt_08',
    runId: FEATURED_RUN_ID,
    type: 'human_approval',
    label: 'Human Approved',
    timestamp: at('14:32:04.550'),
    offsetMs: 4_550,
    durationMs: null,
    status: 'ok',
    approval: {
      approvedBy: 's.miller@acme.com',
      decision: 'approved',
      waitMs: 1_400,
      override: true,
      note: 'Duplicate confirmed against txn_01. Approved for refund to source.',
    },
  },
  {
    id: 'evt_09',
    runId: FEATURED_RUN_ID,
    type: 'tool_result',
    label: 'Tool Result',
    timestamp: at('14:32:04.900'),
    offsetMs: 4_900,
    durationMs: null,
    status: 'ok',
    toolResult: {
      name: 'refund_payment',
      payload: { status: 'success', refund_id: 'rfnd_992' },
    },
  },
  {
    id: 'evt_10',
    runId: FEATURED_RUN_ID,
    type: 'agent_response',
    label: 'Agent Response generated',
    timestamp: at('14:32:05.150'),
    offsetMs: 5_150,
    durationMs: null,
    status: 'ok',
    output:
      '"I have verified the duplicate charge on order #ORD-9921 and successfully processed a refund of $49.99 (Refund ID: rfnd_992). The funds should appear in the customer\'s account within 3-5 business days."',
  },
  {
    id: 'evt_11',
    runId: FEATURED_RUN_ID,
    type: 'run_completed',
    label: 'Run Completed',
    timestamp: at('14:32:05.200'),
    offsetMs: 5_200,
    durationMs: null,
    status: 'ok',
    summary: 'Run completed successfully. 3,245 tokens billed, $0.048 total.',
  },
]

/**
 * Builds a plausible trace for any run that is not the featured one, derived
 * from that run's own status, model and duration so the numbers agree with the
 * row the user clicked.
 */
function deriveTrace(runId: string): Trace | null {
  const run = MOCK_RUNS.find((candidate) => candidate.id === runId)
  if (!run) return null

  const start = new Date(run.startedAt).getTime()
  const iso = (offset: number) => new Date(start + offset).toISOString()
  const span = Math.max(run.durationMs, 600)

  const events: TraceEvent[] = [
    {
      id: `${runId}_e1`,
      runId,
      type: 'run_started',
      label: 'Run Started',
      timestamp: iso(0),
      offsetMs: 0,
      durationMs: 0,
      status: 'ok',
      input: run.input,
      summary: `Run dispatched to ${run.agentName} in ${run.environment}.`,
    },
    {
      id: `${runId}_e2`,
      runId,
      type: 'model_invocation',
      label: 'Model Invocation',
      timestamp: iso(Math.round(span * 0.06)),
      offsetMs: Math.round(span * 0.06),
      durationMs: Math.round(span * 0.28),
      status: 'ok',
      modelId: run.modelId,
      tokens: run.tokens.input,
      costUsd: Number((run.costUsd * 0.6).toFixed(4)),
      input: run.input,
      summary:
        'Execution summary: the request was classified and a tool was selected to gather the required context.',
    },
    {
      id: `${runId}_e3`,
      runId,
      type: 'tool_call',
      label: 'Tool Call',
      timestamp: iso(Math.round(span * 0.4)),
      offsetMs: Math.round(span * 0.4),
      durationMs: Math.round(span * 0.12),
      status: 'ok',
      toolCall: {
        name: 'search_customer',
        arguments: { query: run.input.slice(0, 48) },
        durationMs: Math.round(span * 0.12),
      },
    },
    {
      id: `${runId}_e4`,
      runId,
      type: 'tool_result',
      label: 'Tool Result',
      timestamp: iso(Math.round(span * 0.55)),
      offsetMs: Math.round(span * 0.55),
      durationMs: null,
      status: 'ok',
      toolResult: {
        name: 'search_customer',
        payload: { matched: true, records: 1 },
      },
    },
  ]

  if (run.status === 'awaiting_approval') {
    events.push({
      id: `${runId}_e5`,
      runId,
      type: 'policy_intervention',
      label: 'High-Risk Action',
      timestamp: iso(Math.round(span * 0.8)),
      offsetMs: Math.round(span * 0.8),
      durationMs: null,
      status: 'error',
      policy: {
        policyId: 'pol_001',
        policyName: 'Block PII Disclosure',
        riskLevel: 'high',
        toolName: 'quarantine_host',
        context:
          'Execution halted pending human approval. The requested tool is classified high-risk for this environment.',
        toolInputs: { confirm: true, scope: 'single_host' },
      },
    })
  } else if (run.status === 'failed') {
    events.push({
      id: `${runId}_e5`,
      runId,
      type: 'run_failed',
      label: 'Run Failed',
      timestamp: iso(span),
      offsetMs: span,
      durationMs: null,
      status: 'error',
      summary:
        'Run terminated after an upstream tool returned an unrecoverable error.',
    })
  } else if (run.status === 'running') {
    events.push({
      id: `${runId}_e5`,
      runId,
      type: 'model_invocation',
      label: 'Model Invocation',
      timestamp: iso(Math.round(span * 0.7)),
      offsetMs: Math.round(span * 0.7),
      durationMs: null,
      status: 'pending',
      modelId: run.modelId,
      summary: 'In flight — the agent is composing its response.',
    })
  } else {
    events.push(
      {
        id: `${runId}_e5`,
        runId,
        type: 'agent_response',
        label: 'Agent Response generated',
        timestamp: iso(Math.round(span * 0.92)),
        offsetMs: Math.round(span * 0.92),
        durationMs: null,
        status: 'ok',
        output: run.output ?? 'Response delivered to the requesting channel.',
      },
      {
        id: `${runId}_e6`,
        runId,
        type:
          run.status === 'cancelled' ? 'run_failed' : 'run_completed',
        label: run.status === 'cancelled' ? 'Run Cancelled' : 'Run Completed',
        timestamp: iso(span),
        offsetMs: span,
        durationMs: null,
        status: run.status === 'cancelled' ? 'warning' : 'ok',
        summary:
          run.status === 'cancelled'
            ? 'Run cancelled by an operator before completion.'
            : `Run completed successfully. ${run.tokens.total.toLocaleString('en-US')} tokens billed.`,
      },
    )
  }

  return { runId, events }
}

export function getMockTrace(runId: string): Trace | null {
  if (runId === FEATURED_RUN_ID) {
    return { runId: FEATURED_RUN_ID, events: FEATURED_EVENTS }
  }
  return deriveTrace(runId)
}

export { FEATURED_EVENTS, FEATURED_RUN_ID }
