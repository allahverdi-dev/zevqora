import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleDot,
  Loader,
  PauseCircle,
  XCircle,
} from 'lucide-react'
import type { ReactNode } from 'react'

import type {
  AgentStatus,
  EvaluationStatus,
  ExperimentStatus,
  IncidentStatus,
  RunStatus,
} from '@/domain'
import { cx } from '@/lib/cx'

import styles from './StatusBadge.module.css'

/**
 * Status treatments.
 *
 * Every status pairs a colour with an icon *and* a text label, so meaning
 * never rests on colour alone.
 */
export type StatusTone =
  | 'success'
  | 'running'
  | 'failed'
  | 'warning'
  | 'neutral'

interface StatusDescriptor {
  readonly tone: StatusTone
  readonly label: string
  readonly icon: ReactNode
}

const ICON_SIZE = 14

const RUN_STATUS_MAP: Record<RunStatus, StatusDescriptor> = {
  success: {
    tone: 'success',
    label: 'SUCCESS',
    icon: <CheckCircle2 size={ICON_SIZE} />,
  },
  running: {
    tone: 'running',
    label: 'RUNNING',
    icon: <Loader size={ICON_SIZE} />,
  },
  failed: {
    tone: 'failed',
    label: 'FAILED',
    icon: <XCircle size={ICON_SIZE} />,
  },
  awaiting_approval: {
    tone: 'warning',
    label: 'AWAITING',
    icon: <PauseCircle size={ICON_SIZE} />,
  },
  cancelled: {
    tone: 'neutral',
    label: 'CANCELLED',
    icon: <Ban size={ICON_SIZE} />,
  },
}

const AGENT_STATUS_MAP: Record<AgentStatus, StatusDescriptor> = {
  active: {
    tone: 'running',
    label: 'ACTIVE RUNTIME',
    icon: <CircleDot size={ICON_SIZE} />,
  },
  idle: {
    tone: 'neutral',
    label: 'IDLE',
    icon: <CircleDot size={ICON_SIZE} />,
  },
  degraded: {
    tone: 'warning',
    label: 'DEGRADED',
    icon: <AlertTriangle size={ICON_SIZE} />,
  },
  paused: {
    tone: 'neutral',
    label: 'PAUSED',
    icon: <PauseCircle size={ICON_SIZE} />,
  },
  offline: {
    tone: 'failed',
    label: 'ERROR STATE',
    icon: <AlertTriangle size={ICON_SIZE} />,
  },
}

const EVALUATION_STATUS_MAP: Record<EvaluationStatus, StatusDescriptor> = {
  passed: {
    tone: 'success',
    label: 'PASSED',
    icon: <CheckCircle2 size={ICON_SIZE} />,
  },
  failed: {
    tone: 'failed',
    label: 'FAILED',
    icon: <XCircle size={ICON_SIZE} />,
  },
  running: {
    tone: 'running',
    label: 'RUNNING',
    icon: <Loader size={ICON_SIZE} />,
  },
  queued: {
    tone: 'neutral',
    label: 'QUEUED',
    icon: <CircleDot size={ICON_SIZE} />,
  },
}

const EXPERIMENT_STATUS_MAP: Record<ExperimentStatus, StatusDescriptor> = {
  draft: {
    tone: 'neutral',
    label: 'DRAFT',
    icon: <CircleDot size={ICON_SIZE} />,
  },
  running: {
    tone: 'running',
    label: 'RUNNING',
    icon: <CircleDot size={ICON_SIZE} />,
  },
  completed: {
    tone: 'success',
    label: 'COMPLETED',
    icon: <CheckCircle2 size={ICON_SIZE} />,
  },
  stopped: {
    tone: 'neutral',
    label: 'STOPPED',
    icon: <Ban size={ICON_SIZE} />,
  },
}

const INCIDENT_STATUS_MAP: Record<IncidentStatus, StatusDescriptor> = {
  open: { tone: 'failed', label: 'OPEN', icon: <AlertTriangle size={ICON_SIZE} /> },
  investigating: {
    tone: 'warning',
    label: 'INVESTIGATING',
    icon: <CircleDot size={ICON_SIZE} />,
  },
  mitigated: {
    tone: 'success',
    label: 'MITIGATED',
    icon: <CheckCircle2 size={ICON_SIZE} />,
  },
  resolved: {
    tone: 'neutral',
    label: 'RESOLVED',
    icon: <CheckCircle2 size={ICON_SIZE} />,
  },
}

interface StatusBadgeProps {
  readonly tone: StatusTone
  readonly label: string
  readonly icon?: ReactNode
  /** Chip form used in tables; `dot` is the inline form used on cards. */
  readonly variant?: 'chip' | 'dot'
  readonly className?: string
}

export function StatusBadge({
  tone,
  label,
  icon,
  variant = 'chip',
  className,
}: StatusBadgeProps) {
  if (variant === 'dot') {
    return (
      <span className={cx(styles.dotWrap, styles[tone], className)}>
        <span
          className={cx(styles.dot, tone === 'running' && 'pulse')}
          aria-hidden="true"
        />
        <span className={styles.dotLabel}>{label}</span>
      </span>
    )
  }

  return (
    <span className={cx(styles.chip, styles[tone], className)}>
      {icon ? (
        <span className={styles.chipIcon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {label}
    </span>
  )
}

export function RunStatusBadge({
  status,
  variant = 'chip',
  className,
}: {
  readonly status: RunStatus
  readonly variant?: 'chip' | 'dot'
  readonly className?: string
}) {
  const descriptor = RUN_STATUS_MAP[status]
  return (
    <StatusBadge
      tone={descriptor.tone}
      label={descriptor.label}
      icon={descriptor.icon}
      variant={variant}
      className={className}
    />
  )
}

export function AgentStatusBadge({
  status,
  className,
}: {
  readonly status: AgentStatus
  readonly className?: string
}) {
  const descriptor = AGENT_STATUS_MAP[status]
  return (
    <StatusBadge
      tone={descriptor.tone}
      label={descriptor.label}
      variant="dot"
      className={className}
    />
  )
}

export function EvaluationStatusBadge({
  status,
  className,
}: {
  readonly status: EvaluationStatus
  readonly className?: string
}) {
  const descriptor = EVALUATION_STATUS_MAP[status]
  return (
    <StatusBadge
      tone={descriptor.tone}
      label={descriptor.label}
      className={className}
    />
  )
}

export function ExperimentStatusBadge({
  status,
  className,
}: {
  readonly status: ExperimentStatus
  readonly className?: string
}) {
  const descriptor = EXPERIMENT_STATUS_MAP[status]
  return (
    <StatusBadge
      tone={descriptor.tone}
      label={descriptor.label}
      variant="dot"
      className={className}
    />
  )
}

export function IncidentStatusBadge({
  status,
  className,
}: {
  readonly status: IncidentStatus
  readonly className?: string
}) {
  const descriptor = INCIDENT_STATUS_MAP[status]
  return (
    <StatusBadge
      tone={descriptor.tone}
      label={descriptor.label}
      icon={descriptor.icon}
      className={className}
    />
  )
}

/** Bare status icon for dense table cells. Always paired with a text label. */
export function RunStatusIcon({ status }: { readonly status: RunStatus }) {
  const descriptor = RUN_STATUS_MAP[status]
  return (
    <span
      className={cx(styles.statusIcon, styles[descriptor.tone])}
      role="img"
      aria-label={descriptor.label}
      title={descriptor.label}
    >
      {descriptor.icon}
    </span>
  )
}
