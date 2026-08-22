import { useMemo, useState } from 'react'
import { BarChart3, Download, TrendingDown, TrendingUp } from 'lucide-react'

import type { AnalyticsPeriod } from '@/domain'
import { ANALYTICS_PERIODS, ANALYTICS_PERIOD_LABELS } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { PageHeader } from '@/components/shell/PageHeader'
import { DonutChart } from '@/components/charts/DonutChart'
import { Sparkline } from '@/components/charts/Sparkline'
import { PercentileChart } from '@/components/charts/PercentileChart'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { ErrorState, LoadingState } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import { downloadCsv, downloadJson } from '@/lib/download'
import { formatCostTotal, formatNumber, formatShortDuration } from '@/lib/format'
import { cx } from '@/lib/cx'

import styles from '@/features/analytics/analytics.module.css'

const MODEL_COLOR: readonly string[] = [
  '--color-primary-container',
  '--color-secondary-container',
  '--color-outline-variant',
]

function formatTokensShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  return formatNumber(value)
}

function Delta({ value, invert = false }: { readonly value: number; readonly invert?: boolean }) {
  const positive = invert ? value < 0 : value > 0
  const tone = value === 0 ? styles.deltaNeutral : positive ? styles.deltaPositive : styles.deltaNegative
  const Icon = value < 0 ? TrendingDown : TrendingUp

  return (
    <span className={cx(styles.metricDelta, tone)}>
      <Icon size={14} aria-hidden="true" />
      <span className="mono text-code-sm">
        {value >= 0 ? '+' : ''}
        {value.toFixed(1)}%
      </span>
    </span>
  )
}

/** Fleet Analytics (`/analytics`) — long-term performance and cost telemetry. */
export function AnalyticsPage() {
  const services = useServices()
  const { toast } = useToast()
  const [period, setPeriod] = useState<AnalyticsPeriod>('24h')

  const snapshot = useAsync(() => services.analytics.snapshot(period), [services, period])
  const data = snapshot.state.status === 'success' ? snapshot.state.data : null

  const donutSegments = useMemo(
    () =>
      (data?.modelUsage ?? []).map((usage, index) => ({
        label: usage.model,
        percent: usage.percent,
        colorVar: MODEL_COLOR[index % MODEL_COLOR.length] ?? '--color-outline-variant',
      })),
    [data],
  )

  function exportCsv() {
    if (!data) return
    downloadCsv(`zevqora-analytics-${period}.csv`, [
      ['metric', 'value'],
      ['period', period],
      ['total_tokens', data.totalTokens],
      ['total_cost_usd', data.totalCostUsd],
      ['avg_latency_p90_ms', data.avgLatencyP90Ms],
      ['success_rate_pct', data.successRate],
      [],
      ['stage', 'p50_ms', 'p90_ms', 'p99_ms'],
      ...data.latencyStages.map((s) => [s.stage, s.p50Ms, s.p90Ms, s.p99Ms]),
      [],
      ['model', 'percent'],
      ...data.modelUsage.map((m) => [m.model, m.percent]),
    ])
    toast({ tone: 'success', title: 'CSV exported', detail: `zevqora-analytics-${period}.csv` })
  }

  function exportJson() {
    if (!data) return
    downloadJson(`zevqora-analytics-${period}.json`, data)
    toast({ tone: 'success', title: 'JSON exported', detail: `zevqora-analytics-${period}.json` })
  }

  return (
    <div className="page">
      <PageHeader
        title="Fleet Analytics"
        icon={<BarChart3 size={26} />}
        description="Long-term performance and cost telemetry."
        actions={
          <div className={styles.periodTabs} role="group" aria-label="Time period">
            {ANALYTICS_PERIODS.map((option) => (
              <button
                key={option}
                type="button"
                className={cx(styles.periodTab, period === option && styles.periodTabActive)}
                aria-pressed={period === option}
                onClick={() => setPeriod(option)}
              >
                {ANALYTICS_PERIOD_LABELS[option]}
              </button>
            ))}
          </div>
        }
      />

      {snapshot.state.status === 'loading' || !data ? (
        <LoadingState label="Loading analytics" rows={6} />
      ) : snapshot.state.status === 'error' ? (
        <ErrorState description="Analytics could not be loaded." onRetry={snapshot.reload} />
      ) : (
        <>
          <div className={styles.metricRow}>
            <div className={styles.metricCard}>
              <span className="text-label-caps text-muted">Total Tokens</span>
              <span className={styles.metricValue}>{formatTokensShort(data.totalTokens)}</span>
              <Delta value={data.totalTokensDeltaPct} />
              <div className={styles.metricSparkline}>
                <Sparkline
                  values={data.tokensTrend.map((p) => p.value)}
                  label="Token usage trend"
                  height={32}
                />
              </div>
            </div>

            <div className={styles.metricCard}>
              <span className="text-label-caps text-muted">Total Cost</span>
              <span className={styles.metricValue}>{formatCostTotal(data.totalCostUsd)}</span>
              <Delta value={data.totalCostDeltaPct} invert />
              <div className={styles.metricSparkline}>
                <Sparkline
                  values={data.costTrend.map((p) => p.value)}
                  label="Cost trend"
                  height={32}
                />
              </div>
            </div>

            <div className={styles.metricCard}>
              <span className="text-label-caps text-muted">Avg Latency (P90)</span>
              <span className={styles.metricValue}>{formatShortDuration(data.avgLatencyP90Ms)}</span>
              <Delta value={data.avgLatencyDeltaPct} invert />
            </div>

            <div className={styles.metricCard}>
              <span className="text-label-caps text-muted">Success Rate</span>
              <span className={styles.metricValue}>{data.successRate}%</span>
              <span className={cx(styles.metricDelta, styles.deltaPositive)}>
                <TrendingUp size={14} aria-hidden="true" />
                <span className="text-code-sm">Stable</span>
              </span>
            </div>
          </div>

          <div className={styles.matrixLayout}>
            <Panel
              headerStyle="headline"
              title="Latency Distribution Matrix"
              actions={<span className="text-code-sm text-muted">P50 / P90 / P99</span>}
            >
              <PercentileChart stages={data.latencyStages} />
            </Panel>

            <Panel headerStyle="headline" title="Model Usage">
              <DonutChart
                segments={donutSegments}
                centerValue={`${data.modelUsage.length}`}
                centerLabel="Models"
              />
            </Panel>
          </div>

          <Panel title="Data Export">
            <div className={styles.exportRow}>
              <p className="text-body-sm text-muted">
                Export the {ANALYTICS_PERIOD_LABELS[period]} analytics snapshot currently shown above.
              </p>
              <div className={styles.exportActions}>
                <Button variant="secondary" icon={<Download size={16} />} onClick={exportCsv}>
                  Export CSV
                </Button>
                <Button variant="signal" icon={<Download size={16} />} onClick={exportJson}>
                  Export JSON
                </Button>
              </div>
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
