// ============================================================================
//  useBriefBox — the local-first, ENCRYPTED data store for Postcove.
// ============================================================================
//  All data lives on-device in IndexedDB, encrypted at rest with AES-256-GCM
//  (see useVaultCrypto). Nothing is ever sent to any server. State is shared
//  app-wide via a module-level ref so every component sees the same vault.
// ============================================================================

import type { Category, CategoryKey } from '~/utils/categories'
import { makeDynamicCategory, slugifyCategory } from '~/utils/categories'
import { idbGet, idbSet, idbClear } from '~/utils/idb'

export interface BriefDocument {
  id: string
  title: string
  issuer: string
  category: CategoryKey
  summary: string
  sizeMb: number
  /** ISO date string of when it was filed locally */
  filedAt: string
  /** Original scanned file as a base64 data URL (encrypted at rest). Optional. */
  file?: string
  /** MIME type of the stored file, e.g. image/jpeg, application/pdf. */
  mime?: string
  /** Full plain-text transcription (encrypted at rest) — powers the assistant. */
  extractedText?: string
  /** Optional deadline (ISO date) extracted from the letter; drives the Timeline. */
  dueAt?: string
}

export interface Deadline {
  id: string
  title: string
  category: CategoryKey
  /** ISO date string of the deadline */
  dueAt: string
  finalNotice?: boolean
}

export interface VaultStorage {
  usedMb: number
  totalMb: number
}

const STORAGE_KEY = 'postcove-vault-v1' // legacy localStorage key (migrated then removed)
const IDB_KEY = 'vault' // encrypted blob key in IndexedDB

// Stable unique id (browser-only SPA, so crypto.randomUUID is always available).
function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

interface VaultState {
  documents: BriefDocument[]
  deadlines: Deadline[]
  categories: Category[]
  storage: VaultStorage
}

// A fresh install is EMPTY: no documents, no categories. Categories are born
// only from scanning + AI classification (or manually by the user).
function defaultState(): VaultState {
  return {
    documents: [],
    deadlines: [],
    categories: [],
    storage: { usedMb: 0, totalMb: 100 }
  }
}

// Module-level singleton so all components share one reactive vault.
const state = ref<VaultState>(defaultState())
let initPromise: Promise<void> | null = null

function normalize(parsed: Partial<VaultState>): VaultState {
  return {
    documents: parsed.documents ?? [],
    deadlines: parsed.deadlines ?? [],
    categories: parsed.categories ?? [],
    storage: parsed.storage ?? { usedMb: 0, totalMb: 100 }
  }
}

// Encrypt the current state and write it to IndexedDB. Fire-and-forget: callers
// mutate reactive state synchronously (UI updates immediately) and persistence
// catches up asynchronously.
function persist() {
  if (!import.meta.client) return
  const snapshot = JSON.parse(JSON.stringify(state.value)) as VaultState
  void (async () => {
    try {
      const enc = await useVaultCrypto().encryptJSON(snapshot)
      await idbSet(IDB_KEY, enc)
    } catch (err) {
      console.error('[postcove] persist failed', err)
    }
  })()
}

// Load + decrypt the vault from IndexedDB. One-time: migrates any legacy
// plaintext localStorage blob into the encrypted store, then removes it.
async function init() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    if (!import.meta.client) return
    try {
      const enc = await idbGet<string>(IDB_KEY)
      if (enc) {
        state.value = normalize(await useVaultCrypto().decryptJSON<Partial<VaultState>>(enc))
        return
      }
      // Migrate a legacy unencrypted localStorage vault, if present.
      const legacy = localStorage.getItem(STORAGE_KEY)
      if (legacy) {
        state.value = normalize(JSON.parse(legacy) as Partial<VaultState>)
        persist() // re-write encrypted
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (err) {
      console.error('[postcove] init failed', err)
    }
  })()
  return initPromise
}

