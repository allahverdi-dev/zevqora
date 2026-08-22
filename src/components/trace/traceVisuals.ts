import {
  CircleStop,
  Cpu,
  FileOutput,
  Gavel,
  MessageSquare,
  Play,
  ShieldCheck,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

import type { TraceEventType } from '@/domain'

/** Icon and tone treatment per trace event type. */
export interface TraceVisual {
  readonly icon: LucideIcon
  readonly tone: 'default' | 'signal' | 'secondary' | 'muted' | 'danger'
}

export const TRACE_VISUALS: Record<TraceEventType, TraceVisual> = {
  run_started: { icon: Play, tone: 'muted' },
  model_invocation: { icon: Cpu, tone: 'secondary' },
  tool_call: { icon: Wrench, tone: 'signal' },
  tool_result: { icon: FileOutput, tone: 'muted' },
  policy_intervention: { icon: Gavel, tone: 'danger' },
  human_approval: { icon: ShieldCheck, tone: 'signal' },
  agent_response: { icon: MessageSquare, tone: 'secondary' },
  run_completed: { icon: CircleStop, tone: 'signal' },
  run_failed: { icon: XCircle, tone: 'danger' },
}
