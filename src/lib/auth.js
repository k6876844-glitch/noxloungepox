// Client-side password hashing (PBKDF2-SHA256 via Web Crypto). This is a
// local, offline device — there is no server to hash on — so this only
// protects against casually reading a password back out of IndexedDB.
const ITERATIONS = 100_000
const KEY_LENGTH = 32 // bytes

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

async function deriveHash(password, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  )
  return toHex(bits)
}

export async function hashPassword(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const hash = await deriveHash(password, saltBytes)
  return { hash, salt: toHex(saltBytes) }
}

export async function verifyPassword(password, salt, hash) {
  const computed = await deriveHash(password, fromHex(salt))
  return computed === hash
}
