<template>
  <img :src="src" :width="size" :height="size" alt="Postcove" draggable="false" />
</template>

<script setup lang="ts">
// Postcove mark — picks the light/dark SVG from /public based on the app's
// color mode. The artwork lives in public/logo-light.svg & public/logo-dark.svg
// (single source per theme), not inlined here.
withDefaults(defineProps<{ size?: number }>(), { size: 34 })
const colorMode = useColorMode()
const src = computed(() =>
  colorMode.value === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'
)
</script>
