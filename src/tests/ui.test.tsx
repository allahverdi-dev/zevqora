import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { AgentsPage } from '@/routes/AgentsPage'
import { AnalyticsPage } from '@/routes/AnalyticsPage'
import { ApprovalsPage } from '@/routes/ApprovalsPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { EvaluationsPage } from '@/routes/EvaluationsPage'
import { ExperimentsPage } from '@/routes/ExperimentsPage'
import { IncidentsPage } from '@/routes/IncidentsPage'
import { PoliciesPage } from '@/routes/PoliciesPage'
import { RunsPage } from '@/routes/RunsPage'
import { SettingsPage } from '@/routes/SettingsPage'
import { TracePage } from '@/routes/TracePage'

import { renderRoute } from './render'

describe('Runs Explorer', () => {
  it('renders the dense table with the approved columns', async () => {
    renderRoute(<RunsPage />, { path: '/runs', withShell: true })

    expect(
      await screen.findByRole('columnheader', { name: /run id/i }),
    ).toBeInTheDocument()

    for (const column of ['Agent', 'Model', 'Duration', 'Tokens', 'Cost']) {
      expect(
        screen.getByRole('columnheader', { name: new RegExp(column, 'i') }),
      ).toBeInTheDocument()
    }
  })

  it('filters the table by search term', async () => {
    const user = userEvent.setup()
    renderRoute(<RunsPage />, { path: '/runs', withShell: true })

    await screen.findByRole('table')

    // Pasted rather than typed: each keystroke issues its own repository
    // query, and typing a full run id one character at a time is needlessly
    // slow without testing anything extra.
    await user.click(screen.getByLabelText(/search by run id/i))
    await user.paste('rn_8b9f4e2d_c1')

    // Header row plus the single matching run.
    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(2)
    })
    expect(
      screen.getByRole('link', { name: 'rn_8b9f4e2d_c1' }),
    ).toBeInTheDocument()
  })

  it('shows a filtered-empty state that can be cleared', async () => {
    const user = userEvent.setup()
    renderRoute(<RunsPage />, { path: '/runs', withShell: true })

    await screen.findByRole('table')
    // Pasted rather than typed — see the search test above. Typing 16
    // characters each fires its own debounce-free repository query against
    // the mock transport's simulated latency, which made this test flaky
    // under load instead of merely slow.
    await user.click(screen.getByLabelText(/search by run id/i))
    await user.paste('zzz-no-such-run')

    expect(
      await screen.findByText(/no runs match these filters/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear all filters/i }))

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('run ids link to their trace route', async () => {
    renderRoute(<RunsPage />, { path: '/runs', withShell: true })

    await screen.findByRole('table')
    const links = screen.getAllByRole('link', { name: /^rn_/ })

    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute(
      'href',
      expect.stringContaining('/runs/rn_'),
    )
  })

  it('sorting a column updates its aria-sort state', async () => {
    const user = userEvent.setup()
    renderRoute(<RunsPage />, { path: '/runs', withShell: true })

    await screen.findByRole('table')
    await user.click(screen.getByRole('button', { name: /^cost/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /cost/i }),
      ).toHaveAttribute('aria-sort', 'descending')
    })
  })
})

