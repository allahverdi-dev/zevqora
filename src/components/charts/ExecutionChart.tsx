import { useId } from 'react'

import type { ExecutionSeries } from '@/domain'
import { formatNumber } from '@/lib/format'

import styles from './charts.module.css'

/**
 * Combined execution volume (bars) and latency (line) on independent scales.
 *
 * Hand-rolled SVG rather than a charting library: the shapes needed here are
 * simple, and a dependency would cost more bundle weight than the ~80 lines it
 * would replace while giving less control over the design language.
 *
 * The chart is described to assistive tech through an adjacent data table
 * rather than being announced point by point.
 */
export function ExecutionChart({
  series,
  height = 260,
}: {
  readonly series: ExecutionSeries
  readonly height?: number
}) {
  const titleId = useId()
  const width = 800
  const padding = { top: 16, right: 8, bottom: 24, left: 8 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const volumes = series.volume.map((point) => point.value)
  const latencies = series.latencyMs.map((point) => point.value)

  const maxVolume = Math.max(...volumes, 1)
  const maxLatency = Math.max(...latencies, 1)
  const minLatency = Math.min(...latencies, 0)
  const latencyRange = Math.max(maxLatency - minLatency, 1)

  const count = series.volume.length
  const slot = plotWidth / count
  const barWidth = Math.min(18, slot * 0.42)

  const latencyPoints = series.latencyMs.map((point, index) => {
    const x = padding.left + slot * index + slot / 2
    const y =
      padding.top +
      plotHeight -
      ((point.value - minLatency) / latencyRange) * plotHeight * 0.78 -
      plotHeight * 0.11
    return { x, y, value: point.value, label: point.label }
  })

  const linePath = latencyPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const gridLines = [0.25, 0.5, 0.75]

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
          Execution volume and latency over the selected period. Peak volume{' '}
          {formatNumber(maxVolume)} runs, peak latency {maxLatency} milliseconds.
        </title>

        {gridLines.map((fraction) => (
          <line
            key={fraction}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + plotHeight * fraction}
            y2={padding.top + plotHeight * fraction}
            className={styles.gridLine}
          />
        ))}

        {/* Volume bars */}
        <g className={styles.bars}>
          {series.volume.map((point, index) => {
            const barHeight = (point.value / maxVolume) * plotHeight * 0.86
            const x = padding.left + slot * index + slot / 2 - barWidth / 2
            const y = padding.top + plotHeight - barHeight

            return (
              <rect
                key={point.label + index}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={1}
                className={styles.bar}
              />
            )
          })}
        </g>

        {/* Latency line */}
        <path
          d={linePath}
          fill="none"
          className={styles.latencyLine}
          vectorEffect="non-scaling-stroke"
        />

        {latencyPoints.map((point, index) => (
          <circle
            key={point.label + index}
            cx={point.x}
            cy={point.y}
            r={2.5}
            className={styles.latencyDot}
          />
        ))}
      </svg>

      <figcaption className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatchBar} aria-hidden="true" />
          Execution volume
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatchLine} aria-hidden="true" />
          P50 latency
        </span>
      </figcaption>

      {/* Accessible equivalent of the plotted data. */}
      <table className="sr-only">
        <caption>Execution volume and latency by time bucket</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Runs</th>
            <th scope="col">P50 latency (ms)</th>
          </tr>
        </thead>
        <tbody>
          {series.volume.map((point, index) => (
            <tr key={point.label + index}>
              <th scope="row">{point.label}</th>
              <td>{formatNumber(point.value)}</td>
              <td>{series.latencyMs[index]?.value ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
