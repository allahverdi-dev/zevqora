import { useMemo, useState } from 'react'
import { FlaskConical, Plus } from 'lucide-react'

import type { CreateExperimentInput, Experiment } from '@/domain'
import { useServices } from '@/app/providers/ServicesProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { PageHeader } from '@/components/shell/PageHeader'
import { DonutChart } from '@/components/charts/DonutChart'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Panel } from '@/components/ui/Panel'
import { ExperimentStatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { MetricComparisonBars } from '@/features/experiments/MetricComparisonBars'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTimeShort } from '@/lib/format'
import { cx } from '@/lib/cx'

import tableStyles from '@/components/ui/DataTable.module.css'
import styles from '@/features/experiments/experiments.module.css'

function formatDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

const EXPERIMENT_TYPES = [
  'Model comparison',
  'Retrieval strategy',
  'Prompt optimization',
  'Agent routing',
]

function NewExperimentDialog({
  open,
  onClose,
  onCreate,
}: {
  readonly open: boolean
  readonly onClose: () => void
  readonly onCreate: (input: CreateExperimentInput) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState(EXPERIMENT_TYPES[0] ?? 'Model comparison')
  const [baseModel, setBaseModel] = useState('claude-sonnet-5')
  const [challengerModel, setChallengerModel] = useState('gpt-5.6')
  const [allocationA, setAllocationA] = useState(50)

  function reset() {
    setName('')
    setType(EXPERIMENT_TYPES[0] ?? 'Model comparison')
    setBaseModel('claude-sonnet-5')
    setChallengerModel('gpt-5.6')
    setAllocationA(50)
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose()
        reset()
      }}
      title="New Experiment"
      description="Configure a demo experiment. It runs in this session only."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="signal"
            disabled={name.trim().length === 0}
            onClick={() => {
              onCreate({
                name: name.trim(),
                type,
                baseModel,
                challengerModel,
                trafficAllocation: { variantA: allocationA, variantB: 100 - allocationA },
              })
              onClose()
              reset()
            }}
          >
            Create Experiment
          </Button>
        </>
      }
    >
      <div className={styles.dialogGrid}>
        <div className={styles.field}>
          <label htmlFor="exp-name">Experiment name</label>
          <input
            id="exp-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Response Tone Comparison"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="exp-type">Experiment type</label>
          <select
            id="exp-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {EXPERIMENT_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.dialogRow}>
          <div className={styles.field}>
            <label htmlFor="exp-base">Base variant (A)</label>
            <input
              id="exp-base"
              type="text"
              value={baseModel}
              onChange={(event) => setBaseModel(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="exp-challenger">Challenger (B)</label>
            <input
              id="exp-challenger"
              type="text"
              value={challengerModel}
              onChange={(event) => setChallengerModel(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="exp-allocation">
            Traffic allocation — {allocationA}% / {100 - allocationA}%
          </label>
          <div className={styles.sliderRow}>
            <span className="text-code-sm text-muted">A</span>
            <input
              id="exp-allocation"
              type="range"
              min={0}
              max={100}
              step={5}
              value={allocationA}
              onChange={(event) => setAllocationA(Number(event.target.value))}
            />
            <span className="text-code-sm text-muted">B</span>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/** Experiments — comparative analysis of agent configurations and variants. */
export function ExperimentsPage() {
  const services = useServices()
  const { toast } = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [version, setVersion] = useState(0)

  const experiments = useAsync(() => services.experiments.list(), [services, version])

  const list = useMemo(
    () => (experiments.state.status === 'success' ? experiments.state.data : []),
    [experiments.state],
  )

  const selected: Experiment | null = useMemo(() => {
    if (selectedId) {
      const found = list.find((experiment) => experiment.id === selectedId)
      if (found) return found
    }
    return list[0] ?? null
  }, [list, selectedId])

  async function handleCreate(input: CreateExperimentInput) {
    const created = await services.experiments.create(input)
    setVersion((v) => v + 1)
    setSelectedId(created.id)
    toast({
      tone: 'success',
      title: 'Experiment created',
      detail: `${created.id} is running in this demo session only.`,
    })
  }

  return (
    <div className="page">
      <PageHeader
        title="Experiments"
        icon={<FlaskConical size={26} />}
        description="Comparative analysis of agent configurations and model variants."
        actions={
          <Button variant="signal" icon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>
            New Experiment
          </Button>
        }
      />

      {experiments.state.status === 'loading' ? (
        <LoadingState label="Loading experiments" rows={4} />
      ) : experiments.state.status === 'error' ? (
        <ErrorState
          description="Experiments could not be loaded."
          onRetry={experiments.reload}
        />
      ) : list.length === 0 ? (
        <EmptyState title="No experiments yet" description="Create one to get started." />
      ) : (
        <>
          <div className={styles.cardGrid} role="list" aria-label="Experiments">
            {list.slice(0, 6).map((experiment) => (
              <button
                key={experiment.id}
                type="button"
                role="listitem"
                className={cx(
                  styles.card,
                  experiment.id === selected?.id && styles.cardSelected,
                )}
                onClick={() => setSelectedId(experiment.id)}
                aria-pressed={experiment.id === selected?.id}
              >
                <div className={styles.cardHead}>
                  <span className={cx('mono', styles.cardId)}>{experiment.id}</span>
                  <ExperimentStatusBadge status={experiment.status} />
                </div>
                <h3 className={cx('text-headline-md', styles.cardName)}>
                  {experiment.name}
                </h3>
                <div className={styles.cardFooter}>
                  <div className={styles.cardFigure}>
                    <span className="text-label-caps text-muted">Duration</span>
                    <span className="mono">{experiment.durationLabel}</span>
                  </div>
                  <div className={cx(styles.cardFigure, styles.cardFigureEnd)}>
                    <span className="text-label-caps text-muted">Win rate (A)</span>
                    <span
                      className={cx(
                        'mono',
                        experiment.deltaKpi >= 0
                          ? styles.deltaPositive
                          : styles.deltaNegative,
                      )}
                    >
                      {formatDelta(experiment.deltaKpi)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selected ? (
            <div className={styles.compareLayout}>
              <Panel
                headerStyle="headline"
                title={`Metric Comparison (${selected.id})`}
              >
                <MetricComparisonBars
                  comparisons={selected.comparisons}
                  variantALabel={selected.baseVariant.label}
                  variantBLabel={selected.challengerVariant.label}
                />
              </Panel>

              <Panel headerStyle="headline" title="Traffic Allocation">
                <DonutChart
                  segments={[
                    {
                      label: 'VAR-A',
                      percent: selected.trafficAllocation.variantA,
                      colorVar: '--color-primary-container',
                    },
                    {
                      label: 'VAR-B',
                      percent: selected.trafficAllocation.variantB,
                      colorVar: '--color-secondary-container',
                    },
                  ]}
                  centerValue={`${selected.trafficAllocation.variantA}%`}
                  centerLabel="Variant A"
                />
              </Panel>
            </div>
          ) : null}

          <Panel title="Experiment Directory" bodyClassName={tableStyles.scroll}>
            <table className={tableStyles.table}>
              <caption className="sr-only">
                All experiments. Select a row to compare its variants above.
              </caption>
              <thead>
                <tr className={tableStyles.headRow}>
                  <th scope="col" className={tableStyles.th}>Experiment ID</th>
                  <th scope="col" className={tableStyles.th}>Start Date</th>
                  <th scope="col" className={tableStyles.th}>Base Model</th>
                  <th scope="col" className={tableStyles.th}>Challenger</th>
                  <th scope="col" className={cx(tableStyles.th, tableStyles.alignEnd)}>
                    Delta (KPI)
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((experiment) => (
                  <tr
                    key={experiment.id}
                    className={cx(tableStyles.row, tableStyles.rowInteractive)}
                    onClick={() => setSelectedId(experiment.id)}
                  >
                    <td className={cx(tableStyles.td, tableStyles.relative)}>
                      <button
                        type="button"
                        className={cx('mono', tableStyles.rowLink)}
                        onClick={() => setSelectedId(experiment.id)}
                      >
                        {experiment.id}
                      </button>
                    </td>
                    <td className={cx(tableStyles.td, 'mono', 'text-code-sm')}>
                      {formatDateTimeShort(experiment.startedAt)}
                    </td>
                    <td className={tableStyles.td}>
                      <Badge mono>{experiment.baseVariant.model}</Badge>
                    </td>
                    <td className={tableStyles.td}>
                      <Badge mono>{experiment.challengerVariant.model}</Badge>
                    </td>
                    <td
                      className={cx(
                        tableStyles.td,
                        tableStyles.alignEnd,
                        'mono',
                        experiment.deltaKpi >= 0
                          ? styles.deltaPositive
                          : styles.deltaNegative,
                      )}
                    >
                      {formatDelta(experiment.deltaKpi)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </>
      )}

      <NewExperimentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={(input) => void handleCreate(input)}
      />
    </div>
  )
}
