// First-run onboarding flag, persisted on-device via Capacitor Preferences.
import { Preferences } from '@capacitor/preferences'

const K_DONE = 'postcove.onboarded'
const done = ref(true) // assume done until we confirm otherwise (avoids flash)
let loaded = false

async function load() {
  if (loaded || !import.meta.client) return
  const v = await Preferences.get({ key: K_DONE })
  done.value = v.value === '1'
  loaded = true
}

export function useOnboarding() {
  load()
  async function complete() {
    done.value = true
    await Preferences.set({ key: K_DONE, value: '1' })
  }
  return { done: readonly(done), complete }
}
