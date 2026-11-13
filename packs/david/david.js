// David's Sheep Count: felt-and-stitch play screen; no timer, score or fail. Lines are the approved-for-build
// text for the ids this round uses (DAVID-04 ships without its "(reuse number clips)" build note);
// speakLocal speaks the text, and the clip map stays null until a later data-only change names a
// recorded clip for a line, no code change.
import { h, drawing } from '../../js/dom.js';
import { topBar } from '../../js/ui.js';
import { roundEnd } from '../../js/reward.js';
import { speakLocal, cancelSpeech } from '../../js/character.js';

const CLIPS = { 'DAVID-01': null, 'DAVID-03': null, 'DAVID-04': null, 'DAVID-10': null, 'DAVID-17': null, 'DAVID-18': null, 'DAVID-20': null };
const TEXT = {
  'DAVID-01': 'This is David. He takes care of sheep!',
  'DAVID-03': 'Tap each sheep through the gate.',
  'DAVID-04': 'One! … Two! … Three!',
  'DAVID-10': 'Great counting!',
  'DAVID-17': 'God is our Good Shepherd.',
  'DAVID-18': 'He looks for every one of us.',
  'DAVID-20': 'Thank you, God, for taking care of us!',
};
export const lineText = (id) => { if (!Object.hasOwn(CLIPS, id)) throw new Error(`unknown line ${id}`); return TEXT[id]; };

export function createRound() {
  return { sheep: ['sheep1', 'sheep2', 'sheep3'].map((id) => ({ id, tapped: false })), phase: 'counting' };
}
export function tapSheep(state, id) {
  if (state.phase !== 'counting') return { state, events: [] };
  const found = state.sheep.find((s) => s.id === id);
  if (!found || found.tapped) return { state, events: [] };
  const sheep = state.sheep.map((s) => (s.id === id ? { ...s, tapped: true } : s));
  const done = sheep.every((s) => s.tapped);
  const events = [{ lineId: 'DAVID-04' }];
  if (done) events.push({ lineId: 'DAVID-10' }, { lineId: 'DAVID-17' }, { lineId: 'DAVID-18' }, { lineId: 'DAVID-20' });
  return { state: { ...state, sheep, phase: done ? 'done' : 'counting' }, events };
}

function voice(ctx, ids) {
  const list = ids.filter(Boolean);
  if (!list.length) return Promise.resolve();
  const clips = list.map((id) => (Object.hasOwn(CLIPS, id) ? CLIPS[id] : null)).filter(Boolean);
  if (clips.length === list.length && ctx.audio) { ctx.audio.fx(clips); return Promise.resolve(); }
  return new Promise((resolve) => {
    const text = list.map(lineText).join(' ');
    const u = speakLocal(text);
    if (!u) { resolve(); return; }
    let t, ended;
    const done = () => { if (ended) return; ended = true; clearTimeout(t); cancelSpeech(); resolve(); };
    t = setTimeout(done, 8000);
    u.onstart = () => { if (ended) return; clearTimeout(t); const words = text.trim().split(/\s+/).filter(Boolean).length; t = setTimeout(done, Math.max(8000, words * 500 + 3000)); };
    u.onend = u.onerror = done;
  });
}
// A second tap within 400 ms of the last one is ignored, so a quick double tap counts once.
let tapAt = -Infinity;
const once = (fn) => () => { const t = Date.now(); if (t - tapAt < 400) return; tapAt = t; fn(); };
const btn = (onclick) => h('button', { type: 'button', class: 'dv-s', 'aria-label': 'Sheep', onclick: once(onclick) });
const SPOSE = { sheep1: 'front', sheep2: 'walk', sheep3: 'side' };

