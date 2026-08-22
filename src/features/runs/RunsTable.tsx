import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Page, Run, RunSort, RunSortField } from '@/domain'
import { Badge } from '@/components/ui/Badge'
import { RunStatusIcon } from '@/components/ui/StatusBadge'
import { now } from '@/lib/clock'
import {
  formatCost,
  formatDuration,
  formatRelativeTime,
  formatTokens,
} from '@/lib/format'
import { cx } from '@/lib/cx'

import tableStyles from '@/components/ui/DataTable.module.css'
import styles from './runs.module.css'

interface Column {
  readonly id: string
  readonly label: string
  readonly sortField?: RunSortField
  readonly alignEnd?: boolean
}

const COLUMNS: readonly Column[] = [
  { id: 'status', label: 'Status', sortField: 'status' },
  { id: 'runId', label: 'Run ID' },
  { id: 'agent', label: 'Agent', sortField: 'agentName' },
  { id: 'model', label: 'Model' },
  { id: 'duration', label: 'Duration', sortField: 'durationMs', alignEnd: true },
  { id: 'tokens', label: 'Tokens', sortField: 'tokens', alignEnd: true },
  { id: 'cost', label: 'Cost', sortField: 'costUsd', alignEnd: true },
  { id: 'started', label: 'Started At', sortField: 'startedAt' },
]

export function RunsTable({
  page,
  sort,
  onToggleSort,
}: {
  readonly page: Page<Run>
  readonly sort: RunSort
  readonly onToggleSort: (field: RunSortField) => void
}) {
  return (
    <div className={tableStyles.scroll}>
      <table className={tableStyles.table}>
        <caption className="sr-only">
          Agent runs matching the current filters. Select a run ID to open its
          execution trace.
        </caption>
        <thead>
          <tr className={tableStyles.headRow}>
            {COLUMNS.map((column) => {
              const isActive = sort.field === column.sortField
              const ariaSort = !column.sortField
                ? undefined
                : isActive
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'

              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cx(
                    tableStyles.th,
                    column.alignEnd && tableStyles.alignEnd,
                  )}
                >
                  {column.sortField ? (
                    <button
                      type="button"
                      className={tableStyles.sortButton}
                      onClick={() => onToggleSort(column.sortField as RunSortField)}
                    >
                      {column.label}
                      {isActive ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp
                            size={12}
                            aria-hidden="true"
                            className={cx(
                              tableStyles.sortIcon,
                              tableStyles.sortIconActive,
                            )}
                          />
                        ) : (
                          <ArrowDown
                            size={12}
                            aria-hidden="true"
                            className={cx(
                              tableStyles.sortIcon,
                              tableStyles.sortIconActive,
                            )}
                          />
                        )
                      ) : (
                        <ChevronsUpDown
                          size={12}
                          aria-hidden="true"
                          className={tableStyles.sortIcon}
                        />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {page.items.map((run) => (
            <tr
              key={run.id}
              className={cx(tableStyles.row, tableStyles.rowInteractive)}
            >
              <td className={tableStyles.td}>
                <RunStatusIcon status={run.status} />
              </td>

              <td className={cx(tableStyles.td, tableStyles.relative)}>
                {/*
                  The link stretches over the whole row via ::after, so the row
                  is clickable while focus and the accessible name stay on a
                  single real link.
                */}
                <Link
                  to={`/runs/${run.id}`}
                  className={cx('mono', tableStyles.rowLink, styles.runIdLink)}
                >
                  {run.id}
                </Link>
              </td>

              <td className={tableStyles.td}>
                <span className={styles.agentCell}>{run.agentName}</span>
              </td>

              <td className={tableStyles.td}>
                <Badge tone="neutral">{run.modelLabel}</Badge>
              </td>

              <td
                className={cx(
                  tableStyles.td,
                  tableStyles.alignEnd,
                  'mono',
                  'tabular',
                )}
              >
                {formatDuration(run.durationMs)}
              </td>

              <td
                className={cx(
                  tableStyles.td,
                  tableStyles.alignEnd,
                  'mono',
                  'tabular',
                )}
              >
                {formatTokens(run.tokens.total, run.estimated)}
              </td>

              <td
                className={cx(
                  tableStyles.td,
                  tableStyles.alignEnd,
                  'mono',
                  'tabular',
                )}
              >
                {run.estimated ? '~' : ''}
                {formatCost(run.costUsd)}
              </td>

              <td className={tableStyles.td}>
                <time dateTime={run.startedAt}>
                  {formatRelativeTime(run.startedAt, now())}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
