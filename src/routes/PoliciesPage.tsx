import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, History, Link2, Plus, Shield, SlidersHorizontal } from 'lucide-react'

import type { Policy, PolicyDraft } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { PageHeader } from '@/components/shell/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { PolicyListItem } from '@/features/policies/PolicyListItem'
import { useAsync } from '@/hooks/useAsync'
import { now } from '@/lib/clock'
import { formatRelativeTime } from '@/lib/format'
import { cx } from '@/lib/cx'

import styles from '@/features/policies/policies.module.css'

/** Policies & Guardrails — the constraint surface for the fleet. */
export function PoliciesPage() {
  const services = useServices()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PolicyDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [version, setVersion] = useState(0)

  const policies = useAsync(
    () => services.policies.list({ search }),
    [services, search, version],
  )

  // Memoised so the identity is stable across renders — otherwise the effects
  // and memos below re-run on every render.
  const list = useMemo(
    () => (policies.state.status === 'success' ? policies.state.data : []),
    [policies.state],
  )

  // Select the first policy once the list resolves.
  useEffect(() => {
    if (selectedId !== null || list.length === 0) return
    setSelectedId(list[0]?.id ?? null)
  }, [list, selectedId])

  const selected = useMemo(
    () => list.find((policy) => policy.id === selectedId) ?? null,
    [list, selectedId],
  )

  // Reset the editable draft whenever the selection changes.
  useEffect(() => {
    if (!selected) {
      setDraft(null)
      return
    }
    setDraft({
      name: selected.name,
      description: selected.description,
      definition: selected.definition,
      status: selected.status,
      severity: selected.severity,
    })
  }, [selected])

  const isDirty = useMemo(() => {
    if (!selected || !draft) return false
    return (
      draft.name !== selected.name ||
      draft.description !== selected.description ||
      draft.definition !== selected.definition ||
      draft.status !== selected.status
    )
  }, [selected, draft])

  const save = useCallback(async () => {
    if (!selected || !draft) return

    setSaving(true)
    try {
      await services.policies.update(selected.id, draft)
      setVersion((value) => value + 1)
      toast({
        tone: 'success',
        title: 'Policy saved',
        detail: `${selected.displayId} updated in this demo session only — nothing is server-enforced.`,
      })
    } catch {
      toast({
        tone: 'error',
        title: 'Could not save the policy',
        detail: 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }, [services, selected, draft, toast])

  const toggleStatus = useCallback(async () => {
    if (!selected) return

    const next = selected.status === 'enforced' ? 'disabled' : 'enforced'
    try {
      await services.policies.setStatus(selected.id, next)
      setVersion((value) => value + 1)
      toast({
        tone: next === 'enforced' ? 'success' : 'info',
        title: next === 'enforced' ? 'Policy activated' : 'Policy deactivated',
        detail: `${selected.displayId} is now ${next}.`,
      })
    } catch {
      toast({
        tone: 'error',
        title: 'Could not change the policy state',
      })
    }
  }, [services, selected, toast])

  // Attached agents are resolved through the agent repository rather than
  // read out of the policy's id list, so the names and live status shown here
  // come from the same source the fleet screen uses.
  const attached = useAsync(
    () => services.agents.getByIds(selected?.appliedToAgentIds ?? []),
    [services, selected?.appliedToAgentIds],
  )

  const attachedAgents = useMemo(
    () => (attached.state.status === 'success' ? attached.state.data : []),
    [attached.state],
  )

  return (
    <div className="page">
      <PageHeader
        title="Policies & Guardrails"
        description="Manage constraints and operational rules for deployed agents."
        actions={
          <Button
            variant="signal"
            icon={<Plus size={18} />}
            onClick={() =>
              toast({
                tone: 'info',
                title: 'Policy authoring is not part of this release',
                detail: 'Creating a policy requires a backend rule engine.',
              })
            }
          >
            New Policy
          </Button>
        }
      />

      <div className={styles.layout}>
        {/* Policy list ---------------------------------------------------- */}
        <div className={styles.listColumn}>
          <div className={styles.filterField}>
            <SlidersHorizontal
              size={18}
              aria-hidden="true"
              className={styles.filterIcon}
            />
            <label htmlFor="policy-filter" className="sr-only">
              Filter policies
            </label>
            <input
              id="policy-filter"
              type="search"
              className={styles.filterInput}
              placeholder="Filter policies..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {policies.state.status === 'loading' ? (
            <LoadingState label="Loading policies" rows={5} />
          ) : policies.state.status === 'error' ? (
            <ErrorState
              description="Policies could not be loaded."
              onRetry={policies.reload}
            />
          ) : list.length === 0 ? (
            <EmptyState
              variant="filtered"
              title="No policies match"
              description={`Nothing matches “${search}”.`}
              action={
                <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                  Clear filter
                </Button>
              }
            />
          ) : (
            <ul className={styles.list} role="list">
              {list.map((policy) => (
                <PolicyListItem
                  key={policy.id}
                  policy={policy}
                  selected={policy.id === selectedId}
                  onSelect={(next: Policy) => setSelectedId(next.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Detail --------------------------------------------------------- */}
        {selected && draft ? (
          <section className={styles.detail} aria-label={`${selected.name} detail`}>
            <header className={styles.detailHeader}>
              <span className={styles.detailIcon} aria-hidden="true">
                <Shield size={20} />
              </span>

              <div className={styles.detailTitleBlock}>
                <h2 className={cx('text-headline-md', styles.detailTitle)}>
                  {selected.name}
                </h2>
                <p className={cx('text-code-sm', styles.detailMeta)}>
                  ID: {selected.displayId} · Last modified{' '}
                  {formatRelativeTime(selected.lastModifiedAt, now())} by{' '}
                  {selected.lastModifiedBy}
                </p>
              </div>

              <div className={styles.detailActions}>
                <IconButton
                  label="Policy revision history"
                  onClick={() =>
                    toast({
                      tone: 'info',
                      title: 'Revision history is not part of this release',
                    })
                  }
                >
                  <History size={20} />
                </IconButton>
                <Button variant="secondary" onClick={() => void toggleStatus()}>
                  {selected.status === 'enforced' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void save()}
                  disabled={!isDirty || saving}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </header>

            <div className={styles.detailBody}>
              <div className={styles.detailMain}>
                <section className={styles.field}>
                  <label
                    htmlFor="policy-description"
                    className={cx('text-label-caps', styles.fieldLabel)}
                  >
                    Description
                  </label>
                  <textarea
                    id="policy-description"
                    className={styles.textarea}
                    rows={3}
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.target.value })
                    }
                  />
                </section>

                <section className={styles.field}>
                  <div className={styles.fieldHead}>
                    <label
                      htmlFor="policy-definition"
                      className={cx('text-label-caps', styles.fieldLabel)}
                    >
                      Rule Definition
                    </label>
                    <span className={cx('text-code-sm', styles.syntaxTag)}>
                      YAML SYNTAX
                    </span>
                  </div>
                  <textarea
                    id="policy-definition"
                    className={cx('text-code-md', styles.codeEditor)}
                    rows={18}
                    spellCheck={false}
                    value={draft.definition}
                    onChange={(event) =>
                      setDraft({ ...draft, definition: event.target.value })
                    }
                  />
                  <p className={cx('text-code-sm', styles.demoNote)}>
                    Edits apply to this demo session only. ZEVQORA does not
                    enforce policies against a live runtime in this release.
                  </p>
                </section>
              </div>

              {/* Applied-to sidebar */}
              <aside className={styles.appliedTo} aria-label="Attached agents">
                <h3 className={cx('text-label-caps', styles.fieldLabel)}>
                  Applied To ({attachedAgents.length})
                </h3>

                <ul className={styles.agentList} role="list">
                  {attachedAgents.map((agent) => (
                    <li key={agent.id} className={styles.agentItem}>
                      <span
                        className={cx(
                          styles.agentRule,
                          agent.status === 'active' && styles.agentRuleActive,
                        )}
                        aria-hidden="true"
                      />
                      <Bot
                        size={16}
                        aria-hidden="true"
                        className={styles.agentIcon}
                      />
                      <span className={cx('mono', styles.agentName)}>
                        {agent.name}
                      </span>
                      <span
                        className={cx(
                          'status-dot',
                          agent.status === 'active'
                            ? styles.agentDotActive
                            : styles.agentDotIdle,
                        )}
                        aria-hidden="true"
                      />
                      <span className="sr-only">{agent.status}</span>
                    </li>
                  ))}
                </ul>

                <Badge tone="neutral" mono>
                  Effect: {selected.effect}
                </Badge>

                <button
                  type="button"
                  className={styles.attachButton}
                  onClick={() =>
                    toast({
                      tone: 'info',
                      title: 'Attaching agents is not part of this release',
                    })
                  }
                >
                  <Link2 size={16} aria-hidden="true" />
                  Attach to Agent
                </button>
              </aside>
            </div>
          </section>
        ) : policies.state.status === 'success' && list.length > 0 ? (
          <div className={styles.detail}>
            <EmptyState
              title="No policy selected"
              description="Choose a policy from the list to view its definition."
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
