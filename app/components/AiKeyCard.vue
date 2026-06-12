<template>
  <UCard :ui="{ body: 'p-4 space-y-4' }">
    <div class="flex items-start gap-2">
      <UIcon name="i-lucide-sparkles" class="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <h3 class="text-sm font-semibold">{{ $t('settings.ai.heading') }}</h3>
        <p class="mt-1 text-xs leading-relaxed text-muted">{{ $t('settings.ai.intro') }}</p>
      </div>
    </div>

    <!-- Provider -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-muted">{{ $t('settings.ai.provider') }}</label>
      <USelect
        :model-value="selected"
        :items="items"
        :icon="def.icon"
        class="w-full"
        size="lg"
        @update:model-value="onProviderChange"
      />
    </div>

    <!-- Model -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-muted">{{ $t('settings.ai.model') }}</label>
      <USelectMenu
        v-model="chosenModel"
        :items="modelItems"
        :create-item="def.requiresKey ? 'always' : false"
        :search-input="{ placeholder: $t('settings.ai.modelPlaceholder') }"
        class="w-full"
        size="lg"
        @create="onCreateModel"
      />
    </div>

    <!-- API Key (always masked; no reveal) -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-muted">{{ $t('settings.ai.apiKey') }}</label>
      <UInput
        v-model="draftKey"
        type="password"
        :placeholder="$t('settings.ai.apiKeyPlaceholder')"
        size="lg"
        autocomplete="off"
        spellcheck="false"
        :disabled="!def.requiresKey"
      />
      <p v-if="hasKey && apiKey && !draftKey" class="flex items-center gap-1.5 text-xs text-success">
        <UIcon name="i-lucide-shield-check" class="size-3.5" />
        {{ $t('settings.ai.stored', { masked: maskedKey }) }}
      </p>
      <p v-else-if="!def.requiresKey" class="flex items-center gap-1.5 text-xs text-muted">
        <UIcon name="i-lucide-info" class="size-3.5" />
        {{ $t('settings.ai.noKeyNeeded') }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-2">
      <UButton icon="i-lucide-save" size="sm" :disabled="!canSave" @click="onSave">
        {{ $t('settings.ai.save') }}
      </UButton>
      <UButton icon="i-lucide-plug" color="neutral" variant="soft" size="sm" :loading="testing" @click="onTest">
        {{ testing ? $t('settings.ai.testing') : $t('settings.ai.test') }}
      </UButton>
      <UButton v-if="hasKey" icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="onRemove">
        {{ $t('settings.ai.remove') }}
      </UButton>
    </div>

    <!-- Per-provider help -->
    <div v-if="def.keyHelpUrl" class="rounded-xl bg-elevated/60 p-3">
      <p class="flex items-center gap-1.5 text-xs font-semibold">
        <UIcon name="i-lucide-info" class="size-3.5 text-primary" />
        {{ $t('settings.ai.helpHeading') }}
      </p>
      <p class="mt-1 text-xs leading-relaxed text-muted">
        {{ $t('settings.ai.getKeyAt') }}
        <a
          :href="def.keyHelpUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="break-all text-primary underline underline-offset-2"
        >{{ def.keyHelpUrl.replace(/^https?:\/\//, '') }}</a>
      </p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
// Settings card: Provider + Model + API Key (BYOK). Just three controls, like
// Fud AI. The raw key is never revealed — only first/last-few-chars once stored.
import { PROVIDERS, providerById } from '~/utils/aiProviders'

const { provider, apiKey, model, hasKey, maskedKey, save, saveProvider, setModel, clear } =
  useApiKey()
const { validate } = useBriefBoxAI()
const { t } = useI18n()
const toast = useToast()

const selected = ref<string>(provider.value ?? 'gemini')
const chosenModel = ref<string>(model.value || providerById(selected.value).defaultModel)
const draftKey = ref('')
const testing = ref(false)
// Models the user typed themselves (the provider may support more than we list).
const customModels = ref<string[]>([])

// Sync once the stored values hydrate from native storage.
watch(provider, (v) => v && (selected.value = v))
watch(model, (v) => v && (chosenModel.value = v))

const def = computed(() => providerById(selected.value))
const items = computed(() => PROVIDERS.map((p) => ({ label: p.label, value: p.id, icon: p.icon })))
// Suggested models + any custom one + whatever is currently selected, de-duped.
const modelItems = computed(() => {
  const all = new Set<string>(def.value.models)
  for (const m of customModels.value) all.add(m)
  if (chosenModel.value) all.add(chosenModel.value)
  return [...all]
})

// User typed a model that isn't in our suggestions — remember and select it.
function onCreateModel(name: string) {
  const m = name.trim()
  if (!m) return
  if (!customModels.value.includes(m)) customModels.value.push(m)
  chosenModel.value = m
}

async function onProviderChange(id: string) {
  selected.value = id
  const next = providerById(id)
  customModels.value = []
  chosenModel.value = next.defaultModel
  await saveProvider(id)
  await setModel(next.defaultModel)
}

const canSave = computed(() => !def.value.requiresKey || !!draftKey.value.trim() || !!apiKey.value)

async function onSave() {
  const key = draftKey.value.trim() || apiKey.value || ''
  await save(selected.value, key, chosenModel.value.trim() || def.value.defaultModel)
  draftKey.value = ''
  toast.add({ title: t('settings.ai.saved'), icon: 'i-lucide-key-round', color: 'success' })
}

async function onTest() {
  testing.value = true
  try {
    const key = draftKey.value.trim() || apiKey.value || ''
    const result = await validate(selected.value, key)
    toast.add(
      result.ok
        ? { title: t('settings.ai.testOk'), icon: 'i-lucide-circle-check', color: 'success' }
        : {
            title: t('settings.ai.testFail', { reason: result.error ?? '' }),
            icon: 'i-lucide-circle-x',
            color: 'error'
          }
    )
  } finally {
    testing.value = false
  }
}

async function onRemove() {
  await clear()
  selected.value = 'gemini'
  chosenModel.value = providerById('gemini').defaultModel
  toast.add({ title: t('settings.ai.removed'), icon: 'i-lucide-trash-2', color: 'warning' })
}
</script>
