import type { Run, RunStatus } from '@/domain'

import { MOCK_AGENTS } from './agents'
import { agoIso, DAY, DEMO_NOW_MS, MINUTE, SECOND } from './demo-context'
import { MODELS } from './models'
import { createRandom, hexId, pick, pickWeighted, randomInt } from '@/lib/random'

/**
 * The run corpus behind the Runs Explorer, the dashboard panel and every
 * trace link.
 *
 * The first entries reproduce the rows shown on the approved Runs Explorer
 * screen exactly — same ids, models, durations, token counts and costs — and
 * include the run the approved Trace Inspection screen drills into. The
 * remainder are generated from a fixed seed so the corpus is large enough to
 * exercise real filtering, sorting and pagination while staying byte-identical
 * on every load.
 */

const REQUEST_INPUTS: readonly string[] = [
  'A customer is requesting a refund for a duplicate charge on order #ORD-9921. Please investigate.',
  'Where is my order #ORD-4417? It was due yesterday.',
  'Customer reports being charged twice for invoice INV-2281.',
  'Escalated alert: repeated failed logins from an unrecognised ASN.',
  'New signup needs identity verification before plan assignment.',
  'Summarise the Q3 incident retrospectives into a one-page brief.',
  'Cancel subscription SUB-7781 and confirm the final invoice amount.',
  'The nightly batch job failed — analyse the logs and explain the failure.',
  'Customer asks whether the Pro plan includes SSO and audit logs.',
  'Investigate elevated 5xx rates on the checkout service.',
  'Apply account credit of $25 for the delayed shipment on #ORD-3092.',
  'Draft a response to the security questionnaire from a prospect.',
]

const OUTPUTS: readonly string[] = [
  'Resolved. Refund issued and confirmation sent to the customer.',
  'Order located and tracking details shared with the customer.',
  'Duplicate charge confirmed and reversed; ticket closed.',
  'Alert triaged as a false positive; no action required.',
  'Identity verified and the Growth plan was assigned.',
  'Brief generated with citations to the source retrospectives.',
]

/** Agents that runs can be attributed to, by fleet id. */
const AGENT_INDEX = new Map(MOCK_AGENTS.map((agent) => [agent.id, agent]))

function agentName(id: string): string {
  const agent = AGENT_INDEX.get(id)
  if (!agent) throw new Error(`Unknown agent referenced by a run: ${id}`)
  return agent.name
}

interface RunSeed {
  id: string
  agentId: string
  modelId: string
  modelLabel: string
  status: RunStatus
  durationMs: number
  inputTokens: number
  outputTokens: number
  costUsd: number
  startedAgoMs: number
  input: string
  output: string | null
  estimated?: boolean
}

/** Rows reproduced verbatim from the approved Runs Explorer render. */
const DESIGNED_RUNS: readonly RunSeed[] = [
  {
    id: 'rn_9a8f7b6c',
    agentId: 'agt_8921',
    modelId: MODELS.claudeSonnet5.id,
    modelLabel: MODELS.claudeSonnet5.label,
    status: 'running',
    durationMs: 12 * SECOND,
    inputTokens: 920,
    outputTokens: 320,
    costUsd: 0.0037,
    startedAgoMs: 4 * SECOND,
    input: 'Where is my order #ORD-4417? It was due yesterday.',
    output: null,
    estimated: true,
  },
  {
    id: 'rn_4e3d2c1b',
    agentId: 'agt_114a',
    modelId: MODELS.gpt56.id,
    modelLabel: MODELS.gpt56.label,
    status: 'success',
    durationMs: 4_200,
    inputTokens: 2_890,
    outputTokens: 1_002,
    costUsd: 0.0194,
    startedAgoMs: 2 * MINUTE,
    input: 'Customer reports being charged twice for invoice INV-2281.',
    output: 'Duplicate charge confirmed and reversed; ticket closed.',
  },
  {
    id: 'rn_8j7h6g5f',
    agentId: 'agt_4417',
    modelId: MODELS.claudeOpus5.id,
    modelLabel: MODELS.claudeOpus5.label,
    status: 'awaiting_approval',
    durationMs: 45_100,
    inputTokens: 11_400,
    outputTokens: 2_805,
    costUsd: 0.0426,
    startedAgoMs: 5 * MINUTE,
    input:
      'Escalated alert: repeated failed logins from an unrecognised ASN. Contain if confirmed.',
    output: null,
  },
  {
    id: 'rn_1q2w3e4r',
    agentId: 'agt_2261',
    modelId: MODELS.gemini3Pro.id,
    modelLabel: MODELS.gemini3Pro.label,
    status: 'failed',
    durationMs: 8_700,
    inputTokens: 1_640,
    outputTokens: 464,
    costUsd: 0.0073,
    startedAgoMs: 12 * MINUTE,
    input: 'New signup needs identity verification before plan assignment.',
    output: null,
  },
  {
    id: 'rn_5t6y7u8i',
    agentId: 'agt_7734',
    modelId: MODELS.gpt56.id,
    modelLabel: MODELS.gpt56.label,
    status: 'success',
    durationMs: 135_300,
    inputTokens: 34_180,
    outputTokens: 9_240,
    costUsd: 0.3095,
    startedAgoMs: 18 * MINUTE,
    input: 'Summarise the Q3 incident retrospectives into a one-page brief.',
    output: 'Brief generated with citations to the source retrospectives.',
  },
  {
    id: 'rn_0p9o8i7u',
    agentId: 'agt_8921',
    modelId: MODELS.claudeSonnet5.id,
    modelLabel: MODELS.claudeSonnet5.label,
    status: 'success',
    durationMs: 14_900,
    inputTokens: 3_240,
    outputTokens: 1_180,
    costUsd: 0.0274,
    startedAgoMs: 26 * MINUTE,
    input: 'Customer asks whether the Pro plan includes SSO and audit logs.',
    output: 'Answered from the knowledge base; follow-up docs link sent.',
  },
  /**
   * The run the approved Trace Inspection screen opens. Its metadata matches
   * that screen's summary bar: 4.2s, 3,245 tokens, $0.048, Billing agent.
   */
  {
    id: 'rn_8b9f4e2d_c1',
    agentId: 'agt_114a',
    modelId: MODELS.gpt56.id,
    modelLabel: MODELS.gpt56.label,
    status: 'success',
    durationMs: 4_200,
    inputTokens: 2_405,
    outputTokens: 840,
    costUsd: 0.048,
    startedAgoMs: 4_200,
    input:
      'A customer is requesting a refund for a duplicate charge on order #ORD-9921. Please investigate.',
    output:
      'I have verified the duplicate charge on order #ORD-9921 and successfully processed a refund of $49.99 (Refund ID: rfnd_992). The funds should appear in the customer’s account within 3-5 business days.',
  },
]

