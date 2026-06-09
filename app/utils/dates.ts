// Lightweight date helpers for the timeline. No external date library —
// keeps the bundle small and the dependency tree 100% FOSS & minimal.

/** Whole days from now until an ISO date. Negative = in the past (overdue). */
export function daysUntil(iso: string): number {
  const now = new Date()
  const target = new Date(iso)
  // Normalise to midnight so partial days don't skew the count.
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((b - a) / 86_400_000)
}

/** Format an ISO date in the active locale, e.g. "5 Jun 2026" / "5. Juni 2026". */
export function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
