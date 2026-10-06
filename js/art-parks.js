// Coaster Park and Water Park art (Amendment q10/q11; game-ideas coaster + water, ids only). Original
// vector parts in the same style as art.js: soft, round, bright, no brands, nothing scary. A piece's
// drawing is w*100 x h*100 (its cells); ride cars and gear are 0 0 200 100; small pictures 0 0 100 100.
// The dragon is friendly and round with soft eyes and no teeth; it breathes sparkles, never fire.
const INK = '#4A3426';
const O = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const el = (tag, attrs, ...kids) => [tag, attrs, ...kids];
const g = (...kids) => el('g', {}, ...kids);
const P = (d, fill, extra = {}) => el('path', { d, fill, ...O, ...extra });
const C = (cx, cy, r, fill, extra = {}) => el('circle', { cx, cy, r, fill, ...O, ...extra });
const E = (cx, cy, rx, ry, fill, extra = {}) => el('ellipse', { cx, cy, rx, ry, fill, ...O, ...extra });
const R = (x, y, width, height, fill, rx = 6, extra = {}) => el('rect', { x, y, width, height, rx, fill, ...O, ...extra });
const L = (d, color = INK, w = 3) => el('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const dot = (cx, cy, r = 3) => el('circle', { cx, cy, r, fill: '#2B1D14' });
const shine = (cx, cy, r = 1.4) => el('circle', { cx, cy, r, fill: '#FFFFFF' });
const eye = (cx, cy, r = 4) => g(dot(cx, cy, r), shine(cx + r * 0.35, cy - r * 0.35, r * 0.35));
// The dragon coaster's track in its own 400 x 300 drawing (the ride path in data is these points minus
// the centre 200,150; a test keeps them in step). Soft hills only: no loop, no steep drop.
export const COASTER_TRACK = Object.freeze([[210, 240], [60, 240], [48, 180], [80, 128], [130, 118], [200, 150], [240, 140], [300, 170], [350, 200], [385, 222], [350, 240]]);
// a smooth closed curve through points (Catmull-Rom as cubic Beziers)
function smooth(pts) {
  const n = pts.length; const at = (i) => pts[(i + n) % n];
  let d = `M${at(0)[0]} ${at(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1); const p1 = at(i); const p2 = at(i + 1); const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return `${d}Z`;
}
function sparkle(cx, cy, s, fill = '#FFE27A') {
  return P(`M${cx} ${cy - s}Q${cx + s * 0.2} ${cy - s * 0.2} ${cx + s} ${cy}Q${cx + s * 0.2} ${cy + s * 0.2} ${cx} ${cy + s}Q${cx - s * 0.2} ${cy + s * 0.2} ${cx - s} ${cy}Q${cx - s * 0.2} ${cy - s * 0.2} ${cx} ${cy - s}Z`, fill, { 'stroke-width': 1.5 });
}
const TEAL = '#2BB3A3'; const CREAM = '#FFF4D6'; const SUN = '#F2C230'; const RED = '#E5484D'; const BLUE = '#4AA3DF';
const GREEN = '#5DBB63'; const PINK = '#E86FA8'; const LILAC = '#B57EDC'; const WATER = '#6EC6F0'; const WATER_LT = '#C9EEF8'; const ORANGE = '#F28C28';

const MINT = '#9FE3C4';
// the friendly dragon's head, facing right, centred on (x, y) at scale s: soft mint, big round eyes
// with lashes, a rounded snout and a smile with NO teeth; little wings flap only at the top (CSS)
function dragonHead(x, y, s = 1, body = MINT) {
  const t = (n) => Math.round(n * s * 10) / 10;
  return g(
    P(`M${x - t(10)} ${y - t(22)}Q${x - t(4)} ${y - t(38)} ${x + t(4)} ${y - t(24)}`, '#FFD54A', { 'stroke-width': 2.5 }), // round horn bumps
    P(`M${x + t(8)} ${y - t(24)}Q${x + t(16)} ${y - t(38)} ${x + t(22)} ${y - t(20)}`, '#FFD54A', { 'stroke-width': 2.5 }),
    E(x, y, t(30), t(24), body),
    E(x + t(24), y + t(6), t(16), t(12), '#A8E6A0'), // round snout
    dot(x + t(28), y + t(2), t(2)), dot(x + t(34), y + t(3), t(2)),
    eye(x + t(4), y - t(6), t(5.5)),
    L(`M${x - t(2)} ${y - t(13)}l${-t(3)} ${-t(4)}M${x + t(3)} ${y - t(14)}l0 ${-t(5)}M${x + t(8)} ${y - t(13)}l${t(3)} ${-t(4)}`, INK, 2), // lashes
    L(`M${x + t(14)} ${y + t(14)}Q${x + t(26)} ${y + t(22)} ${x + t(38)} ${y + t(12)}`, INK, 2.5),
    el('circle', { cx: x - t(6), cy: y + t(8), r: t(5), fill: '#F7B0A0' }));
}
// a seat car with a big smile on its side
function smileCar(x, y, w, h, fill) {
  return g(R(x, y, w, h, fill, 14), L(`M${x + w * 0.3} ${y + h * 0.45}Q${x + w / 2} ${y + h * 0.8} ${x + w * 0.7} ${y + h * 0.45}`, INK, 3),
    C(x + w * 0.22, y + h + 4, 7, '#FFFFFF', { 'stroke-width': 2.5 }), C(x + w * 0.78, y + h + 4, 7, '#FFFFFF', { 'stroke-width': 2.5 }));
}
function teapot(cx, cy, s, fill, dots = '#FFFFFF') {
  const t = (n) => Math.round(n * s * 10) / 10;
  return g(
    P(`M${cx - t(34)} ${cy}Q${cx - t(60)} ${cy - t(6)} ${cx - t(62)} ${cy - t(30)}Q${cx - t(48)} ${cy - t(22)} ${cx - t(30)} ${cy - t(12)}`, fill, { 'stroke-width': 2.5 }), // spout
    P(`M${cx + t(30)} ${cy - t(16)}Q${cx + t(58)} ${cy - t(18)} ${cx + t(52)} ${cy + t(8)}Q${cx + t(46)} ${cy + t(20)} ${cx + t(30)} ${cy + t(14)}`, 'none', { stroke: INK, 'stroke-width': t(7) }),
    P(`M${cx + t(30)} ${cy - t(16)}Q${cx + t(58)} ${cy - t(18)} ${cx + t(52)} ${cy + t(8)}Q${cx + t(46)} ${cy + t(20)} ${cx + t(30)} ${cy + t(14)}`, 'none', { stroke: fill, 'stroke-width': t(4) }),
    E(cx, cy + t(4), t(38), t(30), fill),
    E(cx, cy - t(22), t(30), t(7), '#FFFFFF'),
    ...[[-16, 4], [12, 12], [0, -6], [20, -6], [-20, 18]].map(([dx, dy]) => el('circle', { cx: cx + t(dx), cy: cy + t(dy), r: t(4), fill: dots })));
}
function horse(x, y, fill) {
  return g(
    L(`M${x} ${y - 70}V${y + 40}`, '#C9A227', 4),
    E(x, y, 26, 14, fill), C(x + 26, y - 14, 10, fill),
    L(`M${x - 14} ${y + 10}L${x - 18} ${y + 28}M${x + 14} ${y + 10}L${x + 18} ${y + 28}`, INK, 4),
    P(`M${x + 20} ${y - 24}Q${x + 14} ${y - 34} ${x + 28} ${y - 30}Z`, PINK, { 'stroke-width': 2 }),
    dot(x + 30, y - 16, 2), P(`M${x - 26} ${y - 4}Q${x - 40} ${y + 6} ${x - 32} ${y + 18}`, 'none', { stroke: PINK, 'stroke-width': 5 }));
}
function balloon(cx, cy, r, fill) {
  return g(L(`M${cx} ${cy + r}Q${cx - 4} ${cy + r + 12} ${cx} ${cy + r + 22}`, INK, 1.5), E(cx, cy, r * 0.86, r, fill, { 'stroke-width': 2.5 }),
    el('ellipse', { cx: cx - r * 0.3, cy: cy - r * 0.35, rx: r * 0.18, ry: r * 0.28, fill: '#FFFFFF', opacity: 0.7 }));
}

export const PARK_ART = {
  // ---- Coaster Park (Amendment x1, design §16.3-16.4) ----
  // the dragon coaster (4 x 3): teal track on cream supports through soft hills, a station with a red
  // awning, the sparkle tunnel (a dark-blue arch full of gold stars) and the round mint dragon engine
  // with its yellow two-seat car. No loop, no flames, no teeth.
  pgDragonCoaster: () => g(
    ...[[60, 240], [80, 128], [130, 118], [240, 140], [300, 170], [385, 222]].map(([x, y]) => L(`M${x} ${y + 6}V292`, CREAM, 9)),
    ...[[60, 240], [80, 128], [130, 118], [240, 140], [300, 170], [385, 222]].map(([x, y]) => L(`M${x} ${y + 6}V292`, INK, 2)),
    L(smooth(COASTER_TRACK), INK, 15), L(smooth(COASTER_TRACK), TEAL, 10), L(smooth(COASTER_TRACK), '#9BE3D8', 2),
    P('M318 222Q318 166 352 166Q386 166 386 222', 'none', { stroke: '#2C3E8C', 'stroke-width': 16 }), // the sparkle tunnel
    ...[[330, 176], [352, 168], [374, 178], [322, 200], [382, 202]].map(([x, y]) => sparkle(x, y, 5, '#FFD54A')),
    R(150, 248, 120, 46, CREAM, 6),
    ...[0, 1, 2, 3, 4, 5].map((i) => P(`M${150 + i * 20} 226H${170 + i * 20}V248Q${160 + i * 20} 256 ${150 + i * 20} 248Z`, i % 2 ? '#FFFFFF' : RED, { 'stroke-width': 2.5 })),
    L('M150 226H270', INK, 3),
    el('g', { class: 'pg-parked' }, smileCar(214, 214, 48, 24, SUN), E(196, 222, 26, 16, MINT), dragonHead(178, 212, 0.62))), // hidden while she rides it
  // the car she rides in: the mint dragon engine ahead and the yellow two-seat car with a smiling
  // front (drawn in front of the rider's lower body; the face stays clear)
  pgDragonCar: () => g(
    R(20, 44, 116, 42, SUN, 18), L('M44 58Q78 80 112 58', INK, 3.5), L('M78 46V84', '#E0A800', 3),
    C(44, 90, 8, '#FFFFFF', { 'stroke-width': 2.5 }), C(112, 90, 8, '#FFFFFF', { 'stroke-width': 2.5 }),
    E(156, 66, 30, 22, MINT), el('g', { class: 'pg-wings' }, P('M146 50Q154 26 170 42Q160 44 156 52Z', '#C8F2DE', { 'stroke-width': 2.5 })),
    dragonHead(168, 40, 0.9)),
  // big spinning teapots (3 x 2): two big pastel teapots (pink and sky blue) with lids on a turntable
  pgTeapots: () => g(
    E(150, 160, 140, 34, '#8E5CC7'), E(150, 150, 140, 34, LILAC),
    L('M150 150V30', '#8C96A0', 6),
    P('M60 44Q150 -4 240 44Z', '#FFFFFF'), ...[0, 1, 2].map((i) => P(`M${90 + i * 40} 30Q${104 + i * 40} 8 ${118 + i * 40} 22L${130 + i * 40} 44H${90 + i * 40}Z`, RED, { 'stroke-width': 2 })),
    teapot(86, 136, 0.82, '#F7B6CF'), teapot(214, 136, 0.82, '#A9D8F5', '#FFFFFF')),
  pgTeapotCar: () => g(teapot(100, 62, 1.15, '#F7B6CF')),
  // the carousel (3 x 3): striped canopy, painted horses on poles and one banana-shaped silly seat
  pgCarousel: () => g(
    E(150, 262, 136, 30, BLUE), E(150, 252, 136, 30, SUN),
    L('M150 252V60', '#C9A227', 6),
    P('M18 92Q150 -6 282 92Z', '#FFFFFF'),
    ...[0, 1, 2, 3].map((i) => P(`M150 28L${40 + i * 60} 88H${70 + i * 60}Z`, RED, { 'stroke-width': 0 })),
    P('M18 92Q150 -6 282 92Z', 'none'),
    ...[30, 70, 110, 150, 190, 230, 270].map((x, i) => C(x, 96, 8, i % 2 ? PINK : SUN, { 'stroke-width': 2 })),
    horse(78, 190, '#FFFFFF'), horse(222, 196, '#FDE2C8'),
    L('M150 150V250', '#C9A227', 4), P('M112 214Q150 250 190 206Q186 226 150 236Q122 236 112 214Z', '#FFE066')),
  pgHorseSeat: () => g(L('M100 0V100', '#C9A227', 5), E(100, 58, 52, 22, '#FDE2C8'), C(152, 36, 16, '#FDE2C8'),
    L('M70 74L64 96M130 74L136 96', INK, 5), dot(158, 32, 3), P('M48 52Q30 66 40 84', 'none', { stroke: PINK, 'stroke-width': 7 })),
  pgBananaSeat: () => g(L('M100 0V100', '#C9A227', 5), P('M36 50Q100 110 168 40Q164 74 100 86Q52 86 36 50Z', '#FFE066'), L('M168 40l8 -6M36 50l-6 -4', '#8B5E3C', 4)),
  // soft bumper pads (2 x 2): round padded cars; one gentle bump and a giggle
  pgBumpers: () => g(
    R(8, 70, 184, 120, '#D7F0FF', 30),
    E(62, 140, 44, 30, '#FFFFFF'), E(62, 132, 38, 24, RED), C(62, 122, 8, SUN, { 'stroke-width': 2 }),
    E(140, 112, 44, 30, '#FFFFFF'), E(140, 104, 38, 24, GREEN), C(140, 94, 8, SUN, { 'stroke-width': 2 })),
  // a gentle Ferris wheel (3 x 3): decor; it stays still
  pgFerris: () => g(
    L('M150 140L80 288M150 140L220 288', '#8C96A0', 9), L('M60 288H240', INK, 4),
    C(150, 140, 112, 'none', { stroke: PINK, 'stroke-width': 8 }),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => L(`M150 140L${150 + 112 * Math.cos(i * Math.PI / 4)} ${140 + 112 * Math.sin(i * Math.PI / 4)}`, '#F7C6DD', 4)),
    C(150, 140, 14, SUN),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => R(150 + 112 * Math.cos(i * Math.PI / 4) - 15, 140 + 112 * Math.sin(i * Math.PI / 4) - 4, 30, 24, [RED, BLUE, GREEN, SUN][i % 4], 8, { 'stroke-width': 2.5 }))),
  // the balloon tower (2 x 3): a slow rise in a basket under a big soft balloon, and a soft landing
  pgBalloonTower: () => g(
    L('M100 60V290', '#8C96A0', 8), L('M60 290H140', INK, 4),
    balloon(100, 64, 52, '#F7A8C8'), L('M70 112L84 150M130 112L116 150', INK, 2),
    R(78, 150, 44, 30, '#C98A4B', 6)),
  pgBasket: () => g(L('M60 0L74 40M140 0L126 40', INK, 3), R(50, 40, 100, 50, '#C98A4B', 10), L('M54 58H146M54 74H146', '#E0B07A', 4)),
  // the kiddie train (3 x 1): a little engine and cars that loop the zone edge
  pgKiddieTrain: () => g(
    R(200, 30, 90, 50, RED, 12), R(240, 6, 30, 26, RED, 4), C(220, 86, 12, '#FFFFFF', { 'stroke-width': 3 }), C(270, 86, 12, '#FFFFFF', { 'stroke-width': 3 }),
    R(110, 40, 80, 40, SUN, 10), C(130, 86, 11, '#FFFFFF', { 'stroke-width': 3 }), C(170, 86, 11, '#FFFFFF', { 'stroke-width': 3 }),
    R(20, 40, 80, 40, BLUE, 10), C(40, 86, 11, '#FFFFFF', { 'stroke-width': 3 }), C(80, 86, 11, '#FFFFFF', { 'stroke-width': 3 }),
    L('M100 60H110M190 60H200', INK, 4), C(272, 46, 6, '#FFFFFF', { 'stroke-width': 2 })),
  pgTrainCar: () => g(R(30, 44, 140, 40, SUN, 12), C(60, 88, 10, '#FFFFFF', { 'stroke-width': 3 }), C(140, 88, 10, '#FFFFFF', { 'stroke-width': 3 })),
  // the ticket booth (2 x 2) with a soft gold star; no money, nothing to buy
  pgTicketBooth: () => g(
    R(34, 70, 132, 120, CREAM, 8), R(62, 100, 76, 50, '#BFE6F7', 6),
    ...[0, 1, 2, 3].map((i) => P(`M${24 + i * 38} 46H${62 + i * 38}V70Q${43 + i * 38} 82 ${24 + i * 38} 70Z`, i % 2 ? '#FFFFFF' : BLUE, { 'stroke-width': 2.5 })),
    L('M24 46H176', INK, 3),
    P('M100 6L108 24L128 26L113 39L118 58L100 48L82 58L87 39L72 26L92 24Z', '#FFD54A', { 'stroke-width': 2.5 }),
    R(90, 160, 20, 30, '#B07A4A', 4)),
  // the balloon arch (2 x 1): red, yellow and blue, not scary
  pgBalloonArch: () => g(
    ...[[14, 90], [24, 58], [44, 32], [72, 16], [100, 12], [128, 16], [156, 32], [176, 58], [186, 90]].map(([x, y], i) => C(x, y, 14, [RED, SUN, BLUE][i % 3], { 'stroke-width': 2.5 }))),
  // a little fountain (2 x 2) where the ducks paddle
  pgFountain: () => g(
    E(100, 150, 90, 36, '#C9D3DC'), E(100, 144, 78, 28, WATER), E(100, 144, 52, 16, WATER_LT, { 'stroke-width': 2 }),
    R(88, 70, 24, 70, '#C9D3DC', 6), E(100, 70, 34, 10, '#C9D3DC'),
    L('M100 60Q70 20 50 120M100 60Q130 20 150 120M100 60V24', BLUE, 5),
    C(100, 22, 6, WATER_LT, { 'stroke-width': 2 })),
  // striped tents (2 x 1)
  pgTents: () => g(
    P('M8 96L52 20L96 96Z', '#FFFFFF'), P('M52 20L40 96H64Z', RED, { 'stroke-width': 2 }), L('M52 20V8', INK, 3), P('M52 8L66 13L52 18Z', SUN, { 'stroke-width': 2 }),
    P('M104 96L148 26L192 96Z', '#FFFFFF'), P('M148 26L136 96H160Z', BLUE, { 'stroke-width': 2 }), L('M148 26V14', INK, 3), P('M148 14L162 19L148 24Z', GREEN, { 'stroke-width': 2 })),
  // soft background hills (3 x 1)
  pgHills: () => g(P('M0 100Q60 10 140 60Q200 0 300 70V100Z', '#9ED37A'), P('M0 100Q90 50 170 80Q240 50 300 90V100Z', '#86C468', { 'stroke-width': 2 })),
  // the midway target (1 x 1): soft rings; a frisbee catch on it gives a star pop
  pgTarget: () => g(L('M50 80V98', '#8C96A0', 6), C(50, 46, 36, '#FFFFFF'), C(50, 46, 24, '#F7A8C8'), C(50, 46, 12, '#FFFFFF'), C(50, 46, 5, PINK, { 'stroke-width': 2 })),

  // ---- Water Park (Amendment x2, design §16.5): shallow only, a splash pad and a lazy pool ----
  // the lazy pool (4 x 2): waist-high, with a ladder to hop off; the ring float goes round it
  pgLazyPool: () => g(
    R(6, 20, 388, 170, '#F2DDB0', 60),
    R(30, 40, 340, 130, '#6EC6F0', 50), R(110, 86, 180, 38, '#F2DDB0', 19),
    L('M60 70Q90 60 120 70M250 150Q280 140 310 150M300 64Q330 56 350 66', WATER_LT, 5),
    L('M352 46V96M372 46V96M352 60H372M352 78H372', '#8C96A0', 5)),
  // a float ring (1 x 1): drop a character on it for one slow lap of the lazy pool
  pgLazyRing: () => g(E(50, 60, 40, 18, ORANGE, { 'stroke-width': 3.5 }), E(50, 57, 20, 7, '#9FDCF0', { 'stroke-width': 2 }),
    R(10, 54, 8, 12, '#FFFFFF', 2, { 'stroke-width': 1.5 }), R(82, 54, 8, 12, '#FFFFFF', 2, { 'stroke-width': 1.5 })),
  // the ring she floats in (in front of the lower body)
  pgRing: () => g(
    E(100, 66, 84, 28, ORANGE, { 'stroke-width': 3.5 }), E(100, 62, 46, 12, '#9FDCF0', { 'stroke-width': 2.5 }),
    ...[[30, 60], [90, 88], [150, 86], [172, 60]].map(([x, y]) => R(x - 6, y - 8, 12, 16, '#FFFFFF', 3, { 'stroke-width': 2 }))),
  // the curly slide (2 x 3): four coloured tubes (red, yellow, blue, green) curl into a splash landing
  pgCurlySlide: () => g(
    L('M156 36V290M188 36V290', '#8C96A0', 7), L('M156 80H188M156 130H188M156 180H188M156 230H188', '#8C96A0', 5),
    R(136, 24, 64, 18, CREAM, 6),
    ...[[RED, 0], [SUN, 10], [BLUE, 20], [GREEN, 30]].map(([c, o]) => g(
      L(`M156 ${40 + o}C${40 + o} ${60 + o} ${40 + o} ${110 + o} ${140 - o} ${120 + o}C${196 - o} ${128 + o} ${176 - o} ${176 + o} ${90 + o / 2} ${182 + o}C${34 + o} ${186 + o} ${44 + o} ${230} ${80 + o} ${250}`, INK, 13),
      L(`M156 ${40 + o}C${40 + o} ${60 + o} ${40 + o} ${110 + o} ${140 - o} ${120 + o}C${196 - o} ${128 + o} ${176 - o} ${176 + o} ${90 + o / 2} ${182 + o}C${34 + o} ${186 + o} ${44 + o} ${230} ${80 + o} ${250}`, c, 8))),
    E(110, 270, 84, 22, '#6EC6F0'), E(110, 270, 50, 10, WATER_LT, { 'stroke-width': 2 })),
  // a tube colour button for the slide's trick row (0 0 100 100)
  pgTube: ({ fill = RED } = {}) => g(C(50, 50, 38, fill), C(50, 50, 18, '#FFFFFF')),
  // the giant tipping bucket (2 x 3) with a pump; it tips onto whoever is under it
  pgBucket: () => g(
    L('M30 290V70M170 290V70M30 70H170', '#8C96A0', 9),
    P('M60 70L66 40H134L140 70Q100 84 60 70Z', SUN), P('M66 40Q100 30 134 40', 'none', { stroke: INK, 'stroke-width': 3 }),
    R(176, 190, 18, 70, RED, 5), L('M185 190V170H160', INK, 5), // the pump
    R(40, 250, 120, 30, '#6EC6F0', 15), L('M60 262H140', WATER_LT, 4)),
  // the sprayer garden (2 x 2): three sprayers in a row
  pgSprayers: () => g(
    R(10, 120, 180, 64, '#9FDCF0', 30),
    ...[[40, 150, PINK], [100, 156, SUN], [160, 150, GREEN]].map(([x, y, c]) => g(L(`M${x} ${y}Q${x - 18} ${y - 70} ${x - 30} ${y - 20}M${x} ${y}Q${x + 18} ${y - 70} ${x + 30} ${y - 20}`, BLUE, 4), C(x, y, 10, c, { 'stroke-width': 2.5 })))),
  // the dump cups wall (2 x 2): tip a cup and a gentle splash pours on the friend below
  pgDumpCups: () => g(
    L('M20 190V20M180 190V20M20 30H180', '#8C96A0', 8),
    ...[[50, RED], [100, SUN], [150, BLUE]].map(([x, c]) => g(L(`M${x} 30V48`, INK, 3), P(`M${x - 18} 48H${x + 18}L${x + 12} 80H${x - 12}Z`, c))),
    R(10, 168, 180, 24, '#6EC6F0', 12)),
  // floating ring targets (2 x 1) for the frisbee toss
  pgFloatTargets: () => g(R(4, 40, 192, 56, '#6EC6F0', 28), ...[[50, ORANGE], [100, '#FFFFFF'], [150, ORANGE]].map(([x, c]) => g(E(x, 66, 26, 12, c, { 'stroke-width': 3 }), E(x, 64, 12, 5, '#6EC6F0', { 'stroke-width': 2 })))),
  // the lifeguard (2 x 2, pinned): an original grown-up in a deck chair under an umbrella, with a
  // sunhat, a whistle on a cord and a friendly smile (no whistle sound, ever)
  pgLifeguard: () => g(
    el('rect', { x: 150, y: 50, width: 8, height: 126, rx: 3, fill: '#8C96A0', ...O }), P('M100 56Q154 0 200 56Z', '#FFFFFF'), P('M154 28L130 56H178Z', RED, { 'stroke-width': 2 }),
    P('M20 176L40 116H110L140 176', 'none', { stroke: '#B07A4A', 'stroke-width': 7 }),
    P('M36 124L100 124L122 164H48Z', BLUE), L('M44 136H108M52 150H114', '#FFFFFF', 4),
    el('g', { class: 'lg-head' }, C(70, 84, 22, '#E9B48A'), P('M40 76Q70 42 100 76Z', SUN), L('M34 76H106', INK, 3),
      dot(62, 88, 2.5), dot(78, 88, 2.5), L('M61 96Q70 103 79 96', INK, 2.5)),
    P('M52 106H88L94 132H46Z', '#E5484D'), L('M60 106Q70 122 80 106', '#FFFFFF', 2), C(70, 124, 4, '#C9D3DC', { 'stroke-width': 1.5 }), // the whistle on its cord
    el('g', { class: 'lg-arm' }, L('M92 114L112 98', '#E9B48A', 7), C(114, 94, 6, '#E9B48A', { 'stroke-width': 2 }))),
  // decor: striped umbrellas (2 x 2), life rings on a post (1 x 1), towels on a rail (2 x 1), the cooler
  pgUmbrellas: () => g(
    L('M50 50V180M150 60V180', '#8C96A0', 5),
    P('M6 70Q50 14 94 70Z', '#FFFFFF'), P('M50 42L30 70H70Z', RED, { 'stroke-width': 2 }),
    P('M106 80Q150 24 194 80Z', '#FFFFFF'), P('M150 52L130 80H170Z', BLUE, { 'stroke-width': 2 }),
    R(20, 160, 60, 10, CREAM, 4), R(120, 160, 60, 10, CREAM, 4)),
  pgLifeRings: () => g(L('M50 20V96', '#8C96A0', 6), E(50, 46, 30, 30, ORANGE, { 'stroke-width': 3 }), C(50, 46, 14, '#F2DDB0'),
    R(16, 40, 10, 12, '#FFFFFF', 2, { 'stroke-width': 1.5 }), R(74, 40, 10, 12, '#FFFFFF', 2, { 'stroke-width': 1.5 })),
  pgTowels: () => g(L('M10 30H190M20 30V96M180 30V96', '#8C96A0', 5),
    ...[[40, PINK], [100, SUN], [160, BLUE]].map(([x, c]) => g(R(x - 22, 32, 44, 54, c, 4), L(`M${x - 22} 72H${x + 22}`, '#FFFFFF', 4)))),
  pgCooler: () => g(R(30, 70, 140, 100, '#4AA3DF', 14), R(24, 56, 152, 28, '#FFFFFF', 10), L('M70 56V46H130V56', INK, 5),
    C(100, 120, 16, '#FFFFFF', { 'stroke-width': 2 }), P('M92 120A8 8 0 0 0 108 120Z', '#E5484D', { 'stroke-width': 1.5 })),
  // floaties (design §16.5), drawn on the top layer: a pet life vest with a back handle, armbands, a ring
  pgVest: () => g(R(14, 10, 132, 40, ORANGE, 14), L('M44 10V50M116 10V50', '#FFFFFF', 4), L('M66 10Q80 -4 94 10', INK, 4)),
  pgArmbands: () => g(R(4, 6, 30, 28, ORANGE, 12), L('M10 20H28', '#FFFFFF', 4), R(126, 6, 30, 28, ORANGE, 12), L('M132 20H150', '#FFFFFF', 4)),
  pgWaistRing: () => g(E(80, 22, 70, 16, ORANGE, { 'stroke-width': 3 }), R(20, 16, 10, 12, '#FFFFFF', 2, { 'stroke-width': 1.5 }), R(130, 16, 10, 12, '#FFFFFF', 2, { 'stroke-width': 1.5 })),
  pgTowelWrap: () => g(P('M10 10H150L140 50H20Z', PINK), L('M14 30H146', '#FFFFFF', 4)),
  // a sparkle puff (the dragon's breath: glitter)
  pgSparkles: () => g(sparkle(50, 50, 20), sparkle(22, 30, 10, '#FFFFFF'), sparkle(78, 26, 12, '#FFE27A'), sparkle(30, 76, 9, '#FFFFFF'), sparkle(76, 76, 8)),
  // the cooler's fruit (watermelon is in art.js): a fruit pop with fruit bits on a stick, orange slices
  pgFruitPop: () => g(
    R(30, 10, 40, 60, '#F28CA0', 18), el('rect', { x: 32, y: 40, width: 36, height: 28, fill: ORANGE, stroke: 'none' }),
    R(30, 10, 40, 60, 'none', 18), C(42, 26, 4, '#FFFFFF', { 'stroke-width': 1.5 }), C(58, 50, 4, '#FFE27A', { 'stroke-width': 1.5 }),
    R(45, 70, 10, 24, '#E9C08E', 4)),
  pgOrangeSlices: () => g(
    P('M10 66A40 40 0 0 1 90 66Z', ORANGE), P('M18 66A32 32 0 0 1 82 66Z', '#FFC266', { 'stroke-width': 2 }),
    L('M50 66L50 38M50 66L30 46M50 66L70 46', '#FFFFFF', 2.5),
    P('M24 92A26 26 0 0 1 76 92Z', ORANGE, { transform: 'translate(0 -4)' })),
  // zone gates (0 0 100 100, design §16.1): a round arch with a teal hill and the dragon peeking over
  // it (a hill, never a loop); a round arch with a blue wave and an orange life ring hung on it
  pgGateCoaster: () => g(
    P('M12 94V44Q50 6 88 44V94H76V48Q50 24 24 48V94Z', '#F7A8C8'),
    L('M24 88C36 64 46 64 56 76S70 70 76 84', INK, 9), L('M24 88C36 64 46 64 56 76S70 70 76 84', TEAL, 5),
    dragonHead(48, 54, 0.42)),
  // the big Go paw (x1): a white paw on the green button (the circle is the button's own CSS)
  pgGoPaw: () => g(
    E(50, 60, 17, 14, '#FFFFFF', { 'stroke-width': 0 }),
    ...[[29, 42], [42, 31], [58, 31], [71, 42]].map(([x, y]) => E(x, y, 7.5, 9.5, '#FFFFFF', { 'stroke-width': 0 }))),
  // friendSea's pom-poms at the coaster finish
  pgPomPom: () => g(C(50, 46, 26, PINK, { 'stroke-width': 2 }), ...[[36, 34], [62, 32], [70, 54], [34, 58], [50, 66]].map(([x, y]) => C(x, y, 9, '#F7A8C8', { 'stroke-width': 1.5 })), L('M50 72V96', INK, 4)),
  pgGateWater: () => g(
    P('M12 94V44Q50 6 88 44V94H76V48Q50 24 24 48V94Z', '#9FDCF0'),
    P('M24 84Q32 72 40 84T56 84T76 84V94H24Z', '#4AA3DF'), L('M24 84Q32 72 40 84T56 84T76 84', '#FFFFFF', 2.5),
    L('M50 22V30', INK, 2), E(50, 44, 13, 13, ORANGE, { 'stroke-width': 2.5 }), C(50, 44, 6, '#9FDCF0', { 'stroke-width': 2 })),
};
