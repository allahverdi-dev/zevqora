import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bot, ChevronsDownUp, ChevronsUpDown, PanelRight } from 'lucide-react'

import type { TraceEvent } from '@/domain'
import { RUN_STATUS_LABELS } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { InspectorPanel } from '@/components/trace/InspectorPanel'
import { TraceEventRow } from '@/components/trace/TraceEventRow'
import { Button, LinkButton } from '@/components/ui/Button'
import { RunStatusIcon } from '@/components/ui/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import {
  formatAbsoluteTime,
  formatCost,
  formatNumber,
  formatShortDuration,
} from '@/lib/format'
import { cx } from '@/lib/cx'

import traceStyles from '@/components/trace/trace.module.css'
import styles from './TracePage.module.css'

/** Events that carry a payload worth collapsing. */
function hasDetail(event: TraceEvent): boolean {
  return Boolean(
    event.toolCall ||
      event.toolResult ||
      event.policy ||
      event.approval ||
      (event.type === 'model_invocation' && event.input) ||
      (event.type === 'agent_response' && event.output),
  )
}

export function TracePage() {
  const { runId = '' } = useParams()
  const services = useServices()

  const run = useAsync(() => services.runs.getById(runId), [services, runId])
  const trace = useAsync(() => services.traces.getByRunId(runId), [services, runId])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(
    new Set(),
  )
  const [inspectorOpen, setInspectorOpen] = useState(false)

  const events = useMemo(
    () => (trace.state.status === 'success' ? (trace.state.data?.events ?? []) : []),
    [trace.state],
  )

  // Select the policy intervention by default — it is the step an operator
  // opens a trace to understand. Falls back to the first event.
  useEffect(() => {
    if (events.length === 0 || selectedId !== null) return
    const policy = events.find((event) => event.type === 'policy_intervention')
    setSelectedId(policy?.id ?? events[0]?.id ?? null)
  }, [events, selectedId])

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  )

  const allCollapsed =
    events.filter(hasDetail).length > 0 &&
    events.filter(hasDetail).every((event) => collapsedIds.has(event.id))

  const toggleAll = useCallback(() => {
    setCollapsedIds(
      allCollapsed
        ? new Set()
        : new Set(events.filter(hasDetail).map((event) => event.id)),
    )
  }, [allCollapsed, events])

  const toggleOne = useCallback((id: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectEvent = useCallback((event: TraceEvent) => {
    setSelectedId(event.id)
    setInspectorOpen(true)
  }, [])

  // Escape closes the inspector when it is an overlay sheet.
  useEffect(() => {
    if (!inspectorOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setInspectorOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorOpen])

  /* Loading / error / not-found -------------------------------------------- */

  if (run.state.status === 'loading' || trace.state.status === 'loading') {
    return (
      <div className="page">
        <LoadingState label="Loading execution trace" rows={8} />
      </div>
    )
  }

  if (run.state.status === 'error' || trace.state.status === 'error') {
    return (
      <div className="page">
        <ErrorState
          title="Trace unavailable"
          description="The execution trace for this run could not be loaded."
          onRetry={() => {
            run.reload()
            trace.reload()
          }}
        />
      </div>
    )
  }

  if (!run.state.data || !trace.state.data) {
    return (
      <div className="page">
        <EmptyState
          title="Run not found"
          description={`No run is recorded with the id ${runId}.`}
          action={
            <LinkButton to="/runs" variant="secondary" size="sm">
              Back to Runs Explorer
            </LinkButton>
          }
        />
      </div>
    )
  }

  const currentRun = run.state.data

  return (
    <div className="page page--flush">
      {/* Run summary bar --------------------------------------------------- */}
      <header className={styles.summaryBar}>
        <div className={styles.summaryLeft}>
          <div className={styles.summaryField}>
            <span className={cx('text-label-caps', styles.summaryLabel)}>
              Run ID
            </span>
            <span className={cx('mono', styles.summaryValue)}>
              {currentRun.id}
            </span>
          </div>

          <span className="divider--vertical" aria-hidden="true" />

          <div className={styles.summaryField}>
            <span className={cx('text-label-caps', styles.summaryLabel)}>
              Agent
            </span>
            <Link to="/agents" className={styles.agentLink}>
              <Bot size={16} aria-hidden="true" className="text-signal" />
              <span className="text-body-sm">{currentRun.agentName}</span>
            </Link>
          </div>

          <span className="divider--vertical" aria-hidden="true" />

          <div className={styles.summaryField}>
            <span className={cx('text-label-caps', styles.summaryLabel)}>
              Environment
            </span>
            <span className={styles.envValue}>
              <span
                className={cx('status-dot', styles.envDot, 'pulse')}
                aria-hidden="true"
              />
              <span className={cx('text-code-sm', styles.envLabel)}>
                {currentRun.environment.toUpperCase()}
              </span>
            </span>
          </div>
        </div>

        <div className={styles.summaryRight}>
          <div className={styles.summaryField}>
            <span className={cx('text-label-caps', styles.summaryLabel)}>
              Status
            </span>
            <span className={styles.statusValue}>
              <RunStatusIcon status={currentRun.status} />
              <span className="text-body-sm">
                {currentRun.status === 'success'
                  ? 'Completed'
                  : RUN_STATUS_LABELS[currentRun.status]}
              </span>
            </span>
          </div>

          <div className={styles.summaryField}>
            <span className={cx('text-label-caps', styles.summaryLabel)}>
              Duration
            </span>
            <span className={cx('mono', 'tabular', styles.summaryValue)}>
              {formatShortDuration(currentRun.durationMs)}
            </span>
          </div>

          <div className={styles.summaryField}>
            <span className={cx('text-label-caps', styles.summaryLabel)}>
              Tokens (Total)
            </span>
            <span className={cx('mono', 'tabular', styles.summaryValue)}>
              {formatNumber(currentRun.tokens.total)}
            </span>
          </div>

          <div className={styles.summaryField}>
            <span className={cx('text-label-caps', styles.summaryLabel)}>
              Cost
            </span>
            <span className={cx('mono', 'tabular', styles.summaryValue)}>
              {formatCost(currentRun.costUsd)}
            </span>
          </div>

          <div className={styles.summaryField}>
            <span className={cx('text-label-caps', styles.summaryLabel)}>
              Timestamp
            </span>
            <time
              className={cx('text-code-sm', styles.timestamp)}
              dateTime={currentRun.startedAt}
            >
              {formatAbsoluteTime(currentRun.startedAt)}
            </time>
          </div>
        </div>
      </header>

      {/* Split view -------------------------------------------------------- */}
      <div className="split-view">
        <div className={cx('split-view__main', styles.traceColumn)}>
          <div className={styles.traceInner}>
            <div className={styles.traceHeader}>
              <h1 className={cx('text-headline-md', styles.traceTitle)}>
                Execution Trace
              </h1>
              <div className={styles.traceActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={
                    allCollapsed ? (
                      <ChevronsUpDown size={16} />
                    ) : (
                      <ChevronsDownUp size={16} />
                    )
                  }
                  onClick={toggleAll}
                >
                  {allCollapsed ? 'Expand All' : 'Collapse All'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<PanelRight size={16} />}
                  onClick={() => setInspectorOpen(true)}
                  className={styles.inspectorToggle}
                >
                  Details
                </Button>
              </div>
            </div>

            <ol
              className={traceStyles.traceList}
              aria-label="Execution trace events"
            >
              {events.map((event) => (
                <TraceEventRow
                  key={event.id}
                  event={event}
                  selected={event.id === selectedId}
                  expanded={!collapsedIds.has(event.id)}
                  hasDetail={hasDetail(event)}
                  onSelect={selectEvent}
                  onToggle={toggleOne}
                />
              ))}
            </ol>
          </div>
        </div>

        <aside
          className="split-view__inspector"
          data-open={inspectorOpen}
          aria-label="Event details"
        >
          <InspectorPanel
            event={selectedEvent}
            onClose={() => setInspectorOpen(false)}
          />
        </aside>
      </div>
    </div>
  )
}
