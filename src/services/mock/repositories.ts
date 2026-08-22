import type {
  Agent,
  AgentFilter,
  AgentId,
  AgentModel,
  AnalyticsPeriod,
  AnalyticsSnapshot,
  ApiKeyMetadata,
  ApprovalDecision,
  ApprovalFilter,
  ApprovalHistoryEntry,
  ApprovalId,
  ApprovalRequest,
  CreateExperimentInput,
  CriterionScore,
  DashboardAnalytics,
  DeclareIncidentInput,
  Environment,
  EvaluationFilter,
  EvaluationHealth,
  EvaluationResult,
  EvaluationSuite,
  EvaluationSuiteId,
  Experiment,
  Incident,
  IncidentFilter,
  IncidentId,
  ModelComparisonSeries,
  Page,
  Policy,
  PolicyDraft,
  PolicyFilter,
  PolicyId,
  Run,
  RunId,
  RunPeriod,
  RunQuery,
  RunSummary,
  Trace,
  UpdateOrganizationInput,
  UsageMetric,
  Workspace,
  WorkspaceSettings,
} from '@/domain'
import type {
  AgentRepository,
  AnalyticsRepository,
  ApprovalRepository,
  EvaluationRepository,
  ExperimentRepository,
  IncidentRepository,
  PolicyRepository,
  RunRepository,
  Session,
  SessionRepository,
  SettingsRepository,
  TraceRepository,
  WorkspaceRepository,
} from '@/services/contracts'

import { MOCK_AGENTS } from '@/mocks/agents'
import {
  buildAnalyticsSnapshot,
  buildCostSeries,
  buildExecutionSeries,
  MOCK_DASHBOARD_METRICS,
} from '@/mocks/analytics'
import { MOCK_APPROVAL_HISTORY, MOCK_APPROVALS } from '@/mocks/approvals'
import {
  DEMO_ACCOUNT,
  DEMO_WORKSPACE,
  DEMO_WORKSPACES,
} from '@/mocks/demo-context'
import {
  MOCK_CRITERIA_SCORES,
  MOCK_EVALUATION_HEALTH,
  MOCK_EVALUATION_RESULTS,
  MOCK_MODEL_COMPARISON,
  MOCK_SUITES,
} from '@/mocks/evaluations'
import { MOCK_EXPERIMENTS } from '@/mocks/experiments'
import { MOCK_INCIDENTS } from '@/mocks/incidents'
import { MOCK_POLICIES } from '@/mocks/policies'
import { MOCK_RUNS } from '@/mocks/runs'
import { MOCK_SETTINGS } from '@/mocks/settings'
import { getMockTrace } from '@/mocks/traces'
import { createRandom } from '@/lib/random'

import { delay } from './latency'
import { queryRuns, summarizeRuns } from './run-query'

/**
 * In-memory repository implementations.
 *
 * These are the only modules permitted to import from `@/mocks`. Everything
 * above this layer — features, hooks, components — depends on the contracts in
 * `@/services/contracts` and never on the seed data itself.
 *
 * Mutations (policy edits, approval decisions) are held in module-local state
 * so the demo behaves like a real application within a session, while making
 * it obvious that nothing is persisted or server-enforced.
 */

export class MockAgentRepository implements AgentRepository {
  async list(filter?: AgentFilter): Promise<Agent[]> {
    let agents = MOCK_AGENTS.slice()

    if (filter?.status && filter.status !== 'all') {
      agents = agents.filter((agent) => agent.status === filter.status)
    }

    if (filter?.environment && filter.environment !== 'all') {
      agents = agents.filter((agent) => agent.environment === filter.environment)
    }

    const search = filter?.search?.trim().toLowerCase()
    if (search) {
      agents = agents.filter((agent) =>
        `${agent.name} ${agent.displayId} ${agent.model.label}`
          .toLowerCase()
          .includes(search),
      )
    }

    return delay(agents)
  }

  async getById(id: AgentId): Promise<Agent | null> {
    return delay(MOCK_AGENTS.find((agent) => agent.id === id) ?? null)
  }

