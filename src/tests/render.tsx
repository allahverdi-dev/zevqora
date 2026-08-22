import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { EnvironmentProvider } from '@/app/providers/EnvironmentProvider'
import { ServicesProvider } from '@/app/providers/ServicesProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { AppShell } from '@/components/shell/AppShell'
import { createServices } from '@/services'

/**
 * Renders a route inside the real application shell and providers.
 *
 * Uses `MemoryRouter` rather than a data router: none of these screens declare
 * loaders or actions, and the data router's client-side navigation constructs
 * a `Request`, whose undici implementation rejects jsdom's `AbortSignal`. The
 * component tree under test is identical either way.
 */
export function renderRoute(
  element: ReactElement,
  {
    path = '/test',
    initialEntries,
    withShell = false,
  }: {
    path?: string
    initialEntries?: string[]
    withShell?: boolean
  } = {},
) {
  const entries = initialEntries ?? [path]

  return render(
    <ServicesProvider services={createServices()}>
      <EnvironmentProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={entries}>
            <Routes>
              {withShell ? (
                <Route element={<AppShell />}>
                  <Route path={path} element={element} />
                </Route>
              ) : (
                <Route path={path} element={element} />
              )}
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </EnvironmentProvider>
    </ServicesProvider>,
  )
}
