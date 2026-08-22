import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Cpu,
  Download,
  Pause,
  Plus,
  RotateCcw,
  Send,
  Settings2,
  Timer,
} from 'lucide-react'

import type { Incident, IncidentSeverity } from '@/domain'
import { INCIDENT_SEVERITY_LABELS } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { PageHeader } from '@/components/shell/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { IncidentStatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import { now } from '@/lib/clock'
import { downloadJson } from '@/lib/download'
import { formatAbsoluteTime, formatRelativeTime } from '@/lib/format'
import { cx } from '@/lib/cx'

import styles from '@/features/incidents/incidents.module.css'

const SEVERITY_FILTERS: readonly IncidentSeverity[] = ['sev1', 'sev2', 'sev3', 'sev4']

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function DeclareIncidentDialog({
  open,
  onClose,
  onDeclare,
}: {
  readonly open: boolean
  readonly onClose: () => void
  readonly onDeclare: (title: string, severity: IncidentSeverity, detail: string) => void
}) {
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity>('sev3')
  const [detail, setDetail] = useState('')

  function reset() {
    setTitle('')
    setSeverity('sev3')
    setDetail('')
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose()
        reset()
      }}
      title="Declare Incident"
      description="Creates a demo incident in this session only."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={title.trim().length === 0}
            onClick={() => {
              onDeclare(title.trim(), severity, detail.trim() || 'Manually declared incident.')
              onClose()
              reset()
            }}
          >
            Declare Incident
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <label className="text-label-caps text-muted" htmlFor="inc-title">
          Title
          <input
            id="inc-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: 'var(--space-sm)',
              background: 'var(--color-surface-container-low)',
              border: 'var(--border-default)',
              borderRadius: 'var(--radius-default)',
              color: 'var(--color-on-background)',
            }}
          />
        </label>

        <label className="text-label-caps text-muted" htmlFor="inc-severity">
          Severity
          <select
            id="inc-severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as IncidentSeverity)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: 'var(--space-sm)',
              background: 'var(--color-surface-container-low)',
              border: 'var(--border-default)',
              borderRadius: 'var(--radius-default)',
              color: 'var(--color-on-background)',
            }}
          >
            {SEVERITY_FILTERS.map((option) => (
              <option key={option} value={option}>
                {INCIDENT_SEVERITY_LABELS[option]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-label-caps text-muted" htmlFor="inc-detail">
          Summary
          <textarea
            id="inc-detail"
            rows={3}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: 'var(--space-sm)',
              background: 'var(--color-surface-container-low)',
              border: 'var(--border-default)',
              borderRadius: 'var(--radius-default)',
              color: 'var(--color-on-background)',
              resize: 'vertical',
            }}
          />
        </label>
      </div>
    </Dialog>
  )
}

