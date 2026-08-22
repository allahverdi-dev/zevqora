import { useEffect, useMemo, useRef, useState } from 'react'
import { History, Play, Send, Square } from 'lucide-react'

import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select, type SelectOption } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/States'
import { ApprovalGate } from '@/features/simulator/ApprovalGate'
import { TranscriptEvent } from '@/features/simulator/TranscriptEvent'
import { useSimulator } from '@/features/simulator/useSimulator'
import { isTerminal } from '@/features/simulator/types'
import { useAsync } from '@/hooks/useAsync'
import {
  formatCost,
  formatJson,
  formatNumber,
  formatShortDuration,
} from '@/lib/format'
import { cx } from '@/lib/cx'

import styles from '@/features/simulator/simulator.module.css'

const DEFAULT_MESSAGE =
  'A customer is requesting a refund for a duplicate charge on order #ORD-9921. Please investigate.'

const ENVIRONMENT_OVERRIDES = {
  context: {
    user_id: 'usr_9x8f7d6e',
    role: 'admin',
    current_time: '2026-08-21T14:32:00Z',
  },
  mock_tools: [
    {
      name: 'search_customer',
      status: 'success',
      delay_ms: 100,
      response_fixture: 'customer_8219x',
    },
    {
      name: 'get_transactions',
      status: 'success',
      delay_ms: 245,
      response_fixture: 'duplicate_charge_set',
    },
    {
      name: 'refund_payment',
      status: 'requires_approval',
      policy: 'POL-042',
    },
  ],
}

const STATUS_LABEL: Record<string, string> = {
  idle: 'Idle',
  running: 'Running',
  awaiting_approval: 'Awaiting approval',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  failed: 'Failed',
}

/**
 * Simulator — a working, deterministic agent execution sandbox.
 *
 * The run genuinely progresses through its states: tool calls resolve, the
 * policy engine halts execution at the approval gate, and the branch taken
 * after the decision changes the outcome.
 */
