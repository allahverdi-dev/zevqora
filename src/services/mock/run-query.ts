import type { Page, Run, RunFilter, RunPeriod, RunQuery, RunSort } from '@/domain'

import { DEMO_NOW_MS, DAY, HOUR } from '@/mocks/demo-context'

/**
 * Pure query helpers for the run corpus.
 *
 * Kept free of any repository or React concern so the filtering and sorting
 * rules the Runs Explorer depends on can be unit-tested directly, and so an
 * API-backed repository can reuse the same semantics for optimistic
 * client-side filtering.
 */

const PERIOD_WINDOW_MS: Record<Exclude<RunPeriod, 'all'>, number> = {
  '1h': HOUR,
  '24h': 24 * HOUR,
  '7d': 7 * DAY,
  '30d': 30 * DAY,
}

export function filterRuns(
  runs: readonly Run[],
  filter: RunFilter | undefined,
): Run[] {
  if (!filter) return runs.slice()

  const search = filter.search?.trim().toLowerCase()

  return runs.filter((run) => {
    if (
      filter.environment &&
      filter.environment !== 'all' &&
      run.environment !== filter.environment
    ) {
      return false
    }

    if (filter.status && filter.status !== 'all' && run.status !== filter.status) {
      return false
    }

    if (filter.agentId && filter.agentId !== 'all' && run.agentId !== filter.agentId) {
      return false
    }

    if (filter.modelId && filter.modelId !== 'all' && run.modelId !== filter.modelId) {
      return false
    }

    if (filter.period && filter.period !== 'all') {
      const window = PERIOD_WINDOW_MS[filter.period]
      if (DEMO_NOW_MS - new Date(run.startedAt).getTime() > window) {
        return false
      }
    }

    if (search) {
      const haystack = `${run.id} ${run.agentName} ${run.modelLabel} ${run.input}`
      if (!haystack.toLowerCase().includes(search)) return false
    }

    return true
  })
}

export function sortRuns(runs: readonly Run[], sort: RunSort | undefined): Run[] {
  const sorted = runs.slice()
  if (!sort) return sorted

  const direction = sort.direction === 'asc' ? 1 : -1

  sorted.sort((a, b) => {
    switch (sort.field) {
      case 'startedAt':
        return (
          (new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()) *
          direction
        )
      case 'durationMs':
        return (a.durationMs - b.durationMs) * direction
      case 'costUsd':
        return (a.costUsd - b.costUsd) * direction
      case 'tokens':
        return (a.tokens.total - b.tokens.total) * direction
      case 'status':
        return a.status.localeCompare(b.status) * direction
      case 'agentName':
        return a.agentName.localeCompare(b.agentName) * direction
      default:
        return 0
    }
  })

  return sorted
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): Page<T> {
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: safePage,
    pageSize,
  }
}

export function queryRuns(runs: readonly Run[], query: RunQuery = {}): Page<Run> {
  const filtered = filterRuns(runs, query.filter)
  const sorted = sortRuns(filtered, query.sort ?? {
    field: 'startedAt',
    direction: 'desc',
  })
  return paginate(sorted, query.page ?? 1, query.pageSize ?? 25)
}

/** Aggregates the summary card figures over a period. */
export function summarizeRuns(
  runs: readonly Run[],
  period: RunPeriod,
): {
  successRate: number
  avgLatencyMs: number
  totalCostUsd: number
  totalRuns: number
} {
  const scoped = filterRuns(runs, { period })

  if (scoped.length === 0) {
    return { successRate: 0, avgLatencyMs: 0, totalCostUsd: 0, totalRuns: 0 }
  }

  // Runs still in flight have no outcome yet, so they are excluded from the
  // success-rate denominator rather than counted as failures.
  const settled = scoped.filter(
    (run) => run.status !== 'running' && run.status !== 'awaiting_approval',
  )
  const succeeded = settled.filter((run) => run.status === 'success').length

  const totalDuration = scoped.reduce((sum, run) => sum + run.durationMs, 0)
  const totalCost = scoped.reduce((sum, run) => sum + run.costUsd, 0)

  return {
    successRate:
      settled.length === 0
        ? 0
        : Number(((succeeded / settled.length) * 100).toFixed(1)),
    avgLatencyMs: Math.round(totalDuration / scoped.length),
    totalCostUsd: Number(totalCost.toFixed(2)),
    totalRuns: scoped.length,
  }
}
