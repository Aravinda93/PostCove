<template>
  <UModal v-model:open="open" :title="title">
    <template #body>
      <div class="space-y-4">
        <div v-if="allowExisting && options.length" class="space-y-1.5">
          <label class="text-xs font-medium text-muted">{{ $t('manage.chooseExisting') }}</label>
          <USelect
            v-model="selectedKey"
            :items="options"
            :placeholder="$t('manage.selectCategory')"
            size="lg"
            class="w-full"
          />
        </div>

        <div
          v-if="allowExisting && options.length"
          class="flex items-center gap-3 text-xs text-dimmed"
        >
          <span class="h-px flex-1 bg-default" />{{ $t('manage.or') }}<span class="h-px flex-1 bg-default" />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted">{{ $t('manage.createNew') }}</label>
          <UInput
            v-model="newName"
            :placeholder="$t('manage.categoryNamePlaceholder')"
            size="lg"
            autocomplete="off"
            @keydown.enter="canConfirm && confirm()"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">
          {{ $t('manage.cancel') }}
        </UButton>
        <UButton :disabled="!canConfirm" @click="confirm">{{ confirmLabel }}</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
// Reusable modal for choosing/creating a category.
// Used to move/copy a document, or to add a new category from scratch.
import { categoryLabel, slugifyCategory } from '~/utils/categories'

const props = withDefaults(
  defineProps<{
    title: string
    confirmLabel: string
    /** Show the list of existing categories to pick from (false = create-only). */
    allowExisting?: boolean
    /** Hide this category key from the existing list (e.g. the doc's current one). */
    excludeKey?: string
  }>(),
  { allowExisting: true, excludeKey: undefined }
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [payload: { key: string; label?: string }] }>()

const { categories } = useBriefBox()
const { t } = useI18n()

const selectedKey = ref<string>('')
const newName = ref('')

const options = computed(() =>
  categories.value
    .filter((c) => c.key !== props.excludeKey)
    .map((c) => ({ label: categoryLabel(c, t), value: c.key }))
)

// Reset fields each time the modal opens.
watch(open, (isOpen) => {
  if (isOpen) {
    selectedKey.value = ''
    newName.value = ''
  }
})

const canConfirm = computed(() => !!newName.value.trim() || !!selectedKey.value)

function confirm() {
  const name = newName.value.trim()
  if (name) {
    emit('confirm', { key: slugifyCategory(name), label: name })
  } else if (selectedKey.value) {
    emit('confirm', { key: selectedKey.value })
  }
  open.value = false
}
</script>
