<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-primary">{{ $t('vault.title') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ $t('vault.subtitle') }}</p>
    </div>

    <UInput v-model="query" icon="i-lucide-search" size="lg" :placeholder="$t('vault.search')" class="w-full" />

    <!-- Category filter chips -->
    <div v-if="categories.length" class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button
        type="button"
        class="min-h-9 shrink-0 rounded-full px-3 text-xs font-medium transition-colors"
        :class="activeFilter === '' ? 'bg-primary text-inverted' : 'bg-elevated text-muted hover:text-default'"
        @click="activeFilter = ''"
      >
        {{ $t('manage.filterAll') }}
      </button>
      <button
        v-for="cat in categories"
        :key="cat.key"
        type="button"
        class="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors"
        :class="activeFilter === cat.key ? 'bg-primary text-inverted' : 'bg-elevated text-muted hover:text-default'"
        @click="activeFilter = cat.key"
      >
        <UIcon :name="cat.icon" class="size-3.5" />
        {{ categoryLabel(cat, t) }}
      </button>
    </div>

    <p
      v-if="!results.length"
      class="rounded-2xl border border-dashed border-default px-4 py-10 text-center text-sm text-muted"
    >
      {{ $t('vault.empty') }}
    </p>

    <div v-else class="space-y-3">
      <UCard v-for="doc in results" :key="doc.id" :ui="{ body: 'p-4 space-y-3' }">
        <div class="flex items-start gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="catIconChip[docColor(doc.category)]">
            <UIcon :name="docIcon(doc.category)" class="size-5" />
          </div>
          <NuxtLink :to="`/vault/${doc.id}`" class="min-w-0 flex-1">
            <p class="truncate font-semibold leading-tight hover:text-primary">{{ doc.title }}</p>
            <p class="mt-0.5 truncate text-xs text-muted">{{ $t('vault.issuer') }}: {{ doc.issuer }}</p>
          </NuxtLink>
          <UBadge :color="docColor(doc.category)" variant="soft" size="sm">{{ docCatLabel(doc.category) }}</UBadge>
          <UDropdownMenu :items="docMenu(doc)" :content="{ align: 'end' }">
            <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" size="xs" :aria-label="doc.title" />
          </UDropdownMenu>
        </div>

        <p class="text-sm text-toned">{{ doc.summary }}</p>

        <div class="flex items-center justify-between border-t border-default pt-3">
          <span class="text-xs text-muted">
            {{ $t('vault.filed', { when: formatDate(doc.filedAt, locale) }) }} · {{ doc.sizeMb }} MB
          </span>
          <div class="flex gap-2">
            <UButton :to="`/vault/${doc.id}`" icon="i-lucide-eye" color="neutral" variant="ghost" size="sm">
              {{ $t('vault.open') }}
            </UButton>
            <UButton icon="i-lucide-file-down" color="neutral" variant="soft" size="sm" @click="exportDoc(doc)">
              {{ $t('vault.export') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Move / Copy modal -->
    <CategoryPickerModal
      v-model:open="pickerOpen"
      :title="pickerMode === 'move' ? $t('manage.moveTitle') : $t('manage.copyTitle')"
      :confirm-label="pickerMode === 'move' ? $t('manage.move') : $t('manage.copy')"
      :exclude-key="pickerMode === 'move' ? activeDoc?.category : undefined"
      @confirm="onPickerConfirm"
    />
  </div>
</template>

<script setup lang="ts">
// View 3 — Document Vault.
// Searchable, filterable catalog with per-document management: move/copy between
// categories (incl. creating new ones inline) and delete with undo.
import { categoryLabel, type SemanticColor } from '~/utils/categories'
import { catIconChip } from '~/utils/categoryStyles'
import { formatDate } from '~/utils/dates'
import type { BriefDocument } from '~/composables/useBriefBox'

const { search, categories, getCategory, moveDocument, copyDocument, deleteDocument, restoreDocument } =
  useBriefBox()
const { locale, t } = useI18n()
const toast = useToast()

const query = ref('')
const activeFilter = ref<string>('') // '' = all categories

const results = computed(() => {
  const list = search(query.value)
  return activeFilter.value ? list.filter((d) => d.category === activeFilter.value) : list
})

// Per-document category resolution for label/color/icon.
const docColor = (key: string): SemanticColor => getCategory(key)?.color ?? 'primary'
const docIcon = (key: string) => getCategory(key)?.icon ?? 'i-lucide-folder'
const docCatLabel = (key: string) => {
  const c = getCategory(key)
  return c ? categoryLabel(c, t) : key
}

// ---- Move / Copy modal ----------------------------------------------------
const pickerOpen = ref(false)
const pickerMode = ref<'move' | 'copy'>('move')
const activeDoc = ref<BriefDocument | null>(null)

function openMove(doc: BriefDocument) {
  activeDoc.value = doc
  pickerMode.value = 'move'
  pickerOpen.value = true
}
function openCopy(doc: BriefDocument) {
  activeDoc.value = doc
  pickerMode.value = 'copy'
  pickerOpen.value = true
}
function onPickerConfirm(payload: { key: string; label?: string }) {
  const doc = activeDoc.value
  if (!doc) return
  if (pickerMode.value === 'move') {
    moveDocument(doc.id, payload.key, payload.label)
    toast.add({ title: t('manage.moved', { name: payload.label ?? docCatLabel(payload.key) }), icon: 'i-lucide-folder-input', color: 'success' })
  } else {
    copyDocument(doc.id, payload.key, payload.label)
    toast.add({ title: t('manage.copied', { name: payload.label ?? docCatLabel(payload.key) }), icon: 'i-lucide-copy', color: 'success' })
  }
}

// ---- Delete with undo -----------------------------------------------------
function onDelete(doc: BriefDocument) {
  const removed = deleteDocument(doc.id)
  if (!removed) return
  toast.add({
    title: t('manage.deleted'),
    icon: 'i-lucide-trash-2',
    color: 'warning',
    actions: [
      {
        label: t('manage.undo'),
        color: 'neutral',
        variant: 'outline',
        onClick: () => {
          restoreDocument(removed)
          toast.add({ title: t('manage.restored'), icon: 'i-lucide-undo-2', color: 'success' })
        }
      }
    ]
  })
}

function docMenu(doc: BriefDocument) {
  return [
    [
      { label: t('vault.open'), icon: 'i-lucide-eye', onSelect: () => navigateTo(`/vault/${doc.id}`) },
      { label: t('manage.move'), icon: 'i-lucide-folder-input', onSelect: () => openMove(doc) },
      { label: t('manage.copy'), icon: 'i-lucide-copy', onSelect: () => openCopy(doc) }
    ],
    [{ label: t('manage.delete'), icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => onDelete(doc) }]
  ]
}

function exportDoc(doc: BriefDocument) {
  if (!doc.file) {
    toast.add({ title: t('vault.noFile'), icon: 'i-lucide-circle-x', color: 'warning' })
    return
  }
  const ext = (doc.mime || 'image/jpeg').includes('pdf') ? 'pdf' : 'jpg'
  const a = document.createElement('a')
  a.href = doc.file
  a.download = `${doc.title.replace(/[^a-z0-9]+/gi, '-')}.${ext}`
  a.click()
  toast.add({ title: t('vault.exported'), icon: 'i-lucide-file-down', color: 'success' })
}
</script>
