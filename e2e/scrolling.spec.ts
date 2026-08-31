import { test, expect, type Page } from '@playwright/test'

const routes = [
  '/', '/dashboard', '/runs', '/runs/rn_8b9f4e2d_c1', '/evaluations',
  '/incidents', '/approvals', '/experiments', '/policies', '/agents',
  '/simulator', '/settings', '/analytics',
]

async function load(page: Page, route: string) {
  await page.goto(route)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.getByText('Loading section…', { exact: true })).toHaveCount(0)
  // Also wait for mock repository reads to populate the page.
  await expect(page.locator('main [role="status"]').filter({ hasText: /Loading/i })).toHaveCount(0)
}

async function scrollTop(page: Page) {
  return page.evaluate(() => document.scrollingElement!.scrollTop)
}

async function pointAtPage(page: Page) {
  // Use ordinary page padding, outside intentional inner scrollers (e.g.
  // approval queues and incident timelines). Test tables separately below.
  const box = (await page.locator('main').boundingBox())!
  await page.mouse.move(box.x + 10, box.y + 10)
}

for (const route of routes) {
  test(`native wheel scrolls ${route}`, async ({ page }) => {
    await load(page, route)
    const range = await page.evaluate(() => document.scrollingElement!.scrollHeight - document.scrollingElement!.clientHeight)
    // Pages shorter than the viewport have nothing to scroll; verify they are
    // unlocked rather than adding artificial content or forcing a scrollbar.
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden')
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
    if (range <= 0) return
    await pointAtPage(page)
    await page.mouse.wheel(0, 400)
    await expect.poll(() => scrollTop(page)).toBeGreaterThan(0)
  })
}

test('native keyboard navigation and scrollbar dragging remain available', async ({ page }) => {
  test.skip(page.viewportSize()!.width <= 1024, 'Desktop keyboard and scrollbar semantics')
  await load(page, '/')

  await page.keyboard.press('Home')
  await expect.poll(() => scrollTop(page)).toBe(0)

  await page.locator('body').click({ position: { x: 15, y: 200 } })

  await page.keyboard.press('PageDown')
  await expect.poll(() => scrollTop(page)).toBeGreaterThan(0)
  await page.waitForTimeout(300)

  await page.keyboard.press('Home')
  await expect.poll(() => scrollTop(page)).toBe(0)

  await page.keyboard.press('Space')
  await expect.poll(() => scrollTop(page)).toBeGreaterThan(0)
  await page.waitForTimeout(300)

  await page.keyboard.press('End')
  await page.waitForTimeout(300)
  const endTopForPageUp = await scrollTop(page)
  expect(endTopForPageUp).toBeGreaterThan(0)

  await page.keyboard.press('PageUp')
  await page.waitForTimeout(300)
  await expect.poll(() => scrollTop(page)).toBeLessThan(endTopForPageUp)

  await page.keyboard.press('End')
  await page.waitForTimeout(300)
  const endTopForShiftSpace = await scrollTop(page)
  expect(endTopForShiftSpace).toBeGreaterThan(0)

  await page.keyboard.press('Shift+Space')
  await page.waitForTimeout(300)
  await expect.poll(() => scrollTop(page)).toBeLessThan(endTopForShiftSpace)

  await page.keyboard.press('Home')
  await expect.poll(() => scrollTop(page)).toBe(0)

  const viewport = page.viewportSize()!
  const thumbY = await page.evaluate(
    () => innerHeight * innerHeight / document.scrollingElement!.scrollHeight / 2,
  )
  await page.mouse.move(viewport.width - 3, thumbY)
  await page.mouse.down()
  await page.mouse.move(viewport.width - 3, thumbY + 150, { steps: 10 })
  await page.mouse.up()
  await expect.poll(() => scrollTop(page)).toBeGreaterThan(0)
})

test('search locks the document and releases it after dismissal and navigation', async ({ page }) => {
  await load(page, '/runs')
  // The visible label is hidden at narrow widths; the shortcut stays stable.
  const search = page.locator('button[aria-keyshortcuts]')
  await search.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  // Assert actual document lock, not just body styles.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).toBe('hidden')
  const lockedTop = await scrollTop(page)
  await page.mouse.move(page.viewportSize()!.width - 15, page.viewportSize()!.height - 20)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(150)
  expect(await scrollTop(page)).toBe(lockedTop)
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe('')
  await search.click()
  await page.getByRole('option', { name: /Dashboard/ }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('')
  await pointAtPage(page)
  await page.mouse.wheel(0, 400)
  await expect.poll(() => scrollTop(page)).toBeGreaterThan(0)
})

test('horizontal tables scroll sideways and allow vertical page scrolling', async ({ page }) => {
  test.skip(page.viewportSize()!.width > 768, 'Dense tables overflow at narrow widths')
  await load(page, '/runs')
  const table = page.getByRole('table')
  const container = table.locator('..')
  await container.scrollIntoViewIfNeeded()
  const box = (await container.boundingBox())!
  await page.mouse.move(Math.min(box.x + 100, page.viewportSize()!.width - 30), Math.max(100, box.y + 70))
  await page.mouse.wheel(350, 0)
  await expect.poll(() => container.evaluate(e => e.scrollLeft)).toBeGreaterThan(0)
  const before = await scrollTop(page)
  await page.mouse.wheel(0, 250)
  await expect.poll(() => scrollTop(page)).toBeGreaterThan(before)
})

test('closing or navigating from the mobile sidebar leaves scrolling unlocked', async ({ page }) => {
  test.skip(page.viewportSize()!.width > 1024, 'Drawer is used at tablet and mobile widths')
  await load(page, '/dashboard')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.getByRole('button', { name: 'Close navigation' })).toBeVisible()
  await page.getByRole('button', { name: 'Close navigation' }).click({ position: { x: page.viewportSize()!.width - 20, y: 100 } })
  await expect(page.getByRole('button', { name: 'Close navigation' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('link', { name: 'Runs', exact: true }).click()
  await expect(page).toHaveURL(/\/runs$/)
  await expect(page.getByRole('button', { name: 'Close navigation' })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('')
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')

  const range = await page.evaluate(
    () =>
      document.scrollingElement!.scrollHeight -
      document.scrollingElement!.clientHeight,
  )

  if (range <= 0) return

  await pointAtPage(page)
  await page.mouse.wheel(0, 400)
  await expect.poll(() => scrollTop(page)).toBeGreaterThan(0)
})

test('one-finger swipes scroll the landing page and vertically over a table', async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== 'chromium' || !isMobile, 'Chromium touch protocol; WebKit has no touch-drag API')
  const session = await page.context().newCDPSession(page)
  for (const route of ['/', '/runs']) {
    await load(page, route)
    const viewport = page.viewportSize()!
    let x = viewport.width / 2
    let y = viewport.height - 100
    if (route === '/runs') {
      const table = page.getByRole('table')
      await table.scrollIntoViewIfNeeded()
      const box = (await table.boundingBox())!
      x = Math.min(box.x + 100, viewport.width - 30)
      y = Math.min(box.y + 180, viewport.height - 100)
    }
    const before = await scrollTop(page)
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 25 }] })
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => scrollTop(page)).toBeGreaterThan(before)
  }
  await session.detach()
})
