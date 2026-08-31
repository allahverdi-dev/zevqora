import { StrictMode } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { ServicesProvider } from '@/app/providers/ServicesProvider'
import { EnvironmentProvider } from '@/app/providers/EnvironmentProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { AppShell } from '@/components/shell/AppShell'
import { Dialog } from '@/components/ui/Dialog'
import { lockDocumentScroll } from '@/lib/scroll-lock'

afterEach(() => {
  cleanup()
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
})

function expectLocked() {
  for (const element of [document.documentElement, document.body]) {
    expect(element.style.overflow).toBe('hidden')
  }
}

function expectUnlocked() {
  for (const element of [document.documentElement, document.body]) {
    expect(element.style.overflow).toBe('')
  }
}

function Modal({ open = true, title = 'Test dialog' }: { open?: boolean; title?: string }) {
  return <Dialog open={open} title={title} onClose={() => {}}>Content</Dialog>
}

describe('document scroll locking', () => {
  it('does not lock a closed dialog and restores scrolling after repeated open/close under StrictMode', () => {
    const { rerender, unmount } = render(<StrictMode><Modal open={false} /></StrictMode>)
    expectUnlocked()
    for (let cycle = 0; cycle < 3; cycle++) {
      rerender(<StrictMode><Modal /></StrictMode>)
      expectLocked()
      rerender(<StrictMode><Modal open={false} /></StrictMode>)
      expectUnlocked()
    }
    rerender(<StrictMode><Modal /></StrictMode>)
    expectLocked()
    unmount()
    expectUnlocked()
  })

  it.each(['first', 'second'] as const)('retains the lock when the %s of two dialogs closes first', (closing) => {
    function Pair({ first, second }: { first: boolean; second: boolean }) {
      return <StrictMode><Modal open={first} title="First" /><Modal open={second} title="Second" /></StrictMode>
    }
    const { rerender, unmount } = render(<Pair first second={false} />)
    rerender(<Pair first second />)
    expectLocked()
    rerender(<Pair first={closing !== 'first'} second={closing !== 'second'} />)
    expectLocked()
    unmount()
    expectUnlocked()
  })

  it('restores different pre-existing axis values and priorities without overwriting other styles', () => {
    document.documentElement.style.setProperty('overflow-x', 'clip', 'important')
    document.documentElement.style.setProperty('overflow-y', 'auto')
    document.body.style.setProperty('overflow', 'scroll', 'important')
    const { unmount } = render(<StrictMode><Modal /></StrictMode>)
    expectLocked()
    document.body.style.color = 'red'
    unmount()
    expect(document.documentElement.style.overflowX).toBe('clip')
    expect(document.documentElement.style.getPropertyPriority('overflow-x')).toBe('important')
    expect(document.documentElement.style.overflowY).toBe('auto')
    expect(document.documentElement.style.getPropertyPriority('overflow-y')).toBe('')
    expect(document.body.style.overflow).toBe('scroll')
    expect(document.body.style.getPropertyPriority('overflow')).toBe('important')
    expect(document.body.style.color).toBe('red')
  })

  it('releasing one owner twice cannot release another owner', () => {
    const releaseFirst = lockDocumentScroll()
    const releaseSecond = lockDocumentScroll()
    releaseFirst()
    releaseFirst()
    expectLocked()
    releaseSecond()
    expectUnlocked()
  })
})

function ExternalNavigation() {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/other')}>External navigation</button>
}

function renderShell() {
  return render(
    <StrictMode>
      <ServicesProvider><EnvironmentProvider><ToastProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <ExternalNavigation />
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Link to="/outside">Leave shell</Link>} />
              <Route path="/other" element={<p>Other route</p>} />
              <Route path="/runs" element={<p>Runs destination</p>} />
            </Route>
            <Route path="/outside" element={<p>Outside shell</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider></EnvironmentProvider></ServicesProvider>
    </StrictMode>,
  )
}

describe('search and route transitions', () => {
  it('starts unlocked, locks on search, and releases on Escape and search-result navigation', async () => {
    const user = userEvent.setup()
    renderShell()
    expectUnlocked()
    const search = screen.getByRole('button', { name: /search or type command/i })
    await user.click(search)
    expectLocked()
    await user.keyboard('{Escape}')
    expectUnlocked()
    await user.click(search)
    await user.click(screen.getByRole('option', { name: /^Runs Build/i }))
    await screen.findByText('Runs destination')
    expectUnlocked()
  })

  it('closes search on navigation that did not originate from the palette', async () => {
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getByRole('button', { name: /search or type command/i }))
    expectLocked()
    await user.click(screen.getByRole('button', { name: 'External navigation' }))
    await screen.findByText('Other route')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expectUnlocked()
  })

  it('releases search on shell unmount', async () => {
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getByRole('button', { name: /search or type command/i }))
    expectLocked()
    await user.click(screen.getByRole('link', { name: 'Leave shell' }))
    await screen.findByText('Outside shell')
    expectUnlocked()
  })
})
