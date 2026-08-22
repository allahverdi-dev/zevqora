import { useState } from 'react'
import { X } from 'lucide-react'

import type { ApprovalRequest } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Panel } from '@/components/ui/Panel'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { useSession } from '@/hooks/useSession'
import { cx } from '@/lib/cx'
import type { AsyncState } from '@/hooks/useAsync'

import styles from './dashboard.module.css'

/**
 * Pending approvals queue.
 *
 * Decisions resolve against the approval repository and are reflected
 * optimistically, so the queue behaves like the real thing within the session.
 */
export function ApprovalsPanel({
  state,
  onRetry,
}: {
  readonly state: AsyncState<ApprovalRequest[]>
  readonly onRetry: () => void
}) {
  const services = useServices()
  const { toast } = useToast()
  const { session } = useSession()
  const [resolved, setResolved] = useState<ReadonlySet<string>>(new Set())

  async function decide(
    approval: ApprovalRequest,
    decision: 'approved' | 'rejected',
  ) {
    setResolved((current) => new Set(current).add(approval.id))

    try {
      await services.approvals.resolve(
        approval.id,
        decision,
        session.account.email,
      )
      toast({
        tone: decision === 'approved' ? 'success' : 'info',
        title:
          decision === 'approved'
            ? 'Approval granted'
            : 'Approval request dismissed',
        detail: approval.title,
      })
    } catch {
      // Roll the optimistic removal back if the repository rejects.
      setResolved((current) => {
        const next = new Set(current)
        next.delete(approval.id)
        return next
      })
      toast({
        tone: 'error',
        title: 'Could not record the decision',
        detail: 'Please try again.',
      })
    }
  }

  const visible =
    state.status === 'success'
      ? state.data.filter((approval) => !resolved.has(approval.id))
      : []

  return (
    <Panel
      title={
        <>
          <span className={cx('status-dot', styles.pendingDot)} aria-hidden="true" />
          Pending Approvals ({state.status === 'success' ? state.data.length : 0})
        </>
      }
    >
      {state.status === 'loading' ? (
        <LoadingState label="Loading approvals" rows={3} />
      ) : state.status === 'error' ? (
        <ErrorState
          description="The approval queue could not be loaded."
          onRetry={onRetry}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Queue clear"
          description="No agent runs are waiting on a human decision."
        />
      ) : (
        <ul className={styles.approvalList} role="list">
          {visible.slice(0, 3).map((approval) => (
            <li key={approval.id} className={styles.approvalItem}>
              <div className={styles.approvalText}>
                <p className={cx('mono', styles.approvalTitle)}>
                  {approval.title}
                </p>
                <p className={cx('text-body-sm', styles.approvalMeta)}>
                  Requested by {approval.requestedBy}
                </p>
              </div>
              <div className={styles.approvalActions}>
                <IconButton
                  label={`Dismiss ${approval.title}`}
                  size="sm"
                  onClick={() => void decide(approval, 'rejected')}
                >
                  <X size={16} />
                </IconButton>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void decide(approval, 'approved')}
                >
                  Review
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