describe('Trace inspection', () => {
  it('renders the full approved execution hierarchy', async () => {
    renderRoute(<TracePage />, {
      path: '/runs/:runId',
      initialEntries: ['/runs/rn_8b9f4e2d_c1'],
      withShell: true,
    })

    expect(await screen.findByText('Execution Trace')).toBeInTheDocument()

    const trace = screen.getByRole('list', { name: /execution trace events/i })
    expect(within(trace).getByText('Run Started')).toBeInTheDocument()
    expect(within(trace).getByText('High-Risk Action')).toBeInTheDocument()
    expect(within(trace).getByText('Human Approved')).toBeInTheDocument()
    expect(within(trace).getByText('Run Completed')).toBeInTheDocument()
  })

  it('selects the policy intervention by default in the inspector', async () => {
    renderRoute(<TracePage />, {
      path: '/runs/:runId',
      initialEntries: ['/runs/rn_8b9f4e2d_c1'],
      withShell: true,
    })

    const inspector = await screen.findByRole('complementary', {
      name: /event details/i,
    })

    // The default selection is applied once the trace resolves.
    expect(await within(inspector).findByText(/policy id/i)).toBeInTheDocument()
    expect(within(inspector).getByText('pol_042')).toBeInTheDocument()
  })

  it('selecting a different event updates the inspector', async () => {
    const user = userEvent.setup()
    renderRoute(<TracePage />, {
      path: '/runs/:runId',
      initialEntries: ['/runs/rn_8b9f4e2d_c1'],
      withShell: true,
    })

    const trace = await screen.findByRole('list', {
      name: /execution trace events/i,
    })
    await user.click(within(trace).getByText('Model Invocation'))

    const inspector = screen.getByRole('complementary', {
      name: /event details/i,
    })

    await waitFor(() => {
      expect(within(inspector).getByText(/execution summary/i)).toBeInTheDocument()
    })
    expect(within(inspector).queryByText('pol_042')).not.toBeInTheDocument()
  })

  it('collapses and expands event payloads', async () => {
    const user = userEvent.setup()
    renderRoute(<TracePage />, {
      path: '/runs/:runId',
      initialEntries: ['/runs/rn_8b9f4e2d_c1'],
      withShell: true,
    })

    await screen.findByText('Execution Trace')
    const collapseAll = screen.getByRole('button', { name: /collapse all/i })

    await user.click(collapseAll)

    expect(
      await screen.findByRole('button', { name: /expand all/i }),
    ).toBeInTheDocument()
  })

  it('shows a not-found state for an unknown run', async () => {
    renderRoute(<TracePage />, {
      path: '/runs/:runId',
      initialEntries: ['/runs/rn_missing'],
      withShell: true,
    })

    expect(await screen.findByText(/run not found/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /back to runs explorer/i }),
    ).toBeInTheDocument()
  })

  it('does not present model-internal reasoning as such', async () => {
    renderRoute(<TracePage />, {
      path: '/runs/:runId',
      initialEntries: ['/runs/rn_8b9f4e2d_c1'],
      withShell: true,
    })

    await screen.findByText('Execution Trace')

    // Reasoning-like content is framed as a control-plane record.
    expect(screen.queryByText(/chain.of.thought/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/internal reasoning/i)).not.toBeInTheDocument()
  })
})

describe('Policies', () => {
  it('selects the first policy and shows its definition', async () => {
    renderRoute(<PoliciesPage />, { path: '/policies', withShell: true })

    expect(
      await screen.findByRole('heading', { name: 'Block PII Disclosure' }),
    ).toBeInTheDocument()

    const definition = await screen.findByLabelText(/rule definition/i)
    expect((definition as HTMLTextAreaElement).value).toContain('POL-001')
    expect((definition as HTMLTextAreaElement).value).toContain('redaction')
  })

  it('switching selection swaps the detail pane', async () => {
    const user = userEvent.setup()
    renderRoute(<PoliciesPage />, { path: '/policies', withShell: true })

    await screen.findByRole('heading', { name: 'Block PII Disclosure' })
    await user.click(
      screen.getByRole('button', { name: /require approval for refunds/i }),
    )

    expect(
      await screen.findByRole('heading', {
        name: /require approval for refunds/i,
      }),
    ).toBeInTheDocument()
  })

  it('enables Save only after an edit and confirms via toast', async () => {
    const user = userEvent.setup()
    renderRoute(<PoliciesPage />, { path: '/policies', withShell: true })

    await screen.findByRole('heading', { name: 'Block PII Disclosure' })
    const save = screen.getByRole('button', { name: /save changes/i })
    expect(save).toBeDisabled()

    await user.type(screen.getByLabelText(/description/i), ' Updated.')
    await waitFor(() => expect(save).toBeEnabled())

    await user.click(save)

    expect(await screen.findByText(/policy saved/i)).toBeInTheDocument()
  })

  it('toggles policy enforcement state', async () => {
    const user = userEvent.setup()
    renderRoute(<PoliciesPage />, { path: '/policies', withShell: true })

    await screen.findByRole('heading', { name: 'Block PII Disclosure' })
    await user.click(screen.getByRole('button', { name: /deactivate/i }))

    expect(await screen.findByText(/policy deactivated/i)).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /activate/i }),
    ).toBeInTheDocument()
  })
})

