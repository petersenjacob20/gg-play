// On-device storage (build plan sections 1 and 6, Amendment m / m8 / save v3). One localStorage key,
// `gg.v1` (the key name stays). Household fields (sound, pets, lock) are shared; each profile has
// its own name, levels (keyed by game id), book and seenLetters. Photos stay in IndexedDB gg-photos.
// A v2 save becomes profiles.p1; levels map per Amendment m2 revised (primary act from games.json).
// Each game level is {lv,top,good,at,topAt}; at/topAt are step keys (act[:mode]:lv) so ladder inserts keep her place (m8).
// A broken or unknown save starts fresh. Pure helpers are importable from Node.

import { GAME_IDS, PROFILE_IDS, mapOldLevel, primaryAct, ladderMax, resolveLevel, keysForLevel } from './games.js';
import { LOCK_ALG, LOCK_ITER } from './lock.js';

export const KEY = 'gg.v1';
export const CACHE_PREFIX = 'gg-';
export const VERSION = 3;
export const NAME_MAX = 20;
export const STICKER_MAX = 9999; // v1 sticker counter cap (migration only)
export const PET_IDS = ['yellowDog', 'chocolateDog', 'gingerDog', 'blackDog', 'puppy', 'kitty', 'bunny', 'bunny2'];
// Highest level per activity engine (plan f2). Used by acts/*.js; game ladders have their own max.
export const LEVEL_MAX = Object.freeze({ letters: 5, count: 3, add: 2, pattern: 3 });
export const ACT_IDS = Object.keys(LEVEL_MAX);

let enabledLetters = [];
export function setLetters(ids) {
  enabledLetters = Array.isArray(ids) ? ids.filter((x) => typeof x === 'string' && /^[a-z]$/.test(x)) : [];
}
export function getLetters() { return [...enabledLetters]; }

let catalog = [];
export function setBook(ids) {
  catalog = Array.isArray(ids) ? [...new Set(ids.filter((x) => typeof x === 'string' && /^sk-[a-zA-Z0-9]+$/.test(x)))] : [];
}
export function getBook() { return [...catalog]; }

// games.json list, set once at boot so migration and normalize know the ladders.
let gamesList = [];
export function setGames(list) {
  gamesList = Array.isArray(list) ? list : [];
}
export function getGames() { return gamesList; }

export function freshLevel(game) {
  const ladder = game && Array.isArray(game.ladder) ? game.ladder : [];
  const keys = keysForLevel(ladder, 1, 1);
  return { lv: 1, top: 1, good: 0, at: keys.at || '', topAt: keys.topAt || '' };
}

export function freshProfile(name = '') {
  const levels = {};
  for (const id of GAME_IDS) {
    const g = gamesList.find((x) => x.id === id);
    if (g && g.noLevels) continue;
    levels[id] = freshLevel(g);
  }
  return { name: capName(name).trim(), levels, book: [], seenLetters: {} };
}

export function defaults() {
  const pets = {};
  for (const id of PET_IDS) pets[id] = { on: true, name: '' };
  return {
    v: VERSION,
    sound: true,
    intros: true,   // Hello voices (Amendment n)
    sayNames: true, // Say pet names via on-device speech only (Amendment n)
    pets,
    lock: null,
    active: 'p1',
    profiles: { p1: freshProfile() },
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function capName(s) {
  if (typeof s !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const clean = s.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').replace(/^\s+/, '');
  return Array.from(clean).slice(0, NAME_MAX).join('');
}

const clampInt = (n, lo, hi, dflt) => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : dflt);

// Resolve a saved level against the game ladder (Amendment m8). Fills missing at/topAt from position.
export function normalizeLevel(p, game) {
  const ladder = game && Array.isArray(game.ladder) ? game.ladder : [];
  if (!ladder.length) return freshLevel(game);
  if (!isObj(p)) return freshLevel(game);
  return resolveLevel(ladder, p);
}

export function normalizeBook(list, ids = catalog) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const x of list) if (typeof x === 'string' && ids.includes(x) && !out.includes(x)) out.push(x);
  return out;
}

export function normalizeSeen(obj, letters = enabledLetters) {
  const out = {};
  if (!isObj(obj)) return out;
  for (const id of letters) {
    const n = Object.prototype.hasOwnProperty.call(obj, id) ? obj[id] : 0;
    if (/^[a-z]$/.test(id) && Number.isInteger(n) && n > 0) out[id] = Math.min(n, 99999);
  }
  return out;
}

export function normalizeLock(lock) {
  if (!isObj(lock)) return null;
  if (lock.alg !== LOCK_ALG) return null;
  if (lock.iter !== LOCK_ITER) return null;
  if (typeof lock.salt !== 'string' || typeof lock.hash !== 'string') return null;
  if (!lock.salt || !lock.hash) return null;
  return { alg: LOCK_ALG, iter: LOCK_ITER, salt: lock.salt, hash: lock.hash };
}

function normalizeProfile(p, { letters = enabledLetters, book = catalog } = {}) {
  const out = freshProfile();
  if (!isObj(p)) return out;
  out.name = capName(p.name).trim();
  out.book = normalizeBook(p.book, book);
  out.seenLetters = normalizeSeen(p.seenLetters, letters);
  if (isObj(p.levels)) {
    for (const id of GAME_IDS) {
      const g = gamesList.find((x) => x.id === id);
      if (!g || g.noLevels) continue;
      out.levels[id] = normalizeLevel(p.levels[id], g);
    }
  }
  return out;
}

