import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

import styles from './PageHeader.module.css'

interface PageHeaderProps {
  readonly title: string
  readonly description?: string
  /** Icon rendered beside the title, as on Runs Explorer. */
  readonly icon?: ReactNode
  /** Small status element rendered before the description text. */
  readonly eyebrow?: ReactNode
  readonly actions?: ReactNode
  /** Adds the 1px rule under the header block. */
  readonly bordered?: boolean
}

export function PageHeader({
  title,
  description,
  icon,
  eyebrow,
  actions,
  bordered = true,
}: PageHeaderProps) {
  return (
    <header className={cx(styles.header, bordered && styles.bordered)}>
      <div className={styles.titleBlock}>
        <div className={styles.titleRow}>
          {icon ? (
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <h1 className={cx('text-display-lg', styles.title)}>{title}</h1>
        </div>
        {description ? (
          <p className={cx('text-body-md', styles.description)}>
            {eyebrow}
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  )
}
