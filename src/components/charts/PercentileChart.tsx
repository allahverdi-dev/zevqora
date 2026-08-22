import { useId } from 'react'

import type { LatencyStageMetric } from '@/domain'
import { percentileFractions } from '@/lib/chart-math'
import { formatShortDuration } from '@/lib/format'

import styles from './charts.module.css'

/**
 * P50/P90/P99 latency per pipeline stage — Analytics' Latency Distribution
 * Matrix.
 *
 * Percentiles are not additive, so each stage draws three independent,
 * adjacent bars rather than one bar stacked from three summed segments —
 * stacking would visually imply P50 + P90 + P99 is a meaningful total, which
 * it is not. All three still share one millisecond axis, since that
 * comparison — unlike Experiments' accuracy/latency/cost — is genuinely
 * apples-to-apples.
 */
export function PercentileChart({
  stages,
  height = 220,
}: {
  readonly stages: readonly LatencyStageMetric[]
  readonly height?: number
}) {
  const titleId = useId()
  const width = 400
  const padding = 28
  const groupGap = 20
  const barGap = 3

  if (stages.length === 0) return null

  const max = Math.max(...stages.map((s) => s.p99Ms), 1)
  const plotHeight = height - padding - 20
  const groupWidth =
    (width - padding * 2 - groupGap * (stages.length - 1)) / stages.length
  const barWidth = (groupWidth - barGap * 2) / 3
  const baseY = padding + plotHeight

  return (
    <figure className={styles.figure}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={styles.svg}
        role="img"
        aria-labelledby={titleId}
        style={{ height }}
      >
        <title id={titleId}>
          Latency by pipeline stage, independent P50/P90/P99 series (not
          cumulative).{' '}
          {stages
            .map(
              (s) =>
                `${s.stage}: P50 ${formatShortDuration(s.p50Ms)}, P90 ${formatShortDuration(s.p90Ms)}, P99 ${formatShortDuration(s.p99Ms)}`,
            )
            .join('; ')}
          .
        </title>

        {[0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1={padding}
            x2={width - padding}
            y1={padding + plotHeight * (1 - fraction)}
            y2={padding + plotHeight * (1 - fraction)}
            className={styles.gridLine}
          />
        ))}

        {stages.map((stage, index) => {
          const groupX = padding + index * (groupWidth + groupGap)
          const fractions = percentileFractions(
            stage.p50Ms,
            stage.p90Ms,
            stage.p99Ms,
            max,
          )

          const bars: readonly [string, number, string | undefined, string][] = [
            ['p50', fractions.p50, styles.percentileBarP50, formatShortDuration(stage.p50Ms)],
            ['p90', fractions.p90, styles.percentileBarP90, formatShortDuration(stage.p90Ms)],
            ['p99', fractions.p99, styles.percentileBarP99, formatShortDuration(stage.p99Ms)],
          ]

          return (
            <g key={stage.stage}>
              {bars.map(([key, fraction, className, label], barIndex) => {
                const barHeight = Math.max(fraction * plotHeight, 1)
                const x = groupX + barIndex * (barWidth + barGap)
                return (
                  <g key={key}>
                    <rect
                      x={x}
                      y={baseY - barHeight}
                      width={barWidth}
                      height={barHeight}
                      rx={1}
                      className={className}
                    />
                    <title>{`${stage.stage} ${key.toUpperCase()}: ${label}`}</title>
                  </g>
                )
              })}
              <text
                x={groupX + groupWidth / 2}
                y={height - 4}
                className={styles.axisLabel}
              >
                {stage.stage}
              </text>
            </g>
          )
        })}
      </svg>

      <figcaption className={styles.legend}>
        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ backgroundColor: 'var(--color-secondary-container)' }}
            aria-hidden="true"
          />
          P50
        </span>
        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ backgroundColor: 'var(--color-primary-container)' }}
            aria-hidden="true"
          />
          P90
        </span>
        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ backgroundColor: 'var(--color-error)' }}
            aria-hidden="true"
          />
          P99
        </span>
      </figcaption>
    </figure>
  )
}
