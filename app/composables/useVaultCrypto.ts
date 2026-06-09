// ============================================================================
//  useVaultCrypto — at-rest encryption for the local vault.
// ============================================================================
//  AES-256-GCM via the browser's built-in WebCrypto (no dependency, FOSS).
//  A random 256-bit Data Encryption Key (DEK) is generated once and kept in
//  Capacitor Preferences — which on iOS maps to the Keychain and on Android to
//  EncryptedSharedPreferences (OS-protected secure storage). All vault data is
//  stored on-device as AES-GCM ciphertext; the key never leaves the device and
//  is never sent anywhere.
//
//  Note: on the *web* build, Preferences falls back to localStorage, so the key
//  sits alongside the data — encryption is strongest on the native app where the
//  key lives in the OS keystore. Wire it to the app-lock PIN later for
//  PIN-gated key wrapping (hardening).
// ============================================================================

import { Preferences } from '@capacitor/preferences'

const K_DEK = 'postcove.crypto.dek'
let keyPromise: Promise<CryptoKey> | null = null

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr.buffer
}

async function loadOrCreateKey(): Promise<CryptoKey> {
  const existing = await Preferences.get({ key: K_DEK })
  if (existing.value) {
    return crypto.subtle.importKey('raw', b64ToBuf(existing.value), 'AES-GCM', false, [
      'encrypt',
      'decrypt'
    ])
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt'
  ])
  const raw = await crypto.subtle.exportKey('raw', key)
  await Preferences.set({ key: K_DEK, value: bufToB64(raw) })
  // Re-import as non-extractable for actual use.
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export function useVaultCrypto() {
  function getKey(): Promise<CryptoKey> {
    if (!keyPromise) keyPromise = loadOrCreateKey()
    return keyPromise
  }

  /** Encrypt an object → compact "ivB64.ctB64" string. */
  async function encryptJSON(obj: unknown): Promise<string> {
    const key = await getKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = new TextEncoder().encode(JSON.stringify(obj))
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
    return `${bufToB64(iv.buffer)}.${bufToB64(ct)}`
  }

  /** Decrypt a string produced by encryptJSON back into an object. */
  async function decryptJSON<T = unknown>(payload: string): Promise<T> {
    const key = await getKey()
    const [ivB64, ctB64] = payload.split('.')
    if (!ivB64 || !ctB64) throw new Error('Malformed ciphertext')
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(b64ToBuf(ivB64)) },
      key,
      b64ToBuf(ctB64)
    )
    return JSON.parse(new TextDecoder().decode(pt)) as T
  }

  /** Drop the encryption key (used by "wipe all"). */
  async function destroyKey() {
    await Preferences.remove({ key: K_DEK })
    keyPromise = null
  }

  return { encryptJSON, decryptJSON, destroyKey }
}
