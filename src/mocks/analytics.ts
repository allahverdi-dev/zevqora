import type {
  AnalyticsPeriod,
  AnalyticsSnapshot,
  CostSeries,
  ExecutionSeries,
  RunPeriod,
  TimeSeriesPoint,
  UsageMetric,
} from '@/domain'

import { createRandom } from '@/lib/random'

/**
 * Dashboard analytics.
 *
 * The headline metrics reproduce the approved Overview screen exactly. The
 * series are generated from fixed seeds so the charts render identically on
 * every load — a telemetry surface that reshuffles on refresh undermines the
 * entire premise.
 */

export const MOCK_DASHBOARD_METRICS: readonly UsageMetric[] = [
  {
    id: 'runs',
    label: 'Agent Runs (24h)',
    value: '24,891',
    caption: '+12.4%',
    tone: 'signal',
    href: '/runs',
  },
  {
    id: 'success',
    label: 'Success Rate',
    value: '97.8%',
    caption: 'Healthy',
    tone: 'signal',
  },
  {
    id: 'latency',
    label: 'P50 Latency',
    value: '1.84s',
    caption: '-0.2s avg',
    tone: 'neutral',
  },
  {
    id: 'cost',
    label: 'Model Cost',
    value: '$386.42',
    caption: '+5.1%',
    tone: 'negative',
  },
  {
    id: 'approvals',
    label: 'Awaiting Approval',
    value: '12',
    caption: 'Action Req.',
    tone: 'signal',
    href: '/approvals',
  },
  {
    id: 'incidents',
    label: 'Open Incidents',
    value: '3',
    caption: 'Critical',
    tone: 'negative',
    href: '/incidents',
  },
]

interface SeriesShape {
  readonly buckets: number
  readonly labelAt: (index: number, buckets: number) => string
}

const PERIOD_SHAPES: Record<RunPeriod, SeriesShape> = {
  '1h': {
    buckets: 12,
    labelAt: (i) => `${String(i * 5).padStart(2, '0')}m`,
  },
  '24h': {
    buckets: 19,
    labelAt: (i) => `${String(Math.floor((i * 24) / 19)).padStart(2, '0')}:00`,
  },
  '7d': {
    buckets: 14,
    labelAt: (i) => `D${Math.floor(i / 2) + 1}`,
  },
  '30d': {
    buckets: 15,
    labelAt: (i) => `${i * 2 + 1}`,
  },
  all: {
    buckets: 18,
    labelAt: (i) => `W${i + 1}`,
  },
}

const PERIOD_SEEDS: Record<RunPeriod, number> = {
  '1h': 0x1a01,
  '24h': 0x24a0,
  '7d': 0x07d0,
  '30d': 0x30d0,
  all: 0xa11a,
}

/**
 * Volume follows a diurnal curve with seeded jitter; latency is loosely
 * inversely correlated so the overlay reads as a real system under load.
 */
export function buildExecutionSeries(period: RunPeriod): ExecutionSeries {
  const shape = PERIOD_SHAPES[period]
  const next = createRandom(PERIOD_SEEDS[period])

  const volume: TimeSeriesPoint[] = []
  const latencyMs: TimeSeriesPoint[] = []

  for (let i = 0; i < shape.buckets; i += 1) {
    const phase = (i / shape.buckets) * Math.PI * 2
    const swell = 0.55 + 0.35 * Math.sin(phase - 1.1)
    const jitter = (next() - 0.5) * 0.34
    const normalized = Math.min(1, Math.max(0.12, swell + jitter))

    volume.push({
      label: shape.labelAt(i, shape.buckets),
      value: Math.round(normalized * 2_400),
    })

    latencyMs.push({
      label: shape.labelAt(i, shape.buckets),
      value: Math.round(1_200 + (1 - normalized) * 900 + (next() - 0.5) * 260),
    })
  }

  return { period, volume, latencyMs }
}

export function buildCostSeries(period: RunPeriod): CostSeries {
  const shape = PERIOD_SHAPES[period]
  const next = createRandom(PERIOD_SEEDS[period] ^ 0x5c05)

  let running = 6 + next() * 3
  const points: TimeSeriesPoint[] = []

  for (let i = 0; i < shape.buckets; i += 1) {
    // Cost burn accelerates through the window rather than oscillating.
    running += 0.6 + next() * 2.4 + (i / shape.buckets) * 2.2
    points.push({
      label: shape.labelAt(i, shape.buckets),
      value: Number(running.toFixed(2)),
    })
  }

  const totalUsd = 386.42
  const projectedUsd = Number((totalUsd * 1.18).toFixed(2))

  return { period, points, totalUsd, projectedUsd }
}

