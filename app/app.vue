<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppLockScreen v-if="showLock" />
    <AppOnboarding v-if="showOnboarding" />
  </UApp>
</template>

<script setup lang="ts">
// Root application canvas. <UApp> provides Nuxt UI's global context
// (toasts, tooltips, overlays) and is the single wrapper required by Nuxt UI v4.
// SEO/OG/description live in nuxt.config app.head so they're baked into the
// static shell for crawlers & LLMs. Here we only set the client-side title
// template that wraps each page's short title once the SPA hydrates.
// The display name comes from the i18n `app.name` key — the single source for
// the in-app brand name (change it once to rename the whole UI).
const { locale, t } = useI18n()
// Apply the device/OS language on launch (System default), overridable in Settings.
useLanguage()
useHead({
  // Reflect the active language on <html lang> for screen readers / WCAG 3.1.x.
  htmlAttrs: { lang: locale },
  titleTemplate: (chunk) => (chunk ? `${chunk} · ${t('app.name')}` : t('app.name'))
})

// Optional app lock: re-lock when the app is backgrounded; show overlay when locked.
const { enabled, locked, lockNow } = useAppLock()
const showLock = computed(() => enabled.value && locked.value)

// First-run onboarding (don't show it on top of the lock screen).
const { done: onboarded } = useOnboarding()
const showOnboarding = computed(() => !onboarded.value && !showLock.value)

// Keep deadline reminders in sync with the (derived) deadlines — native only.
const { deadlines } = useBriefBox()
const reminders = useReminders()
watch(
  deadlines,
  (list) => void reminders.reschedule(list.map((d) => ({ id: d.id, title: d.title, dueAt: d.dueAt }))),
  { deep: true, immediate: true }
)

onMounted(() => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') lockNow()
  })
})
</script>
