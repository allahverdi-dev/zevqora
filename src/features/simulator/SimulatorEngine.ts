import type { Scenario, ScenarioStep, SimulatorEvent, SimulatorState } from './types'
import { isTerminal } from './types'

/**
 * Deterministic agent-execution simulator.
 *
 * Deliberately framework-agnostic: the engine owns the run lifecycle and emits
 * state snapshots, while React merely subscribes. That separation is what makes
 * the approval gate testable without rendering anything, and it keeps timer
 * bookkeeping out of component code.
 *
 * Scheduling invariants:
 *   - Exactly one timer is ever outstanding.
 *   - `stop()` clears it and is idempotent, so unmount cleanup is safe.
 *   - Every scheduled callback re-checks the run generation before applying,
 *     so a callback queued before a cancel/restart cannot mutate the new run.
 */

type Listener = (state: SimulatorState) => void

/** Injectable clock so tests can drive the engine without real time. */
export interface EngineTimers {
  setTimeout: (handler: () => void, ms: number) => number
  clearTimeout: (handle: number) => void
  now: () => number
}

const defaultTimers: EngineTimers = {
  setTimeout: (handler, ms) =>
    globalThis.setTimeout(handler, ms) as unknown as number,
  clearTimeout: (handle) => globalThis.clearTimeout(handle),
  now: () => Date.now(),
}

export const INITIAL_STATE: SimulatorState = {
  status: 'idle',
  events: [],
  metrics: { tokens: 0, costUsd: 0, elapsedMs: 0, toolCalls: 0 },
  pendingApproval: null,
  finalOutput: null,
  error: null,
}

export class SimulatorEngine {
  private state: SimulatorState = INITIAL_STATE
  private listeners = new Set<Listener>()

  private timers: EngineTimers
  private timerHandle: number | null = null

  private scenario: Scenario | null = null
  private queue: ScenarioStep[] = []
  private startedAt = 0
  private eventSeq = 0

  /**
   * Incremented on every start/stop. Scheduled callbacks capture the value
   * current when they were queued and abort if it has moved on — this is what
   * prevents a stale timer from resurrecting a cancelled run.
   */
  private generation = 0

  /** Speed multiplier; 0 makes every step resolve immediately (tests). */
  private speed = 1

  constructor(timers: EngineTimers = defaultTimers) {
    this.timers = timers
  }

  /* Subscription --------------------------------------------------------- */

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): SimulatorState {
    return this.state
  }

  setSpeed(multiplier: number): void {
    this.speed = Math.max(0, multiplier)
  }

  private emit(patch: Partial<SimulatorState>): void {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((listener) => listener(this.state))
  }

  /* Lifecycle ------------------------------------------------------------ */

  /** Begins a run. Any in-flight run is discarded first. */
  start(scenario: Scenario, userMessage: string): void {
    this.stop()
    this.generation += 1

    this.scenario = scenario
    this.queue = [...scenario.steps]
    this.startedAt = this.timers.now()
    this.eventSeq = 0

    const openingEvent: SimulatorEvent = {
      id: this.nextEventId(),
      type: 'user_message',
      label: 'User message',
      offsetMs: 0,
      text: userMessage,
    }

    this.state = {
      ...INITIAL_STATE,
      status: 'running',
      events: [openingEvent],
    }
    this.listeners.forEach((listener) => listener(this.state))

    this.scheduleNext()
  }

  /**
   * Resolves the approval gate and resumes along the matching branch.
   * Ignored unless the engine is actually waiting on a decision.
   */
  decide(decision: 'approve' | 'reject'): void {
    if (this.state.status !== 'awaiting_approval' || !this.scenario) return

    this.queue =
      decision === 'approve'
        ? [...this.scenario.onApprove]
        : [...this.scenario.onReject]

    this.emit({ status: 'running', pendingApproval: null })
    this.scheduleNext()
  }

  /** Operator abandons the run. Terminal and idempotent. */
  cancel(): void {
    if (isTerminal(this.state.status) || this.state.status === 'idle') return

    this.stop()
    this.generation += 1

    this.emit({
      status: 'cancelled',
      pendingApproval: null,
      events: [
        ...this.state.events,
        {
          id: this.nextEventId(),
          type: 'run_failed',
          label: 'Run cancelled',
          offsetMs: this.elapsed(),
          tone: 'danger',
          text: 'Cancelled by operator before completion.',
        },
      ],
    })
  }

  /** Clears any outstanding timer. Safe to call repeatedly. */
  stop(): void {
    if (this.timerHandle !== null) {
      this.timers.clearTimeout(this.timerHandle)
      this.timerHandle = null
    }
  }

  /** Full teardown for unmount. */
  dispose(): void {
    this.stop()
    this.generation += 1
    this.listeners.clear()
  }

  reset(): void {
    this.stop()
    this.generation += 1
    this.scenario = null
    this.queue = []
    this.eventSeq = 0
    this.emit({ ...INITIAL_STATE })
  }

  /* Internals ------------------------------------------------------------ */

  private nextEventId(): string {
    this.eventSeq += 1
    return `sim_evt_${this.eventSeq}`
  }

  private elapsed(): number {
    return this.timers.now() - this.startedAt
  }

  private scheduleNext(): void {
    this.stop()

    const step = this.queue.shift()
    if (!step) {
      this.finish()
      return
    }

    const generation = this.generation
    const delay = Math.round(step.delayMs * this.speed)

    this.timerHandle = this.timers.setTimeout(() => {
      this.timerHandle = null
      // A cancel or restart happened while this callback was queued.
      if (generation !== this.generation) return
      this.applyStep(step)
    }, delay)
  }

  private applyStep(step: ScenarioStep): void {
    const event: SimulatorEvent = {
      ...step.event,
      id: this.nextEventId(),
      offsetMs: this.elapsed(),
    }

    const metrics = {
      tokens: this.state.metrics.tokens + (event.tokens ?? 0),
      costUsd: Number(
        (this.state.metrics.costUsd + (event.costUsd ?? 0)).toFixed(4),
      ),
      elapsedMs: this.elapsed(),
      toolCalls:
        this.state.metrics.toolCalls + (event.type === 'tool_call' ? 1 : 0),
    }

    if (step.approval) {
      // Halt here. No further work is scheduled until decide() is called.
      this.emit({
        status: 'awaiting_approval',
        events: [...this.state.events, event],
        metrics,
        pendingApproval: step.approval,
      })
      return
    }

    this.emit({
      events: [...this.state.events, event],
      metrics,
    })

    this.scheduleNext()
  }

  private finish(): void {
    if (!this.scenario) return

    const rejected = this.state.events.some(
      (event) => event.label === 'Human rejected',
    )

    this.emit({
      status: rejected ? 'rejected' : 'completed',
      finalOutput: rejected
        ? this.scenario.rejectedOutput
        : this.scenario.finalOutput,
      metrics: { ...this.state.metrics, elapsedMs: this.elapsed() },
    })
  }
}
