import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { cx } from '@/lib/cx'

import { IconButton } from './IconButton'
import styles from './Dialog.module.css'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface DialogProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly title: string
  /** Hides the visible title while keeping it available to assistive tech. */
  readonly hideTitle?: boolean
  readonly description?: string
  readonly children: ReactNode
  readonly footer?: ReactNode
  readonly size?: 'sm' | 'md' | 'lg'
  /** `sheet` docks the panel to the inline-end edge — used for inspectors. */
  readonly variant?: 'modal' | 'sheet' | 'palette'
  readonly className?: string
}

/**
 * Modal dialog.
 *
 * Handles the full accessible contract: focus moves in on open, is trapped for
 * as long as the dialog is open, Escape closes, and focus is restored to the
 * element that opened it. Background content is inert to assistive tech via
 * `aria-modal` plus a scroll lock.
 */
export function Dialog({
  open,
  onClose,
  title,
  hideTitle = false,
  description,
  children,
  footer,
  size = 'md',
  variant = 'modal',
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  // Remember what had focus so it can be restored on close.
  useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null
    }
  }, [open])

  // Move focus into the panel once it exists.
  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    if (!panel) return

    const first = panel.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel).focus()
  }, [open])

  // Restore focus on unmount/close.
  useEffect(() => {
    if (open) return
    const toRestore = restoreFocusRef.current
    if (toRestore && document.contains(toRestore)) {
      toRestore.focus()
    }
  }, [open])

  // Lock background scroll while open.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      // Wrap focus at both ends so Tab never escapes the dialog.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  if (!open) return null

  return createPortal(
    <div
      className={cx(styles.overlay, styles[`overlay_${variant}`])}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={styles.scrim}
        onClick={onClose}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cx(styles.panel, styles[variant], styles[size], className)}
      >
        <div className={cx(styles.header, hideTitle && styles.headerBare)}>
          <div className={styles.headerText}>
            <h2
              id={titleId}
              className={cx('text-headline-md', hideTitle && 'sr-only')}
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className={cx('text-body-sm', 'text-muted')}>
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label="Close dialog" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>

        <div className={styles.body}>{children}</div>

        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