  async getByIds(ids: readonly AgentId[]): Promise<Agent[]> {
    // Ordered by the requested ids so callers control presentation order.
    const index = new Map(MOCK_AGENTS.map((agent) => [agent.id, agent]))
    return delay(
      ids
        .map((id) => index.get(id))
        .filter((agent): agent is Agent => agent !== undefined),
    )
  }

  async listModels(): Promise<AgentModel[]> {
    // Only models actually deployed on the fleet — a filter option that could
    // never match a run is worse than no option at all. Evaluation-only
    // models (e.g. Custom Finetune v2) are deliberately excluded here; they
    // still appear in `MODEL_LIST` for the Evaluations screen.
    const deployed = new Map(MOCK_AGENTS.map((agent) => [agent.model.id, agent.model]))
    return delay(Array.from(deployed.values()))
  }
}

export class MockRunRepository implements RunRepository {
  async query(query: RunQuery = {}): Promise<Page<Run>> {
    return delay(queryRuns(MOCK_RUNS, query))
  }

  async getById(id: RunId): Promise<Run | null> {
    return delay(MOCK_RUNS.find((run) => run.id === id) ?? null)
  }

  async recent(limit: number): Promise<Run[]> {
    return delay(MOCK_RUNS.slice(0, limit))
  }

  async summary(period: RunPeriod): Promise<RunSummary> {
    return delay(summarizeRuns(MOCK_RUNS, period))
  }
}

export class MockTraceRepository implements TraceRepository {
  async getByRunId(runId: RunId): Promise<Trace | null> {
    return delay(getMockTrace(runId))
  }
}

export class MockEvaluationRepository implements EvaluationRepository {
  /** Results produced by `runSuite` during this session, newest first. */
  private sessionResults: EvaluationResult[] = []

  async listSuites(): Promise<EvaluationSuite[]> {
    return delay(MOCK_SUITES.slice())
  }

  async listResults(filter?: EvaluationFilter): Promise<EvaluationResult[]> {
    let results = [...this.sessionResults, ...MOCK_EVALUATION_RESULTS]

    if (filter?.suiteId && filter.suiteId !== 'all') {
      results = results.filter((result) => result.suiteId === filter.suiteId)
    }

    if (filter?.status && filter.status !== 'all') {
      results = results.filter((result) => result.status === filter.status)
    }

    return delay(
      results.sort(
        (a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime(),
      ),
    )
  }

  async health(): Promise<EvaluationHealth> {
    return delay(MOCK_EVALUATION_HEALTH)
  }

  async criteria(): Promise<CriterionScore[]> {
    return delay(MOCK_CRITERIA_SCORES.slice())
  }

  async modelComparison(): Promise<ModelComparisonSeries[]> {
    return delay(MOCK_MODEL_COMPARISON.slice())
  }

  async runSuite(suiteId: EvaluationSuiteId): Promise<EvaluationResult> {
    const suite = MOCK_SUITES.find((candidate) => candidate.id === suiteId)
    if (!suite) throw new Error(`Unknown evaluation suite: ${suiteId}`)

    // Seeded on the suite and the number of runs already performed, so a
    // repeated run produces a different — but still reproducible — result.
    const next = createRandom(suiteId.length * 977 + this.sessionResults.length)
    const score = Number((78 + next() * 20).toFixed(1))

    const result: EvaluationResult = {
      id: `eval_session_${this.sessionResults.length}`,
      suiteId,
      displayId: `EVL-${Math.floor(next() * 9000 + 1000)}`,
      targetModelId: 'claude-opus-5',
      status: score >= 85 ? 'passed' : 'failed',
      score,
      ranAt: new Date().toISOString(),
      criteriaScores: suite.criteria.map((criterion) => ({
        criterion,
        score: Number(
          Math.min(99.9, Math.max(40, score + (next() - 0.5) * 12)).toFixed(1),
        ),
        threshold: criterion === 'safety' ? 99 : 85,
      })),
    }

    this.sessionResults = [result, ...this.sessionResults]
    return delay(result)
  }
}

export class MockPolicyRepository implements PolicyRepository {
  /** Session-local overlay. Edits are frontend-only and never persisted. */
  private overrides = new Map<PolicyId, Policy>()