const STATUS_WEIGHTS: readonly (readonly [RunStatus, number])[] = [
  ['success', 0.9],
  ['failed', 0.045],
  ['awaiting_approval', 0.028],
  ['running', 0.015],
  ['cancelled', 0.012],
]

const GENERATED_COUNT = 1_241
const RUN_SEED = 0x7e4c

function buildRun(seed: RunSeed): Run {
  const startedMs = DEMO_NOW_MS - seed.startedAgoMs
  const isTerminal =
    seed.status !== 'running' && seed.status !== 'awaiting_approval'

  const agent = AGENT_INDEX.get(seed.agentId)
  if (!agent) throw new Error(`Unknown agent: ${seed.agentId}`)

  return {
    id: seed.id,
    agentId: seed.agentId,
    agentName: agentName(seed.agentId),
    modelId: seed.modelId,
    modelLabel: seed.modelLabel,
    status: seed.status,
    environment: agent.environment,
    startedAt: new Date(startedMs).toISOString(),
    completedAt: isTerminal
      ? new Date(startedMs + seed.durationMs).toISOString()
      : null,
    durationMs: seed.durationMs,
    tokens: {
      input: seed.inputTokens,
      output: seed.outputTokens,
      total: seed.inputTokens + seed.outputTokens,
    },
    costUsd: seed.costUsd,
    input: seed.input,
    output: seed.output,
    estimated: seed.estimated ?? false,
  }
}

function generateRuns(): Run[] {
  const next = createRandom(RUN_SEED)
  const runs: Run[] = []

  for (let i = 0; i < GENERATED_COUNT; i += 1) {
    const agent = pick(next, MOCK_AGENTS)
    // Every run uses the model its agent is actually deployed on — a run
    // never randomly attributes a different model to the same agent, so the
    // Runs Explorer stays coherent with what the Agent Fleet screen shows.
    const model = agent.model
    const status = pickWeighted(next, STATUS_WEIGHTS)

    // Weight timestamps towards the recent past so "Last 24h" is well populated.
    const skew = next() ** 2.4
    const startedAgoMs = 30 * MINUTE + skew * 30 * DAY

    const durationMs =
      status === 'failed'
        ? randomInt(next, 800, 14_000)
        : randomInt(next, 900, agent.metrics.p50LatencyMs * 6)

    const inputTokens = randomInt(next, 420, 18_000)
    const outputTokens = randomInt(next, 90, Math.max(120, inputTokens / 3))
    const costUsd =
      (inputTokens / 1000) * model.inputCostPer1k +
      (outputTokens / 1000) * model.outputCostPer1k

    const isTerminal = status !== 'running' && status !== 'awaiting_approval'

    runs.push(
      buildRun({
        id: `rn_${hexId(next, 8)}`,
        agentId: agent.id,
        modelId: model.id,
        modelLabel: model.label,
        status,
        durationMs,
        inputTokens,
        outputTokens,
        costUsd: Number(costUsd.toFixed(4)),
        startedAgoMs,
        input: pick(next, REQUEST_INPUTS),
        output: isTerminal && status === 'success' ? pick(next, OUTPUTS) : null,
        estimated: status === 'running',
      }),
    )
  }

  return runs
}

/** Newest first — the explorer's default ordering. */
export const MOCK_RUNS: readonly Run[] = [
  ...DESIGNED_RUNS.map(buildRun),
  ...generateRuns(),
].sort(
  (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
)

export const RUN_BY_ID: ReadonlyMap<string, Run> = new Map(
  MOCK_RUNS.map((run) => [run.id, run]),
)

/** The run rendered by the approved Trace Inspection screen. */
export const FEATURED_TRACE_RUN_ID = 'rn_8b9f4e2d_c1'

export { agoIso }
