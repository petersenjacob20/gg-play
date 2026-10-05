// Games layer (plan l1, Amendment m): each game is a ladder of activity steps in games.json.
// Pure helpers: which games are built, titles, the primary act for migration, mapping old levels.
export const GAME_IDS = ['letterhunt', 'fetch', 'dig', 'sea', 'farm', 'monster', 'stories'];
export const PROFILE_IDS = ['p1', 'p2', 'p3', 'p4'];
export const PROFILE_MAX = 4;
export const PLAYER_LABEL = 'Player'; // empty name shows as this (Design §12)

// A game is "built" when its first ladder step's act exists in `acts`, or it has its own route (Story Time).
export function isBuilt(game, acts) {
  if (!game) return false;
  if (game.route) return true;
  const first = game.ladder && game.ladder[0];
  return !!(first && acts && Object.hasOwn(acts, first.act));
}

export function builtGames(games, acts) {
  return (games || []).filter((g) => isBuilt(g, acts));
}

export function gameById(games, id) {
  return (games || []).find((g) => g.id === id) || null;
}

// Fill {petId} slots from Dad's typed pet names. If any slot is blank, use titleDefault.
export function gameTitle(game, pets) {
  if (!game) return '';
  const t = game.title || '';
  const slots = [...t.matchAll(/\{([a-zA-Z0-9]+)\}/g)].map((m) => m[1]);
  if (!slots.length) return game.titleDefault || t;
  const names = {};
  for (const id of slots) {
    const n = pets && pets[id] && typeof pets[id].name === 'string' ? pets[id].name.trim() : '';
    if (!n) return game.titleDefault || t;
    names[id] = n;
  }
  return t.replace(/\{([a-zA-Z0-9]+)\}/g, (_, id) => {
    const n = names[id];
    // always add 's, even after an s (Design §11.1)
    return n.endsWith('s') ? `${n}'s` : `${n}'s`;
  }).replace(/'s's\b/g, "'s"); // "{name}'s" already has 's in the template sometimes
}

// Fix double 's if template is "{kitty}'s Letter Hunt" and we substitute "Fluffy's"
export function gameTitleFixed(game, pets) {
  if (!game) return '';
  const t = game.title || '';
  const slots = [...t.matchAll(/\{([a-zA-Z0-9]+)\}/g)].map((m) => m[1]);
  if (!slots.length) return game.titleDefault || t;
  let out = t;
  for (const id of slots) {
    const n = pets && pets[id] && typeof pets[id].name === 'string' ? pets[id].name.trim() : '';
    if (!n) return game.titleDefault || t;
    const poss = /s$/i.test(n) ? `${n}'s` : `${n}'s`;
    out = out.replace(new RegExp(`\\{${id}\\}'s`, 'g'), poss).replace(new RegExp(`\\{${id}\\}`, 'g'), poss);
  }
  return out;
}

// The primary act is the act of the first ladder step (Amendment m2 revised).
export function primaryAct(game) {
  const first = game && game.ladder && game.ladder[0];
  return first ? first.act : null;
}

// Map an old activity level onto a ladder step index (1-based). Exact act+lv match, else the
// highest step of that act with a lower lv, else step 1. good always restarts at 0.
export function mapOldLevel(ladder, actId, oldLv) {
  if (!Array.isArray(ladder) || !ladder.length || !actId) return 1;
  const n = Number.isInteger(oldLv) ? oldLv : 1;
  let exact = -1;
  let lower = -1;
  for (let i = 0; i < ladder.length; i++) {
    const s = ladder[i];
    if (s.act !== actId) continue;
    if (s.lv === n) exact = i;
    if (s.lv < n && (lower < 0 || s.lv > ladder[lower].lv)) lower = i;
  }
  if (exact >= 0) return exact + 1;
  if (lower >= 0) return lower + 1;
  return 1;
}

export function ladderMax(game) {
  if (!game || game.noLevels) return 0;
  return (game.ladder && game.ladder.length) || 0;
}

export function stepAt(game, lv) {
  if (!game || !game.ladder || !game.ladder.length) return null;
  const i = Math.max(0, Math.min(game.ladder.length, Number(lv) || 1) - 1);
  return game.ladder[i];
}

export function displayName(name) {
  const n = typeof name === 'string' ? name.trim() : '';
  return n || PLAYER_LABEL;
}


