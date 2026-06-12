# Postcove 📬

A **100% free and open-source, privacy-first** local document filing box for physical posts (Beamtendeutsch, insurance, utilities, tax). Runs **entirely on your device** —
no accounts, no login, no cloud, no tracking. GDPR-friendly by design.

> Postcove operates 100% offline. All data exists solely inside this device and is never transmitted to any server.

---

## ✨ Features

- **Dashboard Hub** — one-tap scanner CTA, category status grid, recent scans
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

> `@nuxt/fonts` and `@nuxt/icon` ship **inside** `@nuxt/ui`, so they're not listed as separate modules (registering them twice would warn).

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

Never hardcode Tailwind color utilities in components — use the semantic aliases (`primary`, `secondary`, `info`, `success`, `warning`, `error`). The standalone
favicon (`public/favicon.svg`) and `theme-color` use a literal hex — update those
two if you change `primary`.

## 🤖 AI pipeline — Bring Your Own Key (BYOK / "FUD AI")

There is **no backend and no bundled API key**. In Settings → _AI Provider_ the user
picks from **13 providers** (same set as [Fud AI](https://github.com/apoorvdarshan/fud-ai))
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

See [`useBriefBox.ts`](app/composables/useBriefBox.ts) and
[`CategoryPickerModal.vue`](app/components/CategoryPickerModal.vue).

## 🚀 Getting started

```bash
pnpm install      # install dependencies
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm generate     # static SPA output (for Capacitor / static hosting)
pnpm typecheck    # full TypeScript check
```

> **macOS note:** if `pnpm dev` errors with `connect EINVAL …​.sock`, your `$TMPDIR`
> path is too long for a unix socket. Run with `TMPDIR=/tmp/ pnpm dev`.

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

## ⚠️ Known tooling note (typecheck)

Nuxt 4.4.7 writes a `vue-router/volar/sfc-route-blocks` Volar plugin into the
generated tsconfigs, but vue-router 4.x doesn't export that subpath, so `vue-tsc`
crashes before checking. `pnpm typecheck` therefore runs
[`scripts/patch-tsconfig.mjs`](scripts/patch-tsconfig.mjs) to strip that one entry
first. The runtime build is unaffected. Remove the workaround once Nuxt/vue-router
ship a compatible pair.

## 🔎 Discoverability (SEO / GEO / LLMs)

Postcove is built to be found — by search engines and by AI models (ChatGPT,
Gemini, Claude, Perplexity, …):

- **Rich static meta** baked into `index.html` (title, description, keywords,
  Open Graph + Twitter cards, canonical, JSON-LD `SoftwareApplication`) — set in
  [`nuxt.config.ts`](nuxt.config.ts) so crawlers see it even though the app is an SPA.
- **`<noscript>` fallback** with the app description + repo link for non-JS crawlers.
- **`robots.txt` + `sitemap.xml`** generated by `@nuxtjs/seo`.
- **`llms.txt`** + **`llms-full.txt`** in [`public/`](public/) — the emerging standard
  that lets LLMs read a concise + full description of the app and find the repo.
- **OG banner** at `public/og-image.svg` (1200×630) for link previews.

> **Set your URLs before deploying.** Canonical, OG, sitemap, JSON-LD and the
> `llms.txt` links all use `NUXT_PUBLIC_SITE_URL` and `NUXT_PUBLIC_REPO_URL`
> (defaults: `https://postcove.app` and `https://github.com/your-org/postcove`).
> Export them at build time, e.g.:
>
> ```bash
> NUXT_PUBLIC_SITE_URL=https://your-domain NUXT_PUBLIC_REPO_URL=https://github.com/you/postcove pnpm generate
> ```
>
> Also update the two URLs inside `public/llms.txt` and `public/llms-full.txt`
> (static files aren't templated), and export `og-image.svg` to a **PNG** for
> platforms that don't render SVG previews (X, some crawlers).

## 📜 License

Licensed under **AGPL-3.0-or-later** — see [LICENSE](LICENSE). 100% free and open source.
