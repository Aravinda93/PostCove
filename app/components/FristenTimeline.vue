<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-primary">{{ $t('timeline.title') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ $t('timeline.subtitle') }}</p>
    </div>

    <p
      v-if="!deadlines.length"
      class="rounded-2xl border border-dashed border-default px-4 py-10 text-center text-sm text-muted"
    >
      {{ $t('timeline.empty') }}
    </p>

    <!-- Timeline rail -->
    <ol v-else class="relative space-y-4 border-l border-default pl-6">
      <li v-for="dl in deadlines" :key="dl.id" class="relative">
        <!-- Node dot -->
        <span
          class="absolute -left-[1.6rem] top-1.5 flex size-3 items-center justify-center rounded-full ring-4 ring-muted"
          :class="{
            'bg-error': urgency(dl.dueAt, dl.finalNotice).color === 'error',
            'bg-warning': urgency(dl.dueAt, dl.finalNotice).color === 'warning',
            'bg-info': urgency(dl.dueAt, dl.finalNotice).color === 'info'
          }"
        />

        <UCard :ui="{ body: 'p-4' }">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <UIcon :name="categoryIcon(dl.category)" class="size-4 shrink-0 text-muted" />
                <p class="truncate font-semibold">{{ dl.title }}</p>
              </div>
              <p class="mt-1 text-xs text-muted">
                {{ formatDate(dl.dueAt, locale) }}
              </p>
            </div>
            <UBadge
              :color="urgency(dl.dueAt, dl.finalNotice).color"
              variant="soft"
              size="sm"
              class="shrink-0"
            >
              {{ dl.finalNotice ? $t('timeline.finalNotice') : label(dl.dueAt) }}
            </UBadge>
          </div>
        </UCard>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
// View 2 — Fristen (Deadlines) Timeline.
// A vertical chronological feed of actionable obligations extracted from docs.
import { daysUntil, formatDate } from '~/utils/dates'

const { deadlines, getCategory } = useBriefBox()
const { locale, t } = useI18n()

// Icon for a deadline's category, falling back to a generic folder if the
// category was wiped or is otherwise unknown.
const categoryIcon = (key: string) => getCategory(key)?.icon ?? 'i-lucide-folder'

// Map a deadline to a semantic urgency color + human label.
function urgency(dueAt: string, finalNotice?: boolean) {
  const d = daysUntil(dueAt)
  if (finalNotice || d < 0) return { color: 'error' as const }
  if (d <= 14) return { color: 'warning' as const }
  return { color: 'info' as const }
}

function label(dueAt: string): string {
  const d = daysUntil(dueAt)
  if (d < 0) return t('timeline.overdue', { days: Math.abs(d) })
  if (d === 0) return t('timeline.dueToday')
  return t('timeline.dueIn', { days: d })
}
</script>
