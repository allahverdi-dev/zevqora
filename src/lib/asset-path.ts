/**
 * Resolves a `public/`-relative path against the app's deployed base URL.
 *
 * Vite rewrites `index.html`'s own asset references (favicon, script tags)
 * automatically at build time, but a root-absolute path used at runtime in
 * application code — e.g. `avatarUrl: '/demo/avatar.png'` — is just a string
 * and is not rewritten. Under GitHub Pages, where the app is served from
 * `/zevqora/` rather than `/`, that string would 404 unless prefixed here.
 * Locally, `BASE_URL` is `/`, so this is a no-op.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL // e.g. '/' or '/zevqora/'
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${trimmedBase}${normalizedPath}`
}
