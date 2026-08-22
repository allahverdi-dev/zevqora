import type {
  EvaluationId,
  EvaluationSuiteId,
  IsoTimestamp,
} from './common'

export type EvaluationStatus = 'passed' | 'failed' | 'running' | 'queued'

export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  passed: 'Passed',
  failed: 'Failed',
  running: 'Running',
  queued: 'Queued',
}

/**
 * Scoring dimensions the suites grade against.
 *
 * `hallucination` is inverted — a higher score means *less* hallucination —
 * which is why it renders with an `(Inv)` marker in the criteria panel.
 */
export type EvaluationCriterion =
  | 'accuracy'
  | 'tool_correctness'
  | 'policy_compliance'
  | 'response_quality'
  | 'safety'
  | 'hallucination'
  | 'tone_compliance'
  | 'latency'
  | 'cost'

export const EVALUATION_CRITERION_LABELS: Record<EvaluationCriterion, string> = {
  accuracy: 'Accuracy',
  tool_correctness: 'Tool Correctness',
  policy_compliance: 'Policy Compliance',
  response_quality: 'Response Quality',
  safety: 'Safety',
  hallucination: 'Hallucination (Inv)',
  tone_compliance: 'Tone Compliance',
  latency: 'Latency',
  cost: 'Cost',
}

export interface CriterionScore {
  readonly criterion: EvaluationCriterion
  /** Percentage, 0–100. */
  readonly score: number
  /** Threshold below which the criterion is treated as regressed. */
  readonly threshold: number
}

/** A dataset of graded cases that evaluations run against. */
export interface EvaluationSuite {
  readonly id: EvaluationSuiteId
  readonly name: string
  readonly description: string
  readonly caseCount: number
  readonly criteria: readonly EvaluationCriterion[]
}

export interface EvaluationResult {
  readonly id: EvaluationId
  readonly suiteId: EvaluationSuiteId
  readonly displayId: string
  readonly targetModelId: string
  readonly status: EvaluationStatus
  /** Aggregate score, 0–100. */
  readonly score: number
  readonly ranAt: IsoTimestamp
  readonly criteriaScores: readonly CriterionScore[]
}

/** Roll-up across all active suites, shown in the System Health card. */
export interface EvaluationHealth {
  readonly version: string
  readonly passRate: number
  readonly passRateDelta: number
  readonly p95LatencyMs: number
  /** Recent pass-rate samples for the sparkline, oldest first. */
  readonly trend: readonly number[]
}

/** One model's score curve for the comparison chart. */
export interface ModelComparisonSeries {
  readonly label: string
  readonly modelId: string
  readonly points: readonly number[]
  readonly emphasis: boolean
}

export interface EvaluationFilter {
  readonly suiteId?: EvaluationSuiteId | 'all'
  readonly status?: EvaluationStatus | 'all'
}
