import { describe, it, expect } from 'vitest'
import { PROVIDERS, providerById } from '../app/utils/aiProviders'

describe('AI provider registry', () => {
  it('every provider has the required fields', () => {
    for (const p of PROVIDERS) {
      expect(p.id, 'id').toBeTruthy()
      expect(p.label, `${p.id} label`).toBeTruthy()
      expect(p.icon, `${p.id} icon`).toMatch(/^i-lucide-/)
      expect(['openai', 'gemini', 'anthropic'], `${p.id} type`).toContain(p.type)
      expect(p.baseUrl, `${p.id} baseUrl`).toMatch(/^https?:\/\//)
      expect(p.defaultModel, `${p.id} defaultModel`).toBeTruthy()
      expect(Array.isArray(p.models), `${p.id} models`).toBe(true)
    }
  })

  it('provider ids are unique', () => {
    const ids = PROVIDERS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('providerById falls back to the first provider for unknown ids', () => {
    expect(providerById('does-not-exist')).toBe(PROVIDERS[0])
    expect(providerById(null).id).toBe(PROVIDERS[0]!.id)
  })

  it('includes the expected core providers', () => {
    const ids = PROVIDERS.map((p) => p.id)
    for (const id of ['gemini', 'openai', 'anthropic', 'ollama']) expect(ids).toContain(id)
  })
})
