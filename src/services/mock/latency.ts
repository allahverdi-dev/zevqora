/**
 * Simulated transport latency for the mock repositories.
 *
 * Repositories resolve after a short delay so every screen exercises its real
 * loading state instead of rendering fully-formed on first paint. Tests set
 * the delay to zero via `setMockLatency(0)` to stay fast and deterministic.
 */

let latencyMs = 140

export function setMockLatency(ms: number): void {
  latencyMs = ms
}

export function getMockLatency(): number {
  return latencyMs
}

export function delay<T>(value: T): Promise<T> {
  if (latencyMs <= 0) return Promise.resolve(value)
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), latencyMs)
  })
}

/** Deep-freezes nothing; simply hands back a defensive shallow copy. */
export function clone<T>(value: readonly T[]): T[] {
  return value.slice()
}