describe('Evaluations', () => {
  it('switching suite filters the results table', async () => {
    const user = userEvent.setup()
    renderRoute(<EvaluationsPage />, { path: '/evaluations', withShell: true })

    await screen.findByRole('table')
    const before = screen
      .getAllByText(/^EVL-\d+$/)
      .map((node) => node.textContent)

    await user.click(screen.getByRole('tab', { name: /internal kb/i }))

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /internal kb/i })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })

    // A different suite surfaces a different set of evaluation runs.
    await waitFor(() => {
      const after = screen
        .getAllByText(/^EVL-\d+$/)
        .map((node) => node.textContent)
      expect(after).not.toEqual(before)
    })
  })

  it('running a suite reports a scored outcome', async () => {
    const user = userEvent.setup()
    renderRoute(<EvaluationsPage />, { path: '/evaluations', withShell: true })

    await screen.findByRole('table')
    await user.click(screen.getByRole('button', { name: /run suite/i }))

    expect(await screen.findByText(/EVL-\d+ (passed|failed)/)).toBeInTheDocument()
  })

  it('exposes criteria scores as accessible meters', async () => {
    renderRoute(<EvaluationsPage />, { path: '/evaluations', withShell: true })

    const meters = await screen.findAllByRole('meter')
    expect(meters.length).toBeGreaterThan(0)
    expect(meters[0]).toHaveAttribute('aria-valuenow')
  })
})

describe('Dashboard', () => {
  it('the Open Incidents metric matches the Active Incidents panel count', async () => {
    renderRoute(<DashboardPage />, { path: '/dashboard', withShell: true })

    const metricLink = await screen.findByRole('link', { name: /open incidents/i })
    const panelHeading = await screen.findByRole('heading', {
      name: /active incidents \(\d+\)/i,
    })

    const metricCount = metricLink.textContent?.match(/\d+/)?.[0]
    const panelCount = panelHeading.textContent?.match(/\((\d+)\)/)?.[1]

    expect(metricCount).toBeDefined()
    expect(metricCount).toBe(panelCount)
  })

  it('the Awaiting Approval metric matches the Pending Approvals panel count', async () => {
    renderRoute(<DashboardPage />, { path: '/dashboard', withShell: true })

    const metricLink = await screen.findByRole('link', { name: /awaiting approval/i })
    const panelHeading = await screen.findByRole('heading', {
      name: /pending approvals \(\d+\)/i,
    })

    const metricCount = metricLink.textContent?.match(/\d+/)?.[0]
    const panelCount = panelHeading.textContent?.match(/\((\d+)\)/)?.[1]

    expect(metricCount).toBeDefined()
    expect(metricCount).toBe(panelCount)
  })

  it('shows a simulated-telemetry disclosure in the shell', async () => {
    renderRoute(<DashboardPage />, { path: '/dashboard', withShell: true })

    await screen.findByRole('heading', { name: /overview/i, level: 1 })
    expect(screen.getByText(/simulated telemetry/i)).toBeInTheDocument()
  })
})

describe('Experiments', () => {
  it('selecting an experiment updates the comparison title and metrics', async () => {
    const user = userEvent.setup()
    renderRoute(<ExperimentsPage />, { path: '/experiments', withShell: true })

    await screen.findAllByText('EXP-842A')
    expect(screen.getByText('Metric Comparison (EXP-842A)')).toBeInTheDocument()

    await user.click(screen.getByText('Retrieval Strategy: Dense vs Hybrid'))

    await waitFor(() => {
      expect(screen.getByText('Metric Comparison (EXP-911B)')).toBeInTheDocument()
    })
  })

  it('creating an experiment adds it to the directory', async () => {
    const user = userEvent.setup()
    renderRoute(<ExperimentsPage />, { path: '/experiments', withShell: true })

    await screen.findAllByText('EXP-842A')
    await user.click(screen.getByRole('button', { name: /new experiment/i }))

    await user.type(screen.getByLabelText(/experiment name/i), 'My Test Experiment')
    await user.click(screen.getByRole('button', { name: /^create experiment$/i }))

    await waitFor(() => {
      expect(screen.getAllByText('My Test Experiment').length).toBeGreaterThan(0)
    })
  })

  it('renders each comparison metric on its own scale with the original units', async () => {
    renderRoute(<ExperimentsPage />, { path: '/experiments', withShell: true })

    await screen.findAllByText('EXP-842A')

    // Accuracy, latency and cost stay unit-labelled — never implying they
    // share one numeric axis.
    expect(screen.getByText('94%')).toBeInTheDocument()
    expect(screen.getByText('82%')).toBeInTheDocument()
    expect(screen.getByText('1.2s')).toBeInTheDocument()
    expect(screen.getByText('1.8s')).toBeInTheDocument()
    expect(screen.getByText('$0.040')).toBeInTheDocument()
    expect(screen.getByText('$0.020')).toBeInTheDocument()

    const meters = screen.getAllByRole('meter')
    expect(meters.length).toBe(6) // 3 metrics x 2 variants
  })
})

