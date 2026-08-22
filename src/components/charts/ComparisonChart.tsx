import { useId } from 'react'

import type { ModelComparisonSeries } from '@/domain'

import styles from './charts.module.css'

/**
 * Model comparison curves for the Evaluations screen.
 *
 * Replaces the placeholder image in the Stitch export with a real chart driven
 * by typed series. The emphasised series is solid; comparisons are dashed, so
 * the two are distinguishable without relying on colour.
 */
export function ComparisonChart({
  series,
  height = 190,
}: {
  readonly series: readonly ModelComparisonSeries[]
  readonly height?: number
}) {
  const titleId = useId()
  const width = 400
  const padding = 10

  const allPoints = series.flatMap((entry) => entry.points)
  if (allPoints.length === 0) return null

  const max = Math.max(...allPoints)
  const min = Math.min(...allPoints)
  const range = Math.max(max - min, 1)

  function toPath(points: readonly number[]): string {
    const step = (width - padding * 2) / Math.max(points.length - 1, 1)
    return points
      .map((value, index) => {
        const x = padding + step * index
        const y =
          height -
          padding -
          ((value - min) / range) * (height - padding * 2)
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  }

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
          Model comparison across evaluation checkpoints.{' '}
          {series
            .map(
              (entry) =>
                `${entry.label} ends at ${entry.points[entry.points.length - 1]}`,
            )
            .join('; ')}
          .
        </title>

        {[0.33, 0.66].map((fraction) => (
          <line
            key={fraction}
            x1={padding}
            x2={width - padding}
            y1={height * fraction}
            y2={height * fraction}
            className={styles.gridLine}
          />
        ))}

        {series.map((entry) => (
          <path
            key={entry.modelId}
            d={toPath(entry.points)}
            fill="none"
            className={
              entry.emphasis ? styles.comparePrimary : styles.compareSecondary
            }
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <figcaption className={styles.legend}>
        {series.map((entry) => (
          <span key={entry.modelId} className={styles.legendItem}>
            <span
              className={
                entry.emphasis
                  ? styles.legendSwatchSolid
                  : styles.legendSwatchDashed
              }
              aria-hidden="true"
            />
            {entry.label}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
