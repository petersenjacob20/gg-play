// On-device storage (build plan sections 1 and 6, Amendment f1). One localStorage key, `gg.v1`
// (the key name stays), holding exactly { v:2, pets:{id:{on,name}}, sound, levels, book, seenLetters }.
// Nothing else is stored.
// - levels: one { lv, top, good } per activity (letters, count, add, pattern). lv = the level she
//   plays now, top = the highest level unlocked (never goes down), good = the good-round streak (0/1).
// - book: the sticker ids she owns, unique, in the order earned, only ids in the sticker catalog.
// - seenLetters is data-driven: only letters enabled in activities.json are kept (setLetters()).
// Old v1 saves migrate: countLevel n -> levels.count {lv:n, top:n, good:0}; stickers n -> the first
// min(n, catalog size) catalog stickers; pets, sound and seenLetters carry over. A broken or unknown
// save starts fresh. Pure helpers are importable from Node; browser APIs only inside functions.

export const KEY = 'gg.v1';
export const CACHE_PREFIX = 'gg-';
export const VERSION = 2;
export const NAME_MAX = 20;
export const STICKER_MAX = 9999; // v1 sticker counter cap (migration only)
export const PET_IDS = ['yellowDog', 'chocolateDog', 'gingerDog', 'blackDog', 'puppy', 'kitty', 'bunny', 'bunny2'];
// Highest level per activity (plan f2). Stories have no levels and store nothing.
export const LEVEL_MAX = Object.freeze({ letters: 5, count: 3, add: 2, pattern: 3 });
export const ACT_IDS = Object.keys(LEVEL_MAX);

let enabledLetters = [];
// The letter ids enabled in activities.json. Until this is called, no letter counts are kept.
export function setLetters(ids) {
  enabledLetters = Array.isArray(ids) ? ids.filter((x) => typeof x === 'string' && /^[a-z]$/.test(x)) : [];
}
export function getLetters() { return [...enabledLetters]; }

let catalog = [];
// The sticker catalog ids (activities.json stickerBook, page order). Until this is called, no sticker is kept.
export function setBook(ids) {
  catalog = Array.isArray(ids) ? [...new Set(ids.filter((x) => typeof x === 'string' && /^sk-[a-zA-Z0-9]+$/.test(x)))] : [];
}
export function getBook() { return [...catalog]; }

export const freshLevel = () => ({ lv: 1, top: 1, good: 0 });

export function defaults() {
  const pets = {};
  for (const id of PET_IDS) pets[id] = { on: true, name: '' };
  const levels = {};
  for (const id of ACT_IDS) levels[id] = freshLevel();
  return { v: VERSION, pets, sound: true, levels, book: [], seenLetters: {} };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// A pet name: a string, control characters removed, at most 20 characters (counted as characters,
// not UTF-16 units, so an emoji is never cut in half). Rendered with textContent / input.value only.
export function capName(s) {
  if (typeof s !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const clean = s.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').replace(/^\s+/, '');
  return Array.from(clean).slice(0, NAME_MAX).join('');
}

const clampInt = (n, lo, hi, dflt) => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : dflt);

// One activity's progress: ints clamped to 1..max, top never below lv, good only 0 or 1.
export function normalizeLevel(p, max) {
  if (!isObj(p)) return freshLevel();
  const lv = clampInt(p.lv, 1, max, 1);
  const top = Math.max(lv, clampInt(p.top, 1, max, 1));
  return { lv, top, good: p.good === 1 ? 1 : 0 };
}

// Owned stickers: catalog ids only, unique, in the order earned.
export function normalizeBook(list, ids = catalog) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const x of list) if (typeof x === 'string' && ids.includes(x) && !out.includes(x)) out.push(x);
  return out;
}

// Merge a parsed object over the defaults. Unknown keys and unknown activity ids are dropped. Never
// throws. A v1 save (or one with no version, from before versions) is migrated; any other version
// starts fresh. A pet id the save does not have yet (from before bunny2) loads on, with no name.
export function normalize(obj, { letters = enabledLetters, book = catalog } = {}) {
  const s = defaults();
  if (!isObj(obj)) return s;
  const v1 = obj.v === 1 || obj.v === undefined;
  if (!v1 && obj.v !== VERSION) return s; // a future/unknown version starts fresh
  if (isObj(obj.pets)) {
    for (const id of PET_IDS) {
      const p = obj.pets[id];
      if (!isObj(p)) continue;
      s.pets[id] = { on: p.on !== false, name: capName(p.name).trim() };
    }
  }
  if (typeof obj.sound === 'boolean') s.sound = obj.sound;
  if (v1) {
    const n = clampInt(obj.countLevel, 1, LEVEL_MAX.count, 1);
    s.levels.count = { lv: n, top: n, good: 0 };
    s.book = book.slice(0, Math.min(clampInt(obj.stickers, 0, STICKER_MAX, 0), book.length));
  } else {
    if (isObj(obj.levels)) for (const id of ACT_IDS) s.levels[id] = normalizeLevel(obj.levels[id], LEVEL_MAX[id]);
    s.book = normalizeBook(obj.book, book);
  }
  if (isObj(obj.seenLetters)) {
    for (const id of letters) {
      const n = Object.prototype.hasOwnProperty.call(obj.seenLetters, id) ? obj.seenLetters[id] : 0;
      if (/^[a-z]$/.test(id) && Number.isInteger(n) && n > 0) s.seenLetters[id] = Math.min(n, 99999);
    }
  }
  return s;
}

export function parse(raw) {
  if (typeof raw !== 'string' || !raw) return defaults();
  try { return normalize(JSON.parse(raw)); } catch { return defaults(); }
}

export function load(storage = globalThis.localStorage) {
  try { return parse(storage ? storage.getItem(KEY) : null); } catch { return defaults(); }
}

export function save(state, storage = globalThis.localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(normalize(state)));
    return true;
  } catch {
    return false;
  }
}

// Delete my data: only this app's things. The gg.v1 key, the gg-photos database (pet photos), gg-*
// caches and the service worker registration for this app's own scope. Other apps on the same
// origin keep theirs.
export const PHOTO_DB_NAME = 'gg-photos';
export function deletePhotoDB(env = globalThis) {
  return new Promise((resolve) => {
    try {
      const idb = env.indexedDB;
      if (!idb) { resolve(false); return; }
      const r = idb.deleteDatabase(PHOTO_DB_NAME);
      r.onsuccess = () => resolve(true);
      r.onerror = () => resolve(false);
      // Open connections close on versionchange and success follows; never hang Delete all on it.
      r.onblocked = () => { if (globalThis.setTimeout) globalThis.setTimeout(() => resolve(false), 3000); };
    } catch { resolve(false); }
  });
}

export async function deleteAll(env = globalThis) {
  try { env.localStorage.removeItem(KEY); } catch { /* ignore */ }
  await deletePhotoDB(env);
  try {
    if (env.caches) {
      const keys = await env.caches.keys();
      await Promise.all(keys.filter((k) => String(k).startsWith(CACHE_PREFIX)).map((k) => env.caches.delete(k)));
    }
  } catch { /* ignore */ }
  try {
    const sw = env.navigator && env.navigator.serviceWorker;
    if (sw) {
      const scope = new URL('./', env.location.href).href;
      const regs = await sw.getRegistrations();
      await Promise.all(regs.filter((r) => r.scope === scope).map((r) => r.unregister()));
    }
  } catch { /* ignore */ }
}
