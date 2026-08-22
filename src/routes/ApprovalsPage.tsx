import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react'

import type { ApprovalRequest, ApprovalUrgency } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { PageHeader } from '@/components/shell/PageHeader'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import { useSession } from '@/hooks/useSession'
import { now } from '@/lib/clock'
import { formatRelativeTime } from '@/lib/format'
import { cx } from '@/lib/cx'

import tableStyles from '@/components/ui/DataTable.module.css'
import styles from '@/features/approvals/approvals.module.css'

const URGENCY_FILTERS: readonly { readonly value: ApprovalUrgency; readonly label: string }[] = [
  { value: 'high', label: 'High Urgency' },
  { value: 'medium', label: 'Med' },
  { value: 'low', label: 'Low' },
]

const URGENCY_BADGE_TONE: Record<ApprovalUrgency, BadgeTone> = {
  critical: 'danger',
  high: 'danger',
  medium: 'signal',
  low: 'neutral',
}

/** Approval Queue (`/approvals`) — the human-in-the-loop control surface. */
export function ApprovalsPage() {
  const services = useServices()
  const { toast } = useToast()
  const { session } = useSession()

  const [urgencyFilter, setUrgencyFilter] = useState<ApprovalUrgency | null>(null)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [pendingDecision, setPendingDecision] = useState<string | null>(null)

  const approvals = useAsync(
    () => services.approvals.list({ urgency: urgencyFilter ?? 'all', search }),
    [services, urgencyFilter, search, version],
  )
  const history = useAsync(() => services.approvals.history(20), [services, version])

  // The queue shows pending requests only — once resolved, a request moves to
  // Recent History below rather than lingering in the queue.
  const list = useMemo(
    () =>
      approvals.state.status === 'success'
        ? approvals.state.data.filter((approval) => approval.status === 'pending')
        : [],
    [approvals.state],
  )

  const pendingList = list

  useEffect(() => {
    if (selectedId !== null || list.length === 0) return
    setSelectedId(list[0]?.id ?? null)
  }, [list, selectedId])

  const selected: ApprovalRequest | null = useMemo(
    () => list.find((approval) => approval.id === selectedId) ?? list[0] ?? null,
    [list, selectedId],
  )

  const historyList = history.state.status === 'success' ? history.state.data : []
  const approvedCount = historyList.filter((entry) => entry.decision === 'approved').length
  const rejectedCount = historyList.filter((entry) => entry.decision === 'rejected').length

  async function decide(approval: ApprovalRequest, decision: 'approved' | 'rejected') {
    setPendingDecision(approval.id)
    try {
      await services.approvals.resolve(approval.id, decision, session.account.email)
      setVersion((v) => v + 1)
      toast({
        tone: decision === 'approved' ? 'success' : 'info',
        title: decision === 'approved' ? 'Request approved' : 'Request rejected',
        detail: `${approval.requestCode} — ${approval.action}`,
      })

      // Move selection to the next pending item so the reviewer can keep going.
      const remaining = pendingList.filter((item) => item.id !== approval.id)
      setSelectedId(remaining[0]?.id ?? null)
    } catch {
      toast({ tone: 'error', title: 'Could not record the decision' })
    } finally {
      setPendingDecision(null)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Approval Queue"
        icon={<ShieldCheck size={26} />}
        description="Review and resolve agent actions gated by policy."
      />

      <div className={styles.filterBar}>
        <span className="text-label-caps text-muted">Filter by:</span>
        <div className={styles.urgencyGroup}>
          {URGENCY_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              data-tone={option.value}
              className={cx(
                styles.urgencyChip,
                urgencyFilter === option.value && styles.urgencyChipActive,
              )}
              aria-pressed={urgencyFilter === option.value}
              onClick={() =>
                setUrgencyFilter((current) => (current === option.value ? null : option.value))
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className={styles.searchField}>
          <Search size={16} aria-hidden="true" className={styles.searchIcon} />
          <label htmlFor="approvals-search" className="sr-only">
            Search by agent ID or requestor
          </label>
          <input
            id="approvals-search"
            type="search"
            className={styles.searchInput}
            placeholder="Agent ID or Requestor..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {approvals.state.status === 'loading' ? (
        <LoadingState label="Loading approval queue" rows={5} />
      ) : approvals.state.status === 'error' ? (
        <ErrorState description="The approval queue could not be loaded." onRetry={approvals.reload} />
      ) : list.length === 0 ? (
        <EmptyState variant="filtered" title="No approvals match" description="Try a different filter." />
      ) : (
        <div className={styles.layout}>
          <ul className={styles.queue} role="list" aria-label="Approval requests">
            {list.map((approval) => {
              const resolved = approval.status !== 'pending'
              return (
                <li key={approval.id}>
                  <button
                    type="button"
                    className={cx(
                      styles.queueItem,
                      approval.id === selected?.id && styles.queueItemSelected,
                      resolved && styles.queueItemResolved,
                    )}
                    aria-current={approval.id === selected?.id ? 'true' : undefined}
                    onClick={() => setSelectedId(approval.id)}
                  >
                    <span className={styles.queueHead}>
                      <span className={cx('mono', styles.queueCode)}>
                        {approval.requestCode}
                      </span>
                      <Badge tone={URGENCY_BADGE_TONE[approval.severity]} mono>
                        {approval.severity}
                      </Badge>
                      <span className={cx('text-code-sm', styles.queueTime)}>
                        {resolved
                          ? approval.status
                          : formatRelativeTime(approval.requestedAt, now())}
                      </span>
                    </span>
                    <span className={cx('mono', styles.queueAction)}>{approval.action}</span>
                    <span className={styles.queueMeta}>
                      <TrendingUp size={14} aria-hidden="true" />
                      <span className="text-body-sm">{approval.subsystem}</span>
                    </span>
                    <span className={styles.queuePolicy}>
                      <span className="text-label-caps">POLICY: </span>
                      <span className={cx('text-body-sm', styles.queuePolicyValue)}>
                        {approval.detail}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {selected ? (
            <section className={styles.detail} aria-label={`${selected.action} detail`}>
              <header className={styles.detailHeader}>
                <div>
                  <div className={styles.breadcrumb}>
                    <span className={cx('mono', 'text-body-sm')} style={{ color: 'var(--color-primary-container)' }}>
                      {selected.requestCode}
                    </span>
                    <ArrowRight size={14} aria-hidden="true" />
                    <span className="text-body-sm">{selected.subsystem}</span>
                  </div>
                  <h2 className={cx('text-display-lg', styles.detailTitle)}>
                    {selected.action}
                  </h2>
                </div>
                {selected.detail ? (
                  <div className={styles.policyFlag}>
                    <ShieldCheck size={18} aria-hidden="true" style={{ color: 'var(--color-error)' }} />
                    <span className="text-body-sm">{selected.detail}</span>
                  </div>
                ) : null}
              </header>

              <div className={styles.contextGrid}>
                <div className={styles.contextBox}>
                  <h3 className="text-label-caps text-muted">Context</h3>
                  {selected.context.map((fact) => (
                    <div
                      key={fact.label}
                      className={cx(
                        styles.contextRow,
                        fact.emphasis === 'critical' && styles.contextRowCritical,
                      )}
                    >
                      <span className={styles.contextLabel}>{fact.label}:</span>
                      <span
                        className={cx(
                          styles.contextValue,
                          fact.emphasis === 'critical' && styles.contextValueCritical,
                        )}
                      >
                        {fact.value}
                      </span>
                    </div>
                  ))}
                  {selected.riskScore !== null ? (
                    <div className={cx(styles.contextRow, styles.contextRowCritical)}>
                      <span className={styles.contextLabel}>Risk Score:</span>
                      <span className={cx(styles.contextValue, styles.contextValueCritical)}>
                        {selected.riskScore}/100
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className={styles.riskNote}>
                  <span className={styles.riskIcon} aria-hidden="true">
                    <TrendingUp size={22} />
                  </span>
                  <p className="text-body-sm text-muted">
                    {selected.riskNote ?? 'No anomalies detected for this request.'}
                  </p>
                </div>
              </div>

              <div className={styles.summary}>
                <h3 className={cx('text-label-caps', styles.summaryTitle)}>
                  Execution Summary
                </h3>
                <ol className={styles.summaryList}>
                  {selected.executionSummary.map((step) => (
                    <li key={step.label} className={styles.summaryStep}>
                      <span
                        className={cx(
                          styles.summaryDot,
                          step.state === 'active' && styles.summaryDotActive,
                          step.state === 'blocked' && styles.summaryDotBlocked,
                        )}
                        aria-hidden="true"
                      />
                      <div>
                        <span
                          className={cx(
                            styles.summaryLabel,
                            step.state === 'blocked' && styles.summaryLabelBlocked,
                          )}
                        >
                          {step.label}
                        </span>
                        <span
                          className={cx(
                            styles.summaryDetail,
                            step.state === 'blocked' && styles.summaryDetailBlocked,
                          )}
                        >
                          {step.detail}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {selected.status === 'pending' ? (
                <div className={styles.actions}>
                  <Button
                    variant="danger"
                    size="lg"
                    icon={<X size={18} />}
                    disabled={pendingDecision === selected.id}
                    onClick={() => void decide(selected, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="signal"
                    size="lg"
                    icon={<Check size={18} />}
                    disabled={pendingDecision === selected.id}
                    onClick={() => void decide(selected, 'approved')}
                  >
                    Approve
                  </Button>
                </div>
              ) : (
                <p className="text-body-sm text-muted" role="status">
                  This request was {selected.status} by {selected.resolvedBy ?? 'a reviewer'}.
                </p>
              )}
            </section>
          ) : (
            <div className={styles.detail}>
              <EmptyState title="No request selected" description="Choose a request from the queue." />
            </div>
          )}
        </div>
      )}

      <div>
        <button
          type="button"
          className={styles.historyToggle}
          aria-expanded={historyOpen}
          onClick={() => setHistoryOpen((value) => !value)}
        >
          <span className="text-label-caps">Recent History</span>
          <span className={styles.historyStats}>
            <span className="text-code-sm">
              Last 24h:{' '}
              <span className={styles.historyApproved}>{approvedCount} Approved</span> /{' '}
              <span className={styles.historyRejected}>{rejectedCount} Rejected</span>
            </span>
            {historyOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </span>
        </button>

        {historyOpen ? (
          <div className={styles.historyPanel}>
            <table className={tableStyles.table}>
              <caption className="sr-only">Recent approval decisions.</caption>
              <thead>
                <tr className={tableStyles.headRow}>
                  <th scope="col" className={tableStyles.th}>Agent</th>
                  <th scope="col" className={tableStyles.th}>Action</th>
                  <th scope="col" className={tableStyles.th}>Decision</th>
                  <th scope="col" className={tableStyles.th}>Admin</th>
                  <th scope="col" className={cx(tableStyles.th, tableStyles.alignEnd)}>Time</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((entry) => (
                  <tr key={entry.id} className={tableStyles.row}>
                    <td className={cx(tableStyles.td, 'mono')}>{entry.requestCode}</td>
                    <td className={tableStyles.td}>{entry.action}</td>
                    <td className={tableStyles.td}>
                      <span
                        className={
                          entry.decision === 'approved'
                            ? styles.historyApproved
                            : styles.historyRejected
                        }
                      >
                        {entry.decision === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                    <td className={tableStyles.td}>{entry.admin}</td>
                    <td className={cx(tableStyles.td, tableStyles.alignEnd, 'text-code-sm')}>
                      {formatRelativeTime(entry.decidedAt, now())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
