import { useState } from 'react'
import { ArrowRight, Bot, Gavel, User } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { cx } from '@/lib/cx'

import styles from './TraceDemo.module.css'

type Decision = 'pending' | 'approved' | 'rejected'

/**
 * The landing page's product demonstration.
 *
 * A compact, working slice of the real trace experience: three trace nodes
 * connected by the Trace Line, ending at a live approval gate. Approving or
 * rejecting resolves the gate in place, which is the whole product thesis in
 * one interaction.
 */
export function TraceDemo() {
  const [decision, setDecision] = useState<Decision>('pending')

  return (
    <div className={styles.panel}>
      <div className={styles.grid}>
        <div className={styles.traceColumn}>
          <div className={styles.panelHeader}>
            <span className={cx('text-code-md', styles.traceId)}>
              Trace_ID: x7f9_a1
            </span>
            <span className={styles.dots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>

          {/* Node 1 — the user request */}
          <div className={styles.node}>
            <div className={styles.rail}>
              <span className={styles.nodeIcon}>
                <User size={16} aria-hidden="true" />
              </span>
              <span className={styles.line} aria-hidden="true" />
            </div>
            <div className={styles.card}>
              <p className={cx('text-code-sm', styles.cardText)}>
                User Request: &ldquo;Refund order #88921 to original payment
                method.&rdquo;
              </p>
            </div>
          </div>

          {/* Node 2 — the agent's tool selection */}
          <div className={styles.node}>
            <div className={styles.rail}>
              <span className={cx(styles.nodeIcon, styles.nodeIconAgent)}>
                <span className={cx(styles.livePip, 'pulse')} aria-hidden="true" />
                <Bot size={16} aria-hidden="true" />
              </span>
              <span className={styles.line} aria-hidden="true" />
            </div>
            <div className={styles.card}>
              {/*
                An execution record written by the control plane — the tool the
                agent selected and why the application proceeded. Not a model's
                private internal reasoning.
              */}
              <p className={cx('text-code-sm', styles.cardMuted)}>
                // Decision summary: intent classified as REFUND. Retrieving
                order details…
              </p>
              <div className={styles.toolRow}>
                <span className={cx('text-code-sm', styles.toolChip)}>
                  Tool: get_order
                </span>
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className={styles.toolArrow}
                />
                <span className={cx('text-code-sm', styles.cardText)}>
                  Found order #88921 ($149.99)
                </span>
              </div>
            </div>
          </div>

          {/* Node 3 — the policy gate */}
          <div className={styles.node}>
            <div className={styles.rail}>
              <span
                className={cx(
                  styles.nodeIcon,
                  decision === 'pending'
                    ? styles.nodeIconPolicy
                    : decision === 'approved'
                      ? styles.nodeIconApproved
                      : styles.nodeIconRejected,
                )}
              >
                <Gavel size={16} aria-hidden="true" />
              </span>
            </div>

            <div
              className={cx(
                styles.card,
                styles.policyCard,
                decision === 'approved' && styles.policyCardApproved,
                decision === 'rejected' && styles.policyCardRejected,
              )}
            >
              <div className={styles.policyHeader}>
                <span className={styles.policyTitle}>
                  <span
                    className={cx(
                      'status-dot',
                      styles.policyDot,
                      decision === 'pending' && 'pulse',
                    )}
                    aria-hidden="true"
                  />
                  <span className={cx('text-label-caps', styles.policyLabel)}>
                    Policy Enforcement Triggered
                  </span>
                </span>
                <span className={cx('text-code-sm', styles.cardMuted)}>
                  Rule: require_approval(amount &gt; 100)
                </span>
              </div>

              <p className={cx('text-code-sm', styles.cardText)}>
                Agent requested execution of &apos;process_refund&apos; tool.
                Human approval required.
              </p>

              {decision === 'pending' ? (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={cx(styles.action, styles.approve)}
                    onClick={() => setDecision('approved')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className={cx(styles.action, styles.reject)}
                    onClick={() => setDecision('rejected')}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <div className={styles.outcome} role="status">
                  <p className={cx('text-code-sm', styles.outcomeText)}>
                    {decision === 'approved'
                      ? '→ process_refund executed. Refund rfnd_992 issued ($149.99).'
                      : '→ Execution denied by operator. Run terminated; no refund issued.'}
                  </p>
                  <button
                    type="button"
                    className={styles.reset}
                    onClick={() => setDecision('pending')}
                  >
                    Reset demo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trace context sidebar */}
        <aside className={styles.context} aria-label="Trace context">
          <h3 className={cx('text-label-caps', styles.contextHeading)}>
            Trace Context
          </h3>
          <dl className={styles.contextList}>
            {[
              ['Agent ID', 'agt_cx92'],
              ['Model', 'gpt-5.6'],
              ['Latency', '1.24s'],
              ['Tokens', '428'],
              ['Cost', '$0.008'],
            ].map(([label, value]) => (
              <div key={label} className={styles.contextRow}>
                <dt className={cx('text-body-sm', styles.contextLabel)}>
                  {label}
                </dt>
                <dd className={cx('text-code-sm', styles.contextValue)}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <h3 className={cx('text-label-caps', styles.contextHeading)}>
            Active Policies
          </h3>
          <div className={styles.policyChips}>
            <Badge tone="danger" mono>
              Refund &gt; $100
            </Badge>
            <Badge tone="signal" mono>
              PII Masking
            </Badge>
          </div>
        </aside>
      </div>
    </div>
  )
}
