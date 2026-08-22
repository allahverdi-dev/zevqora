import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

import styles from './Badge.module.css'

export type BadgeTone =
  | 'neutral'
  | 'signal'
  | 'danger'
  | 'warning'
  | 'secondary'
  | 'tertiary'

interface BadgeProps {
  readonly children: ReactNode
  readonly tone?: BadgeTone
  /** Mono badges carry technical values: model ids, tool names, ids. */
  readonly mono?: boolean
  readonly className?: string
}

export function Badge({
  children,
  tone = 'neutral',
  mono = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cx(styles.badge, styles[tone], mono && styles.mono, className)}
    >
      {children}
    </span>
  )
}
