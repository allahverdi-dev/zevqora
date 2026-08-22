import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import type { MetricTone, UsageMetric } from '@/domain'
import { cx } from '@/lib/cx'

import styles from './MetricCard.module.css'

/** Caption glyphs, keyed to the metric ids from the approved overview. */
const CAPTION_ICON: Record<string, LucideIcon> = {
  runs: TrendingUp,
  success: CheckCircle2,
  latency: Gauge,
  cost: TrendingUp,
  approvals: ShieldCheck,
  incidents: AlertTriangle,
}

// CSS-module members resolve as `string | undefined` under
// noUncheckedIndexedAccess; `cx` discards undefined entries.
const TONE_CLASS: Record<MetricTone, string | undefined> = {
  positive: styles.tonePositive,
  negative: styles.toneNegative,
  neutral: styles.toneNeutral,
  signal: styles.toneSignal,
}

export function MetricCard({ metric }: { readonly metric: UsageMetric }) {
  const CaptionIcon = CAPTION_ICON[metric.id] ?? TrendingUp

  const body = (
    <>
      <p className={cx('text-label-caps', styles.label)}>{metric.label}</p>
      <p
        className={cx(
          'mono',
          'tabular',
          styles.value,
          metric.id === 'approvals' && styles.valueSignal,
          metric.id === 'incidents' && styles.valueError,
        )}
      >
        {metric.value}
      </p>
      <p className={cx(styles.caption, TONE_CLASS[metric.tone])}>
        <CaptionIcon size={14} aria-hidden="true" />
        <span className={cx('text-code-sm', 'tabular')}>{metric.caption}</span>
      </p>
    </>
  )

  if (metric.href) {
    return (
      <Link
        to={metric.href}
        className={cx(styles.card, styles.cardInteractive)}
      >
        {body}
      </Link>
    )
  }

  return <div className={styles.card}>{body}</div>
}
