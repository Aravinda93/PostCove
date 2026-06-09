<template>
  <header
    class="safe-top sticky top-0 z-30 border-b border-default bg-default/80 backdrop-blur-md"
  >
    <div class="mx-auto flex w-full max-w-md items-center gap-2.5 px-4 py-3">
      <AppLogo :size="34" />
      <div class="flex flex-col leading-tight">
        <span class="text-base font-semibold tracking-tight">{{ $t('app.name') }}</span>
        <span class="text-[11px] text-muted">{{ $t('app.tagline') }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// Top utility bar — brand-only.
// Language (EN/DE) and theme controls live exclusively in Settings.
</script>
