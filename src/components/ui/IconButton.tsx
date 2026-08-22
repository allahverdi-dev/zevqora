import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cx } from '@/lib/cx'

import styles from './IconButton.module.css'

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Required: an icon alone carries no accessible name. */
  readonly label: string
  readonly children: ReactNode
  readonly className?: string
  readonly size?: 'sm' | 'md'
  readonly tone?: 'default' | 'danger'
}

export function IconButton({
  label,
  children,
  className,
  size = 'md',
  tone = 'default',
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.iconButton, styles[size], styles[tone], className)}
      {...rest}
    >
      <span aria-hidden="true" className={styles.glyph}>
        {children}
      </span>
    </button>
  )
}
