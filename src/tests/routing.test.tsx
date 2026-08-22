import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { NAV_SECTIONS, SETTINGS_ITEM } from '@/app/navigation'
import { EnvironmentProvider } from '@/app/providers/EnvironmentProvider'
import { ServicesProvider } from '@/app/providers/ServicesProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { AppShell } from '@/components/shell/AppShell'
import { NotFound } from '@/routes/NotFound'
import { DashboardPage } from '@/routes/DashboardPage'
import { AgentsPage } from '@/routes/AgentsPage'
import { RunsPage } from '@/routes/RunsPage'
import { TracePage } from '@/routes/TracePage'
import { SimulatorPage } from '@/routes/SimulatorPage'
import { EvaluationsPage } from '@/routes/EvaluationsPage'
import { ExperimentsPage } from '@/routes/ExperimentsPage'
import { ApprovalsPage } from '@/routes/ApprovalsPage'
import { PoliciesPage } from '@/routes/PoliciesPage'
import { IncidentsPage } from '@/routes/IncidentsPage'
import { AnalyticsPage } from '@/routes/AnalyticsPage'
import { SettingsPage } from '@/routes/SettingsPage'
import { createServices } from '@/services'

/** Every route the router registers under the authenticated shell. */
const ROUTES: readonly [string, string][] = [
  ['/dashboard', '/dashboard'],
  ['/agents', '/agents'],
  ['/runs', '/runs'],
  ['/runs/:runId', '/runs/:runId'],
  ['/simulator', '/simulator'],
  ['/evaluations', '/evaluations'],
  ['/experiments', '/experiments'],
  ['/approvals', '/approvals'],
  ['/policies', '/policies'],
  ['/incidents', '/incidents'],
  ['/analytics', '/analytics'],
  ['/settings', '/settings'],
]

/**
 * Mirrors the real route table (minus lazy loading, which a memory router in
 * jsdom cannot resolve synchronously) so navigation assertions exercise the
 * same paths the application registers.
 */
function renderAt(initialEntry: string) {
  return render(
    <ServicesProvider services={createServices()}>
      <EnvironmentProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/runs" element={<RunsPage />} />
                <Route path="/runs/:runId" element={<TracePage />} />
                <Route path="/simulator" element={<SimulatorPage />} />
                <Route path="/evaluations" element={<EvaluationsPage />} />
                <Route path="/experiments" element={<ExperimentsPage />} />
                <Route path="/approvals" element={<ApprovalsPage />} />
                <Route path="/policies" element={<PoliciesPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </EnvironmentProvider>
    </ServicesProvider>,
  )
}

describe('routing', () => {
  it.each([
    ['/dashboard', /overview/i],
    ['/agents', /agent fleet/i],
    ['/runs', /runs explorer/i],
    ['/simulator', /simulator/i],
    ['/policies', /policies & guardrails/i],
    ['/experiments', /^experiments$/i],
    ['/approvals', /approval queue/i],
    ['/incidents', /incidents command center/i],
    ['/analytics', /fleet analytics/i],
    ['/settings', /^settings$/i],
  ])('renders %s', async (path, heading) => {
    renderAt(path)
    expect(
      await screen.findByRole('heading', { name: heading, level: 1 }),
    ).toBeInTheDocument()
  })

  it('renders the evaluations screen', async () => {
    renderAt('/evaluations')

    // Re-queried on each attempt: the panel re-renders as its several
    // independent reads resolve, which detaches any previously matched node.
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /system health/i }),
      ).toBeInTheDocument()
    })
  })

  it('renders a run detail route from its URL parameter', async () => {
    renderAt('/runs/rn_8b9f4e2d_c1')

    expect(await screen.findByText('Execution Trace')).toBeInTheDocument()
    expect(screen.getByText('rn_8b9f4e2d_c1')).toBeInTheDocument()
  })

  it('shows a not-found state for an unknown run id', async () => {
    renderAt('/runs/rn_unknown_id')
    expect(await screen.findByText(/run not found/i)).toBeInTheDocument()
  })

  it('renders a 404 for an unregistered path', async () => {
    renderAt('/this/does/not/exist')

    expect(
      await screen.findByRole('heading', { name: /route not found/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('/this/does/not/exist')).toBeInTheDocument()
  })

  it('navigates between sections without a full reload', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard')

    await screen.findByRole('heading', { name: /overview/i, level: 1 })
    await user.click(screen.getByRole('link', { name: /^policies$/i }))

    expect(
      await screen.findByRole('heading', {
        name: /policies & guardrails/i,
        level: 1,
      }),
    ).toBeInTheDocument()
  })

  it('every navigation entry points at a registered route', () => {
    const registered = new Set(ROUTES.map(([path]) => path))
    registered.add(SETTINGS_ITEM.to)

    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        expect(registered.has(item.to)).toBe(true)
      }
    }
  })

  it('no navigation entry uses a placeholder href', () => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        expect(item.to).not.toBe('#')
        expect(item.to.startsWith('/')).toBe(true)
      }
    }
    expect(SETTINGS_ITEM.to.startsWith('/')).toBe(true)
  })

  it('no primary sidebar item is flagged pending', () => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        expect('pending' in item).toBe(false)
      }
    }
  })
})
