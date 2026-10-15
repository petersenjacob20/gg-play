// Pet Care (logic and art only, no DOM, so the tests can load it). Bath: a pet has mud spots; she sprays them with
// the hose (drag it over a spot, or tap a spot) and each spray fades a spot until it is gone. Heal: a pet has little
// pink scuffs; the healer bottle sprays each one away and a bandage pops on. No wrong moves, nothing to lose.
// Original drawings (100 x 100). Pets are the app's own generic ids; names come from petname.js at the screen.
export const LEVELS = { 1: { spots: 3, sprays: 2 }, 2: { spots: 4, sprays: 3 }, 3: { spots: 5, sprays: 3 } };
export const HIT_PX = 60; // a spray lands when the nozzle is this close to a spot centre (generous)
export const SPRAY_MS = 200; // one spray per spot this often while the hose is held over it
const shuffled = (a, rng) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// a pet that is on (Family pets), not the one just played
export function pickPet(pets, state, avoid = null, rng = Math.random) {
  const on = (pets || []).map((p) => p.id).filter((id) => !(state && state.pets && state.pets[id] && state.pets[id].on === false));
  const all = on.length ? on : (pets || []).map((p) => p.id);
  const pool = all.length > 1 ? all.filter((id) => id !== avoid) : all;
  return pool[Math.floor(rng() * pool.length)];
}

// a round: which kind (bath or heal), the pet, and its spots (x, y in % of the pet box), each needing `sprays`
export function makeRound(kind, level, at, pet, rng = Math.random) {
  const L = LEVELS[level] || LEVELS[1];
  return { kind, pet, sprays: L.sprays, spots: shuffled(at, rng).slice(0, L.spots).map(([x, y], i) => ({ i, x, y, left: L.sprays })) };
}

// one spray on spot i: { left, gone, done } or null when that spot is already clean
export function spray(round, i) {
  const s = round.spots[i];
  if (!s || s.left <= 0) return null;
  s.left--;
  return { left: s.left, gone: s.left === 0, done: round.spots.every((x) => x.left === 0) };
}
export const fade = (round, s) => (s.left <= 0 ? 0 : 0.25 + 0.75 * (s.left / round.sprays));

// the nearest spot still there within r px of (x, y), px inside a w x h box; -1 when none
export function hitSpot(round, x, y, w, h, r = HIT_PX) {
  let best = -1, bd = r;
  for (const s of round.spots) {
    if (s.left <= 0) continue;
    const d = Math.hypot((s.x / 100) * w - x, (s.y / 100) * h - y);
    if (d <= bd) { bd = d; best = s.i; }
  }
  return best;
}

// she finished on her own (no Dad show or skip): one level up (until the top); with help, the same level
export function levelAfter(prog, helped, max) {
  const lv0 = Math.min(Math.max(1, (prog && prog.lv) || 1), max);
  const lv = !helped && lv0 < max ? lv0 + 1 : lv0;
  return { lv, top: Math.max(lv, (prog && prog.top) || 1), good: 0, leveledUp: lv > lv0 };
}

const INK = '#4A3426';
const O = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const P = (d, fill, o = O) => ['path', { d, fill, ...o }];
const C = (cx, cy, r, fill, o = O) => ['circle', { cx, cy, r, fill, ...o }];
const g = (...k) => ['g', {}, ...k];
const N = {};
export const CARE_ART = {
  mud: () => g(P('M30 40q4-16 22-14q14-8 22 6q14 4 10 20q6 14-10 18q-8 12-24 4q-18 4-20-12q-12-8 0-22z', '#8A5A34'), C(40, 44, 5, '#A87449', N), C(62, 60, 4, '#6E4526', N)),
  booboo: () => g(P('M28 50q0-14 22-14t22 14q0 14-22 14t-22-14z', '#F7A8B8', { stroke: '#E57A93', 'stroke-width': 3 }),
    ['path', { d: 'M38 46l8 8M48 44l8 8M58 46l6 6', stroke: '#FFFFFF', 'stroke-width': 3, 'stroke-linecap': 'round' }]),
  bandage: () => ['g', { transform: 'rotate(-20 50 50)' }, P('M14 38h72q8 0 8 12t-8 12H14q-8 0-8-12t8-12z', '#F2C994'), P('M36 38h28v24H36z', '#FBE3C2'),
    C(44, 46, 2, '#C99A66', N), C(56, 46, 2, '#C99A66', N), C(44, 54, 2, '#C99A66', N), C(56, 54, 2, '#C99A66', N)],
  hose: () => g(P('M50 96q-30 0-30-18t28-14q22 4 22-14', 'none', { ...O, stroke: '#3F9A4A', 'stroke-width': 12 }), P('M60 52l-4-30h16l-4 30z', '#FFD84A'), P('M54 22h20v-8H54z', '#F29E38'),
    ['path', { d: 'M58 8l-6-6M64 6V0M70 8l6-6', stroke: '#4AA3DF', 'stroke-width': 4, 'stroke-linecap': 'round' }]),
  bottle: () => g(P('M34 46q0-8 8-8h16q8 0 8 8v40q0 8-8 8H42q-8 0-8-8z', '#F7A8B8'), P('M42 38v-12h16v12z', '#FFFFFF'), P('M42 26V16h22l6 6v4z', '#8BD1F0'),
    P('M50 74q-10-8-10-14q0-8 10-4q10-4 10 4q0 6-10 14z', '#FFFFFF', { stroke: '#E57A93', 'stroke-width': 3 }), ['path', { d: 'M74 14l8-6M76 22h10', stroke: '#8BD1F0', 'stroke-width': 4, 'stroke-linecap': 'round' }]),
  tub: () => g(P('M10 48h80v10q0 26-26 26H36q-26 0-26-26z', '#FFFFFF'), P('M20 84l-4 10M80 84l4 10', 'none'), C(30, 40, 9, '#BFE6F7'), C(48, 34, 12, '#BFE6F7'), C(68, 40, 9, '#BFE6F7'), C(60, 22, 6, '#BFE6F7')),
  stars: () => g(...[[14, 20, 9], [84, 16, 11], [90, 70, 8], [10, 76, 10], [50, 6, 7]].map(([x, y, r]) => P(`M${x} ${y - r}l${r * 0.3} ${r * 0.7}l${r * 0.7} ${r * 0.3}l-${r * 0.7} ${r * 0.3}l-${r * 0.3} ${r * 0.7}l-${r * 0.3}-${r * 0.7}l-${r * 0.7}-${r * 0.3}l${r * 0.7}-${r * 0.3}z`, '#FFD84A', { stroke: '#F29E38', 'stroke-width': 2 }))),
  drops: () => g(...[[30, 30], [52, 18], [72, 32], [40, 54], [64, 56]].map(([x, y]) => P(`M${x} ${y - 8}q-7 10 0 14q7-4 0-14z`, '#7CC4EE', { stroke: '#4AA3DF', 'stroke-width': 2 }))),
};
