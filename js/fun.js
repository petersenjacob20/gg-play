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

// Character Fun tricks (Amendment n / design.md §13.2). Under 1 s. Picture-only. Ids never contain a name.
const snackArt = () => {
  // fruit/veg only (EM fix): carrot or apple slice — fruit and veg only
  return Math.random() < 0.5 ? art('carrot') : art('apple');
};

export function playTrick({ kind, pet, layer, data, state, card }) {
  if (!kind || !pet) return;
  if (reducedMotion()) { flash(pet, 'react-glow', 900); return; }
  const append = (el, ms = 900) => { if (layer && el) { layer.appendChild(el); later(ms, () => el.remove()); } };
  if (kind === 'tongueBoing') {
    flash(pet, 'trick-tongue', 800);
    const b = friendView('friendSilly', 'pop-up');
    append(b, 900);
  } else if (kind === 'offerBerry') {
    flash(pet, 'trick-offer', 800);
    const berry = h('span', { class: 'trick-prop berry', 'aria-hidden': 'true' }, drawing(art('strawberry') || art('star'), { box: '0 0 100 100' }));
    pet.appendChild(berry); later(900, () => berry.remove());
  } else if (kind === 'numberSparkles') {
    flash(pet, 'trick-sparkle', 800);
    const d = h('div', { class: 'trick-nums', 'aria-hidden': 'true' },
      ...['1', '2', '3'].map((n, i) => h('span', { class: `tn t${i}`, text: n })));
    append(d, 900);
  } else if (kind === 'happyToot') {
    flash(pet, 'trick-toot', 700);
  } else if (kind === 'tailFlip') {
    flash(pet, 'trick-tail', 800);
  } else if (kind === 'snuggle') {
    flash(pet, 'trick-snuggle', 900);
  } else if (kind === 'crunchSnack') {
    flash(pet, 'trick-crunch', 800);
    const prop = h('span', { class: 'trick-prop snack', 'aria-hidden': 'true' }, drawing(snackArt(), { box: '0 0 100 100' }));
    pet.appendChild(prop); later(900, () => prop.remove());
  } else if (kind === 'loudHopPeek') {
    flash(pet, 'trick-hop', 500);
    later(400, () => {
      flash(pet, 'trick-peek', 500);
      const kittyOn = state && state.pets && state.pets.kitty && state.pets.kitty.on !== false;
      if (kittyOn && data) {
        const k = h('div', { class: 'trick-kitty-peek', 'aria-hidden': 'true' },
          h('div', { class: 'pet pose-hmm', 'aria-hidden': 'true' }, drawing(drawChar('kitty'))));
        append(k, 900);
      }
    });
  } else if (kind === 'cuddleLean') {
    flash(pet, 'trick-lean', 800);
  } else if (kind === 'pawTap') {
    flash(pet, 'trick-paw', 700);
  } else if (kind === 'petThenHop') {
    // one gentle pet, then the hop — always works (EM fix: never gated)
    flash(pet, 'trick-pet', 400);
    later(350, () => flash(pet, 'trick-hop', 500));
  } else if (kind === 'pileHug') {
    flash(pet, 'trick-pile', 900);
    const on = activePets(data, state).slice(0, 4);
    if (on.length && layer) {
      const pile = h('div', { class: 'trick-pile', 'aria-hidden': 'true' },
        ...on.map((p, i) => h('div', { class: `pile-pal p${i}` }, drawing(drawChar(p.id)))));
      append(pile, 1000);
    }
  } else if (kind === 'dropBall') {
    flash(pet, 'trick-drop', 800);
    const ball = h('span', { class: 'trick-prop ball', 'aria-hidden': 'true' }, drawing(art('ball') || art('star'), { box: '0 0 100 100' }));
    pet.appendChild(ball); later(900, () => ball.remove());
  } else if (kind === 'spin' || kind === 'zoomies' || kind === 'boing' || kind === 'twirl' || kind === 'earflop' || kind === 'starpop') {
    react({ kind, pet, card, layer });
  } else {
    flash(pet, 'react-glow', 800);
  }
}

export function trickClip(kind, clips) {
  if (!clips) return null;
  if (kind === 'happyToot') return clips.toot || clips.boing;
  if (kind === 'tongueBoing' || kind === 'boing') return clips.boing;
  if (kind === 'numberSparkles' || kind === 'twirl') return clips.chime;
  if (kind === 'crunchSnack') return clips.pop || clips.boing;
  if (kind === 'loudHopPeek') return clips.yip || null;
  return null;
}
