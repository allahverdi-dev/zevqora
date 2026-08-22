import { describe, expect, it } from 'vitest'

import { createServices } from '@/services'
import {
  filterRuns,
  sortRuns,
  summarizeRuns,
} from '@/services/mock/run-query'
import { MOCK_AGENTS } from '@/mocks/agents'
import { MOCK_EVALUATION_RESULTS } from '@/mocks/evaluations'
import { MODEL_LIST } from '@/mocks/models'
import { MOCK_RUNS } from '@/mocks/runs'

describe('run query helpers', () => {
  it('filters by status', () => {
    const failed = filterRuns(MOCK_RUNS, { status: 'failed' })

    expect(failed.length).toBeGreaterThan(0)
    expect(failed.every((run) => run.status === 'failed')).toBe(true)
  })

  it('filters by environment', () => {
    const staging = filterRuns(MOCK_RUNS, { environment: 'staging' })

    expect(staging.every((run) => run.environment === 'staging')).toBe(true)
  })

  it('matches search against id, agent, model and input', () => {
    const byId = filterRuns(MOCK_RUNS, { search: 'rn_8b9f4e2d_c1' })
    expect(byId).toHaveLength(1)

    const byAgent = filterRuns(MOCK_RUNS, { search: 'Billing Resolver' })
    expect(byAgent.length).toBeGreaterThan(0)
    expect(
      byAgent.every((run) => run.agentName === 'Billing Resolver'),
    ).toBe(true)
  })

  it('search is case-insensitive', () => {
    const lower = filterRuns(MOCK_RUNS, { search: 'billing resolver' })
    const upper = filterRuns(MOCK_RUNS, { search: 'BILLING RESOLVER' })

    expect(lower.length).toBe(upper.length)
    expect(lower.length).toBeGreaterThan(0)
  })

  it('narrows the result set as the period shortens', () => {
    const allTime = filterRuns(MOCK_RUNS, { period: 'all' })
    const lastDay = filterRuns(MOCK_RUNS, { period: '24h' })
    const lastHour = filterRuns(MOCK_RUNS, { period: '1h' })

    expect(allTime.length).toBeGreaterThanOrEqual(lastDay.length)
    expect(lastDay.length).toBeGreaterThanOrEqual(lastHour.length)
  })

  it('combines filters conjunctively', () => {
    const combined = filterRuns(MOCK_RUNS, {
      status: 'success',
      environment: 'production',
    })

    expect(
      combined.every(
        (run) => run.status === 'success' && run.environment === 'production',
      ),
    ).toBe(true)
  })

  it('sorts by cost in both directions', () => {
    const asc = sortRuns(MOCK_RUNS, { field: 'costUsd', direction: 'asc' })
    const desc = sortRuns(MOCK_RUNS, { field: 'costUsd', direction: 'desc' })

    expect(asc[0]?.costUsd).toBeLessThanOrEqual(asc[asc.length - 1]?.costUsd ?? 0)
    expect(desc[0]?.costUsd).toBeGreaterThanOrEqual(
      desc[desc.length - 1]?.costUsd ?? 0,
    )
  })

  it('sorting does not mutate the source collection', () => {
    const firstBefore = MOCK_RUNS[0]
    sortRuns(MOCK_RUNS, { field: 'durationMs', direction: 'asc' })

    expect(MOCK_RUNS[0]).toBe(firstBefore)
  })

  it('excludes in-flight runs from the success-rate denominator', () => {
    const summary = summarizeRuns(MOCK_RUNS, 'all')

    expect(summary.successRate).toBeGreaterThan(0)
    expect(summary.successRate).toBeLessThanOrEqual(100)
    expect(summary.totalRuns).toBe(MOCK_RUNS.length)
  })
})

describe('MockRunRepository', () => {
  const services = createServices()

  it('paginates without losing or duplicating rows', async () => {
    const first = await services.runs.query({ page: 1, pageSize: 10 })
    const second = await services.runs.query({ page: 2, pageSize: 10 })

    expect(first.items).toHaveLength(10)
    expect(second.items).toHaveLength(10)
    expect(first.total).toBe(second.total)

    const overlap = first.items.filter((run) =>
      second.items.some((other) => other.id === run.id),
    )
    expect(overlap).toHaveLength(0)
  })

  it('resolves a run by id', async () => {
    const run = await services.runs.getById('rn_8b9f4e2d_c1')

    expect(run).not.toBeNull()
    expect(run?.agentName).toBe('Billing Resolver')
    expect(run?.tokens.total).toBe(3_245)
  })

  it('returns null for an unknown run id', async () => {
    expect(await services.runs.getById('rn_does_not_exist')).toBeNull()
  })

  it('orders recent runs newest first', async () => {
    const recent = await services.runs.recent(5)

    for (let i = 1; i < recent.length; i += 1) {
      const previous = new Date(recent[i - 1]!.startedAt).getTime()
      const current = new Date(recent[i]!.startedAt).getTime()
      expect(previous).toBeGreaterThanOrEqual(current)
    }
  })
})

