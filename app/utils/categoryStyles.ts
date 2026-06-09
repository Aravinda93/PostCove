// Static class maps for category accents. Kept as literal strings (not built
// at runtime) so Tailwind reliably generates them; the matching `@source inline`
// safelist in assets/css/main.css is a belt-and-braces guarantee.
import type { SemanticColor } from '~/utils/categories'

export const catBorderLeft: Record<SemanticColor, string> = {
  primary: 'border-l-primary',
  secondary: 'border-l-secondary',
  info: 'border-l-info',
  success: 'border-l-success',
  warning: 'border-l-warning',
  error: 'border-l-error'
}

export const catIconChip: Record<SemanticColor, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error'
}

export const catText: Record<SemanticColor, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error'
}

export const catDot: Record<SemanticColor, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error'
}
