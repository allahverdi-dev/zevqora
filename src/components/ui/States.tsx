import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, SearchX } from 'lucide-react'

import { cx } from '@/lib/cx'

import { Button } from './Button'
import styles from './States.module.css'

/**
 * Loading, empty and error states.
 *
 * Every asynchronous surface in the application renders one of these rather
 * than a blank region, so a slow or failed read is always legible.
 */

/** Skeleton shimmer sized to the content it stands in for. */
export function Skeleton({
  width = '100%',
  height = 16,
  className,
}: {
  readonly width?: string | number
  readonly height?: string | number
  readonly className?: string
}) {
  return (
    <span
      className={cx(styles.skeleton, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

/** Announces progress to assistive tech while a region loads. */
export function LoadingState({
  label = 'Loading',
  rows = 4,
  className,
}: {
  readonly label?: string
  readonly rows?: number
  readonly className?: string
}) {
  return (
    <div className={cx(styles.loading, className)} role="status" aria-live="polite">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          height={index === 0 ? 20 : 14}
          width={index === 0 ? '38%' : `${92 - index * 7}%`}
        />
      ))}
    </div>
  )
}

interface EmptyStateProps {
  readonly title: string
  readonly description?: string
  readonly icon?: ReactNode
  readonly action?: ReactNode
  /** Filtered-empty reads differently from genuinely-empty. */
  readonly variant?: 'empty' | 'filtered'
  readonly className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = 'empty',
  className,
}: EmptyStateProps) {
  const fallbackIcon =
    variant === 'filtered' ? <SearchX size={22} /> : <Inbox size={22} />

  return (
    <div className={cx(styles.state, className)}>
      <span className={styles.stateIcon} aria-hidden="true">
        {icon ?? fallbackIcon}
      </span>
      <p className={styles.stateTitle}>{title}</p>
      {description ? (
        <p className={cx('text-body-sm', styles.stateDescription)}>
          {description}
        </p>
      ) : null}
      {action ? <div className={styles.stateAction}>{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = 'Request failed',
  description = 'The control plane could not complete this request.',
  onRetry,
  className,
}: {
  readonly title?: string
  readonly description?: string
  readonly onRetry?: () => void
  readonly className?: string
}) {
  return (
    <div className={cx(styles.state, styles.error, className)} role="alert">
      <span className={cx(styles.stateIcon, styles.errorIcon)} aria-hidden="true">
        <AlertTriangle size={22} />
      </span>
      <p className={styles.stateTitle}>{title}</p>
      <p className={cx('text-body-sm', styles.stateDescription)}>
        {description}
      </p>
      {onRetry ? (
        <div className={styles.stateAction}>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  )
}
