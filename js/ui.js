// Shared kid-screen widgets: a drawn character with poses, the top bar, icon buttons.
import { h, drawing } from './dom.js';
import { drawChar } from './pets.js';
import { ICONS } from './pics.js';
import { dadButton } from './dad.js';
import { photoURL } from './photos.js';

// Generic labels only (never a pet's real name): screen readers speak aria-labels aloud.
export function genericLabel(data, id) {
  const all = [...data.pets, ...(data.friends || [])];
  const x = all.find((p) => p.id === id);
  return x ? x.label : 'Pet';
}

// A pet with a photo saved on this phone shows it in the die-cut sticker frame (design.md 6c), in
// the same box as the drawing; the poses become motion (breathe, hop, head tilt). Otherwise the drawing.
export function petView(data, id, pose = 'idle', opts = {}) {
  const url = photoURL(id);
  if (url) return photoPet(data, id, pose, url);
  return h('div', { class: `pet pose-${pose} pet-${id}`, 'data-pet': id },
    drawing(drawChar(id, opts), { label: genericLabel(data, id) }));
}

// The sticker: tilt (fixed per pet, CSS) > motion > circle frame (white outline, brown line, shadow)
// > the photo. No filters, props or words on the photo.
export function photoSticker(url) {
  return h('span', { class: 'photo-tilt' },
    h('span', { class: 'photo-move' },
      h('span', { class: 'sticker-frame' },
        h('img', { class: 'photo', src: url, alt: '', draggable: 'false', decoding: 'async' }))));
}

function photoPet(data, id, pose, url) {
  return h('div', { class: `pet photo-pet pose-${pose} pet-${id}`, 'data-pet': id, 'data-photo': '1', role: 'img', 'aria-label': genericLabel(data, id) },
    photoSticker(url));
}

const poseTimers = new WeakMap();
// Show a pose for `ms`, then go back to idle (ms = 0 keeps it).
export function setPose(el, pose, ms = 0) {
  if (!el) return;
  clearTimeout(poseTimers.get(el));
  el.classList.remove('pose-idle', 'pose-happy', 'pose-hmm');
  void el.offsetWidth; // restart the CSS animation
  el.classList.add(`pose-${pose}`);
  if (ms) poseTimers.set(el, setTimeout(() => setPose(el, 'idle'), ms));
}

export function icon(name, cls = '', ...args) {
  return drawing(ICONS[name](...args), { cls: `icon ${cls}`.trim(), box: '0 0 64 64' });
}

export function homeButton(ctx) {
  return h('button', { type: 'button', class: 'icon-btn home-btn', 'aria-label': 'Home', onclick: () => ctx.go('#home') }, icon('house'));
}

// 5 paw prints that fill in as questions are finished. No numbers.
export function paws(done = 0, total = 5) {
  const wrap = h('div', { class: 'paws', 'aria-hidden': 'true' });
  for (let i = 0; i < total; i++) wrap.appendChild(h('span', { class: i < done ? 'paw on' : 'paw' }, icon('paw')));
  return wrap;
}
export function fillPaw(wrap, done) {
  [...wrap.children].forEach((p, i) => p.classList.toggle('on', i < done));
}

export function topBar(ctx, { home = true, progress = null } = {}) {
  return h('div', { class: 'topbar' },
    home ? homeButton(ctx) : h('span', { class: 'spacer' }),
    progress || h('span', { class: 'spacer grow' }),
    dadButton(ctx));
}
