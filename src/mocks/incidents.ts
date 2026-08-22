import type { Incident } from '@/domain'

import { agoIso, HOUR, MINUTE, SECOND } from './demo-context'

/**
 * Open and recently-resolved incidents.
 *
 * The dashboard's Active Incidents panel and the Incidents Command Center
 * (`/incidents`) both read this list through the same repository. The first
 * three entries reproduce the dashboard panel exactly (title, severity,
 * relative time); `INC-8492` / `INC-8491` / `INC-8488` reproduce the approved
 * Incidents screen's list exactly, including INC-8492's full timeline.
 *
 * The dashboard panel caps its rendered rows at 3 (same pattern as pending
 * approvals) while its header count is live, so it now honestly reads
 * "Active Incidents (5)" rather than the fixed "(3)" the single-screen Part 1
 * export showed — the two approved exports authored different totals for the
 * same concept, and a shared live repository is the more coherent resolution.
 */
export const MOCK_INCIDENTS: readonly Incident[] = [
  {
    id: 'inc_2291',
    title: 'High Error Rate: OpenAI API',
    detail: 'Affecting 4 agent groups. Latency > 10s.',
    severity: 'sev1',
    status: 'investigating',
    environment: 'production',
    openedAt: agoIso(14 * MINUTE),
    resolvedAt: null,
    owner: 'S. Miller',
    primaryAgentId: null,
    affectedAgentIds: ['agt_8921', 'agt_114a', 'agt_2261', 'agt_7734'],
    mitigations: [],
    timeline: [
      {
        id: 'ev_1',
        timestamp: agoIso(14 * MINUTE),
        source: 'api',
        message: 'OpenAI API error rate crossed 12% over a 5 minute window.',
      },
      {
        id: 'ev_2',
        timestamp: agoIso(11 * MINUTE),
        source: 'sys',
        message: 'Auto-failover to the secondary model provider evaluated and deferred.',
      },
      {
        id: 'ev_3',
        timestamp: agoIso(6 * MINUTE),
        source: 'human',
        message: 'S. Miller acknowledged and began investigating upstream status.',
      },
    ],
  },
  {
    id: 'inc_2288',
    title: 'QA Automator runtime crash loop',
    detail:
      'AGT-900X is restarting repeatedly after a failed release probe. Staging only.',
    severity: 'sev2',
    status: 'open',
    environment: 'staging',
    openedAt: agoIso(38 * MINUTE),
    resolvedAt: null,
    owner: null,
    primaryAgentId: 'agt_900x',
    affectedAgentIds: ['agt_900x'],
    mitigations: [],
    timeline: [
      {
        id: 'ev_1',
        timestamp: agoIso(38 * MINUTE),
        source: 'sys',
        message: 'Release probe deploy_preview failed 3 consecutive times.',
      },
      {
        id: 'ev_2',
        timestamp: agoIso(35 * MINUTE),
        source: 'agent',
        message: 'agt_900x entered a restart loop following the failed probe.',
      },
    ],
  },
  {
    id: 'inc_2284',
    title: 'Elevated approval queue depth',
    detail:
      'Finance approval queue has exceeded its 15 minute SLA for 12 pending requests.',
    severity: 'sev3',
    status: 'open',
    environment: 'production',
    openedAt: agoIso(3 * HOUR),
    resolvedAt: null,
    owner: null,
    primaryAgentId: 'agt_114a',
    affectedAgentIds: ['agt_114a'],
    mitigations: [],
    timeline: [
      {
        id: 'ev_1',
        timestamp: agoIso(3 * HOUR),
        source: 'sys',
        message: 'Finance approval queue depth exceeded its 15 minute SLA.',
      },
    ],
  },
  {
    id: 'inc_8492',
    title: 'Infinite loop detected in CustomerSupport-v2',
    detail: 'Agent entered a retry loop following a truncated tool context.',
    severity: 'sev1',
    status: 'open',
    environment: 'production',
    openedAt: agoIso(14 * MINUTE),
    resolvedAt: null,
    owner: 'Sarah J.',
    primaryAgentId: 'agt_8921',
    affectedAgentIds: ['agt_8921'],
    mitigations: [],
    timeline: [
      {
        id: 'ev_1',
        timestamp: agoIso(14 * MINUTE),
        source: 'sys',
        message: 'CPU usage spike >95% sustained for 60s. Auto-mitigation failed.',
      },
      {
        id: 'ev_2',
        timestamp: agoIso(14 * MINUTE + 53 * SECOND),
        source: 'agent',
        message: 'agent-cs-09x entering retry loop for prompt hash 0x8f9a2b',
        payload: JSON.stringify(
          {
            error: 'Context length exceeded',
            action: 'retry_with_truncation',
            attempt: 42,
          },
          null,
          2,
        ),
      },
      {
        id: 'ev_3',
        timestamp: agoIso(17 * MINUTE + 21 * SECOND),
        source: 'api',
        message: 'Received malformed customer payload. Triggering fallback parser.',
      },
    ],
  },
  {
    id: 'inc_8491',
    title: 'High latency in Database-Query-Agent',
    detail: 'P90 latency for research query tools has tripled over 30 minutes.',
    severity: 'sev2',
    status: 'investigating',
    environment: 'production',
    openedAt: agoIso(42 * MINUTE),
    resolvedAt: null,
    owner: 'Mike K.',
    primaryAgentId: 'agt_7734',
    affectedAgentIds: ['agt_7734'],
    mitigations: [],
    timeline: [
      {
        id: 'ev_1',
        timestamp: agoIso(42 * MINUTE),
        source: 'sys',
        message: 'P90 latency for search_knowledge_base exceeded 3x baseline.',
      },
      {
        id: 'ev_2',
        timestamp: agoIso(30 * MINUTE),
        source: 'agent',
        message: 'agt_7734 began queueing requests rather than failing fast.',
      },
      {
        id: 'ev_3',
        timestamp: agoIso(9 * MINUTE),
        source: 'human',
        message: 'Mike K. is investigating the vector index backing this tool.',
      },
    ],
  },
  {
    id: 'inc_8488',
    title: 'Policy violation attempt: Unauthorized API access',
    detail: 'An agent attempted a tool call blocked by an active policy.',
    severity: 'sev3',
    status: 'mitigated',
    environment: 'production',
    openedAt: agoIso(2 * HOUR),
    resolvedAt: null,
    owner: 'System',
    primaryAgentId: 'agt_4417',
    affectedAgentIds: ['agt_4417'],
    mitigations: ['Blocked automatically by POL-018 rate limiting.'],
    timeline: [
      {
        id: 'ev_1',
        timestamp: agoIso(2 * HOUR),
        source: 'sys',
        message: 'quarantine_host called against a host outside the allowed CIDR range.',
      },
      {
        id: 'ev_2',
        timestamp: agoIso(2 * HOUR - 2 * MINUTE),
        source: 'sys',
        message: 'Blocked by POL-001. No customer data was accessed.',
      },
    ],
  },
]
