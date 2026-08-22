import type { Workspace } from '@/domain'

import { DEMO_INSTANT } from '@/lib/clock'

/**
 * Fixed anchors for the demo dataset.
 *
 * Every timestamp in the mock layer is derived from `DEMO_NOW` rather than
 * `Date.now()`, so relative labels ("2 mins ago") match the approved renders
 * and stay stable across reloads, snapshots and test runs. The instant itself
 * comes from `lib/clock` so the UI can read the same reference time without
 * importing anything from this module.
 */
export const DEMO_NOW = DEMO_INSTANT
export const DEMO_NOW_MS = DEMO_NOW.getTime()

/** Offsets a fixed number of milliseconds back from the demo instant. */
export function agoIso(ms: number): string {
  return new Date(DEMO_NOW_MS - ms).toISOString()
}

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/**
 * The fictional workspace and account used throughout the demo.
 * No real organisation or person is represented.
 */
export const DEMO_WORKSPACE: Workspace = {
  id: 'ws_acme_cloud',
  name: 'Acme Cloud',
  slug: 'acme-cloud',
  environments: ['production', 'staging', 'sandbox'],
}

export const DEMO_WORKSPACES: readonly Workspace[] = [
  DEMO_WORKSPACE,
  {
    id: 'ws_acme_labs',
    name: 'Acme Labs',
    slug: 'acme-labs',
    environments: ['staging', 'sandbox', 'development'],
  },
]

export interface DemoAccount {
  readonly name: string
  readonly role: string
  readonly email: string
  readonly plan: string
  readonly avatarUrl: string
}

/** Fictional demo account. The avatar is a local asset, not a remote URL. */
export const DEMO_ACCOUNT: DemoAccount = {
  name: 'Lead Architect',
  role: 'Lead Architect',
  email: 's.miller@acme.com',
  plan: 'PRO ACCOUNT',
  avatarUrl: '/demo/avatar.png',
}
