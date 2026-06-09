<template>
  <nav
    class="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-default bg-default/90 backdrop-blur-md"
  >
    <ul class="mx-auto flex w-full max-w-md items-stretch justify-around px-2 pt-1.5">
      <li v-for="tab in tabs" :key="tab.to" class="flex-1">
        <NuxtLink
          :to="tab.to"
          class="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-xs font-medium transition-colors"
          :class="isActive(tab.to) ? 'text-primary' : 'text-muted hover:text-default'"
          :aria-current="isActive(tab.to) ? 'page' : undefined"
        >
          <UIcon :name="tab.icon" class="size-5" />
          <span>{{ $t(tab.i18n) }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
// Fixed bottom tab bar — the primary navigation on mobile.
// Each item is a 44px+ tap target and sits above the home-swipe indicator
// thanks to the `safe-bottom` padding.
const route = useRoute()

interface Tab {
  to: string
  icon: string
  i18n: string
}

const tabs: Tab[] = [
  { to: '/', icon: 'i-lucide-layout-dashboard', i18n: 'nav.dashboard' },
  { to: '/timeline', icon: 'i-lucide-history', i18n: 'nav.timeline' },
  { to: '/vault', icon: 'i-lucide-lock', i18n: 'nav.vault' },
  { to: '/ask', icon: 'i-lucide-sparkles', i18n: 'nav.ask' },
  { to: '/settings', icon: 'i-lucide-settings', i18n: 'nav.settings' }
]

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>
