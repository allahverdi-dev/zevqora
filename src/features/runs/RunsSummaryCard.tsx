import { BarChart3 } from 'lucide-react'

import type { RunPeriod, RunSummary } from '@/domain'
import { RUN_PERIOD_LABELS } from '@/domain'
import { LoadingState } from '@/components/ui/States'
import {
  formatCostTotal,
  formatPercent,
  formatShortDuration,
} from '@/lib/format'
import { cx } from '@/lib/cx'
import type { AsyncState } from '@/hooks/useAsync'

import styles from './runs.module.css'

/** Aggregate figures for the active period, computed from the filtered corpus. */
export function RunsSummaryCard({
  state,
  period,
}: {
  readonly state: AsyncState<RunSummary>
  readonly period: RunPeriod
}) {
  return (
    <aside className={styles.summaryCard} aria-label="Period summary">
      <header className={styles.summaryHeader}>
        <h2 className={cx('text-label-caps', styles.summaryTitle)}>
          {RUN_PERIOD_LABELS[period]} Summary
        </h2>
        <BarChart3
          size={16}
          aria-hidden="true"
          className={styles.summaryIcon}
        />
      </header>

      {state.status === 'loading' ? (
        <LoadingState label="Calculating summary" rows={3} />
      ) : state.status === 'error' ? (
        <p className={cx('text-body-sm', styles.summaryError)}>
          Summary unavailable.
        </p>
      ) : (
        <dl className={styles.summaryList}>
          <div className={styles.summaryRow}>
            <dt className={cx('text-body-sm', styles.summaryLabel)}>
              Success Rate
            </dt>
            <dd className={cx('mono', 'tabular', styles.summaryValueGood)}>
              {formatPercent(state.data.successRate)}
            </dd>
          </div>
          <div className={styles.summaryRow}>
            <dt className={cx('text-body-sm', styles.summaryLabel)}>
              Avg Latency
            </dt>
            <dd className={cx('mono', 'tabular', styles.summaryValue)}>
              {formatShortDuration(state.data.avgLatencyMs)}
            </dd>
          </div>
          <div className={styles.summaryRow}>
            <dt className={cx('text-body-sm', styles.summaryLabel)}>
              Total Cost
            </dt>
            <dd className={cx('mono', 'tabular', styles.summaryValue)}>
              {formatCostTotal(state.data.totalCostUsd)}
            </dd>
          </div>
        </dl>
      )}
    </aside>
  )
}
