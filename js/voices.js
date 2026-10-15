// Family voices (Dad settings, behind the grown-up lock): a grown-up can record or pick a short
// clip for a slot. Clips are kept on this phone only, in IndexedDB `gg-voices` (store `clips`,
// keyed by slot id). They are never part of the app files or the offline cache, never sent
// anywhere and never logged. A slot with no clip plays exactly what the app plays without one.
// Nothing here runs at import time.
import { helloPrompt } from './petname.js';
export const VOICE_DB = 'gg-voices';
export const VOICE_STORE = 'clips';
export const VOICE_DB_VERSION = 1;
export const MAX_FILE = 10 * 1024 * 1024; // a picked file bigger than this is refused
export const MAX_SEC = 8; // a kept clip is at most this long (after trimming)
export const REC_MS = 8000; // recording stops itself after this
const RATE = 22050;

const FRIENDS = ['friendSilly', 'friendBerry', 'friendCounter', 'friendDino', 'friendSea'];
const LINES = [
  ['c-yay', 'Cheer: Yay!', ['c-yay1', 'c-yay2']],
  ['c-greatjob', 'Cheer: Great job!', ['c-great']],
  ['c-youdidit', 'Cheer: You did it!', ['c-done', 'c-new'], 'Also plays for a new sticker'], // c-new: the new-sticker moment
  ['t-again', 'Try again', ['t-again1', 't-again2']],
  ['p-ready', 'Ready to play', [], 'Plays when a game opens'],
  ['c-bye', 'Bye-bye', [], 'Plays on the way back home'],
];

// The 19 slots in order: 5 friend hellos, 8 pet hellos (pet-1..pet-8 follow the app's pet list),
// 6 lines. Each: { id, label, note, clips, game } where clips are the app clips it stands in for and
// game says whether the app has a sound of its own there (Ready to play and Bye-bye do not).
export function voiceSlots(data) {
  const friends = (data && data.friends) || [];
  const pets = (data && data.pets) || [];
  const out = FRIENDS.map((f) => {
    const c = friends.find((x) => x.id === f);
    return { id: `hi-${f}`, label: `${c ? c.label : f} hello`, note: '', clips: [`hi-${f}`], game: true };
  });
  for (let i = 0; i < 8; i++) {
    const p = pets[i];
    out.push({ id: `pet-${i + 1}`, label: `Pet ${i + 1} hello`, note: p ? p.label : '', prompt: p ? helloPrompt(data, p.id) : '', clips: p ? [`hi-${p.id}`] : [], game: !!p });
  }
  for (const [id, label, clips, note = ''] of LINES) out.push({ id, label, note, clips: [id, ...clips], game: clips.length > 0 });
  return out;
}

// app clip id -> slot id
export function clipSlots(data) {
  const m = new Map();
  for (const s of voiceSlots(data)) for (const c of s.clips) m.set(c, s.id);
  return m;
}

export function validSlot(id) {
  return typeof id === 'string' && (/^pet-[1-8]$/.test(id) || /^hi-friend(Silly|Berry|Counter|Dino|Sea)$/.test(id)
    || LINES.some((l) => l[0] === id));
}

export function validClip(rec) {
  return !!(rec && typeof rec === 'object' && rec.blob && typeof rec.blob.size === 'number'
    && rec.blob.size > 44 && rec.blob.size <= MAX_FILE && /^audio\//.test(rec.blob.type || ''));
}

// ---- in-memory clips (read once at start, updated by Dad settings) --------------------------------
const clips = new Map(); // slot -> { blob, ver }
let ver = 0;
let slotOf = new Map();
export function setVoiceData(data) { slotOf = clipSlots(data); }
export function setVoices(map) { clips.clear(); for (const [k, b] of map) if (validSlot(k)) clips.set(k, { blob: b, ver: ++ver }); }
export function rememberVoice(slot, blob) { if (validSlot(slot)) clips.set(slot, { blob, ver: ++ver }); }
export function forgetVoice(slot) { clips.delete(slot); }
export function forgetAllVoices() { clips.clear(); }
export function hasVoice(slot) { return clips.has(slot); }
export function voiceCount() { return clips.size; }
export function voiceBlob(slot) { const c = clips.get(slot); return c ? c.blob : null; }
// For audio.js: the family clip standing in for an app clip id, or null (then the app's own sound).
export function familyClip(id) {
  const slot = slotOf.get(id) || (validSlot(id) ? id : null);
  const c = slot && clips.get(slot);
  return c ? { key: `fam:${slot}:${c.ver}`, blob: c.blob } : null;
}

// ---- Ready to play / Bye-bye: only with a family clip (no game clip exists, so empty = silent) ------
export const CUE_MS = 3000;
const GAME_ROUTES = new Set(['game', 'play', 'letters', 'count', 'says', 'playground']);
export function cueFor(prev, next) {
  if (prev === 'home' && GAME_ROUTES.has(next)) return 'p-ready';
  if (GAME_ROUTES.has(prev) && next === 'home') return 'c-bye';
  return null;
}
// cue(ctx, prev, next) -> the slot id to play now, or null. Each plays at most once per CUE_MS.
export function createCuer(now = () => Date.now()) {
  const last = {};
  return (ctx, prev, next) => {
    const id = cueFor(prev, next);
    const a = ctx && ctx.audio;
    if (!id || !a || (ctx.state && ctx.state.sound === false) || a.enabled === false || !a.hasFamily || !a.hasFamily(id)) return null;
    const t = now();
    if (last[id] !== undefined && t - last[id] < CUE_MS) return null;
    last[id] = t;
    return id;
  };
}

// ---- on-phone store ---------------------------------------------------------------------------------
function req(r) {
  return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}
// Only saving creates the database; reading or clearing never does.
function openDB(idb, create) {
  return new Promise((resolve, reject) => {
    if (!idb) { reject(new Error('no store')); return; }
    const r = idb.open(VOICE_DB, VOICE_DB_VERSION);
    r.onupgradeneeded = (e) => {
      if (!create && (!e || !e.oldVersion)) { r.transaction.abort(); return; }
      if (!r.result.objectStoreNames.contains(VOICE_STORE)) r.result.createObjectStore(VOICE_STORE);
    };
    r.onsuccess = () => { const db = r.result; db.onversionchange = () => db.close(); resolve(db); };
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('blocked'));
  });
}
async function withStore(mode, fn, idb, create = false) {
  const db = await openDB(idb, create);
  try {
    const tx = db.transaction(VOICE_STORE, mode);
    const done = new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });
    const out = await fn(tx.objectStore(VOICE_STORE));
    await done;
    return out;
  } finally { db.close(); }
}

