import { ChevronDown, type LucideIcon } from 'lucide-react'
import { useId } from 'react'

import { cx } from '@/lib/cx'

import styles from './Select.module.css'

export interface SelectOption {
  readonly value: string
  readonly label: string
}

interface SelectProps {
  readonly label: string
  readonly value: string
  readonly options: readonly SelectOption[]
  readonly onChange: (value: string) => void
  /** Prefix rendered inside the control, e.g. "Status:". */
  readonly prefix?: string
  readonly icon?: LucideIcon
  /** Renders the lime status dot used by the environment filter. */
  readonly signalDot?: boolean
  readonly className?: string
}

/**
 * Native `<select>` styled as a filter control.
 *
 * Deliberately native rather than a custom listbox: it is keyboard accessible,
 * screen-reader correct and mobile-friendly for free, and the approved design
 * needs no behaviour a native select cannot provide.
 */
export function Select({
  label,
  value,
  options,
  onChange,
  prefix,
  icon: Icon,
  signalDot,
  className,
}: SelectProps) {
  const id = useId()
  const selected = options.find((option) => option.value === value)

  return (
    <div className={cx(styles.wrap, className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <span className={styles.face} aria-hidden="true">
        {signalDot ? (
          <span className={cx('status-dot', styles.dot)} />
        ) : Icon ? (
          <Icon size={16} className={styles.icon} />
        ) : null}
        <span className={styles.faceText}>
          {prefix ? `${prefix} ` : ''}
          {selected?.label ?? ''}
        </span>
        <ChevronDown size={16} className={styles.chevron} />
      </span>

      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
