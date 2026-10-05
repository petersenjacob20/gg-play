// Grown-up password (Amendment m3).
// This is a lock against little hands on a shared phone, not real security. Anyone with the phone
// and browser tools can read or clear this data.
// Hashing: PBKDF2-SHA256 via crypto.subtle, 150,000 iterations, a fresh 16-byte salt, 32-byte output.
// Stores only salt + hash + parameters, never the password. No plaintext fallback.

export const LOCK_ALG = 'PBKDF2-SHA256';
export const LOCK_ITER = 150000;
export const LOCK_SALT_BYTES = 16;
export const LOCK_HASH_BYTES = 32;
export const PASS_MIN = 4;
export const PASS_MAX = 32;
export const WRONG_LIMIT = 5;
export const WAIT_MS = 30000;
export const UNLOCK_MS = 120000; // unlock lasts until the panel closes or 2 minutes with no taps

const subtle = () => (globalThis.crypto && globalThis.crypto.subtle) || null;

export function canLock(env = globalThis) {
  return !!(env.crypto && env.crypto.subtle && env.crypto.getRandomValues);
}

function b64(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(password, salt, iter = LOCK_ITER) {
  const c = subtle();
  if (!c) throw new Error('no-subtle');
  const key = await c.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await c.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, LOCK_HASH_BYTES * 8);
  return new Uint8Array(bits);
}

// Compare every byte without stopping early.
function equalBytes(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function validPassword(s) {
  return typeof s === 'string' && s.length >= PASS_MIN && s.length <= PASS_MAX;
}

// Returns { alg, iter, salt, hash } or null if crypto.subtle is missing.
export async function makeLock(password, env = globalThis) {
  if (!canLock(env) || !validPassword(password)) return null;
  const salt = new Uint8Array(LOCK_SALT_BYTES);
  env.crypto.getRandomValues(salt);
  const hash = await derive(password, salt, LOCK_ITER);
  return { alg: LOCK_ALG, iter: LOCK_ITER, salt: b64(salt), hash: b64(hash) };
}

export async function checkLock(lock, password) {
  if (!lock || lock.alg !== LOCK_ALG || !validPassword(password)) return false;
  try {
    const salt = fromB64(lock.salt);
    const want = fromB64(lock.hash);
    if (salt.length !== LOCK_SALT_BYTES || want.length !== LOCK_HASH_BYTES) return false;
    const got = await derive(password, salt, Number(lock.iter) || LOCK_ITER);
    return equalBytes(got, want);
  } catch {
    return false;
  }
}

// In-memory only: wrong-try count and unlock clock. A reload clears the wait.
export function createGate({ now = () => Date.now() } = {}) {
  let wrong = 0;
  let waitUntil = 0;
  let unlockedUntil = 0;
  return {
    isUnlocked() { return now() < unlockedUntil; },
    unlock(ms = UNLOCK_MS) { unlockedUntil = now() + ms; wrong = 0; waitUntil = 0; },
    lock() { unlockedUntil = 0; },
    touch(ms = UNLOCK_MS) { if (this.isUnlocked()) unlockedUntil = now() + ms; },
    waiting() { return Math.max(0, waitUntil - now()); },
    async tryPassword(lock, password) {
      const w = this.waiting();
      if (w > 0) return { ok: false, wait: w };
      const ok = await checkLock(lock, password);
      if (ok) { this.unlock(); return { ok: true, wait: 0 }; }
      wrong += 1;
      if (wrong >= WRONG_LIMIT) { waitUntil = now() + WAIT_MS; wrong = 0; }
      return { ok: false, wait: this.waiting() };
    },
  };
}
