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
const OUCH = 'M50 24V8M24 36L12 24M76 36l12-12';
const MUD = '#C9A66B'; const MUDO = { stroke: '#A8834A', 'stroke-width': 2.5, 'stroke-linejoin': 'round' };
export const CARE_ART = {
  // a light tan mud splash: a flat splat with drip tails and specks; some carry a little green leaf
  mud: (leaf) => g(P('M22 44q-6-12 8-14q4-12 18-8q10-8 20 2q14-2 12 12q10 8 0 16q2 10-8 10l-2 12q-3 4-6 0l-1-10q-6 2-10-2l-2 16q-3 4-6 0l-1-16q-10 0-10-10q-12-2-12-8z', MUD, MUDO),
    C(14, 28, 3, MUD, MUDO), C(86, 30, 2.5, MUD, MUDO), C(84, 70, 2, MUD, MUDO), C(20, 70, 2.5, MUD, MUDO),
    leaf ? P('M44 40q10-12 22-6q-8 12-22 6z', '#7CC36B', { stroke: '#3F9A4A', 'stroke-width': 2 }) : null),
  // a cartoon bump (a bonk): a light pink circle on the fur with short ouch lines around it
  // a white halo under the circle and the lines keeps it clear on dark fur (black or chocolate dogs)
  bump: (_, o = OUCH) => g(C(50, 58, 29, '#FFFFFF', N), ['path', { d: o, stroke: '#FFFFFF', 'stroke-width': 12, 'stroke-linecap': 'round' }],
    C(50, 58, 24, '#FBD3DD', { stroke: '#D9748F', 'stroke-width': 4 }), C(42, 50, 6, '#FFFFFF', N),
    ['path', { d: o, stroke: '#D9748F', 'stroke-width': 6, 'stroke-linecap': 'round' }]),
  // after a spot is cleared: blue drops and sparkles
  shine: () => g(...[[26, 40], [74, 36], [50, 70]].map(([x, y]) => P(`M${x} ${y - 9}q-7 10 0 14q7-4 0-14z`, '#7CC4EE', { stroke: '#4AA3DF', 'stroke-width': 2 })),
    ...[[50, 22, 9], [18, 66, 7], [82, 64, 7]].map(([x, y, r]) => P(`M${x} ${y - r}l${r * 0.3} ${r * 0.7}l${r * 0.7} ${r * 0.3}l-${r * 0.7} ${r * 0.3}l-${r * 0.3} ${r * 0.7}l-${r * 0.3}-${r * 0.7}l-${r * 0.7}-${r * 0.3}l${r * 0.7}-${r * 0.3}z`, '#FFE680', { stroke: '#F2B638', 'stroke-width': 1.5 }))),
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

// sad eyebrows over a pet's own eyes (read from its drawing, 120 x 120): the inner ends lifted; empty when it has none;
// cream on a dark coat (the black and chocolate dogs) so the sad face reads
export const DARK = ['blackDog', 'chocolateDog'];
export function brows(tree, id) {
  const eyes = []; const walk = (t) => { if (!Array.isArray(t)) return; if (typeof t[0] === 'string') { if (t[1] && t[1].class === 'eye' && t[1].r < 3.5) eyes.push([t[1].cx, t[1].cy]); t.slice(2).forEach(walk); } else t.forEach(walk); };
  walk(tree); eyes.sort((a, b) => a[0] - b[0]);
  return eyes.slice(0, 2).map(([x, y], i) => { const s = i ? -1 : 1; return ['path', { d: `M${x - 6 * s} ${y - 6}L${x + 5 * s} ${y - 10}`, stroke: DARK.includes(id) ? '#FFF1D6' : INK, 'stroke-width': 2.5, 'stroke-linecap': 'round', fill: 'none' }]; });
}
