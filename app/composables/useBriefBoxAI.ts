// ============================================================================
//  useBriefBoxAI — direct client → AI provider handshake (no backend).
// ============================================================================
//  Dispatches by provider *type* (openai-compatible / gemini / anthropic) using
//  the registry in utils/aiProviders.ts. Every request uses the user's own key
//  and goes straight from the device to the provider.
// ============================================================================

import { providerById, type ProviderDef } from '~/utils/aiProviders'

export interface ValidationResult {
  ok: boolean
  error?: string
}

export interface BriefAnalysis {
  title: string
  issuer: string
  /** Short category label — may be a brand-new type the app will create. */
  category: string
  summary: string
  dueAt?: string
  /** Full plain-text transcription of the letter — powers the in-vault assistant
   *  (e.g. finding an activation code or amount later). Stored encrypted. */
  text?: string
}

const ANALYSIS_INSTRUCTION =
  'You are a German postal-mail assistant. From the letter image extract a JSON ' +
  'object with: title (string), issuer (string), category (a short lowercase ' +
  'label such as finanzamt, versicherung, vertraege, energie, or a new concise ' +
  'one if none fit), summary (two sentences), optional dueAt (ISO date) if a ' +
  'deadline is present, and text (a faithful plain-text transcription of all ' +
  'readable content: codes, amounts, dates, names, reference numbers). Reply ONLY ' +
  'with minified JSON. No markdown, no commentary.'