describe('MockTraceRepository', () => {
  const services = createServices()

  it('returns the featured trace with its policy gate and approval', async () => {
    const trace = await services.traces.getByRunId('rn_8b9f4e2d_c1')

    expect(trace).not.toBeNull()
    expect(trace?.events).toHaveLength(11)
    expect(
      trace?.events.some((event) => event.type === 'policy_intervention'),
    ).toBe(true)
    expect(
      trace?.events.some((event) => event.type === 'human_approval'),
    ).toBe(true)
  })

  it('derives a valid trace for any other run', async () => {
    const page = await services.runs.query({ page: 1, pageSize: 5 })
    const target = page.items[2]
    expect(target).toBeDefined()

    const trace = await services.traces.getByRunId(target!.id)

    expect(trace).not.toBeNull()
    expect(trace!.events.length).toBeGreaterThan(0)
    expect(trace!.events[0]?.type).toBe('run_started')
  })

  it('returns null for an unknown run', async () => {
    expect(await services.traces.getByRunId('rn_nope')).toBeNull()
  })
})

describe('MockPolicyRepository', () => {
  it('toggles enforcement state', async () => {
    const services = createServices()
    const before = await services.policies.getById('pol_001')
    expect(before?.status).toBe('enforced')

    const updated = await services.policies.setStatus('pol_001', 'disabled')
    expect(updated.status).toBe('disabled')

    // The change is visible through a subsequent read.
    const after = await services.policies.getById('pol_001')
    expect(after?.status).toBe('disabled')
  })

  it('persists an edited draft within the session', async () => {
    const services = createServices()

    await services.policies.update('pol_018', {
      name: 'Rate Limit Ext. API Calls',
      description: 'Updated description for the demo.',
      definition: 'policy:\n  id: POL-018',
      status: 'enforced',
      severity: 'medium',
    })

    const reloaded = await services.policies.getById('pol_018')
    expect(reloaded?.description).toBe('Updated description for the demo.')
  })

  it('filters policies by search term', async () => {
    const services = createServices()
    const matches = await services.policies.list({ search: 'refund' })

    expect(matches).toHaveLength(1)
    expect(matches[0]?.displayId).toBe('POL-042')
  })

  it('edits are scoped to a repository instance, not global state', async () => {
    const first = createServices()
    await first.policies.setStatus('pol_001', 'disabled')

    const second = createServices()
    const untouched = await second.policies.getById('pol_001')

    expect(untouched?.status).toBe('enforced')
  })
})

describe('MockEvaluationRepository', () => {
  it('filters results by suite', async () => {
    const services = createServices()
    const results = await services.evaluations.listResults({
      suiteId: 'suite_internal_kb',
    })

    expect(results.length).toBeGreaterThan(0)
    expect(
      results.every((result) => result.suiteId === 'suite_internal_kb'),
    ).toBe(true)
  })

  it('running a suite produces a scored result that appears in history', async () => {
    const services = createServices()
    const before = await services.evaluations.listResults({
      suiteId: 'suite_core_ecommerce',
    })

    const result = await services.evaluations.runSuite('suite_core_ecommerce')

    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.status).toBe(result.score >= 85 ? 'passed' : 'failed')
    expect(result.criteriaScores.length).toBeGreaterThan(0)

    const after = await services.evaluations.listResults({
      suiteId: 'suite_core_ecommerce',
    })
    expect(after.length).toBe(before.length + 1)
  })

  it('rejects an unknown suite', async () => {
    const services = createServices()
    await expect(services.evaluations.runSuite('suite_nope')).rejects.toThrow()
  })
})

