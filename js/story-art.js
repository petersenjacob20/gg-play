// Story Time pictures (plan l3): a small, generic composer that draws a page from a part list in
// stories.json, e.g. [{"p": "ark", "x": 50, "y": 80, "s": 0.6}, {"p": "rain", "x": 50, "y": 18}].
// Scenes use a 0 0 100 100 box, shown whole; backgrounds run past it, so a taller or wider art area
// just shows more sky above and more ground below. x, y is the part's anchor: the feet for
// people, animals, boats and buildings, the middle for sky things. "s" scales (default 1), "f": 1 flips
// it left to right, "o" picks a pose. Backgrounds (sky, night, hills, sea ...) ignore x, y and s.
// Drawing rules (design.md 9.10 and 11.2): our own simple drawings, kind faces, nothing scary. God is
// never drawn as a person: God's love shows as warm light. Noah shows rain and the safe ark, never a
// flood over land or people. Jesus is a kind, simple figure, never comic.
// Plain data trees like art.js (our own simple shapes). The outline colour and joins sit once on each
// scene to keep the drawings small.

const INK = '#4A3426';
const el = (tag, attrs, ...kids) => [tag, attrs, ...kids];
const P = (d, fill, extra = {}) => el('path', { d, fill, ...extra });
const C = (cx, cy, r, fill, extra = {}) => el('circle', { cx, cy, r, fill, ...extra });
const E = (cx, cy, rx, ry, fill, extra = {}) => el('ellipse', { cx, cy, rx, ry, fill, ...extra });
const R = (x, y, width, height, fill, extra = {}) => el('rect', { x, y, width, height, rx: 2, fill, ...extra });
const L = (d, stroke = INK) => el('path', { d, fill: 'none', stroke });
const NO = { stroke: 'none' };
const dot = (cx, cy, r = 1.7) => C(cx, cy, r, '#2B1D14', NO);
const mirror = (...kids) => el('g', { transform: 'scale(-1 1)' }, ...kids);

const SKIN = { a: '#F1C7A0', b: '#C68A5E', c: '#8D5A3B' };

// One kind, simple person. o: robe, skin, hair, long (hair to the shoulders), beard, cloth (head
// cloth), sash, staff, wings, arms ('down' | 'up' | 'out' | 'hammer'), shut (eyes closed, resting).
function person(o) {
  const skin = o.skin || SKIN.a;
  const robe = o.robe || '#8A5A2E';
  const arm = (pose, side) => {
    const shapes = {
      down: [P('M-11 -46L-20 -24L-14 -22L-7 -40Z', robe), C(-17, -22, 3.4, skin)],
      up: [P('M-10 -44L-22 -64L-16 -67L-6 -48Z', robe), C(-19, -67, 3.4, skin)],
      out: [P('M-10 -45L-28 -41L-27 -35L-9 -37Z', robe), C(-29, -38, 3.4, skin)],
    };
    return side < 0 ? shapes[pose] : mirror(...shapes[pose]);
  };
  const arms = o.arms || 'down';
  const right = arms === 'hammer' ? 'up' : arms;
  const left = arms === 'hammer' ? 'down' : arms;
  return el('g', {},
    o.wings ? [P('M-9 -46C-36 -64 -38 -30 -13 -27Z', '#FFF6D6'), mirror(P('M-9 -46C-36 -64 -38 -30 -13 -27Z', '#FFF6D6'))] : null,
    o.staff ? [L('M23 -74V0', '#8A5A2E'), L('M23 -74C23 -84 33 -84 33 -76', '#8A5A2E')] : null,
    P('M-12 -48C-14 -30 -18 -12 -19 0H19C18 -12 14 -30 12 -48Z', robe),
    o.sash ? R(-15, -31, 30, 5, o.sash) : null,
    arm(left, -1), arm(right, 1),
    arms === 'hammer' ? [L('M19 -67L27 -79', '#8A5A2E'), el('rect', { x: 21, y: -86, width: 13, height: 6, rx: 1, fill: '#9AA3AD', transform: 'rotate(34 27 -83)' })] : null,
    o.long ? P('M-12 -57C-14 -74 14 -74 12 -57L13 -46H8L8 -58C4 -63 -4 -63 -8 -58L-8 -46H-13Z', o.hair) : null,
    C(0, -58, 11, skin),
    o.beard ? P('M-10 -57C-10 -43 10 -43 10 -57C6 -52 -6 -52 -10 -57Z', o.beard) : null,
    o.cloth ? P('M-14 -48C-17 -77 17 -77 14 -48L10 -48C11 -66 -11 -66 -10 -48Z', o.cloth)
      : o.hair ? P('M-11 -60C-12 -73 12 -73 11 -60C7 -66 -7 -66 -11 -60Z', o.hair) : null,
    o.shut ? [L('M-6 -59Q-4 -57 -2 -59'), L('M2 -59Q4 -57 6 -59')] : [dot(-4, -59), dot(4, -59)],
    L('M-4 -53Q0 -50 4 -53'));
}
const kid = (o) => el('g', { transform: 'scale(0.68)' }, person(o));

