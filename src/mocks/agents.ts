import type { Agent, AgentTool } from '@/domain'

import { agoIso, DAY, HOUR } from './demo-context'
import { MODELS } from './models'
import { createRandom } from '@/lib/random'

/**
 * The Acme Cloud agent fleet.
 *
 * The first three entries are the agents shown on the approved Agent Fleet
 * screen, reproduced exactly (name, display id, status, model, tool count).
 * The remaining three back the agent names the Runs Explorer and Policies
 * screens reference, so a run's agent always resolves to a real fleet member
 * instead of a dangling label.
 */

function tools(names: readonly [string, string, boolean][]): AgentTool[] {
  return names.map(([name, description, highRisk]) => ({
    name,
    description,
    highRisk,
  }))
}

/** Deterministic utilisation samples for the fleet bar chart. */
function utilization(seed: number, count = 40): number[] {
  const next = createRandom(seed)
  return Array.from({ length: count }, (_, index) => {
    // A gentle diurnal swell keeps the chart from reading as pure noise.
    const wave = 0.5 + 0.28 * Math.sin((index / count) * Math.PI * 2 - 0.6)
    const jitter = (next() - 0.5) * 0.42
    return Math.min(1, Math.max(0.05, wave + jitter))
  })
}

const SUPPORT_TOOLS = tools([
  ['search_customer', 'Look up a customer record by id, email or order.', false],
  ['get_order', 'Fetch order details and line items.', false],
  ['get_transactions', 'List settled and pending transactions.', false],
  ['create_ticket', 'Open a support ticket in the helpdesk.', false],
  ['update_ticket', 'Append notes or change ticket state.', false],
  ['send_email', 'Send a templated customer email.', true],
  ['issue_credit', 'Apply account credit to a customer balance.', true],
  ['refund_payment', 'Refund a settled payment to source.', true],
  ['escalate', 'Route the conversation to a human queue.', false],
  ['search_knowledge_base', 'Semantic search over the support KB.', false],
  ['summarize_thread', 'Summarise a conversation thread.', false],
  ['tag_conversation', 'Apply routing and analytics tags.', false],
])

const BILLING_TOOLS = tools([
  ['search_customer', 'Look up a customer billing profile.', false],
  ['get_transactions', 'List settled and pending transactions.', false],
  ['refund_payment', 'Refund a settled payment to source.', true],
  ['adjust_invoice', 'Amend an issued invoice.', true],
  ['get_subscription', 'Read subscription state and plan.', false],
])

const QA_TOOLS: readonly AgentTool[] = [
  ...tools([
    ['run_test_suite', 'Execute a regression suite against a build.', false],
    ['read_logs', 'Read CI and application logs.', false],
    ['file_bug', 'File a defect report.', false],
    ['deploy_preview', 'Deploy a preview environment.', true],
    ['rollback_release', 'Roll a release back to the prior build.', true],
  ]),
  // Synthetic monitoring probes make up the bulk of this agent's 24 tools.
  ...Array.from({ length: 19 }, (_, i): AgentTool => ({
    name: `probe_${String(i + 1).padStart(2, '0')}`,
    description: 'Synthetic monitoring probe.',
    highRisk: false,
  })),
]

const TRIAGE_TOOLS = tools([
  ['search_alerts', 'Query the alert store.', false],
  ['enrich_indicator', 'Enrich an IOC against threat intel.', false],
  ['quarantine_host', 'Isolate a host from the network.', true],
  ['revoke_session', 'Revoke an active user session.', true],
  ['page_oncall', 'Page the on-call responder.', false],
  ['read_audit_log', 'Read the workspace audit log.', false],
  ['create_incident', 'Open an incident record.', false],
])

const ONBOARDING_TOOLS = tools([
  ['create_account', 'Provision a new customer account.', true],
  ['send_welcome_email', 'Send the onboarding email sequence.', false],
  ['verify_identity', 'Run identity verification checks.', false],
  ['assign_plan', 'Attach a billing plan to an account.', true],
])

const RESEARCH_TOOLS = tools([
  ['web_search', 'Search the public web.', false],
  ['fetch_url', 'Retrieve and parse a web document.', false],
  ['search_knowledge_base', 'Semantic search over internal documents.', false],
  ['summarize_document', 'Summarise a long document.', false],
  ['export_report', 'Write a research report to storage.', false],
  ['cite_sources', 'Attach source citations to a claim.', false],
])

