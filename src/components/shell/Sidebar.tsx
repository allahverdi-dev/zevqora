import { ChevronsUpDown, Settings as SettingsIcon } from 'lucide-react'
import { NavLink, Link } from 'react-router-dom'
import { useId } from 'react'

import { NAV_SECTIONS, SETTINGS_ITEM, type NavItem } from '@/app/navigation'
import { useEnvironment } from '@/app/providers/EnvironmentProvider'
import { useSession } from '@/hooks/useSession'
import { cx } from '@/lib/cx'

import { BrandMark } from './BrandMark'
import styles from './Sidebar.module.css'

interface SidebarProps {
  /** Drawer state below the 1024px breakpoint. */
  readonly open: boolean
  readonly onNavigate: () => void
  readonly onWorkspaceClick: () => void
}

function SidebarItem({
  item,
  onNavigate,
}: {
  readonly item: NavItem
  readonly onNavigate: () => void
}) {
  const Icon = item.icon

  return (
    <li>
      <NavLink
        to={item.to}
        onClick={onNavigate}
        className={({ isActive }) =>
          cx(styles.item, isActive && styles.itemActive)
        }
        // aria-current is set by NavLink automatically when active.
      >
        <Icon size={18} aria-hidden="true" className={styles.itemIcon} />
        <span className={styles.itemLabel}>{item.label}</span>
      </NavLink>
    </li>
  )
}

export function Sidebar({ open, onNavigate, onWorkspaceClick }: SidebarProps) {
  const workspaceLabelId = useId()
  const { session } = useSession()
  const { environment } = useEnvironment()

  return (
    <aside
      className={cx('sidebar', styles.sidebar)}
      data-open={open}
      aria-label="Primary"
    >
      <div className="sidebar__brand">
        <Link
          to="/"
          className={styles.brandLink}
          aria-label="ZEVQORA — go to the landing page"
        >
          <span className={styles.brandMark}>
            <BrandMark size={30} title="" />
          </span>
          <span className="sidebar__brand-name">ZEVQORA</span>
        </Link>
      </div>

      <nav className="sidebar__nav" aria-label="Sections">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className={styles.section}>
            <h2 className={cx('text-label-caps', styles.sectionLabel)}>
              {section.label}
            </h2>
            <ul className={styles.list} role="list">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.to}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <ul className={styles.list} role="list">
          <SidebarItem item={SETTINGS_ITEM} onNavigate={onNavigate} />
        </ul>

        <button
          type="button"
          className={styles.workspace}
          onClick={onWorkspaceClick}
          aria-labelledby={workspaceLabelId}
        >
          <span className={styles.workspaceText}>
            <span className={cx('text-label-caps', styles.workspaceCaption)}>
              Workspace
            </span>
            <span id={workspaceLabelId} className={styles.workspaceName}>
              {session.workspace.name}
            </span>
          </span>
          <ChevronsUpDown size={18} aria-hidden="true" />
        </button>

        <div className={styles.environmentRow}>
          <span className={styles.environment}>
            <span
              className={cx('status-dot', styles.environmentDot, 'pulse')}
              aria-hidden="true"
            />
            <span className={cx('text-code-sm', styles.environmentLabel)}>
              {environment.toUpperCase()}
            </span>
          </span>
          <NavLink
            to={SETTINGS_ITEM.to}
            onClick={onNavigate}
            className={styles.settingsShortcut}
            aria-label="Workspace settings"
          >
            <SettingsIcon size={18} aria-hidden="true" />
          </NavLink>
        </div>

        {/*
          A compact, always-visible statement that telemetry is simulated —
          ZEVQORA is a frontend demo, not a connection to live infrastructure.
          Deliberately understated: one caption here plus careful page copy is
          the whole disclosure strategy, rather than a "demo" badge on every
          screen.
        */}
        <p className={cx('text-code-sm', styles.demoCaption)}>
          Simulated telemetry — no live infrastructure is connected.
        </p>
      </div>
    </aside>
  )
}