describe('MockAgentRepository', () => {
  const services = createServices()

  it('lists the full fleet', async () => {
    const agents = await services.agents.list()
    expect(agents.length).toBeGreaterThanOrEqual(3)
  })

  it('filters by status', async () => {
    const offline = await services.agents.list({ status: 'offline' })

    expect(offline.length).toBeGreaterThan(0)
    expect(offline.every((agent) => agent.status === 'offline')).toBe(true)
  })

  it('resolves the approved fleet agents by id', async () => {
    const agent = await services.agents.getById('agt_8921')

    expect(agent?.name).toBe('SupportBot Alpha')
    expect(agent?.displayId).toBe('AGT-8921')
    expect(agent?.tools).toHaveLength(12)
  })
})

describe('mock data coherence', () => {
  it('every run references a real fleet agent', async () => {
    const services = createServices()
    const agents = await services.agents.list()
    const agentIds = new Set(agents.map((agent) => agent.id))

    expect(MOCK_RUNS.every((run) => agentIds.has(run.agentId))).toBe(true)
  })

  it('every policy is attached to real fleet agents', async () => {
    const services = createServices()
    const agents = await services.agents.list()
    const agentIds = new Set(agents.map((agent) => agent.id))
    const policies = await services.policies.list()

    for (const policy of policies) {
      for (const agentId of policy.appliedToAgentIds) {
        expect(agentIds.has(agentId)).toBe(true)
      }
    }
  })

  it('is deterministic across repository instances', async () => {
    const a = await createServices().runs.query({ page: 1, pageSize: 6 })
    const b = await createServices().runs.query({ page: 1, pageSize: 6 })

    expect(a.items.map((run) => run.id)).toEqual(b.items.map((run) => run.id))
  })

  it('every approval references a real fleet agent when one is set', async () => {
    const services = createServices()
    const agents = await services.agents.list()
    const agentIds = new Set(agents.map((agent) => agent.id))
    const approvals = await services.approvals.list()

    for (const approval of approvals) {
      if (approval.agentId) expect(agentIds.has(approval.agentId)).toBe(true)
    }
  })

  it('every incident references real fleet agents', async () => {
    const services = createServices()
    const agents = await services.agents.list()
    const agentIds = new Set(agents.map((agent) => agent.id))
    const incidents = await services.incidents.list()

    for (const incident of incidents) {
      if (incident.primaryAgentId) expect(agentIds.has(incident.primaryAgentId)).toBe(true)
      for (const agentId of incident.affectedAgentIds) {
        expect(agentIds.has(agentId)).toBe(true)
      }
    }
  })
})

describe('MockExperimentRepository', () => {
  it('lists the approved experiments', async () => {
    const experiments = await createServices().experiments.list()
    expect(experiments.length).toBeGreaterThanOrEqual(4)
    expect(experiments.some((e) => e.id === 'EXP-842A')).toBe(true)
  })

  it('creates a draft experiment that is then listed', async () => {
    const services = createServices()
    const created = await services.experiments.create({
      name: 'Test Experiment',
      type: 'Model comparison',
      baseModel: 'model-a',
      challengerModel: 'model-b',
      trafficAllocation: { variantA: 50, variantB: 50 },
    })

    expect(created.status).toBe('draft')
    expect(created.name).toBe('Test Experiment')

    const list = await services.experiments.list()
    expect(list.some((e) => e.id === created.id)).toBe(true)
  })
})

describe('MockApprovalRepository', () => {
  it('lists only pending requests from listPending', async () => {
    const services = createServices()
    const pending = await services.approvals.listPending()
    expect(pending.every((a) => a.status === 'pending')).toBe(true)
  })

  it('filters the full queue by urgency', async () => {
    const services = createServices()
    const high = await services.approvals.list({ urgency: 'high' })
    expect(high.length).toBeGreaterThan(0)
    expect(high.every((a) => a.severity === 'high')).toBe(true)
  })

  it('approve removes the request from the pending queue and records history', async () => {
    const services = createServices()
    const before = await services.approvals.listPending()
    const target = before.find((a) => a.id === 'apr_ag992fx')
    expect(target).toBeDefined()

    await services.approvals.resolve('apr_ag992fx', 'approved', 'test@acme.com')

    const after = await services.approvals.listPending()
    expect(after.some((a) => a.id === 'apr_ag992fx')).toBe(false)

    const history = await services.approvals.history(5)
    expect(history[0]?.requestCode).toBe(target?.requestCode)
    expect(history[0]?.decision).toBe('approved')
  })

  it('reject also resolves the request out of the pending queue', async () => {
    const services = createServices()
    const resolved = await services.approvals.resolve(
      'apr_ag410dp',
      'rejected',
      'test@acme.com',
    )
    expect(resolved.status).toBe('rejected')

    const pending = await services.approvals.listPending()
    expect(pending.some((a) => a.id === 'apr_ag410dp')).toBe(false)
  })
})

