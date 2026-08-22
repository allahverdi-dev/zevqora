import { createContext, useContext, type ReactNode } from 'react'

import { services as defaultServices } from '@/services'
import type { ZevqoraServices } from '@/services/contracts'

/**
 * Makes the repository layer available to the tree.
 *
 * Components resolve their data source through this context rather than
 * importing a repository directly, which keeps them testable (a test can
 * inject stub repositories) and keeps the eventual API swap a one-line change.
 */
const ServicesContext = createContext<ZevqoraServices | null>(null)

interface ServicesProviderProps {
  readonly children: ReactNode
  /** Override for tests and Storybook-style harnesses. */
  readonly services?: ZevqoraServices
}

export function ServicesProvider({
  children,
  services = defaultServices,
}: ServicesProviderProps) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  )
}

export function useServices(): ZevqoraServices {
  const context = useContext(ServicesContext)

  if (!context) {
    throw new Error('useServices must be used within a <ServicesProvider>.')
  }

  return context
}