export const MOCK_AGENTS: readonly Agent[] = [
  {
    id: 'agt_8921',
    displayId: 'AGT-8921',
    name: 'SupportBot Alpha',
    description:
      'Front-line customer support agent handling order, delivery and account questions across chat and email.',
    status: 'active',
    environment: 'production',
    model: MODELS.claudeSonnet5,
    tools: SUPPORT_TOOLS,
    attachedPolicyIds: ['pol_001', 'pol_018'],
    createdAt: agoIso(180 * DAY),
    updatedAt: agoIso(2 * HOUR),
    metrics: {
      runs24h: 11_482,
      successRate: 98.6,
      p50LatencyMs: 1_240,
      cost24hUsd: 164.28,
      utilization: utilization(8921),
    },
  },
  {
    id: 'agt_114a',
    displayId: 'AGT-114A',
    name: 'Billing Resolver',
    description:
      'Resolves billing disputes, duplicate charges and refund requests under finance guardrails.',
    status: 'idle',
    environment: 'production',
    model: MODELS.gpt56,
    tools: BILLING_TOOLS,
    attachedPolicyIds: ['pol_001', 'pol_042'],
    createdAt: agoIso(152 * DAY),
    updatedAt: agoIso(6 * HOUR),
    metrics: {
      runs24h: 4_918,
      successRate: 97.1,
      p50LatencyMs: 2_050,
      cost24hUsd: 92.44,
      utilization: utilization(1140),
    },
  },
  {
    id: 'agt_900x',
    displayId: 'AGT-900X',
    name: 'QA Automator',
    description:
      'Runs regression suites against release candidates and files defects automatically.',
    status: 'offline',
    environment: 'staging',
    model: MODELS.llama4Maverick,
    tools: QA_TOOLS,
    attachedPolicyIds: ['pol_018'],
    createdAt: agoIso(96 * DAY),
    updatedAt: agoIso(38 * 60 * 1000),
    metrics: {
      runs24h: 1_204,
      successRate: 71.4,
      p50LatencyMs: 4_820,
      cost24hUsd: 12.06,
      utilization: utilization(9000),
    },
  },
  {
    id: 'agt_4417',
    displayId: 'AGT-4417',
    name: 'Security Triage Agent',
    description:
      'Triages security alerts, enriches indicators and escalates confirmed incidents to on-call.',
    status: 'degraded',
    environment: 'production',
    model: MODELS.claudeOpus5,
    tools: TRIAGE_TOOLS,
    attachedPolicyIds: ['pol_001', 'pol_018'],
    createdAt: agoIso(74 * DAY),
    updatedAt: agoIso(5 * 60 * 1000),
    metrics: {
      runs24h: 2_641,
      successRate: 94.2,
      p50LatencyMs: 3_310,
      cost24hUsd: 58.91,
      utilization: utilization(4417),
    },
  },
  {
    id: 'agt_2261',
    displayId: 'AGT-2261',
    name: 'Onboarding Agent',
    description:
      'Guides new customers through account provisioning, verification and plan selection.',
    status: 'active',
    environment: 'production',
    model: MODELS.gemini3Pro,
    tools: ONBOARDING_TOOLS,
    attachedPolicyIds: ['pol_001'],
    createdAt: agoIso(61 * DAY),
    updatedAt: agoIso(11 * HOUR),
    metrics: {
      runs24h: 2_205,
      successRate: 96.8,
      p50LatencyMs: 1_640,
      cost24hUsd: 31.72,
      utilization: utilization(2261),
    },
  },
  {
    id: 'agt_7734',
    displayId: 'AGT-7734',
    name: 'Research Agent',
    description:
      'Performs long-running research tasks over internal documents and the public web.',
    status: 'active',
    environment: 'production',
    model: MODELS.gpt56,
    tools: RESEARCH_TOOLS,
    attachedPolicyIds: ['pol_018'],
    createdAt: agoIso(45 * DAY),
    updatedAt: agoIso(3 * HOUR),
    metrics: {
      runs24h: 2_441,
      successRate: 95.3,
      p50LatencyMs: 8_900,
      cost24hUsd: 27.01,
      utilization: utilization(7734),
    },
  },
]

/** Agents shown on the fleet screen, in the approved order. */
export const AGENT_BY_ID: ReadonlyMap<string, Agent> = new Map(
  MOCK_AGENTS.map((agent) => [agent.id, agent]),
)
