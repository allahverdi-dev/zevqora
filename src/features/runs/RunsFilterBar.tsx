import { Bot, Calendar, Cpu, RotateCw, Search, SlidersHorizontal, X } from 'lucide-react'

import {
  ENVIRONMENT_LABELS,
  ENVIRONMENTS,
  RUN_PERIOD_LABELS,
  RUN_PERIODS,
  RUN_STATUS_LABELS,
  RUN_STATUSES,
  type Agent,
  type AgentModel,
} from '@/domain'
import { IconButton } from '@/components/ui/IconButton'
import { Select, type SelectOption } from '@/components/ui/Select'
import { cx } from '@/lib/cx'

import type { RunFilterState } from './useRunFilters'
import styles from './runs.module.css'

const ENVIRONMENT_OPTIONS: readonly SelectOption[] = [
  { value: 'all', label: 'All environments' },
  ...ENVIRONMENTS.map((environment) => ({
    value: environment,
    label: ENVIRONMENT_LABELS[environment],
  })),
]

const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'all', label: 'All' },
  ...RUN_STATUSES.map((status) => ({
    value: status,
    label: RUN_STATUS_LABELS[status],
  })),
]

const PERIOD_OPTIONS: readonly SelectOption[] = RUN_PERIODS.map((period) => ({
  value: period,
  label: RUN_PERIOD_LABELS[period],
}))

interface RunsFilterBarProps {
  readonly filters: RunFilterState
  readonly agents: readonly Agent[]
  readonly models: readonly AgentModel[]
  readonly activeChips: readonly { key: keyof RunFilterState; label: string }[]
  readonly isFiltered: boolean
  readonly onUpdate: (patch: Partial<RunFilterState>) => void
  readonly onClearChip: (key: keyof RunFilterState) => void
  readonly onReset: () => void
  readonly onRefresh: () => void
}

export function RunsFilterBar({
  filters,
  agents,
  models,
  activeChips,
  isFiltered,
  onUpdate,
  onClearChip,
  onReset,
  onRefresh,
}: RunsFilterBarProps) {
  const agentOptions: readonly SelectOption[] = [
    { value: 'all', label: 'All' },
    ...agents.map((agent) => ({ value: agent.id, label: agent.name })),
  ]

  const modelOptions: readonly SelectOption[] = [
    { value: 'all', label: 'All' },
    ...models.map((model) => ({ value: model.id, label: model.label })),
  ]

  return (
    <section className={styles.filterBar} aria-label="Run filters">
      <div className={styles.filterRow}>
        <div className={styles.searchField}>
          <Search size={18} aria-hidden="true" className={styles.searchIcon} />
          <label htmlFor="runs-search" className="sr-only">
            Search by run ID, agent, or input
          </label>
          <input
            id="runs-search"
            type="search"
            className={styles.searchInput}
            placeholder="Search by Run ID, Agent, or Input..."
            value={filters.search}
            onChange={(event) => onUpdate({ search: event.target.value })}
          />
        </div>

        <div className={styles.controls}>
          <Select
            label="Environment"
            value={filters.environment}
            options={ENVIRONMENT_OPTIONS}
            onChange={(value) =>
              onUpdate({ environment: value as RunFilterState['environment'] })
            }
            signalDot={filters.environment !== 'all'}
          />
          <Select
            label="Status"
            prefix="Status:"
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(value) =>
              onUpdate({ status: value as RunFilterState['status'] })
            }
            icon={SlidersHorizontal}
          />
          <Select
            label="Agent"
            prefix="Agent:"
            value={filters.agentId}
            options={agentOptions}
            onChange={(value) => onUpdate({ agentId: value })}
            icon={Bot}
          />
          <Select
            label="Model"
            prefix="Model:"
            value={filters.modelId}
            options={modelOptions}
            onChange={(value) => onUpdate({ modelId: value })}
            icon={Cpu}
          />
          <Select
            label="Time period"
            value={filters.period}
            options={PERIOD_OPTIONS}
            onChange={(value) =>
              onUpdate({ period: value as RunFilterState['period'] })
            }
            icon={Calendar}
          />
          <IconButton label="Refresh runs" onClick={onRefresh}>
            <RotateCw size={18} />
          </IconButton>
        </div>
      </div>

      {activeChips.length > 0 ? (
        <div className={styles.chipRow}>
          <span className={cx('text-label-caps', styles.chipLabel)}>
            Active filters:
          </span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className={styles.chip}
              onClick={() => onClearChip(chip.key)}
            >
              <span>{chip.label}</span>
              <X size={14} aria-hidden="true" />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          {isFiltered ? (
            <button type="button" className={styles.clearAll} onClick={onReset}>
              Clear All
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
