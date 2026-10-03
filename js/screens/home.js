// Home (design.md 9.2, from piece 1): the pet parade and the Dad button on top, then a picture grid
// with no words: Letters (big "a" and an apple) | Counting ("123" and 3 apples), Adding | Patterns,
// and Stories full width. At the bottom the Sticker book button: a closed book with a star and the
// last 3 stickers she earned peeking out the top. No counts. Fits 360 x 800 with no scrolling.
// A tap goes straight in and the voice names it ("Letter sounds!", "Counting!", "Stickers!" ...).
import { h, drawing } from '../dom.js';
import { parade } from '../engine.js';
import { art, stickerArt } from '../art.js';
import { petView, setPose } from '../ui.js';
import { dadButton } from '../dad.js';
import { TILES } from '../acts/index.js';
import { tilePic } from '../tiles.js';

const CLASS = { letters: 'letters', count: 'counting', add: 'adding', pattern: 'patterns', stories: 'stories' };
const LABEL = { letters: 'Letter sounds', count: 'Counting', add: 'Adding', pattern: 'Patterns', stories: 'Stories' };

export function bookBar(ctx) {
  const last = ctx.state.book.slice(-3);
  return h('button', { type: 'button', class: 'book-bar', 'aria-label': 'Sticker book', onclick: () => { ctx.intro = ctx.data.clips.homeBook; ctx.go('#book'); } },
    h('span', { class: 'book-cover', 'aria-hidden': 'true' },
      h('span', { class: 'peek' }, last.map((id, i) => h('span', { class: `peek-sk p${i}`, 'data-sticker': id }, drawing(stickerArt(id), { box: '0 0 100 100' })))),
      drawing(art('bookClosed'), { box: '0 0 100 100' })));
}

export function render(ctx) {
  const all = [...ctx.data.pets, ...ctx.data.friends];
  const ids = parade(ctx.data, ctx.state);
  // Sometimes the two bunnies show up together in one spot: only when the second bunny is in the
  // family and not already walking in the parade on its own.
  const b2 = ctx.state.pets.bunny2;
  const pairOk = (!b2 || b2.on !== false) && !ids.includes('bunny2');
  const row = h('div', { class: 'parade' }, ids.map((id, i) => {
    const v = petView(ctx.data, id, 'idle', { pair: id === 'bunny' && pairOk && Math.random() < 0.5 });
    v.classList.add('walk-in', `delay-${i}`);
    const who = all.find((p) => p.id === id);
    v.addEventListener('pointerdown', () => {
      setPose(v, 'happy', 900);
      if (ctx.audio && who) ctx.audio.play([who.sound]);
    });
    return v;
  }));
  // The voice names the activity as the first part of that screen's prompt.
  const tiles = TILES.map((t) => h('button', {
    type: 'button',
    class: `big-btn ${CLASS[t.id]}`,
    'data-tile': t.id,
    'aria-label': LABEL[t.id],
    onclick: () => { ctx.intro = ctx.data.clips[t.clip]; ctx.go(t.route); },
  }, tilePic(t.id)));
  return h('main', { class: 'home' },
    h('div', { class: 'topbar' }, h('p', { class: 'dad-title', text: 'Pet Parade' }), dadButton(ctx)),
    row,
    h('div', { class: 'big-buttons grid' }, tiles),
    bookBar(ctx));
}
