<template>
  <div class="space-y-5">
    <NuxtLink to="/vault" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-default">
      <UIcon name="i-lucide-arrow-left" class="size-4" />
      {{ $t('nav.vault') }}
    </NuxtLink>

    <div v-if="!doc" class="rounded-2xl border border-dashed border-default px-4 py-10 text-center text-sm text-muted">
      {{ $t('vault.notFound') }}
    </div>

    <template v-else>
      <!-- Original scan preview -->
      <div v-if="doc.file" class="overflow-hidden rounded-2xl ring-1 ring-default">
        <img
          v-if="!(doc.mime || '').includes('pdf')"
          :src="doc.file"
          :alt="doc.title"
          class="max-h-80 w-full bg-elevated object-contain"
        />
        <iframe v-else :src="doc.file" class="h-80 w-full" :title="doc.title" />
      </div>

      <!-- Editable fields -->
      <div class="space-y-4">
        <UFormField :label="$t('vault.fieldTitle')">
          <UInput v-model="form.title" size="lg" class="w-full" />
        </UFormField>

        <UFormField :label="$t('vault.issuer')">
          <UInput v-model="form.issuer" size="lg" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField :label="$t('vault.category')">
            <USelect v-model="form.category" :items="catItems" size="lg" class="w-full" />
          </UFormField>
          <UFormField :label="$t('vault.deadline')">
            <UInput v-model="form.dueAt" type="date" size="lg" class="w-full" />
          </UFormField>
        </div>

        <UFormField :label="$t('vault.summary')">
          <UTextarea v-model="form.summary" :rows="3" autoresize class="w-full" />
        </UFormField>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap items-center gap-2">
        <UButton icon="i-lucide-save" :disabled="!dirty" @click="save">{{ $t('vault.save') }}</UButton>
        <UButton
          v-if="doc.file"
          icon="i-lucide-file-down"
          color="neutral"
          variant="soft"
          @click="exportDoc"
        >
          {{ $t('vault.export') }}
        </UButton>
        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" class="ms-auto" @click="onDelete">
          {{ $t('manage.delete') }}
        </UButton>
      </div>

      <p class="text-xs text-muted">{{ $t('vault.filed', { when: formatDate(doc.filedAt, locale) }) }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
// Document detail + edit screen. All edits are local (and re-encrypted at rest);
// nothing is sent anywhere.
import { categoryLabel } from '~/utils/categories'
import { formatDate } from '~/utils/dates'

const route = useRoute()
const id = route.params.id as string
const { getDocument, categories, updateDocument, deleteDocument } = useBriefBox()
const { t, locale } = useI18n()
const toast = useToast()

useHead({ title: () => t('nav.vault') })

const doc = computed(() => getDocument(id))
const catItems = computed(() => categories.value.map((c) => ({ label: categoryLabel(c, t), value: c.key })))

const form = reactive({ title: '', issuer: '', summary: '', category: '', dueAt: '' })
watch(
  doc,
  (d) => {
    if (d)
      Object.assign(form, {
        title: d.title,
        issuer: d.issuer,
        summary: d.summary,
        category: d.category,
        dueAt: d.dueAt ? d.dueAt.slice(0, 10) : ''
      })
  },
  { immediate: true }
)

const dirty = computed(() => {
  const d = doc.value
  if (!d) return false
  return (
    form.title !== d.title ||
    form.issuer !== d.issuer ||
    form.summary !== d.summary ||
    form.category !== d.category ||
    form.dueAt !== (d.dueAt ? d.dueAt.slice(0, 10) : '')
  )
})

function save() {
  updateDocument(id, {
    title: form.title.trim(),
    issuer: form.issuer.trim(),
    summary: form.summary.trim(),
    category: form.category,
    dueAt: form.dueAt
  })
  toast.add({ title: t('vault.saved'), icon: 'i-lucide-check-circle-2', color: 'success' })
}

function exportDoc() {
  const d = doc.value
  if (!d?.file) return
  const ext = (d.mime || 'image/jpeg').includes('pdf') ? 'pdf' : 'jpg'
  const a = document.createElement('a')
  a.href = d.file
  a.download = `${d.title.replace(/[^a-z0-9]+/gi, '-')}.${ext}`
  a.click()
}

function onDelete() {
  deleteDocument(id)
  toast.add({ title: t('manage.deleted'), icon: 'i-lucide-trash-2', color: 'warning' })
  navigateTo('/vault')
}
</script>
