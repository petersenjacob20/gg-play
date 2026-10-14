// Grow It! (BUILD-QUEUE; game idea 2026-10-01 §2): put a growing set in order, first, next, last.
// Logic and art only (no DOM), so the tests can load it. L1: 2 steps (egg, chick; seed, plant); L2: all 3;
// L3: the middle one is already in its frame and she fills the ends. Original drawings, 100 x 100.
import { strawberry } from './pets.js';

const INK = '#4A3426';
const O = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const el = (t, a, ...k) => [t, a, ...k];
const g = (...k) => el('g', {}, ...k);
const P = (d, fill) => el('path', { d, fill, ...O });
const C = (cx, cy, r, fill) => el('circle', { cx, cy, r, fill, ...O });
const E = (cx, cy, rx, ry, fill) => el('ellipse', { cx, cy, rx, ry, fill, ...O });
const L = (d, c = INK, w = 3) => el('path', { d, fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round' });
const dot = (cx, cy) => el('circle', { cx, cy, r: 3, fill: INK });
const DIRT = () => P('M12 92Q50 64 88 92Z', '#9A6A43');
const LEAF = '#5DBB63';
const stem = (y) => g(L(`M50 84V${y}`, '#3F9A4A', 5), P('M50 76q-20-2-22-16q16-2 22 12z', LEAF), P('M50 70q20-4 22-18q-18 0-22 14z', LEAF));
const beak = (x, y) => P(`M${x} ${y}l-10 4l10 4z`, '#F29E38');

export const GROW_ART = {
  grSeed: () => g(DIRT(), E(50, 74, 7, 10, '#C98B55')),
  grSprout: () => g(L('M50 84V62', '#3F9A4A', 5), P('M50 66q-16 0-18-12q14-2 18 10z', LEAF), P('M50 64q16-4 18-16q-14 0-18 14z', LEAF), DIRT()),
  grBerry: () => g(stem(34), strawberry(64, 40, 0.42, 2.5), strawberry(34, 52, 0.36, 2.5), DIRT()),
  grTulip: () => g(stem(36), P('M36 22l6 12l8-14l8 14l6-12v18q-14 12-28 0z', '#E8506A'), DIRT()),
  grEgg: () => g(E(50, 72, 9, 4, '#E9D8B4'), E(50, 54, 20, 26, '#FFF8EC')),
  grChick: () => g(L('M42 86v6M58 86v6', '#F29E38', 3), C(50, 66, 22, '#FFD84A'), dot(43, 60), dot(57, 60), P('M45 66l5 7l5-7z', '#F29E38'), P('M30 70q-8-6-4-14q8 4 8 12z', '#FFD84A')),
  grHen: () => g(L('M44 86v6M58 86v6', '#F29E38', 3), E(54, 66, 30, 22, '#FFFFFF'), C(32, 42, 14, '#FFFFFF'),
    P('M24 30q2-10 8-6q4-8 9 0q6-2 4 8z', '#E8506A'), dot(29, 40), beak(19, 40), P('M60 62q14-8 18 6q-12 6-18-6z', '#F2EBDD')),
};

// care time tools: a watering can (plants) and a little dish of corn and peas (the chick)
Object.assign(GROW_ART, {
  grCan: () => g(P('M26 46h38v34q0 6-6 6H32q-6 0-6-6z', '#4AA3DF'), L('M64 54l20-14', '#4AA3DF', 7), P('M80 34l12-4v14z', '#4AA3DF'), L('M34 46q11-16 22 0', INK, 4)),
  grBasket: () => g(L('M28 50q22-34 44 0', '#B98257', 5), P('M20 50h60l-8 34H28z', '#C98B55'), L('M24 62h52M27 74h46', '#8A5A34', 2)),
  grCorn: () => g(P('M18 66h64q-4 18-32 18T18 66z', '#C98B55'), ...[[36, 60], [50, 58], [64, 60], [43, 54], [57, 54]].map(([x, y], i) => C(x, y, 5, i % 2 ? '#7CC36B' : '#FFD84A'))),
});
// L4's weather set (rain, puddle, splash, mud): a cloud with drops, a blue puddle, a splash of drops, a brown mud puddle
const CLOUD = () => P('M24 44q-12 0-12-11t13-11q4-12 18-10q8-8 20-2q14 0 14 13q10 2 9 12q-1 9-11 9z', '#EEF3F8');
const DROP = (x, y) => P(`M${x} ${y}q-6 9 0 12q6-3 0-12z`, '#4AA3DF');
Object.assign(GROW_ART, {
  grRain: () => g(DROP(30, 58), DROP(48, 66), DROP(66, 58), DROP(40, 80), DROP(58, 80), CLOUD()),
  grPuddle: () => g(E(50, 80, 36, 10, '#7CC4EE'), L('M30 78q8-3 16 0', '#FFFFFF', 3)),
  grSplash: () => g(E(50, 82, 34, 9, '#7CC4EE'), L('M50 70V44M36 72l-10-20M64 72l10-20', '#4AA3DF', 5), C(50, 36, 5, '#7CC4EE'), C(24, 46, 4, '#7CC4EE'), C(76, 46, 4, '#7CC4EE')),
  grMud: () => g(E(50, 80, 36, 11, '#8A5A34'), C(36, 76, 3, '#6E4526'), C(60, 82, 4, '#6E4526'), L('M44 72q6-4 12 0', '#B98257', 3)),
});
export const CARE_TAPS = 3; // care time: 3 taps, counted out loud; no score, nothing to get wrong
export const careTool = (set) => (set.id === 'rain' ? null : set.id === 'chick' ? 'grCorn' : 'grCan');
// the care games (game idea §2): water a plant; corn and peas for the chick or gather the hen's eggs; and a guest:
// Puppy fetches a ball or gets a belly rub, or the bunny gets a carrot. tool: what she taps (null: tap the friend);
// who: the friend or what grew in the middle; art: tool art from the app (a) or this pack (g)
export const CARE = {
  water: { tool: 'grCan', on: 'plant', fx: 'fx-splash' },
  corn: { tool: 'grCorn', on: 'chick', fx: 'fx-cheep' },
  eggs: { tool: 'grBasket', on: 'chick', who: 'grHen', fx: 'fx-pop' },
  ball: { tool: 'ball', a: 1, pet: 'puppy', fx: 'fx-woof' },
  rub: { tool: null, pet: 'puppy', fx: 'fx-giggle' },
  carrot: { tool: 'carrot', a: 1, pet: 'bunny', fx: 'fx-mmm' },
};
// the can only waters a plant; corn and eggs only go to the chick/hen set (Design §23.r2)
export function careFits(game, q) { const o = CARE[game] && CARE[game].on; return !o || (o === 'chick') === (q.id === 'chick'); }
export function fitCare(game, q) { return !game || careFits(game, q) ? game : q.id === 'chick' ? 'corn' : 'water'; }
// one care game per set, a different one each time in a round: the middle set gets a guest (and so does a repeat)
export function careFor(round, rng = Math.random) {
  const guests = shuffled(['ball', 'rub', 'carrot'], rng); const used = new Set();
  return round.map((q, i) => {
    let c = q.id === 'rain' ? null : i === 1 ? guests.shift() : q.id === 'chick' ? (rng() < 0.5 ? 'corn' : 'eggs') : 'water';
    if (used.has(c)) c = guests.shift(); // a second plant: a guest instead of watering again
    used.add(c); return c;
  });
}

export const LEVEL_SIZE = { 1: 2, 2: 3, 3: 3, 4: 4 };
export const WORD = ['first', 'next', 'last'];

const shuffled = (a, rng) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// one set: the steps in order, the cards jumbled (never already in order), which frames she fills, and the word for each
export function buildSet(set, level, rng = Math.random) {
  const n = LEVEL_SIZE[level] || 3;
  const steps = n === 2 ? (set.l1 || [0, 1]).map((i) => set.steps[i]) : set.steps.slice(0, n); // L1: a set's own 2 (seed, then the plant)
  let cards = shuffled(steps, rng);
  if (cards.every((c, i) => c === steps[i])) cards = [...cards.slice(1), cards[0]];
  const given = level === 3 ? [1] : [];
  const ask = steps.map((_, i) => i).filter((i) => !given.includes(i));
  return { id: set.id, steps, cards: cards.filter((c) => !given.includes(steps.indexOf(c))), given, ask,
    words: ask.map((i) => (i === 0 ? 'first' : i === n - 1 ? 'last' : 'next')) };
}

// a round: 3 different sets, none the same as the last round's first set
export function buildRound(grow, level, { last = null, rng = Math.random } = {}) {
  if (level >= 4) return buildL4(grow, rng);
  let sets = shuffled(grow.sets.filter((s) => !s.l4), rng);
  if (sets[0].id === last && sets.length > 1) sets = [...sets.slice(1), sets[0]];
  return sets.slice(0, 3).map((s) => buildSet(s, level, rng));
}

// L4: the 4-step weather set in order, then 2 "What happens next?": the first 2 steps shown, 2 endings to pick from
// (the right one and the last step of another set)
export function buildL4(grow, rng = Math.random) {
  const rain = grow.sets.find((s) => s.l4);
  const plain = shuffled(grow.sets.filter((s) => !s.l4), rng);
  // the wrong ending comes from a set that starts differently (a plant's is the hen, the chick's a plant), so only one fits
  const nextQ = (s) => { const o = plain.find((x) => x.steps[0] !== s.steps[0]);
    return { id: s.id, steps: s.steps, given: [0, 1], ask: [2], words: ['what'], cards: shuffled([s.steps[2], o.steps[2]], rng) }; };
  return [buildSet(rain, 4, rng), nextQ(plain[0]), nextQ(plain[1])];
}

// is this card the one for the frame being asked?
export const isRight = (q, ask, card) => q.steps[q.ask[ask]] === card;