  private resolve(policy: Policy): Policy {
    return this.overrides.get(policy.id) ?? policy
  }

  async list(filter?: PolicyFilter): Promise<Policy[]> {
    let policies = MOCK_POLICIES.map((policy) => this.resolve(policy))

    if (filter?.status && filter.status !== 'all') {
      policies = policies.filter((policy) => policy.status === filter.status)
    }

    if (filter?.category && filter.category !== 'all') {
      policies = policies.filter((policy) => policy.category === filter.category)
    }

    const search = filter?.search?.trim().toLowerCase()
    if (search) {
      policies = policies.filter((policy) =>
        `${policy.name} ${policy.displayId} ${policy.description}`
          .toLowerCase()
          .includes(search),
      )
    }

    return delay(policies)
  }

  async getById(id: PolicyId): Promise<Policy | null> {
    const base = MOCK_POLICIES.find((policy) => policy.id === id)
    return delay(base ? this.resolve(base) : null)
  }

  async update(id: PolicyId, draft: PolicyDraft): Promise<Policy> {
    const base = MOCK_POLICIES.find((policy) => policy.id === id)
    if (!base) throw new Error(`Unknown policy: ${id}`)

    const updated: Policy = {
      ...this.resolve(base),
      name: draft.name,
      description: draft.description,
      definition: draft.definition,
      status: draft.status,
      severity: draft.severity,
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 's.miller@acme.com',
    }

    this.overrides.set(id, updated)
    return delay(updated)
  }

  async setStatus(id: PolicyId, status: Policy['status']): Promise<Policy> {
    const base = MOCK_POLICIES.find((policy) => policy.id === id)
    if (!base) throw new Error(`Unknown policy: ${id}`)

    const updated: Policy = {
      ...this.resolve(base),
      status,
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 's.miller@acme.com',
    }

    this.overrides.set(id, updated)
    return delay(updated)
  }
}

export class MockAnalyticsRepository implements AnalyticsRepository {
  /**
   * Takes the same approval/incident repository instances the dashboard's
   * panels and the dedicated Approvals/Incidents screens use, rather than
   * recomputing from the raw seed arrays. The "Awaiting Approval" and "Open
   * Incidents" metric cards are derived from those live calls every time, so
   * they can never drift from the panels beneath them or from a decision made
   * elsewhere in the session — there is exactly one number for each concept.
   */
  private readonly approvals: Pick<ApprovalRepository, 'listPending'>
  private readonly incidents: Pick<IncidentRepository, 'listOpen'>

  constructor(
    approvals: Pick<ApprovalRepository, 'listPending'>,
    incidents: Pick<IncidentRepository, 'listOpen'>,
  ) {
    this.approvals = approvals
    this.incidents = incidents
  }

  async dashboard(period: RunPeriod): Promise<DashboardAnalytics> {
    const [pendingApprovals, openIncidents] = await Promise.all([
      this.approvals.listPending(),
      this.incidents.listOpen(),
    ])

    const metrics = MOCK_DASHBOARD_METRICS.map((metric): UsageMetric => {
      if (metric.id === 'approvals') {
        return { ...metric, value: String(pendingApprovals.length) }
      }
      if (metric.id === 'incidents') {
        return { ...metric, value: String(openIncidents.length) }
      }
      return metric
    })

    return delay({
      metrics,
      execution: buildExecutionSeries(period),
      cost: buildCostSeries(period),
    })
  }

  async snapshot(period: AnalyticsPeriod): Promise<AnalyticsSnapshot> {
    return delay(buildAnalyticsSnapshot(period))
  }
}

export class MockExperimentRepository implements ExperimentRepository {
  /** Experiments created during this session, newest first. */
  private created: Experiment[] = []

  async list(): Promise<Experiment[]> {
    return delay([...this.created, ...MOCK_EXPERIMENTS])
  }

  async getById(id: string): Promise<Experiment | null> {
    const all = [...this.created, ...MOCK_EXPERIMENTS]
    return delay(all.find((experiment) => experiment.id === id) ?? null)
  }

