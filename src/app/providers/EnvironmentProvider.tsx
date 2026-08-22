import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { Environment } from '@/domain'

import { useServices } from './ServicesProvider'

interface EnvironmentContextValue {
  readonly environment: Environment
  readonly setEnvironment: (next: Environment) => void
  readonly loading: boolean
}

/**
 * The active environment, shared across the shell.
 *
 * Settings owns the authoritative value (`SettingsRepository`); this provider
 * is the reactive seam so the sidebar's environment indicator updates the
 * instant Settings changes it, without every consumer re-fetching the session.
 * Changing environments here is a frontend-only preference switch — no traffic
 * is actually rerouted.
 */
const EnvironmentContext = createContext<EnvironmentContextValue | null>(null)

export function EnvironmentProvider({ children }: { readonly children: ReactNode }) {
  const services = useServices()
  const [environment, setEnvironmentState] = useState<Environment>('production')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    services.settings
      .get()
      .then((settings) => {
        if (!active) return
        setEnvironmentState(settings.activeEnvironment)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [services])

  const setEnvironment = useCallback(
    (next: Environment) => {
      setEnvironmentState(next)
      void services.settings.setEnvironment(next)
    },
    [services],
  )

  const value = useMemo(
    () => ({ environment, setEnvironment, loading }),
    [environment, setEnvironment, loading],
  )

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment(): EnvironmentContextValue {
  const context = useContext(EnvironmentContext)
  if (!context) {
    throw new Error('useEnvironment must be used within an <EnvironmentProvider>.')
  }
  return context
}
