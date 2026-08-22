import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { useToast } from '@/app/providers/ToastProvider'
import { cx } from '@/lib/cx'

import { GlobalSearch } from './GlobalSearch'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import styles from './AppShell.module.css'

const MOBILE_BREAKPOINT = 1024

/**
 * The persistent application chrome shared by every authenticated screen.
 *
 * Rendered once as a layout route, so the sidebar and topbar are not
 * reconstructed on navigation and their scroll position survives route changes.
 */
export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const { toast } = useToast()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // ⌘K / Ctrl+K opens the palette from anywhere.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Escape closes the nav drawer when it is the topmost surface.
  useEffect(() => {
    if (!navOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setNavOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navOpen])

  // Reset the drawer if the viewport grows past the breakpoint.
  useEffect(() => {
    function onResize() {
      if (window.innerWidth > MOBILE_BREAKPOINT) setNavOpen(false)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const notImplemented = useCallback(
    (feature: string) => {
      toast({
        tone: 'info',
        title: `${feature} is not part of this release`,
        detail:
          'ZEVQORA is a frontend demo. This control is intentionally inert.',
      })
    },
    [toast],
  )

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Sidebar
        open={navOpen}
        onNavigate={() => setNavOpen(false)}
        onWorkspaceClick={() => notImplemented('Workspace switching')}
      />

      {navOpen ? (
        <button
          type="button"
          className={styles.navScrim}
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <div className={cx('workspace', styles.workspace)}>
        <Topbar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNav={() => setNavOpen(true)}
          onOpenAccount={() => notImplemented('Account management')}
          notificationCount={3}
        />

        <main id="main-content" className="workspace__content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
