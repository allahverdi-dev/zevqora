import type { IsoTimestamp, PolicyId, RunId, TraceEventId } from './common'

/**
 * Kinds of event that can appear on an execution trace.
 *
 * Note on `model_invocation`: ZEVQORA records the *application-visible*
 * summary of a model step — the prompt sent, the tokens billed, and the
 * decision the application acted on. It deliberately does not model or expose
 * a provider's private internal reasoning; `summary` below is an execution
 * record written by the control plane, not hidden chain-of-thought.
 */
export type TraceEventType =
  | 'run_started'
  | 'model_invocation'
  | 'tool_call'
  | 'tool_result'
  | 'policy_intervention'
  | 'human_approval'
  | 'agent_response'
  | 'run_completed'
  | 'run_failed'

export const TRACE_EVENT_LABELS: Record<TraceEventType, string> = {
  run_started: 'Run Started',
  model_invocation: 'Model Invocation',
  tool_call: 'Tool Call',
  tool_result: 'Tool Result',
  policy_intervention: 'Policy Intervention',
  human_approval: 'Human Approved',
  agent_response: 'Agent Response generated',
  run_completed: 'Run Completed',
  run_failed: 'Run Failed',
}

export type TraceEventStatus = 'ok' | 'warning' | 'error' | 'pending'

export interface ToolCall {
  readonly name: string
  readonly arguments: Record<string, unknown>
  readonly durationMs: number
}

export interface ToolResult {
  readonly name: string
  readonly payload: unknown
  /** Set when the control plane matched the result against known data. */
  readonly annotation?: string
}

/**
 * A single node on the execution trace.
 *
 * `children` supports the nested tool-call groups the trace view can collapse.
 */
export interface TraceEvent {
  readonly id: TraceEventId
  readonly runId: RunId
  readonly type: TraceEventType
  readonly label: string
  readonly timestamp: IsoTimestamp
  /** Wall-clock offset from run start, in milliseconds. */
  readonly offsetMs: number
  readonly durationMs: number | null
  readonly status: TraceEventStatus
  readonly children?: readonly TraceEvent[]

  /* Optional, type-dependent metadata. */
  readonly modelId?: string
  readonly tokens?: number
  readonly costUsd?: number
  readonly toolCall?: ToolCall
  readonly toolResult?: ToolResult
  readonly policy?: PolicyIntervention
  readonly approval?: ApprovalRecord
  /**
   * Control-plane execution summary for this step: what the application
   * recorded about the decision it took. Not model-internal reasoning.
   */
  readonly summary?: string
  readonly input?: string
  readonly output?: string
}

export interface PolicyIntervention {
  readonly policyId: PolicyId
  readonly policyName: string
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical'
  readonly toolName: string
  /** Why the control plane halted execution here. */
  readonly context: string
  readonly toolInputs: Record<string, unknown>
}

export interface ApprovalRecord {
  readonly approvedBy: string
  readonly decision: 'approved' | 'rejected'
  readonly note?: string
  readonly waitMs: number
  readonly override: boolean
}

/** The full trace for one run, plus its roll-up metadata. */
export interface Trace {
  readonly runId: RunId
  readonly events: readonly TraceEvent[]
}
