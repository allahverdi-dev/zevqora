import type { Environment, IsoTimestamp } from './common'

export interface OrganizationProfile {
  readonly name: string
  readonly timezone: string
}

export interface EnvironmentLimits {
  readonly requestsPerMinute: number
  readonly concurrentExecutions: number
  readonly maxTimeoutSeconds: number
}

/**
 * A demo API key's metadata only. The full secret is never stored, generated
 * or displayed by this frontend-only release — see `generateApiKey`.
 */
export interface ApiKeyMetadata {
  readonly id: string
  readonly name: string
  readonly maskedKey: string
  readonly createdAt: IsoTimestamp
  readonly revoked: boolean
}

export interface WorkspaceSettings {
  readonly organization: OrganizationProfile
  readonly activeEnvironment: Environment
  readonly limits: EnvironmentLimits
  readonly apiKeys: readonly ApiKeyMetadata[]
}

export interface UpdateOrganizationInput {
  readonly name: string
  readonly timezone: string
}
