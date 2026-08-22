import { useCallback } from 'react'
import { Download, Play, Plus } from 'lucide-react'

import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { PageHeader } from '@/components/shell/PageHeader'
import { Button, LinkButton } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { TablePagination } from '@/components/ui/TablePagination'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { RunsFilterBar } from '@/features/runs/RunsFilterBar'
import { RunsSummaryCard } from '@/features/runs/RunsSummaryCard'
import { RunsTable } from '@/features/runs/RunsTable'
import { useRunFilters } from '@/features/runs/useRunFilters'
import { useAsync } from '@/hooks/useAsync'
import { cx } from '@/lib/cx'

import styles from './RunsPage.module.css'

const PAGE_SIZE = 12

/** Runs Explorer — the primary observability surface. */
export function RunsPage() {
  const services = useServices()
  const { toast } = useToast()
  const {
    filters,
    query,
    update,
    reset,
    toggleSort,
    activeChips,
    clearChip,
    isFiltered,
  } = useRunFilters()

  const runs = useAsync(
    () =>
      services.runs.query({
        filter: query,
        sort: filters.sort,
        page: filters.page,
        pageSize: PAGE_SIZE,
      }),
    [services, query, filters.sort, filters.page],
  )

  const agents = useAsync(() => services.agents.list(), [services])
  const models = useAsync(() => services.agents.listModels(), [services])
  const summary = useAsync(
    () => services.runs.summary(filters.period),
    [services, filters.period],
  )

  const exportCsv = useCallback(() => {
    toast({
      tone: 'info',
      title: 'CSV export is not part of this release',
      detail: 'Exporting run data requires a backend.',
    })
  }, [toast])

  return (
    <div className="page">
      <PageHeader
        title="Runs Explorer"
        icon={<Play size={26} />}
        eyebrow={
          <span className={cx('status-dot', styles.liveDot, 'pulse')} aria-hidden="true" />
        }
        description="Explore production-style execution telemetry across the agent fleet."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download size={18} />}
              onClick={exportCsv}
            >
              Export CSV
            </Button>
            <LinkButton to="/simulator" variant="primary" icon={<Plus size={18} />}>
              New Run
            </LinkButton>
          </>
        }
      />

      <RunsFilterBar
        filters={filters}
        agents={agents.state.status === 'success' ? agents.state.data : []}
        models={models.state.status === 'success' ? models.state.data : []}
        activeChips={activeChips}
        isFiltered={isFiltered}
        onUpdate={update}
        onClearChip={clearChip}
        onReset={reset}
        onRefresh={runs.reload}
      />

      <div className={styles.body}>
        <Panel className={styles.tablePanel}>
          {runs.state.status === 'loading' ? (
            <LoadingState label="Loading runs" rows={8} />
          ) : runs.state.status === 'error' ? (
            <ErrorState
              title="Runs unavailable"
              description="The run corpus could not be queried."
              onRetry={runs.reload}
            />
          ) : runs.state.data.items.length === 0 ? (
            <EmptyState
              variant={isFiltered ? 'filtered' : 'empty'}
              title={
                isFiltered ? 'No runs match these filters' : 'No runs recorded'
              }
              description={
                isFiltered
                  ? 'Try widening the time period or clearing a filter.'
                  : 'Execute an agent from the Simulator to produce runs.'
              }
              action={
                isFiltered ? (
                  <Button variant="secondary" size="sm" onClick={reset}>
                    Clear all filters
                  </Button>
                ) : (
                  <LinkButton to="/simulator" variant="secondary" size="sm">
                    Open Simulator
                  </LinkButton>
                )
              }
            />
          ) : (
            <>
              <RunsTable
                page={runs.state.data}
                sort={filters.sort}
                onToggleSort={toggleSort}
              />
              <TablePagination
                page={runs.state.data.page}
                pageSize={runs.state.data.pageSize}
                total={runs.state.data.total}
                itemLabel="runs"
                onPageChange={(page) => update({ page })}
              />
            </>
          )}
        </Panel>

        <RunsSummaryCard state={summary.state} period={filters.period} />
      </div>
    </div>
  )
}
