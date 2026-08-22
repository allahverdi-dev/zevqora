import type {
  CriterionScore,
  EvaluationHealth,
  EvaluationResult,
  EvaluationStatus,
  EvaluationSuite,
  ModelComparisonSeries,
} from '@/domain'

import { DEMO_NOW_MS, HOUR } from './demo-context'
import { MODELS } from './models'
import { createRandom, pick, pickWeighted, randomInt } from '@/lib/random'

/**
 * Evaluation suites, results and health, matching the approved Evaluations
 * screen: 94.2% pass rate (+1.2%), 240ms P95, v2.4.1, and the four criteria
 * bars including the inverted hallucination score.
 */

export const MOCK_SUITES: readonly EvaluationSuite[] = [
  {
    id: 'suite_core_ecommerce',
    name: 'Core E-commerce',
    description:
      'Order lookup, refunds, returns and delivery exceptions across the storefront surface.',
    caseCount: 412,
    criteria: [
      'accuracy',
      'safety',
      'hallucination',
      'tone_compliance',
      'tool_correctness',
    ],
  },
  {
    id: 'suite_customer_support',
    name: 'Customer Support',
    description:
      'Multi-turn support conversations with escalation and policy-sensitive actions.',
    caseCount: 308,
    criteria: [
      'accuracy',
      'response_quality',
      'policy_compliance',
      'tone_compliance',
      'latency',
    ],
  },
  {
    id: 'suite_internal_kb',
    name: 'Internal KB',
    description:
      'Retrieval-grounded answers over internal runbooks and engineering documentation.',
    caseCount: 264,
    criteria: ['accuracy', 'hallucination', 'response_quality', 'cost'],
  },
]

export const MOCK_EVALUATION_HEALTH: EvaluationHealth = {
  version: 'v2.4.1',
  passRate: 94.2,
  passRateDelta: 1.2,
  p95LatencyMs: 240,
  trend: [
    91.4, 92.1, 91.6, 93.2, 92.4, 93.8, 92.9, 94.0, 93.1, 94.6, 93.9, 94.2,
  ],
}

/** The criteria bars on the approved screen, in the order shown. */
export const MOCK_CRITERIA_SCORES: readonly CriterionScore[] = [
  { criterion: 'accuracy', score: 98.5, threshold: 95 },
  { criterion: 'safety', score: 99.9, threshold: 99 },
  { criterion: 'hallucination', score: 82.1, threshold: 90 },
  { criterion: 'tone_compliance', score: 91.0, threshold: 85 },
]

export const MOCK_MODEL_COMPARISON: readonly ModelComparisonSeries[] = [
  {
    label: 'v2.4',
    modelId: MODELS.claudeOpus5.id,
    emphasis: true,
    points: [62, 64, 68, 71, 76, 82, 87, 90, 92, 93, 94, 94.2],
  },
  {
    label: 'v2.3',
    modelId: MODELS.gpt56.id,
    emphasis: false,
    points: [60, 61, 63, 64, 66, 68, 70, 72, 73, 74, 74.5, 75],
  },
]

const EVAL_TARGET_MODELS: readonly string[] = [
  MODELS.llama4Maverick.id,
  MODELS.customFinetuneV2.id,
  MODELS.claudeOpus5.id,
  MODELS.gpt56.id,
]

