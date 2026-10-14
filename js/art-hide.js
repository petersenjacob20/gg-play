// Hide and Seek art (Amendment 2026-10-05r; ids only). Original vector parts in the same style as
// art.js: soft, round, bright, nothing scary. Every spot is one 120 x 100 drawing standing on y 96;
// a colourable spot takes { fill } (Level 3 paints it red, yellow, blue or green). hsTree is the
// counting tree, hsTinyBox the much-too-small box of the silly round, hsBubble the "here I come" bubble.
const INK = '#4A3426';
const O = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const el = (tag, attrs, ...kids) => [tag, attrs, ...kids];
const g = (...kids) => el('g', {}, ...kids);
const P = (d, fill, extra = {}) => el('path', { d, fill, ...O, ...extra });
const C = (cx, cy, r, fill, extra = {}) => el('circle', { cx, cy, r, fill, ...O, ...extra });
const E = (cx, cy, rx, ry, fill, extra = {}) => el('ellipse', { cx, cy, rx, ry, fill, ...O, ...extra });
const R = (x, y, width, height, fill, rx = 6, extra = {}) => el('rect', { x, y, width, height, rx, fill, ...O, ...extra });
const L = (d, color = INK, w = 3) => el('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const col = (o, dflt) => (o && o.fill) || dflt;
const WOOD = '#C98B55'; const CREAM = '#FFF4D6'; const LEAF = '#5DBB63'; const LEAF_DK = '#3F9A4A';
const SAND = '#F2D49B'; const GREY = '#8C96A0';

export const HIDE_ART = {
  // living room
  hsCouch: (o) => g(R(10, 40, 100, 44, col(o, '#B57EDC'), 14), R(4, 50, 20, 38, col(o, '#B57EDC'), 10), R(96, 50, 20, 38, col(o, '#B57EDC'), 10),
    R(22, 60, 76, 22, CREAM, 8), L('M60 62V80'), L('M18 88V96M102 88V96', INK, 5)),
  hsToybox: (o) => g(R(14, 42, 92, 52, col(o, '#4AA3DF'), 8), R(10, 32, 100, 16, col(o, '#4AA3DF'), 6), C(40, 68, 9, '#F2C230', { 'stroke-width': 2 }),
    P('M70 60L80 76H60Z', '#E5484D', { 'stroke-width': 2 }), R(84, 60, 12, 14, '#5DBB63', 2, { 'stroke-width': 2 })),
  // a flat rectangle with fringe on both short ends and two cream stripes (no rings: those read as the frisbee target)
  hsRug: (o) => g(L('M17 70H10M15 75H8M13 80H6M11 85H4M9 90H2M103 70H110M105 75H112M107 80H114M109 85H116M111 90H118', INK, 2.5),
    P('M18 66H102L112 92H8Z', col(o, '#E5484D')), L('M24 71H96M21 87H99', CREAM, 3), L('M30 79H90', CREAM, 2)),
  hsLamp: () => g(L('M60 40V90', GREY, 5), E(60, 92, 22, 5, GREY), P('M38 42L48 10H72L82 42Z', '#F2C230'), C(60, 26, 3, '#FFF4D6', { stroke: 'none' })),
  // backyard
  hsDoghouse: (o) => g(R(18, 44, 84, 52, col(o, '#E5484D'), 4), P('M10 48L60 10L110 48Z', '#8C5A3C'), P('M44 96V70Q60 54 76 70V96Z', '#4A3426'),
    R(48, 30, 24, 8, CREAM, 3, { 'stroke-width': 2 })),
  hsSlide: (o) => g(L('M22 96V28M42 96V28', GREY, 5), L('M22 40H42M22 56H42M22 72H42', GREY, 4), P('M42 28H52L110 90V96H96L46 40Z', col(o, '#F2C230'))),
  hsWagon: (o) => g(R(16, 46, 82, 32, col(o, '#4AA3DF'), 6), C(32, 84, 11, '#4A3426'), C(84, 84, 11, '#4A3426'), C(32, 84, 4, '#C9D3DC', { 'stroke-width': 1.5 }), C(84, 84, 4, '#C9D3DC', { 'stroke-width': 1.5 }), L('M98 56L114 38', INK, 4)),
  // farm
  hsHay: () => g(R(12, 44, 96, 50, '#F2C230', 12), L('M22 56H98M22 70H98M22 84H98', '#C99A1E', 2), L('M40 44V94M80 44V94', '#C9483A', 4)),
  hsBarndoor: (o) => g(R(14, 18, 92, 78, col(o, '#E5484D'), 4), L('M14 18L106 96M106 18L14 96', CREAM, 4), R(14, 18, 92, 78, 'none', 4)),
  hsTractor: (o) => g(R(14, 46, 70, 30, col(o, '#5DBB63'), 6), R(52, 20, 32, 30, col(o, '#5DBB63'), 4), R(58, 26, 20, 16, '#C9EEF8', 3, { 'stroke-width': 2 }),
    C(30, 80, 14, '#4A3426'), C(86, 76, 20, '#4A3426'), C(86, 76, 7, '#F2C230', { 'stroke-width': 2 }), L('M24 46V30', GREY, 5)),
  hsTrough: () => g(P('M8 52H112L100 90H20Z', WOOD), E(60, 54, 50, 6, '#6EC6F0', { 'stroke-width': 2 }), L('M24 90V96M96 90V96', INK, 5)),
  // beach
  hsCastle: () => g(R(20, 50, 80, 46, SAND, 4), R(14, 30, 22, 66, SAND, 3), R(84, 30, 22, 66, SAND, 3), R(48, 22, 24, 30, SAND, 3),
    P('M50 96V78Q60 68 70 78V96Z', '#C9A26B'), L('M60 22V8', INK, 2), P('M60 8L72 12L60 16Z', '#E5484D', { 'stroke-width': 1.5 })),
  hsUmbrella: (o) => g(L('M60 30V96', GREY, 5), P('M6 40Q60 -12 114 40Z', col(o, '#E5484D')), P('M42 40Q60 2 78 40Z', CREAM, { 'stroke-width': 2 })),
  hsBucket: (o) => g(P('M28 44H92L84 94H36Z', col(o, '#4AA3DF')), E(60, 44, 32, 6, col(o, '#4AA3DF')), L('M30 44Q60 6 90 44', INK, 3), R(76, 70, 30, 8, '#F2C230', 3, { 'stroke-width': 2 })),
  hsShell: () => g(P('M18 92Q60 10 102 92Z', '#F7B9C8'), L('M60 92V30M60 92L36 44M60 92L84 44M60 92L24 66M60 92L96 66', '#D9839A', 2), E(60, 92, 44, 5, '#F7B9C8')),
  // bedtime (calm: the scene dims; the drawings stay soft)
  hsBed: (o) => g(R(8, 30, 14, 66, WOOD, 4), R(98, 50, 14, 46, WOOD, 4), R(18, 56, 84, 26, col(o, '#4AA3DF'), 8), E(36, 52, 14, 8, CREAM), L('M22 86V96M98 86V96', INK, 5)),
  hsFort: (o) => g(P('M10 96L60 20L110 96Z', col(o, '#F2C230')), L('M60 20V96', INK, 2), P('M46 96Q60 60 74 96Z', '#4A3426'), C(30, 74, 3, CREAM, { 'stroke-width': 1 }), C(90, 74, 3, CREAM, { 'stroke-width': 1 })),
  hsCloset: () => g(R(20, 8, 80, 88, WOOD, 6), L('M60 8V96'), C(54, 54, 3, '#F2C230', { 'stroke-width': 1.5 }), C(66, 54, 3, '#F2C230', { 'stroke-width': 1.5 })),
  hsPillows: (o) => g(R(10, 62, 60, 30, col(o, '#E86FA8'), 14), R(50, 54, 60, 32, CREAM, 14), R(28, 40, 56, 28, col(o, '#E86FA8'), 14)),
  // the counting tree (Puppy covers its eyes against it), the tiny box, the speech bubble
  hsTree: () => g(R(48, 70, 24, 80, '#8C5A3C', 6), C(60, 50, 40, LEAF), C(30, 62, 22, LEAF_DK), C(90, 62, 22, LEAF_DK), C(60, 26, 22, LEAF)),
  hsTinyBox: () => g(P('M48 40H72L60 57Z', '#6B4A33'), R(30, 56, 60, 40, WOOD, 4), P('M30 56L18 40H50L60 56Z', '#B87A47'), P('M90 56L102 40H70L60 56Z', '#B87A47')),
  hsBubble: () => g(P('M20 20H100Q112 20 112 32V64Q112 76 100 76H52L34 94L38 76H20Q8 76 8 64V32Q8 20 20 20Z', '#FFFFFF'),
    L('M34 48H86', '#B0703C', 5), C(98, 48, 4, '#B0703C', { stroke: 'none' })),
};
