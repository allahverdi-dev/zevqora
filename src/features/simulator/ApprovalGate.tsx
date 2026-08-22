import { Gavel } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { formatJson } from '@/lib/format'
import { cx } from '@/lib/cx'

import type { PendingApproval } from './types'
import styles from './simulator.module.css'

/**
 * The human-in-the-loop checkpoint.
 *
 * Rendered as an assertive live region: when execution halts, a screen-reader
 * user is told immediately rather than discovering it by exploring.
 */
export function ApprovalGate({
  approval,
  onApprove,
  onReject,
}: {
  readonly approval: PendingApproval
  readonly onApprove: () => void
  readonly onReject: () => void
}) {
  return (
    <section
      className={styles.gate}
      role="alertdialog"
      aria-live="assertive"
      aria-labelledby="approval-gate-title"
      aria-describedby="approval-gate-context"
    >
      <header className={styles.gateHeader}>
        <span className={styles.gateIcon} aria-hidden="true">
          <Gavel size={18} />
        </span>
        <div className={styles.gateTitleBlock}>
          <h3 id="approval-gate-title" className={styles.gateTitle}>
            Human approval required
          </h3>
          <p className={cx('text-code-sm', styles.gateRule)}>
            {approval.policyId.toUpperCase().replace('_', '-')} ·{' '}
            {approval.rule}
          </p>
        </div>
      </header>

      <p id="approval-gate-context" className={cx('text-body-sm', styles.gateContext)}>
        {approval.context}
      </p>

      <div className={styles.gateTool}>
        <p className={cx('text-label-caps', styles.gateToolLabel)}>
          Requested tool
        </p>
        <p className={cx('mono', styles.gateToolName)}>{approval.toolName}</p>
      </div>

      <pre className={cx('text-code-sm', styles.gateArgs)}>
        <code>{formatJson(approval.arguments)}</code>
      </pre>

      <div className={styles.gateActions}>
        <Button variant="danger" onClick={onReject}>
          Reject
        </Button>
        <Button variant="signal" onClick={onApprove}>
          Approve
        </Button>
      </div>
    </section>
  )
}
