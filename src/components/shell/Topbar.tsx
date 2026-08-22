import { Bell, Menu, Search } from 'lucide-react'

import { IconButton } from '@/components/ui/IconButton'
import { useSession } from '@/hooks/useSession'
import { withBase } from '@/lib/asset-path'
import { cx } from '@/lib/cx'

import styles from './Topbar.module.css'

interface TopbarProps {
  readonly onOpenSearch: () => void
  readonly onOpenNav: () => void
  readonly onOpenAccount: () => void
  readonly notificationCount: number
}

export function Topbar({
  onOpenSearch,
  onOpenNav,
  onOpenAccount,
  notificationCount,
}: TopbarProps) {
  const { session } = useSession()
  const { account } = session

  return (
    <header className={cx('topbar', styles.topbar)}>
      <div className={styles.left}>
        <IconButton
          label="Open navigation"
          onClick={onOpenNav}
          className={styles.navToggle}
        >
          <Menu size={20} />
        </IconButton>

        {/* Opens the command palette; a button, not a text input, because it
            does not accept typing until the palette is open. */}
        <button
          type="button"
          className={styles.search}
          onClick={onOpenSearch}
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Search size={20} aria-hidden="true" className={styles.searchIcon} />
          <span className={styles.searchLabel}>Search or type command...</span>
          <kbd className={cx('text-code-sm', styles.kbd)}>⌘K</kbd>
        </button>
      </div>

      <div className={styles.right}>
        <IconButton
          label={
            notificationCount > 0
              ? `Notifications, ${notificationCount} unread`
              : 'Notifications'
          }
          onClick={onOpenAccount}
          className={styles.bell}
        >
          <span className={styles.bellWrap}>
            <Bell size={20} />
            {notificationCount > 0 ? (
              <span className={styles.bellDot} aria-hidden="true" />
            ) : null}
          </span>
        </IconButton>

        <button
          type="button"
          className={styles.account}
          onClick={onOpenAccount}
          aria-label={`Account menu for ${account.name}`}
        >
          <span className={styles.accountText}>
            <span className={styles.accountName}>{account.name}</span>
            <span className={cx('text-label-caps', styles.accountPlan)}>
              {account.plan}
            </span>
          </span>
          <img
            src={account.avatarUrl}
            srcSet={`${account.avatarUrl} 1x, ${withBase('/demo/avatar@2x.png')} 2x`}
            alt=""
            width={32}
            height={32}
            className={styles.avatar}
            loading="lazy"
            decoding="async"
          />
        </button>
      </div>
    </header>
  )
}
