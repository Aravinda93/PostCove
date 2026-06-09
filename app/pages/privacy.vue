<template>
  <div class="space-y-5">
    <NuxtLink to="/settings" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-default">
      <UIcon name="i-lucide-arrow-left" class="size-4" />
      {{ $t('nav.settings') }}
    </NuxtLink>

    <div>
      <h1 class="text-2xl font-bold tracking-tight text-primary">{{ $t('settings.privacyPolicy') }}</h1>
      <p class="mt-1 text-sm text-muted">Postcove</p>
    </div>

    <section v-for="s in sections" :key="s.h" class="space-y-2">
      <h2 class="text-sm font-semibold">{{ s.h }}</h2>
      <p v-for="(p, i) in s.body" :key="i" class="text-sm leading-relaxed text-toned">{{ p }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
// Public privacy policy (Datenschutzerklärung). Bilingual via the active locale.
// Stores (Apple/Google) require a publicly reachable policy URL — once deployed
// this lives at <site>/privacy. Keep in sync with /public/llms* and PRIVACY.md.
const { locale, t } = useI18n()
useHead({ title: () => t('settings.privacyPolicy') })

interface Section {
  h: string
  body: string[]
}

const en: Section[] = [
  { h: 'Overview', body: [
    'Postcove ("the app") is a free, open-source, privacy-first application that helps you scan, summarize and organize your postal mail entirely on your own device.',
    'The app has no user accounts, no backend servers, and no cloud database operated by us. We — the makers of Postcove — do not receive, collect, store or have access to your documents or personal data.'
  ]},
  { h: 'What is stored, and where', body: [
    'All documents (including the original scanned image), summaries, categories, deadlines and settings are stored locally on your device only, encrypted at rest with AES-256-GCM. The encryption key is held in your device\'s secure storage (Keychain on iOS, Keystore on Android). This data never leaves your device except as described in "AI processing" below.',
    'You can permanently erase everything — data and encryption key — at any time using Settings → Data Management → "Wipe Local Vault".',
    'Optional backups you export are encrypted with a passphrase you choose and saved wherever you decide. Deadline reminders are scheduled locally by your device and send nothing to any server.'
  ]},
  { h: 'AI processing (data in transit)', body: [
    'Postcove uses a "bring your own key" model. You choose an AI provider (e.g. Google Gemini, OpenAI, Anthropic) and enter your own API key.',
    'When you scan a letter, the image is sent directly from your device to the AI provider you selected, using your key, solely to transcribe and classify the content. The same applies when you use the in-app assistant: your question and the relevant text from your documents are sent directly to your provider to answer. These transfers happen between you and your provider — they do not pass through any server operated by Postcove, and the makers of the app never see them.',
    'Your chosen provider processes that request under its own privacy policy and terms (which may involve servers outside the EU/EEA). Please review your provider\'s policy before use. Do not enter documents you are not comfortable sending to your chosen provider.'
  ]},
  { h: 'No tracking', body: [
    'The app contains no analytics, no advertising, no tracking pixels, and no third-party tracking cookies. A single functional cookie may store your language preference; theme and data are stored locally. None of this is used to track you.'
  ]},
  { h: 'Your GDPR rights', body: [
    'Because your data stays on your device under your control, you can access, modify, export (where supported) and erase it directly within the app at any time. As we do not collect or hold your personal data, there is no server-side data for us to provide, rectify or delete.'
  ]},
  { h: 'Sensitive data', body: [
    'German mail may contain sensitive information (e.g. health, financial or tax data). Such data is handled locally on your device and is only transmitted to the AI provider you explicitly choose, when you choose to scan.'
  ]},
  { h: 'Children', body: [
    'The app is not directed at children and does not knowingly process children\'s data.'
  ]},
  { h: 'Disclaimer', body: [
    'This app is an AI-powered tracking assistant. It does not provide binding legal or financial counsel. You are solely responsible for verifying official legal deadlines independently.'
  ]},
  { h: 'Changes & contact', body: [
    'This policy may be updated as the app evolves; the current version is always available here. For questions, see the project repository linked from the app.'
  ]}
]

const de: Section[] = [
  { h: 'Überblick', body: [
    'Postcove („die App“) ist eine kostenlose, quelloffene, datenschutzfreundliche Anwendung, die dir hilft, deine Post vollständig auf deinem eigenen Gerät zu scannen, zusammenzufassen und zu organisieren.',
    'Die App hat keine Benutzerkonten, keine Backend-Server und keine von uns betriebene Cloud-Datenbank. Wir — die Macher von Postcove — erhalten, sammeln, speichern oder sehen deine Dokumente oder personenbezogenen Daten nicht.'
  ]},
  { h: 'Was wird gespeichert und wo', body: [
    'Alle Dokumente (einschließlich des gescannten Originalbilds), Zusammenfassungen, Kategorien, Fristen und Einstellungen werden ausschließlich lokal auf deinem Gerät gespeichert — verschlüsselt im Ruhezustand mit AES-256-GCM. Der Schlüssel liegt im sicheren Speicher deines Geräts (Keychain unter iOS, Keystore unter Android). Diese Daten verlassen dein Gerät nur wie unter „KI-Verarbeitung“ beschrieben.',
    'Du kannst jederzeit alles dauerhaft löschen — Daten und Schlüssel — über Einstellungen → Datenverwaltung → „Alle Daten löschen“.',
    'Optionale Sicherungen, die du exportierst, sind mit einer von dir gewählten Passphrase verschlüsselt und werden dort gespeichert, wo du entscheidest. Fristen-Erinnerungen werden lokal von deinem Gerät geplant und senden nichts an einen Server.'
  ]},
  { h: 'KI-Verarbeitung (Datenübertragung)', body: [
    'Postcove nutzt ein „Bring Your Own Key“-Modell. Du wählst einen KI-Anbieter (z. B. Google Gemini, OpenAI, Anthropic) und gibst deinen eigenen API-Schlüssel ein.',
    'Wenn du einen Brief scannst, wird das Bild direkt von deinem Gerät an den gewählten KI-Anbieter gesendet — mit deinem Schlüssel, ausschließlich zur Transkription und Klassifizierung. Dasselbe gilt für den integrierten Assistenten: deine Frage und der relevante Text aus deinen Dokumenten werden direkt an deinen Anbieter gesendet, um zu antworten. Diese Übertragungen erfolgen zwischen dir und deinem Anbieter; sie laufen nicht über einen Server von Postcove, und die Macher der App sehen sie niemals.',
    'Dein gewählter Anbieter verarbeitet diese Anfrage gemäß seiner eigenen Datenschutzerklärung (ggf. auf Servern außerhalb der EU/des EWR). Bitte prüfe die Richtlinie deines Anbieters vor der Nutzung. Sende keine Dokumente, mit deren Übermittlung du nicht einverstanden bist.'
  ]},
  { h: 'Kein Tracking', body: [
    'Die App enthält keine Analyse, keine Werbung, keine Tracking-Pixel und keine Tracking-Cookies von Drittanbietern. Ein einzelnes funktionales Cookie kann deine Spracheinstellung speichern; Design und Daten werden lokal gespeichert. Nichts davon dient dazu, dich zu verfolgen.'
  ]},
  { h: 'Deine DSGVO-Rechte', body: [
    'Da deine Daten unter deiner Kontrolle auf deinem Gerät bleiben, kannst du sie jederzeit direkt in der App einsehen, ändern, (sofern unterstützt) exportieren und löschen. Da wir keine personenbezogenen Daten erheben oder vorhalten, gibt es serverseitig keine Daten, die wir bereitstellen, berichtigen oder löschen könnten.'
  ]},
  { h: 'Sensible Daten', body: [
    'Deutsche Post kann sensible Informationen enthalten (z. B. Gesundheits-, Finanz- oder Steuerdaten). Solche Daten werden lokal auf deinem Gerät verarbeitet und nur an den von dir ausdrücklich gewählten KI-Anbieter übertragen, wenn du scannst.'
  ]},
  { h: 'Kinder', body: [
    'Die App richtet sich nicht an Kinder und verarbeitet wissentlich keine Daten von Kindern.'
  ]},
  { h: 'Haftungsausschluss', body: [
    'Diese App ist ein KI-gestützter Tracking-Assistent. Sie bietet keine verbindliche rechtliche oder finanzielle Beratung. Du bist allein dafür verantwortlich, offizielle Fristen eigenständig zu überprüfen.'
  ]},
  { h: 'Änderungen & Kontakt', body: [
    'Diese Richtlinie kann mit der Weiterentwicklung der App aktualisiert werden; die aktuelle Version ist immer hier verfügbar. Bei Fragen siehe das in der App verlinkte Projekt-Repository.'
  ]}
]

const sections = computed(() => (locale.value === 'de' ? de : en))
</script>
