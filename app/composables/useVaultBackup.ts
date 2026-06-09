// ============================================================================
//  useVaultBackup — passphrase-encrypted export / import of the whole vault.
// ============================================================================
//  Lets users move their data to a new device or keep a safe copy (GDPR Art. 20
//  data portability). The backup file is encrypted with a passphrase the user
//  chooses (PBKDF2 → AES-256-GCM), so it's portable AND private — the device key
//  is NOT needed to restore. Built entirely with WebCrypto (FOSS, no deps).
// ============================================================================

interface BackupEnvelope {
  app: 'postcove'
  v: 1
  salt: string
  iv: string
  ct: string
}

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr.buffer
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, [
    'deriveKey'
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 200_000, hash: 'SHA-256' },
    km,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export function useVaultBackup() {
  const { snapshot, replaceVault } = useBriefBox()

  /** Encrypt the vault with `passphrase` and trigger a file download. */
  async function exportBackup(passphrase: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(passphrase, salt)
    const data = new TextEncoder().encode(JSON.stringify(snapshot()))
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
    const envelope: BackupEnvelope = {
      app: 'postcove',
      v: 1,
      salt: bufToB64(salt.buffer),
      iv: bufToB64(iv.buffer),
      ct: bufToB64(ct)
    }
    const blob = new Blob([JSON.stringify(envelope)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `postcove-backup-${new Date().toISOString().slice(0, 10)}.bbx`
    a.click()
    URL.revokeObjectURL(url)
  }

  /** Decrypt a backup file with `passphrase` and replace the current vault. */
  async function importBackup(file: File, passphrase: string): Promise<void> {
    const env = JSON.parse(await file.text()) as BackupEnvelope
    if (env.app !== 'postcove' || !env.salt || !env.iv || !env.ct) {
      throw new Error('Not a Postcove backup file')
    }
    const key = await deriveKey(passphrase, new Uint8Array(b64ToBuf(env.salt)))
    let plain: ArrayBuffer
    try {
      plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(b64ToBuf(env.iv)) },
        key,
        b64ToBuf(env.ct)
      )
    } catch {
      throw new Error('Wrong passphrase or corrupted file')
    }
    replaceVault(JSON.parse(new TextDecoder().decode(plain)))
  }

  return { exportBackup, importBackup }
}
