/**
 * Formatters for the technical data that renders in IBM Plex Mono.
 *
 * Everything is deterministic and locale-independent (`en-US`) so the demo
 * dataset renders identically for every viewer and in tests.
 */

/** `00:00:04.2` — the duration format used by the Runs Explorer. */
export function formatDuration(ms: number): string {
  const totalSeconds = ms / 1000
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = seconds.toFixed(1).padStart(4, '0')

  return `${hh}:${mm}:${ss}`
}

/** `4.2s` / `1448ms` — compact form for trace nodes and metric captions. */
export function formatShortDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1000)
  return `${minutes}m ${seconds}s`
}

/** `$0.0194` — costs need more precision than a currency formatter gives. */
export function formatCost(usd: number): string {
  if (usd >= 100) return `$${usd.toFixed(2)}`
  if (usd >= 1) return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(4)}`
}

/** `$386.42` — headline totals stay at two decimals. */
export function formatCostTotal(usd: number): string {
  return `$${usd.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** `24,891` */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/** `97.8%` */
export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

/** `14:32:01.045` — trace timestamps carry millisecond precision. */
export function formatTraceTime(iso: string): string {
  const date = new Date(iso)
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  const ss = String(date.getUTCSeconds()).padStart(2, '0')
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

/** `2026-08-21 14:32:01 UTC` */
export function formatAbsoluteTime(iso: string): string {
  const date = new Date(iso)
  const y = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  const ss = String(date.getUTCSeconds()).padStart(2, '0')
  return `${y}-${mo}-${d} ${hh}:${mm}:${ss} UTC`
}

/** `2026-08-21 05:52` — the Evaluations table format. */
export function formatDateTimeShort(iso: string): string {
  const date = new Date(iso)
  const y = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  return `${y}-${mo}-${d} ${hh}:${mm}`
}

/**
 * `Just now` / `2 mins ago` / `14m ago`.
 *
 * Takes an explicit `now` so the demo dataset renders the same relative
 * labels the approved screens show, instead of drifting with wall time.
 */
export function formatRelativeTime(iso: string, now: Date | number): string {
  const then = new Date(iso).getTime()
  const reference = typeof now === 'number' ? now : now.getTime()
  const deltaSeconds = Math.round((reference - then) / 1000)

  if (deltaSeconds < 10) return 'Just now'
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`

  const minutes = Math.round(deltaSeconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  return `${days}d ago`
}

/** `~1,240` — live runs report accruing counters as approximate. */
export function formatTokens(total: number, estimated: boolean): string {
  return `${estimated ? '~' : ''}${formatNumber(total)}`
}

/** Pretty-prints mock payloads for the trace and simulator code blocks. */
export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

/** Single-line JSON, as the trace's inline argument previews render it. */
export function formatJsonInline(value: unknown): string {
  return JSON.stringify(value)
}

/**
 * Formats an experiment metric's raw value with its unit — `94%`, `1.2s`,
 * `$0.040`. Kept unit-aware so the Experiments comparison charts never draw
 * accuracy, latency and cost on a single implied scale.
 */
export function formatExperimentMetric(
  value: number,
  unit: 'percent' | 'seconds' | 'usd',
): string {
  if (unit === 'percent') return `${value}%`
  if (unit === 'seconds') return `${value}s`
  return `$${value.toFixed(value < 1 ? 3 : 2)}`
}
