// Real on-device storage usage via the Storage API (navigator.storage.estimate).
// Reports actual bytes used/available for this origin — not a made-up number.
export function useStorageEstimate() {
  const usedBytes = ref(0)
  const quotaBytes = ref(0)
  const supported = ref(false)

  async function refresh() {
    if (!import.meta.client || !navigator.storage?.estimate) return
    supported.value = true
    const est = await navigator.storage.estimate()
    usedBytes.value = est.usage ?? 0
    quotaBytes.value = est.quota ?? 0
  }

  const percent = computed(() =>
    quotaBytes.value ? Math.min(100, Math.round((usedBytes.value / quotaBytes.value) * 100)) : 0
  )

  if (import.meta.client) void refresh()

  return { usedBytes, quotaBytes, percent, supported, refresh }
}

/** Human-readable byte size, e.g. 1536000 → "1.5 MB". */
export function formatBytes(n: number): string {
  if (!n) return '0 MB'
  const mb = n / 1_048_576
  if (mb < 1) return `${Math.max(1, Math.round(n / 1024))} KB`
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}
