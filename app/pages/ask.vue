<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-primary">{{ $t('assistant.title') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ $t('assistant.subtitle') }}</p>
    </div>

    <!-- No key: send to settings -->
    <div
      v-if="!hasKey"
      class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default px-4 py-10 text-center"
    >
      <UIcon name="i-lucide-key-round" class="size-7 text-dimmed" />
      <p class="text-sm font-medium">{{ $t('assistant.needKey') }}</p>
      <UButton to="/settings" icon="i-lucide-settings" size="sm">{{ $t('dashboard.openSettings') }}</UButton>
    </div>

    <!-- Empty vault -->
    <div
      v-else-if="!documents.length"
      class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-default px-4 py-10 text-center"
    >
      <UIcon name="i-lucide-folder-open" class="size-7 text-dimmed" />
      <p class="text-sm font-medium">{{ $t('assistant.emptyVault') }}</p>
    </div>

    <template v-else>
      <!-- Ask box -->
      <div class="flex items-end gap-2">
        <UTextarea
          v-model="question"
          :rows="1"
          autoresize
          :placeholder="$t('assistant.placeholder')"
          class="flex-1"
          :disabled="thinking"
          @keydown.enter.exact.prevent="onAsk"
        />
        <UButton
          icon="i-lucide-arrow-up"
          size="lg"
          :loading="thinking"
          :disabled="!question.trim()"
          square
          :aria-label="$t('assistant.ask')"
          @click="onAsk"
        />
      </div>

      <!-- Example prompts (only before first question) -->
      <div v-if="!turns.length && !thinking" class="space-y-2">
        <p class="text-xs font-medium text-muted">{{ $t('assistant.examplesHeading') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(ex, i) in examples"
            :key="i"
            type="button"
            class="rounded-full bg-elevated px-3 py-1.5 text-xs text-muted transition-colors hover:text-default"
            @click="askExample(ex)"
          >
            {{ ex }}
          </button>
        </div>
      </div>

      <!-- Conversation (newest first) -->
      <div v-if="turns.length" class="space-y-4">
        <div v-for="(turn, i) in turns" :key="i" class="space-y-2">
          <div class="flex justify-end">
            <p class="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-inverted">
              {{ turn.q }}
            </p>
          </div>
          <div class="flex justify-start">
            <div class="max-w-[90%] rounded-2xl rounded-bl-sm bg-elevated px-3 py-2">
              <p v-if="turn.pending" class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
                {{ $t('assistant.thinking') }}
              </p>
              <p
                v-else
                class="whitespace-pre-wrap text-sm leading-relaxed"
                :class="turn.error ? 'text-error' : 'text-toned'"
              >
                {{ turn.a }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- AI caveat -->
      <p class="flex items-start gap-1.5 text-xs text-dimmed">
        <UIcon name="i-lucide-info" class="mt-0.5 size-3.5 shrink-0" />
        {{ $t('assistant.caveat') }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
// Vault assistant — answers questions grounded ONLY in the on-device documents.
// Retrieval is local; only the question + relevant document text is sent to the
// user's own AI provider (same BYOK path as scanning). No backend.
import { categoryLabel } from '~/utils/categories'

const { documents, deadlines, getCategory } = useBriefBox()
const { hasKey } = useApiKey()
const { ask } = useBriefBoxAI()
const { t, locale } = useI18n()

useHead({ title: () => t('nav.ask') })

interface Turn {
  q: string
  a: string
  pending?: boolean
  error?: boolean
}
const question = ref('')
const thinking = ref(false)
const turns = ref<Turn[]>([])

const examples = computed(() => [t('assistant.ex1'), t('assistant.ex2'), t('assistant.ex3')])

const catLabel = (key: string) => {
  const c = getCategory(key)
  return c ? categoryLabel(c, t) : key
}

// Local relevance ranking so large vaults don't overflow the prompt (and so we
// send the provider only the documents that matter — better for privacy & cost).
// Pure keyword/term-overlap scoring; no extra API calls, fully on-device.
const MAX_DOCS = 30
function searchableText(d: (typeof documents)['value'][number]): string {
  return `${d.title} ${d.issuer} ${catLabel(d.category)} ${d.summary} ${d.extractedText ?? ''}`.toLowerCase()
}
function rankDocs(question: string) {
  const docs = documents.value
  if (docs.length <= MAX_DOCS) return docs
  const terms = [...new Set(question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [])]
  if (!terms.length) return [...docs].slice(0, MAX_DOCS)
  return [...docs]
    .map((d) => {
      const hay = searchableText(d)
      return { d, score: terms.reduce((s, term) => (hay.includes(term) ? s + 1 : s), 0) }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_DOCS)
    .map((x) => x.d)
}

// Build the grounding context locally from the (ranked) vault. Stays on device
// until the provider call; capped per-document to keep the prompt reasonable.
function buildContext(question: string): string {
  const docs = rankDocs(question).map((d) => {
    const lines = [
      `## ${d.title}  (category: ${catLabel(d.category)}; filed: ${d.filedAt})`,
      `Issuer: ${d.issuer}`,
      `Summary: ${d.summary}`
    ]
    if (d.extractedText) lines.push(`Content: ${d.extractedText.slice(0, 4000)}`)
    return lines.join('\n')
  })
  const dls = deadlines.value.map((dl) => `- ${dl.title} — due ${dl.dueAt} (${catLabel(dl.category)})`)
  return [docs.join('\n\n'), dls.length ? `## Deadlines\n${dls.join('\n')}` : ''].filter(Boolean).join('\n\n')
}

async function run(q: string) {
  const turn = reactive<Turn>({ q, a: '', pending: true })
  turns.value.unshift(turn)
  thinking.value = true
  try {
    turn.a = await ask(q, buildContext(q), locale.value as 'en' | 'de')
    if (!turn.a) turn.a = t('assistant.noAnswer')
  } catch (err) {
    turn.a = `${t('assistant.errorTitle')}: ${(err as Error).message}`
    turn.error = true
  } finally {
    turn.pending = false
    thinking.value = false
  }
}

function onAsk() {
  const q = question.value.trim()
  if (!q || thinking.value) return
  question.value = ''
  void run(q)
}
function askExample(ex: string) {
  if (thinking.value) return
  void run(ex)
}
</script>
