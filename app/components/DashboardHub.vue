<template>
  <div class="space-y-6">
    <!-- Hidden capture input drives the scanner CTA -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="onFilePicked"
    />

    <!-- Primary Scanner CTA -->
    <UCard
      :ui="{ body: 'flex flex-col items-center gap-3 text-center py-8' }"
      class="bg-gradient-to-b from-primary/10 to-elevated"
    >
      <div
        class="flex size-16 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20"
      >
        <UIcon
          :name="scanning ? 'i-lucide-loader-circle' : 'i-lucide-scan-line'"
          class="size-8 text-primary"
          :class="{ 'animate-spin': scanning }"
        />
      </div>
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">{{ $t('dashboard.scanTitle') }}</h2>
        <p class="mx-auto max-w-xs text-sm text-muted">{{ $t('dashboard.scanSubtitle') }}</p>
      </div>
      <UButton
        icon="i-lucide-camera"
        size="lg"
        class="mt-1 rounded-full px-6"
        :loading="scanning"
        @click="startScan"
      >
        {{ scanning ? $t('dashboard.scanning') : $t('dashboard.scanCta') }}
      </UButton>
    </UCard>

    <!-- Category status grid — created from scans / added manually -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-muted">
          <UIcon name="i-lucide-folder" class="size-4" />
          {{ $t('dashboard.categories') }}
        </h3>
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="addCatOpen = true"
        >
          {{ $t('manage.addCategory') }}
        </UButton>
      </div>

      <!-- Empty state: nothing scanned yet -->
      <div
        v-if="!categories.length"
        class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-default px-4 py-8 text-center"
      >
        <UIcon name="i-lucide-folder-open" class="size-7 text-dimmed" />
        <p class="text-sm font-medium">{{ $t('dashboard.noCategoriesTitle') }}</p>
        <p class="max-w-xs text-xs text-muted">{{ $t('dashboard.noCategoriesHint') }}</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-3">
        <UCard
          v-for="cat in categories"
          :key="cat.key"
          :ui="{ body: 'p-4' }"
          class="border-l-4"
          :class="catBorderLeft[cat.color]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-xl"
                :class="catIconChip[cat.color]"
              >
                <UIcon :name="cat.icon" class="size-5" />
              </div>
              <div>
                <p class="font-semibold leading-tight">{{ categoryLabel(cat, t) }}</p>
                <p v-if="categoryDesc(cat, t)" class="mt-0.5 text-xs text-muted">
                  {{ categoryDesc(cat, t) }}
                </p>
              </div>
            </div>
            <UBadge :color="cat.color" variant="soft" size="sm">
              {{ $t('dashboard.items', { count: countByCategory(cat.key).value }) }}
            </UBadge>
          </div>
        </UCard>
      </div>
    </section>

    <!-- Recent scans -->
    <section class="space-y-3">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-muted">
        <UIcon name="i-lucide-clock" class="size-4" />
        {{ $t('dashboard.recentScans') }}
      </h3>

      <UCard :ui="{ body: 'p-0 divide-y divide-default' }">
        <NuxtLink
          v-for="doc in recent"
          :key="doc.id"
          to="/vault"
          class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated"
        >
          <UIcon name="i-lucide-file-text" class="size-5 shrink-0 text-muted" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ doc.title }}</p>
            <p class="truncate text-xs text-muted">{{ catLabel(doc.category) }} · {{ doc.sizeMb }} MB</p>
          </div>
          <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed" />
        </NuxtLink>

        <p v-if="!recent.length" class="px-4 py-6 text-center text-sm text-muted">
          {{ $t('vault.empty') }}
        </p>
      </UCard>
    </section>

    <!-- Add-category modal (create only) -->
    <CategoryPickerModal
      v-model:open="addCatOpen"
      :title="$t('manage.addCategoryTitle')"
      :confirm-label="$t('manage.create')"
      :allow-existing="false"
      @confirm="onAddCategory"
    />
  </div>
</template>