describe('MockIncidentRepository', () => {
  it('filters by severity', async () => {
    const services = createServices()
    const sev1 = await services.incidents.list({ severity: 'sev1' })
    expect(sev1.length).toBeGreaterThan(0)
    expect(sev1.every((incident) => incident.severity === 'sev1')).toBe(true)
  })

  it('exposes a full timeline for the approved incident', async () => {
    const services = createServices()
    const incident = await services.incidents.getById('inc_8492')
    expect(incident?.timeline.length).toBeGreaterThanOrEqual(3)
  })

  it('pauseAgent records a simulated mitigation without erasing the incident', async () => {
    const services = createServices()
    const updated = await services.incidents.pauseAgent('inc_8492')
    expect(updated.mitigations.length).toBeGreaterThan(0)

    const fetched = await services.incidents.getById('inc_8492')
    expect(fetched?.mitigations.length).toBe(updated.mitigations.length)
  })

  it('declare creates a new open incident', async () => {
    const services = createServices()
    const created = await services.incidents.declare({
      title: 'Test incident',
      severity: 'sev3',
      agentId: null,
      detail: 'Declared from a test.',
    })

    expect(created.status).toBe('open')
    const listed = await services.incidents.list()
    expect(listed.some((incident) => incident.id === created.id)).toBe(true)
  })
})

describe('MockAnalyticsRepository', () => {
  it('scales totals across periods', async () => {
    const services = createServices()
    const day = await services.analytics.snapshot('24h')
    const month = await services.analytics.snapshot('30d')

    expect(month.totalTokens).toBeGreaterThan(day.totalTokens)
    expect(month.totalCostUsd).toBeGreaterThan(day.totalCostUsd)
  })

  it('is deterministic for the same period', async () => {
    const a = await createServices().analytics.snapshot('7d')
    const b = await createServices().analytics.snapshot('7d')

    expect(a.totalTokens).toBe(b.totalTokens)
    expect(a.latencyStages).toEqual(b.latencyStages)
  })

  it('model usage percentages sum to 100', async () => {
    const services = createServices()
    const snapshot = await services.analytics.snapshot('24h')
    const total = snapshot.modelUsage.reduce((sum, usage) => sum + usage.percent, 0)
    expect(total).toBeCloseTo(100, 5)
  })

  describe('dashboard metric consistency', () => {
    // The Dashboard's top metric row and the panels beneath it must never
    // show two different numbers for the same concept — both read through
    // the same ApprovalRepository/IncidentRepository instance.
    it('the "Awaiting Approval" metric equals the approval repository pending count', async () => {
      const services = createServices()
      const [dashboard, pending] = await Promise.all([
        services.analytics.dashboard('24h'),
        services.approvals.listPending(),
      ])

      const metric = dashboard.metrics.find((m) => m.id === 'approvals')
      expect(metric?.value).toBe(String(pending.length))
    })

    it('the "Open Incidents" metric equals the incident repository open count', async () => {
      const services = createServices()
      const [dashboard, open] = await Promise.all([
        services.analytics.dashboard('24h'),
        services.incidents.listOpen(),
      ])

      const metric = dashboard.metrics.find((m) => m.id === 'incidents')
      expect(metric?.value).toBe(String(open.length))
    })

    it('resolving an approval updates the dashboard metric on the next read', async () => {
      const services = createServices()
      const before = await services.analytics.dashboard('24h')
      const beforeCount = Number(before.metrics.find((m) => m.id === 'approvals')?.value)

      const pending = await services.approvals.listPending()
      const target = pending[0]
      if (!target) throw new Error('expected at least one pending approval fixture')
      await services.approvals.resolve(target.id, 'approved', 'test@acme.com')

      const after = await services.analytics.dashboard('24h')
      const afterCount = Number(after.metrics.find((m) => m.id === 'approvals')?.value)

      expect(afterCount).toBe(beforeCount - 1)
    })

    it('mitigating an incident does not silently change the open count derivation', async () => {
      // pauseAgent only moves open -> investigating; it must not resolve the
      // incident, so the open count (and therefore the dashboard metric)
      // stays derived from the same live set before and after.
      const services = createServices()
      const openBefore = await services.incidents.listOpen()
      await services.incidents.pauseAgent(openBefore[0]!.id)

      const dashboard = await services.analytics.dashboard('24h')
      const openAfter = await services.incidents.listOpen()
      const metric = dashboard.metrics.find((m) => m.id === 'incidents')

      expect(metric?.value).toBe(String(openAfter.length))
    })
  })
})

