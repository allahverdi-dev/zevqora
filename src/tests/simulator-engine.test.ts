import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SimulatorEngine, type EngineTimers } from '@/features/simulator/SimulatorEngine'
import { scenarioForAgent } from '@/features/simulator/scenarios'
import type { SimulatorState } from '@/features/simulator/types'

/**
 * The engine is driven by a controlled clock so the tests assert real
 * lifecycle behaviour without waiting on wall time — and so the "does it clean
 * up its timers" question can be answered directly.
 */
function createTestTimers() {
  let now = 0
  let nextHandle = 1
  const pending = new Map<number, { fire: () => void; at: number }>()

  const timers: EngineTimers = {
    setTimeout(handler, ms) {
      const handle = nextHandle++
      pending.set(handle, { fire: handler, at: now + ms })
      return handle
    },
    clearTimeout(handle) {
      pending.delete(handle)
    },
    now: () => now,
  }

  return {
    timers,
    get pendingCount() {
      return pending.size
    },
    /** Fires every timer that is currently due, repeatedly, until settled. */
    flush(steps = 60) {
      for (let i = 0; i < steps; i += 1) {
        const entries = [...pending.entries()].sort((a, b) => a[1].at - b[1].at)
        const next = entries[0]
        if (!next) return
        const [handle, task] = next
        pending.delete(handle)
        now = Math.max(now, task.at)
        task.fire()
      }
    },
    advance(ms: number) {
      now += ms
    },
  }
}

describe('SimulatorEngine', () => {
  let clock: ReturnType<typeof createTestTimers>
  let engine: SimulatorEngine
  let state: SimulatorState

  beforeEach(() => {
    clock = createTestTimers()
    engine = new SimulatorEngine(clock.timers)
    engine.subscribe((next) => {
      state = next
    })
  })

  const scenario = scenarioForAgent('agt_114a')

  it('starts in an idle state with no events', () => {
    expect(state.status).toBe('idle')
    expect(state.events).toHaveLength(0)
  })

  it('records the user message and begins running when started', () => {
    engine.start(scenario, 'Refund the duplicate charge')

    expect(state.status).toBe('running')
    expect(state.events).toHaveLength(1)
    expect(state.events[0]?.type).toBe('user_message')
    expect(state.events[0]?.text).toBe('Refund the duplicate charge')
  })

  it('progresses through events as time advances', () => {
    engine.start(scenario, 'test')
    const initialCount = state.events.length

    clock.flush(3)

    expect(state.events.length).toBeGreaterThan(initialCount)
  })

  it('pauses at the approval gate and schedules no further work', () => {
    engine.start(scenario, 'test')
    clock.flush()

    expect(state.status).toBe('awaiting_approval')
    expect(state.pendingApproval).not.toBeNull()
    expect(state.pendingApproval?.toolName).toBe('refund_payment')

    // The engine must be genuinely idle while waiting on a human.
    expect(clock.pendingCount).toBe(0)
  })

  it('continues execution and completes when approved', () => {
    engine.start(scenario, 'test')
    clock.flush()
    expect(state.status).toBe('awaiting_approval')

    engine.decide('approve')
    expect(state.status).toBe('running')
    expect(state.pendingApproval).toBeNull()

    clock.flush()

    expect(state.status).toBe('completed')
    expect(state.finalOutput).toContain('rfnd_992')
    // The gated tool actually ran.
    expect(
      state.events.some((event) => event.label === 'Tool executed'),
    ).toBe(true)
  })

  it('terminates without executing the gated tool when rejected', () => {
    engine.start(scenario, 'test')
    clock.flush()

    engine.decide('reject')
    clock.flush()

    expect(state.status).toBe('rejected')
    expect(state.finalOutput).toContain('not authorised')
    expect(
      state.events.some((event) => event.label === 'Tool executed'),
    ).toBe(false)
  })

  it('ignores an approval decision when not awaiting one', () => {
    engine.start(scenario, 'test')
    const before = state.status

    engine.decide('approve')

    expect(state.status).toBe(before)
  })

  it('cancels cleanly and clears every outstanding timer', () => {
    engine.start(scenario, 'test')
    clock.flush(2)
    expect(clock.pendingCount).toBeGreaterThan(0)

    engine.cancel()

    expect(state.status).toBe('cancelled')
    expect(clock.pendingCount).toBe(0)
  })

  it('does not resurrect a cancelled run from an already-queued callback', () => {
    engine.start(scenario, 'test')
    clock.flush(2)

    const countAtCancel = state.events.length
    engine.cancel()

    // Anything still queued must be inert.
    clock.flush()

    expect(state.status).toBe('cancelled')
    // Only the cancellation event was appended.
    expect(state.events.length).toBe(countAtCancel + 1)
  })

  it('accumulates token, cost and tool-call telemetry', () => {
    engine.start(scenario, 'test')
    clock.flush()
    engine.decide('approve')
    clock.flush()

    expect(state.metrics.tokens).toBeGreaterThan(0)
    expect(state.metrics.costUsd).toBeGreaterThan(0)
    expect(state.metrics.toolCalls).toBeGreaterThanOrEqual(3)
  })

  it('restarting discards the previous run', () => {
    engine.start(scenario, 'first')
    clock.flush()
    expect(state.status).toBe('awaiting_approval')

    engine.start(scenario, 'second')

    expect(state.status).toBe('running')
    expect(state.pendingApproval).toBeNull()
    expect(state.events).toHaveLength(1)
    expect(state.events[0]?.text).toBe('second')
  })

  it('reset returns the engine to idle', () => {
    engine.start(scenario, 'test')
    clock.flush(3)

    engine.reset()

    expect(state.status).toBe('idle')
    expect(state.events).toHaveLength(0)
    expect(clock.pendingCount).toBe(0)
  })

  it('dispose clears timers and stops notifying listeners', () => {
    const listener = vi.fn()
    const engine2 = new SimulatorEngine(clock.timers)
    engine2.subscribe(listener)
    engine2.start(scenario, 'test')

    listener.mockClear()
    engine2.dispose()
    clock.flush()

    expect(listener).not.toHaveBeenCalled()
    expect(clock.pendingCount).toBe(0)
  })
})
