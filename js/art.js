// Picture-word drawings, treats, the sticker book (sk-*) and the fun-layer pictures (original, simple
// shapes built from shared parts). Plain data trees, viewBox 0 0 100 100 unless noted.
// Food pictures are fruit and veg only (the always-on food guards check every id).
import { drawChar, strawberry } from './pets.js';

const INK = '#4A3426';
const O = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const el = (tag, attrs, ...kids) => [tag, attrs, ...kids];
const g = (...kids) => el('g', {}, ...kids);
const P = (d, fill, extra = {}) => el('path', { d, fill, ...O, ...extra });
const C = (cx, cy, r, fill, extra = {}) => el('circle', { cx, cy, r, fill, ...O, ...extra });
const E = (cx, cy, rx, ry, fill, extra = {}) => el('ellipse', { cx, cy, rx, ry, fill, ...O, ...extra });
const L = (d, color = INK, w = 3) => el('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const dot = (cx, cy, r = 2.6) => el('circle', { cx, cy, r, fill: '#2B1D14' });

function star(cx, cy, R, r, fill) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    pts.push(`${Math.round((cx + rad * Math.cos(a)) * 10) / 10} ${Math.round((cy + rad * Math.sin(a)) * 10) / 10}`);
  }
  return P(`M${pts.join('L')}Z`, fill);
}

// Patterns (piece 4): the plain shapes. One drawing per shape; the colour comes from the set.
function shape(kind, fill) {
  switch (kind) {
    case 'circle': return C(50, 52, 34, fill);
    case 'square': return el('rect', { x: 18, y: 20, width: 64, height: 64, rx: 8, fill, ...O });
    case 'triangle': return P('M50 14L88 84H12Z', fill);
    case 'star': return star(50, 54, 40, 17, fill);
    default: return P('M50 86C28 72 12 58 12 38C12 25 22 16 34 16C42 16 47 21 50 27C53 21 58 16 66 16C78 16 88 25 88 38C88 58 72 72 50 86Z', fill);
  }
}
const PURPLE = '#8E5CC7';

