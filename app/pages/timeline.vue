<template>
  <FristenTimeline />
</template>

<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => t('nav.timeline') })
</script>