<script setup lang="ts">
// View 1 — Dashboard Hub.
// Scanner CTA → AI analysis → filed document. Categories are data-driven and
// start EMPTY: they're created from the AI classification of scanned mail (or
// added manually by the user). No categories ship by default.
import { Capacitor } from '@capacitor/core'
import { categoryLabel, categoryDesc } from '~/utils/categories'
import { catBorderLeft, catIconChip } from '~/utils/categoryStyles'

const {
  recentDocuments,
  countByCategory,
  categories,
  getCategory,
  addDocument,
  addCustomCategory
} = useBriefBox()
const { hasKey } = useApiKey()
const { analyseLetter } = useBriefBoxAI()
const { t } = useI18n()
const toast = useToast()

// Manual "add category" modal (create-only).
const addCatOpen = ref(false)
function onAddCategory(payload: { key: string; label?: string }) {
  const cat = addCustomCategory(payload.label ?? payload.key)
  toast.add({
    title: t('manage.categoryCreated', { name: categoryLabel(cat, t) }),
    icon: 'i-lucide-folder-plus',
    color: 'primary'
  })
}

const fileInput = ref<HTMLInputElement | null>(null)
const scanning = ref(false)

function startScan() {
  // Guard: no BYOK key yet → guide the user to Settings.
  if (!hasKey.value) {
    toast.add({
      title: t('dashboard.needKeyTitle'),
      description: t('dashboard.needKeyBody'),
      icon: 'i-lucide-key-round',
      color: 'warning',
      actions: [{ label: t('dashboard.openSettings'), to: '/settings', color: 'primary' }]
    })
    return
  }
  // Native: use the device camera/gallery. Web: fall back to a file input.
  if (Capacitor.isNativePlatform()) void captureNative()
  else fileInput.value?.click()
}

async function captureNative() {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      quality: 70
    })
    if (photo.dataUrl) await processScan(photo.dataUrl, 'image/jpeg')
  } catch {
    // user cancelled the picker — ignore
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function onFilePicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (fileInput.value) fileInput.value.value = ''
  if (!file) return
  // Images only (phone-camera scans). Reject anything else up front so no
  // unsupported file ever leaves the device.
  if (!file.type.startsWith('image/')) {
    toast.add({
      title: t('dashboard.scanFailed'),
      description: t('dashboard.imageOnly'),
      icon: 'i-lucide-image-off',
      color: 'error'
    })
    return
  }
  await processScan(await readAsDataUrl(file), file.type || 'image/jpeg')
}

// Shared pipeline: scan image → AI → filed (encrypted) document.
async function processScan(dataUrl: string, mime: string) {
  scanning.value = true
  try {
    // Pass current category labels so the model reuses them when they fit.
    const known = categories.value.map((c) => categoryLabel(c, t))
    const result = await analyseLetter(dataUrl, known)
    const sizeMb = Math.max(0.1, Math.round(((dataUrl.length * 0.75) / 1_000_000) * 10) / 10)
    const { createdCategory } = addDocument({
      title: result.title,
      issuer: result.issuer,
      category: result.category,
      categoryLabel: result.category,
      summary: result.summary,
      sizeMb,
      // Store the original scan + full transcription, encrypted at rest.
      file: dataUrl,
      mime,
      extractedText: result.text,
      // Deadline lives on the document (drives the Timeline; editable in detail).
      dueAt: result.dueAt
    })
    if (createdCategory) {
      toast.add({
        title: t('dashboard.newCategory', { name: categoryLabel(createdCategory, t) }),
        icon: 'i-lucide-folder-plus',
        color: 'primary'
      })
    }
    toast.add({
      title: t('dashboard.filed', { title: result.title }),
      icon: 'i-lucide-check-circle-2',
      color: 'success'
    })
  } catch (err) {
    toast.add({
      title: t('dashboard.scanFailed'),
      description: (err as Error).message,
      icon: 'i-lucide-circle-x',
      color: 'error'
    })
  } finally {
    scanning.value = false
  }
}

const recent = computed(() => recentDocuments.value.slice(0, 4))
const catLabel = (key: string) => {
  const c = getCategory(key)
  return c ? categoryLabel(c, t) : key
}
</script>