export async function loadVoices(idb = globalThis.indexedDB) {
  const out = new Map();
  try {
    await withStore('readonly', async (st) => {
      for (const k of await req(st.getAllKeys())) {
        if (!validSlot(k)) continue;
        const rec = await req(st.get(k));
        if (validClip(rec)) out.set(k, rec.blob);
      }
    }, idb);
  } catch { /* no store: app sounds */ }
  return out;
}

export async function putVoice(slot, blob, idb = globalThis.indexedDB) {
  const rec = { blob, at: Date.now() };
  if (!validSlot(slot) || !validClip(rec)) throw new Error('bad clip');
  await withStore('readwrite', (st) => req(st.put(rec, slot)), idb, true);
}

export async function removeVoice(slot, idb = globalThis.indexedDB) {
  if (!validSlot(slot)) throw new Error('bad slot');
  try { await withStore('readwrite', (st) => req(st.delete(slot)), idb); } catch (e) { if (!e || e.name !== 'AbortError') throw e; }
}

// ---- making a clip even: mono, 22.05 kHz, quiet ends trimmed, peak raised to 0.9, 16-bit WAV ------
export function mixDown(chans, rate) {
  const n = chans[0].length;
  const mono = new Float32Array(n);
  for (const c of chans) for (let i = 0; i < n; i++) mono[i] += c[i] / chans.length;
  if (rate === RATE) return mono;
  const len = Math.max(1, Math.floor(n * RATE / rate));
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const x = i * rate / RATE; const j = Math.floor(x); const f = x - j;
    out[i] = (mono[j] || 0) * (1 - f) + (mono[j + 1] || 0) * f;
  }
  return out;
}

export function trimEven(s, rate = RATE, gate = 0.02) {
  let peak = 0;
  for (const v of s) peak = Math.max(peak, Math.abs(v));
  if (peak < 0.005) return null; // silence: nothing to keep
  const th = Math.max(gate * peak, 0.003);
  let a = 0; while (a < s.length && Math.abs(s[a]) < th) a++;
  let b = s.length - 1; while (b > a && Math.abs(s[b]) < th) b--;
  const pad = Math.round(rate * 0.08);
  a = Math.max(0, a - pad); b = Math.min(s.length, b + pad + 1, a + MAX_SEC * rate);
  const g = 0.9 / peak;
  const out = new Float32Array(b - a);
  const fade = Math.min(Math.round(rate * 0.01), out.length >> 1);
  for (let i = 0; i < out.length; i++) {
    const e = Math.min(1, i / (fade || 1), (out.length - 1 - i) / (fade || 1));
    out[i] = s[a + i] * g * e;
  }
  return out;
}

export function wav(s, rate = RATE) {
  const buf = new ArrayBuffer(44 + s.length * 2);
  const v = new DataView(buf);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + s.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data');
  v.setUint32(40, s.length * 2, true);
  for (let i = 0; i < s.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s[i])) * 0x7fff, true);
  return buf;
}

// A recorded or picked clip -> the even WAV Blob that is kept. Throws { code: 'big' | 'open' | 'quiet' }.
export async function makeClip(blob) {
  const fail = (code) => Object.assign(new Error(code), { code });
  if (!blob || !(blob.size > 0)) throw fail('open');
  if (blob.size > MAX_FILE) throw fail('big');
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) throw fail('open');
  const ac = new AC();
  try {
    const data = await blob.arrayBuffer();
    const ab = await new Promise((resolve, reject) => {
      const r = ac.decodeAudioData(data, resolve, reject);
      if (r && typeof r.then === 'function') r.then(resolve, reject);
    }).catch(() => { throw fail('open'); });
    const chans = [];
    for (let c = 0; c < ab.numberOfChannels; c++) chans.push(ab.getChannelData(c));
    const s = trimEven(mixDown(chans, ab.sampleRate));
    if (!s) throw fail('quiet');
    return new Blob([wav(s)], { type: 'audio/wav' });
  } finally { try { ac.close(); } catch { /* ignore */ } }
}

export const VOICE_MESSAGES = {
  big: 'That file is too big. Pick a shorter clip.',
  open: "This phone can't play that file. Try another.",
  quiet: 'That clip is silent. Try again a bit closer.',
  mic: 'The microphone is off. Allow it in Settings, or pick a file.',
  save: "Couldn't save on this phone. Try again.",
};