/** Incidents Command Center (`/incidents`). */
export function IncidentsPage() {
  const services = useServices()
  const { toast } = useToast()

  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [confirmAction, setConfirmAction] = useState<'pause' | 'rollback' | null>(null)
  const [scriptInput, setScriptInput] = useState('')
  const [scriptLog, setScriptLog] = useState<readonly string[]>([])
  const [declareOpen, setDeclareOpen] = useState(false)

  const incidents = useAsync(
    () => services.incidents.list(severityFilter ? { severity: severityFilter } : undefined),
    [services, severityFilter, version],
  )

  const list = useMemo(
    () => (incidents.state.status === 'success' ? incidents.state.data : []),
    [incidents.state],
  )

  useEffect(() => {
    if (selectedId !== null || list.length === 0) return
    setSelectedId(list[0]?.id ?? null)
  }, [list, selectedId])

  const selected: Incident | null = useMemo(
    () => list.find((incident) => incident.id === selectedId) ?? list[0] ?? null,
    [list, selectedId],
  )

  // Local, display-only mitigation script log — cleared when the selection
  // changes since it is a per-inspection scratch surface, not a stored record.
  useEffect(() => {
    setScriptLog([])
  }, [selectedId])

  const openCount = list.filter((incident) => incident.status !== 'resolved').length
  const impactedAgents = new Set(list.flatMap((incident) => incident.affectedAgentIds)).size

  async function runMitigation(kind: 'pause' | 'rollback') {
    if (!selected) return
    try {
      if (kind === 'pause') {
        await services.incidents.pauseAgent(selected.id)
      } else {
        await services.incidents.rollback(selected.id)
      }
      setVersion((v) => v + 1)
      toast({
        tone: 'success',
        title: kind === 'pause' ? 'Agent paused (simulated)' : 'Rollback triggered (simulated)',
        detail: `${selected.id} — no live agent was modified. This is a frontend simulation.`,
      })
    } catch {
      toast({ tone: 'error', title: 'Mitigation could not be recorded' })
    } finally {
      setConfirmAction(null)
    }
  }

  function handleExport() {
    if (!selected) return
    downloadJson(`${selected.id}-timeline.json`, {
      incident: selected.id,
      title: selected.title,
      severity: selected.severity,
      status: selected.status,
      timeline: selected.timeline,
    })
    toast({ tone: 'success', title: 'Timeline exported', detail: `${selected.id}-timeline.json` })
  }

  async function handleDeclare(title: string, severity: IncidentSeverity, detail: string) {
    const created = await services.incidents.declare({ title, severity, detail, agentId: null })
    setVersion((v) => v + 1)
    setSelectedId(created.id)
    toast({ tone: 'info', title: 'Incident declared', detail: created.id })
  }

  function runScript() {
    if (scriptInput.trim().length === 0) return
    setScriptLog((log) => [...log, `$ ${scriptInput.trim()}`, 'Simulated: command accepted, no live system was affected.'])
    setScriptInput('')
  }

  return (
    <div className="page">
      <PageHeader
        title="Incidents Command Center"
        icon={<AlertTriangle size={26} />}
        description="Investigate simulated production incidents, failures, and policy violations."
        actions={
          <>
            <Button variant="secondary" icon={<Download size={18} />} onClick={handleExport} disabled={!selected}>
              Export Logs
            </Button>
            <Button variant="signal" icon={<Plus size={18} />} onClick={() => setDeclareOpen(true)}>
              Declare Incident
            </Button>
          </>
        }
      />

      <div className={styles.metricRow}>
        <div className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className="text-label-caps text-muted">Open Incidents</span>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: 'var(--color-error)' }} />
          </div>
          <div className={styles.metricValueRow}>
            <span className={cx('mono', styles.metricValue)} style={{ color: 'var(--color-error)' }}>
              {openCount}
            </span>
          </div>
          <div className={styles.metricTrack}>
            <div
              className={styles.metricTrackFill}
              style={{ width: '35%', backgroundColor: 'var(--color-error)' }}
            />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className="text-label-caps text-muted">MTTR (7d)</span>
            <Timer size={18} aria-hidden="true" style={{ color: 'var(--color-primary-container)' }} />
          </div>
          <div className={styles.metricValueRow}>
            <span className={cx('mono', styles.metricValue)}>42m</span>
            <span className="text-code-sm" style={{ color: 'var(--color-primary-container)' }}>
              ↓ -12m
            </span>
          </div>
          <div className={styles.metricTrack}>
            <div
              className={styles.metricTrackFill}
              style={{ width: '20%', backgroundColor: 'var(--color-primary-container)' }}
            />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className="text-label-caps text-muted">Impacted Agents</span>
            <Cpu size={18} aria-hidden="true" style={{ color: 'var(--color-secondary)' }} />
          </div>
          <div className={styles.metricValueRow}>
            <span className={cx('mono', styles.metricValue)}>{impactedAgents}</span>
            <span className="text-code-sm text-muted">/ 142 Active</span>
          </div>
          <div className={styles.metricTrack}>
            <div
              className={styles.metricTrackFill}
              style={{ width: '5%', backgroundColor: 'var(--color-secondary)' }}
            />
          </div>
        </div>
      </div>

      {incidents.state.status === 'loading' ? (
        <LoadingState label="Loading incidents" rows={5} />
      ) : incidents.state.status === 'error' ? (
        <ErrorState description="Incidents could not be loaded." onRetry={incidents.reload} />
      ) : list.length === 0 ? (
        <EmptyState variant="filtered" title="No incidents match" description="Try a different severity filter." />
      ) : (
        <div className={styles.commandLayout}>
          <div className={styles.panelColumn}>
            <div className={styles.panelHead}>
              <span className="text-label-caps text-muted">Active Incidents</span>
              <div className={styles.severityTabs} role="group" aria-label="Filter by severity">
                <button
                  type="button"
                  className={cx(styles.severityTab, severityFilter === null && styles.severityTabActive)}
                  aria-pressed={severityFilter === null}
                  onClick={() => setSeverityFilter(null)}
                >
                  All
                </button>
                {SEVERITY_FILTERS.map((severity) => (
                  <button
                    key={severity}
                    type="button"
                    className={cx(
                      styles.severityTab,
                      severityFilter === severity && styles.severityTabActive,
                    )}
                    aria-pressed={severityFilter === severity}
                    onClick={() =>
                      setSeverityFilter((current) => (current === severity ? null : severity))
                    }
                  >
                    {INCIDENT_SEVERITY_LABELS[severity]}
                  </button>
                ))}
              </div>
            </div>

            <ul className={styles.incidentList} role="list">
              {list.map((incident) => (
                <li key={incident.id}>
                  <button
                    type="button"
                    className={cx(
                      styles.incidentRow,
                      incident.id === selected?.id && styles.incidentRowSelected,
                    )}
                    aria-current={incident.id === selected?.id ? 'true' : undefined}
                    onClick={() => setSelectedId(incident.id)}
                  >
                    <div className={styles.incidentRowHead}>
                      <span className={styles.incidentRowTags}>
                        <Badge tone={incident.severity === 'sev1' ? 'danger' : 'neutral'} mono>
                          {INCIDENT_SEVERITY_LABELS[incident.severity]}
                        </Badge>
                        <span className="mono text-code-md text-muted">{incident.id.toUpperCase()}</span>
                      </span>
                      {incident.status === 'open' ? (
                        <span className={cx('text-code-sm', styles.incidentStatusLive)}>
                          <span className="status-dot pulse" style={{ backgroundColor: 'var(--color-error)' }} />
                          Open
                        </span>
                      ) : (
                        <IncidentStatusBadge status={incident.status} />
                      )}
                    </div>
                    <span className={cx('text-body-md', styles.incidentTitle)}>{incident.title}</span>
                    <div className={styles.incidentFooter}>
                      {incident.owner ? (
                        <span className={styles.incidentOwner}>
                          <span className={styles.ownerAvatar} aria-hidden="true">
                            {initials(incident.owner)}
                          </span>
                          {incident.owner}
                        </span>
                      ) : null}
                      <span className={styles.incidentAge}>
                        {formatRelativeTime(incident.openedAt, now())}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {selected ? (
            <div className={styles.panelColumn}>
              <div className={styles.commandHead}>
                <div>
                  <span className="text-code-sm text-muted">{selected.id.toUpperCase()}</span>
                  <h2 className="text-headline-md">{selected.title}</h2>
                  <div className={styles.commandMeta}>
                    <span className="text-body-sm">
                      Agent: {selected.primaryAgentId ?? 'multiple'}
                    </span>
                    <span className="text-body-sm">Env: {selected.environment}</span>
                  </div>
                </div>
                <Badge tone={selected.severity === 'sev1' ? 'danger' : 'warning'} mono>
                  {selected.severity === 'sev1' ? 'CRITICAL' : INCIDENT_SEVERITY_LABELS[selected.severity]}
                </Badge>
              </div>

              <div className={styles.mitigationRow}>
                <Button
                  variant="danger"
                  icon={<Pause size={16} />}
                  onClick={() => setConfirmAction('pause')}
                >
                  Pause Agent
                </Button>
                <Button
                  variant="secondary"
                  icon={<RotateCcw size={16} />}
                  onClick={() => setConfirmAction('rollback')}
                >
                  Rollback
                </Button>
              </div>

              {selected.mitigations.length > 0 ? (
                <div className={styles.appliedMitigations}>
                  {selected.mitigations.map((note) => (
                    <span key={note} className="text-code-sm" style={{ color: 'var(--color-status-success)' }}>
                      ✓ {note}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className={styles.timelineHead}>
                <span className="text-label-caps">Incident Timeline</span>
              </div>

              <div className={styles.timeline}>
                {selected.timeline.map((event) => (
                  <div key={event.id} className={styles.timelineEvent}>
                    <span className={styles.timelineDot} data-source={event.source} aria-hidden="true" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className={styles.timelineHeadRow}>
                        <span className={cx('mono', 'text-code-sm', styles.timelineTime)}>
                          {formatAbsoluteTime(event.timestamp).split(' ')[1]} UTC
                        </span>
                        <span className={cx('text-code-sm', styles.timelineSource)}>
                          {event.source.toUpperCase()}
                        </span>
                      </div>
                      <p className={cx('text-body-sm', styles.timelineMessage)}>{event.message}</p>
                      {event.payload ? (
                        <pre className={cx('mono', 'text-code-sm', styles.timelinePayload)}>
                          {event.payload}
                        </pre>
                      ) : null}
                    </div>
                  </div>
                ))}
                {scriptLog.map((line, index) => (
                  <p key={index} className={cx('mono', 'text-code-sm', styles.timelineMessage)}>
                    {line}
                  </p>
                ))}
              </div>

              <form
                className={styles.mitigationInput}
                onSubmit={(event) => {
                  event.preventDefault()
                  runScript()
                }}
              >
                <Settings2 size={16} aria-hidden="true" style={{ color: 'var(--color-on-surface-variant)' }} />
                <label htmlFor="mitigation-script" className="sr-only">
                  Run mitigation script
                </label>
                <input
                  id="mitigation-script"
                  type="text"
                  placeholder="Run mitigation script (e.g. /kill-task)"
                  value={scriptInput}
                  onChange={(event) => setScriptInput(event.target.value)}
                />
                <Button type="submit" variant="ghost" size="sm" icon={<Send size={16} />}>
                  <span className="sr-only">Run</span>
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      )}

      <Dialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'pause' ? 'Pause this agent?' : 'Roll back this release?'}
        description="This is a simulated action for the demo — no live agent or deployment is affected."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmAction && void runMitigation(confirmAction)}
            >
              {confirmAction === 'pause' ? 'Pause Agent' : 'Roll Back'}
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">
          {selected?.title ?? 'This incident'} will be marked as mitigated in this demo session.
        </p>
      </Dialog>

      <DeclareIncidentDialog
        open={declareOpen}
        onClose={() => setDeclareOpen(false)}
        onDeclare={(title, severity, detail) => void handleDeclare(title, severity, detail)}
      />
    </div>
  )
}
