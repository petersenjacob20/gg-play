// Home (design.md §11.1, piece 6): pet parade, then a 2-column grid of built games only (reflow, no
// locked tiles). Each tile has a picture and a cream title strip (Andika, dark brown). The Playground,
// when it is on, is the FIRST tile (top-left; CEO, so it is easy to find), then the games in Design
// order. Story Time is full width only when it ends up alone on the last row (an odd tile count,
// counting the Playground when present). Sticker book bar at the bottom.
import { h, drawing } from '../dom.js';
import { parade } from '../engine.js';
import { art, stickerArt } from '../art.js';
import { petView, setPose } from '../ui.js';
import { dadButton } from '../dad.js';
import { PLAYABLE } from '../acts/index.js';
import { tilePic } from '../tiles.js';
import { builtGames, gameTitleFixed } from '../games.js';
import { activeProfile } from '../store.js';
import { playgroundShips } from '../playground.js';

export function bookBar(ctx) {
  const last = activeProfile(ctx.state).book.slice(-3);
  return h('button', { type: 'button', class: 'book-bar', 'aria-label': 'Sticker book', onclick: () => { ctx.intro = ctx.data.clips.homeBook; ctx.go('#book'); } },
    h('span', { class: 'book-cover', 'aria-hidden': 'true' },
      h('span', { class: 'peek' }, last.map((id, i) => h('span', { class: `peek-sk p${i}`, 'data-sticker': id }, drawing(stickerArt(id), { box: '0 0 100 100' })))),
      drawing(art('bookClosed'), { box: '0 0 100 100' })));
}

function clipFor(game, data) {
  const id = game.label;
  if (data.clips && data.clips[id]) return data.clips[id];
  return id;
}

export function render(ctx) {
  const all = [...ctx.data.pets, ...ctx.data.friends];
  const ids = parade(ctx.data, ctx.state);
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
  const games = builtGames(ctx.data.games, PLAYABLE);
  const pgOn = playgroundShips(ctx.data) && ctx.state.playground !== false;
  const order = [...(pgOn ? ['playground'] : []), ...games.map((g) => g.id)];
  // full width only when alone on the last row of the 2-column grid: the last tile of an odd count
  const aloneLast = (id) => order.length % 2 === 1 && order[order.length - 1] === id;
  const tiles = games.map((g) => {
    const title = gameTitleFixed(g, ctx.state.pets);
    const wide = g.id === 'stories' && aloneLast('stories');
    return h('button', {
      type: 'button',
      class: `game-tile edge-${g.id}${wide ? ' wide' : ''}`,
      'data-tile': g.id,
      'data-game': g.id,
      'aria-label': title,
      onclick: () => {
        ctx.intro = clipFor(g, ctx.data);
        ctx.go(g.route || `#game/${g.id}`);
      },
    },
      h('span', { class: 'tile-art', 'aria-hidden': 'true' }, tilePic(g.tile?.replace(/^tl-/, '') || g.id)),
      h('span', { class: 'tile-title', text: title }));
  });
  // Playground tile (Amendment n / design.md §13.3) — lilac edge; only when it ships and Dad's toggle is on.
  // First in the grid. It could only be alone on the last row if it were the only tile; then it goes full
  // width with its art kept at tile size, centred (design §17.1, the CSS rule for .wide.edge-playground).
  if (pgOn) {
    const pgWide = aloneLast('playground');
    const pgClip = (ctx.data.clips && ctx.data.clips['h-playground']) || 'c-yay1';
    tiles.unshift(h('button', {
      type: 'button',
      class: `game-tile edge-playground${pgWide ? ' wide' : ''}`,
      'data-tile': 'playground',
      'aria-label': 'Playground',
      onclick: () => {
        ctx.intro = pgClip;
        ctx.go('#playground');
      },
    },
      h('span', { class: 'tile-art', 'aria-hidden': 'true' }, tilePic('playground')),
      h('span', { class: 'tile-title', text: 'Playground' })));
  }
  const n = tiles.length;
  return h('main', { class: 'home' },
    h('div', { class: 'topbar' }, h('p', { class: 'dad-title', text: 'Pet Parade' }), dadButton(ctx)),
    row,
    h('div', { class: `game-grid n${n}` }, tiles),
    bookBar(ctx));
}
