// ============================================================================
//  useApiKey — Bring-Your-Own-Key (BYOK) credential store.
// ============================================================================
//  Saves the chosen provider id + API key (+ optional custom base URL) to the
//  device's secure native store via @capacitor/preferences. On iOS this maps to
//  the Keychain, on Android to EncryptedSharedPreferences; on the web it falls
//  back to localStorage transparently. The raw key is NEVER rendered back to the
//  UI — only a masked first/last-few-chars preview (see `maskedKey`).
// ============================================================================

import { Preferences } from '@capacitor/preferences'

/** Provider id from the registry in utils/aiProviders.ts (e.g. 'gemini'). */
export type AiProvider = string

const KEY_PROVIDER = 'postcove.ai.provider'
const KEY_APIKEY = 'postcove.ai.apiKey'
const KEY_MODEL = 'postcove.ai.model'

// Module-level reactive state so all components share one source of truth.
const provider = ref<AiProvider | null>(null)
const apiKey = ref<string | null>(null)
const model = ref<string | null>(null)
let loaded = false

async function load() {
  if (loaded || !import.meta.client) return
  const [p, k, m] = await Promise.all([
    Preferences.get({ key: KEY_PROVIDER }),
    Preferences.get({ key: KEY_APIKEY }),
    Preferences.get({ key: KEY_MODEL })
  ])
  provider.value = p.value || null
  apiKey.value = k.value || null
  model.value = m.value || null
  loaded = true
}

export function useApiKey() {
  if (import.meta.client && !loaded) void load()

  const hasKey = computed(() => !!provider.value && (!!apiKey.value || provider.value === 'ollama'))

  // Best-practice masking: reveal only the first 4 and last 4 characters.
  const maskedKey = computed(() => {
    const k = apiKey.value
    if (!k) return ''
    if (k.length <= 8) return '••••••••'
    return `${k.slice(0, 4)}••••••${k.slice(-4)}`
  })

  async function save(newProvider: AiProvider, newKey: string, newModel?: string) {
    await Promise.all([
      Preferences.set({ key: KEY_PROVIDER, value: newProvider }),
      Preferences.set({ key: KEY_APIKEY, value: newKey }),
      Preferences.set({ key: KEY_MODEL, value: newModel ?? '' })
    ])
    provider.value = newProvider
    apiKey.value = newKey
    model.value = newModel ?? null
  }

  /** Persist only the selected provider (no key change) — used when switching. */
  async function saveProvider(newProvider: AiProvider) {
    await Preferences.set({ key: KEY_PROVIDER, value: newProvider })
    provider.value = newProvider
  }

  /** Persist the chosen model independently (used on provider switch + edits). */
  async function setModel(newModel: string) {
    await Preferences.set({ key: KEY_MODEL, value: newModel })
    model.value = newModel
  }

  async function clear() {
    await Promise.all([
      Preferences.remove({ key: KEY_PROVIDER }),
      Preferences.remove({ key: KEY_APIKEY }),
      Preferences.remove({ key: KEY_MODEL })
    ])
    provider.value = null
    apiKey.value = null
    model.value = null
  }

  return {
    provider: readonly(provider),
    apiKey: readonly(apiKey),
    model: readonly(model),
    hasKey,
    maskedKey,
    save,
    saveProvider,
    setModel,
    clear,
    reload: load
  }
}