export function SimulatorPage() {
  const services = useServices()
  const { toast } = useToast()
  const { state, start, approve, reject, cancel, reset } = useSimulator()

  const agents = useAsync(() => services.agents.list(), [services])
  const [agentId, setAgentId] = useState('agt_114a')
  const [message, setMessage] = useState(DEFAULT_MESSAGE)

  const transcriptRef = useRef<HTMLOListElement>(null)

  const agentOptions = useMemo<readonly SelectOption[]>(
    () =>
      agents.state.status === 'success'
        ? agents.state.data.map((agent) => ({
            value: agent.id,
            label: agent.name,
          }))
        : [{ value: agentId, label: 'Loading agents…' }],
    [agents.state, agentId],
  )

  const selectedAgent =
    agents.state.status === 'success'
      ? agents.state.data.find((agent) => agent.id === agentId)
      : undefined

  const isRunning =
    state.status === 'running' || state.status === 'awaiting_approval'

  // Follow the transcript as events arrive.
  useEffect(() => {
    const node = transcriptRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [state.events.length, state.finalOutput])

  // Announce the terminal outcome once.
  useEffect(() => {
    if (state.status === 'completed') {
      toast({
        tone: 'success',
        title: 'Run complete',
        detail: 'The agent finished after the approved tool executed.',
      })
    } else if (state.status === 'rejected') {
      toast({
        tone: 'info',
        title: 'Run terminated by policy gate',
        detail: 'The high-risk tool was never executed.',
      })
    }
  }, [state.status, toast])

  function runTest() {
    const trimmed = message.trim()
    if (!trimmed) {
      toast({
        tone: 'error',
        title: 'Enter a test message',
        detail: 'The agent needs an input to execute against.',
      })
      return
    }
    start(agentId, trimmed)
  }

  return (
    <div className="page page--flush">
      {/* Toolbar ----------------------------------------------------------- */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h1 className={cx('text-headline-md', styles.toolbarTitle)}>
            Simulator
          </h1>
          <Badge tone="signal" mono>
            ENV: SANDBOX
          </Badge>
          <span
            className={cx(styles.statusPill, styles[`status_${state.status}`])}
            role="status"
          >
            <span
              className={cx(
                'status-dot',
                styles.statusDot,
                state.status === 'running' && 'pulse',
              )}
              aria-hidden="true"
            />
            <span className="text-code-sm">
              {STATUS_LABEL[state.status] ?? state.status}
            </span>
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <Select
            label="Agent under test"
            prefix="Agent:"
            value={agentId}
            options={agentOptions}
            onChange={setAgentId}
          />

          <Button
            variant="secondary"
            icon={<History size={18} />}
            onClick={() =>
              toast({
                tone: 'info',
                title: 'Run history is not part of this release',
                detail: 'Persisting simulator runs requires a backend.',
              })
            }
          >
            History
          </Button>

          {isRunning ? (
            <Button variant="danger" icon={<Square size={18} />} onClick={cancel}>
              Cancel
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={<Play size={18} />}
              onClick={runTest}
            >
              Run Test
            </Button>
          )}
        </div>
      </header>

      <div className={styles.split}>
        {/* Interaction column --------------------------------------------- */}
        <section className={styles.interaction} aria-label="Agent interaction">
          <header className={styles.columnHeader}>
            <h2 className={cx('text-label-caps', styles.columnTitle)}>
              Agent Interaction
            </h2>
            <Badge tone="neutral" mono>
              Model: {selectedAgent?.model.label ?? '—'}
            </Badge>
          </header>

          <ol
            ref={transcriptRef}
            className={styles.transcript}
            aria-label="Execution transcript"
            aria-busy={state.status === 'running'}
          >
            {state.events.length === 0 ? (
              <li>
                <EmptyState
                  title="No run yet"
                  description="Choose an agent, enter a test message, then select Run Test to execute a simulated run."
                  action={
                    <Button variant="signal" size="sm" onClick={runTest}>
                      Run Test
                    </Button>
                  }
                />
              </li>
            ) : (
              state.events.map((event) => (
                <TranscriptEvent key={event.id} event={event} />
              ))
            )}

            {state.pendingApproval ? (
              <li>
                <ApprovalGate
                  approval={state.pendingApproval}
                  onApprove={approve}
                  onReject={reject}
                />
              </li>
            ) : null}

            {state.finalOutput ? (
              <li className={styles.agentRow}>
                <span className={styles.agentAvatar} aria-hidden="true">
                  <Play size={16} />
                </span>
                <div className={styles.agentBubble}>
                  <p className={cx('text-label-caps', styles.finalLabel)}>
                    Final output
                  </p>
                  <p className={cx('text-body-md', styles.agentText)}>
                    {state.finalOutput}
                  </p>
                </div>
              </li>
            ) : null}
          </ol>

          {/* Composer */}
          <div className={styles.composer}>
            <label htmlFor="simulator-message" className="sr-only">
              Test message to send to the agent
            </label>
            <input
              id="simulator-message"
              type="text"
              className={styles.composerInput}
              placeholder="Type a message to the agent..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !isRunning) runTest()
              }}
              disabled={isRunning}
            />
            <button
              type="button"
              className={styles.composerSend}
              onClick={runTest}
              disabled={isRunning}
              aria-label="Run test with this message"
            >
              <Send size={20} aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* Environment column --------------------------------------------- */}
        <aside className={styles.environment} aria-label="Environment overrides">
          <header className={styles.columnHeader}>
            <h2 className={cx('text-label-caps', styles.columnTitle)}>
              Environment Overrides
            </h2>
          </header>

          <div className={styles.environmentBody}>
            <pre className={cx('text-code-md', styles.envCode)}>
              <code>{formatJson(ENVIRONMENT_OVERRIDES)}</code>
            </pre>

            <section className={styles.metricsBlock} aria-label="Run telemetry">
              <h3 className={cx('text-label-caps', styles.columnTitle)}>
                Live Telemetry
              </h3>
              <dl className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <dt className={cx('text-label-caps', styles.metricLabel)}>
                    Tokens
                  </dt>
                  <dd className={cx('mono', 'tabular', styles.metricValue)}>
                    {formatNumber(state.metrics.tokens)}
                  </dd>
                </div>
                <div className={styles.metric}>
                  <dt className={cx('text-label-caps', styles.metricLabel)}>
                    Cost
                  </dt>
                  <dd className={cx('mono', 'tabular', styles.metricValue)}>
                    {formatCost(state.metrics.costUsd)}
                  </dd>
                </div>
                <div className={styles.metric}>
                  <dt className={cx('text-label-caps', styles.metricLabel)}>
                    Latency
                  </dt>
                  <dd className={cx('mono', 'tabular', styles.metricValue)}>
                    {formatShortDuration(state.metrics.elapsedMs)}
                  </dd>
                </div>
                <div className={styles.metric}>
                  <dt className={cx('text-label-caps', styles.metricLabel)}>
                    Tool Calls
                  </dt>
                  <dd className={cx('mono', 'tabular', styles.metricValue)}>
                    {state.metrics.toolCalls}
                  </dd>
                </div>
              </dl>
            </section>

            <section className={styles.fixtures} aria-label="Active fixtures">
              <h3 className={cx('text-label-caps', styles.columnTitle)}>
                Active Fixtures
              </h3>
              <div className={styles.fixtureList}>
                <Badge tone="tertiary" mono>
                  duplicate_charge_set.json
                </Badge>
                <Badge tone="tertiary" mono>
                  customer_8219x.json
                </Badge>
              </div>
            </section>

            {isTerminal(state.status) ? (
              <Button variant="secondary" fullWidth onClick={reset}>
                Reset simulator
              </Button>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
