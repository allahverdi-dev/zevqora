import { useCallback, useMemo, useState } from 'react'
import { Activity, Play, SlidersHorizontal } from 'lucide-react'

import type { EvaluationSuiteId } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { PageHeader } from '@/components/shell/PageHeader'
import { ComparisonChart } from '@/components/charts/ComparisonChart'
import { Sparkline } from '@/components/charts/Sparkline'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EvaluationStatusBadge } from '@/components/ui/StatusBadge'
import { Panel } from '@/components/ui/Panel'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { CriteriaAnalysis } from '@/features/evaluations/CriteriaAnalysis'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTimeShort, formatNumber, formatPercent } from '@/lib/format'
import { cx } from '@/lib/cx'

import tableStyles from '@/components/ui/DataTable.module.css'
import styles from '@/features/evaluations/evaluations.module.css'

const PAGE_STEP = 12

/** Evaluations — suite health, criteria analysis and result history. */
export function EvaluationsPage() {
  const services = useServices()
  const { toast } = useToast()

  const [suiteId, setSuiteId] = useState<EvaluationSuiteId | 'all'>(
    'suite_core_ecommerce',
  )
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP)
  const [running, setRunning] = useState(false)
  const [runNonce, setRunNonce] = useState(0)

  const suites = useAsync(() => services.evaluations.listSuites(), [services])
  const health = useAsync(() => services.evaluations.health(), [services])
  const criteria = useAsync(() => services.evaluations.criteria(), [services])
  const comparison = useAsync(
    () => services.evaluations.modelComparison(),
    [services],
  )
  const results = useAsync(
    () => services.evaluations.listResults({ suiteId }),
    [services, suiteId, runNonce],
  )

  const visibleResults = useMemo(
    () =>
      results.state.status === 'success'
        ? results.state.data.slice(0, visibleCount)
        : [],
    [results.state, visibleCount],
  )

  const runSuite = useCallback(async () => {
    if (suiteId === 'all') {
      toast({
        tone: 'error',
        title: 'Select a suite first',
        detail: 'Choose a dataset to evaluate against.',
      })
      return
    }

    setRunning(true)
    try {
      const result = await services.evaluations.runSuite(suiteId)
      setRunNonce((value) => value + 1)
      toast({
        tone: result.status === 'passed' ? 'success' : 'error',
        title: `${result.displayId} ${result.status}`,
        detail: `Scored ${formatPercent(result.score)} against ${
          result.targetModelId
        }.`,
      })
    } catch {
      toast({
        tone: 'error',
        title: 'Evaluation run failed',
        detail: 'The suite could not be executed.',
      })
    } finally {
      setRunning(false)
    }
  }, [services, suiteId, toast])

  return (
    <div className="page">
      <PageHeader
        title="Evaluations"
        icon={<Activity size={26} />}
        description="Measure agent quality, safety, and model performance across evaluation suites."
      />

      <div className={styles.layout}>
        {/* Left column ---------------------------------------------------- */}
        <div className={styles.sideColumn}>
          <Panel
            className={styles.healthPanel}
            bodyClassName={styles.healthBody}
          >
            {health.state.status === 'success' ? (
              <>
                <div className={styles.healthHead}>
                  <div>
                    <h2 className={cx('text-headline-md', styles.healthTitle)}>
                      System Health
                    </h2>
                    <p className={cx('text-body-sm', styles.healthCaption)}>
                      Aggregated across all active suites
                    </p>
                  </div>
                  <Badge tone="neutral" mono>
                    {health.state.data.version}
                  </Badge>
                </div>

                <div className={styles.healthStats}>
                  <div className={styles.healthStat}>
                    <p className={cx('text-label-caps', styles.healthLabel)}>
                      Pass Rate
                    </p>
                    <p className={styles.healthValueRow}>
                      <span className={cx('mono', 'tabular', styles.healthValue)}>
                        {formatPercent(health.state.data.passRate)}
                      </span>
                      <span className={cx('text-code-sm', styles.healthDelta)}>
                        +{health.state.data.passRateDelta.toFixed(1)}%
                      </span>
                    </p>
                  </div>

                  <div className={styles.healthStat}>
                    <p className={cx('text-label-caps', styles.healthLabel)}>
                      P95 Latency
                    </p>
                    <p className={styles.healthValueRow}>
                      <span className={cx('mono', 'tabular', styles.healthValue)}>
                        {health.state.data.p95LatencyMs}
                      </span>
                      <span className={cx('text-body-sm', styles.healthUnit)}>
                        ms
                      </span>
                    </p>
                  </div>
                </div>

                <Sparkline
                  values={health.state.data.trend}
                  label="Pass rate trend"
                />
              </>
            ) : health.state.status === 'error' ? (
              <ErrorState
                description="System health could not be loaded."
                onRetry={health.reload}
              />
            ) : (
              <LoadingState label="Loading system health" rows={4} />
            )}
          </Panel>

          <Panel
            headerStyle="headline"
            title="Criteria Analysis"
            bodyClassName={styles.criteriaBody}
          >
            {criteria.state.status === 'success' ? (
              <CriteriaAnalysis scores={criteria.state.data} />
            ) : criteria.state.status === 'error' ? (
              <ErrorState
                description="Criteria scores could not be loaded."
                onRetry={criteria.reload}
              />
            ) : (
              <LoadingState label="Loading criteria analysis" rows={4} />
            )}
          </Panel>

          <Panel
            headerStyle="headline"
            title="Model Comparison"
            actions={
              comparison.state.status === 'success' ? (
                <span className={styles.comparisonLegend}>
                  {comparison.state.data.map((entry) => (
                    <span key={entry.modelId} className={cx('text-code-sm')}>
                      {entry.label}
                    </span>
                  ))}
                </span>
              ) : null
            }
            bodyClassName={styles.comparisonBody}
          >
            {comparison.state.status === 'success' ? (
              <ComparisonChart series={comparison.state.data} />
            ) : comparison.state.status === 'error' ? (
              <ErrorState
                description="Comparison data could not be loaded."
                onRetry={comparison.reload}
              />
            ) : (
              <LoadingState label="Loading model comparison" rows={3} />
            )}
          </Panel>
        </div>

        {/* Right column --------------------------------------------------- */}
        <div className={styles.mainColumn}>
          <Panel bodyClassName={styles.suiteBar}>
            <div
              className={styles.suiteTabs}
              role="tablist"
              aria-label="Evaluation suites"
            >
              {suites.state.status === 'success'
                ? suites.state.data.map((suite) => (
                    <button
                      key={suite.id}
                      type="button"
                      role="tab"
                      aria-selected={suiteId === suite.id}
                      className={cx(
                        styles.suiteTab,
                        suiteId === suite.id && styles.suiteTabActive,
                      )}
                      onClick={() => {
                        setSuiteId(suite.id)
                        setVisibleCount(PAGE_STEP)
                      }}
                    >
                      {suite.name}
                      <span className="sr-only">
                        , {formatNumber(suite.caseCount)} cases
                      </span>
                    </button>
                  ))
                : null}
            </div>

            <div className={styles.suiteActions}>
              <Button
                variant="secondary"
                icon={<SlidersHorizontal size={18} />}
                onClick={() =>
                  setSuiteId((current) =>
                    current === 'all' ? 'suite_core_ecommerce' : 'all',
                  )
                }
              >
                {suiteId === 'all' ? 'Filtered: All' : 'Filter'}
              </Button>
              <Button
                variant="primary"
                icon={<Play size={18} />}
                onClick={() => void runSuite()}
                disabled={running}
              >
                {running ? 'Running…' : 'Run Suite'}
              </Button>
            </div>
          </Panel>

          <Panel
            title="Recent Evaluation Runs"
            actions={
              <span className={cx('text-code-sm', styles.totalLabel)}>
                Total: {formatNumber(1428)}
              </span>
            }
          >
            {results.state.status === 'loading' ? (
              <LoadingState label="Loading evaluation runs" rows={8} />
            ) : results.state.status === 'error' ? (
              <ErrorState
                description="Evaluation history could not be loaded."
                onRetry={results.reload}
              />
            ) : visibleResults.length === 0 ? (
              <EmptyState
                variant="filtered"
                title="No evaluation runs"
                description="This suite has not been evaluated yet."
                action={
                  <Button variant="secondary" size="sm" onClick={() => void runSuite()}>
                    Run this suite
                  </Button>
                }
              />
            ) : (
              <>
                <div className={tableStyles.scroll}>
                  <table className={tableStyles.table}>
                    <caption className="sr-only">
                      Recent evaluation runs for the selected suite
                    </caption>
                    <thead>
                      <tr className={tableStyles.headRow}>
                        <th scope="col" className={tableStyles.th}>
                          Run ID
                        </th>
                        <th scope="col" className={tableStyles.th}>
                          Timestamp
                        </th>
                        <th scope="col" className={tableStyles.th}>
                          Target Model
                        </th>
                        <th scope="col" className={tableStyles.th}>
                          Status
                        </th>
                        <th
                          scope="col"
                          className={cx(tableStyles.th, tableStyles.alignEnd)}
                        >
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleResults.map((result) => (
                        <tr key={result.id} className={tableStyles.row}>
                          <td className={cx(tableStyles.td, 'mono', styles.evalId)}>
                            {result.displayId}
                          </td>
                          <td className={cx(tableStyles.td, 'mono', 'tabular')}>
                            {formatDateTimeShort(result.ranAt)}
                          </td>
                          <td className={cx(tableStyles.td, 'mono')}>
                            <span className={styles.modelCell}>
                              {result.targetModelId}
                            </span>
                          </td>
                          <td className={tableStyles.td}>
                            <EvaluationStatusBadge status={result.status} />
                          </td>
                          <td
                            className={cx(
                              tableStyles.td,
                              tableStyles.alignEnd,
                              'mono',
                              'tabular',
                              result.status === 'failed'
                                ? styles.scoreFailed
                                : styles.scorePassed,
                            )}
                          >
                            {result.score.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {results.state.data.length > visibleCount ? (
                  <button
                    type="button"
                    className={styles.loadMore}
                    onClick={() =>
                      setVisibleCount((count) => count + PAGE_STEP)
                    }
                  >
                    Load More
                  </button>
                ) : null}
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