const PEOPLE = {
  noah: (o) => person({ robe: '#A0703F', hair: '#E8E3DA', beard: '#E8E3DA', arms: o || 'down' }),
  jesus: (o) => person({ robe: '#FFFFFF', sash: '#C2453E', hair: '#6B4226', long: 1, beard: '#6B4226', skin: SKIN.b, arms: o === 'rest' ? 'down' : o || 'down', shut: o === 'rest' }),
  mary: (o) => person({ robe: '#4A7FC1', cloth: '#7FB0E6', skin: SKIN.b, arms: o || 'down' }),
  joseph: (o) => person({ robe: '#9C6B3C', cloth: '#D9C39A', beard: '#5A3A22', skin: SKIN.b, staff: 1, arms: o || 'down' }),
  shepherd: (o) => person({ robe: '#7C9A52', cloth: '#E7D9B0', beard: '#4A3426', skin: SKIN.c, staff: o !== 'carry', arms: o === 'carry' ? 'up' : o || 'down' }),
  angel: (o) => person({ robe: '#FFFDF4', sash: '#F2C230', hair: '#F2C230', long: 1, wings: 1, arms: o || 'out' }),
  man: (o) => person({ robe: '#5B8C85', hair: '#3B2A1E', beard: '#3B2A1E', skin: SKIN.b, arms: o || 'down' }),
  woman: (o) => person({ robe: '#D9534F', hair: '#3B2A1E', long: 1, skin: SKIN.c, arms: o || 'down' }),
  girl: (o) => kid({ robe: '#F28C28', hair: '#2B1D14', long: 1, skin: SKIN.c, arms: o || 'up' }),
  boy: (o) => kid({ robe: '#4AA3DF', hair: '#7A4A2A', skin: SKIN.a, arms: o || 'up' }),
};

const STAR = (cx, cy, R2, r, fill) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const q = i % 2 ? r : R2;
    pts.push(`${Math.round((cx + q * Math.cos(a)) * 10) / 10} ${Math.round((cy + q * Math.sin(a)) * 10) / 10}`);
  }
  return P(`M${pts.join('L')}Z`, fill);
};

// Parts: [draw(pose), kind]. kind 'bg' = full-scene background, 'sky' = anchored at its middle,
// otherwise anchored at its feet. k is the size on a question card.
// Amendment o2: the ark's tap-to-color rainbow. Six concentric bands, top (outside) to bottom
// (inside): red, orange, yellow, green, blue, purple. o = how many are filled (0 to 6): filled bands
// are drawn in colour, the rest as a light grey outline, and the next band to fill carries the
// rb-next class (a soft glow in app.css). Local box: x -40..40, y -30..10 (centre of the arcs at 0 10).
export const RAINBOW6 = {
  bands: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
  colors: { red: '#E5484D', orange: '#F28C28', yellow: '#FFD54A', green: '#5DBB63', blue: '#4AA3DF', purple: '#8E5CC7' },
  grey: '#B8B2A9',
  outer: 40, band: 5, cy: 10,
};
export function rainbow6(o) {
  const { bands, colors, grey, outer, band, cy } = RAINBOW6;
  const n = Math.max(0, Math.min(bands.length, Math.floor(Number(o) || 0)));
  return el('g', {}, ...bands.map((b, i) => {
    const ro = outer - band * i;
    const ri = ro - band;
    const d = `M${-ro} ${cy}A${ro} ${ro} 0 0 1 ${ro} ${cy}H${ri}A${ri} ${ri} 0 0 0 ${-ri} ${cy}Z`;
    const cls = `rb-band${i === n ? ' rb-next' : ''}`;
    return i < n
      ? el('path', { d, fill: colors[b], class: cls, 'data-band': b })
      : el('path', { d, fill: 'none', stroke: grey, 'stroke-width': 0.9, class: cls, 'data-band': b });
  }));
}

