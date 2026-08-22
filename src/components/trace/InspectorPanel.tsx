import { Copy, X } from 'lucide-react'
import { useState } from 'react'

import type { TraceEvent } from '@/domain'
import { Badge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/IconButton'
import { EmptyState } from '@/components/ui/States'
import {
  formatCost,
  formatJson,
  formatNumber,
  formatShortDuration,
  formatTraceTime,
} from '@/lib/format'
import { cx } from '@/lib/cx'

import { TRACE_VISUALS } from './traceVisuals'
import styles from './trace.module.css'

function Field({
  label,
  value,
  mono = true,
  tone,
}: {
  readonly label: string
  readonly value: string
  readonly mono?: boolean
  readonly tone?: 'danger'
}) {
  return (
    <div className={styles.field}>
      <dt className={cx('text-label-caps', styles.fieldLabel)}>{label}</dt>
      <dd
        className={cx(
          mono ? 'mono' : 'text-body-sm',
          styles.fieldValue,
          tone === 'danger' && styles.fieldValueDanger,
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/**
 * Event Details inspector.
 *
 * Renders the typed metadata for the selected trace event. Which fields appear
 * is driven by what the event actually carries, so a tool call shows its
 * arguments while a policy intervention shows its risk level and the inputs it
 * blocked.
 */
export function InspectorPanel({
  event,
  onClose,
}: {
  readonly event: TraceEvent | null
  readonly onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  if (!event) {
    return (
      <div className={styles.inspectorEmpty}>
        <EmptyState
          title="No event selected"
          description="Select a step on the execution trace to inspect its metadata."
        />
      </div>
    )
  }

  const visual = TRACE_VISUALS[event.type]
  const Icon = visual.icon

  const payload =
    event.policy?.toolInputs ??
    event.toolCall?.arguments ??
    event.toolResult?.payload ??
    null

  async function copyPayload() {
    if (payload === null) return
    try {
      await navigator.clipboard.writeText(formatJson(payload))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard access can be denied; the JSON stays visible and selectable.
      setCopied(false)
    }
  }

  return (
    <div className={styles.inspector}>
      <header className={styles.inspectorHeader}>
        <h2 className={cx('text-headline-md', styles.inspectorTitle)}>
          Event Details
        </h2>
        <IconButton label="Close event details" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </header>

      <div className={styles.inspectorBody}>
        <div className={styles.inspectorSummary}>
          <span
            className={cx(
              styles.inspectorIcon,
              styles[`toneBg_${visual.tone}`],
            )}
            aria-hidden="true"
          >
            <Icon size={18} />
          </span>
          <div className={styles.inspectorSummaryText}>
            <p className={styles.inspectorEventName}>{event.label}</p>
            {event.toolCall || event.policy ? (
              <p className={cx('text-code-sm', styles.inspectorEventMeta)}>
                Tool: {event.toolCall?.name ?? event.policy?.toolName}
              </p>
            ) : null}
          </div>
        </div>

        <dl className={styles.fieldGrid}>
          <Field label="Start Time" value={formatTraceTime(event.timestamp)} />
          <Field
            label="Duration"
            value={
              event.durationMs !== null
                ? `${formatNumber(event.durationMs)}ms`
                : '—'
            }
          />

          {event.policy ? (
            <>
              <Field label="Policy ID" value={event.policy.policyId} />
              <div className={styles.field}>
                <dt className={cx('text-label-caps', styles.fieldLabel)}>
                  Risk Level
                </dt>
                <dd className={styles.fieldValue}>
                  <Badge tone="danger" mono>
                    {event.policy.riskLevel.toUpperCase()}
                  </Badge>
                </dd>
              </div>
            </>
          ) : null}

          {event.modelId ? (
            <Field label="Model" value={event.modelId} />
          ) : null}
          {event.tokens ? (
            <Field label="Tokens" value={formatNumber(event.tokens)} />
          ) : null}
          {event.costUsd !== undefined ? (
            <Field label="Cost" value={formatCost(event.costUsd)} />
          ) : null}
          {event.approval ? (
            <>
              <Field label="Decision" value={event.approval.decision} />
              <Field
                label="Wait"
                value={formatShortDuration(event.approval.waitMs)}
              />
            </>
          ) : null}
        </dl>

        {event.policy ? (
          <section className={styles.inspectorSection}>
            <h3 className={cx('text-label-caps', styles.sectionLabel)}>
              Intervention Context
            </h3>
            <p className={cx('text-body-sm', styles.contextBox)}>
              {event.policy.context}
            </p>
          </section>
        ) : null}

        {/*
          The control plane's own record of the step, not a model's private
          internal reasoning — ZEVQORA does not surface that.
        */}
        {event.summary ? (
          <section className={styles.inspectorSection}>
            <h3 className={cx('text-label-caps', styles.sectionLabel)}>
              Execution Summary
            </h3>
            <p className={cx('text-body-sm', styles.contextBox)}>
              {event.summary}
            </p>
          </section>
        ) : null}

        {event.approval?.note ? (
          <section className={styles.inspectorSection}>
            <h3 className={cx('text-label-caps', styles.sectionLabel)}>
              Approver Note
            </h3>
            <p className={cx('text-body-sm', styles.contextBox)}>
              {event.approval.note}
            </p>
          </section>
        ) : null}

        {payload !== null ? (
          <section className={styles.inspectorSection}>
            <div className={styles.sectionHeader}>
              <h3 className={cx('text-label-caps', styles.sectionLabel)}>
                {event.toolResult ? 'Tool Output' : 'Tool Inputs'}
              </h3>
              <button
                type="button"
                className={styles.copyButton}
                onClick={() => void copyPayload()}
              >
                <Copy size={12} aria-hidden="true" />
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className={cx('text-code-sm', styles.codeBlock)}>
              <code>{formatJson(payload)}</code>
            </pre>
          </section>
        ) : null}

        {event.output && event.type === 'agent_response' ? (
          <section className={styles.inspectorSection}>
            <h3 className={cx('text-label-caps', styles.sectionLabel)}>
              Response
            </h3>
            <p className={cx('text-body-sm', styles.contextBox)}>
              {event.output}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  )
}