export const ART = {
  moon: () => g(
    P('M58 12A40 40 0 1 0 88 72A32 32 0 1 1 58 12Z', '#FFE27A'),
    star(80, 22, 7, 3, '#FFF1B0'),
    star(86, 44, 4.5, 2, '#FFF1B0')),
  sun: () => g(
    ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => el('path', { d: 'M50 17V6', fill: 'none', stroke: '#F5A524', 'stroke-width': 7, 'stroke-linecap': 'round', transform: `rotate(${a} 50 50)` })),
    C(50, 50, 25, '#FFD54A'),
    dot(42, 46), dot(58, 46),
    L('M42 57q8 7 16 0', INK, 2.5)),
  // Apple (design.md 9.11): round red body with a soft dip at the top, a short brown stem, one green
  // leaf tilted right, a small white shine at the upper left, the 3 px brown outline. No bite, no face.
  apple: () => g(
    P('M46 36q0-12 5-21l5 2q-4 9-4 19z', '#7A4A2A'),
    P('M54 25q8-13 24-9q-7 14-24 9z', '#5DBB63'),
    P('M50 32C38 22 16 26 16 50C16 74 32 90 44 90C48 90 49 87 50 87C51 87 52 90 56 90C68 90 84 74 84 50C84 26 62 22 50 32Z', '#E5484D'),
    el('ellipse', { cx: 31, cy: 43, rx: 4.5, ry: 8.5, fill: '#FFFFFF', opacity: 0.75, transform: 'rotate(22 31 43)' })),
  turtle: () => g(
    E(23, 76, 7, 6, '#9BD47F'),
    E(69, 76, 7, 6, '#9BD47F'),
    P('M8 66l-6 4l8 1z', '#9BD47F', { 'stroke-width': 2.5 }),
    C(84, 56, 11, '#9BD47F'),
    dot(87, 53),
    L('M83 61q3 2 6 0', INK, 2),
    P('M10 68C10 40 26 28 46 28C66 28 80 40 80 68Z', '#5DBB63'),
    L('M28 68l6-16h22l6 16M34 52l-6-10M56 52l6-10M45 52V30', '#3E8E46', 2.5),
    L('M10 68h70', INK, 3)),
  ball: () => g(
    C(50, 50, 34, '#4AA3DF'),
    P('M22 32Q50 48 78 32Q84 42 84 50Q50 68 16 50Q16 42 22 32Z', '#FFD54A', { 'stroke-width': 2.5 }),
    el('ellipse', { cx: 38, cy: 28, rx: 7, ry: 4, fill: '#FFFFFF', opacity: 0.6 })),
  fish: () => g(
    P('M70 50L94 32V68Z', '#3A93C9'),
    P('M44 30q8-12 18-2', '#3A93C9', { 'stroke-width': 2.5 }),
    E(46, 50, 30, 20, '#4AA3DF'),
    el('path', { d: 'M22 56q24 14 48 0q-24 4-48 0z', fill: '#BFE3F7' }),
    dot(30, 45, 3.2), el('circle', { cx: 31, cy: 44, r: 1, fill: '#FFFFFF' }),
    L('M20 55q4 2 7 0', INK, 2)),
  nest: () => g(
    E(36, 48, 10, 13, '#CDE8F6'),
    E(50, 44, 10, 13, '#CDE8F6'),
    E(64, 48, 10, 13, '#CDE8F6'),
    P('M10 52Q50 62 90 52Q86 84 50 86Q14 84 10 52Z', '#B07A44'),
    L('M18 60q16 8 30 2M50 66q16 4 32-6M22 72q14 6 26 4M56 76q12-2 22-10', '#7A4A2A', 2.5)),
  octopus: () => g(
    ...[[20, 0], [32, 1], [44, 0], [56, 1], [68, 0], [80, 1]].map(([x, f]) => {
      const d = `M${x} 56q${f ? 6 : -6} 16 ${f ? -2 : 2} 28`;
      return g(L(d, INK, 12), L(d, '#F28CA0', 6));
    }),
    P('M14 60C14 30 30 14 50 14C70 14 86 30 86 60Z', '#F28CA0'),
    dot(40, 42, 3.2), dot(60, 42, 3.2),
    el('circle', { cx: 41, cy: 41, r: 1.1, fill: '#FFFFFF' }), el('circle', { cx: 61, cy: 41, r: 1.1, fill: '#FFFFFF' }),
    L('M44 51q6 5 12 0', INK, 2.5),
    el('circle', { cx: 31, cy: 50, r: 3.5, fill: '#F7B0C0' }), el('circle', { cx: 69, cy: 50, r: 3.5, fill: '#F7B0C0' })),
  // d is for dog: one of our (drawn) dogs.
  dog: ({ dogId = 'yellowDog' } = {}) => el('g', { transform: 'translate(-6 -10) scale(0.93)' }, drawChar(dogId)),

  // ---- piece 2 letter pictures (plan f5): i igloo, h hat, l lamb, g goat, c cat, e elephant, u umbrella,
  // w whale, j jet, v van, y yo-yo, z zebra, q queen, x fox (r rainbow and k kite are the sticker drawings).
  // Our own simple shapes in the house style: no food words, no show or toy look-alike.
  igloo: () => g(
    P('M10 80A40 40 0 0 1 90 80Z', '#EAF6FD'),
    L('M13 69H87M19 58H81M30 48H70M36 80V69M64 80V69M30 69V58M50 69V58M70 69V58M42 58V48M58 58V48', '#9CCBE6', 2.5),
    P('M38 80V70A12 12 0 0 1 62 70V80Z', '#4A6E8A'),
    L('M4 80H96', INK, 3)),
  hat: () => g(
    E(50, 70, 44, 12, '#F5C04A'),
    P('M26 70C26 40 34 30 50 30C66 30 74 40 74 70Q50 78 26 70Z', '#F5C04A'),
    P('M27 54Q50 60 73 54L74 64Q50 71 26 64Z', '#E5484D', { 'stroke-width': 2.5 }),
    C(66, 60, 5, '#FFFFFF', { 'stroke-width': 2 }), el('circle', { cx: 66, cy: 60, r: 2, fill: '#FFD54A' })),
  // A white woolly lamb: outlined puffs first, then the same puffs unoutlined on top (one outer edge).
  lamb: () => {
    const puffs = [[28, 56], [40, 44], [56, 44], [68, 52], [64, 66], [48, 70], [32, 68]];
    return g(
      ...[30, 44, 58, 68].map((x) => L(`M${x} 66V88`, INK, 7)),
      ...puffs.map(([x, y]) => C(x, y, 13, '#FFFFFF')),
      ...puffs.map(([x, y]) => el('circle', { cx: x, cy: y, r: 11.6, fill: '#FFFFFF' })),
      E(70, 36, 7, 4, '#5B4636', { transform: 'rotate(-30 70 36)' }),
      E(82, 46, 11, 13, '#5B4636'),
      el('circle', { cx: 78, cy: 44, r: 2.4, fill: '#FFFFFF' }), el('circle', { cx: 87, cy: 44, r: 2.4, fill: '#FFFFFF' }),
      el('circle', { cx: 82, cy: 54, r: 2.2, fill: '#F7B0C0' }));
  },
  goat: () => g(
    P('M38 28q-6-14-16-18q8 8 8 20z', '#D9C7A8', { 'stroke-width': 2.5 }),
    P('M62 28q6-14 16-18q-8 8-8 20z', '#D9C7A8', { 'stroke-width': 2.5 }),
    E(22, 40, 14, 6, '#E8DCC8', { transform: 'rotate(-20 22 40)' }), E(78, 40, 14, 6, '#E8DCC8', { transform: 'rotate(20 78 40)' }),
    P('M43 76L50 94L57 76Z', '#E8DCC8', { 'stroke-width': 2.5 }),
    P('M30 34C30 20 70 20 70 34L64 70C62 82 38 82 36 70Z', '#F2EADB'),
    dot(41, 44, 3), dot(59, 44, 3),
    el('circle', { cx: 46, cy: 70, r: 1.8, fill: INK }), el('circle', { cx: 54, cy: 70, r: 1.8, fill: INK }),
    el('circle', { cx: 37, cy: 56, r: 3.5, fill: '#F7B0C0' }), el('circle', { cx: 63, cy: 56, r: 3.5, fill: '#F7B0C0' })),
  // c is for cat: the drawn kitty from the pets (always the drawing, as with the stickers).
  cat: () => el('g', { transform: 'translate(-6 -10) scale(0.93)' }, drawChar('kitty')),
  elephant: () => g(
    P('M26 66H40V90H26Z', '#A7B4C2'), P('M56 66H70V90H56Z', '#A7B4C2'),
    L('M14 52q-6 6-4 14', INK, 3),
    E(44, 56, 32, 22, '#A7B4C2'),
    L('M84 48q10 14 4 28q-2 6 4 8', INK, 12), L('M84 48q10 14 4 28q-2 6 4 8', '#A7B4C2', 6),
    C(74, 40, 16, '#A7B4C2'),
    P('M68 30C54 26 52 54 66 56C70 50 72 40 68 30Z', '#C3CDD8'),
    dot(81, 36, 3), el('circle', { cx: 82, cy: 35, r: 1, fill: '#FFFFFF' })),
  umbrella: () => g(
    L('M50 44V82q0 10-9 10q-8 0-8-8', INK, 4),
    L('M50 12V5', INK, 3.5),
    P('M8 50C8 26 28 12 50 12C72 12 92 26 92 50Q81 42 71 50Q60 42 50 50Q40 42 29 50Q19 42 8 50Z', '#E5484D'),
    el('path', { d: 'M50 12Q36 28 29 50Q40 42 50 50Q60 42 71 50Q64 28 50 12Z', fill: '#FFD54A' }),
    L('M50 12Q36 28 29 50Q40 42 50 50Q60 42 71 50Q64 28 50 12', INK, 2.5)),
  whale: () => g(
    P('M78 56L94 40Q92 54 86 58Q94 62 96 74L78 64Z', '#3F5FA8'),
    P('M8 60C8 36 30 30 50 32C68 34 80 44 82 58C82 72 64 78 44 78C22 78 8 72 8 60Z', '#5677C9'),
    el('path', { d: 'M13 66Q44 80 79 64Q66 76 44 76Q24 76 13 66Z', fill: '#D5DEF5' }),
    P('M42 62q6 10 16 8q-4-8-16-8z', '#3F5FA8', { 'stroke-width': 2.5 }),
    dot(24, 50, 3.2), el('circle', { cx: 25, cy: 49, r: 1, fill: '#FFFFFF' }),
    L('M14 59q6 4 12 2', INK, 2),
    L('M38 26q0-10-7-15M38 26q0-10 7-15M38 26V12', '#7FC4EC', 3.5)),
  jet: () => g(
    P('M50 44L34 18H44L66 44Z', '#9CCBE6'),
    P('M18 46L10 24H20L32 44Z', '#E5484D'),
    P('M10 50C10 44 18 42 28 42H76C88 42 94 47 94 51C94 55 88 60 76 60H28C18 60 10 56 10 50Z', '#FFFFFF'),
    P('M80 45q9 0 11 5H80Z', '#4AA3DF', { 'stroke-width': 2 }),
    ...[36, 46, 56, 66].map((x) => el('circle', { cx: x, cy: 49, r: 2.6, fill: '#4AA3DF' })),
    P('M48 56L32 84H42L66 56Z', '#9CCBE6'),
    L('M24 55H44', '#E5484D', 3)),
  van: () => g(
    P('M8 70V40C8 32 14 28 22 28H62C70 28 76 32 80 40L92 54V70Z', '#5DBB63'),
    P('M16 36H38V52H16Z', '#CDE8F6', { 'stroke-width': 2.5 }),
    P('M44 36H62V52H44Z', '#CDE8F6', { 'stroke-width': 2.5 }),
    P('M68 36Q72 36 76 42L83 52H68Z', '#CDE8F6', { 'stroke-width': 2.5 }),
    L('M8 60H92', '#3E8E46', 2.5),
    el('circle', { cx: 88, cy: 62, r: 3, fill: '#FFD54A' }),
    C(28, 72, 10, '#4A3426'), C(74, 72, 10, '#4A3426'),
    C(28, 72, 4, '#D9D9D9', { 'stroke-width': 2 }), C(74, 72, 4, '#D9D9D9', { 'stroke-width': 2 })),
  'yo-yo': () => g(
    C(50, 9, 4, 'none', { 'stroke-width': 2.5 }),
    L('M50 13V34', INK, 2.5),
    C(50, 62, 30, '#2BB3A3'),
    C(50, 62, 19, '#7FD8CC', { 'stroke-width': 2.5 }),
    C(50, 62, 6, '#FFD54A', { 'stroke-width': 2.5 }),
    el('ellipse', { cx: 36, cy: 48, rx: 6, ry: 3.5, fill: '#FFFFFF', opacity: 0.6, transform: 'rotate(-35 36 48)' })),
  zebra: () => g(
    P('M40 14L44 4L50 11L56 4L60 14Z', '#2B1D14', { 'stroke-width': 2.5 }),
    E(31, 22, 7, 12, '#FFFFFF', { transform: 'rotate(-25 31 22)' }), E(69, 22, 7, 12, '#FFFFFF', { transform: 'rotate(25 69 22)' }),
    P('M30 30C30 12 70 12 70 30L64 78C62 92 38 92 36 78Z', '#FFFFFF'),
    L('M44 20q6 4 12 0M31 31q6 4 11 2M58 33q6 2 11-2M33 52q6 3 11 0M56 52q6 3 11 0M35 64q5 3 10 0M55 64q5 3 10 0', '#2B1D14', 4),
    E(50, 80, 13, 10, '#5B4636'),
    el('circle', { cx: 45, cy: 80, r: 2, fill: '#2B1D14' }), el('circle', { cx: 55, cy: 80, r: 2, fill: '#2B1D14' }),
    dot(41, 42, 3.2), dot(59, 42, 3.2),
    el('circle', { cx: 42, cy: 41, r: 1, fill: '#FFFFFF' }), el('circle', { cx: 60, cy: 41, r: 1, fill: '#FFFFFF' })),
  // A friendly queen: a round face, a gold crown with gems, brown hair and a purple dress.
  queen: () => g(
    P('M24 50C20 22 80 22 76 50L80 82H20Z', '#7A4A2A'),
    P('M18 99C18 78 34 72 50 72C66 72 82 78 82 99Z', '#8E5CC7'),
    C(50, 52, 20, '#F3C9A0'),
    P('M30 48C32 32 68 32 70 48C60 40 40 40 30 48Z', '#7A4A2A'),
    P('M32 34L30 13L40 23L50 8L60 23L70 13L68 34Z', '#FFD54A'),
    el('circle', { cx: 50, cy: 27, r: 3, fill: '#E5484D' }), el('circle', { cx: 39, cy: 29, r: 2.2, fill: '#4AA3DF' }), el('circle', { cx: 61, cy: 29, r: 2.2, fill: '#4AA3DF' }),
    dot(43, 53), dot(57, 53),
    L('M44 61q6 5 12 0', INK, 2.5),
    el('circle', { cx: 37, cy: 59, r: 3.5, fill: '#F7B0C0' }), el('circle', { cx: 63, cy: 59, r: 3.5, fill: '#F7B0C0' })),
  fox: () => {
    const head = 'M16 40C16 26 30 22 50 22C70 22 84 26 84 40C84 54 66 76 50 86C34 76 16 54 16 40Z';
    return g(
      P('M22 40L24 8L46 28Z', '#F28C28'), P('M78 40L76 8L54 28Z', '#F28C28'),
      el('path', { d: 'M27 32L28 16L39 27Z', fill: '#5B4636' }), el('path', { d: 'M73 32L72 16L61 27Z', fill: '#5B4636' }),
      P(head, '#F28C28'),
      el('path', { d: 'M18 46C28 50 42 52 50 64C58 52 72 50 82 46C78 58 64 76 50 86C36 76 22 58 18 46Z', fill: '#FFFFFF' }),
      P(head, 'none'),
      E(50, 79, 5, 4, '#2B1D14', { 'stroke-width': 2 }),
      dot(38, 44, 3.2), dot(62, 44, 3.2),
      el('circle', { cx: 39, cy: 43, r: 1, fill: '#FFFFFF' }), el('circle', { cx: 63, cy: 43, r: 1, fill: '#FFFFFF' }));
  },

  // ---- treats ----
  // A tilted purple toy disc seen from the side: a darker rim under the top, a raised white lip ring
  // and a centre ridge, so small ones read as frisbees (not green slices, and never like food).
  frisbee: () => el('g', { transform: 'rotate(-12 50 52)' },
    P('M10 52a40 15 0 0 0 80 0v6a40 15 0 0 1-80 0z', '#6E45A8'),
    E(50, 52, 40, 15, '#9B6FD6'),
    el('ellipse', { cx: 50, cy: 52, rx: 30, ry: 10.5, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4 }),
    el('ellipse', { cx: 50, cy: 52, rx: 13, ry: 4.5, fill: '#B996E8', stroke: '#6E45A8', 'stroke-width': 2 }),
    el('ellipse', { cx: 30, cy: 46, rx: 7, ry: 2.2, fill: '#FFFFFF', opacity: 0.7 })),
  bone: () => g(
    P('M30 40h40a10 10 0 1 1 10 12a10 10 0 1 1-10 12H30a10 10 0 1 1-10-12a10 10 0 1 1 10-12z', '#FFF6E2')),
  star: () => star(50, 52, 38, 16, '#FFD54A'),
  carrot: () => g(
    P('M50 30q-10-16-4-22q4 8 4 14q2-10 10-14q2 10-6 20q10-6 16-2q-6 8-20 6z', '#5DBB63', { 'stroke-width': 2.5 }),
    P('M36 34Q50 26 64 34L52 92Q50 96 48 92Z', '#F28C28'),
    L('M42 48h6M46 62h6M44 76h4', '#C9631A', 2.5)),
  // Strawberry (design.md 9.8): the shared drawing from pets.js (Berry holds a small one).
  strawberry: () => strawberry(50, 56, 0.98),

  // p is for penguin (design.md 2, Amendment g): a round dark-slate penguin with a white tummy and
  // face, an orange beak and feet, little flippers and dot eyes. Original shapes, no show look-alike.
  penguin: () => g(
    E(38, 91, 10, 5, '#F5A524'), E(62, 91, 10, 5, '#F5A524'),
    P('M25 54q-12 12-9 26q10-4 14-14z', '#2E3A4F'),
    P('M75 54q12 12 9 26q-10-4-14-14z', '#2E3A4F'),
    P('M50 8C30 8 21 28 21 52C21 76 33 90 50 90C67 90 79 76 79 52C79 28 70 8 50 8Z', '#2E3A4F'),
    el('path', { d: 'M50 34C46 24 30 22 31 40C32 48 31 55 31 62C31 78 40 86 50 86C60 86 69 78 69 62C69 55 68 48 69 40C70 22 54 24 50 34Z', fill: '#FFFFFF' }),
    dot(42, 38, 3), dot(58, 38, 3),
    el('circle', { cx: 43, cy: 37, r: 1, fill: '#FFFFFF' }), el('circle', { cx: 59, cy: 37, r: 1, fill: '#FFFFFF' }),
    el('circle', { cx: 36, cy: 47, r: 3.5, fill: '#F7B0C0' }), el('circle', { cx: 64, cy: 47, r: 3.5, fill: '#F7B0C0' }),
    P('M43 44L57 44L50 53Z', '#F5A524', { 'stroke-width': 2.5 })),

  // ---- sticker book pictures (design.md 9.7): fruit and veg ----
  pear: () => g(
    L('M50 26q0-9 4-14', '#7A4A2A', 4),
    P('M53 20q10-10 20-4q-8 10-20 4z', '#5DBB63', { 'stroke-width': 2.5 }),
    P('M50 24C42 24 40 36 40 42C40 50 26 56 26 70C26 84 38 92 50 92C62 92 74 84 74 70C74 56 60 50 60 42C60 36 58 24 50 24Z', '#C9DB5E'),
    el('ellipse', { cx: 38, cy: 66, rx: 4, ry: 8, fill: '#FFFFFF', opacity: 0.6, transform: 'rotate(15 38 66)' })),
  banana: () => g(
    P('M18 34C22 66 50 86 84 74C89 72 89 65 84 65C58 72 34 58 28 32C27 27 17 28 18 34Z', '#FFD54A'),
    L('M28 40C34 58 52 68 74 68', '#E8B730', 2.5),
    P('M18 34l-3-7 8 0 5 5z', '#7A4A2A', { 'stroke-width': 2.5 })),
  grapes: () => g(
    L('M50 22q2-8 8-12', '#7A4A2A', 4),
    P('M54 18q12-8 22 0q-10 8-22 0z', '#5DBB63', { 'stroke-width': 2.5 }),
    ...[[38, 34], [52, 32], [66, 36], [44, 48], [58, 48], [36, 60], [50, 62], [64, 60], [43, 75], [57, 75], [50, 88]].map(([x, y]) => C(x, y, 9, '#8E5CC7', { 'stroke-width': 2.5 })),
    ...[[35, 31], [49, 29], [41, 45], [33, 57]].map(([x, y]) => el('circle', { cx: x, cy: y, r: 2.2, fill: '#FFFFFF', opacity: 0.7 }))),
  orange: () => g(
    C(50, 56, 34, '#F5A524'),
    L('M50 24q0-8 4-12', '#7A4A2A', 4),
    P('M52 22q10-12 22-6q-8 12-22 6z', '#5DBB63', { 'stroke-width': 2.5 }),
    ...[[40, 66], [58, 72], [64, 52], [46, 80]].map(([x, y]) => el('circle', { cx: x, cy: y, r: 1.4, fill: '#D9851A' })),
    el('ellipse', { cx: 36, cy: 44, rx: 5, ry: 8, fill: '#FFFFFF', opacity: 0.6, transform: 'rotate(25 36 44)' })),
  peapod: () => g(
    P('M10 56C26 30 70 26 92 40C80 68 34 78 10 56Z', '#5DBB63'),
    P('M18 54C32 40 66 36 84 42C72 58 40 64 18 54Z', '#9BD47F', { 'stroke-width': 2.5 }),
    C(32, 51, 7, '#B8E58C', { 'stroke-width': 2.5 }), C(49, 48, 7.5, '#B8E58C', { 'stroke-width': 2.5 }), C(66, 46, 7, '#B8E58C', { 'stroke-width': 2.5 }),
    L('M92 40q4-8 0-14', '#3E8E46', 3)),
  watermelon: () => g(
    P('M8 36A42 42 0 0 0 92 36Z', '#5DBB63'),
    el('path', { d: 'M14 36A36 36 0 0 0 86 36Z', fill: '#E9F7D8' }),
    P('M18 36A32 32 0 0 0 82 36Z', '#F2546B', { 'stroke-width': 2.5 }),
    ...[[36, 48], [50, 54], [64, 48], [44, 60], [56, 60]].map(([x, y]) => el('ellipse', { cx: x, cy: y, rx: 1.8, ry: 3, fill: '#4A3426' }))),

  // Tomato (plan f5 adding list): a round red tomato with a green star-shaped top and a white shine.
  tomato: () => g(
    P('M50 30C24 28 12 46 14 62C16 80 32 90 50 90C68 90 84 80 86 62C88 46 76 28 50 30Z', '#E5484D'),
    P('M50 40l-7-9l-11 1l7-7l-8-7l12 2l7-8l7 8l12-2l-8 7l7 7l-11-1z', '#5DBB63', { 'stroke-width': 2.5 }),
    L('M50 26V16', '#3E8E46', 4),
    el('ellipse', { cx: 30, cy: 52, rx: 5, ry: 9, fill: '#FFFFFF', opacity: 0.6, transform: 'rotate(20 30 52)' })),

  // ---- sky and nature ----
  rainbow: () => g(
    ...[['#E5484D', 38], ['#F5A524', 31], ['#FFD54A', 24], ['#5DBB63', 17], ['#4AA3DF', 10]].map(([c, r]) => g(
      el('path', { d: `M${50 - r} 74A${r} ${r} 0 0 1 ${50 + r} 74`, fill: 'none', stroke: INK, 'stroke-width': 10 }),
      el('path', { d: `M${50 - r} 74A${r} ${r} 0 0 1 ${50 + r} 74`, fill: 'none', stroke: c, 'stroke-width': 5 }))),
    P('M4 80c0-8 10-10 14-5c3-6 14-5 14 3c6 0 6 8 0 8H8c-4 0-4-6-4-6z', '#FFFFFF', { 'stroke-width': 2.5 }),
    P('M68 80c0-8 10-10 14-5c3-6 14-5 14 3c6 0 6 8 0 8H72c-4 0-4-6-4-6z', '#FFFFFF', { 'stroke-width': 2.5 })),
  cloud: () => g(
    P('M26 72C12 72 10 54 24 52C24 36 44 32 50 44C56 30 78 34 76 52C90 52 90 72 76 72Z', '#FFFFFF'),
    dot(42, 58, 2.4), dot(58, 58, 2.4),
    L('M45 65q5 4 10 0', INK, 2.2),
    el('circle', { cx: 35, cy: 63, r: 3, fill: '#F7B0C0' }), el('circle', { cx: 65, cy: 63, r: 3, fill: '#F7B0C0' })),
  flower: () => g(
    L('M50 60V94', '#3E8E46', 5),
    P('M50 82q-18-2-22-14q14-2 22 14z', '#5DBB63', { 'stroke-width': 2.5 }),
    ...[0, 72, 144, 216, 288].map((a) => E(50, 22, 11, 15, '#F49AB0', { transform: `rotate(${a} 50 40)` })),
    C(50, 40, 11, '#FFD54A')),
  butterfly: () => g(
    E(32, 36, 18, 15, '#F28C28', { transform: 'rotate(-20 32 36)' }), E(68, 36, 18, 15, '#F28C28', { transform: 'rotate(20 68 36)' }),
    E(36, 64, 13, 12, '#FFD54A', { transform: 'rotate(20 36 64)' }), E(64, 64, 13, 12, '#FFD54A', { transform: 'rotate(-20 64 64)' }),
    el('circle', { cx: 30, cy: 36, r: 5, fill: '#FFF1B0' }), el('circle', { cx: 70, cy: 36, r: 5, fill: '#FFF1B0' }),
    E(50, 50, 6, 24, '#7A4A2A'),
    L('M47 28q-6-12-12-14M53 28q6-12 12-14', INK, 2.5),
    el('circle', { cx: 35, cy: 14, r: 2.6, fill: INK }), el('circle', { cx: 65, cy: 14, r: 2.6, fill: INK })),
  leaf: () => g(
    P('M14 82C14 40 44 14 88 14C88 58 62 86 14 82Z', '#5DBB63'),
    L('M14 82L70 30M34 62h18M46 50l2-16M56 40h16', '#3E8E46', 2.5)),
  ladybug: () => g(
    P('M28 36A22 18 0 0 1 72 36Z', '#2B1D14'),
    C(50, 60, 30, '#E5484D'),
    L('M50 30V90', INK, 3),
    ...[[36, 50], [64, 50], [32, 70], [68, 70], [44, 80], [56, 80]].map(([x, y]) => el('circle', { cx: x, cy: y, r: 5, fill: '#2B1D14' })),
    el('circle', { cx: 42, cy: 30, r: 3, fill: '#FFFFFF' }), el('circle', { cx: 58, cy: 30, r: 3, fill: '#FFFFFF' }),
    el('circle', { cx: 42, cy: 30, r: 1.4, fill: '#2B1D14' }), el('circle', { cx: 58, cy: 30, r: 1.4, fill: '#2B1D14' })),

  // ---- friends and toys ----
  kite: () => g(
    L('M50 78C44 86 56 90 50 98', INK, 2.5),
    P('M47 84l-7-4v8z', '#FFD54A', { 'stroke-width': 2 }), P('M53 92l7-4v8z', '#5DBB63', { 'stroke-width': 2 }),
    P('M50 6L80 40L50 78L20 40Z', '#E5484D'),
    el('path', { d: 'M50 6L80 40L50 40Z', fill: '#4AA3DF' }), el('path', { d: 'M50 40L50 78L20 40Z', fill: '#4AA3DF' }),
    P('M50 6L80 40L50 78L20 40Z', 'none'),
    L('M50 6V78M20 40H80', INK, 2.5)),
  sailboat: () => g(
    L('M6 88q11-6 22 0t22 0t22 0t22 0', '#4AA3DF', 4),
    P('M16 68H84L72 84H28Z', '#E5484D'),
    L('M50 68V12', INK, 3.5),
    P('M53 16L82 62H53Z', '#FFFFFF'),
    P('M47 24L24 62H47Z', '#FFF1B0'),
    P('M50 12l12 4l-12 4z', '#5DBB63', { 'stroke-width': 2 })),
  bubbles: () => g(
    ...[[38, 60, 24], [70, 34, 15], [74, 74, 11], [26, 24, 9]].map(([x, y, r]) => g(
      C(x, y, r, '#CDE8F6', { 'fill-opacity': 0.75 }),
      el('ellipse', { cx: x - r * 0.38, cy: y - r * 0.4, rx: r * 0.22, ry: r * 0.14, fill: '#FFFFFF', transform: `rotate(-35 ${x - r * 0.38} ${y - r * 0.4})` })))),

  // ---- fun layer and home pictures ----
  // The surprise box (design.md 9.5): sky-blue paper, a green bow (gold after a level-up), 3 px outline.
  boxBase: ({ gold = false } = {}) => g(
    P('M18 46H82V92H18Z', '#4AA3DF'),
    el('path', { d: 'M44 46H56V92H44Z', fill: gold ? '#F2C230' : '#5DBB63', stroke: INK, 'stroke-width': 3 })),
  boxLid: ({ gold = false } = {}) => g(
    P('M50 32q-20-22-26-6q2 8 26 6z', gold ? '#F2C230' : '#5DBB63'),
    P('M50 32q20-22 26-6q-2 8-26 6z', gold ? '#F2C230' : '#5DBB63'),
    P('M12 32H88V48H12Z', '#6DB8EA'),
    el('path', { d: 'M44 32H56V48H44Z', fill: gold ? '#F2C230' : '#5DBB63', stroke: INK, 'stroke-width': 3 })),
  // A closed book with a star on the cover (the Sticker book button).
  bookClosed: () => g(
    P('M20 14H78a6 6 0 0 1 6 6V86a6 6 0 0 1-6 6H20Z', '#8E5CC7'),
    P('M20 14H30V92H20Z', '#6E45A8'),
    star(57, 52, 18, 8, '#FFD54A')),
  // An open picture book with a tiny ark and a star (the Stories tile).
  bookOpen: () => g(
    P('M50 30C38 22 20 22 8 26V86C20 82 38 82 50 90C62 82 80 82 92 86V26C80 22 62 22 50 30Z', '#FFFFFF'),
    L('M50 30V90', INK, 3),
    P('M16 62H42L38 72H20Z', '#B07A44', { 'stroke-width': 2.5 }),
    P('M22 62V54H34V62Z', '#F5A524', { 'stroke-width': 2.5 }),
    L('M10 76q6-3 12 0t12 0t12 0', '#4AA3DF', 2.5),
    star(72, 52, 13, 5.5, '#FFD54A')),
  // "=" with a soft sparkle and no numbers (the Adding tile).
  eqSparkle: () => g(
    el('rect', { x: 18, y: 36, width: 50, height: 10, rx: 5, fill: '#F28C28', stroke: INK, 'stroke-width': 3 }),
    el('rect', { x: 18, y: 56, width: 50, height: 10, rx: 5, fill: '#F28C28', stroke: INK, 'stroke-width': 3 }),
    star(82, 26, 10, 4, '#FFD54A'), star(84, 72, 7, 3, '#FFD54A')),
  // A little train (the Patterns tile): the engine, red, blue, red cars and an empty dashed car. viewBox 0 0 200 100.
  // Patterns (piece 4, design.md 9.10): the shapes set is one colour (purple), so only the shape
  // differs; the colours set always pairs a colour with its own shape (never colour alone).
  'sh-circle': () => shape('circle', PURPLE),
  'sh-square': () => shape('square', PURPLE),
  'sh-triangle': () => shape('triangle', PURPLE),
  'sh-star': () => shape('star', PURPLE),
  'sh-heart': () => shape('heart', PURPLE),
  'red-heart': () => shape('heart', '#E5484D'),
  'yellow-star': () => shape('star', '#FFD54A'),
  'blue-circle': () => shape('circle', '#4AA3DF'),
  'green-triangle': () => shape('triangle', '#5DBB63'),
  // The little train's engine, facing left (it leads the train off to the left; Design fix, piece 4).
  trainEngine: () => g(
    P('M26 44H92V82H26Z', '#E5484D'),
    P('M60 16H90V46H60Z', '#4AA3DF'),
    el('rect', { x: 67, y: 23, width: 16, height: 13, rx: 2, fill: '#EAF6FD', stroke: INK, 'stroke-width': 2.5 }),
    P('M26 54H12Q6 54 6 62V82H26Z', '#E5484D'),
    P('M30 26H42V44H30Z', '#4A3426'),
    P('M26 18H46V26H26Z', '#4A3426'),
    C(74, 86, 9, '#4A3426', { 'stroke-width': 2 }), C(42, 86, 9, '#4A3426', { 'stroke-width': 2 }), C(16, 88, 6, '#4A3426', { 'stroke-width': 2 }),
    el('circle', { cx: 74, cy: 86, r: 3, fill: '#F2C230' }), el('circle', { cx: 42, cy: 86, r: 3, fill: '#F2C230' }),
    L('M92 66H100', INK, 4)),
  // Design fix (piece 4): it runs left to right, the engine on the left, then red, blue, red, then the empty car.
  train: () => g(
    P('M4 42H38V72H4Z', '#5DBB63'), P('M22 24H38V42H22Z', '#5DBB63'), P('M8 28H16V42H8Z', '#4A3426'),
    C(12, 78, 6, '#4A3426', { 'stroke-width': 2 }), C(30, 78, 6, '#4A3426', { 'stroke-width': 2 }),
    ...[[44, '#E5484D'], [82, '#4AA3DF'], [120, '#E5484D']].map(([x, c]) => g(P(`M${x} 42H${x + 32}V72H${x}Z`, c), C(x + 8, 78, 6, '#4A3426', { 'stroke-width': 2 }), C(x + 24, 78, 6, '#4A3426', { 'stroke-width': 2 }))),
    el('path', { d: 'M158 42H190V72H158Z', fill: '#FFFFFF', stroke: '#8C7B6B', 'stroke-width': 3, 'stroke-dasharray': '6 5' }),
    L('M38 60H44M76 60H82M114 60H120M152 60H158', INK, 3)),
  // Gold star ring for the level-up moment.
  starRing: () => g(
    el('circle', { cx: 50, cy: 50, r: 40, fill: 'none', stroke: '#F2C230', 'stroke-width': 8 }),
    ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => el('g', { transform: `rotate(${a} 50 50)` }, star(50, 10, 10, 5, '#FFD54A')))),

  // ---- sticker-only ----
  paw: () => g(
    C(50, 50, 40, '#FFF1D6'),
    el('ellipse', { cx: 50, cy: 60, rx: 15, ry: 13, fill: INK }),
    el('ellipse', { cx: 31, cy: 44, rx: 6.5, ry: 8.5, fill: INK }),
    el('ellipse', { cx: 43, cy: 34, rx: 6.5, ry: 8.5, fill: INK }),
    el('ellipse', { cx: 57, cy: 34, rx: 6.5, ry: 8.5, fill: INK }),
    el('ellipse', { cx: 69, cy: 44, rx: 6.5, ry: 8.5, fill: INK })),
};

