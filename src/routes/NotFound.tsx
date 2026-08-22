import { FileQuestion } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { LinkButton } from '@/components/ui/Button'
import { cx } from '@/lib/cx'

import styles from './NotFound.module.css'

/** Invalid-route state, rendered inside the application shell. */
export function NotFound() {
  const location = useLocation()

  return (
    <div className="page">
      <section className={styles.panel} aria-labelledby="not-found-heading">
        <span className={styles.icon} aria-hidden="true">
          <FileQuestion size={22} />
        </span>
        <p className={cx('text-code-sm', styles.code)}>HTTP 404</p>
        <h1 id="not-found-heading" className={cx('text-display-lg', styles.title)}>
          Route not found
        </h1>
        <p className={cx('text-body-md', styles.body)}>
          No screen is registered for{' '}
          <code className={styles.path}>{location.pathname}</code>.
        </p>
        <div className={styles.actions}>
          <LinkButton to="/dashboard" variant="primary">
            Go to Dashboard
          </LinkButton>
          <LinkButton to="/runs" variant="secondary">
            Browse Runs
          </LinkButton>
        </div>
      </section>
    </div>
  )
}
