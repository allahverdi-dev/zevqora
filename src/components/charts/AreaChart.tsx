import { useId } from 'react'

import type { TimeSeriesPoint } from '@/domain'
import { formatCostTotal } from '@/lib/format'

import styles from './charts.module.css'

/**
 * Filled area trend — the dashboard's Cost Burn Rate panel.
 *
 * Uses a smoothed path so a monotonically rising cost curve reads as a burn
 * rate rather than a jagged sample plot.
 */
export function AreaChart({
  points,
  height = 200,
  label,
}: {
  readonly points: readonly TimeSeriesPoint[]
  readonly height?: number
  readonly label: string
}) {
  const titleId = useId()
  const width = 400
  const padding = 6

  if (points.length === 0) return null

  const values = points.map((point) => point.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)

  const step = (width - padding * 2) / Math.max(points.length - 1, 1)

  const coords = points.map((point, index) => ({
    x: padding + step * index,
    y:
      height -
      padding -
      ((point.value - min) / range) * (height - padding * 2) * 0.9,
  }))

  // Catmull-Rom-ish smoothing via midpoint quadratic segments.
  let line = `M ${coords[0]?.x ?? 0} ${coords[0]?.y ?? 0}`
  for (let i = 1; i < coords.length; i += 1) {
    const previous = coords[i - 1]
    const current = coords[i]
    if (!previous || !current) continue
    const midX = (previous.x + current.x) / 2
    line += ` Q ${previous.x} ${previous.y}, ${midX} ${(previous.y + current.y) / 2}`
    line += ` Q ${current.x} ${current.y}, ${current.x} ${current.y}`
  }

  const last = coords[coords.length - 1]
  const first = coords[0]
  const area = `${line} L ${last?.x ?? 0} ${height} L ${first?.x ?? 0} ${height} Z`

  const gradientId = `${titleId}-fill`

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
          {label}. Rising from {formatCostTotal(min)} to {formatCostTotal(max)}{' '}
          across the period.
        </title>

        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-primary-container)"
              stopOpacity="0.22"
            />
            <stop
              offset="100%"
              stopColor="var(--color-primary-container)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          className={styles.areaLine}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </figure>
  )
}
