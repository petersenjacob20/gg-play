// Pizza extras (lazy pack, CHECKLIST #7): more veggies, landing sounds (shipped clips), picture order card, slice
// counting, Level 3 "one more". No timer, score or losing. Every food passes the guard.
import { h, drawing } from './dom.js';
import * as K from './kitchen.js';

const INK = '#4A3426';
const C = (cx, cy, r, fill, o = {}) => ['circle', { cx, cy, r, fill, stroke: INK, 'stroke-width': 2, ...o }];
const E = (cx, cy, rx, ry, fill, o = {}) => ['ellipse', { cx, cy, rx, ry, fill, stroke: INK, 'stroke-width': 2, ...o }];
const P = (d, fill, o = {}) => ['path', { d, fill, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round', ...o }];
const g = (...k) => ['g', {}, ...k];

// the new veggies' art, drawn like the others (about 14 units across, centred on 0 0)
export const ART = {
  broccoli: () => g(P('M-1.5 1h3l1 6h-5z', '#8CC56A'), C(-3.5, -1.5, 3.2, '#3E9A4A'), C(3.5, -1.5, 3.2, '#3E9A4A'), C(0, -4, 3.6, '#4CAF50')),
  peas: () => g(C(-3, -1.5, 2.6, '#7BC96F'), C(2.6, -2, 2.6, '#6DBE60'), C(0, 2.6, 2.6, '#7BC96F')),
  carrots: () => g(C(0, 0, 6, '#F28C28'), C(0, 0, 3, 'none', { stroke: '#FFB561', 'stroke-width': 1.4 })),
};
export const EXTRA = Object.keys(ART).map((id) => ({ id, label: id }));
Object.assign(K.T, ART); // the pie and the buttons draw them with K.toppingArt

// each topping makes its own landing sound (clips that already ship): peas plink, broccoli boings
export const LAND = { pepperoni: 'fx-pop', ham: 'fx-pop', olives: 'fx-pop', corn: 'fx-pop', mushrooms: 'fx-boing', peppers: 'fx-zoom',
  pineapple: 'fx-chime', tomato: 'fx-splash', spinach: 'fx-confetti', onion: 'fx-sneeze', broccoli: 'fx-boing', peas: 'fx-chime', carrots: 'fx-toot' };
export const land = (id) => LAND[id] || K.CLIPS.land;

// the picture order card: one line per topping, its pictures n times; at Level 3 a small half-pie shows its side
// icons ~34 units wide, shown at box size: >= 32 px
export const ICON = 14 * 2.4;
const W = (order) => Math.max(...order.map((o) => (o.side ? 46 : 26) + o.n * 38)) + 4;
export function cardArt(order) {
  return g(['rect', { x: 2, y: 2, width: W(order) - 4, height: 16 + order.length * 40, rx: 8, fill: '#FFF8E7', stroke: INK, 'stroke-width': 2 }],
    ...order.map((o, r) => ['g', { class: 'pzm-line', 'data-id': o.id, 'data-n': o.n }, ...(o.side ? [C(14, 28 + r * 40, 8, '#E8B86B'),
      P(o.side === 'L' ? `M14 ${20 + r * 40}a8 8 0 0 0 0 16z` : `M14 ${20 + r * 40}a8 8 0 0 1 0 16z`, '#E5484D', { 'stroke-width': 0 })] : []),
    ...Array.from({ length: o.n }, (_, i) => ['g', { transform: `translate(${(o.side ? 46 : 26) + i * 38} ${28 + r * 40}) scale(2.4)` }, K.toppingArt(o.id)])]));
}
export const card = (order) => {
  const d = drawing(cardArt(order), { box: `0 0 ${W(order)} ${20 + order.length * 40}` });
  d.setAttribute('width', W(order)); d.setAttribute('height', 20 + order.length * 40); // 1 unit = 1 px
  return h('span', { class: 'pz-who pzm-card', 'aria-label': 'Order card' }, d);
};

// 1 olive, 3 tomatoes
const one = (l, n) => n > 1 ? l.replace(/o$/, 'oe').replace(/(e|on)$/, '$&s') : l.replace(/s$/, '');
export const orderText = (o) => `Put on ${o.map((x) => `${x.n} ${one(x.label, x.n)}${x.side ? ` on ${x.side == 'L' ? 'this' : 'that'} side` : ''}`).join(' and ')}!`;

// what the friend says after a topping lands. Level 3: one short of a line asks "one more", and the first time the
// whole order matches the friend asks for one more of the first topping (once).
export function after(order, pieces, level, o, st = {}) {
  const n = o ? K.countOf(o, pieces) : 0;
  if (K.matched(order, pieces)) {
    if (level >= 3 && !st.asked) { st.asked = 1; order[0].n += 1; return { text: `One more ${one(order[0].label, 1)}, please!`, more: order[0], clips: [K.numClip(1)] }; }
    return { text: 'Yes! Just right!', match: true, clips: [...(o ? [K.numClip(n)] : []), K.CLIPS.match] };
  }
  return o ? { clips: [K.numClip(n)] } : { clips: [] };
}

// slice counting: the cuts make 4 slices; the bubble counts them, each number spoken, then the game goes on
export const SLICES = 4, GAP = 650;
// round 2: each swipe (one stroke on the pie) or Slice tap cuts and counts one more slice: one! two! three! four!
export function slicer(bubble, snd, next, pie, pieBox, wait = setTimeout) {
  let n = 0, stroke = 0; const main = pieBox.closest('main');
  pieBox.addEventListener('pointerdown', () => { stroke = 0; }, true); // a new finger, a new swipe (runs before the rub)
  return (xy) => {
    if (xy && stroke) return; if (xy) stroke = 1; if (n >= SLICES) return;
    n += 1; snd(K.CLIPS.slice, K.numClip(n)); bubble.textContent = `${K.countWord(n)}!`; main.setAttribute('data-slices', n);
    if (n === SLICES) { pie.sliced = true; pieBox.append(h('span', { class: 'pz-wheel' })); wait(() => { bubble.textContent = `${SLICES} slices!`; wait(next, 700); }, 500); }
  };
}
// Again: a fresh order, never the same as the last one
let last = '';
export function makeOrder(level, prefs, make = K.makeOrder) {
  let o = make(level, prefs);
  for (let k = 0; k < 30 && JSON.stringify(o) === last; k++) o = make(level, prefs);
  last = JSON.stringify(o); return o;
}
export function countSlices(bubble, snd, next, wait = setTimeout) {
  let i = 0;
  const tick = () => {
    if (i === SLICES) { bubble.textContent = `${SLICES} slices!`; wait(next, 700); return; }
    i += 1; bubble.textContent = `${K.countWord(i)}!`; snd(K.numClip(i)); wait(tick, GAP);
  };
  bubble.textContent = ''; tick();
}

// #8 delivery: pick a pet, pull the pizza wagon to its door (drag or tap Pull), and the pet reacts in its own way.
// Original pets (trait labels) from pets.js, not friends; shipped clips. A line names only toppings on this pie, 2 lines max.
import { drawChar, DRAW } from './pets.js';
const spin = (type, values, dur = '0.6s', n = '2') => ['animateTransform', { attributeName: 'transform', type, values, dur, repeatCount: n }];
const VEG = ['carrots', 'spinach', 'broccoli', 'peas', 'peppers', 'mushrooms'];
const has = (on, ids) => ids.find((id) => on.includes(id));
const R = [
  { id: 'puppy', label: 'Loud dog', say: () => 'Gulp! The whole slice! Aroo-hoo!', clips: ['fx-mmm', 'fx-woof'], anim: spin('rotate', '0;-12;12;0') },
  { id: 'chocolateDog', label: 'Cuddly dog', say: () => 'Tiny nibbles... a slow happy wag.', clips: ['fx-mmm'], anim: spin('rotate', '0;4;0;-4;0', '2s') },
  { id: 'yellowDog', label: 'Wise dog', say: () => 'Sniff, sniff. Mm-hm. A polite bite.', clips: ['fx-sniff', 'fx-mmm'], anim: spin('translate', '0 0;0 5;0 0', '0.8s') },
  { id: 'blackDog', label: 'Ball dog', say: (on) => { const t = has(on, ['tomato', 'olives', 'peas']); return t ? `The ${t} ${t === 'tomato' ? 'rolls' : 'roll'} like a ball! Chase!` : 'The crust rolls like a ball! Chase!'; }, clips: ['fx-boing', 'fx-yip'], anim: spin('translate', '0 0;10 0;-10 0;0 0', '1s') },
  { id: 'gingerDog', label: 'Frisbee dog', say: () => 'Toss the slice up... and catch!', clips: ['fx-zoom', 'fx-woof'], anim: spin('translate', '0 0;0 -18;0 0', '0.7s') },
  { id: 'kitty', label: 'King cat', say: (on) => { const t = has(on, ['peppers', 'onion']); return `${t ? `A ${t === 'peppers' ? 'pepper' : t} ring` : 'A crust'} crown. "Acceptable."`; }, clips: ['fx-meow'], anim: spin('rotate', '0;-6;0', '1.2s', '1') },
  { id: 'bunny', label: 'Zoomy bunny', say: (on) => { const v = has(on, VEG); return v ? `Zoom! Nibbles the ${v} first!` : 'Zoom! A quick crust nibble!'; }, clips: ['fx-zoom', 'fx-giggle'], anim: spin('translate', '0 0;0 -6;0 0', '0.4s', '4') },
  { id: 'bunny2', label: 'Sniffy bunny', say: (on) => { const v = has(on, VEG); return v ? `Sniff, sniff... the ${v}! One nibble.` : 'Sniff, sniff... a crust nibble.'; }, clips: ['fx-sniff', 'fx-giggle'], anim: spin('rotate', '0;5;0;-5;0', '1.6s') },
];
export const PETS = Object.keys(DRAW).filter((id) => !id.startsWith('friend')).map((id) => R.find((p) => p.id === id)).filter(Boolean);
export const MAX_SAY = 46; // short enough for 2 lines at 330 px
export const DOOR = 220;
// pack-only styles, a same-origin sheet (the CSP allows no inline style), loaded with the pack: no startup bytes
if (typeof document !== 'undefined' && document.head && !document.querySelector?.('.pzm-css')) document.head.append(h('link', { rel: 'stylesheet', href: './css/pizza-more.css', class: 'pzm-css' }));
// Level 1: the oven waits, gently, until the pie matches the card (no buzz, no fail)
export function hold(level, order, pie, say, main = say.closest?.('main')) {
  if (level > 1 || (pie.pieces.length && K.matched(order, pie.pieces))) return false;
  say.textContent = 'Not yet! Match the card first.';
  if (main) { main.querySelector('.pzm-card')?.scrollIntoView({ block: 'nearest' }); main.removeAttribute('data-notyet'); void main.offsetWidth; main.setAttribute('data-notyet', '1'); } // a wiggle + the card pulses (CSS)
  return true;
}
export function deliver({ row, say, main, snd, fin, pie = { pieces: [] }, ctx, again = () => import('./screens/pizza.js').then((R) => main.replaceWith(R.render(ctx))) }, wait = setTimeout) {
  const on = pie.pieces.map((q) => q.id);
  say.textContent = 'Who gets the pizza?';
  row.replaceChildren(h('div', { class: 'pzm-pets' }, ...PETS.map((p) => h('button', { type: 'button', class: 'pz-who pzm-pet', 'aria-label': p.label, onclick: () => go(p) }, drawing(drawChar(p.id), { box: '-10 -10 120 120' })))));
  function go(p) {
    let x = 0, done = false;
    const wagon = ['g', { class: 'pzm-wagon' }, ['rect', { x: 0, y: 40, width: 50, height: 22, rx: 4, fill: '#E5484D', stroke: INK, 'stroke-width': 2 }],
      C(12, 66, 7, '#555'), C(38, 66, 7, '#555'), C(25, 36, 12, '#E8B86B')];
    const scene = h('span', { class: 'pzm-scene', 'aria-label': 'Wagon path' });
    const draw = () => scene.replaceChildren(drawing(['g', {}, ['rect', { x: 262, y: 10, width: 34, height: 64, rx: 4, fill: '#C98A4B', stroke: INK, 'stroke-width': 2 }],
      ['g', { transform: `translate(${x} 0)` }, wagon]], { box: '0 0 300 80' }));
    const pull = h('button', { type: 'button', class: 'pz-go', text: 'Pull', onclick: () => move(x + 55) });
    const move = (nx) => {
      if (done) return; x = Math.max(0, Math.min(DOOR, nx)); draw();
      if (x < DOOR) return;
      done = true; pull.remove(); main.setAttribute('data-react', p.id); snd(...p.clips);
      const line = p.say(on);
      scene.replaceChildren(drawing(['g', {}, ['g', {}, drawChar(p.id), p.anim]], { box: '-20 -20 140 140' }));
      say.textContent = line;
      wait(() => {
        fin(); say.textContent = line;
        row.append(h('button', { type: 'button', class: 'pz-go pzm-again', text: 'Again', onclick: again }));
      }, 1200);
    };
    scene.addEventListener('pointermove', (e) => { if (e.buttons) { const r = scene.getBoundingClientRect(); move(((e.clientX - r.left) / (r.width || 1)) * 300 - 25); } });
    draw(); say.textContent = 'Pull the wagon to the door!';
    row.replaceChildren(scene, pull);
  }
}
