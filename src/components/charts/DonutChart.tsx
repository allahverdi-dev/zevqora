import { useId } from 'react'

import { cx } from '@/lib/cx'

import styles from './charts.module.css'

export interface DonutSegment {
  readonly label: string
  readonly percent: number
  readonly colorVar: string
}

/**
 * Donut chart — Experiments' Traffic Allocation and Analytics' Model Usage.
 *
 * `colorVar` is a CSS custom property name (e.g. `--color-primary-container`)
 * rather than a literal colour, so segments stay inside the token system. The
 * arcs rotate from 12 o'clock via a `<g>` transform; the center label stays
 * unrotated so it reads normally.
 */
export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 176,
}: {
  readonly segments: readonly DonutSegment[]
  readonly centerValue: string
  readonly centerLabel: string
  readonly size?: number
}) {
  const titleId = useId()
  const radius = 40
  const circumference = 2 * Math.PI * radius

  let cumulative = 0
  const arcs = segments.map((segment) => {
    const length = (segment.percent / 100) * circumference
    const offset = -cumulative * (circumference / 100)
    cumulative += segment.percent
    return { ...segment, length, offset }
  })

  return (
    <figure className={styles.figure} style={{ width: size, margin: '0 auto' }}>
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-labelledby={titleId}
        style={{ width: size, height: size }}
      >
        <title id={titleId}>
          {centerLabel}: {segments.map((s) => `${s.label} ${s.percent}%`).join(', ')}.
        </title>

        <g transform="rotate(-90 50 50)">
          <circle
            cx={50}
            cy={50}
            r={radius}
            strokeWidth={14}
            className={styles.donutTrack}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={50}
              cy={50}
              r={radius}
              strokeWidth={14}
              className={styles.donutSegment}
              style={{ stroke: `var(${arc.colorVar})` }}
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={arc.offset}
            />
          ))}
        </g>

        <text x={50} y={47} className={styles.donutCenterValue}>
          {centerValue}
        </text>
        <text x={50} y={62} className={styles.donutCenterLabel}>
          {centerLabel}
        </text>
      </svg>

      <figcaption className={cx(styles.legend, styles.legendStack)}>
        {segments.map((segment) => (
          <span key={segment.label} className={styles.legendItem}>
            <span
              className={styles.legendSwatch}
              style={{ backgroundColor: `var(${segment.colorVar})` }}
              aria-hidden="true"
            />
            {segment.label} — {segment.percent.toFixed(1)}%
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
