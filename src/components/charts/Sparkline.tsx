import { useId } from 'react'

import styles from './charts.module.css'

/** Compact trend line — used in the Evaluations System Health card. */
export function Sparkline({
  values,
  width = 340,
  height = 48,
  label,
}: {
  readonly values: readonly number[]
  readonly width?: number
  readonly height?: number
  readonly label: string
}) {
  const titleId = useId()

  if (values.length === 0) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(max - min, 0.001)
  const step = width / Math.max(values.length - 1, 1)

  const path = values
    .map((value, index) => {
      const x = step * index
      const y = height - 4 - ((value - min) / range) * (height - 8)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={styles.svg}
      role="img"
      aria-labelledby={titleId}
      style={{ height }}
    >
      <title id={titleId}>
        {label}: trending from {values[0]} to {values[values.length - 1]}.
      </title>
      <path
        d={path}
        fill="none"
        className={styles.sparkLine}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
