import type { ZevqoraServices } from './contracts'

import {
  MockAgentRepository,
  MockAnalyticsRepository,
  MockApprovalRepository,
  MockEvaluationRepository,
  MockExperimentRepository,
  MockIncidentRepository,
  MockPolicyRepository,
  MockRunRepository,
  MockSessionRepository,
  MockSettingsRepository,
  MockTraceRepository,
  MockWorkspaceRepository,
} from './mock/repositories'

/**
 * Composition root for the data layer.
 *
 * This module is the single place that decides which implementation backs each
 * contract. Adding a real backend means writing `ApiRunRepository` etc. and
 * changing the object below — for example switching on an environment flag:
 *
 *   const useApi = import.meta.env.VITE_API_URL !== undefined
 *   runs: useApi ? new ApiRunRepository(client) : new MockRunRepository()
 *
 * No feature module, hook or component changes as part of that swap.
 */
export function createServices(): ZevqoraServices {
  // Built first and shared with the analytics repository below, so the
  // dashboard's metric row can never disagree with the panels — and screens —
  // that read the same approvals/incidents state.
  const approvals = new MockApprovalRepository()
  const incidents = new MockIncidentRepository()

  return {
    agents: new MockAgentRepository(),
    runs: new MockRunRepository(),
    traces: new MockTraceRepository(),
    evaluations: new MockEvaluationRepository(),
    policies: new MockPolicyRepository(),
    analytics: new MockAnalyticsRepository(approvals, incidents),
    experiments: new MockExperimentRepository(),
    approvals,
    incidents,
    workspaces: new MockWorkspaceRepository(),
    settings: new MockSettingsRepository(),
    session: new MockSessionRepository(),
  }
}

/** Default instance used by the application provider. */
export const services: ZevqoraServices = createServices()

export type { ZevqoraServices } from './contracts'
export * from './contracts'
