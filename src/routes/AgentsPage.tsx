import { useCallback, useMemo, useState } from 'react'
import { BarChart3, Plus, SlidersHorizontal } from 'lucide-react'

import type { Agent, AgentStatus } from '@/domain'
import { AGENT_STATUS_LABELS, AGENT_STATUSES } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { UtilizationChart } from '@/components/charts/UtilizationChart'
import { PageHeader } from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { Select, type SelectOption } from '@/components/ui/Select'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { AgentCard } from '@/features/agents/AgentCard'
import { useAsync } from '@/hooks/useAsync'
import { formatPercent } from '@/lib/format'
import { cx } from '@/lib/cx'

import styles from '@/features/agents/agents.module.css'

const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  ...AGENT_STATUSES.map((status) => ({
    value: status,
    label: AGENT_STATUS_LABELS[status],
  })),
]

/** Agent Fleet — manage, monitor and deploy agents. */
export function AgentsPage() {
  const services = useServices()
  const { toast } = useToast()
  const [status, setStatus] = useState<AgentStatus | 'all'>('all')

  const agents = useAsync(
    () => services.agents.list({ status }),
    [services, status],
  )

  const notImplemented = useCallback(
    (action: string, agent: Agent) => {
      toast({
        tone: 'info',
        title: `${action} is not part of this release`,
        detail: `${agent.name} is a demo agent; ZEVQORA does not execute real agents yet.`,
      })
    },
    [toast],
  )

  const restart = useCallback(
    (agent: Agent) => {
      toast({
        tone: 'success',
        title: 'Restart requested',
        detail: `${agent.displayId} would be restarted by the runtime scheduler.`,
      })
    },
    [toast],
  )

  // Fleet-wide utilisation, averaged across every agent's samples.
  const fleetUtilization = useMemo(() => {
    if (agents.state.status !== 'success' || agents.state.data.length === 0) {
      return { samples: [] as number[], average: 0 }
    }

    const series = agents.state.data.map((agent) => agent.metrics.utilization)
    const length = Math.max(...series.map((entry) => entry.length))

    const samples = Array.from({ length }, (_, index) => {
      const values = series
        .map((entry) => entry[index])
        .filter((value): value is number => value !== undefined)
      return values.reduce((sum, value) => sum + value, 0) / (values.length || 1)
    })

    const average =
      samples.reduce((sum, value) => sum + value, 0) / (samples.length || 1)

    return { samples, average }
  }, [agents.state])

  return (
    <div className="page">
      <PageHeader
        title="Agent Fleet"
        description="Manage, monitor, and deploy autonomous agents across your environment."
        actions={
          <>
            <Select
              label="Filter by status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(value) => setStatus(value as AgentStatus | 'all')}
              icon={SlidersHorizontal}
              prefix="Filter:"
            />
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              onClick={() =>
                toast({
                  tone: 'info',
                  title: 'Agent creation is not part of this release',
                  detail: 'Provisioning an agent requires a backend runtime.',
                })
              }
            >
              New Agent
            </Button>
          </>
        }
      />

      {agents.state.status === 'loading' ? (
        <LoadingState label="Loading agent fleet" rows={5} />
      ) : agents.state.status === 'error' ? (
        <ErrorState
          title="Fleet unavailable"
          description="The agent fleet could not be loaded."
          onRetry={agents.reload}
        />
      ) : agents.state.data.length === 0 ? (
        <EmptyState
          variant="filtered"
          title="No agents match this filter"
          description="No agents are currently in that state."
          action={
            <Button variant="secondary" size="sm" onClick={() => setStatus('all')}>
              Show all agents
            </Button>
          }
        />
      ) : (
        <>
          <section aria-labelledby="agents-grid-heading">
            {/* Keeps the heading order contiguous (h1 → h2 → the h3 card
                titles) without adding a visible heading the design omits. */}
            <h2 id="agents-grid-heading" className="sr-only">
              Agents
            </h2>
            <div className="grid grid--thirds">
              {agents.state.data.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={(target) => notImplemented('Agent configuration', target)}
                  onRestart={restart}
                  onMenu={(target) => notImplemented('Agent actions', target)}
                />
              ))}
            </div>
          </section>

          <Panel
            headerStyle="headline"
            title={
              <>
                <BarChart3 size={18} aria-hidden="true" className="text-signal" />
                System Utilization
              </>
            }
            bodyClassName={styles.utilizationBody}
          >
            <UtilizationChart samples={fleetUtilization.samples} />
            <div className={cx('text-code-sm', styles.utilizationFooter)}>
              <span>00:00 UTC</span>
              <span className={styles.utilizationCenter}>
                Avg Load: {formatPercent(fleetUtilization.average * 100, 0)}
              </span>
              <span>Now</span>
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
