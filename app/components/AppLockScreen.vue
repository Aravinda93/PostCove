<template>
  <div class="safe-top safe-bottom fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-default px-6">
    <div class="flex flex-col items-center gap-3 text-center">
      <AppLogo :size="56" />
      <div>
        <h1 class="text-lg font-semibold">{{ $t('lock.title', { app: $t('app.name') }) }}</h1>
        <p class="mt-1 text-sm text-muted">{{ $t('lock.enterPin') }}</p>
      </div>
    </div>

    <UPinInput
      v-model="pin"
      :length="4"
      type="number"
      mask
      size="xl"
      :color="error ? 'error' : 'primary'"
      :disabled="busy"
      otp
      autofocus
    />

    <p v-if="error" class="text-sm text-error">{{ $t('lock.wrongPin') }}</p>

    <UButton
      v-if="biometricEnabled && biometricAvailable"
      icon="i-lucide-fingerprint"
      color="neutral"
      variant="soft"
      :loading="busy"
      @click="tryBiometric"
    >
      {{ $t('lock.useBiometric') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
// Full-screen lock overlay shown while the app is locked. PIN entry + optional
// biometric unlock. Opaque so no content shows behind it.
const { biometricEnabled, biometricAvailable, unlockWithPin, unlockWithBiometric } = useAppLock()
const { t } = useI18n()

const pin = ref<number[]>([])
const error = ref(false)
const busy = ref(false)

async function tryPin() {
  busy.value = true
  const ok = await unlockWithPin(pin.value.join(''))
  busy.value = false
  if (!ok) {
    error.value = true
    pin.value = []
  }
}

watch(pin, (v) => {
  if (v.length < 4) error.value = false
  if (v.length === 4) void tryPin()
})

async function tryBiometric() {
  busy.value = true
  await unlockWithBiometric()
  busy.value = false
}

// Offer biometric automatically on mount when it's set up.
onMounted(() => {
  if (biometricEnabled.value && biometricAvailable.value) void tryBiometric()
})
</script>
