import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SimulatorEngine, INITIAL_STATE } from './SimulatorEngine'
import { scenarioForAgent } from './scenarios'
import type { SimulatorState } from './types'

/**
 * Binds the simulator engine to React.
 *
 * The engine instance is created once per mount and disposed on unmount, so
 * every scheduled timer is cleared when the user navigates away — no callback
 * can fire against an unmounted tree.
 */
export function useSimulator() {
  const engineRef = useRef<SimulatorEngine | null>(null)
  if (engineRef.current === null) {
    engineRef.current = new SimulatorEngine()
  }
  const engine = engineRef.current

  const [state, setState] = useState<SimulatorState>(INITIAL_STATE)

  useEffect(() => {
    const unsubscribe = engine.subscribe(setState)
    return () => {
      unsubscribe()
      engine.dispose()
    }
  }, [engine])

  // Honour the user's motion preference: with reduced motion the run still
  // progresses through every state, just without the staged pacing that reads
  // as animation.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')

    const apply = () => engine.setSpeed(query.matches ? 0.15 : 1)
    apply()

    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [engine])

  const start = useCallback(
    (agentId: string, message: string) => {
      engine.start(scenarioForAgent(agentId), message)
    },
    [engine],
  )

  const approve = useCallback(() => engine.decide('approve'), [engine])
  const reject = useCallback(() => engine.decide('reject'), [engine])
  const cancel = useCallback(() => engine.cancel(), [engine])
  const reset = useCallback(() => engine.reset(), [engine])

  return useMemo(
    () => ({ state, start, approve, reject, cancel, reset }),
    [state, start, approve, reject, cancel, reset],
  )
}
