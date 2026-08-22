import {
  Bug,
  Headphones,
  MoreVertical,
  Pencil,
  Play,
  Receipt,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Agent } from '@/domain'
import { AgentStatusBadge } from '@/components/ui/StatusBadge'
import { IconButton } from '@/components/ui/IconButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { cx } from '@/lib/cx'

import styles from './agents.module.css'

/** Per-agent glyph, chosen to match the approved fleet cards. */
const AGENT_ICONS: Record<string, LucideIcon> = {
  agt_8921: Headphones,
  agt_114a: Receipt,
  agt_900x: Bug,
  agt_4417: ShieldAlert,
  agt_2261: UserPlus,
  agt_7734: Search,
}

interface AgentCardProps {
  readonly agent: Agent
  readonly onEdit: (agent: Agent) => void
  readonly onRestart: (agent: Agent) => void
  readonly onMenu: (agent: Agent) => void
}

export function AgentCard({
  agent,
  onEdit,
  onRestart,
  onMenu,
}: AgentCardProps) {
  const Icon = AGENT_ICONS[agent.id] ?? Headphones
  const isErrored = agent.status === 'offline'

  return (
    <article
      className={cx(styles.card, isErrored && styles.cardErrored)}
      aria-labelledby={`agent-${agent.id}-name`}
    >
      {/* Trace Line header rule — lime while the agent is live. */}
      <span
        className={cx(styles.cardRule, agent.status === 'active' && styles.cardRuleActive)}
        aria-hidden="true"
      />

      <header className={styles.cardHeader}>
        <span className={styles.avatar} aria-hidden="true">
          <Icon size={20} />
        </span>

        <div className={styles.cardTitleBlock}>
          <h3 id={`agent-${agent.id}-name`} className={styles.cardName}>
            {agent.name}
          </h3>
          <p className={cx('text-code-sm', styles.cardId)}>
            ID: {agent.displayId}
          </p>
        </div>

        <IconButton
          label={`More actions for ${agent.name}`}
          size="sm"
          onClick={() => onMenu(agent)}
        >
          <MoreVertical size={18} />
        </IconButton>
      </header>

      <AgentStatusBadge status={agent.status} className={styles.cardStatus} />

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <p className={cx('text-label-caps', styles.statLabel)}>Model</p>
          <p className={cx('mono', styles.statValue)}>{agent.model.label}</p>
        </div>
        <div className={styles.stat}>
          <p className={cx('text-label-caps', styles.statLabel)}>Tools</p>
          <p className={cx('mono', 'tabular', styles.statValue)}>
            {agent.tools.length}
          </p>
        </div>
      </div>

      <footer className={styles.cardFooter}>
        {isErrored ? (
          <>
            <span className={cx('text-code-sm', styles.sysLabel)}>SYS</span>
            <button
              type="button"
              className={styles.restartButton}
              onClick={() => onRestart(agent)}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Restart
            </button>
          </>
        ) : (
          <>
            <Tooltip
              label={
                agent.attachedPolicyIds.length === 0
                  ? 'No policies attached'
                  : `Governed by ${agent.attachedPolicyIds.length} attached ${
                      agent.attachedPolicyIds.length === 1 ? 'policy' : 'policies'
                    }`
              }
              className={styles.policySummary}
            >
              <Shield size={14} aria-hidden="true" className={styles.policyIcon} />
              <span className={cx('text-code-sm', 'tabular')}>
                {agent.attachedPolicyIds.length}{' '}
                {agent.attachedPolicyIds.length === 1 ? 'policy' : 'policies'}
              </span>
            </Tooltip>

            <div className={styles.cardActions}>
              <IconButton
                label={`Configure ${agent.name}`}
                size="sm"
                onClick={() => onEdit(agent)}
              >
                <Pencil size={18} />
              </IconButton>
              <Link
                to="/simulator"
                className={styles.runLink}
                aria-label={`Run ${agent.name} in the Simulator`}
              >
                <Play size={18} aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </footer>
    </article>
  )
}
