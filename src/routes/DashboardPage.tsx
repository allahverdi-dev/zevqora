import { useCallback, useState } from 'react'
import { Download, Plus } from 'lucide-react'

import type { RunPeriod } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { AreaChart } from '@/components/charts/AreaChart'
import { ExecutionChart } from '@/components/charts/ExecutionChart'
import { PageHeader } from '@/components/shell/PageHeader'
import { Button, LinkButton } from '@/components/ui/Button'
import { MetricCard } from '@/components/ui/MetricCard'
import { Panel } from '@/components/ui/Panel'
import { ErrorState, LoadingState, Skeleton } from '@/components/ui/States'
import { ApprovalsPanel } from '@/features/dashboard/ApprovalsPanel'
import { IncidentsPanel } from '@/features/dashboard/IncidentsPanel'
import { RecentRunsPanel } from '@/features/dashboard/RecentRunsPanel'
import { useAsync } from '@/hooks/useAsync'
import { formatCostTotal } from '@/lib/format'
import { cx } from '@/lib/cx'

import styles from './DashboardPage.module.css'

const PERIOD_OPTIONS: readonly { value: RunPeriod; label: string }[] = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
]

/** Production telemetry and control plane overview. */
export function DashboardPage() {
  const services = useServices()
  const { toast } = useToast()
  const [period, setPeriod] = useState<RunPeriod>('24h')

  const analytics = useAsync(
    () => services.analytics.dashboard(period),
    [services, period],
  )
  const recentRuns = useAsync(() => services.runs.recent(4), [services])
  const approvals = useAsync(() => services.approvals.listPending(), [services])
  const incidents = useAsync(() => services.incidents.listOpen(), [services])

  const exportReport = useCallback(() => {
    toast({
      tone: 'info',
      title: 'Report export is not part of this release',
      detail:
        'Exporting requires a backend. The control is present to reflect the approved design.',
    })
  }, [toast])

  return (
    <div className="page">
      <PageHeader
        title="Overview"
        description="Production telemetry and control plane for autonomous agents."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download size={18} />}
              onClick={exportReport}
            >
              Export Report
            </Button>
            <LinkButton to="/simulator" variant="primary" icon={<Plus size={18} />}>
              New Run
            </LinkButton>
          </>
        }
      />

      {/* Metrics ---------------------------------------------------------- */}
      <section aria-label="Key metrics">
        {analytics.state.status === 'success' ? (
          <div className="grid grid--metrics">
            {analytics.state.data.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        ) : analytics.state.status === 'error' ? (
          <ErrorState
            title="Telemetry unavailable"
            description="Dashboard metrics could not be loaded."
            onRetry={analytics.reload}
          />
        ) : (
          <div className="grid grid--metrics">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className={styles.metricSkeleton}>
                <Skeleton width="60%" height={12} />
                <Skeleton width="45%" height={22} />
                <Skeleton width="35%" height={11} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Charts ----------------------------------------------------------- */}
      <div className="grid grid--bento">
        <Panel
          className="col-span-2"
          headerStyle="headline"
          title="Execution Volume & Latency"
          actions={
            <>
              <label htmlFor="dashboard-period" className="sr-only">
                Chart period
              </label>
              <select
                id="dashboard-period"
                className={styles.periodSelect}
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value as RunPeriod)
                }
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          }
          bodyClassName={styles.chartBody}
        >
          {analytics.state.status === 'success' ? (
            <ExecutionChart series={analytics.state.data.execution} />
          ) : analytics.state.status === 'error' ? (
            <ErrorState
              description="Execution telemetry could not be loaded."
              onRetry={analytics.reload}
            />
          ) : (
            <LoadingState label="Loading execution telemetry" rows={4} />
          )}
        </Panel>

        <Panel
          headerStyle="headline"
          title="Cost Burn Rate"
          bodyClassName={styles.chartBody}
        >
          {analytics.state.status === 'success' ? (
            <div className={styles.costBody}>
              <div className={styles.costFigures}>
                <p className={cx('mono', 'tabular', styles.costTotal)}>
                  {formatCostTotal(analytics.state.data.cost.totalUsd)}
                </p>
                <p className={cx('text-code-sm', styles.costCaption)}>
                  Projected {formatCostTotal(analytics.state.data.cost.projectedUsd)}{' '}
                  at current rate
                </p>
              </div>
              <AreaChart
                points={analytics.state.data.cost.points}
                label="Cost burn rate"
                height={150}
              />
            </div>
          ) : analytics.state.status === 'error' ? (
            <ErrorState
              description="Cost telemetry could not be loaded."
              onRetry={analytics.reload}
            />
          ) : (
            <LoadingState label="Loading cost telemetry" rows={3} />
          )}
        </Panel>
      </div>

      {/* Operational panels ----------------------------------------------- */}
      <div className="grid grid--halves">
        <RecentRunsPanel state={recentRuns.state} onRetry={recentRuns.reload} />

        <div className={styles.controlColumn}>
          <ApprovalsPanel state={approvals.state} onRetry={approvals.reload} />
          <IncidentsPanel state={incidents.state} onRetry={incidents.reload} />
        </div>
      </div>
    </div>
  )
}
