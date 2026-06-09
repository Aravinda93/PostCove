// ============================================================================
//  useAppLock — optional PIN + biometric lock for the whole app.
// ============================================================================
//  Fully on-device, no server. The PIN is never stored: only a PBKDF2-SHA256
//  hash + random salt are kept (via Capacitor Preferences). Biometric uses the
//  WebAuthn platform authenticator (Face ID / Touch ID / fingerprint in the
//  native WebView) — no extra dependency. The app re-locks when sent to the
//  background. This is an access gate; at-rest encryption is a separate concern.
// ============================================================================

import { Preferences } from '@capacitor/preferences'

const K_ENABLED = 'postcove.lock.enabled'
const K_HASH = 'postcove.lock.hash'
const K_SALT = 'postcove.lock.salt'
const K_BIO = 'postcove.lock.biometric'
const K_CRED = 'postcove.lock.cred'

const enabled = ref(false)
const locked = ref(false)
const biometricEnabled = ref(false)
const biometricAvailable = ref(false)
let loaded = false

// ---- base64 <-> ArrayBuffer helpers ---------------------------------------
function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr.buffer
}

async function derive(pin: string, salt: Uint8Array): Promise<string> {
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
    'deriveBits'
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 150_000, hash: 'SHA-256' },
    km,
    256
  )
  return bufToB64(bits)
}

async function load() {
  if (loaded || !import.meta.client) return
  const [en, bio] = await Promise.all([
    Preferences.get({ key: K_ENABLED }),
    Preferences.get({ key: K_BIO })
  ])
  enabled.value = en.value === '1'
  biometricEnabled.value = bio.value === '1'
  // Start locked if a lock is configured (must authenticate to enter).
  locked.value = enabled.value
  loaded = true
  // Probe platform biometric availability (async, best-effort).
  try {
    biometricAvailable.value =
      !!window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
  } catch {
    biometricAvailable.value = false
  }
}

export function useAppLock() {
  load()

  async function verifyPin(pin: string): Promise<boolean> {
    const [h, s] = await Promise.all([
      Preferences.get({ key: K_HASH }),
      Preferences.get({ key: K_SALT })
    ])
    if (!h.value || !s.value) return false
    const candidate = await derive(pin, new Uint8Array(b64ToBuf(s.value)))
    return candidate === h.value
  }

  /** Turn the lock on with a new PIN. */
  async function enable(pin: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const hash = await derive(pin, salt)
    await Promise.all([
      Preferences.set({ key: K_HASH, value: hash }),
      Preferences.set({ key: K_SALT, value: bufToB64(salt.buffer) }),
      Preferences.set({ key: K_ENABLED, value: '1' })
    ])
    enabled.value = true
    locked.value = false
  }

  async function changePin(oldPin: string, newPin: string): Promise<boolean> {
    if (!(await verifyPin(oldPin))) return false
    await enable(newPin)
    return true
  }

  async function disable(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: K_ENABLED }),
      Preferences.remove({ key: K_HASH }),
      Preferences.remove({ key: K_SALT }),
      Preferences.remove({ key: K_BIO }),
      Preferences.remove({ key: K_CRED })
    ])
    enabled.value = false
    locked.value = false
    biometricEnabled.value = false
  }

  async function unlockWithPin(pin: string): Promise<boolean> {
    if (await verifyPin(pin)) {
      locked.value = false
      return true
    }
    return false
  }

  function lockNow() {
    if (enabled.value) locked.value = true
  }

  // ---- Biometric (WebAuthn platform authenticator) ------------------------
  async function enableBiometric(): Promise<boolean> {
    if (!biometricAvailable.value) return false
    try {
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'Postcove', id: location.hostname },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: 'postcove',
            displayName: 'Postcove'
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred'
          },
          timeout: 60_000,
          attestation: 'none'
        }
      })) as PublicKeyCredential | null
      if (!cred) return false
      await Preferences.set({ key: K_CRED, value: bufToB64(cred.rawId) })
      await Preferences.set({ key: K_BIO, value: '1' })
      biometricEnabled.value = true
      return true
    } catch {
      return false
    }
  }

  async function disableBiometric() {
    await Promise.all([Preferences.remove({ key: K_BIO }), Preferences.remove({ key: K_CRED })])
    biometricEnabled.value = false
  }

  async function unlockWithBiometric(): Promise<boolean> {
    if (!biometricEnabled.value) return false
    try {
      const credB64 = (await Preferences.get({ key: K_CRED })).value
      if (!credB64) return false
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: location.hostname,
          allowCredentials: [{ type: 'public-key', id: b64ToBuf(credB64) }],
          userVerification: 'required',
          timeout: 60_000
        }
      })
      if (assertion) {
        locked.value = false
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return {
    enabled: readonly(enabled),
    locked: readonly(locked),
    biometricEnabled: readonly(biometricEnabled),
    biometricAvailable: readonly(biometricAvailable),
    enable,
    disable,
    changePin,
    verifyPin,
    unlockWithPin,
    lockNow,
    enableBiometric,
    disableBiometric,
    unlockWithBiometric
  }
}
