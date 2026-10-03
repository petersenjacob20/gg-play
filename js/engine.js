// Game rules (build plan section 6). Pure functions only: no DOM, no storage. `rng` is any
// function returning a float in [0, 1) so tests can seed it.

export function weightedPick(list, rng = Math.random) {
  const total = list.reduce((s, x) => s + (x.weight > 0 ? x.weight : 0), 0);
  if (!list.length || total <= 0) return null;
  let r = rng() * total;
  for (const x of list) {
    const w = x.weight > 0 ? x.weight : 0;
    if (r < w) return x;
    r -= w;
  }
  return list[list.length - 1];
}

// n different items, weighted, without replacement.
export function weightedSample(list, n, rng = Math.random) {
  const pool = [...list];
  const out = [];
  while (out.length < n && pool.length) {
    const x = weightedPick(pool, rng);
    out.push(x);
    pool.splice(pool.indexOf(x), 1);
  }
  return out;
}

// Pets toggled on in Family pets (all on by default). Friends are always on.
export function activePets(data, state) {
  return data.pets.filter((p) => !state.pets[p.id] || state.pets[p.id].on !== false);
}
export function cast(data, state) {
  return [...activePets(data, state), ...(data.friends || [])];
}

// Home parade: 3 of the pets toggled on; friends fill in when fewer than 3 pets are on.
export function parade(data, state, rng = Math.random, n = 3) {
  const pets = weightedSample(activePets(data, state), n, rng);
  if (pets.length < n) pets.push(...weightedSample(data.friends || [], n - pets.length, rng));
  return pets.map((p) => p.id);
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const ROUND = 5;

// The next target: any item except the last one (never the same target twice in a row).
export function pickTarget(items, lastId, rng = Math.random) {
  const pool = items.length > 1 ? items.filter((x) => x.id !== lastId) : items;
  return pool[Math.floor(rng() * pool.length)];
}

// Letters that never share a round (Design click-through, plan f5 and Amendment g): look-alike shapes
// and sound-alikes are the hardest pairs for young kids. A pair only matters once both of its
// letters are enabled, so each one starts applying on its own when that letter ships. The same list
// lives in activities.json as `neverTogether` (the letters activity reads it from there).
export const NEVER_TOGETHER = [
  ['b', 'd'], ['b', 'p'], ['b', 'q'], ['d', 'p'], ['d', 'q'], ['p', 'q'], ['m', 'n'], ['m', 'w'], ['n', 'u'], ['n', 'h'],
  ['u', 'v'], ['v', 'w'], ['v', 'y'], ['i', 'l'], ['i', 'j'], ['c', 'k'], ['c', 'q'], ['k', 'q'],
  ['e', 'i'], ['o', 'u'], ['f', 'v'], ['s', 'z'], ['t', 'd'], ['k', 'g'], ['c', 'g'],
  ['f', 'x'], // Design must-fix (piece 2): the x prompt ends on "fox", which starts with /f/
];

export function clash(a, b, pairs = NEVER_TOGETHER) {
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

// Every way to pick k items from list (small lists only: letter pools).
function combos(list, k, start = 0, cur = [], out = []) {
  if (cur.length === k) { out.push([...cur]); return out; }
  for (let i = start; i < list.length; i++) { cur.push(list[i]); combos(list, k, i + 1, cur, out); cur.pop(); }
  return out;
}

// n different choices that always include the answer, in random order (the answer moves slot), and
// never both letters of a NEVER_TOGETHER pair. The other n-1 are drawn evenly from every allowed set.
// If the pool is too small for any allowed set, it falls back to the plain draw (never fewer cards).
export function choicesFor(answerId, ids, n = 3, rng = Math.random, pairs = NEVER_TOGETHER) {
  const pool = [...new Set(ids.filter((id) => id !== answerId))];
  const ok = (set) => set.every((x, i) => !clash(x, answerId, pairs) && set.slice(i + 1).every((y) => !clash(x, y, pairs)));
  const allowed = combos(pool, Math.min(n - 1, pool.length)).filter(ok);
  const others = allowed.length ? allowed[Math.floor(rng() * allowed.length)] : shuffle(pool, rng).slice(0, n - 1);
  return shuffle([answerId, ...others], rng);
}

// Who hosts a question: weighted among the pets toggled on plus the friends.
export function host(data, state, rng = Math.random) {
  return weightedPick(cast(data, state), rng);
}

// ---- counting ---------------------------------------------------------------------------------
export const LEVELS_DEFAULT = [{ id: 1, min: 1, max: 5 }, { id: 2, min: 3, max: 10 }, { id: 3, min: 8, max: 20 }];

export function levelFor(levels, id) {
  return levels.find((l) => l.id === id) || levels[0];
}

// How many treats: inside the level's range, never the same number twice in a row.
export function countFor(level, last, rng = Math.random) {
  const all = [];
  for (let n = level.min; n <= level.max; n++) if (n !== last || level.max === level.min) all.push(n);
  return all[Math.floor(rng() * all.length)];
}

// Even answers (plan Amendment d): the right card lands in each slot about 1/3 of the time, and it is
// also the lowest, the middle or the highest number on the cards about 1/3 of the time each, so
// "pick the middle number" never works. rank = how many of the other cards are below the answer.
// Near the ends of a level some ranks are impossible (the level's smallest number can only be the
// lowest), so the other answers lean the other way: rankWeights() balances them (iterative
// proportional fitting over the level's numbers, which come up evenly) so every rank ends up at 1/3.
export function ranksFor(answer, level, n = 3) {
  const out = [];
  for (let r = 0; r < n; r++) if (answer - level.min >= r && level.max - answer >= n - 1 - r) out.push(r);
  return out;
}

const rankCache = new Map();
export function rankWeights(level, n = 3) {
  const key = `${level.min}-${level.max}-${n}`;
  if (rankCache.has(key)) return rankCache.get(key);
  const nums = [];
  for (let k = level.min; k <= level.max; k++) nums.push(k);
  const w = nums.map((k) => Array.from({ length: n }, (_, r) => (ranksFor(k, level, n).includes(r) ? 1 : 0)));
  for (let it = 0; it < 500; it++) {
    for (const row of w) { const t = row.reduce((a, b) => a + b, 0); if (t > 0) row.forEach((x, r) => { row[r] = x / t; }); }
    for (let r = 0; r < n; r++) {
      const col = w.reduce((a, row) => a + row[r], 0);
      if (col > 0) for (const row of w) row[r] *= (nums.length / n) / col;
    }
  }
  for (const row of w) { const t = row.reduce((a, b) => a + b, 0); if (t > 0) row.forEach((x, r) => { row[r] = x / t; }); }
  const out = new Map(nums.map((k, i) => [k, w[i]]));
  rankCache.set(key, out);
  return out;
}

function pickRank(answer, level, rng, n) {
  const ok = ranksFor(answer, level, n);
  if (!ok.length) return null;
  const row = rankWeights(level, n).get(answer);
  if (!row) return ok[Math.floor(rng() * ok.length)];
  let x = rng();
  for (const r of ok) { x -= row[r]; if (x < 0) return r; }
  return ok[ok.length - 1];
}

// The cards closest to the answer on one side (at most NEAR away), `count` of them picked at random.
const NEAR = 3;
function nearSide(answer, level, dir, count, rng) {
  const side = [];
  for (let d = 1; d <= NEAR; d++) { const k = answer + dir * d; if (k >= level.min && k <= level.max) side.push(k); }
  return shuffle(side, rng).slice(0, count);
}

// n different number cards inside the level's range, the answer always included; the others are
// near the answer (so the dots/numerals are worth looking at). The answer's rank among the numbers
// and its slot on screen are both even (see above).
export function numberChoices(answer, level, rng = Math.random, n = 3) {
  const r = pickRank(answer, level, rng, n);
  if (r === null) { // a level too small for n cards: whatever fits
    const pool = [];
    for (let k = level.min; k <= level.max; k++) if (k !== answer) pool.push(k);
    return shuffle([answer, ...shuffle(pool, rng).slice(0, n - 1)], rng);
  }
  const below = nearSide(answer, level, -1, r, rng);
  const above = nearSide(answer, level, +1, n - 1 - r, rng);
  return shuffle([answer, ...below, ...above], rng);
}

// Dot patterns help only while every card has them: if any card in a round is over DOTS_MAX, no card
// shows dots (numerals only), so one bare card is never the easy one to rule out.
export const DOTS_MAX = 10;
export function showDots(nums) {
  return nums.every((k) => k <= DOTS_MAX);
}

// ---- levels (plan f2) -------------------------------------------------------------------------
// One round's result moves the progress { lv, top, good } (saved) plus `rocky` (the rocky-round
// streak, kept in memory only: the plan's saved shape has just lv, top and good).
// - Good round: at least 4 of 5 right on the first tap and no Dad help (Show answer or Skip).
//   Two in a row: lv + 1 (up to max), top = max(top, lv), leveledUp = true.
// - Rocky round: 2 or fewer right on the first tap. Two in a row: lv - 1, never below 1; top stays.
//   Nothing on screen ever says so.
// - Anything else is a middle round and resets both streaks. At the top level she just keeps playing.
const clampLv = (n, max) => Math.min(max, Math.max(1, Number.isInteger(n) ? n : 1));
export function progress(prog, firstTryRight, helped, max) {
  const p = prog || {};
  let lv = clampLv(p.lv, max);
  let top = Math.max(lv, clampLv(p.top, max));
  let good = p.good === 1 ? 1 : 0;
  let rocky = p.rocky === 1 ? 1 : 0;
  let leveledUp = false;
  if (firstTryRight >= 4 && !helped) {
    rocky = 0;
    if (good) {
      good = 0;
      if (lv < max) { lv++; leveledUp = true; }
    } else good = 1;
  } else if (firstTryRight <= 2) {
    good = 0;
    if (rocky) { rocky = 0; lv = Math.max(1, lv - 1); } else rocky = 1;
  } else { good = 0; rocky = 0; }
  top = Math.max(top, lv);
  return { lv, top, good, rocky, leveledUp };
}

// Dad's level picker: any level; it unlocks that level (top never drops) and starts the streaks over.
export function setLevel(prog, n, max) {
  const lv = clampLv(n, max);
  return { lv, top: Math.max(lv, clampLv(prog && prog.top, max)), good: 0, rocky: 0 };
}

// ---- letters by level (plan f5) ----------------------------------------------------------------
// The letters she plays at `level`: every enabled letter whose batch level is at or below it. Levels
// with no new letters yet (piece 1 ships batch 1 only) simply play the letters that exist.
export function letterPool(letters, level) {
  const pool = letters.filter((l) => (l.level || 1) <= level);
  return pool.length ? pool : letters.filter((l) => (l.level || 1) === Math.min(...letters.map((x) => x.level || 1)));
}
// The target: about 60% from the newest batch in the pool, the rest from the older ones; never the
// same letter twice in a row.
export function pickLetter(pool, lastId, rng = Math.random, newShare = 0.6) {
  const top = Math.max(...pool.map((l) => l.level || 1));
  const fresh = pool.filter((l) => (l.level || 1) === top);
  const older = pool.filter((l) => (l.level || 1) < top);
  const from = older.length && rng() >= newShare ? older : fresh;
  return pickTarget(from.length > 1 || !pool.length ? from : pool, lastId, rng);
}

// Any item except `last` (rotation: the same cheer or reaction never twice in a row).
export function pickNot(list, last, rng = Math.random) {
  const pool = list.length > 1 ? list.filter((x) => x !== last) : list;
  return pool[Math.floor(rng() * pool.length)];
}

// ---- adding (plan f5, piece 3b) ---------------------------------------------------------------
// Two groups of the same fruit or veg: the sum is inside the level's range and never the same sum
// twice in a row; each part is at least 1, split evenly at random (L1 sums 2-5, L2 sums 6-10).
export const ADD_LEVELS_DEFAULT = [{ id: 1, min: 2, max: 5 }, { id: 2, min: 6, max: 10 }];
export function partsFor(level, lastSum, rng = Math.random) {
  const sum = countFor({ min: Math.max(2, level.min), max: Math.max(2, level.max) }, lastSum, rng);
  const a = 1 + Math.floor(rng() * (sum - 1));
  return { a, b: sum - a, sum };
}

// ---- fun layer (plan f4, design.md 9.3-9.5) -----------------------------------------------------
// Right-tap reactions: one at random, never the same twice in a row. Ear flop needs drawn floppy
// ears (a bunny or the puppy, never a photo); otherwise another reaction plays.
export const REACTIONS = ['spin', 'boing', 'twirl', 'zoomies', 'starpop', 'earflop'];
export function reactionsFor(who, hasPhoto = false) {
  const floppy = who && !hasPhoto && (who.kind === 'bunny' || who.id === 'puppy');
  return REACTIONS.filter((r) => r !== 'earflop' || floppy);
}
export function pickReaction(last, who, hasPhoto = false, rng = Math.random) {
  return pickNot(reactionsFor(who, hasPhoto), last, rng);
}

// Surprises: about 1 in 8 right answers, at most one per round, never two rounds in a row, never
// while a prompt is talking, never with reduced motion. Returns the surprise or null.
export const SURPRISES = ['zoom', 'sneeze', 'butterfly', 'peekaboo'];
export const SURPRISE_CHANCE = 1 / 8;
export function surpriseRoll(state, rng = Math.random) {
  const s = state || {};
  if (s.thisRound || s.lastRound || s.talking || s.reducedMotion) return null;
  if (rng() >= SURPRISE_CHANCE) return null;
  return pickNot(SURPRISES, s.lastKind, rng);
}

// The box: n stickers she does not own yet, at random (n = 2 after a level-up). Once she owns them
// all, an owned one comes back with a sparkle ({ id, owned: true }). Never the same sticker twice in one box.
export function pickStickers(book, catalog, n = 1, rng = Math.random) {
  const out = [];
  const owned = new Set(book || []);
  for (let i = 0; i < n; i++) {
    const taken = new Set(out.map((x) => x.id));
    const fresh = catalog.filter((id) => !owned.has(id) && !taken.has(id));
    if (fresh.length) { out.push({ id: fresh[Math.floor(rng() * fresh.length)], owned: false }); continue; }
    const again = catalog.filter((id) => !taken.has(id));
    if (again.length) out.push({ id: again[Math.floor(rng() * again.length)], owned: true });
  }
  return out;
}

// Treats (design.md 9.10): a bunny gets the carrot; a dog or cat gets a ball, frisbee, bone, star,
// apple or strawberry; a friend gets one of its own treats. Food is fruit and veg only.
export function treatsFor(who, treats) {
  if (!who) return ['star'];
  if (who.kind === 'bunny') return treats.filter((t) => t.bunnyOnly).map((t) => t.id);
  if (who.kind === 'friend') return (who.treats || ['star']).filter((id) => treats.some((t) => t.id === id && (!t.onlyFor || t.onlyFor === who.id) && !t.bunnyOnly));
  return treats.filter((t) => !t.bunnyOnly && !t.onlyFor).map((t) => t.id);
}
export function treatFor(who, treats, rng = Math.random) {
  const list = treatsFor(who, treats);
  return list.length ? list[Math.floor(rng() * list.length)] : 'star';
}

// Dottie (the counting friend) hosts about half of the counting questions.
export function countHost(data, state, rng = Math.random) {
  const counter = (data.friends || []).find((f) => f.countHost);
  if (counter && rng() < 0.5) return counter;
  return host(data, state, rng);
}

// Treats laid out in rows of 5, like a ten-frame.
export function rowsOf5(n) {
  const rows = [];
  for (let i = 0; i < n; i += 5) rows.push(Math.min(5, n - i));
  return rows;
}

// ---- patterns (plan f5, piece 4) --------------------------------------------------------------
// A little train of 5 or 6 cars at level 1 and always 6 at levels 2-3 (Design fix, piece 4), the last
// one empty, carries a repeating pattern; she picks what
// rides in the empty car from 3 tiles of the same set. L1 AB, L2 AAB or ABB, L3 ABC. The train starts
// at a random point in the pattern (Design, 9.10), so the empty car can be any position of the unit:
// AAB can show as A B A A B with the A missing. `pos` is the answer's position in the unit, `start` the
// position of the first car, `items` which item plays A, B and C. A different set from last time (so never the same answer twice
// in a row); the 3 tiles are the answer, the pattern's other items, then off-pattern items of the set.
export const PATTERN_LEVELS_DEFAULT = [{ id: 1, units: ['AB'], cars: [5, 6] }, { id: 2, units: ['AAB', 'ABB'], cars: [6] }, { id: 3, units: ['ABC'], cars: [6] }];
export function patternFor(level, sets, last, rng = Math.random, cars = level.cars || [6]) {
  const lastSet = last ? sets.find((s) => s.id === last.set) : null;
  const set = pickNot(sets, lastSet, rng);
  const unit = level.units[Math.floor(rng() * level.units.length)];
  const roles = [...new Set(unit)];
  const n = cars[Math.floor(rng() * cars.length)];
  const shown = n - 1;
  const start = Math.floor(rng() * unit.length);
  const pos = (start + shown) % unit.length;
  const answerRole = unit[pos];
  const all = set.items.map((i) => i.id);
  let ids = shuffle(all, rng).slice(0, roles.length);
  const lastAnswer = last ? last.answer : null;
  if (ids[roles.indexOf(answerRole)] === lastAnswer) {
    // only possible when the set did not change (a one-set list): give the answer role another item
    const spare = all.filter((x) => !ids.includes(x));
    const k = roles.indexOf(answerRole);
    if (spare.length) ids[k] = spare[Math.floor(rng() * spare.length)];
    else { const j = (k + 1) % ids.length; [ids[k], ids[j]] = [ids[j], ids[k]]; }
  }
  const item = (role) => ids[roles.indexOf(role)];
  const row = Array.from({ length: shown }, (_, i) => item(unit[(start + i) % unit.length]));
  const answer = item(answerRole);
  const others = shuffle(ids.filter((x) => x !== answer), rng);
  const off = shuffle(all.filter((x) => !ids.includes(x)), rng);
  const choices = shuffle([answer, ...[...others, ...off].slice(0, 2)], rng);
  const items = Object.fromEntries(roles.map((r) => [r, item(r)]));
  return { set: set.id, unit, cars: n, start, pos, items, row, answer, choices };
}