describe('MockSettingsRepository', () => {
  it('updates organization details', async () => {
    const services = createServices()
    const updated = await services.settings.updateOrganization({
      name: 'New Org',
      timezone: 'UTC',
    })
    expect(updated.organization.name).toBe('New Org')
  })

  it('updates environment rate limits', async () => {
    const services = createServices()
    const updated = await services.settings.updateLimits({
      requestsPerMinute: 500,
      concurrentExecutions: 10,
      maxTimeoutSeconds: 30,
    })
    expect(updated.limits.requestsPerMinute).toBe(500)
  })

  it('generates a fictional demo key that is masked in the listing', async () => {
    const services = createServices()
    const { metadata, demoSecret } = await services.settings.generateApiKey('CI Key')

    expect(metadata.maskedKey).toContain('•')
    expect(demoSecret).not.toContain('•')
    expect(demoSecret.endsWith(metadata.maskedKey.slice(-4))).toBe(true)

    const settings = await services.settings.get()
    expect(settings.apiKeys.some((key) => key.id === metadata.id)).toBe(true)
  })

  it('revokes a key without removing it from the listing', async () => {
    const services = createServices()
    const { metadata } = await services.settings.generateApiKey('Temp Key')
    await services.settings.revokeApiKey(metadata.id)

    const settings = await services.settings.get()
    const key = settings.apiKeys.find((k) => k.id === metadata.id)
    expect(key?.revoked).toBe(true)
  })
})

describe('canonical model catalog', () => {
  const LEGACY_PATTERNS = [
    /gpt-4(?!o?\.\d)/i, // catches gpt-4, gpt-4-turbo, gpt-4o but not a future gpt-4.x
    /\bgpt-4o\b/i,
    /\bGPT-4\b/,
    /claude 3(\.\d)? /i,
    /claude-3-/i,
    /gemini 1\.5/i,
    /gemini-1-5/i,
    /llama 3 /i,
    /llama-3-/i,
  ]

  function assertNoLegacyName(value: string, context: string) {
    for (const pattern of LEGACY_PATTERNS) {
      expect(pattern.test(value), `${context} matched legacy pattern ${pattern}: "${value}"`).toBe(
        false,
      )
    }
  }

  it('every agent is deployed on a model from the canonical catalog', () => {
    const catalogIds = new Set(MODEL_LIST.map((model) => model.id))
    for (const agent of MOCK_AGENTS) {
      expect(catalogIds.has(agent.model.id)).toBe(true)
      assertNoLegacyName(agent.model.label, `${agent.name} model label`)
      assertNoLegacyName(agent.model.id, `${agent.name} model id`)
    }
  })

  it('no run in the corpus references a legacy model name', async () => {
    const services = createServices()
    const page = await services.runs.query({ pageSize: MOCK_RUNS.length })
    for (const run of page.items) {
      assertNoLegacyName(run.modelLabel, `run ${run.id} modelLabel`)
      assertNoLegacyName(run.modelId, `run ${run.id} modelId`)
    }
  })

  it('every run uses the model its own agent is actually deployed on', async () => {
    const services = createServices()
    const agents = await services.agents.list()
    const agentById = new Map(agents.map((agent) => [agent.id, agent]))
    const page = await services.runs.query({ pageSize: MOCK_RUNS.length })

    for (const run of page.items) {
      const agent = agentById.get(run.agentId)
      expect(agent).toBeDefined()
      expect(run.modelId).toBe(agent?.model.id)
    }
  })

  it('no evaluation result references a legacy model name', () => {
    for (const result of MOCK_EVALUATION_RESULTS) {
      assertNoLegacyName(result.targetModelId, `evaluation ${result.displayId} targetModelId`)
    }
  })

  it("the Runs Explorer's model filter only offers models actually deployed on the fleet", async () => {
    const services = createServices()
    const filterModels = await services.agents.listModels()
    const deployedIds = new Set(MOCK_AGENTS.map((agent) => agent.model.id))

    for (const model of filterModels) {
      expect(deployedIds.has(model.id)).toBe(true)
    }
  })
})
