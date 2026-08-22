import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

import { IconButton } from '@/components/ui/IconButton'
import { cx } from '@/lib/cx'

import styles from './ToastProvider.module.css'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  readonly id: number
  readonly tone: ToastTone
  readonly title: string
  readonly detail?: string
}

interface ToastContextValue {
  readonly toast: (toast: Omit<Toast, 'id'>) => void
  readonly dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION_MS = 5000

const TONE_ICON = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const

/**
 * Application-level toasts.
 *
 * Replaces `alert()` entirely. Messages are announced through an `aria-live`
 * region so screen-reader users hear confirmations without a focus change;
 * errors use `assertive`, everything else is polite.
 */
export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (input: Omit<Toast, 'id'>) => {
      const id = nextId.current++
      setToasts((current) => [...current, { ...input, id }])

      const timer = setTimeout(() => dismiss(id), TOAST_DURATION_MS)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  // Clear every pending timer if the provider unmounts mid-flight.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region}>
        <div aria-live="polite" aria-atomic="false" className={styles.stack}>
          {toasts
            .filter((item) => item.tone !== 'error')
            .map((item) => (
              <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
            ))}
        </div>
        <div aria-live="assertive" aria-atomic="false" className={styles.stack}>
          {toasts
            .filter((item) => item.tone === 'error')
            .map((item) => (
              <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({
  toast,
  onDismiss,
}: {
  readonly toast: Toast
  readonly onDismiss: (id: number) => void
}) {
  const Icon = TONE_ICON[toast.tone]

  return (
    <div className={cx(styles.toast, styles[toast.tone])} role="status">
      <Icon size={18} aria-hidden="true" className={styles.icon} />
      <div className={styles.text}>
        <p className={styles.title}>{toast.title}</p>
        {toast.detail ? (
          <p className={cx('text-body-sm', styles.detail)}>{toast.detail}</p>
        ) : null}
      </div>
      <IconButton
        label="Dismiss notification"
        size="sm"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={16} />
      </IconButton>
    </div>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a <ToastProvider>.')
  }

  return context
}
