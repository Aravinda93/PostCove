// Postcove — Nuxt 4 configuration.
// Privacy blueprint: 100% client-side SPA, no server runtime, no accounts, no cloud.

// ── Discoverability constants (override via env at build/deploy time) ─────────
// Set the real deploy URL + repo so canonical/OG/sitemap/JSON-LD/llms.txt all
// point to the right place: NUXT_PUBLIC_SITE_URL / NUXT_PUBLIC_REPO_URL.
const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL || 'https://postcove.app'
const REPO_URL = process.env.NUXT_PUBLIC_REPO_URL || 'https://github.com/your-org/postcove'
const SITE_NAME = 'Postcove'
const SITE_DESC =
  'Postcove is a free, open-source, privacy-first app that scans, summarizes and ' +
  'organizes your German mail (Finanzamt, insurance, contracts, utilities) entirely on ' +
  'your device — no account, no cloud, GDPR-friendly. Bring your own AI key (Gemini, ' +
  'OpenAI, Claude and more).'

// JSON-LD describing the app for search engines and LLMs.
const SOFTWARE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  alternateName: 'Postcove',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Web, iOS, Android',
  description: SITE_DESC,
  url: SITE_URL,
  sameAs: [REPO_URL],
  inLanguage: ['en', 'de'],
  isAccessibleForFree: true,
  license: 'https://www.gnu.org/licenses/agpl-3.0.html',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  featureList: [
    'Scan and digitize physical German mail',
    'On-device AI categorization and summarization',
    'Deadline (Fristen) tracking',
    'Local-first encrypted document vault',
    'Bring-your-own AI key (Gemini, OpenAI, Claude, and more)',
    'English and German interface',
    '100% offline, no account, GDPR-friendly'
  ]
}

export default defineNuxtConfig({
  // Last config-schema bump; keeps Nuxt 4 behaviour stable.
  compatibilityDate: '2025-01-01',

  // SPA mode: render entirely in the browser. Required for the local-first / Capacitor
  // wrapper model — there is no server that ever sees the user's documents.
  ssr: false,

  // Module stack. NOTE: @nuxt/ui v4 already bundles @nuxt/fonts and @nuxt/icon,
  // so we do NOT register those separately (would double-register). It also bundles
  // the color-mode engine used for dark/light/system theming.
  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@nuxtjs/seo'
  ],

  // Single global stylesheet — pulls in Tailwind v4 + Nuxt UI tokens (see main.css).
  css: ['~/assets/css/main.css'],

  // Dark / Light / System theme. `preference: 'system'` is the default and the
  // product requirement: follow the OS until the user overrides it.
  colorMode: {
    preference: 'system',
    fallback: 'light',
    storageKey: 'postcove-color-mode'
  },

  // Multi-language: English + German, no URL prefix (single-view local app).
  // Language follows the device by default and is managed by useLanguage.ts
  // (System/EN/DE, like the theme) — so we disable i18n's own browser detection.
  i18n: {
    vueI18n: 'i18n.config.ts',
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
      { code: 'de', name: 'Deutsch', language: 'de-DE', file: 'de.json' }
    ],
    detectBrowserLanguage: false
  },

  // App-wide HTML head. Because this is an SPA (ssr:false), these tags are baked
  // into the static index.html — so crawlers and LLMs that fetch the page (or
  // don't run JS) still get a rich title, description, OG/Twitter cards, a
  // JSON-LD app description, and a <noscript> content fallback.
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      // Descriptive default title for the static shell (what crawlers/LLMs see).
      // Per-page titles + the "%s · Postcove" template are applied client-side
      // in app.vue once the SPA hydrates.
      title: 'Postcove — your private mailbox, on your device',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'canonical', href: SITE_URL }
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#10b981' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'description', content: SITE_DESC },
        {
          name: 'keywords',
          content:
            'Postcove, German mail organizer, Briefkasten app, Finanzamt, Beamtendeutsch, ' +
            'document scanner, OCR, privacy-first, offline, local-first, FOSS, open source, GDPR, ' +
            'AI document analysis, bring your own key, Gemini, OpenAI, Claude, Versicherung, Verträge'
        },
        { name: 'author', content: 'Postcove contributors' },
        { name: 'robots', content: 'index, follow, max-image-preview:large' },
        { name: 'application-name', content: SITE_NAME },
        { name: 'apple-mobile-web-app-title', content: SITE_NAME },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:title', content: SITE_NAME },
        { property: 'og:description', content: SITE_DESC },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:image', content: `${SITE_URL}/og-image.png` },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:locale:alternate', content: 'de_DE' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: SITE_NAME },
        { name: 'twitter:description', content: SITE_DESC },
        { name: 'twitter:image', content: `${SITE_URL}/og-image.png` }
      ],
      script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(SOFTWARE_JSONLD) }],
      noscript: [
        {
          innerHTML:
            '<div style="font-family:system-ui,sans-serif;max-width:640px;margin:3rem auto;padding:1.5rem;line-height:1.6">' +
            '<h1>Postcove</h1>' +
            '<p>' +
            SITE_DESC +
            '</p>' +
            '<p>Postcove runs 100% on your device — no account, no cloud, GDPR-friendly. ' +
            'It is free and open-source software (AGPL-3.0).</p>' +
            `<p>Source code: <a href="${REPO_URL}">${REPO_URL}</a></p>` +
            '<p>This application requires JavaScript to run.</p>' +
            '</div>'
        }
      ]
    }
  },

  // @nuxtjs/seo site config — feeds sitemap, robots, canonical & OG defaults.
  site: {
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESC,
    defaultLocale: 'en'
  },

  // Expose the repo + site URLs to the client so components (e.g. the GitHub
  // link in Settings) can read them. Override with NUXT_PUBLIC_REPO_URL etc.
  runtimeConfig: {
    public: {
      repoUrl: REPO_URL,
      siteUrl: SITE_URL,
      version: '0.1.0'
    }
  },

  // OG-image + Schema.org need SSR to be useful; this is a private offline SPA
  // with no public SEO surface, so disable both (Schema.org also errors w/o SSR).
  ogImage: { enabled: false },
  schemaOrg: { enabled: false },

  // No external analytics, no tracking pixels, no remote fonts at runtime — privacy by default.
  future: { compatibilityVersion: 4 },

  devtools: { enabled: true }
})
