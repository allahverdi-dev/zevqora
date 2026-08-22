import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

import styles from './Panel.module.css'

interface PanelProps {
  readonly title?: ReactNode
  readonly actions?: ReactNode
  readonly children: ReactNode
  /** `caps` renders the label-caps header used by the dashboard panels. */
  readonly headerStyle?: 'caps' | 'headline'
  readonly tone?: 'default' | 'danger'
  readonly className?: string
  readonly bodyClassName?: string
  readonly as?: 'section' | 'div'
  readonly labelledBy?: string
}

/**
 * Standard module container: 1px border, tonal surface, restrained radius.
 * The repeated plate that most of the application's content sits on.
 */
export function Panel({
  title,
  actions,
  children,
  headerStyle = 'caps',
  tone = 'default',
  className,
  bodyClassName,
  as: Element = 'section',
  labelledBy,
}: PanelProps) {
  return (
    <Element
      className={cx(styles.panel, tone === 'danger' && styles.danger, className)}
      aria-labelledby={labelledBy}
    >
      {title ? (
        <header className={styles.header}>
          <h2
            className={cx(
              headerStyle === 'caps' ? 'text-label-caps' : 'text-headline-md',
              styles.title,
            )}
          >
            {title}
          </h2>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx(styles.body, bodyClassName)}>{children}</div>
    </Element>
  )
}
