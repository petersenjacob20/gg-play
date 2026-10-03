// Small picture icons for kid and Dad controls. Plain data trees (see dom.js svg()), viewBox 0 0 64 64.
const INK = '#4A3426';
const O = { stroke: INK, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const el = (tag, attrs, ...kids) => [tag, attrs, ...kids];

export const ICONS = {
  house: () => el('g', {},
    el('path', { d: 'M10 30L32 11L54 30', fill: 'none', ...O, 'stroke-width': 5 }),
    el('path', { d: 'M16 28v24h32V28', fill: '#FFF8EC', ...O }),
    el('rect', { x: 27, y: 37, width: 10, height: 15, rx: 2, fill: '#E5484D', ...O })),
  speaker: () => el('g', {},
    el('path', { d: 'M12 25h9l13-11v36L21 39h-9z', fill: '#4AA3DF', ...O }),
    el('path', { d: 'M42 23q6 9 0 18M48 17q11 15 0 30', fill: 'none', ...O, class: 'waves' })),
  hand: () => el('g', {},
    el('path', { d: 'M20 34V18a4 4 0 0 1 8 0v12V12a4 4 0 0 1 8 0v18V15a4 4 0 0 1 8 0v18v-9a4 4 0 0 1 8 0v14q0 18-17 18q-11 0-17-10l-7-12a4 4 0 0 1 7-4z', fill: '#FFE0B5', ...O, 'stroke-width': 3 })),
  replay: () => el('g', {},
    el('path', { d: 'M48 32a16 16 0 1 1-6-12.5', fill: 'none', ...O, 'stroke-width': 6 }),
    el('path', { d: 'M36 12l12 6-10 9z', fill: INK, ...O })),
  arrowLeft: () => el('g', {},
    el('path', { d: 'M38 14L18 32L38 50', fill: 'none', ...O, 'stroke-width': 7 }),
    el('path', { d: 'M20 32H48', fill: 'none', ...O, 'stroke-width': 7 })),
  arrowRight: () => el('g', {},
    el('path', { d: 'M26 14L46 32L26 50', fill: 'none', ...O, 'stroke-width': 7 }),
    el('path', { d: 'M44 32H16', fill: 'none', ...O, 'stroke-width': 7 })),
  paw: (fill = '#4A3426') => el('g', {},
    el('ellipse', { cx: 32, cy: 41, rx: 13, ry: 11, fill }),
    el('ellipse', { cx: 17, cy: 28, rx: 5.5, ry: 7, fill }),
    el('ellipse', { cx: 27, cy: 20, rx: 5.5, ry: 7, fill }),
    el('ellipse', { cx: 37, cy: 20, rx: 5.5, ry: 7, fill }),
    el('ellipse', { cx: 47, cy: 28, rx: 5.5, ry: 7, fill })),
};
