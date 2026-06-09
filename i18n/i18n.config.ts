// Runtime i18n options merged by @nuxtjs/i18n.
// Locale message files themselves live in i18n/locales/*.json.
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  // Don't warn on missing keys in dev console — keeps output clean during build-out.
  missingWarn: false,
  fallbackWarn: false
}))