export function useBriefBox() {
  void init()

  // Live tally of documents per category (drives the dashboard cards).
  const countByCategory = (key: CategoryKey) =>
    computed(() => state.value.documents.filter((d) => d.category === key).length)

  const recentDocuments = computed(() =>
    [...state.value.documents].sort((a, b) => b.filedAt.localeCompare(a.filedAt))
  )

  // Deadlines are derived from documents that carry a dueAt — a deadline always
  // belongs to a document, so editing the document edits its deadline.
  const sortedDeadlines = computed<Deadline[]>(() =>
    state.value.documents
      .filter((d) => d.dueAt)
      .map((d) => ({ id: d.id, title: d.title, category: d.category, dueAt: d.dueAt! }))
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  )

  const storagePercent = computed(() =>
    Math.round((state.value.storage.usedMb / state.value.storage.totalMb) * 100)
  )

  function search(term: string) {
    const t = term.trim().toLowerCase()
    if (!t) return recentDocuments.value
    return recentDocuments.value.filter(
      (d) =>
        d.title.toLowerCase().includes(t) ||
        d.issuer.toLowerCase().includes(t) ||
        d.summary.toLowerCase().includes(t)
    )
  }

  const categories = computed(() => state.value.categories)

  function getCategory(key: CategoryKey): Category | undefined {
    return state.value.categories.find((c) => c.key === key)
  }

  /** Return the category for `key`, creating a new one from `label` if absent.
   *  This is what makes scanned mail with an unseen type spawn a fresh category. */
  function ensureCategory(key: CategoryKey, label?: string): Category {
    const existing = getCategory(key)
    if (existing) return existing
    const cat = makeDynamicCategory(label ?? key, state.value.categories.length)
    // Honour the caller's key (already slugified upstream) for stable references.
    cat.key = key
    state.value.categories.push(cat)
    persist()
    return cat
  }

  /** User-created category from a free-form name. Returns the (new or existing) one. */
  function addCustomCategory(label: string): Category {
    return ensureCategory(slugifyCategory(label), label.trim())
  }

  /** Rename a category's display label (dynamic categories only). */
  function renameCategory(key: CategoryKey, newLabel: string) {
    const cat = getCategory(key)
    if (!cat) return
    cat.label = newLabel.trim()
    cat.i18nName = undefined
    persist()
  }

  /** Remove a category. Documents are moved to `reassignTo` if given, else the
   *  category must be empty (UI enforces this). */
  function deleteCategory(key: CategoryKey, reassignTo?: CategoryKey) {
    if (reassignTo) {
      state.value.documents.forEach((d) => {
        if (d.category === key) d.category = reassignTo
      })
    }
    state.value.categories = state.value.categories.filter((c) => c.key !== key)
    state.value.deadlines = state.value.deadlines.filter((d) => d.category !== key)
    persist()
  }

  /** Add a scanned document. If its category doesn't exist yet, create it.
   *  Returns `{ doc, createdCategory }` so the UI can announce a new category. */
  function addDocument(input: Omit<BriefDocument, 'id' | 'filedAt'> & { categoryLabel?: string }) {
    const key = slugifyCategory(input.categoryLabel ?? input.category)
    const hadCategory = !!getCategory(key)
    const category = ensureCategory(key, input.categoryLabel ?? input.category)
    const doc: BriefDocument = {
      id: uid('doc'),
      title: input.title,
      issuer: input.issuer,
      category: category.key,
      summary: input.summary,
      sizeMb: input.sizeMb,
      filedAt: new Date().toISOString().slice(0, 10),
      file: input.file,
      mime: input.mime,
      extractedText: input.extractedText,
      dueAt: input.dueAt
    }
    state.value.documents.unshift(doc)
    state.value.storage.usedMb = Math.min(
      state.value.storage.totalMb,
      state.value.storage.usedMb + input.sizeMb
    )
    persist()
    return { doc, createdCategory: hadCategory ? null : category }
  }

  function getDocument(docId: string): BriefDocument | undefined {
    return state.value.documents.find((d) => d.id === docId)
  }

  /** Edit a document's user-facing fields (used by the detail screen). If the
   *  category changes to a new label, the category is created. */
  function updateDocument(
    docId: string,
    patch: Partial<Pick<BriefDocument, 'title' | 'issuer' | 'summary' | 'dueAt'>> & {
      category?: CategoryKey
      categoryLabel?: string
    }
  ) {
    const doc = state.value.documents.find((d) => d.id === docId)
    if (!doc) return
    if (patch.title !== undefined) doc.title = patch.title
    if (patch.issuer !== undefined) doc.issuer = patch.issuer
    if (patch.summary !== undefined) doc.summary = patch.summary
    if (patch.dueAt !== undefined) doc.dueAt = patch.dueAt || undefined
    if (patch.category) {
      const cat = ensureCategory(slugifyCategory(patch.category), patch.categoryLabel ?? patch.category)
      doc.category = cat.key
    }
    persist()
  }

  /** Move a document to another category. `targetLabel` lets callers create a new
   *  category inline (e.g. "Gesundheit") rather than only pick existing ones. */
  function moveDocument(docId: string, targetKey: CategoryKey, targetLabel?: string) {
    const doc = state.value.documents.find((d) => d.id === docId)
    if (!doc) return
    const cat = ensureCategory(targetKey, targetLabel ?? targetKey)
    doc.category = cat.key
    persist()
  }

  /** Duplicate a document into another category (the original stays put). */
  function copyDocument(docId: string, targetKey: CategoryKey, targetLabel?: string) {
    const doc = state.value.documents.find((d) => d.id === docId)
    if (!doc) return
    const cat = ensureCategory(targetKey, targetLabel ?? targetKey)
    const copy: BriefDocument = { ...doc, id: uid('doc'), category: cat.key }
    state.value.documents.unshift(copy)
    state.value.storage.usedMb = Math.min(
      state.value.storage.totalMb,
      state.value.storage.usedMb + doc.sizeMb
    )
    persist()
  }

  /** Remove a document; returns it so the caller can offer an Undo. */
  function deleteDocument(docId: string): BriefDocument | null {
    const idx = state.value.documents.findIndex((d) => d.id === docId)
    if (idx === -1) return null
    const [removed] = state.value.documents.splice(idx, 1)
    state.value.storage.usedMb = Math.max(0, state.value.storage.usedMb - (removed?.sizeMb ?? 0))
    persist()
    return removed ?? null
  }

  /** Re-insert a previously-deleted document (Undo). */
  function restoreDocument(doc: BriefDocument) {
    ensureCategory(doc.category, doc.category)
    state.value.documents.unshift(doc)
    state.value.storage.usedMb = Math.min(
      state.value.storage.totalMb,
      state.value.storage.usedMb + doc.sizeMb
    )
    persist()
  }

  function addDeadline(input: Omit<Deadline, 'id'>) {
    state.value.deadlines.push({ id: uid('dl'), ...input })
    persist()
  }

  /** Replace the whole vault (used by backup restore). Re-encrypts on persist. */
  function replaceVault(next: Partial<VaultState>) {
    state.value = normalize(next)
    persist()
  }

  /** Snapshot the vault for export (plain object, caller encrypts it). */
  function snapshot(): VaultState {
    return JSON.parse(JSON.stringify(state.value)) as VaultState
  }

  /** Destructive: clears every document, deadline and category, erases the
   *  encrypted store and destroys the encryption key. A fresh key is generated
   *  lazily on the next write. */
  function wipeAll() {
    state.value = defaultState()
    void (async () => {
      try {
        await idbClear()
        await useVaultCrypto().destroyKey()
      } catch (err) {
        console.error('[postcove] wipe failed', err)
      }
    })()
  }

  return {
    documents: computed(() => state.value.documents),
    deadlines: sortedDeadlines,
    categories,
    storage: computed(() => state.value.storage),
    recentDocuments,
    countByCategory,
    storagePercent,
    search,
    getCategory,
    getDocument,
    updateDocument,
    ensureCategory,
    addCustomCategory,
    renameCategory,
    deleteCategory,
    addDocument,
    moveDocument,
    copyDocument,
    deleteDocument,
    restoreDocument,
    addDeadline,
    replaceVault,
    snapshot,
    wipeAll
  }
}
