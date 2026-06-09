import { describe, it, expect } from 'vitest'
import { slugifyCategory, makeDynamicCategory, DEFAULT_CATEGORIES } from '../app/utils/categories'

describe('slugifyCategory', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyCategory('Bank Statements')).toBe('bank-statements')
  })
  it('maps German umlauts to ASCII', () => {
    expect(slugifyCategory('Verträge')).toBe('vertraege')
    expect(slugifyCategory('Gesundheit & Pflege')).toBe('gesundheit-pflege')
  })
  it('falls back to "sonstiges" for empty/symbol-only input', () => {
    expect(slugifyCategory('!!!')).toBe('sonstiges')
    expect(slugifyCategory('')).toBe('sonstiges')
  })
})

describe('makeDynamicCategory', () => {
  it('creates a category with a slug key, literal label, and assigned color/icon', () => {
    const cat = makeDynamicCategory('Gesundheit', DEFAULT_CATEGORIES.length)
    expect(cat.key).toBe('gesundheit')
    expect(cat.label).toBe('Gesundheit')
    expect(cat.isDefault).toBe(false)
    expect(cat.color).toBeTruthy()
    expect(cat.icon).toMatch(/^i-lucide-/)
  })
})