// Map a v2 activity-keyed levels object onto game-keyed levels (Amendment m2 revised).
export function mapLevelsFromV2(oldLevels) {
  const levels = {};
  const old = isObj(oldLevels) ? oldLevels : {};
  for (const id of GAME_IDS) {
    const g = gamesList.find((x) => x.id === id);
    if (!g || g.noLevels) continue;
    const act = primaryAct(g);
    if (!act || !Object.hasOwn(LEVEL_MAX, act)) {
      levels[id] = freshLevel(g);
      continue;
    }
    const prev = isObj(old[act]) ? old[act] : null;
    const oldLv = prev ? clampInt(prev.lv, 1, LEVEL_MAX[act], 1) : 1;
    const oldTop = prev ? Math.max(oldLv, clampInt(prev.top, 1, LEVEL_MAX[act], 1)) : 1;
    const lv = mapOldLevel(g.ladder, act, oldLv);
    const top = Math.max(lv, mapOldLevel(g.ladder, act, oldTop));
    const keys = keysForLevel(g.ladder, lv, top);
    levels[id] = { lv, top, good: 0, at: keys.at, topAt: keys.topAt };
  }
  return levels;
}

function migrateV2(obj, opts) {
  const s = defaults();
  if (isObj(obj.pets)) {
    for (const id of PET_IDS) {
      const p = obj.pets[id];
      if (!isObj(p)) continue;
      s.pets[id] = { on: p.on !== false, name: capName(p.name).trim() };
    }
  }
  if (typeof obj.sound === 'boolean') s.sound = obj.sound;
  const p1 = freshProfile();
  p1.book = normalizeBook(obj.book, opts.book);
  p1.seenLetters = normalizeSeen(obj.seenLetters, opts.letters);
  p1.levels = mapLevelsFromV2(obj.levels);
  s.profiles = { p1 };
  s.active = 'p1';
  s.lock = null;
  return s;
}

function migrateV1(obj, opts) {
  // reuse the old v1→v2 path, then v2→v3
  const v2 = {
    v: 2,
    pets: obj.pets,
    sound: obj.sound,
    levels: {},
    book: undefined,
    seenLetters: obj.seenLetters,
  };
  for (const id of ACT_IDS) v2.levels[id] = freshLevel();
  const n = clampInt(obj.countLevel, 1, LEVEL_MAX.count, 1);
  v2.levels.count = { lv: n, top: n, good: 0 };
  v2.book = (opts.book || catalog).slice(0, Math.min(clampInt(obj.stickers, 0, STICKER_MAX, 0), (opts.book || catalog).length));
  return migrateV2(v2, opts);
}

export function normalize(obj, { letters = enabledLetters, book = catalog } = {}) {
  const opts = { letters, book };
  if (!isObj(obj)) return defaults();
  const v1 = obj.v === 1 || obj.v === undefined;
  if (v1) return migrateV1(obj, opts);
  if (obj.v === 2) return migrateV2(obj, opts);
  if (obj.v !== VERSION) return defaults(); // future/unknown starts fresh

  const s = defaults();
  if (isObj(obj.pets)) {
    for (const id of PET_IDS) {
      const p = obj.pets[id];
      if (!isObj(p)) continue;
      s.pets[id] = { on: p.on !== false, name: capName(p.name).trim() };
    }
  }
  if (typeof obj.sound === 'boolean') s.sound = obj.sound;
  if (typeof obj.intros === 'boolean') s.intros = obj.intros;
  if (typeof obj.sayNames === 'boolean') s.sayNames = obj.sayNames;
  s.lock = normalizeLock(obj.lock);

  const profiles = {};
  if (isObj(obj.profiles)) {
    for (const id of PROFILE_IDS) {
      if (!isObj(obj.profiles[id])) continue;
      profiles[id] = normalizeProfile(obj.profiles[id], opts);
    }
  }
  if (!Object.keys(profiles).length) profiles.p1 = freshProfile();
  s.profiles = profiles;
  s.active = (typeof obj.active === 'string' && profiles[obj.active]) ? obj.active : Object.keys(profiles)[0];
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

// The active profile (falls back to the first). Mutating the returned object mutates state.
export function activeProfile(state) {
  if (!state || !isObj(state.profiles)) return freshProfile();
  const id = state.active && state.profiles[state.active] ? state.active : Object.keys(state.profiles)[0];
  return state.profiles[id] || freshProfile();
}

export function resetProfileProgress(state) {
  const p = activeProfile(state);
  const name = p.name;
  const fresh = freshProfile(name);
  p.levels = fresh.levels;
  p.book = [];
  p.seenLetters = {};
  return state;
}

export const PHOTO_DB_NAME = 'gg-photos';
export function deletePhotoDB(env = globalThis) {
  return new Promise((resolve) => {
    try {
      const idb = env.indexedDB;
      if (!idb) { resolve(false); return; }
      const r = idb.deleteDatabase(PHOTO_DB_NAME);
      r.onsuccess = () => resolve(true);
      r.onerror = () => resolve(false);
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