export function useBriefBoxAI() {
  const { provider, apiKey, model } = useApiKey()

  // Resolve the active provider definition, applying the chosen model override.
  function activeProvider(): ProviderDef {
    const def = providerById(provider.value)
    return model.value ? { ...def, defaultModel: model.value } : def
  }

  function authHeaders(def: ProviderDef, key: string): Record<string, string> {
    if (def.type === 'anthropic') {
      return {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        // Required for browser/WebView-originated calls.
        'anthropic-dangerous-direct-browser-access': 'true'
      }
    }
    return key ? { Authorization: `Bearer ${key}` } : {}
  }

  /** Lightweight key check for the chosen provider — used by Settings before saving. */
  async function validate(providerId: string, key: string): Promise<ValidationResult> {
    const def = providerById(providerId)
    try {
      if (def.type === 'gemini') {
        const res = await fetch(`${def.baseUrl}/models?key=${encodeURIComponent(key)}`)
        return res.ok ? { ok: true } : { ok: false, error: (await describeError(res, def.label)).message }
      }
      // openai-compatible + anthropic both expose GET /models.
      const res = await fetch(`${def.baseUrl}/models`, { headers: authHeaders(def, key) })
      return res.ok ? { ok: true } : { ok: false, error: (await describeError(res, def.label)).message }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  }

  /** Send a scanned image (base64 data URL) for OCR + classification. */
  async function analyseLetter(
    imageDataUrl: string,
    knownCategories: string[] = []
  ): Promise<BriefAnalysis> {
    const def = activeProvider()
    if (def.requiresKey && !apiKey.value) {
      throw new Error('No API key configured. Open Settings to add one.')
    }
    const key = apiKey.value ?? ''
    const known = knownCategories.length
      ? ` Prefer one of these existing categories if it fits: ${knownCategories.join(', ')}.`
      : ''
    const instruction = ANALYSIS_INSTRUCTION + known

    // Images only (phone-camera scans). Detect the real image type
    // (image/jpeg, image/png, image/webp, …) so the request is labelled
    // correctly — a mislabelled image gets a 400 from the provider.
    const { mime, base64 } = splitDataUrl(imageDataUrl)

    if (def.type === 'gemini') {
      const url = `${def.baseUrl}/models/${def.defaultModel}:generateContent?key=${encodeURIComponent(key)}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: instruction },
                { inline_data: { mime_type: mime, data: base64 } }
              ]
            }
          ]
        })
      })
      if (!res.ok) throw await describeError(res, def.label)
      const json = await res.json()
      return parseAnalysis(json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}')
    }

    if (def.type === 'anthropic') {
      const res = await fetch(`${def.baseUrl}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeaders(def, key) },
        body: JSON.stringify({
          model: def.defaultModel,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: instruction },
                { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } }
              ]
            }
          ]
        })
      })
      if (!res.ok) throw await describeError(res, def.label)
      const json = await res.json()
      return parseAnalysis(json.content?.[0]?.text ?? '{}')
    }

    // openai-compatible (OpenAI, Grok, OpenRouter, Groq, Mistral, Ollama, …)
    const res = await fetch(`${def.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders(def, key) },
      body: JSON.stringify({
        model: def.defaultModel,
        messages: [
          { role: 'system', content: instruction },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyse this German letter.' },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }
        ]
      })
    })
    if (!res.ok) throw new Error(`${def.label}: HTTP ${res.status}`)
    const json = await res.json()
    return parseAnalysis(json.choices?.[0]?.message?.content ?? '{}')
  }

  /** Text-only chat with the active provider (used by the vault assistant). */
  async function chatText(system: string, user: string): Promise<string> {
    const def = activeProvider()
    if (def.requiresKey && !apiKey.value) {
      throw new Error('No API key configured. Open Settings to add one.')
    }
    const key = apiKey.value ?? ''

    if (def.type === 'gemini') {
      const url = `${def.baseUrl}/models/${def.defaultModel}:generateContent?key=${encodeURIComponent(key)}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\n${user}` }] }]
        })
      })
      if (!res.ok) throw await describeError(res, def.label)
      const json = await res.json()
      return json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    }

    if (def.type === 'anthropic') {
      const res = await fetch(`${def.baseUrl}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeaders(def, key) },
        body: JSON.stringify({
          model: def.defaultModel,
          max_tokens: 1024,
          system,
          messages: [{ role: 'user', content: user }]
        })
      })
      if (!res.ok) throw await describeError(res, def.label)
      const json = await res.json()
      return json.content?.[0]?.text ?? ''
    }

    // openai-compatible
    const res = await fetch(`${def.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders(def, key) },
      body: JSON.stringify({
        model: def.defaultModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    })
    if (!res.ok) throw new Error(`${def.label}: HTTP ${res.status}`)
    const json = await res.json()
    return json.choices?.[0]?.message?.content ?? ''
  }

  /** Answer a question grounded ONLY in the provided on-device document context.
   *  `context` is built locally from the vault; nothing else is sent. */
  async function ask(question: string, context: string, lang: 'en' | 'de' = 'en'): Promise<string> {
    const system =
      'You are Postcove, a private assistant that answers questions about the ' +
      "user's own scanned mail. Use ONLY the DOCUMENTS provided below — do not " +
      'invent anything. If the answer is not in the documents, say you could not ' +
      'find it in the vault. Be concise and, when useful, cite the document title. ' +
      `Answer in ${lang === 'de' ? 'German' : 'English'}.\n\n=== DOCUMENTS ===\n${context}`
    return (await chatText(system, question)).trim()
  }

  return { validate, analyseLetter, ask }
}

// Split a `data:<mime>;base64,<payload>` URL into its real mime type and the
// bare base64 payload. Falls back to JPEG if the URL is malformed.
function splitDataUrl(dataUrl: string): { mime: string; base64: string } {
  const m = /^data:([^;,]+)(?:;[^,]*)?,(.*)$/s.exec(dataUrl)
  if (m && m[2]) return { mime: m[1] || 'image/jpeg', base64: m[2] }
  return { mime: 'image/jpeg', base64: dataUrl }
}

// Turn a failed HTTP response into a descriptive Error that includes the
// provider's own message (Gemini/OpenAI/Anthropic all return `error.message`),
// not just the status code — so the user sees *why* it failed.
async function describeError(res: Response, label: string): Promise<Error> {
  let detail = ''
  try {
    const body = await res.clone().json()
    detail = body?.error?.message || body?.error?.status || body?.message ||
      (typeof body?.error === 'string' ? body.error : '')
  } catch {
    try {
      detail = (await res.text()).trim().slice(0, 300)
    } catch {
      /* body unreadable — fall back to the status line */
    }
  }
  const status = `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}`
  return new Error(detail ? `${label}: ${status} — ${detail}` : `${label}: ${status}`)
}

// Robustly pull a JSON object out of an LLM response (handles ```json fences and
// surrounding prose by extracting the first {...} block).
function parseAnalysis(text: string): BriefAnalysis {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(cleaned) as BriefAnalysis
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as BriefAnalysis
    }
    throw new Error('Could not parse AI response as JSON.')
  }
}
