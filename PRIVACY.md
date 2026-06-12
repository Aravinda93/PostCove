# Postcove — Privacy Policy / Datenschutzerklärung

_Last updated: 2026-06. This document is also available in-app at `/privacy`._

This is the canonical privacy policy. Host it (or the deployed `/privacy` page) at a
public URL and reference that URL in the Apple App Store and Google Play submissions.

---

## English

**Overview.** Postcove ("the app") is a free, open-source, privacy-first application
that helps you scan, summarize and organize your postal mail entirely on your own device.
The app has **no user accounts, no backend servers, and no cloud database operated by us**.
The makers of Postcove do not receive, collect, store or have access to your documents
or personal data.

**What is stored, and where.** All documents (including the original scan), summaries,
categories, deadlines and settings are stored **locally on your device only, encrypted at
rest with AES-256-GCM**. The key is held in the device's secure storage (iOS Keychain /
Android Keystore). This data never leaves your device except as described under "AI
processing". You can permanently erase everything (data and key) at any time via **Settings →
Data Management → Wipe Local Vault**.

**AI processing (data in transit).** Postcove uses a "bring your own key" model. You
choose an AI provider (e.g. Google Gemini, OpenAI, Anthropic) and enter your own API key.
When you scan a letter, the image is sent **directly from your device to the AI provider you
selected**, using your key, solely to transcribe and classify the content. This transfer is
between you and your provider; it does not pass through any Postcove server, and the
makers of the app never see it. Your provider processes the request under its own policy
(possibly on servers outside the EU/EEA, for example in the USA) — review it before use.

**No tracking.** No analytics, advertising, tracking pixels or third-party tracking cookies.
A single functional cookie may store your language preference. Nothing is used to track you.

**Your GDPR rights.** Your data stays on your device under your control — you can access,
modify, export and erase it directly in the app. As we hold no personal data server-side,
there is nothing for us to provide, rectify or delete.

**Sensitive data.** German mail may contain sensitive data (health, financial, tax). It is
handled locally and only transmitted to the AI provider you explicitly choose, when you scan.

**Children.** Not directed at children; no knowing processing of children's data.

**Disclaimer.** This app is an AI-powered tracking assistant. It does not provide binding
legal or financial counsel. You are solely responsible for verifying official legal deadlines
independently.

**Changes & contact.** This policy may be updated; the current version is always in-app and in
this repository. Questions: see the project repository.

---

## Deutsch

**Überblick.** Postcove („die App“) ist eine kostenlose, quelloffene, datenschutzfreundliche
Anwendung, die dir hilft, deine Post vollständig auf deinem eigenen Gerät zu scannen,
zusammenzufassen und zu organisieren. Die App hat **keine Benutzerkonten, keine Backend-Server
und keine von uns betriebene Cloud-Datenbank**. Die Macher von Postcove erhalten, sammeln,
speichern oder sehen deine Dokumente oder personenbezogenen Daten nicht.

**Was wird gespeichert und wo.** Alle Dokumente (inkl. Originalscan), Zusammenfassungen,
Kategorien, Fristen und Einstellungen werden **ausschließlich lokal auf deinem Gerät
gespeichert — verschlüsselt im Ruhezustand mit AES-256-GCM**. Der Schlüssel liegt im sicheren
Gerätespeicher (iOS Keychain / Android Keystore). Diese Daten verlassen dein Gerät nur wie unter
„KI-Verarbeitung“ beschrieben. Du kannst jederzeit alles dauerhaft löschen (Daten und Schlüssel)
über **Einstellungen → Datenverwaltung → Alle Daten löschen**.

**KI-Verarbeitung (Datenübertragung).** Postcove nutzt ein „Bring Your Own Key“-Modell. Du
wählst einen KI-Anbieter (z. B. Google Gemini, OpenAI, Anthropic) und gibst deinen eigenen
API-Schlüssel ein. Beim Scannen wird das Bild **direkt von deinem Gerät an den gewählten
KI-Anbieter** gesendet — mit deinem Schlüssel, ausschließlich zur Transkription und
Klassifizierung. Die Übertragung erfolgt zwischen dir und deinem Anbieter; sie läuft nicht über
einen Postcove-AI-Server, und die Macher sehen sie nie. Dein Anbieter verarbeitet die Anfrage
gemäß eigener Richtlinie (ggf. außerhalb der EU/des EWR, z. B. in den USA) — bitte vorher prüfen.

**Kein Tracking.** Keine Analyse, Werbung, Tracking-Pixel oder Drittanbieter-Tracking-Cookies.
Ein funktionales Cookie kann die Spracheinstellung speichern. Nichts davon dient dem Tracking.

**Deine DSGVO-Rechte.** Deine Daten bleiben unter deiner Kontrolle auf deinem Gerät — du kannst
sie direkt in der App einsehen, ändern, exportieren und löschen. Da wir serverseitig keine
personenbezogenen Daten vorhalten, gibt es für uns nichts bereitzustellen, zu berichtigen oder
zu löschen.

**Sensible Daten.** Deutsche Post kann sensible Daten enthalten (Gesundheit, Finanzen, Steuern).
Diese werden lokal verarbeitet und nur an den ausdrücklich gewählten KI-Anbieter übertragen.

**Kinder.** Nicht an Kinder gerichtet; keine wissentliche Verarbeitung von Kinderdaten.

**Haftungsausschluss.** Diese App ist ein KI-gestützter Tracking-Assistent. Sie bietet keine
verbindliche rechtliche oder finanzielle Beratung. Du bist allein dafür verantwortlich, offizielle
Fristen eigenständig zu überprüfen.

**Änderungen & Kontakt.** Diese Richtlinie kann aktualisiert werden; die aktuelle Version ist
stets in der App und in diesem Repository verfügbar. Fragen: siehe Projekt-Repository.