describe('Approvals', () => {
  it('filtering by urgency narrows the queue', async () => {
    const user = userEvent.setup()
    renderRoute(<ApprovalsPage />, { path: '/approvals', withShell: true })

    await screen.findByText('AG-992-FX')
    await user.click(screen.getByRole('button', { name: /^low$/i }))

    await waitFor(() => {
      expect(screen.queryByText('AG-992-FX')).not.toBeInTheDocument()
    })
  })

  it('approving a request removes it from the pending queue', async () => {
    const user = userEvent.setup()
    renderRoute(<ApprovalsPage />, { path: '/approvals', withShell: true })

    await screen.findByText('AG-992-FX')
    await user.click(screen.getByText('AG-992-FX'))
    await user.click(screen.getByRole('button', { name: /^approve$/i }))

    await waitFor(() => {
      expect(screen.queryByText('AG-992-FX')).not.toBeInTheDocument()
    })
  })

  it('rejecting a request records it in history', async () => {
    const user = userEvent.setup()
    renderRoute(<ApprovalsPage />, { path: '/approvals', withShell: true })

    await screen.findByText('AG-410-DP')
    await user.click(screen.getByText('AG-410-DP'))
    await user.click(screen.getByRole('button', { name: /^reject$/i }))

    await user.click(screen.getByRole('button', { name: /recent history/i }))

    await waitFor(() => {
      expect(screen.getAllByText('AG-410-DP').length).toBeGreaterThan(0)
    })
  })
})

