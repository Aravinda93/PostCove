# Postcove 📬

A **100% free and open-source, privacy-first** local document filing box for physical posts (insurance, utilities, tax). Runs **entirely on your device** —
no accounts, no login, no cloud, no tracking. GDPR-friendly by design.

> Postcove operates 100% offline. All data exists solely inside this device and is never transmitted to any server.

---

## ✨ Features

- **Dashboard Hub** — one-tap scanner, category status grid, recent scans
- **Fristen Timeline** — chronological deadlines with urgency badges
- **Document Vault** — searchable, locally-stored catalog with summaries & PDF export
- **Settings** — language, theme, BYOK AI key, storage meter, hard "wipe vault" control
- **AI scanning (BYOK)** — bring your own Gemini/OpenAI key; scans go **straight from the device** to your chosen provider, never through any server of ours
- **Dynamic categories** — four defaults, plus new categories created automatically when a scanned letter's type does not match an existing one
- **Bilingual** — English 🇬🇧 + Deutsch 🇩🇪 (switch in Settings)
- **Dark / Light / System** theme, defaults to System (switch in Settings)
- **Mobile-first** with safe-area handling and 44px touch targets
- Packageable to **iOS & Android via Capacitor**

## 🧱 Tech stack (all FOSS, latest versions)

| Concern         | Choice                                           |
|-----------------|--------------------------------------------------|
| Framework       | **Nuxt 4** (SPA, `ssr: false`)                   |
| UI engine       | **Nuxt UI v4** + **Tailwind CSS v4** + Reka UI   |
| Icons           | Lucide (`@iconify-json/lucide`)                  |
| i18n            | `@nuxtjs/i18n` (EN / DE)                         |
| Images          | `@nuxt/image`                                    |
| SEO/meta        | `@nuxtjs/seo`                                    |
| Color mode      | bundled with Nuxt UI (system default)            |
| Secure storage  | `@capacitor/preferences` (native keychain ↔ web) |
| Package manager | **pnpm**                                         |

## 🎨 Changing the brand color (single source of truth)

All colors flow from **one file**: [`app/app.config.ts`](app/app.config.ts). Change a single line and every button, badge, border and focus ring updates app-wide:

```ts
ui: {
  colors: {
    primary: 'emerald', // ← change to 'indigo', 'rose', … to re-brand instantly
    neutral: 'zinc',
    // …
  }
}
```

## 🤖 AI pipeline — Bring Your Own Key (BYOK)

There is **no backend and no bundled API key**. In Settings → _AI Provider_ the user
picks from **13 providers**
and pastes their own key:

> Google Gemini · OpenAI · Anthropic Claude · xAI Grok · OpenRouter · Together AI ·
> Groq · Hugging Face · Fireworks AI · DeepInfra · Mistral · Ollama (local) ·
> Custom (any OpenAI-compatible endpoint).

The registry lives in [`utils/aiProviders.ts`](app/utils/aiProviders.ts); analysis
dispatches by provider _type_ (OpenAI-compatible / Gemini / Anthropic) in
[`useBriefBoxAI.ts`](app/composables/useBriefBoxAI.ts). The key is stored on-device
via `@capacitor/preferences` (iOS Keychain / Android EncryptedSharedPreferences; web
falls back to localStorage) and is **never rendered back** — only a first/last-few-chars
mask is shown ([`useApiKey.ts`](app/composables/useApiKey.ts)). Scanning a letter sends
the image **directly** from the device to the chosen provider.

> Get a free Gemini key at **aistudio.google.com/apikey** (the card links to each
> provider's key page).
>
> **CORS note:** some providers block direct browser calls on the _web_ build; this
> is expected — the shipping target is Capacitor (native WebView, no CORS). Gemini,
> Groq, OpenRouter and Ollama generally work on web for quick testing.

## 🗂️ Dynamic categories (empty by default)

A fresh install has **no categories and no documents**. Categories are created
from the AI classification of scanned mail: `useBriefBox.addDocument()` slugifies
the returned label, reuses a matching category if one exists, or spawns a new one
with an auto-assigned, theme-aware color + icon ([`utils/categories.ts`](app/utils/categories.ts)).

Users get full control over their filing:

- **Add** a category manually (Dashboard → "Add category")
- **Move** a document to another category (or create one inline)
- **Copy** a document into a second category
- **Delete** a document (with an Undo toast)
- **Filter** the Vault by category via chips

## 🚀 Getting started

```bash
pnpm install      # install dependencies
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm generate     # static SPA output (for Capacitor / static hosting)
pnpm typecheck    # full TypeScript check
```

## 📱 Packaging for the app stores (Capacitor)

```bash
pnpm generate
pnpm add -D @capacitor/cli
pnpm dlx cap init "Postcove" com.postcove.ai --web-dir=.output/public
pnpm dlx cap add ios && pnpm dlx cap add android
pnpm dlx cap sync
```

## 📂 Project structure

```
app/
  app.config.ts        # ← SINGLE SOURCE OF TRUTH for all colors/theming
  app.vue              # <UApp> root
  layouts/default.vue  # header + content + bottom nav frame
  components/          # DashboardHub, FristenTimeline, DocumentVault, VaultSettings,
                       #   AiKeyCard, AppHeader, AppBottomNav, AppLogo
  composables/         # useBriefBox (data), useApiKey (BYOK), useBriefBoxAI (provider calls)
  pages/               # /, /timeline, /vault, /settings
  utils/               # categories, categoryStyles, date helpers
i18n/locales/          # en.json, de.json
public/                # favicon.svg
scripts/               # patch-tsconfig.mjs (typecheck workaround, see below)
```

## 📜 License

Licensed under **AGPL-3.0-or-later** — see [LICENSE](LICENSE). 100% free and open source.
