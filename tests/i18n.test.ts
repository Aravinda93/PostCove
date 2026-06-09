import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Read the locale files as RAW JSON (not via import) so the @nuxtjs/i18n compiler
// doesn't transform messages into ASTs before we can compare their key paths.
function load(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(new URL(`../i18n/locales/${file}`, import.meta.url), 'utf8'))
}

function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k
    return v && typeof v === 'object' ? keyPaths(v as Record<string, unknown>, path) : [path]
  })
}

describe('i18n locale parity', () => {
  const enKeys = new Set(keyPaths(load('en.json')))
  const deKeys = new Set(keyPaths(load('de.json')))

  it('German has every English key (no missing translations)', () => {
    const missing = [...enKeys].filter((k) => !deKeys.has(k))
    expect(missing, `Missing in de.json: ${missing.join(', ')}`).toEqual([])
  })

  it('English has every German key (no orphan translations)', () => {
    const extra = [...deKeys].filter((k) => !enKeys.has(k))
    expect(extra, `Missing in en.json: ${extra.join(', ')}`).toEqual([])
  })
})
