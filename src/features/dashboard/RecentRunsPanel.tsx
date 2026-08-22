import { Link } from 'react-router-dom'

import type { Run } from '@/domain'
import { Panel } from '@/components/ui/Panel'
import { RunStatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState, LoadingState, ErrorState } from '@/components/ui/States'
import { formatShortDuration } from '@/lib/format'
import { cx } from '@/lib/cx'
import type { AsyncState } from '@/hooks/useAsync'

import tableStyles from '@/components/ui/DataTable.module.css'
import styles from './dashboard.module.css'

/** Recent runs, each row navigating to its execution trace. */
export function RecentRunsPanel({
  state,
  onRetry,
}: {
  readonly state: AsyncState<Run[]>
  readonly onRetry: () => void
}) {
  return (
    <Panel
      title="Recent Runs"
      actions={
        <Link to="/runs" className={styles.panelLink}>
          View All
        </Link>
      }
    >
      {state.status === 'loading' ? (
        <LoadingState label="Loading recent runs" rows={5} />
      ) : state.status === 'error' ? (
        <ErrorState
          description="Recent runs could not be loaded."
          onRetry={onRetry}
        />
      ) : state.data.length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="Execute an agent from the Simulator to see runs here."
        />
      ) : (
        <div className={tableStyles.scroll}>
          <table className={tableStyles.table}>
            <caption className="sr-only">
              The most recent agent runs, with status and duration
            </caption>
            <thead>
              <tr className={tableStyles.headRow}>
                <th scope="col" className={tableStyles.th}>
                  Run ID
                </th>
                <th scope="col" className={tableStyles.th}>
                  Agent
                </th>
                <th scope="col" className={tableStyles.th}>
                  Status
                </th>
                <th
                  scope="col"
                  className={cx(tableStyles.th, tableStyles.alignEnd)}
                >
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((run) => (
                <tr
                  key={run.id}
                  className={cx(
                    tableStyles.row,
                    tableStyles.rowInteractive,
                    tableStyles.relative,
                  )}
                >
                  <td className={cx(tableStyles.td, tableStyles.relative)}>
                    <Link
                      to={`/runs/${run.id}`}
                      className={cx('mono', tableStyles.rowLink, styles.runId)}
                    >
                      {run.id}
                    </Link>
                  </td>
                  <td className={tableStyles.td}>{run.agentName}</td>
                  <td className={tableStyles.td}>
                    <RunStatusBadge status={run.status} />
                  </td>
                  <td
                    className={cx(
                      tableStyles.td,
                      tableStyles.alignEnd,
                      'mono',
                      'tabular',
                    )}
                  >
                    {formatShortDuration(run.durationMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
