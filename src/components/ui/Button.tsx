import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cx } from '@/lib/cx'

import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'signal' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface BaseProps {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  /** Leading icon. Icon-only buttons must use `IconButton` instead. */
  readonly icon?: ReactNode
  readonly trailingIcon?: ReactNode
  readonly children: ReactNode
  readonly className?: string
  readonly fullWidth?: boolean
}

type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

interface LinkButtonProps extends BaseProps {
  /** Internal route. Renders a real anchor so middle-click and copy work. */
  readonly to: string
}

function classesFor(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean | undefined,
  className: string | undefined,
): string {
  return cx(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  )
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  trailingIcon,
  children,
  className,
  fullWidth,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classesFor(variant, size, fullWidth, className)}
      {...rest}
    >
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
      {trailingIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
    </button>
  )
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  icon,
  trailingIcon,
  children,
  className,
  fullWidth,
  to,
}: LinkButtonProps) {
  return (
    <Link to={to} className={classesFor(variant, size, fullWidth, className)}>
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
      {trailingIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
    </Link>
  )
}
