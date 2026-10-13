// Pizza Kitchen data and drawings. Food words: only the f7 pizza allowlist. No timer, score or losing.
const INK = '#4A3426';
const C = (cx, cy, r, fill, o = {}) => ['circle', { cx, cy, r, fill, stroke: INK, 'stroke-width': 3, ...o }];
const E = (cx, cy, rx, ry, fill, o = {}) => ['ellipse', { cx, cy, rx, ry, fill, stroke: INK, 'stroke-width': 3, ...o }];
const R = (x, y, w, hh, fill, o = {}) => ['rect', { x, y, width: w, height: hh, rx: 6, fill, stroke: INK, 'stroke-width': 3, ...o }];
const P = (d, fill, o = {}) => ['path', { d, fill, stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', ...o }];
const g = (...k) => ['g', {}, ...k];

export const STEPS = ['base', 'sauce', 'cheese', 'toppings', 'bake', 'slice', 'serve'];
export const BASES = [{ id: 'round', label: 'Round crust' }, { id: 'square', label: 'Square crust' }];
export const SAUCES = [{ id: 'red', label: 'Red sauce', fill: '#E5484D' }, { id: 'orange', label: 'Orange sauce', fill: '#F28C28' }];
export const CHEESES = [{ id: 'lots', label: 'Lots of cheese', n: 14 }, { id: 'little', label: 'A little cheese', n: 6 }];
export const TOPPINGS = 'pepperoni olives mushrooms peppers pineapple tomato ham spinach onion corn'.split(' ').map((id) => ({ id, label: id }));
export const EATERS = ['friendDino', 'friendSilly', 'friendBerry'];
// Voice 0 clips that ship; counting reuses n-1..n-20. Bite and orders: original friends only.
export const CLIPS = { pick: 'fx-pop', land: 'fx-pop', match: 'c-great', bake: 'fx-chime', bite: 'fx-mmm', done: 'c-yay1', slice: 'fx-zoom' };
export const numClip = (n) => `n-${n}`;
const WORDS = ['one', 'two', 'three', 'four', 'five'];
export const countWord = (n) => WORDS[n - 1] || String(n);

// Dad's settings: max 3-5, toppings off (one stays on), who orders.
export function pizzaPrefs(o) {
  const p = o && typeof o === 'object' ? o : {};
  const ids = TOPPINGS.map((t) => t.id);
  const off = Array.isArray(p.off) ? ids.filter((id) => p.off.includes(id)) : [];
  return { max: [3, 4, 5].includes(p.max) ? p.max : 3, off: off.length < ids.length ? off : [], who: EATERS.includes(p.who) ? p.who : '' };
}

// Orders: L1 one topping 1-3; L2 two toppings 1-3; L3 two up to Dad's max, half and half.
export function makeOrder(level = 1, prefs = pizzaPrefs(), rand = Math.random) {
  const pool = TOPPINGS.filter((t) => !prefs.off.includes(t.id));
  const kinds = level >= 2 && pool.length > 1 ? 2 : 1;
  const top = level >= 3 ? prefs.max : Math.min(3, prefs.max);
  const out = [];
  while (out.length < kinds) {
    const t = pool[Math.floor(rand() * pool.length)];
    if (!out.some((o) => o.id === t.id)) out.push({ id: t.id, label: t.label, n: 1 + Math.floor(rand() * top), side: level >= 3 ? (out.length ? 'R' : 'L') : '' });
  }
  return out;
}
const one = (o) => `${o.n} ${o.label}${o.side ? (o.side === 'L' ? ' on this side' : ' on that side') : ''}`;
export const orderText = (order) => `Put on ${order.map(one).join(' and ')}!`;
export const countOf = (o, pieces) => pieces.filter((p) => p.id === o.id && (!o.side || (o.side === 'L') === (p.x < 60))).length;
export const matched = (order, pieces) => order.every((o) => countOf(o, pieces) === o.n);

const T = {
  pepperoni: () => C(0, 0, 7, '#C8323A'),
  olives: () => C(0, 0, 5.5, '#3B3B3B', { 'stroke-width': 2 }),
  mushrooms: () => P('M-7 1a7 6 0 0 1 14 0zM-2 1h4v6h-4z', '#D9C3A5', { 'stroke-width': 2 }),
  peppers: () => P('M-7 -2q7-6 14 0q-7 3-14 0z', '#5DBB63', { 'stroke-width': 2 }),
  pineapple: () => P('M-6 -5h12l-3 10h-6z', '#FFD54A', { 'stroke-width': 2 }),
  tomato: () => C(0, 0, 6.5, '#F06A5A', { 'stroke-width': 2 }),
  ham: () => R(-6, -5, 12, 10, '#F4A6B0', { rx: 2, 'stroke-width': 2 }),
  spinach: () => E(0, 0, 7, 4, '#2F8F46', { 'stroke-width': 2 }),
  onion: () => C(0, 0, 5, 'none', { stroke: '#B784C9', 'stroke-width': 3 }),
  corn: () => C(0, 0, 3.5, '#F5C518', { 'stroke-width': 1.5 }),
};
// About 1/6 of the pie across, over the cheese, ink outline and a contact shadow.
export const toppingArt = (id, x = 0, y = 0) => ['g', { transform: `translate(${x} ${y}) scale(1.15)` }, ['ellipse', { cx: 1, cy: 5, rx: 7, ry: 3, fill: '#000', opacity: 0.18 }], (T[id] || T.corn)()];
export const TOPPING_ART_IDS = Object.keys(T);

// Tap-placed spots; side L/R keeps a piece on its half.
export function spot(i, side = '') {
  const a = i * 2.4, r = 12 + ((i * 7) % 26);
  let x = 60 + Math.cos(a) * r;
  if (side && (side === 'L') !== (x < 60)) x = 120 - x;
  return [x, 60 + Math.sin(a) * r];
}
export const SAUCE_FULL = 1e3; // dabs value meaning "covered"
// Coverage: a 6x6 grid over the sauce area; a dab marks the cells near it. Auto-fill at about 70%.
export function cover(set, x, y, r = 14) {
  for (let i = 0; i < 36; i++) if (Math.hypot(30 + (i % 6) * 12 - x, 30 + ((i / 6) | 0) * 12 - y) < r) set.add(i);
  return set.size / 36 >= 0.7;
}

export function pieArt(p) {
  const sq = p.base === 'square';
  const crust = sq ? R(14, 14, 92, 92, '#E8B86B', { rx: 14 }) : C(60, 60, 48, '#E8B86B');
  const fill = p.sauce && SAUCES.find((s) => s.id === p.sauce).fill;
  const sauce = !fill ? [] : p.dabs >= SAUCE_FULL ? [sq ? R(22, 22, 76, 76, fill, { rx: 10, 'stroke-width': 0 }) : C(60, 60, 40, fill, { 'stroke-width': 0 })]
    : (p.spread || []).map(([x, y]) => C(x, y, 11, fill, { 'stroke-width': 0 }));
  // cheese: loose thin shreds, clipped to the sauce area so sauce shows between them and nothing hangs over the crust
  const loose = (p.shreds || []).filter(([x, y], i, a) => a.findIndex(([u, v]) => Math.hypot(u - x, v - y) < 7) === i).slice(0, 26);
  const cheese = loose.length ? [['clipPath', { id: 'pzc' }, sq ? R(22, 22, 76, 76, 0, { rx: 10 }) : C(60, 60, 40, 0)],
    ['g', { 'clip-path': 'url(#pzc)' }, ...loose.map(([x, y], i) => E(x, y, 5, 1.6, '#FFE9A0', { 'stroke-width': 0, transform: `rotate(${i * 37} ${x} ${y})` }))]] : [];
  const half = p.half ? [['path', { d: 'M60 14V106', stroke: '#FFF8E7', 'stroke-width': 2, 'stroke-dasharray': '4 4' }]] : [];
  const tops = (p.pieces || []).map((q) => toppingArt(q.id, q.x, q.y));
  const bake = p.baked ? [C(60, 60, sq ? 54 : 50, 'none', { stroke: '#FFB347', 'stroke-width': 4, opacity: 0.7 })] : [];
  // slicing: dashed guides, then 4 slices with a gap between them
  const cuts = p.guides || p.sliced ? [0, 90].map((a) => ['path', p.sliced ? { d: 'M60 8V112', stroke: '#FFF4E0', 'stroke-width': 5, transform: `rotate(${a} 60 60)` }
    : { d: 'M60 8V112', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '5 5', transform: `rotate(${a} 60 60)` }]) : [];
  // the bite: a wavy notch out of the crust in the background colour, crumbs fall and fade
  const B = sq ? [[76, 14], [88, 14], [100, 14]] : [-62, -45, -28].map((a) => [60 + 48 * Math.cos(a * Math.PI / 180), 60 + 48 * Math.sin(a * Math.PI / 180)]);
  const bite = p.bitten ? [...B.map(([x, y]) => C(x, y, 8, '#FFF4E0', { 'stroke-width': 0 })),
    ['clipPath', { id: 'pzb' }, sq ? R(14, 14, 92, 92, 0, { rx: 14 }) : C(60, 60, 48, 0)],
    ['g', { 'clip-path': 'url(#pzb)' }, ...B.map(([x, y]) => C(x, y, 8, 'none'))],
    ...[[96, 52], [104, 60], [88, 58]].map(([x, y]) => C(x, y, 2, '#E8B86B', { 'stroke-width': 1, class: 'pz-crumb' }))] : [];
  return g(crust, ...sauce, ...cheese, ...half, ...tops, ...bake, ...cuts, ...bite);
}
export const fullPie = (base, sauce, cheese) => ({ base, sauce, dabs: SAUCE_FULL, shreds: cheese ? Array.from({ length: cheese === 'lots' ? 14 : 6 }, (_, i) => spot(i + 40)) : [] });

export const ovenArt = (on) => g(R(10, 20, 100, 84, '#B9B2AA'), R(22, 40, 76, 50, on ? '#FFB347' : '#5B4A40'),
  C(30, 30, 4, '#4A3426', { 'stroke-width': 0 }), C(44, 30, 4, '#4A3426', { 'stroke-width': 0 }));
export const tileArt = () => g(C(50, 50, 40, '#E8B86B'), C(50, 50, 33, '#E5484D', { 'stroke-width': 0 }),
  ...[[38, 40], [60, 38], [50, 60], [36, 62], [64, 60]].map(([x, y]) => toppingArt('pepperoni', x, y)));