describe('Incidents', () => {
  it('filtering by severity narrows the incident list', async () => {
    const user = userEvent.setup()
    renderRoute(<IncidentsPage />, { path: '/incidents', withShell: true })

    await screen.findByText(/infinite loop detected/i)

    await user.click(screen.getByRole('button', { name: 'SEV-3' }))

    await waitFor(() => {
      expect(screen.queryByText(/infinite loop detected/i)).not.toBeInTheDocument()
    })
  })

  it('selecting an incident renders its timeline', async () => {
    const user = userEvent.setup()
    renderRoute(<IncidentsPage />, { path: '/incidents', withShell: true })

    await screen.findByText(/infinite loop detected/i)
    await user.click(screen.getByText(/infinite loop detected/i))

    await waitFor(() => {
      expect(screen.getByText(/CPU usage spike/i)).toBeInTheDocument()
    })
  })

  it('pausing an agent asks for confirmation before applying', async () => {
    const user = userEvent.setup()
    renderRoute(<IncidentsPage />, { path: '/incidents', withShell: true })

    await screen.findByText(/infinite loop detected/i)
    await user.click(screen.getByRole('button', { name: /^pause agent$/i }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/pause this agent/i)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: /^pause agent$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})

describe('Analytics', () => {
  it('switching the time period updates the headline metrics', async () => {
    const user = userEvent.setup()
    renderRoute(<AnalyticsPage />, { path: '/analytics', withShell: true })

    await screen.findByText('Total Tokens')
    const before = screen.getByText(/^1\.42B$/).textContent

    await user.click(screen.getByRole('button', { name: '30D' }))

    await waitFor(() => {
      const after = screen.queryByText(/^1\.42B$/)
      expect(after === null || after.textContent !== before).toBe(true)
    })
  })

  it('shows per-model usage from typed data', async () => {
    renderRoute(<AnalyticsPage />, { path: '/analytics', withShell: true })

    await waitFor(() => {
      expect(screen.getAllByText(/claude sonnet 5/i).length).toBeGreaterThan(0)
    })
  })

  it('renders the latency matrix as independent P50/P90/P99 series, not a stack', async () => {
    renderRoute(<AnalyticsPage />, { path: '/analytics', withShell: true })

    await screen.findByText('Latency Distribution Matrix')

    // Three distinct, separately-legended series — never a single stacked value.
    expect(screen.getByText('P50')).toBeInTheDocument()
    expect(screen.getByText('P90')).toBeInTheDocument()
    expect(screen.getByText('P99')).toBeInTheDocument()

    const panelHeading = screen.getByText('Latency Distribution Matrix')
    const panel = panelHeading.closest('section, div')
    const chartTitle = panel?.querySelector('svg title')?.textContent ?? ''
    expect(chartTitle).toMatch(/independent P50\/P90\/P99 series \(not cumulative\)/i)
  })
})

describe('Settings', () => {
  it('updates the organization name', async () => {
    const user = userEvent.setup()
    renderRoute(<SettingsPage />, { path: '/settings', withShell: true })

    const input = await screen.findByLabelText(/organization name/i)
    await user.clear(input)
    await user.type(input, 'Renamed Org')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('Renamed Org')).toBeInTheDocument()
    })
  })

  it('switching environment updates the active selection', async () => {
    const user = userEvent.setup()
    renderRoute(<SettingsPage />, { path: '/settings', withShell: true })

    await screen.findByLabelText(/organization name/i)
    await user.click(screen.getByRole('button', { name: /^workspace$/i }))

    const sandboxButton = await screen.findByRole('button', { name: 'SANDBOX' })
    await user.click(sandboxButton)

    await waitFor(() => {
      expect(sandboxButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  it('generating a demo API key shows a one-time secret', async () => {
    const user = userEvent.setup()
    renderRoute(<SettingsPage />, { path: '/settings', withShell: true })

    await screen.findByLabelText(/organization name/i)
    await user.click(screen.getByRole('button', { name: /^api keys$/i }))

    await user.type(await screen.findByPlaceholderText(/key name/i), 'My New Key')
    await user.click(screen.getByRole('button', { name: /generate key/i }))

    expect(await screen.findByText(/demo key generated/i)).toBeInTheDocument()
  })
})

describe('Agent Fleet', () => {
  it('replaces unlabeled policy indicators with a labelled, tooltipped chip', async () => {
    renderRoute(<AgentsPage />, { path: '/agents', withShell: true })

    await screen.findByText('SupportBot Alpha')

    // Every non-errored card states its policy count in real text — no bare
    // decorative circles that convey nothing on their own.
    const policyChips = screen.getAllByText(/\d+ polic(y|ies)/i)
    expect(policyChips.length).toBeGreaterThan(0)

    // The indicator is keyboard-reachable and has an accessible description.
    const chip = policyChips[0]!.closest('[tabindex]')
    expect(chip).not.toBeNull()
    expect(chip).toHaveAttribute('aria-describedby')
  })
})

describe('Application shell', () => {
  it('marks the active navigation item with aria-current', async () => {
    renderRoute(<RunsPage />, { path: '/runs', withShell: true })

    await screen.findByRole('table')
    const runsLink = screen.getByRole('link', { name: /^runs$/i })

    expect(runsLink).toHaveAttribute('aria-current', 'page')
  })

  it('renders the approved navigation sections', async () => {
    renderRoute(<RunsPage />, { path: '/runs', withShell: true })

    for (const section of ['Overview', 'Build', 'Improve', 'Control', 'Observe']) {
      expect(
        screen.getByRole('heading', { name: section, level: 2 }),
      ).toBeInTheDocument()
    }
  })

  it('every primary sidebar destination is a real link with no pending marker', async () => {
    renderRoute(<RunsPage />, { path: '/runs', withShell: true })

    for (const label of [
      'Dashboard',
      'Agents',
      'Runs',
      'Simulator',
      'Evaluations',
      'Experiments',
      'Approvals',
      'Policies',
      'Incidents',
      'Analytics',
      'Settings',
    ]) {
      const link = screen.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })
      expect(link).toHaveAttribute('href', expect.stringMatching(/^\//))
      expect(within(link).queryByText('SOON')).not.toBeInTheDocument()
    }
  })

  it('provides a skip link to the main content', async () => {
    renderRoute(<RunsPage />, { path: '/runs', withShell: true })

    expect(
      screen.getByRole('link', { name: /skip to main content/i }),
    ).toHaveAttribute('href', '#main-content')
  })
})
