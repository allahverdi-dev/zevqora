/**
 * Repository contracts — the seam between the UI and its data source.
 *
 * Every screen talks to these interfaces and never to a mock array. Swapping
 * `MockAgentRepository` for an `ApiAgentRepository` that issues HTTP requests
 * is a change confined to `services/index.ts`; no component, hook or feature
 * module needs to be rewritten.
 *
 * All methods are async and Promise-returning even though the mock layer could
 * answer synchronously — that is deliberate, so the call sites already handle
 * latency, loading and failure the way they will have to against a network.
 */

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
  Workspace,
  WorkspaceSettings,
} from '@/domain'

export interface AgentRepository {
  list(filter?: AgentFilter): Promise<Agent[]>
  getById(id: AgentId): Promise<Agent | null>
  /** Resolves several agents at once — used by the policy "Applied To" list. */
  getByIds(ids: readonly AgentId[]): Promise<Agent[]>
  /** Model catalogue available to this workspace, for filter controls. */
  listModels(): Promise<AgentModel[]>
}

export interface RunRepository {
  /** Paged, filtered and sorted query backing the Runs Explorer. */
  query(query?: RunQuery): Promise<Page<Run>>
  getById(id: RunId): Promise<Run | null>
  /** Most recent runs for the dashboard panel. */
  recent(limit: number): Promise<Run[]>
  summary(period: RunPeriod): Promise<RunSummary>
}

export interface TraceRepository {
  getByRunId(runId: RunId): Promise<Trace | null>
}

export interface EvaluationRepository {
  listSuites(): Promise<EvaluationSuite[]>
  listResults(filter?: EvaluationFilter): Promise<EvaluationResult[]>
  health(): Promise<EvaluationHealth>
  /** Aggregate per-criterion scores across the active suites. */
  criteria(): Promise<CriterionScore[]>
  modelComparison(): Promise<ModelComparisonSeries[]>
  /**
   * Runs a suite. In this release the mock implementation produces a
   * deterministic result after a short delay; the contract is shaped so a real
   * implementation can return a queued job the UI then polls or subscribes to.
   */
  runSuite(suiteId: EvaluationSuiteId): Promise<EvaluationResult>
}

export interface PolicyRepository {
  list(filter?: PolicyFilter): Promise<Policy[]>
  getById(id: PolicyId): Promise<Policy | null>
  update(id: PolicyId, draft: PolicyDraft): Promise<Policy>
  setStatus(id: PolicyId, status: Policy['status']): Promise<Policy>
}

export interface AnalyticsRepository {
  /** Rolling overview backing the dashboard's metric row and bento charts. */
  dashboard(period: RunPeriod): Promise<DashboardAnalytics>
  /** Long-term fleet telemetry backing the dedicated Analytics screen. */
  snapshot(period: AnalyticsPeriod): Promise<AnalyticsSnapshot>
}

export interface ExperimentRepository {
  list(): Promise<Experiment[]>
  getById(id: string): Promise<Experiment | null>
  create(input: CreateExperimentInput): Promise<Experiment>
}

/**
 * The dashboard's Pending Approvals panel and the dedicated Approval Queue
 * screen (`/approvals`) both read through this contract, so a decision made
 * in either place is reflected in the other within the same session.
 */
export interface ApprovalRepository {
  listPending(): Promise<ApprovalRequest[]>
  /** Full queue including resolved items, for the Approvals screen filters. */
  list(filter?: ApprovalFilter): Promise<ApprovalRequest[]>
  resolve(
    id: ApprovalId,
    decision: ApprovalDecision,
    resolvedBy: string,
  ): Promise<ApprovalRequest>
  /** Recent decisions, newest first, for the Recent History strip. */
  history(limit?: number): Promise<ApprovalHistoryEntry[]>
}

export interface IncidentRepository {
  listOpen(): Promise<Incident[]>
  list(filter?: IncidentFilter): Promise<Incident[]>
  getById(id: IncidentId): Promise<Incident | null>
  /** Simulated mitigations — frontend state only, never a live agent. */
  pauseAgent(id: IncidentId): Promise<Incident>
  rollback(id: IncidentId): Promise<Incident>
  declare(input: DeclareIncidentInput): Promise<Incident>
}

export interface WorkspaceRepository {
  current(): Promise<Workspace>
  list(): Promise<Workspace[]>
}

export interface SettingsRepository {
  get(): Promise<WorkspaceSettings>
  updateOrganization(input: UpdateOrganizationInput): Promise<WorkspaceSettings>
  setEnvironment(environment: Environment): Promise<WorkspaceSettings>
  updateLimits(
    limits: WorkspaceSettings['limits'],
  ): Promise<WorkspaceSettings>
  generateApiKey(name: string): Promise<{
    readonly metadata: ApiKeyMetadata
    /** Full fictional demo secret, shown once at creation time only. */
    readonly demoSecret: string
  }>
  revokeApiKey(id: string): Promise<void>
}

/**
 * The signed-in identity and its active environment.
 *
 * This release ships an authenticated demo workspace with a fictional account;
 * the contract is the seam where real authentication will attach.
 */
export interface SessionAccount {
  readonly name: string
  readonly role: string
  readonly email: string
  readonly plan: string
  readonly avatarUrl: string
}

export interface Session {
  readonly account: SessionAccount
  readonly workspace: Workspace
  readonly environment: string
}

export interface SessionRepository {
  current(): Promise<Session>
}

/** The full data surface available to the application. */
export interface ZevqoraServices {
  readonly agents: AgentRepository
  readonly runs: RunRepository
  readonly traces: TraceRepository
  readonly evaluations: EvaluationRepository
  readonly policies: PolicyRepository
  readonly analytics: AnalyticsRepository
  readonly experiments: ExperimentRepository
  readonly approvals: ApprovalRepository
  readonly incidents: IncidentRepository
  readonly workspaces: WorkspaceRepository
  readonly settings: SettingsRepository
  readonly session: SessionRepository
}
