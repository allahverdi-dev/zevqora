import { useEffect, useState } from 'react'
import {
  Building2,
  Copy,
  CreditCard,
  Key,
  Settings as SettingsIcon,
  Shield,
  Upload,
  Users,
} from 'lucide-react'

import type { Environment, WorkspaceSettings } from '@/domain'
import { ENVIRONMENTS, ENVIRONMENT_LABELS } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { useEnvironment } from '@/app/providers/EnvironmentProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { PageHeader } from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { LoadingState } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTimeShort } from '@/lib/format'
import { cx } from '@/lib/cx'

import styles from '@/features/settings/settings.module.css'

type SettingsTab = 'general' | 'workspace' | 'team' | 'security' | 'api-keys' | 'billing'

const TABS: readonly { readonly id: SettingsTab; readonly label: string; readonly icon: typeof SettingsIcon }[] = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

const TIMEZONES = [
  'UTC (Coordinated Universal Time)',
  'America/New_York (Eastern Time)',
  'America/Los_Angeles (Pacific Time)',
  'Europe/London (GMT/BST)',
]

/** Settings — general config, environment limits, and demo API keys. */
export function SettingsPage() {
  const services = useServices()
  const { toast } = useToast()
  const { environment, setEnvironment } = useEnvironment()

  const [tab, setTab] = useState<SettingsTab>('general')
  const [version, setVersion] = useState(0)

  const settings = useAsync(() => services.settings.get(), [services, version])
  const data = settings.state.status === 'success' ? settings.state.data : null

  const [orgName, setOrgName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [limits, setLimits] = useState<WorkspaceSettings['limits'] | null>(null)
  const [savingOrg, setSavingOrg] = useState(false)
  const [savingLimits, setSavingLimits] = useState(false)

  const [newKeyName, setNewKeyName] = useState('')
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)
  const [demoSecret, setDemoSecret] = useState<{ name: string; secret: string } | null>(null)

  useEffect(() => {
    if (!data) return
    setOrgName(data.organization.name)
    setTimezone(data.organization.timezone)
    setLimits(data.limits)
  }, [data])

  async function saveOrganization() {
    setSavingOrg(true)
    try {
      await services.settings.updateOrganization({ name: orgName, timezone })
      setVersion((v) => v + 1)
      toast({ tone: 'success', title: 'Organization settings saved' })
    } catch {
      toast({ tone: 'error', title: 'Could not save organization settings' })
    } finally {
      setSavingOrg(false)
    }
  }

  async function saveLimits() {
    if (!limits) return
    setSavingLimits(true)
    try {
      await services.settings.updateLimits(limits)
      setVersion((v) => v + 1)
      toast({ tone: 'success', title: 'Environment limits saved' })
    } catch {
      toast({ tone: 'error', title: 'Could not save environment limits' })
    } finally {
      setSavingLimits(false)
    }
  }

  async function switchEnvironment(next: Environment) {
    setEnvironment(next)
    toast({
      tone: 'info',
      title: `Switched to ${ENVIRONMENT_LABELS[next]}`,
      detail: 'This changes the demo environment indicator only.',
    })
  }

  async function generateKey() {
    if (newKeyName.trim().length === 0) return
    try {
      const { metadata, demoSecret: secret } = await services.settings.generateApiKey(
        newKeyName.trim(),
      )
      setVersion((v) => v + 1)
      setNewKeyName('')
      setDemoSecret({ name: metadata.name, secret })
      toast({ tone: 'success', title: 'API key generated', detail: metadata.name })
    } catch {
      toast({ tone: 'error', title: 'Could not generate a key' })
    }
  }

  async function revokeKey(id: string) {
    try {
      await services.settings.revokeApiKey(id)
      setVersion((v) => v + 1)
      toast({ tone: 'info', title: 'API key revoked' })
    } catch {
      toast({ tone: 'error', title: 'Could not revoke the key' })
    } finally {
      setRevokeTarget(null)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Settings"
        icon={<SettingsIcon size={26} />}
        description="Configure global platform behavior, manage workspace environments, and control access and security parameters."
      />

      {settings.state.status === 'loading' || !data || !limits ? (
        <LoadingState label="Loading settings" rows={6} />
      ) : (
        <div className={styles.layout}>
          <nav className={styles.tabs} aria-label="Settings sections">
            {TABS.map((entry) => {
              const Icon = entry.icon
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={cx(styles.tab, tab === entry.id && styles.tabActive)}
                  aria-current={tab === entry.id ? 'true' : undefined}
                  onClick={() => setTab(entry.id)}
                >
                  <Icon size={18} aria-hidden="true" />
                  {entry.label}
                </button>
              )
            })}
          </nav>

          <div className={styles.panels}>
            {tab === 'general' ? (
              <section className={styles.section} aria-labelledby="general-heading">
                <div className={styles.sectionHead}>
                  <div>
                    <h2 id="general-heading" className={cx('text-headline-md', styles.sectionTitle)}>
                      General Configuration
                    </h2>
                    <p className={cx('text-body-sm', styles.sectionDescription)}>
                      Manage organization details and primary identity.
                    </p>
                  </div>
                  <Button variant="signal" disabled={savingOrg} onClick={() => void saveOrganization()}>
                    {savingOrg ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>

                <div className={styles.fieldGrid}>
                  <label className={styles.field} htmlFor="org-name">
                    Organization Name
                    <input
                      id="org-name"
                      type="text"
                      value={orgName}
                      onChange={(event) => setOrgName(event.target.value)}
                    />
                  </label>

                  <label className={styles.field} htmlFor="org-timezone">
                    Primary Timezone
                    <select
                      id="org-timezone"
                      value={timezone}
                      onChange={(event) => setTimezone(event.target.value)}
                    >
                      {TIMEZONES.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className={styles.field}>
                  <span>Brand Identity</span>
                  <div className={styles.uploadRow}>
                    <span className={styles.uploadIcon} aria-hidden="true">
                      <Upload size={18} />
                    </span>
                    <div>
                      <p className="text-body-sm">Upload Logo Mark</p>
                      <p className="text-code-sm text-muted">SVG or PNG, 512x512px max.</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        toast({
                          tone: 'info',
                          title: 'Logo upload is not part of this release',
                          detail: 'ZEVQORA ships with a fixed brand mark in this build.',
                        })
                      }
                      style={{ marginLeft: 'auto' }}
                    >
                      Choose file
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            {tab === 'workspace' ? (
              <section className={styles.section} aria-labelledby="workspace-heading">
                <div>
                  <h2 id="workspace-heading" className={cx('text-headline-md', styles.sectionTitle)}>
                    Workspace Environment
                  </h2>
                  <p className={cx('text-body-sm', styles.sectionDescription)}>
                    Control execution environments and operational limits.
                  </p>
                </div>

                <div className={styles.field}>
                  <span>Environment Switch</span>
                  <div className={styles.envSwitch} role="group" aria-label="Active environment">
                    {ENVIRONMENTS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={cx(
                          styles.envOption,
                          environment === option && styles.envOptionActive,
                        )}
                        aria-pressed={environment === option}
                        onClick={() => void switchEnvironment(option)}
                      >
                        {ENVIRONMENT_LABELS[option].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.sectionHead}>
                  <h3 className="text-label-caps text-muted">Global Rate Limits (Agents)</h3>
                  <Button variant="signal" disabled={savingLimits} onClick={() => void saveLimits()}>
                    {savingLimits ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>

                <div className={styles.limitsRow}>
                  <label className={styles.field} htmlFor="limit-rpm">
                    Requests / min
                    <input
                      id="limit-rpm"
                      type="number"
                      min={0}
                      value={limits.requestsPerMinute}
                      onChange={(event) =>
                        setLimits({ ...limits, requestsPerMinute: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className={styles.field} htmlFor="limit-concurrent">
                    Concurrent Exec
                    <input
                      id="limit-concurrent"
                      type="number"
                      min={0}
                      value={limits.concurrentExecutions}
                      onChange={(event) =>
                        setLimits({ ...limits, concurrentExecutions: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className={styles.field} htmlFor="limit-timeout">
                    Max Timeout (s)
                    <input
                      id="limit-timeout"
                      type="number"
                      min={1}
                      value={limits.maxTimeoutSeconds}
                      onChange={(event) =>
                        setLimits({ ...limits, maxTimeoutSeconds: Number(event.target.value) })
                      }
                    />
                  </label>
                </div>
              </section>
            ) : null}

            {tab === 'api-keys' ? (
              <section className={styles.section} aria-labelledby="keys-heading">
                <div className={styles.sectionHead}>
                  <div>
                    <h2 id="keys-heading" className={cx('text-headline-md', styles.sectionTitle)}>
                      API Keys
                    </h2>
                    <p className={cx('text-body-sm', styles.sectionDescription)}>
                      Manage programmatic access tokens for external systems. Keys shown here are
                      fictional demo data — no real credential is ever generated or stored.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <input
                      type="text"
                      placeholder="Key name…"
                      value={newKeyName}
                      onChange={(event) => setNewKeyName(event.target.value)}
                      style={{
                        background: 'var(--color-surface-container)',
                        border: 'var(--border-subtle)',
                        borderRadius: 'var(--radius-default)',
                        padding: 'var(--space-sm)',
                        color: 'var(--color-on-background)',
                      }}
                    />
                    <Button
                      variant="signal"
                      icon={<Key size={16} />}
                      disabled={newKeyName.trim().length === 0}
                      onClick={() => void generateKey()}
                    >
                      Generate Key
                    </Button>
                  </div>
                </div>

                <table className={styles.keyTable}>
                  <caption className="sr-only">Workspace API keys</caption>
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Key Fragment</th>
                      <th scope="col">Created At</th>
                      <th scope="col" className={styles.keyActions}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.apiKeys.map((key) => (
                      <tr key={key.id} className={key.revoked ? styles.keyRowRevoked : undefined}>
                        <td className={styles.keyName}>{key.name}</td>
                        <td className={cx('mono', styles.keyFragment)}>{key.maskedKey}</td>
                        <td className="text-code-sm text-muted">
                          {formatDateTimeShort(key.createdAt)}
                        </td>
                        <td className={styles.keyActions}>
                          {key.revoked ? (
                            <span className="text-code-sm text-muted">Revoked</span>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(key.id)}>
                              Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}

            {tab === 'team' ? (
              <div className={styles.placeholderCard}>
                <Users size={22} aria-hidden="true" />
                <h2 className="text-headline-md">Team management</h2>
                <p className="text-body-sm">
                  Invites, roles and seat management require a backend directory and are not part
                  of this frontend-only release.
                </p>
              </div>
            ) : null}

            {tab === 'security' ? (
              <div className={styles.placeholderCard}>
                <Shield size={22} aria-hidden="true" />
                <h2 className="text-headline-md">Security</h2>
                <p className="text-body-sm">
                  SSO, session policy and audit log configuration require a backend identity
                  provider and are not part of this frontend-only release.
                </p>
              </div>
            ) : null}

            {tab === 'billing' ? (
              <div className={styles.placeholderCard}>
                <CreditCard size={22} aria-hidden="true" />
                <h2 className="text-headline-md">Billing</h2>
                <p className="text-body-sm">
                  ZEVQORA is a portfolio demo and is not connected to a payment provider. Billing
                  configuration is out of scope for this release.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Dialog
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        title="Revoke this API key?"
        description="Any integration using this demo key will stop authenticating in this session."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => revokeTarget && void revokeKey(revokeTarget)}>
              Revoke Key
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">This cannot be undone within the demo session.</p>
      </Dialog>

      <Dialog
        open={demoSecret !== null}
        onClose={() => setDemoSecret(null)}
        title="Demo key generated"
        description="This is a fictional value shown once — ZEVQORA never stores or transmits it."
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setDemoSecret(null)}>
            Done
          </Button>
        }
      >
        {demoSecret ? (
          <div className={styles.demoSecretBox}>
            <code className="mono text-code-sm">{demoSecret.secret}</code>
            <Button
              variant="ghost"
              size="sm"
              icon={<Copy size={16} />}
              onClick={() => {
                void navigator.clipboard.writeText(demoSecret.secret)
                toast({ tone: 'success', title: 'Copied to clipboard' })
              }}
            >
              Copy
            </Button>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