export const PARTS = {
  // backgrounds (scene units; drawn well past the box on every side)
  sky: [() => R(-60, -70, 220, 260, '#CFEFFF', NO), 'bg'],
  night: [() => R(-60, -70, 220, 260, '#2D3F73', NO), 'bg'],
  grey: [() => R(-60, -70, 220, 260, '#B9C4D1', NO), 'bg'],
  inside: [() => el('g', {}, R(-60, -70, 220, 260, '#E9C894', NO), ...[-22, -2, 18, 38, 58].map((y) => L(`M-60 ${y}H160`, '#C99E62')), R(-60, 80, 220, 110, '#B07A45', NO)), 'bg'],
  hills: [() => P('M-40 80C0 64 30 70 50 76C72 68 104 62 140 74L160 76V190H-60V84Z', '#8CD27A'), 'bg'],
  sea: [() => P('M-40 76C-30 73 -20 79 -10 76S10 73 20 76S40 79 50 76S70 73 80 76S100 79 110 76S130 73 140 76H160V190H-60V76Z', '#4AA3DF'), 'bg'],
  waves: [() => P('M-40 70C-30 60 -20 80 -10 70S10 60 20 70S40 80 50 70S70 60 80 70S100 80 110 70S130 60 140 70H160V190H-60V70Z', '#3C8CC8'), 'bg'],
  // sky things
  light: [() => el('g', NO, C(0, 0, 30, '#FFF6C7', { opacity: 0.55 }), C(0, 0, 20, '#FFEFA0', { opacity: 0.7 }), C(0, 0, 11, '#FFE680')), 'sky', 1.4],
  sun: [() => el('g', {}, L('M0 -24V-18M0 18V24M-24 0H-18M18 0H24M-17 -17l4 4M13 13l4 4M-17 17l4 -4M13 -13l4 -4', '#F5A524'), C(0, 0, 14, '#FFD54A')), 'sky', 1.5],
  moon: [() => P('M4 -20A20 20 0 1 0 20 12A16 16 0 1 1 4 -20Z', '#FFE27A'), 'sky', 1.6],
  star: [() => STAR(0, 0, 12, 5, '#FFD54A'), 'sky', 3],
  stars: [() => el('g', {}, STAR(-22, -4, 4, 1.8, '#FFF1B0'), STAR(-6, 6, 3, 1.4, '#FFF1B0'), STAR(10, -8, 4.5, 2, '#FFF1B0'), STAR(26, 4, 3, 1.4, '#FFF1B0')), 'sky', 1.8],
  cloud: [() => P('M-22 8C-30 8 -30 -4 -21 -4C-21 -14 -7 -16 -3 -8C1 -18 19 -16 18 -4C28 -4 28 8 19 8Z', '#FFFFFF'), 'sky', 1.5],
  rain: [() => el('g', {}, L('M-20 12l-3 7M-10 18l-3 7M0 12l-3 7M10 18l-3 7M20 12l-3 7M-15 28l-3 7M5 28l-3 7', '#4AA3DF'), P('M-22 8C-30 8 -30 -4 -21 -4C-21 -14 -7 -16 -3 -8C1 -18 19 -16 18 -4C28 -4 28 8 19 8Z', '#E9EEF3')), 'sky', 1.5],
  rainbow: [() => el('g', { fill: 'none' }, el('path', { d: 'M-40 20A40 40 0 0 1 40 20', stroke: '#E5484D', 'stroke-width': 7 }), el('path', { d: 'M-33 20A33 33 0 0 1 33 20', stroke: '#FFD54A', 'stroke-width': 7 }), el('path', { d: 'M-26 20A26 26 0 0 1 26 20', stroke: '#5DBB63', 'stroke-width': 7 }), el('path', { d: 'M-19 20A19 19 0 0 1 19 20', stroke: '#4AA3DF', 'stroke-width': 7 })), 'sky', 1],
  rainbow6: [(o) => rainbow6(o), 'sky', 1],
  dove: [() => el('g', {}, E(0, 0, 9, 5, '#FFFFFF'), P('M-2 -2L-10 -14L4 -4Z', '#FFFFFF'), C(9, -3, 3.6, '#FFFFFF'), P('M12 -3l4 1l-4 1Z', '#F28C28'), dot(10, -4, 0.9)), 'sky', 2.6],
  bird: [() => el('g', {}, E(0, 0, 8, 5, '#4AA3DF'), P('M-2 -2L-8 -11L4 -3Z', '#7FC3EE'), C(8, -3, 3.4, '#4AA3DF'), P('M11 -3l4 1l-4 1Z', '#F2C230'), dot(9, -4, 0.9)), 'sky', 2.8],
  heart: [() => P('M0 14C-9 7 -16 1 -16 -7C-16 -13 -11 -16 -7 -16C-3 -16 -1 -14 0 -11C1 -14 3 -16 7 -16C11 -16 16 -13 16 -7C16 1 9 7 0 14Z', '#E5484D'), 'sky', 2.4],
  fish: [() => el('g', {}, P('M-14 0C-8 -10 8 -10 12 0C8 10 -8 10 -14 0ZM-14 0L-22 -8V8Z', '#F28C28'), dot(6, -2, 1.3)), 'sky', 2.4],
  // things on the ground or the water (anchored at the bottom)
  ark: [() => el('g', {},
    R(-26, -44, 52, 24, '#C98B4E'), P('M-31 -43L0 -60L31 -43Z', '#8A5A2E'), R(-7, -38, 14, 10, '#FFE9A8'),
    P('M-52 -22H52L42 0H-42Z', '#A86B3C'), L('M-48 -14H48', '#7A4A2A'), L('M-44 -7H44', '#7A4A2A')), 'ground', 0.85],
  boat: [() => el('g', {}, L('M0 -10V-46', INK), P('M2 -44L22 -14H2Z', '#FFFFFF'), P('M-32 -12H32L23 0H-23Z', '#B07A45')), 'ground', 1.3],
  // the same boat in two parts, so people can sit in it: the mast and sail behind them, the hull in front
  sail: [() => el('g', {}, L('M0 -10V-46', INK), P('M2 -44L22 -14H2Z', '#FFFFFF')), 'ground', 1.3],
  hull: [() => P('M-32 -12H32L23 0H-23Z', '#B07A45'), 'ground', 1.3],
  stable: [() => el('g', {}, R(-34, -40, 68, 40, '#C98B4E'), R(-24, -32, 48, 32, '#7A4A2A'), P('M-40 -38L0 -58L40 -38Z', '#8A5A2E')), 'ground', 1.1],
  tree: [() => el('g', {}, R(-4, -26, 8, 26, '#8A5A2E'), C(0, -40, 16, '#5DBB63'), C(-12, -30, 10, '#5DBB63'), C(12, -30, 10, '#5DBB63'), C(-6, -42, 2.6, '#E5484D'), C(7, -34, 2.6, '#E5484D'), C(-8, -28, 2.6, '#E5484D')), 'ground', 1.6],
  flower: [() => el('g', {}, L('M0 0V-14', '#3E8E41'), ...[0, 72, 144, 216, 288].map((a) => C(0, -26, 4.2, '#F28CB1', { transform: `rotate(${a} 0 -20)` })), C(0, -20, 3.4, '#FFD54A')), 'ground', 2.6],
  rock: [() => P('M-16 0C-18 -10 -10 -18 -2 -16C6 -20 16 -12 16 0Z', '#A7A39B'), 'ground', 2.2],
  baby: [() => el('g', {}, P('M-20 -8L-16 2H16L20 -8Z', '#C98B4E'), L('M-14 -8l3 -4M-6 -8l2 -4M4 -8l-2 -4M12 -8l-3 -4', '#E2B85C'), E(2, -11, 13, 6, '#FFFFFF'), C(-11, -13, 5.5, SKIN.b), L('M-13 -14q1 1 2 0'), L('M-10 -14q1 1 2 0')), 'ground', 2],
  sheep: [() => el('g', {}, R(-12, -14, 4, 14, INK), R(8, -14, 4, 14, INK),
    P('M-18 -12C-25 -14 -25 -27 -16 -28C-14 -36 -3 -36 0 -30C4 -36 16 -34 16 -26C24 -26 24 -12 16 -12Z', '#FFFFFF'),
    E(19, -24, 7, 6, '#5A4A40'), P('M14 -28l-4 -3l1 5Z', '#5A4A40'), C(21, -25, 1.3, '#FFFFFF', NO)), 'ground', 1.9],
  lion: [() => el('g', {}, L('M-16 -16C-26 -18 -26 -30 -20 -30', '#B5651D'), R(-14, -12, 5, 12, '#E8A93A'), R(8, -12, 5, 12, '#E8A93A'),
    E(-1, -16, 18, 9, '#E8A93A'), C(17, -25, 12, '#B5651D'), C(17, -25, 7.5, '#F2C14E'), dot(14.5, -27, 1.2), dot(19.5, -27, 1.2),
    P('M16 -24h3l-1.5 2Z', INK), L('M15 -21q2 2 4 0')), 'ground', 1.9],
  giraffe: [() => el('g', {}, ...[-12, -6, 4, 10].map((x) => R(x, -22, 4, 22, '#F4C04E')),
    E(-1, -26, 15, 9, '#F4C04E'), P('M6 -30L12 -62L18 -60L13 -27Z', '#F4C04E'), E(18, -64, 7.5, 5, '#F4C04E'),
    L('M15 -68v-5M19 -68v-5'), dot(19, -65, 1.1), ...[[-6, -28], [2, -24], [-10, -23], [12, -45], [14, -54]].map(([x, y]) => C(x, y, 2.4, '#C8862E', NO))), 'ground', 1.25],
  cow: [() => el('g', {}, R(-14, -12, 5, 12, '#FFFFFF'), R(8, -12, 5, 12, '#FFFFFF'), R(-18, -28, 34, 18, '#FFFFFF'),
    C(-8, -22, 4, INK, NO), C(6, -16, 3, INK, NO), E(20, -26, 7, 8, '#FFFFFF'), E(21, -20, 6, 3.6, '#F7B6C2'), L('M16 -33l-3 -4M24 -33l3 -4'), dot(18, -28, 1.1), dot(23, -28, 1.1)), 'ground', 1.8],
  duck: [() => el('g', {}, E(0, -10, 14, 9, '#FFD54A'), C(11, -22, 7, '#FFD54A'), P('M17 -23l7 2l-7 2Z', '#F28C28'), dot(12, -24, 1.2), P('M-6 -12q6 -6 12 0', '#F2C230'), L('M-3 -1v2M4 -1v2', '#F28C28')), 'ground', 2.2],
  donkey: [() => el('g', {}, R(-14, -14, 5, 14, '#9AA3AD'), R(8, -14, 5, 14, '#9AA3AD'), E(-1, -20, 17, 9, '#9AA3AD'),
    P('M10 -24L16 -40L24 -36L18 -20Z', '#9AA3AD'), E(23, -38, 6, 4.5, '#9AA3AD'), P('M17 -42l-2 -9l4 7Z', '#9AA3AD'), P('M21 -42l1 -9l2 8Z', '#9AA3AD'), dot(22, -39, 1.1)), 'ground', 1.7],
};
for (const [id, draw] of Object.entries(PEOPLE)) PARTS[id] = [draw, 'ground', id === 'girl' || id === 'boy' ? 1.4 : 1];

