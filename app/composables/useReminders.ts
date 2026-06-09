// ============================================================================
//  useReminders — local deadline reminders via Capacitor LocalNotifications.
// ============================================================================
//  100% on-device: notifications are scheduled by the OS from the user's own
//  deadlines. Nothing is sent to any server. Native only (iOS/Android); on the
//  web it degrades gracefully (no scheduling) since browsers can't reliably fire
//  scheduled local notifications in the background.
// ============================================================================

import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const K_ENABLED = 'postcove.reminders.enabled'
const K_LEAD = 'postcove.reminders.leadDays'

const enabled = ref(false)
const leadDays = ref(3)
const available = ref(false)
let loaded = false

async function load() {
  if (loaded || !import.meta.client) return
  available.value = Capacitor.isNativePlatform()
  const [en, lead] = await Promise.all([
    Preferences.get({ key: K_ENABLED }),
    Preferences.get({ key: K_LEAD })
  ])
  enabled.value = en.value === '1'
  leadDays.value = lead.value ? Number(lead.value) : 3
  loaded = true
}

// Stable small int id from a string (notification ids must be 32-bit ints).
function hashId(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h) % 2_000_000_000
}

export function useReminders() {
  load()

  async function plugin() {
    // Dynamic import so the web build never hard-depends on the native module.
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    return LocalNotifications
  }

  /** (Re)schedule a notification `leadDays` before each deadline. */
  async function reschedule(deadlines: { id: string; title: string; dueAt: string }[]) {
    if (!available.value || !enabled.value) return
    const LN = await plugin()
    // Clear our previously scheduled ones, then re-add future ones.
    const pending = await LN.getPending()
    if (pending.notifications.length) {
      await LN.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
    }
    const now = Date.now()
    const toSchedule = deadlines
      .map((d) => {
        const at = new Date(d.dueAt)
        at.setDate(at.getDate() - leadDays.value)
        at.setHours(9, 0, 0, 0)
        return { d, at }
      })
      .filter(({ at }) => at.getTime() > now)
      .map(({ d, at }) => ({
        id: hashId(d.id),
        title: 'Postcove',
        body: `${d.title} — due ${d.dueAt}`,
        schedule: { at }
      }))
    if (toSchedule.length) await LN.schedule({ notifications: toSchedule })
  }

  /** Turn reminders on (asks OS permission). Returns success. */
  async function enable(): Promise<boolean> {
    if (!available.value) return false
    const LN = await plugin()
    const perm = await LN.requestPermissions()
    if (perm.display !== 'granted') return false
    enabled.value = true
    await Preferences.set({ key: K_ENABLED, value: '1' })
    return true
  }

  async function disable() {
    enabled.value = false
    await Preferences.set({ key: K_ENABLED, value: '0' })
    if (available.value) {
      const LN = await plugin()
      const pending = await LN.getPending()
      if (pending.notifications.length) {
        await LN.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
      }
    }
  }

  async function setLeadDays(days: number) {
    leadDays.value = days
    await Preferences.set({ key: K_LEAD, value: String(days) })
  }

  return {
    enabled: readonly(enabled),
    leadDays: readonly(leadDays),
    available: readonly(available),
    enable,
    disable,
    setLeadDays,
    reschedule
  }
}
