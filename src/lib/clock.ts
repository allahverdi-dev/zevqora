/**
 * The application's reference clock.
 *
 * Relative timestamps ("2 mins ago") are rendered against this rather than
 * `Date.now()`, so the demo dataset reads consistently and tests are stable.
 * It lives in `lib` rather than `mocks` because the UI legitimately needs a
 * clock — pointing components at the mock layer to get one would breach the
 * repository boundary.
 *
 * Against a real backend this becomes `() => Date.now()` and nothing else
 * changes.
 */

/** The instant the demo dataset is anchored to. */
export const DEMO_INSTANT = new Date('2026-08-21T14:32:05.200Z')

let reference: () => number = () => DEMO_INSTANT.getTime()

/** Current reference time, in epoch milliseconds. */
export function now(): number {
  return reference()
}

/** Swaps the clock — used by tests and by a future live-data build. */
export function setClock(next: () => number): void {
  reference = next
}
