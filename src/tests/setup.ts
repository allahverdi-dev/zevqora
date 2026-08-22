import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

import { setMockLatency } from '@/services/mock/latency'

// Repositories resolve immediately in tests so assertions stay deterministic
// and fast; the simulated transport delay only exists for the running app.
setMockLatency(0)

// jsdom implements neither of these. Components query them for motion
// preferences and scroll behaviour, so they are stubbed rather than guarded
// at every call site.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}