// Step key (Amendment m8): "act:lv" or "act:mode:lv" (e.g. count:3, add:more2:1).
// Stable across ladder inserts/reorders so her place follows the step, not the index.
export function stepKey(step) {
  if (!step || typeof step.act !== 'string') return '';
  const lv = Number.isInteger(step.lv) ? step.lv : 1;
  const mode = typeof step.mode === 'string' && step.mode ? step.mode : '';
  return mode ? `${step.act}:${mode}:${lv}` : `${step.act}:${lv}`;
}

export function parseStepKey(key) {
  if (typeof key !== 'string' || !key) return null;
  const parts = key.split(':');
  if (parts.length === 2) return { act: parts[0], mode: '', lv: Number(parts[1]) || 1 };
  if (parts.length >= 3) return { act: parts[0], mode: parts[1], lv: Number(parts[parts.length - 1]) || 1 };
  return null;
}

// 1-based ladder index for a saved step key. Exact key → that step; else nearest lower step of the
// same act (by that step's own lv); else 1.
export function resolveStepIndex(ladder, key, fallbackPos = 1) {
  if (!Array.isArray(ladder) || !ladder.length) return 1;
  const max = ladder.length;
  const pos = Math.min(max, Math.max(1, Number.isInteger(fallbackPos) ? fallbackPos : 1));
  if (!key) return pos;
  if (stepKey(ladder[pos - 1]) === key) return pos;
  if (key) {
    for (let i = 0; i < ladder.length; i++) if (stepKey(ladder[i]) === key) return i + 1;
    const parsed = parseStepKey(key);
    if (parsed) {
      let best = -1;
      for (let i = 0; i < ladder.length; i++) {
        const s = ladder[i];
        if (s.act !== parsed.act) continue;
        if (parsed.mode && s.mode !== parsed.mode) continue;
        const slv = Number.isInteger(s.lv) ? s.lv : 1;
        if (slv <= parsed.lv && (best < 0 || slv > (ladder[best].lv || 1))) best = i;
      }
      // if mode was set and nothing matched, retry same act ignoring mode
      if (best < 0 && parsed.mode) {
        for (let i = 0; i < ladder.length; i++) {
          const s = ladder[i];
          if (s.act !== parsed.act) continue;
          const slv = Number.isInteger(s.lv) ? s.lv : 1;
          if (slv <= parsed.lv && (best < 0 || slv > (ladder[best].lv || 1))) best = i;
        }
      }
      if (best >= 0) return best + 1;
    }
  }
  return 1;
}

// Attach at/topAt from the ladder positions (used when writing a level or filling a bare save).
export function keysForLevel(ladder, lv, top) {
  const max = Array.isArray(ladder) ? ladder.length : 0;
  if (!max) return { at: '', topAt: '' };
  const L = Math.min(max, Math.max(1, lv || 1));
  const T = Math.min(max, Math.max(L, top || L));
  return { at: stepKey(ladder[L - 1]), topAt: stepKey(ladder[T - 1]) };
}

// Resolve a saved {lv,top,good,at?,topAt?} against the current ladder (Amendment m8).
export function resolveLevel(ladder, saved) {
  const max = Array.isArray(ladder) && ladder.length ? ladder.length : 1;
  const raw = saved && typeof saved === 'object' ? saved : {};
  let lv = Number.isInteger(raw.lv) ? raw.lv : 1;
  let top = Number.isInteger(raw.top) ? raw.top : lv;
  let at = typeof raw.at === 'string' ? raw.at : '';
  let topAt = typeof raw.topAt === 'string' ? raw.topAt : '';
  // Bare v3 (991d7c3): no keys yet → derive from positions, then resolve (no-op if ladder unchanged).
  if (!at && ladder && ladder[Math.min(max, Math.max(1, lv)) - 1]) at = stepKey(ladder[Math.min(max, Math.max(1, lv)) - 1]);
  if (!topAt && ladder && ladder[Math.min(max, Math.max(1, top)) - 1]) topAt = stepKey(ladder[Math.min(max, Math.max(1, top)) - 1]);
  lv = resolveStepIndex(ladder, at, lv);
  top = Math.max(lv, resolveStepIndex(ladder, topAt, top));
  const keys = keysForLevel(ladder, lv, top);
  return { lv, top, good: raw.good === 1 ? 1 : 0, at: keys.at, topAt: keys.topAt };
}
