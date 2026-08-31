import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  expect: { timeout: 15_000 },
  timeout: 45_000,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } } },
    { name: 'laptop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 }, launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } } },
    { name: 'tablet', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    // Playwright cannot dispatch wheel or touch-drag in mobile WebKit. Test
    // the Safari engine at phone width; real iOS gestures need device QA.
    { name: 'webkit', use: { browserName: 'webkit', viewport: { width: 430, height: 932 } } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
})
