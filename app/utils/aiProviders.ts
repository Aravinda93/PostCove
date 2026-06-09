// ============================================================================
//  AI provider registry — the single source of truth for BYOK providers.
// ============================================================================
//  Mirrors the provider set of Fud AI (https://github.com/apoorvdarshan/fud-ai).
//  Most are OpenAI-compatible, so one request shape covers them; Gemini and
//  Anthropic get their own. Adding a provider = one entry here, nothing else.
//
//  NOTE on CORS: direct browser → provider calls are blocked by some providers'
//  CORS policies on the *web* build. The shipping target is Capacitor (native
//  WebView), where requests are not subject to browser CORS — this is the whole
//  point of the BYOK/"FUD AI" model: no proxy, no backend. On web, Gemini,
//  Groq, OpenRouter and Ollama (local) generally work for quick testing.
// ============================================================================

export type ProviderType = 'openai' | 'gemini' | 'anthropic'

export interface ProviderDef {
  id: string
  /** Display name (proper noun — not translated). */
  label: string
  icon: string
  type: ProviderType
  /** API base URL. Empty for `custom` (user supplies it). */
  baseUrl: string
  /** Default vision-capable model used for letter analysis. */
  defaultModel: string
  /** Suggested models for the picker. Empty → free-text only (e.g. custom). */
  models: string[]
  /** Where to obtain a key (shown as a tappable hint). */
  keyHelpUrl?: string
  requiresKey: boolean
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    icon: 'i-lucide-gem',
    type: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-1.5-flash',
    models: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    keyHelpUrl: 'https://aistudio.google.com/apikey',
    requiresKey: true
  },
  {
    id: 'openai',
    label: 'OpenAI',
    icon: 'i-lucide-brain-circuit',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    requiresKey: true
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    icon: 'i-lucide-sparkle',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-latest',
    models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-haiku-20240307'],
    keyHelpUrl: 'https://console.anthropic.com/settings/keys',
    requiresKey: true
  },
  {
    id: 'xai',
    label: 'xAI Grok',
    icon: 'i-lucide-zap',
    type: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-vision-1212',
    models: ['grok-2-vision-1212', 'grok-2-latest'],
    keyHelpUrl: 'https://console.x.ai',
    requiresKey: true
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    icon: 'i-lucide-route',
    type: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-flash-1.5'],
    keyHelpUrl: 'https://openrouter.ai/keys',
    requiresKey: true
  },
  {
    id: 'together',
    label: 'Together AI',
    icon: 'i-lucide-users',
    type: 'openai',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
    models: ['meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo', 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo'],
    keyHelpUrl: 'https://api.together.ai/settings/api-keys',
    requiresKey: true
  },
  {
    id: 'groq',
    label: 'Groq',
    icon: 'i-lucide-cpu',
    type: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
    models: ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.2-11b-vision-preview'],
    keyHelpUrl: 'https://console.groq.com/keys',
    requiresKey: true
  },
  {
    id: 'huggingface',
    label: 'Hugging Face',
    icon: 'i-lucide-smile',
    type: 'openai',
    baseUrl: 'https://router.huggingface.co/v1',
    defaultModel: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
    models: ['meta-llama/Llama-3.2-11B-Vision-Instruct'],
    keyHelpUrl: 'https://huggingface.co/settings/tokens',
    requiresKey: true
  },
  {
    id: 'fireworks',
    label: 'Fireworks AI',
    icon: 'i-lucide-flame',
    type: 'openai',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    defaultModel: 'accounts/fireworks/models/llama-v3p2-11b-vision-instruct',
    models: ['accounts/fireworks/models/llama-v3p2-11b-vision-instruct'],
    keyHelpUrl: 'https://fireworks.ai/account/api-keys',
    requiresKey: true
  },
  {
    id: 'deepinfra',
    label: 'DeepInfra',
    icon: 'i-lucide-server',
    type: 'openai',
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    defaultModel: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
    models: ['meta-llama/Llama-3.2-11B-Vision-Instruct', 'meta-llama/Llama-3.2-90B-Vision-Instruct'],
    keyHelpUrl: 'https://deepinfra.com/dash/api_keys',
    requiresKey: true
  },
  {
    id: 'mistral',
    label: 'Mistral',
    icon: 'i-lucide-wind',
    type: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'pixtral-12b-2409',
    models: ['pixtral-12b-2409', 'pixtral-large-latest'],
    keyHelpUrl: 'https://console.mistral.ai/api-keys',
    requiresKey: true
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    icon: 'i-lucide-laptop',
    type: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llava',
    models: ['llava', 'llama3.2-vision', 'bakllava'],
    keyHelpUrl: 'https://ollama.com',
    requiresKey: false
  }
]

export function providerById(id: string | null | undefined): ProviderDef {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]!
}
