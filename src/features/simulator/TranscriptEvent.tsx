import {
  Braces,
  Bot,
  CircleStop,
  Cpu,
  Gavel,
  ShieldCheck,
  User,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

import { formatJson, formatShortDuration } from '@/lib/format'
import { cx } from '@/lib/cx'

import type { SimulatorEvent } from './types'
import styles from './simulator.module.css'

const ICONS: Record<string, LucideIcon> = {
  user_message: User,
  run_started: Bot,
  model_invocation: Cpu,
  tool_call: Wrench,
  tool_result: Braces,
  policy_intervention: Gavel,
  approval_decision: ShieldCheck,
  agent_response: Bot,
  run_completed: CircleStop,
  run_failed: XCircle,
}

/** One line on the simulated agent transcript. */
export function TranscriptEvent({ event }: { readonly event: SimulatorEvent }) {
  const Icon = ICONS[event.type] ?? Bot

  // The user's own message renders as a chat bubble, everything else as a
  // structured trace line — matching the approved simulator layout.
  if (event.type === 'user_message') {
    return (
      <li className={styles.userRow}>
        <div className={styles.userBubble}>
          <p className={cx('text-body-md', styles.userText)}>{event.text}</p>
        </div>
        <span className={styles.userAvatar} aria-hidden="true">
          <User size={16} />
        </span>
      </li>
    )
  }

  if (event.type === 'agent_response') {
    return (
      <li className={styles.agentRow}>
        <span className={styles.agentAvatar} aria-hidden="true">
          <Bot size={16} />
          <span className={cx(styles.agentPip, 'pulse')} />
        </span>
        <div className={styles.agentBubble}>
          <p className={cx('text-body-md', styles.agentText)}>
            {event.text ?? 'Response generated.'}
          </p>
        </div>
      </li>
    )
  }

  const isPolicy = event.type === 'policy_intervention'
  const isFailure = event.type === 'run_failed'

  return (
    <li
      className={cx(
        styles.traceRow,
        isPolicy && styles.traceRowPolicy,
        isFailure && styles.traceRowFailed,
        event.type === 'approval_decision' && styles.traceRowApproval,
      )}
    >
      <div className={styles.traceRowHead}>
        <Icon
          size={16}
          aria-hidden="true"
          className={cx(styles.traceIcon, event.tone && styles[`tone_${event.tone}`])}
        />
        <span className={cx('text-code-md', styles.traceLabel)}>
          {event.label.toUpperCase().replace(/ /g, '_')}
          {event.toolName ? (
            <span className={styles.traceTool}>: {event.toolName}</span>
          ) : null}
        </span>
        <span className={cx('text-code-sm', 'tabular', styles.traceOffset)}>
          {formatShortDuration(event.offsetMs)}
        </span>
      </div>

      {event.text ? (
        <p className={cx('text-body-sm', styles.traceText)}>{event.text}</p>
      ) : null}

      {event.payload !== undefined ? (
        <pre className={cx('text-code-sm', styles.tracePayload)}>
          <code>{formatJson(event.payload)}</code>
        </pre>
      ) : null}
    </li>
  )
}