/**
 * Fleet Analytics (`/analytics`).
 *
 * The 24H figures reproduce the approved screen's headline numbers exactly
 * (1.42B tokens, $42,850, 842ms P90, 99.8% success). 7D/30D scale those by a
 * seeded multiplier so switching the period genuinely changes every number on
 * the screen rather than just relabelling the same one.
 */
const ANALYTICS_BASE = {
  totalTokens: 1_420_000_000,
  totalCostUsd: 42_850,
  avgLatencyP90Ms: 842,
  successRate: 99.8,
}

const ANALYTICS_PERIOD_SCALE: Record<AnalyticsPeriod, number> = {
  '24h': 1,
  '7d': 6.4,
  '30d': 24.8,
}

const LATENCY_STAGES: readonly {
  readonly stage: string
  readonly p50Ms: number
  readonly p90Ms: number
  readonly p99Ms: number
}[] = [
  { stage: 'Router', p50Ms: 180, p90Ms: 420, p99Ms: 850 },
  { stage: 'Eval', p50Ms: 210, p90Ms: 480, p99Ms: 690 },
  { stage: 'RAG', p50Ms: 340, p90Ms: 610, p99Ms: 940 },
  { stage: 'CodeGen', p50Ms: 520, p90Ms: 890, p99Ms: 1180 },
  { stage: 'Refine', p50Ms: 260, p90Ms: 540, p99Ms: 760 },
]

const MODEL_USAGE = [
  { model: 'Claude Sonnet 5', percent: 75 },
  { model: 'GPT-5.6', percent: 20 },
  { model: 'Llama 4 Maverick', percent: 5 },
]

function trendFor(seed: number, buckets: number, base: number): TimeSeriesPoint[] {
  const next = createRandom(seed)
  const points: TimeSeriesPoint[] = []
  let running = base * 0.7

  for (let i = 0; i < buckets; i += 1) {
    running += base * 0.05 + (next() - 0.35) * base * 0.08
    points.push({ label: `${i}`, value: Math.max(0, Math.round(running)) })
  }

  return points
}

export function buildAnalyticsSnapshot(period: AnalyticsPeriod): AnalyticsSnapshot {
  const scale = ANALYTICS_PERIOD_SCALE[period]
  const next = createRandom(0xa5a1 ^ scale)
  const latencyJitter = period === '24h' ? 1 : 0.9 + next() * 0.25

  return {
    period,
    totalTokens: Math.round(ANALYTICS_BASE.totalTokens * scale),
    totalTokensDeltaPct: period === '24h' ? 12.4 : period === '7d' ? 18.9 : 34.2,
    totalCostUsd: Number((ANALYTICS_BASE.totalCostUsd * scale).toFixed(2)),
    totalCostDeltaPct: period === '24h' ? 8.2 : period === '7d' ? 15.1 : 28.6,
    avgLatencyP90Ms: Math.round(ANALYTICS_BASE.avgLatencyP90Ms * latencyJitter),
    avgLatencyDeltaPct: period === '24h' ? -1.1 : period === '7d' ? -3.4 : -6.8,
    successRate: Number(
      Math.min(99.9, ANALYTICS_BASE.successRate - (scale > 1 ? 0.3 : 0)).toFixed(1),
    ),
    tokensTrend: trendFor(0x7001 ^ scale, 16, ANALYTICS_BASE.totalTokens * scale / 16),
    costTrend: trendFor(0x7002 ^ scale, 16, (ANALYTICS_BASE.totalCostUsd * scale) / 16),
    latencyStages: LATENCY_STAGES.map((entry) => ({
      ...entry,
      p50Ms: Math.round(entry.p50Ms * latencyJitter),
      p90Ms: Math.round(entry.p90Ms * latencyJitter),
      p99Ms: Math.round(entry.p99Ms * latencyJitter),
    })),
    modelUsage: MODEL_USAGE.slice(),
  }
}
