// ============================================================================
//  BRIEF-BOX AI — SINGLE SOURCE OF TRUTH FOR ALL COLORS & THEMING
// ============================================================================
//  This is the ONLY place you need to touch to re-brand the entire app.
//  Every <UButton>, <UBadge>, <UCard>, border, ring and focus state reads from
//  these semantic aliases. Change `primary` from 'emerald' to 'indigo' below and
//  every call-to-action in the app turns indigo — no template edits required.
//
//  The right-hand values ('emerald', 'zinc', ...) are Tailwind v4 color scales.
//  Valid options include: red, orange, amber, yellow, lime, green, emerald, teal,
//  cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose, slate, gray,
//  zinc, neutral, stone.
// ============================================================================

export default defineAppConfig({
  // -- Brand-level category accents -----------------------------------------
  // Used by the dashboard category cards & timeline badges so the four German
  // mail categories keep a consistent color identity everywhere.
  postcove: {
    categories: {
      finanzamt: 'error', //  Tax authorities  -> red accent
      versicherung: 'info', //  Insurance        -> blue accent
      vertraege: 'success', //  Contracts        -> green accent
      energie: 'warning' //  Utilities & rent -> amber accent
    }
  },

  // -- Nuxt UI semantic color aliases (the master switches) -----------------
  ui: {
    colors: {
      primary: 'emerald', // All primary CTAs, active states, focus rings
      secondary: 'teal', // Supporting accents
      neutral: 'zinc', // Backgrounds, cards, borders, muted text
      success: 'green', // Positive states / "up to date"
      info: 'blue', // Informational badges
      warning: 'amber', // Soft warnings / due-soon
      error: 'red' // Destructive actions / overdue / "action required"
    },

    // Component-level defaults so we don't repeat utility classes in templates.
    button: {
      defaultVariants: { size: 'lg' } // larger tap target by default (44px touch standard)
    },
    card: {
      slots: {
        root: 'rounded-2xl ring-1 ring-default'
      }
    }
  }
})
