import { ChevronDown, ChevronRight } from 'lucide-react'

import type { TraceEvent } from '@/domain'
import { Badge } from '@/components/ui/Badge'
import {
  formatJsonInline,
  formatNumber,
  formatShortDuration,
  formatTraceTime,
} from '@/lib/format'
import { cx } from '@/lib/cx'

import { TRACE_VISUALS } from './traceVisuals'
import styles from './trace.module.css'

interface TraceEventRowProps {
  readonly event: TraceEvent
  readonly selected: boolean
  readonly expanded: boolean
  readonly hasDetail: boolean
  readonly onSelect: (event: TraceEvent) => void
  readonly onToggle: (id: string) => void
}

/**
 * One node on the execution trace.
 *
 * The row is a button so it is reachable by keyboard and announces its
 * selected state; the expand affordance is a separate control so collapsing a
 * payload does not also change the inspector selection.
 */
export function TraceEventRow({
  event,
  selected,
  expanded,
  hasDetail,
  onSelect,
  onToggle,
}: TraceEventRowProps) {
  const visual = TRACE_VISUALS[event.type]
  const Icon = visual.icon
  const isPolicy = event.type === 'policy_intervention'
  const isApproval = event.type === 'human_approval'

  return (
    <li
      className={cx(
        styles.node,
        isPolicy && styles.nodePolicy,
        isApproval && styles.nodeApproval,
      )}
    >
      {/* Control point on the Trace Line. */}
      <span
        className={cx(
          styles.nodeDot,
          selected && styles.nodeDotActive,
          isPolicy && styles.nodeDotPolicy,
        )}
        aria-hidden="true"
      />

      <button
        type="button"
        className={cx(styles.nodeButton, selected && styles.nodeButtonActive)}
        onClick={() => onSelect(event)}
        aria-current={selected ? 'true' : undefined}
      >
        <span className={styles.nodeHead}>
          <span className={styles.nodeTitle}>
            <Icon
              size={18}
              aria-hidden="true"
              className={cx(styles.nodeIcon, styles[`tone_${visual.tone}`])}
            />
            <span
              className={cx(
                styles.nodeLabel,
                (event.type === 'run_started' ||
                  event.type === 'tool_call' ||
                  isPolicy) &&
                  styles.nodeLabelStrong,
              )}
            >
              {event.label}
            </span>

            {event.modelId ? (
              <Badge tone="signal" mono>
                {event.modelId}
              </Badge>
            ) : null}

            {event.toolCall ? (
              <span className={cx('text-code-sm', styles.toolName)}>
                {event.toolCall.name}
              </span>
            ) : null}

            {isPolicy && event.policy ? (
              <span className={cx('text-code-sm', styles.toolName)}>
                {event.policy.toolName}
              </span>
            ) : null}

            {event.toolResult?.annotation ? (
              <Badge tone="neutral">{event.toolResult.annotation}</Badge>
            ) : null}

            {isApproval && event.approval?.override ? (
              <Badge tone="neutral">Admin Override</Badge>
            ) : null}

            {event.durationMs !== null && event.durationMs > 0 ? (
              <span className={cx('text-code-sm', styles.durationChip)}>
                {event.offsetMs === 0
                  ? '0ms'
                  : formatShortDuration(event.durationMs)}
              </span>
            ) : event.type === 'run_started' ? (
              <span className={cx('text-code-sm', styles.durationChip)}>0ms</span>
            ) : null}
          </span>

          <span className={styles.nodeMeta}>
            {event.tokens ? (
              <span className={cx('text-code-sm', 'tabular', styles.tokenCount)}>
                {formatNumber(event.tokens)} tkns
              </span>
            ) : null}
            {isApproval && event.approval ? (
              <span className={cx('text-code-sm', styles.waitLabel)}>
                +{formatShortDuration(event.approval.waitMs)} wait
              </span>
            ) : null}
            <time
              className={cx('text-code-sm', 'tabular', styles.nodeTime)}
              dateTime={event.timestamp}
            >
              {formatTraceTime(event.timestamp)}
            </time>
          </span>
        </span>

        {/* Body preview — the collapsible payload. */}
        {hasDetail && expanded ? (
          <span className={styles.nodeBody}>
            {event.type === 'model_invocation' && event.input ? (
              <span className={cx('text-body-sm', styles.quote)}>
                {event.input}
              </span>
            ) : null}

            {event.toolCall ? (
              <code className={cx('text-code-sm', styles.payload)}>
                {formatJsonInline(event.toolCall.arguments)}
              </code>
            ) : null}

            {event.toolResult ? (
              <code className={cx('text-code-sm', styles.payload)}>
                {formatJsonInline(event.toolResult.payload)}
              </code>
            ) : null}

            {isPolicy && event.policy ? (
              <code
                className={cx('text-code-sm', styles.payload, styles.payloadDanger)}
              >
                {formatJsonInline(event.policy.toolInputs)}
              </code>
            ) : null}

            {isApproval && event.approval ? (
              <span className={styles.approvedBy}>
                <span className={styles.approverAvatar} aria-hidden="true" />
                <span className={cx('text-body-sm', styles.approverText)}>
                  Approved by {event.approval.approvedBy}
                </span>
              </span>
            ) : null}

            {event.type === 'agent_response' && event.output ? (
              <span className={cx('text-body-sm', styles.responseText)}>
                {event.output}
              </span>
            ) : null}
          </span>
        ) : null}
      </button>

      {hasDetail ? (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => onToggle(event.id)}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `Collapse details for ${event.label}`
              : `Expand details for ${event.label}`
          }
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      ) : null}
    </li>
  )
}
