import { AlertTriangle } from 'lucide-react'

import { INCIDENT_SEVERITY_LABELS, type Incident } from '@/domain'
import { Badge } from '@/components/ui/Badge'
import { Panel } from '@/components/ui/Panel'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { now } from '@/lib/clock'
import { formatRelativeTime } from '@/lib/format'
import { cx } from '@/lib/cx'
import type { AsyncState } from '@/hooks/useAsync'

import styles from './dashboard.module.css'

export function IncidentsPanel({
  state,
  onRetry,
}: {
  readonly state: AsyncState<Incident[]>
  readonly onRetry: () => void
}) {
  return (
    <Panel
      tone="danger"
      title={
        <>
          <AlertTriangle size={16} aria-hidden="true" className="text-error" />
          Active Incidents ({state.status === 'success' ? state.data.length : 0})
        </>
      }
    >
      {state.status === 'loading' ? (
        <LoadingState label="Loading incidents" rows={3} />
      ) : state.status === 'error' ? (
        <ErrorState
          description="Incident data could not be loaded."
          onRetry={onRetry}
        />
      ) : state.data.length === 0 ? (
        <EmptyState
          title="No open incidents"
          description="Fleet health is nominal across all environments."
        />
      ) : (
        <ul className={styles.incidentList} role="list">
          {state.data.slice(0, 3).map((incident) => (
            <li key={incident.id} className={styles.incidentItem}>
              <div className={styles.incidentHead}>
                <span className={styles.incidentTitle}>
                  <Badge tone="danger" mono>
                    {INCIDENT_SEVERITY_LABELS[incident.severity]}
                  </Badge>
                  <span className={cx('mono', styles.incidentName)}>
                    {incident.title}
                  </span>
                </span>
                <time
                  className={cx('text-code-sm', styles.incidentTime)}
                  dateTime={incident.openedAt}
                >
                  {formatRelativeTime(incident.openedAt, now())}
                </time>
              </div>
              <p className={cx('text-body-sm', styles.incidentDetail)}>
                {incident.detail}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
