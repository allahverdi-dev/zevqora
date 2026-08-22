import { useId, type ReactNode } from 'react'

import { cx } from '@/lib/cx'

import styles from './Tooltip.module.css'

interface TooltipProps {
  /** Text shown on hover and exposed to assistive tech via `aria-describedby`. */
  readonly label: string
  readonly children: ReactNode
  readonly className?: string
}

/**
 * A focusable, hoverable annotation for a static visual indicator.
 *
 * The trigger itself takes the tab stop (`tabIndex={0}`) so keyboard users
 * reach the same information mouse users get on hover — a native `title`
 * attribute alone does not reliably do this. The bubble is `role="tooltip"`
 * and referenced via `aria-describedby`, shown on `:hover` and
 * `:focus-visible` through CSS only, no positioning library.
 */
export function Tooltip({ label, children, className }: TooltipProps) {
  const id = useId()

  return (
    <span className={cx(styles.trigger, className)} tabIndex={0} aria-describedby={id}>
      {children}
      <span role="tooltip" id={id} className={styles.bubble}>
        {label}
      </span>
    </span>
  )
}
