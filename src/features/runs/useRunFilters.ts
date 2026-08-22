import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  ENVIRONMENTS,
  RUN_PERIODS,
  RUN_STATUSES,
  type Environment,
  type RunFilter,
  type RunPeriod,
  type RunSort,
  type RunSortField,
  type RunStatus,
} from '@/domain'

/**
 * Runs Explorer filter state, stored in the URL.
 *
 * Keeping filters in search params rather than component state means the back
 * button works, a filtered view can be linked or reloaded, and the state
 * survives navigation to a trace and back — which is the whole point of an
 * explorer.
 */

export interface RunFilterState {
  readonly search: string
  readonly environment: Environment | 'all'
  readonly status: RunStatus | 'all'
  readonly agentId: string
  readonly modelId: string
  readonly period: RunPeriod
  readonly page: number
  readonly sort: RunSort
}

const SORT_FIELDS: readonly RunSortField[] = [
  'startedAt',
  'durationMs',
  'costUsd',
  'tokens',
  'status',
  'agentName',
]

/** Defaults mirror the approved screen: Production, Last 24h, newest first. */
export const DEFAULT_FILTERS: RunFilterState = {
  search: '',
  environment: 'production',
  status: 'all',
  agentId: 'all',
  modelId: 'all',
  period: '24h',
  page: 1,
  sort: { field: 'startedAt', direction: 'desc' },
}

function parseEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T | 'all',
): T | 'all' {
  if (!value) return fallback
  if (value === 'all') return 'all'
  return allowed.includes(value as T) ? (value as T) : fallback
}

export function useRunFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<RunFilterState>(() => {
    const sortField = searchParams.get('sort')
    const sortDir = searchParams.get('dir')

    return {
      search: searchParams.get('q') ?? DEFAULT_FILTERS.search,
      environment: parseEnum(
        searchParams.get('env'),
        ENVIRONMENTS,
        DEFAULT_FILTERS.environment,
      ),
      status: parseEnum(
        searchParams.get('status'),
        RUN_STATUSES,
        DEFAULT_FILTERS.status,
      ),
      agentId: searchParams.get('agent') ?? DEFAULT_FILTERS.agentId,
      modelId: searchParams.get('model') ?? DEFAULT_FILTERS.modelId,
      period:
        (parseEnum(
          searchParams.get('period'),
          RUN_PERIODS,
          DEFAULT_FILTERS.period,
        ) as RunPeriod) ?? DEFAULT_FILTERS.period,
      page: Math.max(1, Number(searchParams.get('page') ?? 1) || 1),
      sort: {
        field:
          sortField && SORT_FIELDS.includes(sortField as RunSortField)
            ? (sortField as RunSortField)
            : DEFAULT_FILTERS.sort.field,
        direction: sortDir === 'asc' ? 'asc' : 'desc',
      },
    }
  }, [searchParams])

  /**
   * Applies a partial change. Any change other than paging resets to page 1,
   * because staying on page 7 of a newly-filtered result set is never useful.
   */
  const update = useCallback(
    (patch: Partial<RunFilterState>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)

          const setOrDelete = (key: string, value: string, fallback: string) => {
            if (value === fallback) next.delete(key)
            else next.set(key, value)
          }

          if (patch.search !== undefined) setOrDelete('q', patch.search, '')
          if (patch.environment !== undefined)
            setOrDelete('env', patch.environment, DEFAULT_FILTERS.environment)
          if (patch.status !== undefined)
            setOrDelete('status', patch.status, DEFAULT_FILTERS.status)
          if (patch.agentId !== undefined)
            setOrDelete('agent', patch.agentId, DEFAULT_FILTERS.agentId)
          if (patch.modelId !== undefined)
            setOrDelete('model', patch.modelId, DEFAULT_FILTERS.modelId)
          if (patch.period !== undefined)
            setOrDelete('period', patch.period, DEFAULT_FILTERS.period)

          if (patch.sort !== undefined) {
            if (
              patch.sort.field === DEFAULT_FILTERS.sort.field &&
              patch.sort.direction === DEFAULT_FILTERS.sort.direction
            ) {
              next.delete('sort')
              next.delete('dir')
            } else {
              next.set('sort', patch.sort.field)
              next.set('dir', patch.sort.direction)
            }
          }

          if (patch.page !== undefined) {
            if (patch.page <= 1) next.delete('page')
            else next.set('page', String(patch.page))
          } else {
            next.delete('page')
          }

          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const reset = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  /** Toggles direction when re-selecting the active column. */
  const toggleSort = useCallback(
    (field: RunSortField) => {
      update({
        sort: {
          field,
          direction:
            filters.sort.field === field && filters.sort.direction === 'desc'
              ? 'asc'
              : 'desc',
        },
      })
    },
    [filters.sort, update],
  )

  const query = useMemo<RunFilter>(
    () => ({
      search: filters.search,
      environment: filters.environment,
      status: filters.status,
      agentId: filters.agentId,
      modelId: filters.modelId,
      period: filters.period,
    }),
    [filters],
  )

  /** Filters that differ from the defaults, for the active-filter chips. */
  const activeChips = useMemo(() => {
    const chips: { key: keyof RunFilterState; label: string }[] = []

    if (filters.environment !== 'all') {
      chips.push({
        key: 'environment',
        label: `Env: ${filters.environment[0]?.toUpperCase()}${filters.environment.slice(1)}`,
      })
    }
    if (filters.period !== 'all') {
      chips.push({ key: 'period', label: `Time: Last ${filters.period}` })
    }
    if (filters.status !== 'all') {
      chips.push({ key: 'status', label: `Status: ${filters.status}` })
    }
    if (filters.agentId !== 'all') {
      chips.push({ key: 'agentId', label: 'Agent filtered' })
    }
    if (filters.modelId !== 'all') {
      chips.push({ key: 'modelId', label: 'Model filtered' })
    }
    if (filters.search.trim()) {
      chips.push({ key: 'search', label: `Search: ${filters.search}` })
    }

    return chips
  }, [filters])

  const isFiltered = useMemo(
    () =>
      filters.search.trim() !== '' ||
      filters.status !== 'all' ||
      filters.agentId !== 'all' ||
      filters.modelId !== 'all' ||
      filters.environment !== DEFAULT_FILTERS.environment ||
      filters.period !== DEFAULT_FILTERS.period,
    [filters],
  )

  const clearChip = useCallback(
    (key: keyof RunFilterState) => {
      switch (key) {
        case 'environment':
          update({ environment: 'all' })
          break
        case 'period':
          update({ period: 'all' })
          break
        case 'status':
          update({ status: 'all' })
          break
        case 'agentId':
          update({ agentId: 'all' })
          break
        case 'modelId':
          update({ modelId: 'all' })
          break
        case 'search':
          update({ search: '' })
          break
        default:
          break
      }
    },
    [update],
  )

  return {
    filters,
    query,
    update,
    reset,
    toggleSort,
    activeChips,
    clearChip,
    isFiltered,
  }
}
