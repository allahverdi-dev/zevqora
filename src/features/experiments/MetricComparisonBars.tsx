import type { ExperimentMetricComparison } from '@/domain'
import { normalizePair } from '@/lib/chart-math'
import { formatExperimentMetric } from '@/lib/format'
import { cx } from '@/lib/cx'

import styles from './experiments.module.css'

/**
 * Per-metric variant comparison.
 *
 * Accuracy (%), latency (s) and cost ($/req) live on genuinely different
 * scales and orders of magnitude, so each metric gets its own independent
 * 0–100 bar width — never a single shared numeric axis. Two metrics never
 * share a scale; only the two variants *within* one metric are compared.
 */
export function MetricComparisonBars({
  comparisons,
  variantALabel = 'Variant A',
  variantBLabel = 'Variant B',
}: {
  readonly comparisons: readonly ExperimentMetricComparison[]
  readonly variantALabel?: string
  readonly variantBLabel?: string
}) {
  return (
    <div className={styles.comparisonGroups}>
      {comparisons.map((comparison) => {
        const { aPercent, bPercent } = normalizePair(
          comparison.variantA,
          comparison.variantB,
        )
        const formattedA = formatExperimentMetric(comparison.variantA, comparison.unit)
        const formattedB = formatExperimentMetric(comparison.variantB, comparison.unit)

        return (
          <div key={comparison.metric} className={styles.comparisonGroup}>
            <h3 className={cx('text-label-caps', styles.comparisonMetricLabel)}>
              {comparison.metric}
            </h3>

            <div className={styles.comparisonRow}>
              <span className={cx('text-code-sm', styles.comparisonVariantLabel)}>
                {variantALabel}
              </span>
              <div
                className={styles.comparisonTrack}
                role="meter"
                aria-valuenow={comparison.variantA}
                aria-valuemin={0}
                aria-valuemax={Math.max(comparison.variantA, comparison.variantB)}
                aria-label={`${comparison.metric}, ${variantALabel}: ${formattedA}`}
              >
                <span
                  className={cx(styles.comparisonFill, styles.comparisonFillA)}
                  style={{ width: `${Math.max(aPercent, 3)}%` }}
                />
              </div>
              <span className={cx('mono', 'tabular', styles.comparisonValue)}>
                {formattedA}
              </span>
            </div>

            <div className={styles.comparisonRow}>
              <span className={cx('text-code-sm', styles.comparisonVariantLabel)}>
                {variantBLabel}
              </span>
              <div
                className={styles.comparisonTrack}
                role="meter"
                aria-valuenow={comparison.variantB}
                aria-valuemin={0}
                aria-valuemax={Math.max(comparison.variantA, comparison.variantB)}
                aria-label={`${comparison.metric}, ${variantBLabel}: ${formattedB}`}
              >
                <span
                  className={cx(styles.comparisonFill, styles.comparisonFillB)}
                  style={{ width: `${Math.max(bPercent, 3)}%` }}
                />
              </div>
              <span className={cx('mono', 'tabular', styles.comparisonValue)}>
                {formattedB}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