  async create(input: CreateExperimentInput): Promise<Experiment> {
    const next = createRandom(input.name.length * 733 + this.created.length)
    const suffix = String.fromCharCode(65 + Math.floor(next() * 26))
    const experiment: Experiment = {
      id: `EXP-${Math.floor(100 + next() * 899)}${suffix}`,
      name: input.name,
      type: input.type,
      status: 'draft',
      startedAt: new Date().toISOString(),
      durationLabel: '0h',
      baseVariant: { label: 'Variant A', model: input.baseModel },
      challengerVariant: { label: 'Variant B', model: input.challengerModel },
      trafficAllocation: input.trafficAllocation,
      comparisons: [
        { metric: 'Accuracy', unit: 'percent', variantA: 0, variantB: 0 },
        { metric: 'Latency', unit: 'seconds', variantA: 0, variantB: 0 },
        { metric: 'Cost/Req', unit: 'usd', variantA: 0, variantB: 0 },
      ],
      deltaKpi: 0,
    }

    this.created = [experiment, ...this.created]
    return delay(experiment)
  }
}

export class MockApprovalRepository implements ApprovalRepository {
  private resolved = new Map<ApprovalId, ApprovalRequest>()
  private sessionHistory: ApprovalHistoryEntry[] = []

  private all(): ApprovalRequest[] {
    return MOCK_APPROVALS.map(
      (approval) => this.resolved.get(approval.id) ?? approval,
    )
  }

  async listPending(): Promise<ApprovalRequest[]> {
    return delay(this.all().filter((approval) => approval.status === 'pending'))
  }

  async list(filter?: ApprovalFilter): Promise<ApprovalRequest[]> {
    let approvals = this.all()

    if (filter?.urgency && filter.urgency !== 'all') {
      approvals = approvals.filter((approval) => approval.severity === filter.urgency)
    }

    const search = filter?.search?.trim().toLowerCase()
    if (search) {
      approvals = approvals.filter((approval) =>
        `${approval.requestCode} ${approval.requestedBy} ${approval.action}`
          .toLowerCase()
          .includes(search),
      )
    }

    return delay(approvals)
  }

  async resolve(
    id: ApprovalId,
    decision: ApprovalDecision,
    resolvedBy: string,
  ): Promise<ApprovalRequest> {
    const base = MOCK_APPROVALS.find((approval) => approval.id === id)
    if (!base) throw new Error(`Unknown approval: ${id}`)

    const decidedAt = new Date().toISOString()
    const updated: ApprovalRequest = {
      ...base,
      status: decision,
      resolvedAt: decidedAt,
      resolvedBy,
    }

    this.resolved.set(id, updated)
    this.sessionHistory = [
      {
        id: `aprh_session_${this.sessionHistory.length}`,
        requestCode: base.requestCode,
        action: base.action,
        decision,
        admin: resolvedBy,
        decidedAt,
      },
      ...this.sessionHistory,
    ]

    return delay(updated)
  }

  async history(limit = 20): Promise<ApprovalHistoryEntry[]> {
    return delay([...this.sessionHistory, ...MOCK_APPROVAL_HISTORY].slice(0, limit))
  }
}

export class MockIncidentRepository implements IncidentRepository {
  private overrides = new Map<IncidentId, Incident>()
  private declared: Incident[] = []

  private resolve(incident: Incident): Incident {
    return this.overrides.get(incident.id) ?? incident
  }

  private all(): Incident[] {
    return [...this.declared, ...MOCK_INCIDENTS].map((incident) =>
      this.resolve(incident),
    )
  }

  async listOpen(): Promise<Incident[]> {
    return delay(this.all().filter((incident) => incident.status !== 'resolved'))
  }

  async list(filter?: IncidentFilter): Promise<Incident[]> {
    let incidents = this.all()

    if (filter?.severity && filter.severity !== 'all') {
      incidents = incidents.filter((incident) => incident.severity === filter.severity)
    }

    return delay(incidents)
  }

  async getById(id: IncidentId): Promise<Incident | null> {
    return delay(this.all().find((incident) => incident.id === id) ?? null)
  }

