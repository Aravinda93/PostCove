<template>
  <div class="safe-top safe-bottom fixed inset-0 z-40 overflow-y-auto bg-default">
    <div class="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div class="flex flex-col items-center gap-3 text-center">
        <AppLogo :size="64" />
        <h1 class="text-2xl font-bold tracking-tight">{{ $t('onboarding.title', { app: $t('app.name') }) }}</h1>
        <p class="text-sm text-muted">{{ $t('onboarding.subtitle') }}</p>
      </div>

      <div class="space-y-3">
        <div v-for="(p, i) in points" :key="i" class="flex items-start gap-3 rounded-2xl bg-elevated/60 p-3">
          <UIcon :name="p.icon" class="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p class="text-sm font-semibold">{{ p.title }}</p>
            <p class="mt-0.5 text-xs leading-relaxed text-muted">{{ p.body }}</p>
          </div>
        </div>
      </div>

      <p class="rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs leading-relaxed text-muted">
        {{ $t('settings.disclaimer') }}
      </p>

      <div class="flex flex-col gap-2">
        <UButton size="lg" block icon="i-lucide-key-round" @click="finishTo('/settings')">
          {{ $t('onboarding.addKey') }}
        </UButton>
        <UButton size="lg" block color="neutral" variant="ghost" @click="finishTo('/')">
          {{ $t('onboarding.skip') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// First-run overlay: explains privacy + BYOK + how to get a free key, shows the
// legal disclaimer, then routes the user to add a key (or skip).
const { complete } = useOnboarding()
const { t } = useI18n()

const points = computed(() => [
  { icon: 'i-lucide-shield-check', title: t('onboarding.p1Title'), body: t('onboarding.p1Body') },
  { icon: 'i-lucide-lock', title: t('onboarding.p2Title'), body: t('onboarding.p2Body') },
  { icon: 'i-lucide-sparkles', title: t('onboarding.p3Title'), body: t('onboarding.p3Body') }
])

async function finishTo(path: string) {
  await complete()
  navigateTo(path)
}
</script>
