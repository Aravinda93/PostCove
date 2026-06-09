import { describe, it, expect } from 'vitest'
import { daysUntil, formatDate } from '../app/utils/dates'

describe('daysUntil', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(daysUntil(today)).toBe(0)
  })
  it('is positive for the future and negative for the past', () => {
    const future = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10)
    const past = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10)
    expect(daysUntil(future)).toBe(5)
    expect(daysUntil(past)).toBe(-3)
  })
})

describe('formatDate', () => {
  it('formats per locale', () => {
    expect(formatDate('2026-07-15', 'en')).toMatch(/2026/)
    expect(formatDate('2026-07-15', 'de')).toMatch(/2026/)
  })
})