// Felt vocabulary: stitch, puff, bead eyes, stitched smile, rosy cheeks, warm light from the upper left.
const INK = '#4A3426';
const WOOL = '#FFF6E8';
const FACE = '#F0C4A0';
const SKIN = '#E8B896';
const HAIR = '#6B3E22';
const TUNIC = '#EBD5B3';
const CHEEK = '#F09990';
const WOOD = '#8B5A2B';
const WOODL = '#A86C38';
const WOODD = '#6E4320';
const GRASS = '#5DBB63';
const GRL = '#7ED07A';
const GRD = '#3E9A4A';
const WARM = '#FFE9A8';
const GOLD = '#FFD54A';
const N = { stroke: 'none' };
const FR = 'Q14 0 12-1Q11-4 9-6Q7-1 5-2Q3-6 1-7Q-1-2-3-2Q-5-6-7-6Q-9-1-11-1Q-12-4-14-4';
const CAP = `M-18 6C-22-4-19-17-9-21C-3-24 7-24 13-20C20-15 22-4 18 6Q17 0 15-4${FR}Q-16 0-18 6Z`;
const kidsOf = (k) => {
  const out = [];
  for (const x of k) {
    if (x == null || x === false) continue;
    if (Array.isArray(x) && typeof x[0] !== 'string') out.push(...kidsOf(x));
    else out.push(x);
  }
  return out;
};
const el = (t, a = {}, ...k) => [t, a, ...kidsOf(k)];
const g = (a, ...k) => (a && typeof a === 'object' && !Array.isArray(a) ? el('g', a, ...k) : el('g', {}, a, ...k));
const C = (cx, cy, r, fill, extra = {}) => el('circle', { cx, cy, r, fill, stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round', ...extra });
const E = (cx, cy, rx, ry, fill, extra = {}) => el('ellipse', { cx, cy, rx, ry, fill, stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round', ...extra });
const P = (d, fill, extra = {}) => el('path', { d, fill, stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
const L = (d, stroke = INK, w = 1.2) => el('path', { d, fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const dash = (d, c = '#6B5340', w = 0.85) => el('path', { d, fill: 'none', stroke: c, 'stroke-width': w, 'stroke-dasharray': '2.4 1.8', 'stroke-linecap': 'round' });
const eye = (x, y, r = 2.5) => g(C(x, y, r, '#2B1D14', N), C(x - r * 0.32, y - r * 0.38, r * 0.36, '#fff', N));
const smile = (x, y, w = 10) => L(`M${x - w / 2} ${y}q${w / 2} ${w * 0.32} ${w} 0`, INK, 1.2);
const cheek = (x, y, r = 3.2) => C(x, y, r, CHEEK, { ...N, opacity: 0.75 });
const glow = (cx, cy, rx, ry) => E(cx, cy, rx, ry, '#fff', { ...N, opacity: 0.38 });
const shadow = (cx, cy, rx, ry) => E(cx, cy, rx, ry, '#2A4A28', { ...N, opacity: 0.22 });
const ring = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0-${r * 2} 0`;
const ering = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0-${rx * 2} 0`;
const HOOF = '#5C3A22';

// Puff: a radial gradient, lighter upper-left darker lower-right (warm light), reused across many
// shapes of the same hue in one SVG. gradientUnits default (objectBoundingBox) means one def
// adapts to each shape's own box, so a handful of ids per drawing is enough; uidN keeps ids
// unique across sheep/david/world groups that may share one <svg> or sit in sibling SVGs.
let uidN = 0;
const grad = (c0, c1, cx = '.3', cy = '.26', r = '.8') => {
  const id = `pf${uidN++}`;
  return [id, el('radialGradient', { id, cx, cy, r }, el('stop', { offset: '0', 'stop-color': c0 }), el('stop', { offset: '1', 'stop-color': c1 }))];
};

const defs = el('defs', {},
  el('linearGradient', { id: 'dvSky', x1: 0, y1: 0, x2: 0, y2: 1 },
    el('stop', { offset: '0', 'stop-color': '#F0B268' }),
    el('stop', { offset: '.5', 'stop-color': '#FBDFA8' }),
    el('stop', { offset: '1', 'stop-color': '#FFF4E0' })),
  el('radialGradient', { id: 'dvSun', cx: '.2', cy: '.12', r: '.58' },
    el('stop', { offset: '0', 'stop-color': WARM, 'stop-opacity': '.95' }),
    el('stop', { offset: '1', 'stop-color': WARM, 'stop-opacity': '0' })),
  el('radialGradient', { id: 'dvWood', cx: '.3', cy: '.22', r: '.85' },
    el('stop', { offset: '0', 'stop-color': WOODL }), el('stop', { offset: '1', 'stop-color': WOOD })),
  el('radialGradient', { id: 'dvHillFar', cx: '.32', cy: '.2', r: '.9' },
    el('stop', { offset: '0', 'stop-color': '#DCEAC4' }), el('stop', { offset: '1', 'stop-color': '#B2CC96' })),
  el('radialGradient', { id: 'dvHillMid', cx: '.32', cy: '.2', r: '.9' },
    el('stop', { offset: '0', 'stop-color': '#9FDD8E' }), el('stop', { offset: '1', 'stop-color': '#6FB955' })),
  el('radialGradient', { id: 'dvGrass', cx: '.3', cy: '.18', r: '.95' },
    el('stop', { offset: '0', 'stop-color': '#8FDE86' }), el('stop', { offset: '1', 'stop-color': GRASS })),
  el('radialGradient', { id: 'dvGrassD', cx: '.3', cy: '.18', r: '.95' },
    el('stop', { offset: '0', 'stop-color': GRASS }), el('stop', { offset: '1', 'stop-color': GRD })),
  el('radialGradient', { id: 'dvLeafA', cx: '.3', cy: '.26', r: '.8' },
    el('stop', { offset: '0', 'stop-color': '#6BC96A' }), el('stop', { offset: '1', 'stop-color': GRD })),
  el('radialGradient', { id: 'dvLeafB', cx: '.3', cy: '.26', r: '.8' },
    el('stop', { offset: '0', 'stop-color': '#8ED87E' }), el('stop', { offset: '1', 'stop-color': GRASS })),
  el('radialGradient', { id: 'dvLeafC', cx: '.3', cy: '.26', r: '.8' },
    el('stop', { offset: '0', 'stop-color': '#A8E890' }), el('stop', { offset: '1', 'stop-color': GRL })),
  el('radialGradient', { id: 'dvTrunk', cx: '.28', cy: '.2', r: '.85' },
    el('stop', { offset: '0', 'stop-color': WOODL }), el('stop', { offset: '1', 'stop-color': WOODD })),
);

function bush(x, y, s = 1, leaf = 'dvLeafA') {
  const fill = `url(#${leaf})`;
  const puffs = [[0, 0, 14], [-13, 7, 11], [13, 7, 12], [-6, 12, 9], [7, 13, 9]];
  return g({ transform: `translate(${x} ${y}) scale(${s})` },
    shadow(0, 18, 18, 5),
    puffs.map(([cx, cy, r], i) => C(cx, cy, r, fill, i ? N : { 'stroke-width': 0.9 })),
    dash(ring(0, 6, 14), '#4A7A40', 0.7),
    glow(-6, -4, 6, 3.5));
}

function tree() {
  const balls = [[-18, 8, 18, 'dvLeafA'], [18, 10, 19, 'dvLeafB'], [0, -18, 20, 'dvLeafC'], [-22, 22, 13, 'dvLeafA'], [22, 24, 14, 'dvLeafB'], [2, 10, 15, 'dvLeafC'], [-10, -4, 13, 'dvLeafC'], [12, -6, 12, 'dvLeafB']];
  return g({ transform: 'translate(64 268)' },
    shadow(4, 96, 28, 8),
    P('M-9 16C-12 50 -13 78 -8 98H10C15 78 13 50 9 16Z', 'url(#dvTrunk)', { 'stroke-width': 0.95 }),
    dash('M-3 28V90M5 30V88', WOODL, 0.8),
    balls.map(([cx, cy, r, f]) => g(C(cx, cy, r, `url(#${f})`, { 'stroke-width': 0.75 }), dash(ring(cx, cy, r - 2.4), '#4A7A40', 0.55), glow(cx - 5, cy - 6, 5, 3))));
}

function post(x, y, h) {
  // Thick stuffed capsule post, about twice the rail thickness, with its own puff and ground shadow.
  return g({},
    shadow(x + 12, y + h + 2, 15, 5),
    el('rect', { x, y: y + 7, width: 24, height: h - 7, rx: 12, fill: 'url(#dvWood)', stroke: INK, 'stroke-width': 1.1 }),
    E(x + 12, y + 10, 13, 11, 'url(#dvWood)', { 'stroke-width': 1 }),
    dash(`M${x + 7} ${y + 18}V${y + h - 10}`, WOODL, 0.75),
    glow(x + 6, y + 20, 5, 10));
}
function rail(x, y, w) {
  return g({},
    el('rect', { x, y, width: w, height: 13, rx: 6, fill: 'url(#dvWood)', stroke: INK, 'stroke-width': 1.05 }),
    dash(`M${x + 8} ${y + 6.5}h${w - 16}`, WOODL, 0.65),
    glow(x + w * 0.28, y + 4, w * 0.18, 3));
}

function gate() {
  // Left and right fence with a walk-through gap; two rails a side, gate rails swung open into the pen.
  return g({ transform: 'translate(200 250)' },
    shadow(74, 134, 116, 13),
    post(-36, 10, 124),
    rail(-26, 28, 68),
    rail(-26, 64, 68),
    post(36, 8, 128),
    g({ transform: 'rotate(32 48 136)' },
      rail(52, 44, 28),
      rail(52, 86, 28)),
    post(124, 8, 128),
    rail(134, 28, 52),
    rail(134, 64, 52),
    post(180, 6, 130));
}

export function sheep(pose = 'side') {
  // Felt lamb: nubbly wool cluster (not one blob), forward muzzle, teardrop ears, four legs
  // with hoof tips, bead eyes with sparkle, stitched smile, rosy cheeks. 'walk' flips to face
  // right (toward the gate); 'front' pulls the legs and head toward center for a front stand.
  const ds = [];
  const fill = (c0, c1, cx, cy, r) => { const [id, def] = grad(c0, c1, cx, cy, r); ds.push(def); return `url(#${id})`; };
  const wf = fill('#FFFDF6', '#E6D7B4');
  const ff = fill('#F8D3B2', '#DCA47C');
  const lf = fill('#D9AD7C', '#A9764A');
  const front = pose === 'front';
  const dx = front ? 10 : 0;
  const legX = front ? [42, 54, 70, 82] : [34, 48, 66, 80];
  const legs = legX.map((x) => g({},
    el('rect', { x: x - 4.5, y: 80, width: 9, height: 16, rx: 4.5, fill: lf, stroke: INK, 'stroke-width': 0.85 }),
    E(x, 95, 4.6, 2.6, HOOF, { 'stroke-width': 0.6 })));
  const wool = [[40, 58, 15], [84, 58, 15], [62, 42, 17], [48, 46, 13], [76, 46, 13], [62, 68, 15], [96, 58, 12], [54, 70, 11], [72, 70, 11], [30, 68, 10]]
    .map(([cx, cy, r]) => g(C(cx, cy, r, wf, N), dash(`M${cx - r * 0.7} ${cy}a${r * 0.7} ${r * 0.7} 0 0 1 ${r * 0.7}-${r * 0.7}`, '#D4C4A4', 0.7)));
  const body = g({},
    el('defs', {}, ds),
    shadow(60, 96, 30, 7),
    C(98, 60, 9, wf, { 'stroke-width': 0.75 }),
    legs,
    E(64, 62, 34, 22, wf, { 'stroke-width': 1 }),
    wool,
    E(22 + dx, 56, 9, 5.5, ff, { 'stroke-width': 0.8, transform: `rotate(-30 ${22 + dx} 56)` }),
    E(22 + dx, 56, 4.8, 2.6, '#F3B09A', { ...N, transform: `rotate(-30 ${22 + dx} 56)` }),
    E(33 + dx, 48, 8, 4.8, ff, { 'stroke-width': 0.8, transform: `rotate(34 ${33 + dx} 48)` }),
    E(33 + dx, 48, 4.2, 2.4, '#F3B09A', { ...N, transform: `rotate(34 ${33 + dx} 48)` }),
    E(34 + dx, 62, 14, 14.5, ff, { 'stroke-width': 0.95 }),
    E(25 + dx, 67, 6.5, 5, ff, { 'stroke-width': 0.8 }),
    glow(30 + dx, 54, 6, 3.5),
    eye(29 + dx, 60, 2.45),
    eye(40 + dx, 60, 2.45),
    cheek(27 + dx, 66, 2.8),
    cheek(42 + dx, 66, 2.8),
    P(`M${22.5 + dx} 66h3l-1.5 2Z`, INK, N),
    smile(24 + dx, 70, 7),
    glow(60, 48, 10, 6));
  return pose === 'walk' ? g({ transform: 'translate(124 0) scale(-1 1)' }, body) : body;
}

function davidHead() {
  // Coiled yarn-loop hair sits on the crown only, so a band of bare forehead shows above the eyes.
  const ds = [];
  const fill = (c0, c1, cx, cy, r) => { const [id, def] = grad(c0, c1, cx, cy, r); ds.push(def); return `url(#${id})`; };
  const hf = fill('#8B5A3C', HAIR);
  const ff = fill('#FFE0C0', FACE);
  return g({},
    el('defs', {}, ds),
    C(-16, 8, 5, ff, { 'stroke-width': 0.8 }),
    C(16, 8, 5, ff, { 'stroke-width': 0.8 }),
    C(0, 9, 17, ff),
    glow(-7, 1, 6, 4),
    P('M-3-22q1-5 6-6q-2 3 0 5M5-22q3-3 7-2q-3 1-3 4', hf, { 'stroke-width': 0.9 }),
    P(CAP, hf, { 'stroke-width': 0.95 }),
    el('path', { d: `M15-4${FR}`, fill: 'none', stroke: '#4E2A14', 'stroke-width': 2, opacity: 0.45, 'stroke-linecap': 'round', transform: 'translate(0 -1)' }),
    dash('M-13-12q5-7 13-7M-15-4q3-6 9-9M3-17q7 0 10 6M8-12q4 2 6 8M-6-11q2-4 6-5', '#A8774F', 0.7),
    E(-7, -15, 5, 2.5, '#fff', { ...N, opacity: 0.22 }),
    eye(-6, 7, 2.3),
    eye(6, 7, 2.3),
    cheek(-10, 15, 2),
    cheek(10, 15, 2),
    C(0, 15, 1.3, '#B98463', N),
    smile(1, 18, 8),
    L('M-9 2q2.5-1.5 5 0M4 2q2.5-1.5 5 0', HAIR, 1.6));
}

function crook() {
  // Grip point is local (0,0); a hand circle drawn on top of the stick reads as "held".
  return g({},
    L('M0 16V-82', WOODD, 7),
    P('M0 -82C0 -100 22 -102 22 -86C22 -76 9 -76 9 -86', WOODD, { fill: 'none', 'stroke-width': 7, 'stroke-linecap': 'round' }),
    L('M-1.8 12V-78', WOODL, 2),
    dash('M0.5 10V-78', '#B5793F', 0.8));
}

export function david(pose) {
  // Young shepherd: coiled-loop hair, tan tunic with a stitched V neck, rope belt with a knot,
  // capsule arms/legs, mitten hands, rounded boots, a thick crook held in the hand (not behind it).
  const ds = [];
  const fill = (c0, c1, cx, cy, r) => { const [id, def] = grad(c0, c1, cx, cy, r); ds.push(def); return `url(#${id})`; };
  const tf = fill('#F7E6C4', TUNIC);
  const sf = fill('#F6CBA8', SKIN);
  const wf = fill(WOODL, WOOD);
  const lg = fill('#B08B60', '#8A6844');
  const belt = g({},
    el('rect', { x: -18, y: 16, width: 36, height: 7, rx: 3.5, fill: wf, stroke: INK, 'stroke-width': 0.85 }),
    dash('M-14 19.5h28', WOODL, 0.6),
    E(-2, 19.5, 5, 3.2, WOODD, { 'stroke-width': 0.7 }),
    E(4, 20.5, 4.2, 2.8, WOODD, { 'stroke-width': 0.7 }));
  if (pose === 'hug') {
    return g({},
      el('defs', {}, ds),
      shadow(0, 66, 42, 9),
      E(-22, 52, 15, 11, lg, { 'stroke-width': 1 }),
      E(22, 52, 15, 11, lg, { 'stroke-width': 1 }),
      E(-26, 62, 9, 7, wf, { 'stroke-width': 0.9 }),
      E(26, 62, 9, 7, wf, { 'stroke-width': 0.9 }),
      P('M-21 -4C-24 16 -23 34 -18 42H18C23 34 24 16 21 -4Z', tf),
      dash('M-13 2C-15 18 -14 32 -10 37H10C14 32 15 18 13 2', '#D4C09A', 0.7),
      L('M-4 -2L0 5L4 -2', '#C9A876', 1),
      g({ transform: 'translate(0 14)' }, belt),
      g({ transform: 'translate(0 -32) scale(1.12)' }, davidHead()));
  }
  return g({},
    el('defs', {}, ds),
    shadow(2, 90, 26, 8),
    g({ transform: 'translate(-26 30) rotate(-8) scale(0.92)' }, crook()),
    E(-12, 83, 8, 6, wf, { 'stroke-width': 0.9 }),
    E(13, 83, 8, 6, wf, { 'stroke-width': 0.9 }),
    el('rect', { x: -19, y: 86, width: 14, height: 4, rx: 2, fill: WOODD, stroke: INK, 'stroke-width': 0.8 }),
    el('rect', { x: 6, y: 86, width: 14, height: 4, rx: 2, fill: WOODD, stroke: INK, 'stroke-width': 0.8 }),
    el('rect', { x: -17, y: 42, width: 14, height: 42, rx: 7, fill: lg, stroke: INK, 'stroke-width': 1 }),
    el('rect', { x: 4, y: 42, width: 14, height: 42, rx: 7, fill: lg, stroke: INK, 'stroke-width': 1 }),
    dash('M-13 46V80M10 46V80', '#6E4F33', 0.7),
    P('M-20 -2C-22 18 -21 36 -17 44H18C22 36 22 18 20 -2Z', tf),
    dash('M-13 4C-15 20 -14 34 -10 39H11C15 34 15 20 13 4', '#D4C09A', 0.7),
    L('M-4 0L0 7L4 0', '#C9A876', 1),
    belt,
    P('M-16 0C-31 10 -33 30 -28 39C-21 31 -12 18 -8 6Z', sf),
    P('M16 0C31 10 33 30 28 39C21 31 12 18 8 6Z', sf),
    dash('M-26 12C-28 20 -28 28 -26 34', '#C98F66', 0.55),
    dash('M26 12C28 20 28 28 26 34', '#C98F66', 0.55),
    E(-18, 5, 8, 7, tf, { 'stroke-width': 0.9 }),
    E(18, 5, 8, 7, tf, { 'stroke-width': 0.9 }),
    C(-28, 38, 6.5, sf, { 'stroke-width': 0.85 }),
    C(28, 38, 6.5, sf, { 'stroke-width': 0.85 }),
    g({ transform: 'translate(0 -26) scale(1.12)' }, davidHead()));
}

function hills() {
  // Back to front: pale cool far hill, mid hill, then two grass bands; each puffed and stitched.
  return g({},
    el('rect', { x: 0, y: 0, width: 360, height: 480, fill: 'url(#dvSky)', ...N }),
    el('rect', { x: 0, y: 0, width: 360, height: 300, fill: 'url(#dvSun)', ...N }),
    E(80, 214, 150, 36, 'url(#dvHillFar)', { 'stroke-width': 0.8 }),
    dash(ering(80, 214, 143, 29), '#8FAE78', 0.7),
    E(282, 224, 118, 38, 'url(#dvHillFar)', { 'stroke-width': 0.8 }),
    dash(ering(282, 224, 111, 31), '#8FAE78', 0.7),
    glow(34, 198, 36, 9),
    E(190, 250, 172, 48, 'url(#dvHillMid)', { 'stroke-width': 0.9 }),
    dash(ering(190, 250, 164, 40), '#5C9A42', 0.8),
    glow(138, 222, 44, 11),
    P('M-30 280Q50 198 140 238Q210 206 290 248Q350 216 400 260V500H-30Z', 'url(#dvGrass)', { 'stroke-width': 0.6 }),
    dash('M-30 280Q50 198 140 238Q210 206 290 248Q350 216 400 260', GRD, 1.15),
    glow(90, 254, 40, 12),
    P('M-30 348Q90 286 170 324Q250 292 390 338V500H-30Z', 'url(#dvGrassD)', { 'stroke-width': 0.6 }),
    dash('M-30 348Q90 286 170 324Q250 292 390 338', '#2E7A38', 1.2),
    glow(130, 318, 34, 9));
}

function tufts() {
  return g({},
    bush(36, 428, 1.15, 'dvLeafA'),
    bush(108, 444, 0.85, 'dvLeafB'),
    bush(328, 430, 1.05, 'dvLeafA'),
    bush(168, 452, 0.7, 'dvLeafC'),
    C(58, 454, 9, '#C4A882', { 'stroke-width': 0.8 }),
    glow(55, 451, 3, 2),
    C(54, 450, 6, '#B8906A', N),
    C(300, 458, 8, '#C4A882', { 'stroke-width': 0.8 }),
    glow(297, 455, 3, 2));
}

export function scene(inPen) {
  const penAt = [[166, 244], [204, 252], [242, 246]];
  return g({},
    defs,
    hills(),
    tree(),
    bush(128, 262, 0.72, 'dvLeafA'),
    bush(178, 250, 0.55, 'dvLeafB'),
    bush(338, 258, 0.65, 'dvLeafA'),
    // penned sheep stand behind the rails, so the fence masks their legs
    inPen.map((id, i) => g({ transform: `translate(${penAt[i][0]} ${penAt[i][1]}) scale(0.65)` }, sheep())),
    gate(),
    g({ transform: 'translate(318 320) scale(1.08)' }, david('stand')),
    tufts());
}

function star(x, y, R) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? R * 0.42 : R;
    pts.push(`${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`);
  }
  return g({}, P(`M${pts.join('L')}Z`, GOLD, { 'stroke-width': 0.75 }), dash(`M${pts.join('L')}Z`, '#E0B430', 0.5), glow(x - R * 0.15, y - R * 0.15, R * 0.28, R * 0.22));
}

function ringPts() {
  const cx = 180, cy = 300, rx = 150, ry = 84;
  return [-90, -54, -18, 18, 54, 126, 162, 198, 234].map((a) => {
    const r = (a * Math.PI) / 180;
    return [cx + rx * Math.cos(r), cy + ry * Math.sin(r)];
  });
}
function postAt([x, y], h) { return post(x - 12, y - h, h); }
function ringSeg([x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), a = (Math.atan2(dy, dx) * 180) / Math.PI;
  return g({ transform: `translate(${x1} ${y1}) rotate(${a.toFixed(1)})` }, rail(-4, -50, len + 8), rail(-4, -26, len + 8));
}
function archGate(x, yB, w, h) {
  // Arched felt door: two-plank stitch, a soft puff, and a rope-loop latch.
  const r = w / 2, yT = yB - h, yA = yT - r;
  return g({},
    shadow(x + r, yB + 4, r + 8, 5),
    P(`M${x} ${yB}V${yT}Q${x} ${yA} ${x + r} ${yA}Q${x + w} ${yA} ${x + w} ${yT}V${yB}Z`, 'url(#dvWood)', { 'stroke-width': 1.1 }),
    dash(`M${x + r * 0.5} ${yA + r * 0.5}V${yB - 6}M${x + r * 1.5} ${yA + r * 0.5}V${yB - 6}`, WOODL, 0.7),
    glow(x + r * 0.45, yA + r * 0.5, r * 0.35, h * 0.22),
    C(x + 14, yB - h * 0.42, 7, WOODD, { 'stroke-width': 0.9 }),
    el('circle', { cx: x + 14, cy: yB - h * 0.42, r: 3.6, fill: 'none', stroke: INK, 'stroke-width': 1 }),
    C(x + 14, yB - h * 0.42, 2, WOOD, N));
}

function cloud(x, y, s) {
  return g({ transform: `translate(${x} ${y}) scale(${s})` },
    C(-16, 4, 16, '#FFFDF6', N),
    C(16, 6, 15, '#FFFDF6', N),
    C(0, -6, 18, '#FFFDF6', { 'stroke-width': 0.9 }),
    C(0, 8, 16, '#FFFDF6', N),
    C(-16, 4, 16, 'none', { fill: 'none', 'stroke-width': 0.85 }),
    C(16, 6, 15, 'none', { fill: 'none', 'stroke-width': 0.85 }),
    dash('M-28 4q6-22 28-24q16 0 28 16', '#E8DCC0', 0.7),
    glow(-8, -8, 8, 4));
}

export function hug() {
  // David hugs his sheep inside the closed ring pen. The far arc sits behind the hug (seen slightly
  // from above); the near row and arched gate sit in front, legs tucked just behind the rail. God
  // is never drawn, only warm light.
  const pts = ringPts();
  const far = [0, 1, 2, 7, 8];
  const farRails = [[0, 1], [1, 2], [7, 8], [8, 0]];
  return g({},
    defs,
    el('rect', { x: 0, y: 0, width: 360, height: 480, fill: '#F6D7A8', ...N }),
    el('rect', { x: 0, y: 0, width: 360, height: 480, fill: 'url(#dvSun)', ...N }),
    [-36, -18, 0, 18, 36].map((a) => P('M180 -20L156 300H204Z', '#FFF6D6', { ...N, opacity: 0.5, transform: `rotate(${a} 180 -20)` })),
    E(180, 250, 120, 90, '#FFF1C4', { ...N, opacity: 0.45 }),
    cloud(66, 60, 1.05),
    cloud(296, 68, 0.9),
    cloud(186, 36, 0.55),
    star(150, 60, 14),
    star(224, 96, 11),
    star(46, 138, 9),
    star(318, 142, 10),
    star(254, 40, 8),
    // green floor inside the ring, with flower dots and grass ticks
    E(180, 302, 142, 80, 'url(#dvGrass)', { 'stroke-width': 1.1 }),
    dash(ering(180, 302, 134, 72), GRD, 1),
    glow(128, 264, 32, 14),
    C(116, 318, 3, '#F2A3B0', N), C(116, 318, 1.3, GOLD, N),
    C(242, 310, 2.6, '#FFF8C4', N), C(242, 310, 1.1, GOLD, N),
    C(150, 350, 2.6, '#F2A3B0', N), C(150, 350, 1.1, GOLD, N),
    L('M138 332q2-6 0-10', GRD, 1), L('M230 326q-2-6 0-10', GRD, 1),
    bush(40, 268, 0.55, 'dvLeafB'),
    bush(320, 268, 0.55, 'dvLeafA'),
    // far side of the ring, behind the hug
    farRails.map(([a, b]) => ringSeg(pts[a], pts[b])),
    far.map((i) => postAt(pts[i], 68)),
    g({ transform: 'translate(88 250) scale(0.95) rotate(-16)' }, crook()),
    g({ transform: 'translate(180 292) scale(1.28)' }, david('hug')),
    // three sheep in his arms, in front of the tunic, clearly visible
    g({ transform: 'translate(102 292) scale(0.72)' }, sheep()),
    g({ transform: 'translate(154 312) scale(0.58)' }, sheep()),
    g({ transform: 'translate(198 288) scale(0.72) scale(-1 1) translate(-100 0)' }, sheep()),
    // his arms reach round all three, mitten hands resting on the outer fleece
    [[1, 'M156 290C132 296 120 312 126 326'], [-1, 'M204 290C228 296 240 312 234 326']].map(([k, d]) => g({},
      L(d, INK, 13), L(d, SKIN, 11), dash(d, '#C98F66', 0.6),
      C(180 - k * 52, 326, 7.5, SKIN, { 'stroke-width': 1 }), glow(178 - k * 52, 323, 3, 2))),
    // near side of the ring, in front of the hug, with the closed arched gate and a tan path
    g({ transform: 'translate(36 352)' },
      post(0, 0, 86),
      rail(10, 28, 88),
      rail(10, 60, 88),
      post(92, 0, 86),
      archGate(114, 90, 54, 48),
      post(176, 0, 86),
      rail(188, 28, 88),
      rail(188, 60, 88),
      post(270, 0, 86)),
    P('M170 438L154 480H206L190 438Z', '#D9B98A'));
}


function view(tree, kids = []) {
  return h('div', { class: 'dv' }, h('div', { class: 'dv-box' }, drawing(tree, { cls: 'dv-scene', box: '0 0 360 480' }), ...kids));
}

export async function ready() {
  const href = './packs/david/david.css';
  if (!document.querySelector(`link[href="${href}"]`)) await new Promise((ok) => { const k = Object.assign(document.createElement('link'), { rel: 'stylesheet', href }); k.onload = k.onerror = ok; document.head.append(k); });
  return { render };
}
export function render(ctx) {
  const stage = h('div', {});
  const main = h('main', { class: 'kid', 'data-game': 'david' }, topBar(ctx), stage);
  let state = createRound();
  function draw() {
    if (state.phase === 'done') { main.replaceWith(roundEnd(ctx, { act: { id: 'david' }, got: [], leveledUp: false, playAgain: () => { tapAt = -Infinity; ctx.refresh(); } })); return; }
    const free = state.sheep.filter((s) => !s.tapped);
    const inPen = state.sheep.filter((s) => s.tapped).map((s) => s.id);
    stage.replaceChildren(
      view(scene(inPen), free.map((s) => {
        const b = btn(() => act(tapSheep(state, s.id)));
        b.setAttribute('data-id', s.id);
        b.append(drawing(sheep(SPOSE[s.id]), { box: '0 0 100 100' }));
        return b;
      })),
    );
  }
  function act(result) {
    state = result.state;
    const lines = result.events.map((e) => e.lineId);
    if (state.phase === 'done') {
      stage.replaceChildren(view(hug()));
      voice(ctx, lines).then(draw);
      return;
    }
    voice(ctx, lines);
    draw();
  }
  voice(ctx, ['DAVID-01', 'DAVID-03']);
  draw();
  return main;
}

