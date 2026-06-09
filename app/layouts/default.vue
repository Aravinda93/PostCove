<template>
  <div class="min-h-dvh bg-muted text-default">
    <AppHeader />

    <main class="mx-auto w-full max-w-md px-4 pb-28 pt-4">
      <slot />
    </main>

    <AppBottomNav />
  </div>
</template>

<script setup lang="ts">
// Mobile-first app frame: sticky header, scrollable content column capped at a
// comfortable phone width, and a fixed bottom tab bar. Bottom padding leaves
// room so content never hides behind the nav bar.
</script>
