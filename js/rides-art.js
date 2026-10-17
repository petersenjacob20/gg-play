// Ride Close-Up Scenes art (the rides pack): original storybook-realistic inline SVG. Each surface has a base tone, a
// darker underside and a soft top highlight; 1.5 px outlines one tone darker than the fill (never black); a soft blurred
// ground shadow under every pet and ride; eyes with a dark rim, iris, pupil and catchlight; metal with a highlight
// stripe, plastic with a gloss band, water at 0.6 with ripples. Three depth layers (far 35 % with haze, mid 60 %, near
// crisp) under a #BFE6FF to #EAF7FF sky and the sun in sunglasses. Pets match the Family pets' coats (pets.js).
let n = 0;
const T = (tag, a = {}, ...k) => [tag, a, ...k.filter(Boolean)];
const G = (a, ...k) => T('g', a, ...k);
const hx = (c) => c.match(/\w\w/g).map((x) => parseInt(x, 16));
const mix = (c, d, f) => { const a = hx(c), b = hx(d); return `#${a.map((v, i) => Math.round(v + (b[i] - v) * f).toString(16).padStart(2, '0')).join('')}`; };
export const dark = (c, f = 0.28) => mix(c, '#000000', f);
export const light = (c, f = 0.3) => mix(c, '#FFFFFF', f);
// a defs block with a vertical 3-tone gradient (highlight, base, underside) and a radial volume, named per drawing
function tones(defs, c, key) {
  const id = `rg${++n}${key}`;
  defs.push(T('linearGradient', { id: `${id}v`, x1: 0, y1: 0, x2: 0, y2: 1 }, T('stop', { offset: 0, 'stop-color': light(c, 0.32) }), T('stop', { offset: 0.45, 'stop-color': c }), T('stop', { offset: 1, 'stop-color': dark(c, 0.3) })),
    T('radialGradient', { id: `${id}r`, cx: 0.38, cy: 0.3, r: 0.75 }, T('stop', { offset: 0, 'stop-color': light(c, 0.28) }), T('stop', { offset: 0.55, 'stop-color': c }), T('stop', { offset: 1, 'stop-color': dark(c, 0.32) })));
  return { v: `url(#${id}v)`, r: `url(#${id}r)`, line: dark(c, 0.3) };
}
const blurDef = (defs, sd) => { const id = `rb${++n}`; defs.push(T('filter', { id, x: '-50%', y: '-50%', width: '200%', height: '200%' }, T('feGaussianBlur', { stdDeviation: sd }))); return `url(#${id})`; };
const E = (cx, cy, rx, ry, fill, line, a = {}) => T('ellipse', { cx, cy, rx, ry, fill, stroke: line || 'none', 'stroke-width': line ? 1.5 : 0, ...a });
const P = (d, fill, line, a = {}) => T('path', { d, fill, stroke: line || 'none', 'stroke-width': line ? 1.5 : 0, 'stroke-linejoin': 'round', ...a });
const L = (d, stroke, w = 1.5, a = {}) => T('path', { d, fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', ...a });
// the soft ground shadow (blur 3.5) under every pet and ride
export const groundShadow = (defs, rx, ry = rx * 0.2, cx = 0, cy = 0) => E(cx, cy, rx, ry, '#1E2A1A', null, { opacity: 0.25, filter: blurDef(defs, 3.5) });
// short fur strokes along an edge (a ring of little dashes on an ellipse), one tone darker
const fur = (cx, cy, rx, ry, c, from = 200, to = 340, k = 9) => L(Array.from({ length: k }, (_, i) => {
  const t = ((from + ((to - from) * i) / (k - 1)) * Math.PI) / 180; const x = cx + rx * Math.cos(t), y = cy + ry * Math.sin(t);
  return `M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.cos(t) * 3).toFixed(1)} ${(Math.sin(t) * 3 + 1).toFixed(1)}`; }).join(''), c, 1.2, { opacity: 0.55 });
// an eye: dark rim, iris, pupil (a slit for the cat), catchlight
const eye = (x, y, iris, r = 4.2, slit = false, shut = false, lid = null) => shut ? L(`M${x - r} ${y}q${r} ${r * 0.8} ${r * 2} 0`, '#2B1D14', 1.6)
  : G({ class: 'r-eye' }, T('circle', { cx: x, cy: y, r, fill: '#2B1D14' }), T('circle', { cx: x, cy: y, r: r * 0.78, fill: iris }),
    slit ? E(x, y, r * 0.22, r * 0.62, '#15100C') : T('circle', { cx: x, cy: y, r: r * 0.42, fill: '#15100C' }),
    T('circle', { class: 'r-catch', cx: x + r * 0.3, cy: y - r * 0.35, r: r * 0.24, fill: '#FFFFFF' }),
    lid ? P(`M${x - r - 0.5} ${y + 0.6}a${r + 0.5} ${r + 0.5} 0 0 1 ${2 * r + 1} 0z`, lid, dark(lid, 0.3), { class: 'r-lid' }) : null);
// mud: the Pet Care mud (light tan splash, khaki outline, drip tails, specks, sometimes a little leaf); never a dark-brown blob
export const MUD = '#C9A66B', MUD_LINE = '#A8834A';
const MUDO = { stroke: MUD_LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' };
export const mudSplash = (leaf) => G({ class: 'r-mud-art' }, P('M22 44q-6-12 8-14q4-12 18-8q10-8 20 2q14-2 12 12q10 8 0 16q2 10-8 10l-2 12q-3 4-6 0l-1-10q-6 2-10-2l-2 16q-3 4-6 0l-1-16q-10 0-10-10q-12-2-12-8z', MUD, null, MUDO),
  ...[[14, 28, 3], [86, 30, 2.5], [84, 70, 2], [20, 70, 2.5]].map(([x, y, r]) => T('circle', { cx: x, cy: y, r: r * 1.4, fill: MUD, ...MUDO, 'stroke-width': 3 })),
  leaf ? P('M44 40q10-12 22-6q-8 12-22 6z', '#7CC36B', null, { stroke: '#3F9A4A', 'stroke-width': 4 }) : null);
const MUD_SIZE = new Map([['gingerDog', 1.2]]); // EM: the ginger dog's splash 20 % larger
const mudSplats = (k, id) => Array.from({ length: k }, (_, i) => { const [x, y, s] = [[-12, -40, 1], [12, -24, 0.8], [-4, -58, 0.7], [16, -46, 0.9], [-18, -18, 0.8], [6, -84, 0.6]][i];
  return G({ class: 'r-mud', transform: `translate(${x} ${y}) scale(${s * 0.24 * (MUD_SIZE.get(id) || 1)}) translate(-50 -50)` }, mudSplash(i % 3 === 1)); });
const drops = () => G({ class: 'r-wet' }, ...[[-22, -70], [24, -60], [-26, -30], [26, -22], [-30, -50]].map(([x, y]) => P(`M${x} ${y - 4}q-3 5 0 6q3-1 0-6z`, '#9FD6F5', '#5AAEE0', { opacity: 0.9 })));

// the Family pets' coats (pets.js) with volume
const DOG = {
  yellowDog: { coat: '#F3D58C', ear: '#E7C06A', muzzle: '#FBF0D5', belly: '#FBF0D5', nose: '#4A3426', iris: '#8A5A2B', collar: '#5DBB63' },
  chocolateDog: { coat: '#7B4A2D', ear: '#5E3620', muzzle: '#8C5A3A', belly: '#8E5C3C', nose: '#3A2014', iris: '#D9A23A', collar: '#F28C28' },
  gingerDog: { coat: '#E08A3C', ear: '#C9702A', muzzle: '#EBA466', belly: '#F0B47A', nose: '#6B3F22', iris: '#D9A23A', collar: '#4AA3DF' },
  blackDog: { coat: '#2E2A2A', ear: '#221F1F', muzzle: '#3C3636', belly: '#3A3434', nose: '#141010', iris: '#8A5A2B', collar: '#8E5CC7', sheen: '#6E7E99' },
  puppy: { coat: '#F5DC9C', ear: '#E9C674', muzzle: '#FCF2DA', belly: '#FCF2DA', nose: '#4A3426', iris: '#6B4426', collar: '#E5484D', pup: true },
};
const TOYS = {
  ballBlue: (d) => { const t = tones(d, '#3D7BE0', 'b'); return G({ class: 'r-toy', 'data-toy': 'ballBlue' }, T('circle', { r: 8, fill: t.r, stroke: t.line, 'stroke-width': 1.5 }), L('M-7 -2q7 5 14 0', '#FFFFFF', 1.4, { opacity: 0.8 })); },
  frisbeeGreen: (d) => disc(d, '#4FB35A', 'frisbeeGreen'),
  frisbeeYellow: (d) => disc(d, '#F2C230', 'frisbeeYellow'),
  frisbeeBlue: (d) => disc(d, '#3D7BE0', 'frisbeeBlue'),
};
function disc(d, c, k) { const t = tones(d, c, 'f'); return G({ class: 'r-toy', 'data-toy': k }, E(0, 0, 12, 4.5, t.v, t.line), E(0, -1, 8, 2.4, 'none', light(c, 0.5), { 'stroke-width': 1.2 }), L('M-9 -2q4-2 8-2', '#FFFFFF', 1.2, { opacity: 0.7 })); }

// a sitting pet, feet at (0,0), about 110 tall. o: { mouth: 'open', ears: 'back'|'out'|'flop', pawsUp, cover, curl, shut,
// mud (0-6 splats), wet, toy: 'ballBlue'|'frisbeeGreen'|..., toyAt: 'mouth'|'paws', tilt }
export function pet(id, o = {}) {
  const defs = [];
  const body = id === 'kitty' ? cat(defs, o) : /^bunny/.test(id) ? bunny(defs, o, id === 'bunny') : dog(defs, DOG[id] || DOG.yellowDog, o);
  return G({ class: 'r-pet', 'data-pet-art': id, 'data-mud': String(o.mud || 0) }, T('defs', {}, ...defs), groundShadow(defs, 34, 6),
    G({ transform: `${o.curl ? 'translate(0 -6) scale(1.05 0.72)' : ''} rotate(${o.tilt || 0} 0 -50)` }, body, o.mud ? G({}, ...mudSplats(o.mud, id)) : null, o.wet ? drops() : null));
}
function earPath(side, kind, pup) {
  const s = side; const w = pup ? 1.15 : 1;
  if (kind === 'back') return `M${s * 15} -99q${s * 20} -2 ${s * 34} 8q${s * 2} 8 ${-s * 6} 10q${-s * 14} 0 ${-s * 28} -8z`;
  if (kind === 'out') return `M${s * 15} -100q${s * 22} -10 ${s * 36} 0q${s * 2} 8 ${-s * 6} 12q${-s * 16} 2 ${-s * 28} -2z`;
  return `M${s * 15} -100q${s * 18 * w} -4 ${s * 19 * w} 22q0 15 ${-s * 9} 18q${-s * 8} -2 ${-s * 10} -14q${-s * 2} -14 ${-s * 2} -22z`;
}
// the inner fold of a dog ear: a soft lighter crease from the base toward the tip (volume, even on a black coat)
const fold = (side, kind, c) => L(kind === 'back' ? `M${side * 17} -97q${side * 12} 1 ${side * 26} 9` : kind === 'out' ? `M${side * 17} -98q${side * 14} -4 ${side * 28} 2` : `M${side * 18} -96q${side * 10} 4 ${side * 9} 26`, light(c, 0.35), 2.2, { opacity: 0.55, class: 'r-fold' });
function dog(d, c, o) {
  const k = tones(d, c.coat, 'c'); const e = tones(d, c.ear, 'e'); const m = tones(d, c.muzzle, 'm'); const pup = !!c.pup;
  const hs = pup ? 1.12 : 1; // a puppy's bigger head
  const legs = o.pawsUp ? [P('M-14 -46q-14 -18 -10 -36l8 0q0 16 10 30z', k.v, k.line), P('M14 -46q14 -18 10 -36l-8 0q0 16 -10 30z', k.v, k.line), E(-20, -84, 6, 5, m.r, m.line), E(20, -84, 6, 5, m.r, m.line)]
    : [P('M-16 -40q-1 20 1 36q5 4 10 0q2 -16 1 -36z', c.coat, k.line), P('M16 -40q1 20 -1 36q-5 4 -10 0q-2 -16 -1 -36z', c.coat, k.line), E(-10, -2, 8, 4.5, m.r, m.line), E(10, -2, 8, 4.5, m.r, m.line), L('M-12 -3v2M-8 -3v2M8 -3v2M12 -3v2', m.line, 1)];
  const head = G({ class: 'r-head', transform: `translate(0 -82) scale(${hs}) rotate(${o.chinUp ? -10 : 0}) translate(0 82)` },
    G({ class: 'r-ear l', 'data-ear': o.ears || 'flop' }, P(earPath(-1, o.ears, pup), e.v, e.line), fold(-1, o.ears, c.sheen || c.ear)),
    G({ class: 'r-ear r', 'data-ear': o.ears || 'flop' }, P(earPath(1, o.ears, pup), e.v, e.line), fold(1, o.ears, c.sheen || c.ear)),
    E(0, -84, 21, 19, k.r, k.line), fur(0, -84, 21, 19, k.line, 200, 340, 7),
    E(-6, -95, 9, 4, '#FFFFFF', null, { opacity: 0.16 }),
    c.sheen ? E(-8, -96, 7, 3, c.sheen, null, { opacity: 0.35 }) : null,
    E(0, -73, 12, 9, m.r, m.line),
    E(0, -78, 5, 3.6, c.nose, dark(c.nose, 0.2)), E(-1.5, -79.2, 1.6, 0.9, '#FFFFFF', null, { opacity: 0.6 }),
    o.mouth === 'O' ? E(0, -68, 4.5, 6, '#6B2A22', dark('#6B2A22'), { class: 'r-howlO' }) : o.mouth === 'open' ? G({}, P('M-6 -70q6 9 12 0z', '#6B2A22', dark('#6B2A22')), P('M-3 -67q3 4 6 0z', '#F28CA0')) : L('M0 -74.5v3M-6 -70q6 5 12 0', m.line, 1.5),
    o.cover ? null : G({}, eye(-9, -87, c.iris, 4.2, false, o.shut, o.half ? c.coat : null), eye(9, -87, c.iris, 4.2, false, o.shut, o.half ? c.coat : null)));
  return G({ class: 'r-body' },
    ...(o.tail === 'back' ? [L('M-20 -14q-24 2 -36 -10', k.line, 10.5), L('M-20 -14q-24 2 -36 -10', c.coat, 8)] : [L('M20 -14q24 -4 24 -28', k.line, 10.5), L('M20 -14q24 -4 24 -28', c.coat, 8)]), // tail
    E(-19, -15, 17, 14, k.r, k.line), E(19, -15, 17, 14, k.r, k.line),
    E(0, -40, 24, 31, k.v, k.line), E(0, -36, 13, 22, c.belly, null, { opacity: 0.9 }), fur(0, -40, 24, 31, k.line, 150, 210, 5), fur(0, -40, 24, 31, k.line, 330, 390, 5),
    ...legs,
    P('M-17 -63q17 7 34 0v5q-17 7 -34 0z', c.collar, dark(c.collar)), T('circle', { cx: 0, cy: -56, r: 3, fill: '#F2C230', stroke: '#B38A17', 'stroke-width': 1 }),
    head,
    o.cover ? G({ class: 'r-cover' }, E(-9, -87, 7, 6, m.r, m.line), E(9, -87, 7, 6, m.r, m.line)) : null,
    o.toy ? G({ transform: o.toyAt === 'mouth' ? 'translate(0 -66)' : o.toyAt === 'up' ? 'translate(0 -100)' : 'translate(0 -30)' }, TOYS[o.toy](d)) : null);
}
// the king's crown: a small original gold band with three points, two dots and a twinkle (always on the cat)
function crown(d) {
  const g = tones(d, '#F2C230', 'g');
  return G({ class: 'r-crown', transform: 'translate(0 -104)' }, P('M-11 0l-2 -12l7 6l6 -10l6 10l7 -6l-2 12z', g.v, g.line), L('M-10 -3h20', '#FFF3B0', 1.4, { opacity: 0.8 }),
    T('circle', { cx: -5, cy: -3, r: 1.6, fill: '#E5484D' }), T('circle', { cx: 5, cy: -3, r: 1.6, fill: '#4AA3DF' }),
    P('M14 -16l1.2 3l3 1.2l-3 1.2l-1.2 3l-1.2 -3l-3 -1.2l3 -1.2z', '#FFFFFF', null, { class: 'r-sparkle' }), P('M-15 -10l.8 2l2 .8l-2 .8l-.8 2l-.8 -2l-2 -.8l2 -.8z', '#FFF3B0', null, { class: 'r-sparkle b' }));
}
// the cat (redrawn 2026-10-16): a chubby white king; brown-gray tabby (black stripes) on the head top, both ears, a patch round his LEFT eye,
// a big saddle across the back and side, and the tail; white blaze, muzzle, chin and paws (pink pads); long white whiskers;
// big green-yellow eyes; a thin dark collar with a small blank silver tag; the crown on top. data-mark names each marking.
function cat(d, o) {
  const T0 = '#8C7B6B', K0 = '#2B2622', W = '#FFFFFF'; const t = tones(d, T0, 'tb'); const w = tones(d, W, 'w'); const M = (m, ...x) => G({ 'data-mark': m }, ...x);
  const pads = (x, y) => G({}, ...[-2.4, 0, 2.4].map((dx) => T('circle', { cx: x + dx, cy: y + 1.6, r: 1.1, fill: '#F49AB0' })));
  const legs = o.pawsUp ? [P('M-12 -44q-12 -18 -8 -36l7 0q0 16 9 30z', w.v, w.line), P('M12 -44q12 -18 8 -36l-7 0q0 16 -9 30z', w.v, w.line), E(-17, -82, 5, 4.5, w.r, w.line), E(17, -82, 5, 4.5, w.r, w.line)]
    : [P('M-13 -40q-1 20 0 36q4.5 4 9 0q1 -16 0 -36z', W, w.line), P('M13 -40q1 20 0 36q-4.5 4 -9 0q-1 -16 0 -36z', W, w.line), E(-8.5, -2, 7, 4, w.r, w.line), E(8.5, -2, 7, 4, w.r, w.line), pads(-8.5, -3), pads(8.5, -3)];
  const tl = (dd, cls) => M('tail', L(dd, t.line, 10), L(dd, T0, 8, { class: cls }), L(dd, K0, 8, { 'stroke-dasharray': '3 6', opacity: 0.85 }));
  return G({ class: 'r-body' },
    o.tail === 'back' ? tl('M-18 -10q-30 0 -40 -14', 'r-tail') : o.tail === 'flick' ? tl('M18 -10q26 -6 22 -34q4 -8 12 -10', 'r-tail flick') : tl('M18 -10q30 -2 26 -40q-2 -10 -8 -8', 'r-tail'),
    E(-18, -14, 17, 14, w.r, w.line), E(18, -14, 17, 14, w.r, w.line),
    E(0, -40, 25, 31, w.v, w.line),
    M('saddle', P('M-6 -66q22 -4 28 14q4 18 -6 34q-12 -2 -18 -14q-10 -16 -4 -34z', t.v, t.line), L('M4 -62l4 6M14 -58l2 7M18 -46l-4 4M18 -34l-5 3', K0, 1.6)),
    fur(0, -40, 25, 31, w.line, 150, 210, 5),
    M('paws', ...legs),
    M('collar', L('M-14 -64q14 6 28 0', K0, 2.2), T('circle', { cx: 0, cy: -60, r: 2.6, fill: '#C8CDD3', stroke: '#8E969F', 'stroke-width': 1 })),
    G({ class: 'r-head', transform: o.chinUp ? 'rotate(-10 0 -80)' : '' },
      G({ class: 'r-ear l' }, M('ear', P('M-19 -92l2 -24l15 13z', t.v, t.line), P('M-16 -98l1 -12l7 7z', '#F2A7B8'), L('M-16 -108l4 2', K0, 1.4))),
      G({ class: 'r-ear r' }, M('ear', P('M19 -92l-2 -24l15 13z'.replace('15', '-15'), t.v, t.line), P('M16 -98l-1 -12l-7 7z', '#F2A7B8'), L('M16 -108l-4 2', K0, 1.4))),
      E(0, -86, 22, 18, w.r, w.line),
      M('cap', P('M-20 -92q4 -12 20 -12q16 0 20 12q-7 -4 -12 -3l-4 -8h-2l-4 8q-5 -1 -12 3z', t.v, null), L('M-7 -101l1 4M7 -101l-1 4', K0, 1.4)), // a white blaze up the middle
      M('patch', E(8.5, -88, 7.5, 6.5, T0, null), L('M3 -93l2 1.5M14 -93l-2 1.5', K0, 1.2)),
      P('M-3 -80h6l-3 3z', '#F49AB0', '#C9708A'), L('M-4 -74q2 2 4 0q2 2 4 0', '#8A8380', 1.2),
      M('whiskers', L('M-9 -77l-18 -4M-9 -75l-18 2M9 -77l18 -4M9 -75l18 2', '#BDB6AE', 1.8), L('M-9 -77l-18 -4M-9 -75l-18 2M9 -77l18 -4M9 -75l18 2', W, 0.9)),
      o.mouth === 'open' ? P('M-3 -73q3 5 6 0z', '#B34A55') : null,
      o.cover ? G({ class: 'r-cover' }, E(-8, -88, 6, 5, w.r, w.line), E(8, -88, 6, 5, w.r, w.line)) : G({}, eye(-8, -88, '#B9C94A', 4.6, true, o.shut, o.half ? T0 : null), eye(8.5, -88, '#B9C94A', 4.6, true, o.shut, o.half ? T0 : null)),
      crown(d)),
    o.toy ? G({ transform: o.toyAt === 'up' ? 'translate(0 -100)' : 'translate(0 -30)' }, TOYS[o.toy](d)) : null);
}
function bunny(d, o, oneUp) {
  const W = '#FBF8F4'; const EAR = '#A08C7A'; const PATCH = '#D2AD88'; const w = tones(d, W, 'w'); const e = tones(d, EAR, 'e');
  const lop = (s) => `M${s * 10} -76q${s * 16} -6 ${s * 19} 12q${s * 3} 16 ${-s * 3} 26q${-s * 6} 6 ${-s * 10} -2q${-s * 6} -14 ${-s * 6} -36z`;
  const lopIn = (s) => `M${s * 13} -72q${s * 9} 2 ${s * 11} 14q${s * 1} 10 ${-s * 2} 18`;
  const backE = (s) => `M${s * 8} -76q${s * 20} -14 ${s * 38} -6q${s * 6} 6 ${-s * 2} 10q${-s * 16} 4 ${-s * 34} 2z`;
  const up = oneUp && !o.wet && o.ears !== 'flop' && o.ears !== 'back';
  const earL = o.ears === 'back' ? backE(-1) : lop(-1);
  const earR = o.ears === 'back' ? backE(1) : up ? 'M5 -78q2 -30 12 -40q10 0 6 14q-4 18 -10 28z' : lop(1);
  const inL = o.ears === 'back' ? null : L(lopIn(-1), '#CDB8A4', 3, { opacity: 0.8 });
  const inR = o.ears === 'back' ? null : L(up ? 'M10 -80q2 -20 9 -32' : lopIn(1), '#CDB8A4', 3, { opacity: 0.8 });
  return G({ class: 'r-body' },
    T('circle', { cx: 22, cy: -14, r: 7, fill: w.r, stroke: w.line, 'stroke-width': 1.5 }),
    E(0, -26, 26, 24, w.r, w.line), E(0, -22, 14, 15, '#FFFFFF', null, { opacity: 0.6 }), fur(0, -26, 26, 24, w.line, 150, 390, 12),
    E(-12, -3, 10, 4.5, w.r, w.line), E(12, -3, 10, 4.5, w.r, w.line),
    o.pawsUp ? G({}, E(-18, -58, 5, 7, w.r, w.line), E(18, -58, 5, 7, w.r, w.line)) : null,
    G({ class: 'r-head' },
      E(0, -62, 20, 17, w.r, w.line), E(-8, -65, 5.5, 4.5, PATCH, null), E(8, -64.5, 4.5, 4, PATCH, null), E(0, -56, 7, 4.6, PATCH, null),
      G({ class: 'r-ear l', 'data-ear': o.ears === 'back' ? 'back' : 'down' }, P(earL, e.v, e.line), inL),
      G({ class: 'r-ear r', 'data-ear': o.ears === 'back' ? 'back' : up ? 'up' : 'down' }, P(earR, e.v, e.line), inR),
      E(0, -58.5, 3, 2.2, '#E88FA5', '#C9708A'), L('M-3 -55q3 3 6 0', '#B9A89A', 1.3),
      o.mouth === 'open' ? P('M-2.5 -54q2.5 4 5 0z', '#C9566A') : null,
      eye(-8, -66, '#5A3A24', 3.6, false, o.shut), eye(8, -66, '#5A3A24', 3.6, false, o.shut)));
}

// ---- the world: sky, the sun in sunglasses, clouds, ground, and the three depth layers --------------------------------
export function sky(defs, W, H) {
  defs.push(T('linearGradient', { id: 'r-sky', x1: 0, y1: 0.5, x2: 0, y2: 0.8 }, T('stop', { offset: 0, 'stop-color': '#BFE6FF' }), T('stop', { offset: 1, 'stop-color': '#EAF7FF' })));
  return T('rect', { class: 'r-sky', x: -W, y: -H, width: W * 3, height: H * 2, fill: 'url(#r-sky)' });
}
export function sun(x, y) {
  return G({ class: 'r-sun', transform: `translate(${x} ${y})` },
    G({ class: 'r-rays' }, ...Array.from({ length: 10 }, (_, i) => L(`M${(Math.cos(i * 0.628) * 34).toFixed(1)} ${(Math.sin(i * 0.628) * 34).toFixed(1)}L${(Math.cos(i * 0.628) * 44).toFixed(1)} ${(Math.sin(i * 0.628) * 44).toFixed(1)}`, '#F7C948', 3.5))),
    T('circle', { r: 28, fill: '#FFD95A', stroke: '#E9B730', 'stroke-width': 1.5 }), E(-8, -10, 12, 7, '#FFFFFF', null, { opacity: 0.35 }),
    G({ class: 'r-shades' }, P('M-20 -8h15q2 0 2 3l-2 7q-1 4 -6 4h-5q-5 0 -6 -5z', '#2F3A4A', '#1E2733'), P('M20 -8h-15q-2 0 -2 3l2 7q1 4 6 4h5q5 0 6 -5z', '#2F3A4A', '#1E2733'),
      L('M-3 -6h6M-20 -7l-7 -3M20 -7l7 -3', '#1E2733', 2), L('M-16 -5l5 0M8 -5l5 0', '#8FA6C4', 1.4)),
    L('M-11 10q11 10 22 0', '#A86B12', 2.4), E(-17, 7, 4, 2.5, '#F59A7A', null, { opacity: 0.6 }), E(17, 7, 4, 2.5, '#F59A7A', null, { opacity: 0.6 }));
}
export const cloud = (x, y, s = 1) => G({ class: 'r-cloud', transform: `translate(${x} ${y}) scale(${s})` }, P('M-30 8q-14 0 -12 -12q2 -10 14 -8q4 -14 20 -12q14 0 16 12q14 -2 16 10q0 10 -12 10z', '#FFFFFF', '#DDEBF5'), E(-6, -6, 14, 4, '#FFFFFF', null, { opacity: 0.7 }));
export const bird = (x, y, s = 1) => L(`M${x} ${y}q${5 * s} ${-5 * s} ${10 * s} 0q${5 * s} ${-5 * s} ${10 * s} 0`, '#5C6B7A', 1.6, { class: 'r-bird' });
export function ground(defs, W, top, H) {
  defs.push(T('linearGradient', { id: 'r-grass', x1: 0, y1: 0, x2: 0, y2: 1 }, T('stop', { offset: 0, 'stop-color': '#9BD57A' }), T('stop', { offset: 1, 'stop-color': '#5FAE4E' })));
  const tufts = Array.from({ length: 26 }, (_, i) => { const x = (i * 53) % W, y = top + 20 + ((i * 97) % (H - top - 20)); return `M${x} ${y}l-3 -7M${x} ${y}l0 -9M${x} ${y}l3 -7`; }).join('');
  return G({ class: 'r-ground' }, T('rect', { x: -W, y: top, width: W * 3, height: H - top + 200, fill: 'url(#r-grass)' }), P(`M-${W} ${top}q${W * 1.5} -14 ${W * 3} 0v12h-${W * 3}z`, '#B6E393', null, { opacity: 0.7 }), L(tufts, '#4C9A3E', 1.6));
}
const hazeDef = (defs) => { const id = `rh${++n}`; defs.push(T('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, T('stop', { offset: 0, 'stop-color': '#FFFFFF', 'stop-opacity': 0 }), T('stop', { offset: 0.5, 'stop-color': '#FFFFFF', 'stop-opacity': 0.25 }), T('stop', { offset: 1, 'stop-color': '#FFFFFF', 'stop-opacity': 0.25 }))); return `url(#${id})`; };
// a depth layer: far (35 %, blur 2, 25 % white haze), mid (60 %, blur 0.8), near (crisp); the layer's art is drawn at 1x
export function layer(defs, kind, W, horizon, ...kids) {
  if (kind === 'near') return G({ class: 'r-near' }, ...kids);
  const s = kind === 'far' ? 0.35 : 0.6; const f = blurDef(defs, kind === 'far' ? 2 : 0.8);
  const ox = (W - W * s) / 2;
  return G({ class: `r-${kind}`, 'data-depth': String(s) }, G({ transform: `translate(${ox} ${horizon - horizon * s}) scale(${s})`, filter: f }, ...kids),
    kind === 'far' ? T('rect', { x: -W, y: horizon - 120, width: W * 3, height: 124, fill: hazeDef(defs), class: 'r-haze' }) : null);
}
// ---- park things (each drawn at 1x at its own spot; the layer scales it) ----------------------------------------------
export function tree(defs, x, y, s = 1) {
  const t = tones(defs, '#8A5A36', 't'); const l = tones(defs, '#5DAF4E', 'l');
  return G({ class: 'r-tree', transform: `translate(${x} ${y}) scale(${s})` }, groundShadow(defs, 40, 8), P('M-8 0l2 -60h12l2 60z', t.v, t.line),
    T('circle', { cx: 0, cy: -84, r: 38, fill: l.r, stroke: l.line, 'stroke-width': 1.5 }), T('circle', { cx: -28, cy: -66, r: 24, fill: l.r, stroke: l.line, 'stroke-width': 1.5 }), T('circle', { cx: 28, cy: -64, r: 24, fill: l.r, stroke: l.line, 'stroke-width': 1.5 }),
    E(-12, -100, 14, 8, '#FFFFFF', null, { opacity: 0.18 }));
}
export function bush(defs, x, y, s = 1) { const l = tones(defs, '#6CBF59', 'u'); return G({ class: 'r-bush', transform: `translate(${x} ${y}) scale(${s})` }, groundShadow(defs, 34, 6), P('M-34 0q-6 -22 12 -24q4 -16 22 -12q16 -10 26 6q14 2 8 30z', l.r, l.line), T('circle', { cx: -14, cy: -14, r: 2.5, fill: '#F28CA0' }), T('circle', { cx: 10, cy: -20, r: 2.5, fill: '#FFE27A' })); }
export function bench(defs, x, y, s = 1) { const w = tones(defs, '#C98B4E', 'n'); return G({ class: 'r-bench', transform: `translate(${x} ${y}) scale(${s})` }, groundShadow(defs, 40, 6), T('rect', { x: -40, y: -34, width: 80, height: 8, rx: 2, fill: w.v, stroke: w.line, 'stroke-width': 1.5 }), T('rect', { x: -40, y: -20, width: 80, height: 7, rx: 2, fill: w.v, stroke: w.line, 'stroke-width': 1.5 }), L('M-34 -13v13M34 -13v13', '#5D6B78', 3)); }
export function fence(x, y, w) { return G({ class: 'r-fence' }, L(`M${x} ${y - 18}h${w}M${x} ${y - 8}h${w}`, '#E9DCC6', 3), L(Array.from({ length: Math.floor(w / 18) + 1 }, (_, i) => `M${x + i * 18} ${y}v-24`).join(''), '#D8C8AE', 3)); }
export const flower = (x, y, c = '#F28CA0') => G({ class: 'r-flower', transform: `translate(${x} ${y})` }, L('M0 0v-10', '#4C9A3E', 1.5), ...[0, 72, 144, 216, 288].map((a) => E(0, -15, 2.6, 4, c, dark(c, 0.2), { 'stroke-width': 0.8, transform: `rotate(${a} 0 -11)` })), T('circle', { cx: 0, cy: -11, r: 2, fill: '#FFD54A' }));
export const butterfly = (x, y) => G({ class: 'r-butterfly', transform: `translate(${x} ${y})` }, E(-5, 0, 5, 7, '#F7A7C9', '#D9779F', { 'stroke-width': 1 }), E(5, 0, 5, 7, '#F7A7C9', '#D9779F', { 'stroke-width': 1 }), L('M0 -5v10', '#5A4636', 1.6));
export const squirrel = (defs, x, y) => { const s = tones(defs, '#B5743F', 's'); return G({ class: 'r-squirrel', transform: `translate(${x} ${y})` }, groundShadow(defs, 12, 3), P('M6 -4q16 -4 12 -24q-8 2 -8 14z', s.r, s.line), E(0, -8, 8, 9, s.r, s.line), T('circle', { cx: -4, cy: -18, r: 5.5, fill: s.r, stroke: s.line, 'stroke-width': 1.5 }), T('circle', { cx: -6, cy: -19, r: 1, fill: '#2B1D14' })); };
export const kite = (x, y) => G({ class: 'r-kite', transform: `translate(${x} ${y})` }, P('M0 -14l10 14l-10 14l-10 -14z', '#E5484D', '#B8313A'), L('M-10 0h20M0 -14v28', '#FFFFFF', 1, { opacity: 0.7 }), L('M0 14q-8 14 4 24q-10 10 0 22', '#5C6B7A', 1));

// ---- the park's play things (metal: a highlight stripe; plastic: a gloss band) -----------------------------------------
const metal = (d, x1, y1, x2, y2, w = 5, c = '#9AA7B4') => G({}, L(`M${x1} ${y1}L${x2} ${y2}`, dark(c, 0.3), w + 1.5), L(`M${x1} ${y1}L${x2} ${y2}`, c, w), L(`M${x1} ${y1}L${x2} ${y2}`, '#FFFFFF', w * 0.3, { opacity: 0.6, transform: `translate(${-w * 0.2} 0)` }));
// the slide: a low ladder on the left, a gentle red plastic chute down to the right; `top` and `bottom` are where a pet sits
export function slide(defs, x, y) {
  const r = tones(defs, '#E5484D', 'd');
  return G({ class: 'r-slide', transform: `translate(${x} ${y})` }, groundShadow(defs, 80, 10, 10, 0),
    metal(defs, -62, 0, -56, -160), metal(defs, -30, 0, -26, -160),
    ...[0, 1, 2, 3, 4, 5].map((i) => metal(defs, -61 + i, -22 - i * 24, -29 + i * 0.7, -22 - i * 24, 4, '#B8C3CE')),
    T('rect', { x: -64, y: -168, width: 50, height: 10, rx: 4, fill: '#F2C230', stroke: dark('#F2C230'), 'stroke-width': 1.5 }),
    P('M-16 -168q18 0 32 62q16 76 52 92v14q-46 -14 -62 -96q-10 -60 -22 -60z', r.v, r.line),
    L('M-10 -164q14 4 28 60q16 72 48 86', '#FFFFFF', 4, { opacity: 0.45 }), // the gloss band
    metal(defs, -16, -168, -16, -198, 3), metal(defs, -62, -168, -62, -198, 3), metal(defs, -62, -196, -16, -196, 3));
}
// the ladder (bottom, top), the seat at the top, and the chute's surface at t in 0..1 with its angle in degrees
const chute = (t) => [-12 + t * 82, -170 + 156 * (1 - Math.pow(1 - t, 1.45)) + 6 * t];
export const SLIDE = { ladder: [[-44, -4], [-42, -166]], top: [-38, -170], path: chute,
  angle: (t) => { const [x0, y0] = chute(Math.max(0, t - 0.02)), [x1, y1] = chute(Math.min(1, t + 0.02)); return (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI; } };
// three short speed lines behind a moving thing (drawn in its own frame: behind = -x)
export const speedLines = () => L('M-46 -70h-18M-50 -50h-24M-46 -30h-18', '#FFFFFF', 3.5, { class: 'r-speed', opacity: 0.85 });
// a soft dust puff where something lands
export const dust = (k = 1) => G({ class: 'r-dust', opacity: String(Math.max(0, 1 - k)) }, ...[[-26, -4, 9], [-12, -8, 11], [12, -8, 11], [26, -4, 9]].map(([x, y, r]) => T('circle', { cx: x * (1 + k), cy: y - k * 6, r: r * (0.7 + k * 0.5), fill: '#E6D8BE', stroke: '#CDBB9A', 'stroke-width': 1 })));
export function swings(defs, x, y, a = 0, seatKids = []) {
  const s = tones(defs, '#4AA3DF', 'w');
  return G({ class: 'r-swings', transform: `translate(${x} ${y})` }, groundShadow(defs, 82, 10),
    metal(defs, -80, 0, -62, -220), metal(defs, -46, 0, -62, -220), metal(defs, 80, 0, 62, -220), metal(defs, 46, 0, 62, -220), metal(defs, -66, -218, 66, -218, 6),
    G({ class: 'r-seat', transform: `rotate(${a} 0 -218)` },
      L('M-22 -218v160M22 -218v160', '#7D8994', 2.2, { 'stroke-dasharray': '4 2' }),
      T('rect', { x: -30, y: -62, width: 60, height: 10, rx: 4, fill: s.v, stroke: s.line, 'stroke-width': 1.5 }), L('M-26 -60h52', '#FFFFFF', 2, { opacity: 0.55 }),
      G({ transform: 'translate(0 -58)' }, ...seatKids)));
}
// a puddle, a splash pad jet, water: 0.6 opacity with ripples and droplets
export const puddle = (x, y, s = 1) => G({ class: 'r-puddle', transform: `translate(${x} ${y}) scale(${s})` }, // a light tan puddle that reads wet: a splash ring, a shine, droplets
  E(0, 0, 36, 12, 'none', null, { stroke: '#9FD3F0', 'stroke-width': 2, 'stroke-dasharray': '6 4', opacity: 0.9 }),
  E(0, 0, 30, 9, MUD, MUD_LINE), E(2, 1, 22, 5.5, '#D9BE8A', null, { opacity: 0.9 }), E(-8, -2.5, 10, 2.2, '#FFFFFF', null, { opacity: 0.7 }), E(10, 2, 4, 1, '#FFFFFF', null, { opacity: 0.6 }),
  ...[[-34, -8], [33, -9], [-26, 10], [28, 9]].map(([dx, dy]) => T('circle', { cx: dx, cy: dy, r: 1.8, fill: '#9FD3F0', stroke: '#4AA3DF', 'stroke-width': 0.8 })));
export const water = (x, y, w, h) => G({ class: 'r-water' }, T('rect', { x, y, width: w, height: h, rx: 12, fill: '#5AB8F0', opacity: 0.6 }), L(Array.from({ length: Math.floor(w / 40) }, (_, i) => `M${x + 14 + i * 40} ${y + h / 2}q8 -4 16 0`).join(''), '#FFFFFF', 1.5, { opacity: 0.8 }));
// fruit and veg on the scooter path (never sweets)
export const FOOD = {
  banana: () => G({ class: 'r-food', 'data-food': 'banana' }, P('M-14 0q14 8 28 -6q-2 10 -14 12q-10 0 -14 -6z', '#F7D94C', '#C9A92A'), P('M-14 0q4 -3 6 0', '#7A5A2A', null)),
  carrot: () => G({ class: 'r-food', 'data-food': 'carrot' }, P('M-16 -4l28 -4q4 4 0 8l-28 0z', '#F28C28', '#C96A14'), L('M12 -4l6 -6M12 -4l8 -2M12 -4l6 4', '#4FA34A', 2)),
  strawberry: () => G({ class: 'r-food', 'data-food': 'strawberry' }, P('M0 8q-12 -6 -10 -14q4 -6 10 -2q6 -4 10 2q2 8 -10 14z', '#E5484D', '#B8313A'), P('M-6 -8q6 -4 12 0q-6 2 -12 0z', '#4FA34A', null), ...[[-4, -2], [3, -1], [0, 3]].map(([x, y]) => E(x, y, 0.8, 1.2, '#FFE27A'))),
};
export const stars = (k = 3) => G({ class: 'r-stars' }, ...Array.from({ length: k }, (_, i) => { const a = (i / k) * Math.PI * 2; const x = Math.cos(a) * 26, y = -120 + Math.sin(a) * 8;
  return P(`M${x} ${y - 7}l2 5l5 1l-4 3l1 5l-4 -3l-4 3l1 -5l-4 -3l5 -1z`, '#FFD54A', '#E0A82E'); }));
// a glowing dashed ring round the pet to drag; a ghost hand that shows the move once
export const grabRing = (r = 34, cy = -50) => T('circle', { class: 'r-grab', cx: 0, cy, r, fill: 'none', stroke: '#FFF3A8', 'stroke-width': 3, 'stroke-dasharray': '7 5' });
export const ghostHand = (arrow = '') => G({ class: 'r-ghost' }, T('circle', { class: 'r-ghost-ring', cx: 0, cy: 0, r: 22, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3, opacity: 0.8 }),
  arrow ? G({ class: 'r-ghost-arrow' }, L(arrow, '#4A6A86', 8, { opacity: 0.35 }), L(arrow, '#FFFFFF', 5, { 'stroke-dasharray': '10 7' })) : null,
  G({ class: 'r-ghost-hand', transform: 'translate(8 6)' }, P('M0 0l0 -2q0 -5 4 -5t4 5v12q2 -3 5 -2q3 1 3 4q2 -2 5 -1q3 1 3 4q3 -1 5 1q2 2 2 6v8q0 12 -12 14h-8q-8 0 -12 -8l-8 -14q-2 -4 2 -6t6 2l1 2z', '#FFFFFF', '#9AA7B4', { opacity: 0.55 })));

// ---- more of the park: the merry-go-round, a scooter and its path, the splash pad -------------------------------------
const plastic = (defs, c, k) => tones(defs, c, k);
// the merry-go-round from a low angle: a disc with a thick rim, a centre pole and metal hand bars; `rot` turns the bars
export function merry(defs, x, y, rot = 0, onDeck = []) { // onDeck: [[depth -1..1, node]], drawn with the bars and the pole back to front
  const d = plastic(defs, '#E5484D', 'm'); const y2 = plastic(defs, '#F2C230', 'y');
  const bars = [0, 1, 2, 3].map((i) => { const a = ((rot + i * 90) * Math.PI) / 180; return [Math.cos(a) * 112, Math.sin(a) * 28, Math.sin(a)]; });
  const bar = ([bx, by]) => G({}, metal(defs, bx * 0.25, by * 0.25 - 70, bx, by - 34, 4), metal(defs, bx, by - 34, bx, by - 4, 4));
  return G({ class: 'r-merry', transform: `translate(${x} ${y})` }, groundShadow(defs, 150, 18, 0, 22),
    E(0, 14, 144, 36, d.v, d.line), E(0, 0, 144, 36, y2.r, y2.line), L('M-120 -8q120 -30 240 0', '#FFFFFF', 3, { opacity: 0.5 }),
    ...[0, 1, 2, 3, 4, 5].map((i) => { const a = ((rot * 1 + i * 60) * Math.PI) / 180; return L(`M0 0L${(Math.cos(a) * 140).toFixed(1)} ${(Math.sin(a) * 35).toFixed(1)}`, dark('#F2C230', 0.2), 1.5, { opacity: 0.7 }); }),
    ...[...bars.map((b) => [b[2], bar(b)]), [0.05, G({ class: 'r-pole' }, metal(defs, 0, 0, 0, -74, 8), T('circle', { cx: 0, cy: -76, r: 9, fill: d.r, stroke: d.line, 'stroke-width': 1.5 }))], ...onDeck].sort((p, q) => p[0] - q[0]).map((p) => p[1]));
}
// a kid scooter seen from the side: deck, two wheels, a T bar; the pet stands on the deck
export function scooter(defs, kids = []) {
  const d = plastic(defs, '#4AA3DF', 'k');
  return G({ class: 'r-scooter' }, groundShadow(defs, 46, 7), metal(defs, 30, -10, 26, -92, 5), metal(defs, 14, -92, 38, -92, 5),
    T('rect', { x: -40, y: -16, width: 76, height: 9, rx: 4, fill: d.v, stroke: d.line, 'stroke-width': 1.5 }), L('M-36 -14h68', '#FFFFFF', 2, { opacity: 0.5 }),
    ...[-30, 30].map((wx) => G({}, T('circle', { cx: wx, cy: -6, r: 7, fill: '#3A3F46', stroke: '#24282D', 'stroke-width': 1.5 }), T('circle', { cx: wx, cy: -6, r: 2.5, fill: '#C9D3DC' }))),
    G({ transform: 'translate(-4 -14)' }, ...kids));
}
export const TOY = TOYS;
export const rock = () => G({ class: 'r-toy', 'data-toy': 'rock' }, P('M-7 2q-2 -7 4 -9q8 -2 10 4q2 6 -5 7z', '#9AA0A6', '#6F767D'), E(-2, -4, 3, 1.4, '#FFFFFF', null, { opacity: 0.4 }));
// the path she steers along: a soft tan band narrowing into the distance (near at the bottom)
export function path(defs, top, bottom, wTop, wBottom) {
  defs.push(T('linearGradient', { id: 'r-path', x1: 0, y1: 0, x2: 0, y2: 1 }, T('stop', { offset: 0, 'stop-color': '#E9D6B0' }), T('stop', { offset: 1, 'stop-color': '#D8BF8E' })));
  return G({ class: 'r-path' }, P(`M${180 - wTop / 2} ${top}C${180 - wTop} ${(top + bottom) / 2} ${180 - wBottom / 2 - 40} ${(top + bottom) / 2} ${180 - wBottom / 2} ${bottom}H${180 + wBottom / 2}C${180 + wBottom / 2 + 40} ${(top + bottom) / 2} ${180 + wTop} ${(top + bottom) / 2} ${180 + wTop / 2} ${top}z`, 'url(#r-path)', '#C2A876'),
    L(`M180 ${top + 10}V${bottom - 10}`, '#FFFFFF', 2, { opacity: 0.35, 'stroke-dasharray': '10 14' }));
}
// the splash pad: a pale round pad with jet nozzles; a live jet is a column of water (0.6) with droplets
export function splashPad(defs, x, y, rx, ry) {
  const c = plastic(defs, '#CFE6F2', 'p');
  return G({ class: 'r-pad', transform: `translate(${x} ${y})` }, E(0, 0, rx, ry, c.r, c.line), E(0, 0, rx * 0.7, ry * 0.7, 'none', '#A9CFE3', { 'stroke-width': 3, 'stroke-dasharray': '12 10' }),
    E(-rx * 0.3, -ry * 0.4, rx * 0.3, ry * 0.15, '#FFFFFF', null, { opacity: 0.4 }));
}
export const nozzle = (on) => G({ class: `r-nozzle${on ? ' on' : ''}` }, E(0, 0, 14, 5, '#8FA3B3', '#6E8494'), E(0, -1, 7, 2.5, '#5AB8F0', null));
export const jetTo = (dx, dy, f = 1, k = 0) => { const cx = dx / 2, cy = Math.min(0, dy) - 130; const B = (u) => [2 * (1 - u) * u * cx + u * u * dx, 2 * (1 - u) * u * cy + u * u * dy]; const n = 12, m = Math.max(2, Math.round(n * Math.min(1, f)));
  const pts = Array.from({ length: m + 1 }, (_, i) => B((i / n) * Math.min(1, f) * (n / m)));
  return G({ class: 'r-jet', 'data-hit': f >= 1 ? '1' : '0' }, L(`M${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L')}`, '#5AB8F0', 9, { opacity: 0.55 }), L(`M${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L')}`, '#FFFFFF', 2.5, { opacity: 0.7, 'stroke-dasharray': '5 9', 'stroke-dashoffset': String(-(k * 60) % 14) }),
    f >= 1 ? G({ transform: `translate(${dx} ${dy})` }, ...[[-14, -6], [10, -10], [0, 6], [16, 4]].map(([x, y]) => P(`M${x} ${y - 4}q-3 5 0 6q3-1 0-6z`, '#9FD6F5', '#5AAEE0'))) : null); };
export const sparkles = (k = 5) => G({ class: 'r-sparkles' }, ...Array.from({ length: k }, (_, i) => { const a = (i / k) * Math.PI * 2; const x = Math.cos(a) * 34, y = -50 + Math.sin(a) * 40;
  return P(`M${x} ${y - 6}l1.5 4.5l4.5 1.5l-4.5 1.5l-1.5 4.5l-1.5 -4.5l-4.5 -1.5l4.5 -1.5z`, '#FFFFFF', '#BFE6FF'); }));

// ---- the coaster park: a low gentle dragon coaster, teacups and a teapot; the fair backdrop --------------------------
// the close-up ride (Design rc1): station, climb, a whole loop, a flat spin, the turn (half roll), a barrel roll, the brake run.
// Segments are [name, seconds, shape(u) -> [x, y]]; the rail is one polyline with its length, so the car rides it by distance
const lin = (x0, y0, x1, y1) => (u) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
const bz = (a, b, c, d, u) => a * (1 - u) ** 3 + 3 * b * u * (1 - u) ** 2 + 3 * c * u * u * (1 - u) + d * u ** 3;
export const CO_SEGS = [['station', 0.35, lin(50, 740, 110, 740)], ['climb', 0.5, (u) => [bz(110, 170, 120, 180, u), bz(740, 740, 570, 570, u)]],
  ['loop', 1.2, (u) => [180 + 95 * Math.sin(u * 6.2832), 475 + 95 * Math.cos(u * 6.2832)]], ['spin', 0.7, lin(180, 570, 200, 570)],
  ['turn', 0.65, (u) => [200 + 45 * Math.sin(u * Math.PI), 615 - 45 * Math.cos(u * Math.PI)]], ['roll', 0.75, lin(200, 660, 150, 660)], ['brake', 0.35, lin(150, 660, 110, 660)]];
export const CO_T = CO_SEGS.reduce((t, s) => t + s[1], 0);
export const RAIL = []; // [x, y, length so far, segment]
CO_SEGS.forEach(([, , f], i) => { for (let k = i ? 1 : 0; k <= 60; k++) { const [x, y] = f(k / 60); const q = RAIL.at(-1); RAIL.push([x, y, q ? q[2] + Math.hypot(x - q[0], y - q[1]) : 0, i]); } });
export const railAt = (L) => { L = Math.max(0, Math.min(RAIL.at(-1)[2], L)); let i = 1; while (i < RAIL.length - 1 && RAIL[i][2] < L) i++; const p = RAIL[i - 1], q = RAIL[i], f = (L - p[2]) / (q[2] - p[2] || 1); return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]; };
export const railNear = (x, y, L = 0, w = 1e9) => Math.min(...RAIL.slice(1).map((q, i) => { const p = RAIL[i]; if (Math.abs(q[2] - L) > w) return 1e9; const dx = q[0] - p[0], dy = q[1] - p[1], f = Math.max(0, Math.min(1, ((x - p[0]) * dx + (y - p[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(x - p[0] - dx * f, y - p[1] - dy * f); }));
// (railNear: the distance to the rail, only within w of length L when given)
// where the car is at time t: the distance along the rail, the segment, its own progress u, the spin (scale x) and the roll (scale y)
const vis = (f) => (f < 0 ? -1 : 1) * Math.max(0.45, Math.abs(f)); // never thinner than 0.45: the car, pet and crown stay readable through a roll or the spin
export function coasterAt(t) {
  let i = 0, t0 = 0; while (i < CO_SEGS.length - 1 && t > t0 + CO_SEGS[i][1]) t0 += CO_SEGS[i++][1];
  const u = Math.max(0, Math.min(1, (t - t0) / CO_SEGS[i][1])), e = i === 6 ? 1 - (1 - u) ** 2 : u, idx = RAIL.findIndex((q) => q[3] === i);
  const L0 = idx ? RAIL[idx - 1][2] : 0, L1 = RAIL.findLast((q) => q[3] === i)[2];
  return { seg: CO_SEGS[i][0], u, L: L0 + (L1 - L0) * e, s: i === 3 ? vis(Math.cos(u * 6.2832)) : 1, f: vis(i === 4 ? Math.cos(u * Math.PI) : i === 5 ? -Math.cos(u * 6.2832) : i === 6 ? -1 : 1) };
}
export function coasterTrack(defs) {
  const d = RAIL.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  return G({ class: 'r-track' }, groundShadow(defs, 170, 10, 180, 752), ...RAIL.filter((q, i) => i % 30 === 0 && q[1] > 560).map(([x, y]) => metal(defs, x, y + 4, x, 752, 4, '#C9A35A')),
    L(d, '#7D3A2A', 7), L(d, '#C2563F', 4.5), L(d, '#FFFFFF', 1.2, { opacity: 0.5, transform: 'translate(0 -1.5)' }));
}
// a dragon-front coaster car with a visible lap bar; kids (the riders) sit inside, the car's front rim drawn over them
export function dragonCar(defs, kids = [], bar = true, over = false) { // over: the riders drawn over the car (in a roll they peek out)
  const g = plastic(defs, '#4FB35A', 'g');
  return G({ class: 'r-car' }, ...(over ? [] : kids),
    P('M-48 -4q0 -30 8 -34h62q8 0 10 10l6 24z', g.v, g.line, { class: 'r-carbody' }), L('M-42 -30h60', '#FFFFFF', 3, { opacity: 0.45 }),
    P('M36 -6q8 -32 26 -44q14 -6 18 6q2 10 -10 12q-6 0 -10 8q-6 12 -6 18z', g.v, g.line), T('circle', { cx: 68, cy: -44, r: 3, fill: '#FFFFFF' }), T('circle', { cx: 69, cy: -44, r: 1.6, fill: '#2B1D14' }),
    P('M58 -54l4 -10l4 8z', '#F2C230', '#B38A17'), L('M74 -38q4 2 6 0', '#2E6B34', 1.5),
    bar ? G({ class: 'r-lapbar' }, metal(defs, -40, -34, 20, -34, 4, '#F2C230'), metal(defs, -40, -34, -40, -24, 3, '#F2C230'), metal(defs, 20, -34, 20, -24, 3, '#F2C230')) : null, ...(over ? kids : []),
    ...[-34, 14].map((wx) => T('circle', { class: 'r-wheel', cx: wx, cy: -2, r: 6, fill: '#3A3F46', stroke: '#24282D', 'stroke-width': 1.5 })));
}
export function teacup(defs, c, kids = []) {
  const t = plastic(defs, c, 'c');
  return G({ class: 'r-cup' }, groundShadow(defs, 70, 10), E(0, -4, 72, 14, '#F7F1E6', '#D8CDB8'), ...kids,
    P('M-62 -60q4 56 62 58q58 -2 62 -58z', t.v, t.line), E(0, -60, 62, 12, light(c, 0.2), t.line, { 'fill-opacity': 0 }), L('M-52 -44q52 30 104 0', '#FFFFFF', 4, { opacity: 0.4 }),
    ...[-30, 0, 30].map((dx) => T('circle', { cx: dx, cy: -28, r: 6, fill: '#FFFFFF', opacity: 0.8 })),
    P('M60 -46q22 0 20 18q-2 14 -22 10', 'none', t.line, { 'stroke-width': 7, fill: 'none' }));
}
export function teapot(defs, x, y, s = 1) {
  const t = plastic(defs, '#8E5CC7', 'o');
  return G({ class: 'r-teapot', transform: `translate(${x} ${y}) scale(${s})` }, groundShadow(defs, 80, 12),
    P('M-70 -10q-10 -80 70 -84q80 4 70 84z', t.r, t.line), E(0, -94, 30, 8, t.v, t.line), T('circle', { cx: 0, cy: -106, r: 9, fill: '#F2C230', stroke: '#B38A17', 'stroke-width': 1.5 }),
    P('M66 -60q30 -10 40 -40l8 4q-6 36 -44 56z', t.v, t.line), P('M-66 -70q-34 4 -30 30q4 18 30 14', 'none', t.line, { 'stroke-width': 9 }), L('M-50 -60q50 -20 100 0', '#FFFFFF', 4, { opacity: 0.35 }),
    ...[-30, 0, 30].map((dx) => T('circle', { cx: dx, cy: -40, r: 8, fill: '#FFD54A', opacity: 0.9 })));
}
export function ferris(defs, x, y, s = 1) {
  return G({ class: 'r-ferris', transform: `translate(${x} ${y}) scale(${s})` }, L('M-60 0L0 -110L60 0', '#9AA7B4', 6), T('circle', { cx: 0, cy: -110, r: 90, fill: 'none', stroke: '#E5484D', 'stroke-width': 6 }),
    ...Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; const cx = Math.cos(a) * 90, cy = -110 + Math.sin(a) * 90; return G({}, L(`M0 -110L${cx} ${cy}`, '#C9D3DC', 3), T('rect', { x: cx - 10, y: cy, width: 20, height: 16, rx: 4, fill: ['#4AA3DF', '#F2C230', '#4FB35A', '#F28C28'][i % 4] })); }));
}
export function tent(defs, x, y, c = '#E5484D') {
  return G({ class: 'r-tent', transform: `translate(${x} ${y})` }, P('M-50 0V-50L0 -96L50 -50V0z', '#FFFFFF', '#D8CDB8'), ...[-30, -10, 10, 30].map((dx) => P(`M${dx - 10} 0V-50L0 -96L${dx + 10} -50V0z`, c, null, { opacity: 0.85 })), T('path', { d: 'M0 -96v-20l14 6l-14 6', fill: '#F2C230', stroke: '#B38A17', 'stroke-width': 1.5 }));
}
export const bunting = (y) => G({ class: 'r-bunting' }, L(`M-20 ${y}Q180 ${y + 30} 380 ${y}`, '#9AA7B4', 1.5), ...Array.from({ length: 12 }, (_, i) => { const x = i * 34; const yy = y + 30 * Math.sin((i / 11) * Math.PI) * 0.9; return P(`M${x} ${yy}l12 0l-6 14z`, ['#E5484D', '#F2C230', '#4AA3DF', '#4FB35A'][i % 4], null); }));
export const balloon = (x, y, c) => G({ class: 'r-balloon', transform: `translate(${x} ${y})` }, E(0, 0, 12, 15, c, dark(c, 0.25)), E(-4, -5, 3, 4, '#FFFFFF', null, { opacity: 0.5 }), L('M0 15q-4 14 2 30', '#7D8994', 1));

// ---- the water park: the deck and pool, a curly slide, the tipping bucket, the lazy river, sprayers, float targets ----
export function deck(defs, W, top, H) {
  defs.push(T('linearGradient', { id: 'r-deck', x1: 0, y1: 0, x2: 0, y2: 1 }, T('stop', { offset: 0, 'stop-color': '#F6E6C4' }), T('stop', { offset: 1, 'stop-color': '#E8CF9C' })));
  return G({ class: 'r-deck' }, T('rect', { x: -W, y: top, width: W * 3, height: H - top + 200, fill: 'url(#r-deck)' }), L(Array.from({ length: 12 }, (_, i) => `M-40 ${top + 30 + i * 50}h460`).join(''), '#E0C690', 1, { opacity: 0.6 }));
}
export function pool(x, y, w, h) {
  return G({ class: 'r-pool' }, T('rect', { x: x - 6, y: y - 6, width: w + 12, height: h + 12, rx: 20, fill: '#FFFFFF', stroke: '#D8CDB8', 'stroke-width': 1.5 }), water(x, y, w, h),
    L(Array.from({ length: 4 }, (_, i) => `M${x + 30 + i * 70} ${y + h * 0.3 + (i % 2) * 20}q10 -5 20 0q10 5 20 0`).join(''), '#FFFFFF', 1.5, { opacity: 0.7 }));
}
export const splash = (s = 1) => G({ class: 'r-splash', transform: `scale(${s})` }, ...[[-30, -20], [-16, -40], [0, -50], [16, -40], [30, -20]].map(([x, y]) => P(`M${x} ${y}q-6 10 0 14q6 -4 0 -14z`, '#9FD6F5', '#5AAEE0', { opacity: 0.9 })), E(0, 0, 40, 9, '#FFFFFF', '#BFE6FF', { opacity: 0.8 }));
export function umbrella(defs, x, y, c = '#F28C28') { return G({ class: 'r-umbrella', transform: `translate(${x} ${y})` }, metal(defs, 0, 0, 0, -90, 3), P('M-60 -80q60 -50 120 0q-20 -8 -40 0q-20 -8 -40 0q-20 -8 -40 0z', c, dark(c, 0.25)), L('M-30 -86q30 -24 60 0', '#FFFFFF', 3, { opacity: 0.4 })); }
export function lounger(defs, x, y) { return G({ class: 'r-lounger', transform: `translate(${x} ${y})` }, groundShadow(defs, 40, 5), P('M-40 -10h56l20 -26l6 4l-22 30h-60z', '#4AA3DF', '#2F7FB5'), L('M-34 -6v6M14 -6v6', '#9AA7B4', 3)); }
// a blue curly slide: a tower with a ladder, a tube that loops once and lands in the pool on the right
const TUBE = 'M-16 -168q40 -4 44 30q4 30 -24 34q-24 2 -16 -18q10 -18 40 -2q30 18 34 70q4 50 46 58v14q-52 -6 -60 -64q-6 -50 -24 -60q-14 -8 -20 0q-2 6 8 4q24 -6 20 -30q-4 -22 -48 -22z';
// Design r6: the rider rides INSIDE the tube: clipped to it, with the tube's see-through front drawn over it
export function inTube(defs, kids) {
  defs.push(T('clipPath', { id: 'rd-tube' }, P(TUBE, '#000')));
  return [G({ class: 'r-in-tube', 'clip-path': 'url(#rd-tube)' }, G({ transform: 'translate(0 24)' }, ...kids)), P(TUBE, '#3D8FE0', '#2C6FB5', { class: 'r-tube-front', opacity: 0.4 }),
    L('M-10 -164q34 -2 36 26', '#FFFFFF', 3, { opacity: 0.5 }), L('M40 -96q24 18 28 64', '#FFFFFF', 3, { opacity: 0.5 })];
}
export function curlySlide(defs, x, y) {
  const b = plastic(defs, '#3D8FE0', 'q');
  return G({ class: 'r-curly', transform: `translate(${x} ${y})` }, groundShadow(defs, 90, 10, 10, 0),
    metal(defs, -62, 0, -56, -160), metal(defs, -30, 0, -26, -160), ...[0, 1, 2, 3, 4, 5].map((i) => metal(defs, -61 + i, -22 - i * 24, -29 + i * 0.7, -22 - i * 24, 4, '#B8C3CE')),
    T('rect', { x: -64, y: -168, width: 50, height: 10, rx: 4, fill: '#F2C230', stroke: dark('#F2C230'), 'stroke-width': 1.5 }),
    P(TUBE, b.v, b.line),
    L('M-10 -164q34 -2 36 26', '#FFFFFF', 3, { opacity: 0.5 }), L('M40 -96q24 18 28 64', '#FFFFFF', 3, { opacity: 0.5 }),
    metal(defs, -16, -168, -16, -198, 3), metal(defs, -62, -168, -62, -198, 3), metal(defs, -62, -196, -16, -196, 3));
}
// the curly tube's own centre line (the drawn tube's inner edge, the same curves), sampled evenly by length: the rider rides in it
const CURL_SEG = [[-16, -168], [24, -172, 28, -138], [32, -108, 4, -104], [-20, -102, -12, -122], [-2, -140, 28, -124], [58, -106, 62, -54], [66, -4, 108, 4]];
const CURL_PTS = (() => { const out = []; let [x0, y0] = CURL_SEG[0];
  for (const [cx, cy, x1, y1] of CURL_SEG.slice(1)) { for (let i = 0; i < 24; i++) { const u = i / 24; out.push([(1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1]); } [x0, y0] = [x1, y1]; }
  out.push([x0, y0]); const len = [0]; for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return out.map((p, i) => [...p, len[i] / len[len.length - 1]]); })();
const curl = (t) => { const u = Math.max(0, Math.min(1, t)); let i = CURL_PTS.findIndex((p) => p[2] >= u); if (i <= 0) return CURL_PTS[0].slice(0, 2);
  const [ax, ay, au] = CURL_PTS[i - 1], [bx, by, bu] = CURL_PTS[i]; const f = (u - au) / (bu - au || 1); return [ax + (bx - ax) * f, ay + (by - ay) * f]; };
// the tilt follows the tube but is folded into +-35 deg (a tube that turns back on itself never turns the pet upside down)
const foldTilt = (g) => { let a = g; if (a > 90) a = 180 - a; if (a < -90) a = -180 - a; return Math.max(-35, Math.min(35, a)); };
export const CURLY = { ladder: [[-44, -4], [-42, -166]], top: [-38, -170], path: curl, angle: (t) => { const [x0, y0] = curl(Math.max(0, t - 0.02)), [x1, y1] = curl(Math.min(1, t + 0.02)); return foldTilt((Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI); },
  pool: [22, -24, 116, 40], land: [64, -4] }; // the pool's water top is y -24; the pet lands in it, the splash ring on the water
// the tipping bucket on a frame over the pad; `n` drops in it (0..5) shown as its water level; `tip` 0..1 tips it
// the pail's mouth (the middle of its rim) once tipped: the rim's lower end, where the water leaves it
export const TIP = 125, AXLE = -266; // degrees at full tip; the pail's axle (its middle) on the frame
export const mouth = (tip) => { const a = (tip * TIP * Math.PI) / 180; return [34 * Math.sin(a), AXLE - 34 * Math.cos(a)]; }; // the rim's middle, 34 above the axle
export function bucket(defs, x, y, n = 0, tip = 0, flow = tip > 0.6, to = -96) { // flow: the stream only while it pours (it clears after the tip); `to`: the pet's head
  const r = plastic(defs, '#F28C28', 'b');
  return G({ class: 'r-bucket', transform: `translate(${x} ${y})` }, groundShadow(defs, 100, 10), metal(defs, -90, 0, -90, -330, 8), metal(defs, 90, 0, 90, -330, 8), metal(defs, -94, -326, 94, -326, 7),
    metal(defs, -90, AXLE, -40, AXLE, 4), metal(defs, 40, AXLE, 90, AXLE, 4),
    G({ class: 'r-pail', transform: `rotate(${tip * TIP} 0 ${AXLE})` }, P('M-50 -300h100l-10 70h-80z', r.v, r.line), L('M-46 -294h92', '#FFFFFF', 3, { opacity: 0.45 }),
      n > 0 ? T('rect', { class: 'r-level', x: -40 + n * 0.6, y: -236 - n * 11, width: 80 - n * 1.2, height: n * 11, fill: '#5AB8F0', opacity: 0.6 }) : null,
    ),
    ...Array.from({ length: 5 }, (_, i) => T('circle', { class: `r-drop${i < n ? ' on' : ''}`, cx: -78 + i * 16 + (i > 1 ? 92 : 0), cy: -338, r: 4.5, fill: i < n ? '#5AB8F0' : '#FFFFFF', stroke: '#3E9ED6', 'stroke-width': 1.2 })),
    flow ? (() => { const [mx, my] = mouth(tip); return G({ class: 'r-stream', 'data-from': `${mx.toFixed(1)} ${my.toFixed(1)}`, 'data-to': `0 ${to}` },
      P(`M${mx - 16} ${my}C${mx - 18} ${my + 50} -24 ${to - 60} -26 ${to}h52C24 ${to - 60} ${mx + 18} ${my + 50} ${mx + 16} ${my}z`, '#5AB8F0', '#3E9ED6', { opacity: 0.65 }),
      L(`M${mx} ${my + 6}C${mx} ${my + 50} 0 ${to - 60} 0 ${to - 6}`, '#FFFFFF', 2, { opacity: 0.7, 'stroke-dasharray': '6 10' })); })() : null,
    G({ class: 'r-spout', transform: 'translate(0 -350)' }, P('M-8 0v-20h46v10h-36v10z', '#9AA7B4', '#6E7E8E')));
}
export const ring = (defs, c = '#E5484D', kids = [], front = true) => { const t = plastic(defs, c, 'r'); return G({ class: 'r-ring' }, E(0, 0, 54, 16, t.r, t.line), E(0, -2, 34, 8, '#5AB8F0', null, { opacity: 0.6 }), ...kids, front ? P('M-54 0q0 16 54 16q54 0 54 -16q-10 10 -54 10q-44 0 -54 -10z', t.v, t.line) : null, ...[-40, 0, 40].map((dx) => E(dx, 6, 6, 3, '#FFFFFF', null, { opacity: 0.85 }))); };
export const boat = (defs, kids = []) => { const t = plastic(defs, '#F2C230', 'a'); return G({ class: 'r-boat' }, ...kids, P('M-56 -20h112q-6 26 -56 26q-50 0 -56 -26z', t.v, t.line), L('M-48 -14h96', '#FFFFFF', 2, { opacity: 0.5 })); };
// the lazy river: a looping band of water seen low (an ellipse ring)
export function river(defs, cx, cy, rx, ry, w) {
  return G({ class: 'r-river' }, E(cx, cy, rx + w / 2 + 8, ry + w / 4 + 6, '#FFFFFF', '#D8CDB8'), E(cx, cy, rx + w / 2, ry + w / 4, '#5AB8F0', '#3E9ED6', { opacity: 0.6 }), E(cx, cy, rx - w / 2, ry - w / 4, 'url(#r-deck)', '#D8CDB8'),
    L(Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return `M${(cx + Math.cos(a) * rx).toFixed(1)} ${(cy + Math.sin(a) * ry).toFixed(1)}q8 -4 16 0`; }).join(''), '#FFFFFF', 1.5, { opacity: 0.8 }),
    E(cx, cy, rx - w / 2 - 10, ry - w / 4 - 6, '#8FD07A', '#6CB25A'), ...[[-40, 0], [30, -6], [0, 8]].map(([dx, dy]) => flower(cx + dx, cy + dy, '#F28CA0')));
}
// a sprayer post; when on, the arc moves frame by frame (k, seconds): the dashes run along it, the end sways, drops fall
export const sprayer = (defs, on, c = '#4FB35A', k = 0, aim = [120, 30]) => { const t = plastic(defs, c, 's');
  const [ax, ay] = [aim[0] + Math.sin(k * 5) * 10, aim[1] + Math.cos(k * 4) * 6]; const cx = (8 + ax) / 2 + 24, cy = Math.min(-76, ay) - 90 + Math.sin(k * 6) * 8;
  const d = `M8 -76Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ax.toFixed(1)} ${ay.toFixed(1)}`;
  const at = (u) => [(1 - u) ** 2 * 8 + 2 * (1 - u) * u * cx + u * u * ax, (1 - u) ** 2 * -76 + 2 * (1 - u) * u * cy + u * u * ay];
  return G({ class: `r-sprayer${on ? ' on' : ''}` }, groundShadow(defs, 20, 5), metal(defs, 0, 0, 0, -70, 7, c), T('circle', { cx: 0, cy: -74, r: 11, fill: t.r, stroke: t.line, 'stroke-width': 1.5 }),
    on ? P(d, 'none', '#5AB8F0', { 'stroke-width': 7, opacity: 0.6 }) : null, on ? L(d, '#FFFFFF', 1.5, { 'stroke-dasharray': '3 9', 'stroke-dashoffset': String((-k * 60).toFixed(1)), opacity: 0.9 }) : null,
    ...(on ? [0, 1, 2].map((i) => { const [x, y] = at(((k * 1.4 + i / 3) % 1)); return T('circle', { class: 'r-spray-drop', cx: x.toFixed(1), cy: y.toFixed(1), r: 3.2, fill: '#9FD6F5', stroke: '#5AAEE0', 'stroke-width': 1 }); }) : [])); };
export const target = (defs, c) => { const t = plastic(defs, c, 't'); return G({ class: 'r-target' }, E(0, 0, 34, 10, t.r, t.line), E(0, -1, 20, 5, '#5AB8F0', null, { opacity: 0.7 }), E(0, 0, 10, 3, '#FFFFFF')); };
export const frisbee = (d, c) => disc(d, { blue: '#3D7BE0', green: '#4FB35A', yellow: '#F2C230' }[c] || '#F2C230', `frisbee-${c}`);

TOYS.rock = rock;
