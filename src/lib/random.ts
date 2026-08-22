/**
 * Seeded pseudo-random generator (mulberry32).
 *
 * The demo dataset must be identical on every load and in every test run —
 * a control plane whose numbers shuffle on refresh reads as fake. All
 * generated mock data draws from this rather than `Math.random`.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0

  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Integer in `[min, max]`, inclusive. */
export function randomInt(
  next: () => number,
  min: number,
  max: number,
): number {
  return Math.floor(next() * (max - min + 1)) + min
}

/** Picks one element. Callers guarantee a non-empty list. */
export function pick<T>(next: () => number, items: readonly T[]): T {
  const item = items[Math.floor(next() * items.length)]
  if (item === undefined) {
    throw new Error('pick() called with an empty collection')
  }
  return item
}

/**
 * Picks one element using weights. Weights need not sum to 1; they are
 * normalised. Used to give the run dataset a realistic status mix rather than
 * a uniform one.
 */
export function pickWeighted<T>(
  next: () => number,
  entries: readonly (readonly [T, number])[],
): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let threshold = next() * total

  for (const [value, weight] of entries) {
    threshold -= weight
    if (threshold <= 0) return value
  }

  const last = entries[entries.length - 1]
  if (!last) throw new Error('pickWeighted() called with no entries')
  return last[0]
}

/** Lowercase hex string of the given length — used for realistic run ids. */
export function hexId(next: () => number, length: number): string {
  const alphabet = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(next() * alphabet.length)]
  }
  return out
}
