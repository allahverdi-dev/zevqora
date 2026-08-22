import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Architectural guards.
 *
 * The backend-ready boundary is the whole point of the service layer, and it
 * is the kind of rule that erodes one convenient import at a time. These tests
 * fail the build instead.
 */

const SRC = join(process.cwd(), 'src')

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full))
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

/** Layers permitted to touch the seed data directly. */
const DATA_LAYER = ['services' + sep + 'mock', 'mocks', 'tests']

function isDataLayer(file: string): boolean {
  const rel = relative(SRC, file)
  return DATA_LAYER.some((prefix) => rel.startsWith(prefix))
}

describe('repository boundary', () => {
  const files = sourceFiles(SRC)

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(40)
  })

  it('no UI module imports raw mock data', () => {
    const offenders: string[] = []

    for (const file of files) {
      if (isDataLayer(file)) continue
      const source = readFileSync(file, 'utf8')
      if (/from ['"]@\/mocks/.test(source)) {
        offenders.push(relative(SRC, file))
      }
    }

    expect(offenders).toEqual([])
  })

  it('no UI module imports a mock repository implementation', () => {
    const offenders: string[] = []

    for (const file of files) {
      if (isDataLayer(file)) continue
      const rel = relative(SRC, file)
      // The composition root is allowed to name concrete implementations.
      if (rel === join('services', 'index.ts')) continue

      const source = readFileSync(file, 'utf8')
      if (/from ['"]@\/services\/mock/.test(source)) {
        offenders.push(rel)
      }
    }

    expect(offenders).toEqual([])
  })

  it('only the composition root constructs repositories', () => {
    const offenders: string[] = []

    for (const file of files) {
      const rel = relative(SRC, file)
      if (isDataLayer(file)) continue
      if (rel === join('services', 'index.ts')) continue

      const source = readFileSync(file, 'utf8')
      if (/new Mock[A-Za-z]*Repository\(/.test(source)) {
        offenders.push(rel)
      }
    }

    expect(offenders).toEqual([])
  })

  it('components read the clock from lib, not from the mock layer', () => {
    const offenders: string[] = []

    for (const file of files) {
      if (isDataLayer(file)) continue
      const source = readFileSync(file, 'utf8')
      if (/DEMO_NOW/.test(source)) offenders.push(relative(SRC, file))
    }

    expect(offenders).toEqual([])
  })
})

describe('no Stitch export artifacts remain', () => {
  // The tests directory is excluded: this file necessarily contains the banned
  // strings as literals, and would otherwise flag itself.
  const files = [
    ...sourceFiles(SRC).filter(
      (file) => !relative(SRC, file).startsWith('tests'),
    ),
    join(process.cwd(), 'index.html'),
  ]

  it('contains no temporary Stitch or CDN references', () => {
    const banned = [
      'cdn.tailwindcss.com',
      'stitch-placeholder',
      'lh3.googleusercontent.com',
      'material-symbols',
    ]
    const offenders: string[] = []

    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const term of banned) {
        if (source.includes(term)) {
          offenders.push(`${relative(process.cwd(), file)}: ${term}`)
        }
      }
    }

    expect(offenders).toEqual([])
  })

  it('uses no inline onclick handlers or placeholder hrefs', () => {
    const offenders: string[] = []

    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      if (/\sonclick=/.test(source)) offenders.push(`${relative(process.cwd(), file)}: onclick`)
      if (/href="#"/.test(source)) offenders.push(`${relative(process.cwd(), file)}: href="#"`)
    }

    expect(offenders).toEqual([])
  })

  it('never calls window.alert', () => {
    const offenders: string[] = []

    for (const file of sourceFiles(SRC)) {
      const source = readFileSync(file, 'utf8')
      // Ignore prose in comments; look for a real call expression.
      const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')
      if (/(^|[^.\w])alert\s*\(/.test(stripped)) {
        offenders.push(relative(SRC, file))
      }
    }

    expect(offenders).toEqual([])
  })
})
