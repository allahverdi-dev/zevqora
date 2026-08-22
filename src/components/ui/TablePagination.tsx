import { ChevronLeft, ChevronRight } from 'lucide-react'

import { formatNumber } from '@/lib/format'
import { cx } from '@/lib/cx'

import styles from './TablePagination.module.css'

interface TablePaginationProps {
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly onPageChange: (page: number) => void
  /** Noun used in the range summary, e.g. "runs". */
  readonly itemLabel?: string
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  itemLabel = 'results',
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <nav className={styles.bar} aria-label="Pagination">
      <p className={cx('text-body-sm', styles.summary)}>
        Showing{' '}
        <span className="mono tabular">
          {formatNumber(first)}-{formatNumber(last)}
        </span>{' '}
        of <span className="mono tabular">{formatNumber(total)}</span>{' '}
        {itemLabel}
      </p>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.pageButton}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={18} aria-hidden="true" />
          <span className="sr-only">Previous page</span>
        </button>

        <span className={cx('text-code-sm', styles.pageIndicator)}>
          Page {page} / {totalPages}
        </span>

        <button
          type="button"
          className={styles.pageButton}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight size={18} aria-hidden="true" />
          <span className="sr-only">Next page</span>
        </button>
      </div>
    </nav>
  )
}