export const hasPart = (id) => Object.hasOwn(PARTS, id);

// One placed part. The outline colour and joins sit once on the scene; the width is set on each part's
// group in its own units, so it looks the same at any size.
const ROUND = { stroke: INK, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };

// Same picture, fewer bytes (a busy page stays under 6 KB): outlines in the scene's ink don't repeat
// it, path numbers drop the space before a minus sign, a run of side-by-side shapes with the same
// fill and no outline (spots, eyes) shares one group, and the fill most shapes in a group use is set
// once on the group. Every shape has its own fill, so nothing picks up a colour it didn't have; the
// order of shapes never changes.
const leaf = (k) => Array.isArray(k) && typeof k[0] === 'string' && k[0] !== 'g';
function tidy(t) {
  if (!Array.isArray(t) || typeof t[0] !== 'string') return t;
  const [tag, attrs = {}] = t;
  const a = { ...attrs };
  if (tag !== 'g') {
    if (a.stroke === INK) delete a.stroke;
    if (typeof a.d === 'string') a.d = a.d.replace(/(\d) (?=-)/g, '$1'); // "M6 -30" is the same path as "M6-30"
    return [tag, a, ...t.slice(2)];
  }
  let kids = [];
  for (const k of t.slice(2).map(tidy)) {
    const last = kids[kids.length - 1];
    if (leaf(k) && k[1].stroke === 'none') {
      if (last && last[0] === 'g' && last.run && last[1].fill === k[1].fill) { last.push([k[0], { ...k[1], fill: undefined, stroke: undefined }, ...k.slice(2)]); continue; }
      if (last && leaf(last) && last[1].stroke === 'none' && last[1].fill === k[1].fill) {
        const g = el('g', { fill: k[1].fill, stroke: 'none' }, ...[last, k].map((x) => [x[0], { ...x[1], fill: undefined, stroke: undefined }, ...x.slice(2)]));
        g.run = true; kids[kids.length - 1] = g; continue;
      }
    }
    kids.push(k);
  }
  if (!('fill' in a)) {
    const n = {};
    for (const k of kids) if (leaf(k) && k[1].fill) n[k[1].fill] = (n[k[1].fill] || 0) + 1;
    const [fill, count] = Object.entries(n).sort((x, y) => y[1] - x[1])[0] || [];
    if (count > 1) { a.fill = fill; kids = kids.map((k) => (leaf(k) && k[1].fill === fill ? [k[0], { ...k[1], fill: undefined }, ...k.slice(2)] : k)); }
  }
  return [tag, a, ...kids];
}
const clean = (t) => (!Array.isArray(t) ? t : typeof t[0] !== 'string' ? t.map(clean)
  : [t[0], Object.fromEntries(Object.entries(t[1] || {}).filter(([, v]) => v !== undefined)), ...t.slice(2).map(clean)]);

