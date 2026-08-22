import type { IsoTimestamp } from './common'

export type ExperimentStatus = 'draft' | 'running' | 'completed' | 'stopped'

export const EXPERIMENT_STATUS_LABELS: Record<ExperimentStatus, string> = {
  draft: 'Draft',
  running: 'Running',
  completed: 'Completed',
  stopped: 'Stopped',
}

export interface ExperimentVariant {
  readonly label: string
  readonly model: string
}

export type ExperimentMetricUnit = 'percent' | 'seconds' | 'usd'

export interface ExperimentMetricComparison {
  readonly metric: string
  readonly unit: ExperimentMetricUnit
  readonly variantA: number
  readonly variantB: number
}

export interface ExperimentTrafficAllocation {
  readonly variantA: number
  readonly variantB: number
}

export interface Experiment {
  readonly id: string
  readonly name: string
  readonly type: string
  readonly status: ExperimentStatus
  readonly startedAt: IsoTimestamp
  readonly durationLabel: string
  readonly baseVariant: ExperimentVariant
  readonly challengerVariant: ExperimentVariant
  readonly trafficAllocation: ExperimentTrafficAllocation
  readonly comparisons: readonly ExperimentMetricComparison[]
  /** Signed win-rate delta for variant A, shown on the card and directory. */
  readonly deltaKpi: number
}

export interface CreateExperimentInput {
  readonly name: string
  readonly type: string
  readonly baseModel: string
  readonly challengerModel: string
  readonly trafficAllocation: ExperimentTrafficAllocation
}
