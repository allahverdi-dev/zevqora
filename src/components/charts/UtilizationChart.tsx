import { useId } from 'react'

import { formatPercent } from '@/lib/format'

import styles from './charts.module.css'

/**
 * System utilisation bars — the Agent Fleet footer chart.
 *
 * Samples above the emphasis threshold are drawn in the bright inverse tone,
 * matching the approved render where load spikes read as bright columns
 * against the tonal baseline.
 */
export function UtilizationChart({
  samples,
  height = 180,
  emphasisThreshold = 0.78,
}: {
  readonly samples: readonly number[]
  readonly height?: number
  readonly emphasisThreshold?: number
}) {
  const titleId = useId()
  const width = 1000
  const slot = width / Math.max(samples.length, 1)
  const barWidth = Math.max(slot * 0.55, 2)

  const average =
    samples.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1)

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
          System utilisation across the last 24 hours. Average load{' '}
          {formatPercent(average * 100, 0)}.
        </title>

        {samples.map((sample, index) => {
          const barHeight = Math.max(sample * (height - 8), 2)
          const x = slot * index + (slot - barWidth) / 2
          const y = height - barHeight

          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={1}
              className={
                sample >= emphasisThreshold
                  ? styles.utilizationBarPeak
                  : styles.utilizationBar
              }
            />
          )
        })}
      </svg>
    </figure>
  )
}