function placed(item, W) {
  const [draw, kind] = PARTS[item.p] || PARTS.star;
  const s = Number(item.s) || 1;
  // the part's own group joins the placed group (they never both carry a transform)
  const join = (attrs, drawn) => {
    const d = clean(tidy(drawn[0] === 'g' ? drawn : el('g', {}, drawn)));
    return 'transform' in d[1] ? el('g', attrs, d) : el('g', { ...attrs, ...d[1] }, ...d.slice(2));
  };
  if (kind === 'bg') return join({ 'stroke-width': W }, draw(item.o));
  const flip = item.f ? ' scale(-1 1)' : '';
  return join({ transform: `translate(${Number(item.x) || 0} ${Number(item.y) || 0}) scale(${s})${flip}`, 'stroke-width': Math.round((W / s) * 100) / 100 }, draw(item.o));
}

// A whole story page (or a cover): the parts in order, back to front. viewBox 0 0 100 100.
export function storyScene(parts) {
  return el('g', ROUND, ...(parts || []).map((p) => placed(p, 0.75)));
}

// One part alone on a question card (viewBox 0 0 100 100), sized by its k.
export function storyPart(id) {
  const [, kind, k = 1] = PARTS[id] || PARTS.star;
  return el('g', ROUND, placed({ p: hasPart(id) ? id : 'star', x: 50, y: kind === 'ground' ? 90 : 50, s: k }, 3));
}
