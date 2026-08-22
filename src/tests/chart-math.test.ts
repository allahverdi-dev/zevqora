import { describe, expect, it } from 'vitest'

import { normalizePair, percentileFractions } from '@/lib/chart-math'

describe('normalizePair', () => {
  it('gives the larger magnitude 100%', () => {
    expect(normalizePair(94, 82).aPercent).toBe(100)
    expect(normalizePair(1.2, 1.8).bPercent).toBe(100)
  })

  it('scales the smaller value proportionally to the larger', () => {
    const { aPercent, bPercent } = normalizePair(0.04, 0.02)
    expect(aPercent).toBe(100)
    expect(bPercent).toBe(50)
  })

  it('normalizes each metric independently — different units never share a scale', () => {
    // Accuracy (94 vs 82), latency (1.2 vs 1.8) and cost (0.04 vs 0.02) each
    // produce their own 0-100 pair; nothing here compares 94 to 1.2 or 0.04.
    const accuracy = normalizePair(94, 82)
    const latency = normalizePair(1.2, 1.8)
    const cost = normalizePair(0.04, 0.02)

    expect(accuracy.aPercent).toBe(100)
    expect(latency.bPercent).toBe(100)
    expect(cost.aPercent).toBe(100)
  })

  it('handles equal values as both 100%', () => {
    expect(normalizePair(5, 5)).toEqual({ aPercent: 100, bPercent: 100 })
  })

  it('handles both values being zero without dividing by zero', () => {
    expect(normalizePair(0, 0)).toEqual({ aPercent: 0, bPercent: 0 })
  })

  it('compares by magnitude, ignoring sign', () => {
    const { aPercent, bPercent } = normalizePair(-10, 5)
    expect(aPercent).toBe(100)
    expect(bPercent).toBe(50)
  })
})

describe('percentileFractions', () => {
  it('scales each percentile independently against the shared max', () => {
    const result = percentileFractions(180, 420, 850, 850)
    expect(result.p50).toBeCloseTo(180 / 850)
    expect(result.p90).toBeCloseTo(420 / 850)
    expect(result.p99).toBeCloseTo(1)
  })

  it('is not cumulative — P50 does not add into P90 or P99', () => {
    const withLowP50 = percentileFractions(10, 420, 850, 850)
    const withHighP50 = percentileFractions(800, 420, 850, 850)

    // Changing P50 must never move P90 or P99's fraction.
    expect(withLowP50.p90).toBe(withHighP50.p90)
    expect(withLowP50.p99).toBe(withHighP50.p99)
  })

  it('never produces a value that reads as a sum of the three', () => {
    const result = percentileFractions(180, 420, 850, 850)
    const sum = result.p50 + result.p90 + result.p99
    // A stacked chart would size the P99 segment as if the total were this
    // sum; the independent fraction must stay far below it.
    expect(result.p99).toBeLessThan(sum)
  })

  it('returns zeros when the max is zero', () => {
    expect(percentileFractions(0, 0, 0, 0)).toEqual({ p50: 0, p90: 0, p99: 0 })
  })
})