  private applyMitigation(id: IncidentId, note: string): Incident {
    const base = this.all().find((incident) => incident.id === id)
    if (!base) throw new Error(`Unknown incident: ${id}`)

    const updated: Incident = {
      ...base,
      status: base.status === 'open' ? 'investigating' : base.status,
      mitigations: [...base.mitigations, note],
    }
    this.overrides.set(id, updated)
    return updated
  }

  async pauseAgent(id: IncidentId): Promise<Incident> {
    return delay(
      this.applyMitigation(
        id,
        `Agent paused (simulated) at ${new Date().toISOString()}.`,
      ),
    )
  }

  async rollback(id: IncidentId): Promise<Incident> {
    return delay(
      this.applyMitigation(
        id,
        `Rolled back to the last stable release (simulated) at ${new Date().toISOString()}.`,
      ),
    )
  }

  async declare(input: DeclareIncidentInput): Promise<Incident> {
    const next = createRandom(input.title.length * 613 + this.declared.length)
    const incident: Incident = {
      id: `inc_declared_${this.declared.length}`,
      title: input.title,
      detail: input.detail,
      severity: input.severity,
      status: 'open',
      environment: 'production',
      openedAt: new Date().toISOString(),
      resolvedAt: null,
      owner: null,
      primaryAgentId: input.agentId,
      affectedAgentIds: input.agentId ? [input.agentId] : [],
      mitigations: [],
      timeline: [
        {
          id: `dec_${Math.floor(next() * 9999)}`,
          timestamp: new Date().toISOString(),
          source: 'human',
          message: 'Incident declared manually from the command center.',
        },
      ],
    }

    this.declared = [incident, ...this.declared]
    return delay(incident)
  }
}

export class MockWorkspaceRepository implements WorkspaceRepository {
  async current(): Promise<Workspace> {
    return delay(DEMO_WORKSPACE)
  }

  async list(): Promise<Workspace[]> {
    return delay(DEMO_WORKSPACES.slice())
  }
}

export class MockSettingsRepository implements SettingsRepository {
  /** Session-local; edits are frontend-only and never persisted. */
  private state: WorkspaceSettings = MOCK_SETTINGS

  async get(): Promise<WorkspaceSettings> {
    return delay(this.state)
  }

  async updateOrganization(
    input: UpdateOrganizationInput,
  ): Promise<WorkspaceSettings> {
    this.state = { ...this.state, organization: { ...input } }
    return delay(this.state)
  }

  async setEnvironment(environment: Environment): Promise<WorkspaceSettings> {
    this.state = { ...this.state, activeEnvironment: environment }
    return delay(this.state)
  }

  async updateLimits(
    limits: WorkspaceSettings['limits'],
  ): Promise<WorkspaceSettings> {
    this.state = { ...this.state, limits: { ...limits } }
    return delay(this.state)
  }

  async generateApiKey(
    name: string,
  ): Promise<{ readonly metadata: ApiKeyMetadata; readonly demoSecret: string }> {
    const next = createRandom(name.length * 941 + this.state.apiKeys.length)
    const fragment = Array.from({ length: 24 }, () =>
      '0123456789abcdef'[Math.floor(next() * 16)],
    ).join('')
    const suffix = fragment.slice(-4)

    const metadata: ApiKeyMetadata = {
      id: `key_session_${this.state.apiKeys.length}`,
      name,
      maskedKey: `pk_live_${'•'.repeat(16)}${suffix}`,
      createdAt: new Date().toISOString(),
      revoked: false,
    }

    this.state = { ...this.state, apiKeys: [metadata, ...this.state.apiKeys] }

    // The full value is a fictional demo secret, returned once and never
    // stored — ZEVQORA does not persist or transmit real credentials.
    return delay({ metadata, demoSecret: `pk_live_${fragment}` })
  }

  async revokeApiKey(id: string): Promise<void> {
    this.state = {
      ...this.state,
      apiKeys: this.state.apiKeys.map((key) =>
        key.id === id ? { ...key, revoked: true } : key,
      ),
    }
    await delay(undefined)
  }
}

export class MockSessionRepository implements SessionRepository {
  async current(): Promise<Session> {
    return delay({
      account: DEMO_ACCOUNT,
      workspace: DEMO_WORKSPACE,
      environment: 'production',
    })
  }
}
