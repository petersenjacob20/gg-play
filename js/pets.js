// Original cartoon pets and friends, drawn by hand from simple shapes (design.md sections 6 and 6b).
// Never traced from a photo. Each drawing is a plain data tree ([tag, attrs, ...children]) so Node
// tests can check it; dom.js svg() turns it into SVG nodes. viewBox is 0 0 120 120, feet at y~116.
// Shared style: round head, floppy rounded ears, small solid dot eyes with a white sparkle (never
// googly), a small smile and a 3px dark-brown outline. Poses (idle, happy, hmm) are CSS classes on
// the wrapper: groups .head .ear .tail move; .only-happy parts show only in the happy pose.

export const INK = '#4A3426';
const O = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const O2 = { stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const r1 = (n) => Math.round(n * 10) / 10;

const el = (tag, attrs, ...kids) => [tag, attrs, ...kids];
const g = (cls, ...kids) => el('g', cls ? { class: cls } : {}, ...kids);
const ell = (cx, cy, rx, ry, fill, extra = {}) => el('ellipse', { cx, cy, rx, ry, fill, ...O, ...extra });
const circ = (cx, cy, r, fill, extra = {}) => el('circle', { cx, cy, r, fill, ...O, ...extra });
const path = (d, fill, extra = {}) => el('path', { d, fill, ...O, ...extra });
const line = (d, color = INK, w = 2.5) => el('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// Small dot eye: an optional colored iris ring, a dark center and a white sparkle. Radius <= 4.
export function eye(cx, cy, iris) {
  return g('eye-wrap',
    iris ? el('circle', { class: 'eye', cx, cy, r: 3.9, fill: iris, stroke: INK, 'stroke-width': 1 }) : null,
    el('circle', { class: 'eye', cx, cy, r: iris ? 2.3 : 3.4, fill: '#2B1D14' }),
    el('circle', { class: 'sparkle', cx: r1(cx + 1.1), cy: r1(cy - 1.2), r: 1.1, fill: '#FFFFFF' }));
}

// A thick outlined stroke (tails, noodle bodies): dark wide stroke under a colored narrower one.
function tube(d, color, width) {
  return g('',
    el('path', { d, fill: 'none', stroke: INK, 'stroke-width': width + 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    el('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
}

// One horizontal band of an ellipse (for Dottie's stripes) as a path along the ellipse edge.
function band(cx, cy, rx, ry, y1, y2, fill) {
  const half = (y) => rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
  const a = half(y1); const b = half(y2);
  const d = `M${r1(cx - a)} ${y1}L${r1(cx + a)} ${y1}A${rx} ${ry} 0 0 1 ${r1(cx + b)} ${y2}L${r1(cx - b)} ${y2}A${rx} ${ry} 0 0 1 ${r1(cx - a)} ${y1}Z`;
  return el('path', { d, fill, stroke: 'none' });
}

const smile = (x, y, w = 6) => line(`M${x - w} ${y}q${w} ${w * 0.8} ${w * 2} 0`);
const tongue = (x, y) => path(`M${x - 4} ${y}h8v4a4 4 0 0 1-8 0z`, '#F28CA0', { 'stroke-width': 2, class: 'only-happy' });

// ---- dogs (labs): one builder, colors by coat --------------------------------------------------
function dog(c) {
  const p = c.puppy;
  const head = p ? { cy: 44, rx: 27, ry: 25 } : { cy: 42, rx: 23, ry: 21 };
  const body = p ? { cy: 94, rx: 22, ry: 19 } : { cy: 90, rx: 27, ry: 23 };
  const eyeY = head.cy - 3;
  const eyeDX = p ? 10 : 9;
  const earRy = p ? 21 : 15;
  const earX = p ? 33 : 37;
  return g('char',
    g('tail', tube(p ? 'M78 100q14-2 16-16' : 'M84 96q18-4 20-22', c.coat, 8)),
    g('body',
      ell(p ? 42 : 38, 104, 10, 8, c.coat),
      ell(p ? 78 : 82, 104, 10, 8, c.coat),
      ell(60, body.cy, body.rx, body.ry, c.coat),
      c.belly ? el('ellipse', { cx: 60, cy: body.cy + 4, rx: body.rx * 0.5, ry: body.ry * 0.62, fill: c.belly }) : null,
      c.shine ? el('ellipse', { cx: 50, cy: body.cy - 13, rx: 10, ry: 3.5, fill: c.shine, opacity: 0.9 }) : null,
      ell(49, 111, p ? 11 : 9, p ? 7 : 6, c.coat),
      ell(71, 111, p ? 11 : 9, p ? 7 : 6, c.coat),
      el('rect', { x: 41, y: p ? 70 : 64, width: 38, height: 7, rx: 3.5, fill: c.collar, ...O2 }),
      circ(60, p ? 80 : 74, 3.5, '#FFD54A', { 'stroke-width': 2 })),
    g('head',
      ell(60, head.cy, head.rx, head.ry, c.coat),
      c.shine ? el('ellipse', { cx: 52, cy: head.cy - 13, rx: 9, ry: 3.5, fill: c.shine, opacity: 0.9 }) : null,
      g('ear l', ell(earX, head.cy + 2, 9, earRy, c.ear, { transform: `rotate(18 ${earX} ${head.cy + 2})` })),
      g('ear r', ell(120 - earX, head.cy + 2, 9, earRy, c.ear, { transform: `rotate(-18 ${120 - earX} ${head.cy + 2})` })),
      ell(60, head.cy + 10, p ? 12 : 13, p ? 8.5 : 9.5, c.muzzle, { 'stroke-width': 2.5 }),
      el('ellipse', { cx: 60, cy: head.cy + 5.5, rx: 5, ry: 3.6, fill: c.nose }),
      line(`M60 ${head.cy + 9}v3`),
      smile(60, head.cy + 12, 5),
      tongue(60, head.cy + 13),
      eye(60 - eyeDX, eyeY, c.iris),
      eye(60 + eyeDX, eyeY, c.iris),
      c.frisbee ? frisbeeHeld(70, head.cy + 16) : null));
}

// The Yellow Dog's happy-pose frisbee: a red disc held at the side of the mouth and tilted, with a
// darker rim and a white lip ring, so it reads as a frisbee and never as a strap in the green collar color.
const FRISBEE = { top: '#E5484D', rim: '#B8313A', ring: '#FFFFFF' };
function frisbeeHeld(cx, cy) {
  return el('g', { class: 'only-happy frisbee', transform: `rotate(-22 ${cx} ${cy})` },
    ell(cx, cy + 2.5, 15, 6, FRISBEE.rim, { 'stroke-width': 2.5 }),
    ell(cx, cy, 15, 6, FRISBEE.top, { 'stroke-width': 2.5 }),
    el('ellipse', { cx, cy, rx: 10, ry: 3.6, fill: 'none', stroke: FRISBEE.ring, 'stroke-width': 2.2 }));
}

const DOGS = {
  yellowDog: { coat: '#F3D58C', ear: '#E7C06A', muzzle: '#FBF0D5', belly: '#FBF0D5', nose: '#4A3426', collar: '#5DBB63', frisbee: true },
  chocolateDog: { coat: '#7B4A2D', ear: '#5E3620', muzzle: '#8C5A3A', nose: '#3A2014', iris: '#D9A23A', collar: '#F28C28' },
  gingerDog: { coat: '#E08A3C', ear: '#C9702A', muzzle: '#EBA466', nose: '#6B3F22', iris: '#D9A23A', collar: '#4AA3DF' },
  blackDog: { coat: '#2A2626', ear: '#1E1B1B', muzzle: '#383333', shine: '#6E7E99', nose: '#111111', iris: '#8A5A2B', collar: '#8E5CC7' },
  puppy: { coat: '#F5DC9C', ear: '#E9C674', muzzle: '#FCF2DA', belly: '#FCF2DA', nose: '#4A3426', collar: '#E5484D', puppy: true },
};

// ---- black-and-white cat --------------------------------------------------------------------
function kitty() {
  const B = '#262222'; const W = '#FFFFFF';
  return g('char',
    g('tail', tube('M82 100q22-6 18-30q-2-8-8-5', B, 8)),
    g('body',
      ell(60, 90, 25, 22, B),
      el('ellipse', { cx: 60, cy: 95, rx: 14, ry: 16, fill: W }),
      ell(49, 111, 9, 6, W),
      ell(71, 111, 9, 6, W),
      el('rect', { x: 43, y: 65, width: 34, height: 6, rx: 3, fill: '#FFD54A', ...O2 }),
      circ(60, 75, 4, '#FFD54A', { 'stroke-width': 2 }),
      line('M57 76h6', INK, 1.5)),
    g('head',
      g('ear l', path('M39 33L42 12L57 25Z', B), path('M43 26l1-8l6 5z', '#F49AB0', { stroke: 'none' })),
      g('ear r', path('M81 33L78 12L63 25Z', B), path('M77 26l-1-8l-6 5z', '#F49AB0', { stroke: 'none' })),
      ell(60, 42, 23, 20, B),
      el('ellipse', { cx: 60, cy: 51, rx: 16, ry: 10.5, fill: W }),
      path('M56 27q4-2 8 0l2 18h-12z', W, { stroke: 'none' }),
      path('M57 47h6l-3 3.4z', '#F49AB0', { 'stroke-width': 1.5 }),
      line('M56 53q2 2 4 0q2 2 4 0', INK, 2),
      line('M47 50l-12-3M47 53l-12 2M73 50l12-3M73 53l12 2', INK, 1.5),
      tongue(60, 54.5),
      eye(50, 40, '#9DB89A'),
      eye(70, 40, '#9DB89A')));
}

// ---- white lop bunny (one, or a pair where one has an ear flipped up) ------------------------
function oneBunny(flip) {
  const W = '#FFFFFF'; const EAR = '#A08C7A'; const PATCH = '#D2AD88';
  return g('char',
    g('body',
      circ(86, 100, 7, W),
      ell(60, 92, 26, 21, W),
      ell(46, 111, 11, 5, W),
      ell(74, 111, 11, 5, W)),
    g('head',
      ell(60, 52, 22, 19, W),
      el('ellipse', { cx: 51, cy: 49, rx: 6, ry: 5, fill: PATCH }),
      el('ellipse', { cx: 69, cy: 49.5, rx: 5, ry: 4.5, fill: PATCH }),
      el('ellipse', { cx: 60, cy: 59, rx: 7.5, ry: 5, fill: PATCH }),
      g('ear l', ell(37, 58, 8, 21, EAR, { transform: 'rotate(14 37 58)' })),
      flip ? g('ear r flip', ell(80, 24, 7, 18, EAR, { transform: 'rotate(32 80 24)' }))
        : g('ear r', ell(83, 58, 8, 21, EAR, { transform: 'rotate(-14 83 58)' })),
      el('ellipse', { class: 'nose', cx: 60, cy: 56.5, rx: 3.2, ry: 2.3, fill: '#E88FA5' }),
      line('M57 60q3 3 6 0', INK, 2),
      eye(51, 49),
      eye(69, 49)));
}
// The second bunny on its own: the same white lop drawing with one ear flipped up.
const bunny2 = () => oneBunny(true);
function bunny({ pair = false } = {}) {
  if (!pair) return oneBunny(false);
  return g('pair',
    el('g', { transform: 'translate(-2 34) scale(0.68)' }, oneBunny(false)),
    el('g', { transform: 'translate(40 34) scale(0.68)' }, oneBunny(true)));
}

// ---- friends --------------------------------------------------------------------------------
// Bloop: a smooth round tangerine ball, pale-peach tummy, tiny nub horns, stubby legs, gap-tooth grin.
function friendSilly() {
  const T = '#F7931E';
  return g('char',
    g('body',
      ell(47, 109, 9, 7, T),
      ell(73, 109, 9, 7, T),
      ell(20, 72, 6, 9, T, { transform: 'rotate(20 20 72)' }),
      ell(100, 72, 6, 9, T, { transform: 'rotate(-20 100 72)' })),
    g('head',
      circ(44, 25, 6, '#FFE0B5'),
      circ(76, 25, 6, '#FFE0B5'),
      circ(60, 66, 40, T),
      el('ellipse', { cx: 60, cy: 84, rx: 22, ry: 16, fill: '#FFD9B3' }),
      path('M41 66Q60 88 79 66Z', '#7A2E1F', { 'stroke-width': 2.5 }),
      el('rect', { x: 52, y: 66.5, width: 6, height: 6, rx: 1, fill: '#FFFFFF' }),
      el('rect', { x: 62, y: 66.5, width: 6, height: 6, rx: 1, fill: '#FFFFFF' }),
      path('M54 78q6 -3 12 0q0 8 -6 8q-6 0 -6-8z', '#F28CA0', { 'stroke-width': 2, class: 'only-happy' }),
      eye(48, 50),
      eye(72, 50)));
}

// The strawberry (design.md 9.8): red, a green leafy top, little yellow seed dots, a brown outline.
// Shared by Berry's paw (small) and the treat / sticker picture (art.js), drawn around (50, 58) in a
// 100 box and scaled to size; `line` keeps the outline at about 3 px whatever the scale.
export function strawberry(cx = 50, cy = 58, scale = 1, line = 3) {
  const w = r1(line / scale);
  const o = { stroke: INK, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  return el('g', { class: 'berry', transform: `translate(${r1(cx - 50 * scale)} ${r1(cy - 58 * scale)}) scale(${scale})` },
    el('path', { d: 'M50 92C34 82 16 64 18 44C20 30 34 26 50 31C66 26 80 30 82 44C84 64 66 82 50 92Z', fill: '#E5484D', ...o }),
    ...[[36, 46], [50, 44], [64, 46], [42, 58], [58, 58], [50, 70], [36, 66], [64, 66], [50, 82]].map(([x, y]) => el('ellipse', { cx: x, cy: y, rx: 1.8, ry: 2.6, fill: '#FFE27A' })),
    el('path', { d: 'M30 32Q38 20 50 28Q62 20 70 32Q60 38 50 33Q40 38 30 32Z', fill: '#5DBB63', ...o }),
    el('path', { d: 'M50 28q0-10 5-16', fill: 'none', stroke: '#3E8E46', 'stroke-width': r1(4 * w / 3), 'stroke-linecap': 'round' }));
}

// Berry (design.md 6b and 9.8): a tall bendy peach noodle with a cream belly, rosy
// cheeks and two little round ears, holding a strawberry. Happy: a tiny polite bite (the strawberry
// gets a little smaller). No crumbs.
function friendBerry() {
  const P = '#F9C2A0';
  return g('char',
    g('body',
      ell(50, 112, 9, 5, P),
      ell(70, 112, 9, 5, P),
      tube('M60 108C42 90 78 74 60 46', P, 28),
      line('M57 104C46 92 70 80 62 62', '#FFF1DC', 10),
      tube('M48 76q-8 0-12-8', P, 5)),
    g('head',
      circ(48, 15, 6, P),
      circ(76, 15, 6, P),
      circ(62, 30, 18, P),
      el('circle', { cx: 51, cy: 36, r: 3.8, fill: '#F59A9A' }),
      el('circle', { cx: 73, cy: 36, r: 3.8, fill: '#F59A9A' }),
      smile(62, 37, 5),
      eye(56, 28),
      eye(68, 28)),
    g('treat-hand', strawberry(33, 62, 0.3, 2.5)));
}

// Dottie: a small round fuzzy-looking moth with mint and butter-yellow stripes, two curly feelers,
// soft rounded wings with 5 dots on each wing in a row (10 in all, like a ten-frame).
function friendCounter() {
  const MINT = '#A8E6CF'; const BUTTER = '#FFE699'; const WING = '#FFF4D6'; const DOT = '#3BA67F';
  const dots = (x0, x1) => [0, 1, 2, 3, 4].map((i) => el('circle', { class: 'wing-dot', cx: r1(x0 + (x1 - x0) * i / 4), cy: r1(48 + i * 10), r: 3.6, fill: DOT }));
  return g('char',
    g('wings',
      g('wing l', ell(32, 66, 25, 31, WING, { transform: 'rotate(-10 32 66)' }), ...dots(27, 31)),
      g('wing r', ell(88, 66, 25, 31, WING, { transform: 'rotate(10 88 66)' }), ...dots(93, 89))),
    g('body',
      ell(52, 111, 6, 4, MINT),
      ell(68, 111, 6, 4, MINT),
      el('ellipse', { cx: 60, cy: 76, rx: 19, ry: 30, fill: MINT }),
      band(60, 76, 19, 30, 56, 64, BUTTER),
      band(60, 76, 19, 30, 72, 80, BUTTER),
      band(60, 76, 19, 30, 88, 96, BUTTER),
      ell(60, 76, 19, 30, 'none'),
      ...[44, 50, 56, 62, 68, 74].map((x) => circ(x, 48, 4, '#FFFFFF', { 'stroke-width': 1.5 }))),
    g('head',
      g('antennae', line('M54 22q-4-14-14-12q-5 3 0 7'), line('M66 22q4-14 14-12q5 3 0 7')), // drawn again above a helmet (design §15.4)
      circ(60, 34, 15, MINT),
      el('circle', { cx: 51, cy: 38, r: 3, fill: '#F7B0A0' }),
      el('circle', { cx: 69, cy: 38, r: 3, fill: '#F7B0A0' }),
      smile(60, 39, 4),
      eye(54, 32),
      eye(66, 32)));
}


// Pip (Design §11.2 dig host): a small round green dino with a pale-yellow tummy, tiny arms, soft
// round spikes, dot eyes with a white sparkle, a smile with no teeth, and a little spade. Never roars.
function friendDino() {
  const G = '#5DBB63'; const TUM = '#F7E7A8'; const SPIKE = '#3E8E41';
  return g('char',
    g('body',
      ell(42, 108, 8, 5, G), ell(78, 108, 8, 5, G),
      circ(60, 78, 32, G),
      el('ellipse', { cx: 60, cy: 88, rx: 18, ry: 14, fill: TUM }),
      ell(38, 70, 5, 8, G, { transform: 'rotate(25 38 70)' }),
      ell(82, 70, 5, 8, G, { transform: 'rotate(-25 82 70)' })),
    g('spikes',
      circ(48, 48, 7, SPIKE), circ(60, 42, 8, SPIKE), circ(72, 48, 7, SPIKE)),
    g('head',
      circ(60, 52, 22, G),
      smile(60, 56, 5),
      eye(52, 48), eye(68, 48),
      el('circle', { cx: 55, cy: 46, r: 1.4, fill: '#FFFFFF' }),
      el('circle', { cx: 71, cy: 46, r: 1.4, fill: '#FFFFFF' })),
    g('spade',
      el('rect', { x: 86, y: 62, width: 4, height: 28, rx: 1.5, fill: '#8A5A2E' }),
      path('M80 62L98 62L89 48Z', '#C0C8D0')));
}

// Sea princess (Design §11.2): warm brown skin, short curly dark-brown hair with a small gold
// starfish crown, sunny yellow-orange tail with a coral-pink fin, pale-blue swim top. Only cheers.
// Not allowed: red hair, green tail, seashell top, fork/trident, crab/fish sidekick.
function friendSea() {
  const SKIN = '#C68A5E'; const HAIR = '#4A3426'; const TAIL = '#F2A03A'; const FIN = '#F28CB1'; const TOP = '#A8D8EA';
  return g('char',
    g('tail',
      path('M60 70C48 88 42 108 60 112C78 108 72 88 60 70Z', TAIL),
      path('M48 108Q60 122 72 108Q60 114 48 108Z', FIN)),
    g('body',
      ell(60, 62, 16, 18, SKIN),
      path('M46 52Q60 68 74 52Q74 42 60 44Q46 42 46 52Z', TOP)),
    g('head',
      circ(60, 28, 16, SKIN),
      // curls
      circ(48, 18, 7, HAIR), circ(60, 12, 8, HAIR), circ(72, 18, 7, HAIR), circ(44, 28, 5, HAIR), circ(76, 28, 5, HAIR),
      // gold starfish crown
      path('M60 8l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z', '#F2C230'),
      smile(60, 32, 4),
      eye(54, 26), eye(66, 26)),
    g('poms',
      circ(32, 58, 7, '#B8E0F0'), circ(88, 58, 7, '#B8E0F0')));
}

export const DRAW = {
  yellowDog: () => dog(DOGS.yellowDog),
  chocolateDog: () => dog(DOGS.chocolateDog),
  gingerDog: () => dog(DOGS.gingerDog),
  blackDog: () => dog(DOGS.blackDog),
  puppy: () => dog(DOGS.puppy),
  kitty,
  bunny,
  bunny2,
  friendSilly,
  friendBerry,
  friendCounter,
  friendDino,
  friendSea,
};

// The drawing tree for one character (unknown ids fall back to the yellow dog).
export function drawChar(id, opts = {}) {
  const f = DRAW[id] || DRAW.yellowDog;
  return ['g', { class: `who who-${DRAW[id] ? id : 'yellowDog'}` }, f(opts)];
}
