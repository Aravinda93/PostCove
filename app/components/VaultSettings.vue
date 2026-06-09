<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-primary">{{ $t('settings.title') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ $t('settings.subtitle') }}</p>
    </div>

    <!-- Preferences -->
    <UCard :ui="{ body: 'p-4 space-y-5' }">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-muted">
        <UIcon name="i-lucide-sliders-horizontal" class="size-4" />
        {{ $t('settings.preferences') }}
      </h3>

      <!-- Language: System | EN | DE segmented control (System follows the device) -->
      <div class="space-y-2">
        <div>
          <p class="text-sm font-medium">{{ $t('settings.language') }}</p>
          <p class="text-xs text-muted">{{ $t('settings.languageDesc') }}</p>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="opt in langOptions"
            :key="opt.value"
            type="button"
            class="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium transition-colors"
            :class="
              langModel === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-default text-muted hover:bg-elevated'
            "
            :aria-pressed="langModel === opt.value"
            @click="langModel = opt.value"
          >
            <UIcon :name="opt.icon" class="size-4" />
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Theme -->
      <div class="space-y-2">
        <div>
          <p class="text-sm font-medium">{{ $t('settings.theme') }}</p>
          <p class="text-xs text-muted">{{ $t('settings.themeDesc') }}</p>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            type="button"
            class="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium transition-colors"
            :class="
              themeModel === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-default text-muted hover:bg-elevated'
            "
            :aria-pressed="themeModel === opt.value"
            @click="themeModel = opt.value"
          >
            <UIcon :name="opt.icon" class="size-4" />
            {{ opt.label }}
          </button>
        </div>
      </div>
    </UCard>

    <!-- AI provider (BYOK) -->
    <AiKeyCard />

    <!-- App lock -->
    <UCard :ui="{ body: 'p-4 space-y-4' }">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-muted">
        <UIcon name="i-lucide-lock" class="size-4" />
        {{ $t('lock.heading') }}
      </h3>

      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="text-sm font-medium">{{ $t('lock.enable') }}</p>
          <p class="text-xs text-muted">{{ $t('lock.desc') }}</p>
        </div>
        <USwitch v-model="lockSwitch" />
      </div>

      <template v-if="lock.enabled.value">
        <div
          v-if="lock.biometricAvailable.value"
          class="flex items-center justify-between gap-4 border-t border-default pt-4"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium">{{ $t('lock.biometric') }}</p>
            <p class="text-xs text-muted">{{ $t('lock.biometricDesc') }}</p>
          </div>
          <USwitch v-model="bioSwitch" />
        </div>

        <UButton
          icon="i-lucide-key-round"
          color="neutral"
          variant="soft"
          size="sm"
          block
          @click="openChangePin"
        >
          {{ $t('lock.changePin') }}
        </UButton>
      </template>
    </UCard>

    <!-- Deadline reminders -->
    <UCard :ui="{ body: 'p-4 space-y-4' }">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-muted">
        <UIcon name="i-lucide-bell" class="size-4" />
        {{ $t('reminders.heading') }}
      </h3>
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="text-sm font-medium">{{ $t('reminders.enable') }}</p>
          <p class="text-xs text-muted">{{ $t('reminders.desc') }}</p>
        </div>
        <USwitch v-if="reminders.available.value" v-model="reminderSwitch" />
        <span v-else class="shrink-0 text-xs text-dimmed">{{ $t('reminders.unavailable') }}</span>
      </div>
      <div
        v-if="reminders.available.value && reminders.enabled.value"
        class="flex items-center justify-between gap-4 border-t border-default pt-4"
      >
        <p class="text-sm font-medium">{{ $t('reminders.leadTime') }}</p>
        <USelect v-model="leadModel" :items="leadOptions" class="w-40" />
      </div>
    </UCard>

    <!-- Data management -->
    <UCard :ui="{ body: 'p-4 space-y-4' }">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-muted">
        <UIcon name="i-lucide-database" class="size-4" />
        {{ $t('settings.dataManagement') }}
      </h3>

      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium">{{ $t('settings.localStorage') }}</span>
          <span v-if="store.supported.value" class="text-muted">
            {{ formatBytes(store.usedBytes.value) }} / {{ formatBytes(store.quotaBytes.value) }}
          </span>
        </div>
        <UProgress :model-value="store.percent.value" :max="100" />
        <p class="text-right text-xs text-muted">
          {{ $t('settings.used', { percent: store.percent.value }) }}
        </p>
      </div>

      <!-- Danger zone -->
      <div class="rounded-xl border border-error/30 bg-error/5 p-3">
        <p class="flex items-center gap-2 text-sm font-semibold text-error">
          <UIcon name="i-lucide-triangle-alert" class="size-4" />
          {{ $t('settings.dangerZone') }}
        </p>
        <p class="mt-1 text-xs text-muted">{{ $t('settings.dangerDesc') }}</p>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          block
          class="mt-3"
          @click="confirmOpen = true"
        >
          {{ $t('settings.wipe') }}
        </UButton>
      </div>
    </UCard>

    <!-- Backup & restore -->
    <UCard :ui="{ body: 'p-4 space-y-3' }">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-muted">
        <UIcon name="i-lucide-archive" class="size-4" />
        {{ $t('backup.heading') }}
      </h3>
      <p class="text-xs leading-relaxed text-muted">{{ $t('backup.desc') }}</p>
      <input ref="backupFile" type="file" accept=".bbx,application/json" class="hidden" @change="onBackupFilePicked" />
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide-download" color="neutral" variant="soft" size="sm" @click="exportModalOpen = true">
          {{ $t('backup.export') }}
        </UButton>
        <UButton icon="i-lucide-upload" color="neutral" variant="soft" size="sm" @click="backupFile?.click()">
          {{ $t('backup.import') }}
        </UButton>
      </div>
    </UCard>

    <!-- Privacy & data notice -->
    <div class="space-y-3 rounded-2xl bg-elevated/60 p-4">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-shield-check" class="mt-0.5 size-5 shrink-0 text-primary" />
        <div class="space-y-2">
          <p class="text-sm font-semibold">{{ $t('settings.privacyHeading') }}</p>
          <p class="text-xs leading-relaxed text-muted">{{ $t('settings.privacyNotice') }}</p>
          <p class="text-xs leading-relaxed text-muted">{{ $t('settings.privacyAiNotice') }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <NuxtLink
          to="/privacy"
          class="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <UIcon name="i-lucide-file-text" class="size-3.5" />
          {{ $t('settings.viewPolicy') }}
        </NuxtLink>
        <a
          :href="repoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <UIcon name="i-lucide-github" class="size-3.5" />
          {{ $t('settings.sourceCode') }}
        </a>
      </div>
    </div>

    <!-- Legal disclaimer -->
    <div class="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4">
      <UIcon name="i-lucide-scale" class="mt-0.5 size-5 shrink-0 text-warning" />
      <div>
        <p class="text-sm font-semibold">{{ $t('settings.legalHeading') }}</p>
        <p class="mt-1 text-xs leading-relaxed text-muted">{{ $t('settings.disclaimer') }}</p>
      </div>
    </div>

    <!-- About -->
    <p class="text-center text-xs text-dimmed">
      Postcove · {{ $t('about.version', { v: appVersion }) }} · {{ $t('about.license') }}
    </p>

    <!-- Export backup modal -->
    <UModal v-model:open="exportModalOpen" :title="$t('backup.exportTitle')">
      <template #body>
        <div class="space-y-2">
          <label class="text-xs font-medium text-muted">{{ $t('backup.passphrase') }}</label>
          <UInput
            v-model="passphrase"
            type="password"
            :placeholder="$t('backup.passphrasePlaceholder')"
            size="lg"
            autocomplete="new-password"
          />
          <p v-if="passphrase && passphrase.length < 8" class="text-xs text-error">{{ $t('backup.minLen') }}</p>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="exportModalOpen = false">{{ $t('lock.cancel') }}</UButton>
          <UButton icon="i-lucide-download" :disabled="passphrase.length < 8" :loading="busy" @click="doExport">
            {{ $t('backup.export') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Import backup modal -->
    <UModal v-model:open="importModalOpen" :title="$t('backup.importTitle')">
      <template #body>
        <div class="space-y-2">
          <label class="text-xs font-medium text-muted">{{ $t('backup.passphrase') }}</label>
          <UInput
            v-model="importPassphrase"
            type="password"
            :placeholder="$t('backup.passphrasePlaceholder')"
            size="lg"
            autocomplete="off"
            @keydown.enter="doImport"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="importModalOpen = false">{{ $t('lock.cancel') }}</UButton>
          <UButton icon="i-lucide-upload" :disabled="!importPassphrase" :loading="busy" @click="doImport">
            {{ $t('backup.import') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Set / change PIN modal -->
    <UModal
      v-model:open="pinModalOpen"
      :title="pinMode === 'change' ? $t('lock.changePinTitle') : $t('lock.setPinTitle')"
    >
      <template #body>
        <div class="flex flex-col items-center gap-4 py-2">
          <div v-if="pinMode === 'change'" class="flex flex-col items-center gap-1.5">
            <label class="text-xs font-medium text-muted">{{ $t('lock.currentPin') }}</label>
            <UPinInput v-model="curPin" :length="4" type="number" mask otp />
          </div>
          <div class="flex flex-col items-center gap-1.5">
            <label class="text-xs font-medium text-muted">{{ $t('lock.newPin') }}</label>
            <UPinInput v-model="newPin" :length="4" type="number" mask otp />
          </div>
          <div class="flex flex-col items-center gap-1.5">
            <label class="text-xs font-medium text-muted">{{ $t('lock.confirmPin') }}</label>
            <UPinInput v-model="confirmPin" :length="4" type="number" mask otp />
          </div>
          <p v-if="pinError" class="text-sm text-error">{{ pinError }}</p>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="pinModalOpen = false">
            {{ $t('lock.cancel') }}
          </UButton>
          <UButton
            icon="i-lucide-lock"
            :disabled="newPin.join('').length !== 4 || confirmPin.join('').length !== 4"
            @click="submitPin"
          >
            {{ $t('lock.save') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Confirmation modal -->
    <UModal v-model:open="confirmOpen" :title="$t('settings.wipeConfirmTitle')">
      <template #body>
        <p class="text-sm text-toned">{{ $t('settings.wipeConfirmBody') }}</p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="confirmOpen = false">
            {{ $t('settings.cancel') }}
          </UButton>
          <UButton color="error" icon="i-lucide-trash-2" @click="doWipe">
            {{ $t('settings.confirmWipe') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// View 4 — Vault Settings.
// Local preferences: language, theme, storage meter, destructive wipe, privacy notice.
const { wipeAll } = useBriefBox()
const store = useStorageEstimate()
// re-measure after a wipe
async function refreshStorage() {
  await store.refresh()
}
const { t } = useI18n()
const colorMode = useColorMode()
const toast = useToast()

// Language: System / EN / DE (System follows the device language, like the theme).
const { pref: langPref, setPref: setLangPref } = useLanguage()
const langOptions = computed(() => [
  { label: t('settings.langSystem'), value: 'system' as const, icon: 'i-lucide-monitor' },
  { label: 'EN', value: 'en' as const, icon: 'i-lucide-languages' },
  { label: 'DE', value: 'de' as const, icon: 'i-lucide-languages' }
])
const langModel = computed({
  get: () => langPref.value,
  set: (v: 'system' | 'en' | 'de') => setLangPref(v)
})

// Theme as a 3-way segmented control bound to colorMode.preference.
const themeOptions = computed(() => [
  { label: t('settings.themeSystem'), value: 'system', icon: 'i-lucide-monitor' },
  { label: t('settings.themeLight'), value: 'light', icon: 'i-lucide-sun' },
  { label: t('settings.themeDark'), value: 'dark', icon: 'i-lucide-moon' }
])
const themeModel = computed({
  get: () => colorMode.preference,
  set: (v: string) => (colorMode.preference = v)
})

// Link to the open-source repository (configurable via NUXT_PUBLIC_REPO_URL).
const repoUrl = useRuntimeConfig().public.repoUrl as string
const appVersion = useRuntimeConfig().public.version as string

// ---- Deadline reminders (native local notifications) ----------------------
const { deadlines } = useBriefBox()
const reminders = useReminders()
const reminderSwitch = computed({
  get: () => reminders.enabled.value,
  set: (v: boolean) => void toggleReminders(v)
})
async function toggleReminders(v: boolean) {
  if (v) {
    const ok = await reminders.enable()
    if (ok) {
      await reminders.reschedule(deadlines.value.map((d) => ({ id: d.id, title: d.title, dueAt: d.dueAt })))
    } else {
      toast.add({ title: t('reminders.enableFailed'), icon: 'i-lucide-circle-x', color: 'error' })
    }
  } else {
    await reminders.disable()
  }
}
const leadOptions = [
  { label: t('reminders.days', { n: 1 }), value: 1 },
  { label: t('reminders.days', { n: 3 }), value: 3 },
  { label: t('reminders.days', { n: 7 }), value: 7 },
  { label: t('reminders.days', { n: 14 }), value: 14 }
]
const leadModel = computed({
  get: () => reminders.leadDays.value,
  set: async (v: number) => {
    await reminders.setLeadDays(v)
    await reminders.reschedule(deadlines.value.map((d) => ({ id: d.id, title: d.title, dueAt: d.dueAt })))
  }
})

// ---- Backup & restore -----------------------------------------------------
const { exportBackup, importBackup } = useVaultBackup()
const backupFile = ref<HTMLInputElement | null>(null)
const exportModalOpen = ref(false)
const importModalOpen = ref(false)
const passphrase = ref('')
const importPassphrase = ref('')
const pendingFile = ref<File | null>(null)
const busy = ref(false)

async function doExport() {
  if (passphrase.value.length < 8) return
  busy.value = true
  try {
    await exportBackup(passphrase.value)
    exportModalOpen.value = false
    passphrase.value = ''
    toast.add({ title: t('backup.exported'), icon: 'i-lucide-download', color: 'success' })
  } finally {
    busy.value = false
  }
}
function onBackupFilePicked(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (backupFile.value) backupFile.value.value = ''
  if (!f) return
  pendingFile.value = f
  importPassphrase.value = ''
  importModalOpen.value = true
}
async function doImport() {
  if (!pendingFile.value || !importPassphrase.value) return
  busy.value = true
  try {
    await importBackup(pendingFile.value, importPassphrase.value)
    importModalOpen.value = false
    setTimeout(refreshStorage, 500)
    toast.add({ title: t('backup.imported'), icon: 'i-lucide-check-circle-2', color: 'success' })
  } catch (err) {
    toast.add({
      title: t('backup.importFailed', { reason: (err as Error).message }),
      icon: 'i-lucide-circle-x',
      color: 'error'
    })
  } finally {
    busy.value = false
    pendingFile.value = null
  }
}

// Wipe confirmation modal.
const confirmOpen = ref(false)
function doWipe() {
  wipeAll()
  confirmOpen.value = false
  setTimeout(refreshStorage, 500) // re-measure after the async clear settles
  toast.add({
    title: t('settings.wiped'),
    icon: 'i-lucide-trash-2',
    color: 'success'
  })
}

// ---- App lock -------------------------------------------------------------
const lock = useAppLock()
const pinModalOpen = ref(false)
const pinMode = ref<'set' | 'change'>('set')
const curPin = ref<number[]>([])
const newPin = ref<number[]>([])
const confirmPin = ref<number[]>([])
const pinError = ref('')

function openSetPin() {
  pinMode.value = 'set'
  curPin.value = []
  newPin.value = []
  confirmPin.value = []
  pinError.value = ''
  pinModalOpen.value = true
}
function openChangePin() {
  pinMode.value = 'change'
  curPin.value = []
  newPin.value = []
  confirmPin.value = []
  pinError.value = ''
  pinModalOpen.value = true
}

// The enable/disable switch.
const lockSwitch = computed({
  get: () => lock.enabled.value,
  set: (v: boolean) => {
    if (v) openSetPin()
    else void disableLock()
  }
})
async function disableLock() {
  await lock.disable()
  toast.add({ title: t('lock.disabledToast'), icon: 'i-lucide-lock-open', color: 'warning' })
}

async function submitPin() {
  const np = newPin.value.join('')
  if (np.length !== 4) return
  if (np !== confirmPin.value.join('')) {
    pinError.value = t('lock.pinMismatch')
    return
  }
  if (pinMode.value === 'change') {
    const ok = await lock.changePin(curPin.value.join(''), np)
    if (!ok) {
      pinError.value = t('lock.wrongCurrentPin')
      return
    }
    toast.add({ title: t('lock.changedToast'), icon: 'i-lucide-lock', color: 'success' })
  } else {
    await lock.enable(np)
    toast.add({ title: t('lock.enabledToast'), icon: 'i-lucide-lock', color: 'success' })
  }
  pinModalOpen.value = false
}

// Biometric toggle.
const bioSwitch = computed({
  get: () => lock.biometricEnabled.value,
  set: (v: boolean) => void toggleBiometric(v)
})
async function toggleBiometric(v: boolean) {
  if (v) {
    const ok = await lock.enableBiometric()
    if (!ok) toast.add({ title: t('lock.biometricFailed'), icon: 'i-lucide-circle-x', color: 'error' })
  } else {
    await lock.disableBiometric()
  }
}
</script>
