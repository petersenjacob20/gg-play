// The fun layer (design.md 9.3-9.5, plan f4): right-tap reactions, surprises and confetti. Pictures
// and motion only; every piece lives in a layer that never takes taps, never covers the choice cards
// for long, and is gone within about a second. With reduced motion, reactions become a soft glow,
// surprises are off and confetti does not fall.
import { h, drawing } from './dom.js';
import { art } from './art.js';
import { drawChar } from './pets.js';
import { petView } from './ui.js';
import { activePets } from './engine.js';

export function reducedMotion() {
  try { return Boolean(globalThis.matchMedia && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch { return false; }
}
const later = (ms, f) => setTimeout(f, Math.max(0, ms));
const flash = (el, cls, ms) => {
  if (!el) return;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  later(ms, () => el.classList.remove(cls));
};
const friendView = (id, cls) => h('div', { class: `pet pose-happy fx-friend ${cls}`, 'aria-hidden': 'true' }, drawing(drawChar(id)));

// The sound that takes the cheer's place for a reaction (null = the usual cheer clip).
export function reactionClip(kind, clips) {
  if (kind === 'boing') return clips.boing;
  if (kind === 'twirl') return clips.chime;
  return null;
}
// The sound for a surprise (it takes the cheer's place, so nothing talks over anything).
export function surpriseClips(kind, clips, cheer) {
  if (kind === 'zoom') return [clips.zoom];
  if (kind === 'sneeze') return [clips.sneeze, { pause: 120 }, clips.giggle];
  if (kind === 'peekaboo') return [clips.giggle];
  return [cheer]; // butterfly: quiet, with the cheer
}

// One right-tap reaction (at most 900 ms). `delay` lines a sound-linked one up with its sound.
export function react({ kind, pet, card, layer, delay = 0 }) {
  if (reducedMotion()) { flash(pet, 'react-glow', 900); flash(card, 'react-glow', 900); return; }
  later(delay, () => {
    if (kind === 'spin') flash(pet, 'react-spin', 800);
    else if (kind === 'zoomies') flash(pet, 'react-zoomies', 700);
    else if (kind === 'earflop') flash(pet, 'react-earflop', 800);
    else if (kind === 'boing') {
      const b = friendView('friendSilly', 'pop-up');
      layer.appendChild(b); later(900, () => b.remove());
    } else if (kind === 'twirl') {
      const d = h('div', { class: 'flutter-across', 'aria-hidden': 'true' }, friendView('friendCounter', 'flutter'),
        ...Array.from({ length: 5 }, (_, i) => h('span', { class: `sparkle k${i}` }, drawing(art('star'), { box: '0 0 100 100' }))));
      layer.appendChild(d); later(900, () => d.remove());
    } else if (kind === 'starpop' && card) {
      const s = h('span', { class: 'star-pop', 'aria-hidden': 'true' },
        ...[0, 1, 2].map((i) => h('span', { class: `sp s${i}` }, drawing(art('star'), { box: '0 0 100 100' }))));
      card.appendChild(s); later(800, () => s.remove());
    }
  });
}

// One surprise in the top third (zoom, sneeze, butterfly, peekaboo).
export function surprise({ kind, layer, data, state, hostEl, delay = 0 }) {
  if (reducedMotion()) return;
  later(delay, () => {
    let el;
    if (kind === 'zoom') {
      const on = activePets(data, state);
      const who = on.length ? on[Math.floor(Math.random() * on.length)].id : 'friendSilly';
      const v = petView(data, who, 'happy');
      v.classList.add('zoomer');
      el = h('div', { class: 'surprise zoom-across', 'aria-hidden': 'true' }, v);
    } else if (kind === 'sneeze') {
      const who = Math.random() < 0.5 ? 'friendSilly' : 'friendBerry';
      el = h('div', { class: 'surprise sneeze', 'aria-hidden': 'true' }, friendView(who, 'sneezer'),
        h('span', { class: 'puff' }, ...Array.from({ length: 12 }, (_, i) => h('span', { class: `bit c${i % 5}` }))));
    } else if (kind === 'butterfly') {
      // floats down and sits on the host's head for a second (the host stands in the stage's top middle)
      el = h('div', { class: `surprise butterfly-land ${hostEl && hostEl.closest && hostEl.closest('.host.small') ? 'left' : 'mid'}`, 'aria-hidden': 'true' },
        h('span', { class: 'bfly' }, drawing(art('butterfly'), { box: '0 0 100 100' })));
    } else if (kind === 'peekaboo') {
      el = h('div', { class: 'surprise peekaboo', 'aria-hidden': 'true' }, friendView('friendCounter', 'peeker'));
    }
    if (!el) return;
    layer.appendChild(el);
    later(1600, () => el.remove());
  });
}

// Confetti burst (1.5 s or less, the app colours, no flashing).
export function confetti(layer, n = 36) {
  if (reducedMotion()) return;
  const bits = h('div', { class: 'confetti', 'aria-hidden': 'true' },
    ...Array.from({ length: n }, (_, i) => h('span', { class: `cf c${i % 6} r${i % 4} x${(i * 7) % 12} d${i % 5}` })));
  layer.appendChild(bits);
  later(1500, () => bits.remove());
}
