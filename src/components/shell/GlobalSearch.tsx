import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'

import { NAV_SECTIONS, SETTINGS_ITEM } from '@/app/navigation'
import { Dialog } from '@/components/ui/Dialog'
import { useServices } from '@/app/providers/ServicesProvider'
import { cx } from '@/lib/cx'

import styles from './GlobalSearch.module.css'

interface SearchResult {
  readonly id: string
  readonly label: string
  readonly caption: string
  readonly to: string
  readonly group: string
}

const NAV_RESULTS: readonly SearchResult[] = [
  ...NAV_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      id: item.to,
      label: item.label,
      caption: section.label,
      to: item.to,
      group: 'Navigate',
    })),
  ),
  {
    id: SETTINGS_ITEM.to,
    label: SETTINGS_ITEM.label,
    caption: 'Settings',
    to: SETTINGS_ITEM.to,
    group: 'Navigate',
  },
]

/**
 * Command palette.
 *
 * Searches navigation destinations and the run corpus by id or agent, so
 * pasting a run id jumps straight to its trace.
 */
export function GlobalSearch({
  open,
  onClose,
}: {
  readonly open: boolean
  readonly onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [runResults, setRunResults] = useState<readonly SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()
  const services = useServices()

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  // Look up matching runs as the query changes.
  useEffect(() => {
    if (!open) return

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setRunResults([])
      return
    }

    let active = true

    services.runs
      .query({ filter: { search: trimmed }, pageSize: 5 })
      .then((page) => {
        if (!active) return
        setRunResults(
          page.items.map((run) => ({
            id: run.id,
            label: run.id,
            caption: `${run.agentName} · ${run.modelLabel}`,
            to: `/runs/${run.id}`,
            group: 'Runs',
          })),
        )
      })
      .catch(() => {
        if (active) setRunResults([])
      })

    return () => {
      active = false
    }
  }, [open, query, services])

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    const navMatches = trimmed
      ? NAV_RESULTS.filter((result) =>
          result.label.toLowerCase().includes(trimmed),
        )
      : NAV_RESULTS
    return [...navMatches, ...runResults]
  }, [query, runResults])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const go = (to: string) => {
    navigate(to)
    onClose()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const target = results[activeIndex]
      if (target) go(target.to)
    }
  }

  let lastGroup = ''

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Search ZEVQORA"
      hideTitle
      variant="palette"
      size="md"
    >
      <div className={styles.inputRow}>
        <Search size={18} aria-hidden="true" className={styles.inputIcon} />
        <input
          type="search"
          className={styles.input}
          placeholder="Search runs, agents or jump to a section..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search runs, agents or jump to a section"
          aria-controls="global-search-results"
          autoComplete="off"
        />
      </div>

      <div
        id="global-search-results"
        role="listbox"
        aria-label="Search results"
        className={styles.results}
      >
        {results.length === 0 ? (
          <p className={cx('text-body-sm', styles.empty)}>
            No matches for “{query.trim()}”.
          </p>
        ) : (
          results.map((result, index) => {
            const showGroup = result.group !== lastGroup
            lastGroup = result.group

            return (
              <div key={`${result.group}-${result.id}`}>
                {showGroup ? (
                  <p className={cx('text-label-caps', styles.group)}>
                    {result.group}
                  </p>
                ) : null}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cx(
                    styles.result,
                    index === activeIndex && styles.resultActive,
                  )}
                  onClick={() => go(result.to)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className={styles.resultText}>
                    <span
                      className={cx(
                        result.group === 'Runs' ? 'mono' : styles.resultLabel,
                      )}
                    >
                      {result.label}
                    </span>
                    <span className={cx('text-code-sm', styles.resultCaption)}>
                      {result.caption}
                    </span>
                  </span>
                  {index === activeIndex ? (
                    <CornerDownLeft
                      size={14}
                      aria-hidden="true"
                      className={styles.enterHint}
                    />
                  ) : null}
                </button>
              </div>
            )
          })
        )}
      </div>
    </Dialog>
  )
}
