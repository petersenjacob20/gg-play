// Home (design.md §11.1, piece 6): pet parade, then a 2-column grid of built games only (reflow, no
// locked tiles). Each tile has a picture and a cream title strip (Andika, dark brown). Story Time is
// full width on the last row when it is the only tile there. Sticker book bar at the bottom.
import { h, drawing } from '../dom.js';
import { parade } from '../engine.js';
import { art, stickerArt } from '../art.js';
import { petView, setPose } from '../ui.js';
import { dadButton } from '../dad.js';
import { ACTS } from '../acts/index.js';
import { tilePic } from '../tiles.js';
import { builtGames, gameTitleFixed } from '../games.js';
import { activeProfile } from '../store.js';

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
  const games = builtGames(ctx.data.games, ACTS);
  const tiles = games.map((g) => {
    const title = gameTitleFixed(g, ctx.state.pets);
    const wide = g.id === 'stories' && games.length % 2 === 1 && games[games.length - 1] === g;
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
  return h('main', { class: 'home' },
    h('div', { class: 'topbar' }, h('p', { class: 'dad-title', text: 'Pet Parade' }), dadButton(ctx)),
    row,
    h('div', { class: `game-grid n${games.length}` }, tiles),
    bookBar(ctx));
}
