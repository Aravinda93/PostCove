// ============================================================================
//  Category model — data-driven & extensible.
// ============================================================================
//  The four German defaults ship with i18n labels. When a scanned letter does
//  not match any existing category, a NEW one is created on the fly (see
//  useBriefBox.ensureCategory) with an auto-assigned color + icon from the
//  palettes below. Colors are Nuxt UI *semantic aliases* — re-theming still
//  happens only in app/app.config.ts.
// ============================================================================

export type SemanticColor =
  | 'error'
  | 'info'
  | 'success'
  | 'warning'
  | 'primary'
  | 'secondary'

export type CategoryKey = string

export interface Category {
  key: CategoryKey
  /** i18n key (defaults only) — takes precedence over `label` when present. */
  i18nName?: string
  /** i18n key (defaults only) for the description. */
  i18nDesc?: string
  /** Literal label (dynamically-created categories). */
  label?: string
  /** Literal description (dynamically-created categories). */
  desc?: string
  icon: string
  color: SemanticColor
  isDefault: boolean
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    key: 'finanzamt',
    i18nName: 'categories.finanzamt',
    i18nDesc: 'categories.finanzamtDesc',
    icon: 'i-lucide-landmark',
    color: 'error',
    isDefault: true
  },
  {
    key: 'versicherung',
    i18nName: 'categories.versicherung',
    i18nDesc: 'categories.versicherungDesc',
    icon: 'i-lucide-shield-check',
    color: 'info',
    isDefault: true
  },
  {
    key: 'vertraege',
    i18nName: 'categories.vertraege',
    i18nDesc: 'categories.vertraegeDesc',
    icon: 'i-lucide-file-signature',
    color: 'success',
    isDefault: true
  },
  {
    key: 'energie',
    i18nName: 'categories.energie',
    i18nDesc: 'categories.energieDesc',
    icon: 'i-lucide-plug-zap',
    color: 'warning',
    isDefault: true
  }
]

// Palettes for auto-created categories. Cycled by category index so new
// categories get visually distinct, theme-aware accents.
const DYNAMIC_COLORS: SemanticColor[] = [
  'secondary',
  'primary',
  'info',
  'warning',
  'success',
  'error'
]
const DYNAMIC_ICONS = [
  'i-lucide-folder',
  'i-lucide-file-text',
  'i-lucide-briefcase',
  'i-lucide-receipt',
  'i-lucide-stethoscope',
  'i-lucide-graduation-cap',
  'i-lucide-car',
  'i-lucide-globe'
]

/** Normalise a free-form label into a stable key, e.g. "Gesundheit / Health" -> "gesundheit-health". */
export function slugifyCategory(label: string): CategoryKey {
  const umlauts: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" }
  const ascii = label.toLowerCase().replace(/[äöüß]/g, (c) => umlauts[c] ?? c)
  return (
    ascii
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "sonstiges"
  )
}

/** Display label for a category: i18n for defaults, literal for dynamic ones. */
export function categoryLabel(cat: Category, t: (key: string) => string): string {
  return cat.i18nName ? t(cat.i18nName) : (cat.label ?? cat.key)
}

/** Display description for a category (may be empty for dynamic ones). */
export function categoryDesc(cat: Category, t: (key: string) => string): string {
  return cat.i18nDesc ? t(cat.i18nDesc) : (cat.desc ?? '')
}

/** Build a dynamically-created category from a scanned label. */
export function makeDynamicCategory(label: string, existingCount: number): Category {
  return {
    key: slugifyCategory(label),
    label: label.trim(),
    icon: DYNAMIC_ICONS[existingCount % DYNAMIC_ICONS.length]!,
    color: DYNAMIC_COLORS[existingCount % DYNAMIC_COLORS.length]!,
    isDefault: false
  }
}
