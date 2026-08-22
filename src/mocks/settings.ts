import type { WorkspaceSettings } from '@/domain'

import { agoIso, DAY, HOUR } from './demo-context'

/**
 * Settings (`/settings`).
 *
 * The organisation name is kept as "Acme Cloud" rather than the approved
 * screen's literal "Acme Corp Control" so it stays coherent with the
 * workspace name shown everywhere else in the shell (sidebar, session,
 * dashboard) — the same reconciliation already applied to agent naming.
 *
 * API key fragments are fictional demo strings. No real secret exists here or
 * anywhere else in this repository.
 */
export const MOCK_SETTINGS: WorkspaceSettings = {
  organization: {
    name: 'Acme Cloud',
    timezone: 'UTC (Coordinated Universal Time)',
  },
  activeEnvironment: 'production',
  limits: {
    requestsPerMinute: 10_000,
    concurrentExecutions: 250,
    maxTimeoutSeconds: 120,
  },
  apiKeys: [
    {
      id: 'key_ci',
      name: 'Production CI/CD',
      maskedKey: 'pk_live_••••••••a9b2',
      createdAt: agoIso(28 * DAY),
      revoked: false,
    },
    {
      id: 'key_dev',
      name: 'Local Dev - Alice',
      maskedKey: 'pk_test_••••••••f4c1',
      createdAt: agoIso(19 * DAY + 6 * HOUR),
      revoked: false,
    },
    {
      id: 'key_analytics',
      name: 'Analytics Exporter',
      maskedKey: 'pk_live_••••••••77x9',
      createdAt: agoIso(6 * DAY),
      revoked: false,
    },
  ],
}