export function art(id, opts) {
  const f = ART[id];
  return f ? f(opts) : ART.star();
}

export const TREAT_IDS = ['ball', 'frisbee', 'bone', 'star', 'apple', 'strawberry', 'carrot'];

// Sticker book (plan f4, design.md 9.7): sk-<id>. Pets and friends are the same drawings as in the
// game (stickers stay drawings even when a pet has a photo); everything else is a picture above.
const CHAR_STICKERS = ['yellowDog', 'chocolateDog', 'gingerDog', 'blackDog', 'puppy', 'kitty', 'bunny', 'bunny2', 'friendSilly', 'friendBerry', 'friendCounter', 'friendDino', 'friendSea'];
export function stickerArt(skId) {
  const id = String(skId).replace(/^sk-/, '');
  if (CHAR_STICKERS.includes(id)) return el('g', { transform: 'translate(1 0) scale(0.82)' }, drawChar(id));
  return ART[id] ? ART[id]() : ART.star();
}
export const hasStickerArt = (skId) => {
  const id = String(skId).replace(/^sk-/, '');
  return CHAR_STICKERS.includes(id) || Object.hasOwn(ART, id);
};

// A pattern item (piece 4): a pet drawing (the same drawings as the stickers) or a picture above.
export const itemArt = (id) => stickerArt(id);
