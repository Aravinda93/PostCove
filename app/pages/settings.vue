<template>
  <VaultSettings />
</template>

<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => t('nav.settings') })
</script>
