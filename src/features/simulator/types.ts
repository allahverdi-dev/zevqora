import type { TraceEventType } from '@/domain'

/**
 * Simulator run lifecycle.
 *
 * `awaiting_approval` is a genuine pause: the engine holds its scheduled work
 * and does nothing until a decision arrives. `cancelled` and `rejected` are
 * distinct terminal states because they mean different things — one is the
 * operator abandoning the run, the other is the guardrail doing its job.
 */
export type SimulatorStatus =
  | 'idle'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'failed'

export const TERMINAL_STATUSES: readonly SimulatorStatus[] = [
  'completed',
  'rejected',
  'cancelled',
  'failed',
]

export function isTerminal(status: SimulatorStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

/** An event emitted onto the simulated transcript. */
export interface SimulatorEvent {
  readonly id: string
  readonly type: TraceEventType | 'user_message' | 'approval_decision'
  readonly label: string
  /** Milliseconds from run start. */
  readonly offsetMs: number
  readonly tokens?: number
  readonly costUsd?: number
  readonly toolName?: string
  readonly payload?: unknown
  readonly text?: string
  readonly tone?: 'default' | 'signal' | 'danger' | 'secondary'
}

/** Accumulated telemetry for the in-flight run. */
export interface SimulatorMetrics {
  readonly tokens: number
  readonly costUsd: number
  readonly elapsedMs: number
  readonly toolCalls: number
}

export interface SimulatorState {
  readonly status: SimulatorStatus
  readonly events: readonly SimulatorEvent[]
  readonly metrics: SimulatorMetrics
  /** Present only while `status === 'awaiting_approval'`. */
  readonly pendingApproval: PendingApproval | null
  readonly finalOutput: string | null
  readonly error: string | null
}

export interface PendingApproval {
  readonly toolName: string
  readonly policyId: string
  readonly policyName: string
  readonly rule: string
  readonly context: string
  readonly arguments: Record<string, unknown>
}

/** One scripted beat in a scenario. */
export interface ScenarioStep {
  /** Delay before this step emits, in milliseconds. */
  readonly delayMs: number
  readonly event: Omit<SimulatorEvent, 'id' | 'offsetMs'>
  /** Halts the engine here until an approval decision arrives. */
  readonly approval?: PendingApproval
}

export interface Scenario {
  readonly id: string
  readonly agentId: string
  readonly title: string
  /** Steps up to and including the approval gate. */
  readonly steps: readonly ScenarioStep[]
  /** Steps replayed when the operator approves. */
  readonly onApprove: readonly ScenarioStep[]
  /** Steps replayed when the operator rejects. */
  readonly onReject: readonly ScenarioStep[]
  readonly finalOutput: string
  readonly rejectedOutput: string
}
