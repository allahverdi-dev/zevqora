/**
 * Pure numeric helpers for chart layout.
 *
 * Kept separate from any component so the normalization logic is testable in
 * isolation — a visualization bug here is a wrong number, not a rendering
 * detail, and deserves a unit test rather than a screenshot.
 */

export interface NormalizedPair {
  /** 0–100. The larger of the two input magnitudes always normalizes to 100. */
  readonly aPercent: number
  readonly bPercent: number
}

/**
 * Scales two values onto a shared 0–100 width so they can be drawn as
 * side-by-side bars *within a single metric* — never across metrics with
 * different units. This is a magnitude comparison only: it does not judge
 * which value is "better" (a lower latency or cost is preferable, but still
 * renders proportionally to its raw size, not inverted).
 *
 * Both values are taken by absolute value so a chart never has to reason
 * about negative widths. If both are zero, both bars render at 0%.
 */
export function normalizePair(a: number, b: number): NormalizedPair {
  const magnitudeA = Math.abs(a)
  const magnitudeB = Math.abs(b)
  const max = Math.max(magnitudeA, magnitudeB)

  if (max === 0) {
    return { aPercent: 0, bPercent: 0 }
  }

  return {
    aPercent: (magnitudeA / max) * 100,
    bPercent: (magnitudeB / max) * 100,
  }
}

export interface PercentileFractions {
  /** Each is `value / max`, independent of the other two — never cumulative. */
  readonly p50: number
  readonly p90: number
  readonly p99: number
}

/**
 * Converts three percentile values (same unit, e.g. milliseconds) to
 * independent 0–1 fractions of a shared max.
 *
 * Percentiles are not additive — P50 + P90 + P99 is not a meaningful
 * quantity — so this deliberately does *not* stack: each fraction reflects
 * only its own value against the max, exactly like three separate bars drawn
 * side by side rather than one bar built from three summed segments.
 */
export function percentileFractions(
  p50: number,
  p90: number,
  p99: number,
  max: number,
): PercentileFractions {
  if (max <= 0) return { p50: 0, p90: 0, p99: 0 }
  return { p50: p50 / max, p90: p90 / max, p99: p99 / max }
}