/** The rows shown verbatim at the top of the approved results table. */
const DESIGNED_RESULTS: readonly {
  displayId: string
  targetModelId: string
  status: EvaluationStatus
  score: number
  hoursAgo: number
  suiteId: string
}[] = [
  { displayId: 'EVL-1527', targetModelId: 'llama-4-maverick', status: 'failed', score: 58.6, hoursAgo: 8.7, suiteId: 'suite_core_ecommerce' },
  { displayId: 'EVL-8186', targetModelId: 'custom-finetune-v2', status: 'failed', score: 67.7, hoursAgo: 9.6, suiteId: 'suite_core_ecommerce' },
  { displayId: 'EVL-4082', targetModelId: 'claude-opus-5', status: 'passed', score: 90.6, hoursAgo: 16.1, suiteId: 'suite_core_ecommerce' },
  { displayId: 'EVL-7497', targetModelId: 'custom-finetune-v2', status: 'passed', score: 96.3, hoursAgo: 12.4, suiteId: 'suite_core_ecommerce' },
  { displayId: 'EVL-4176', targetModelId: 'custom-finetune-v2', status: 'failed', score: 67.1, hoursAgo: 23.4, suiteId: 'suite_customer_support' },
  { displayId: 'EVL-8445', targetModelId: 'custom-finetune-v2', status: 'failed', score: 65.5, hoursAgo: 23.0, suiteId: 'suite_customer_support' },
  { displayId: 'EVL-9733', targetModelId: 'llama-4-maverick', status: 'passed', score: 90.1, hoursAgo: 9.7, suiteId: 'suite_core_ecommerce' },
  { displayId: 'EVL-7157', targetModelId: 'claude-opus-5', status: 'passed', score: 92.7, hoursAgo: 18.4, suiteId: 'suite_internal_kb' },
  { displayId: 'EVL-7335', targetModelId: 'claude-opus-5', status: 'passed', score: 90.8, hoursAgo: 30.9, suiteId: 'suite_internal_kb' },
  { displayId: 'EVL-1115', targetModelId: 'gpt-5.6', status: 'passed', score: 95.6, hoursAgo: 37.4, suiteId: 'suite_core_ecommerce' },
  { displayId: 'EVL-8571', targetModelId: 'llama-4-maverick', status: 'passed', score: 96.2, hoursAgo: 9.1, suiteId: 'suite_customer_support' },
  { displayId: 'EVL-6680', targetModelId: 'gpt-5.6', status: 'passed', score: 88.4, hoursAgo: 16.5, suiteId: 'suite_internal_kb' },
]

const CRITERIA_BY_SUITE = new Map(
  MOCK_SUITES.map((suite) => [suite.id, suite.criteria]),
)

/** Derives per-criterion scores that average out to the aggregate score. */
function criteriaFor(
  suiteId: string,
  score: number,
  seed: number,
): CriterionScore[] {
  const criteria = CRITERIA_BY_SUITE.get(suiteId) ?? ['accuracy']
  const next = createRandom(seed)

  return criteria.map((criterion) => ({
    criterion,
    score: Number(
      Math.min(99.9, Math.max(35, score + (next() - 0.5) * 14)).toFixed(1),
    ),
    threshold: criterion === 'safety' ? 99 : criterion === 'hallucination' ? 90 : 85,
  }))
}

function buildDesignedResults(): EvaluationResult[] {
  return DESIGNED_RESULTS.map((row, index) => ({
    id: `eval_${row.displayId.toLowerCase().replace('-', '_')}`,
    suiteId: row.suiteId,
    displayId: row.displayId,
    targetModelId: row.targetModelId,
    status: row.status,
    score: row.score,
    ranAt: new Date(DEMO_NOW_MS - row.hoursAgo * HOUR).toISOString(),
    criteriaScores: criteriaFor(row.suiteId, row.score, 3100 + index),
  }))
}

/** Additional history so "Load more" and suite filtering have depth. */
function generateResults(count: number): EvaluationResult[] {
  const next = createRandom(0x51ee)
  const results: EvaluationResult[] = []

  for (let i = 0; i < count; i += 1) {
    const suite = pick(next, MOCK_SUITES)
    const status = pickWeighted<EvaluationStatus>(next, [
      ['passed', 0.74],
      ['failed', 0.26],
    ])
    const score =
      status === 'passed'
        ? Number((85 + next() * 14).toFixed(1))
        : Number((52 + next() * 26).toFixed(1))

    results.push({
      id: `eval_gen_${i}`,
      suiteId: suite.id,
      displayId: `EVL-${randomInt(next, 1000, 9999)}`,
      targetModelId: pick(next, EVAL_TARGET_MODELS),
      status,
      score,
      ranAt: new Date(
        DEMO_NOW_MS - (40 + next() ** 1.7 * 720) * HOUR,
      ).toISOString(),
      criteriaScores: criteriaFor(suite.id, score, 7000 + i),
    })
  }

  return results
}

export const MOCK_EVALUATION_RESULTS: readonly EvaluationResult[] = [
  ...buildDesignedResults(),
  ...generateResults(76),
]

/** Total shown in the results header on the approved screen. */
export const MOCK_EVALUATION_TOTAL = 1_428
