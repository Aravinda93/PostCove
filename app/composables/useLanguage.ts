// ============================================================================
//  useLanguage — language preference that mirrors the theme's System/Light/Dark.
// ============================================================================
//  Preference is 'system' | 'en' | 'de'. Default is 'system', which resolves to
//  the device/OS language (German if the phone is German, else English) and
//  re-resolves on every launch. The user can override to EN or DE in Settings.
//  Stored locally (localStorage) — sync read on launch avoids a flash.
// ============================================================================

export type LangPref = 'system' | 'en' | 'de'
const PREF_KEY = 'postcove-lang-pref'

const pref = ref<LangPref>('system')
let initialized = false

/** The device/OS language, mapped to a supported locale. */
function deviceLocale(): 'en' | 'de' {
  if (!import.meta.client) return 'en'
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
  return langs.some((l) => l?.toLowerCase().startsWith('de')) ? 'de' : 'en'
}

export function useLanguage() {
  const { setLocale, locale } = useI18n()

  const resolved = computed<'en' | 'de'>(() =>
    pref.value === 'system' ? deviceLocale() : pref.value
  )

  function apply() {
    if (locale.value !== resolved.value) void setLocale(resolved.value)
  }

  // First call on the client: load the stored preference and apply it.
  if (import.meta.client && !initialized) {
    const stored = localStorage.getItem(PREF_KEY) as LangPref | null
    pref.value = stored ?? 'system'
    initialized = true
    apply()
  }

  function setPref(p: LangPref) {
    pref.value = p
    if (import.meta.client) localStorage.setItem(PREF_KEY, p)
    apply()
  }

  return { pref: readonly(pref), resolved, setPref }
}
