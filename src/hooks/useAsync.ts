import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Resolution state of an asynchronous repository read.
 *
 * Modelled as a discriminated union so a component cannot render `data`
 * without having handled the loading and error branches first — which is how
 * every screen gets real loading and error states rather than assuming success.
 */
export type AsyncState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: Error }

export interface AsyncResult<T> {
  readonly state: AsyncState<T>
  readonly reload: () => void
}

/**
 * Runs an async task and tracks its lifecycle.
 *
 * Results from a superseded call are discarded: if the dependencies change
 * while a request is in flight, the stale response cannot overwrite the newer
 * one. This matters for the Runs Explorer, where filters change faster than
 * the simulated transport resolves.
 */
export function useAsync<T>(
  task: () => Promise<T>,
  deps: readonly unknown[],
): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'loading',
    data: null,
    error: null,
  })
  const [nonce, setNonce] = useState(0)

  // The task identity changes every render; deps are the real trigger.
  const taskRef = useRef(task)
  taskRef.current = task

  const requestId = useRef(0)

  useEffect(() => {
    const currentRequest = ++requestId.current
    let active = true

    setState({ status: 'loading', data: null, error: null })

    taskRef
      .current()
      .then((data) => {
        if (!active || currentRequest !== requestId.current) return
        setState({ status: 'success', data, error: null })
      })
      .catch((cause: unknown) => {
        if (!active || currentRequest !== requestId.current) return
        setState({
          status: 'error',
          data: null,
          error:
            cause instanceof Error
              ? cause
              : new Error('The request could not be completed.'),
        })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  return useMemo(() => ({ state, reload }), [state, reload])
}
