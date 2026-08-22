import type { RunPeriod } from './run'

/** A single point on a time-bucketed series. */
export interface TimeSeriesPoint {
  /** Bucket label, e.g. `14:00`. */
  readonly label: string
  readonly value: number
}

/**
 * Combined execution volume and latency for the dashboard's primary chart:
 * volume renders as bars, latency as an overlaid line on a second scale.
 */
export interface ExecutionSeries {
  readonly period: RunPeriod
  readonly volume: readonly TimeSeriesPoint[]
  readonly latencyMs: readonly TimeSeriesPoint[]
}

export interface CostSeries {
  readonly period: RunPeriod
  readonly points: readonly TimeSeriesPoint[]
  readonly totalUsd: number
  readonly projectedUsd: number
}

/** Direction a metric's delta should be read as. */
export type MetricTone = 'positive' | 'negative' | 'neutral' | 'signal'

export interface UsageMetric {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly caption: string
  readonly tone: MetricTone
  /** Optional route the metric card links to. */
  readonly href?: string
}

/** Everything the overview screen needs, resolved in one repository call. */
export interface DashboardAnalytics {
  readonly metrics: readonly UsageMetric[]
  readonly execution: ExecutionSeries
  readonly cost: CostSeries
}

/**
 * Long-term fleet analytics (`/analytics`), distinct from the dashboard's
 * rolling overview. Time-scoped by `AnalyticsPeriod` rather than `RunPeriod` —
 * it adds a longer 30-day window the dashboard has no use for.
 */
export type AnalyticsPeriod = '24h' | '7d' | '30d'

export const ANALYTICS_PERIODS: readonly AnalyticsPeriod[] = ['24h', '7d', '30d']

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  '24h': '24H',
  '7d': '7D',
  '30d': '30D',
}

/** P50/P90/P99 latency for one pipeline stage, in milliseconds. */
export interface LatencyStageMetric {
  readonly stage: string
  readonly p50Ms: number
  readonly p90Ms: number
  readonly p99Ms: number
}

export interface ModelUsageMetric {
  readonly model: string
  readonly percent: number
}

export interface AnalyticsSnapshot {
  readonly period: AnalyticsPeriod
  readonly totalTokens: number
  readonly totalTokensDeltaPct: number
  readonly totalCostUsd: number
  readonly totalCostDeltaPct: number
  readonly avgLatencyP90Ms: number
  readonly avgLatencyDeltaPct: number
  readonly successRate: number
  readonly tokensTrend: readonly TimeSeriesPoint[]
  readonly costTrend: readonly TimeSeriesPoint[]
  readonly latencyStages: readonly LatencyStageMetric[]
  readonly modelUsage: readonly ModelUsageMetric[]
}
