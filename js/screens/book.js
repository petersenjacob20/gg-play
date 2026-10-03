// The sticker book (design.md 9.7, plan f4/f6). Home sits top left; one page of 9 slots (3 x 3, each
// 96 px or more). A sticker she has shows its picture, a little tilted, in a white die-cut frame; one
// she doesn't have yet is a dashed light-gray outline of its shape (nothing to read, no lock, no "?").
// Tapping a sticker she has makes it wiggle and play a little sound. Big arrows (88 px) and swipe turn
// the pages; dots at the bottom show the page (no numbers). No counts or "x of y" anywhere.
import { h, drawing } from '../dom.js';
import { stickerArt } from '../art.js';
import { topBar, icon } from '../ui.js';

// A pet or friend sticker plays that character's own sound; every other sticker a soft pop.
export function soundFor(id, data) {
  const who = [...data.pets, ...(data.friends || [])].find((p) => `sk-${p.id}` === id);
  return who && who.sound ? who.sound : data.clips.pop;
}

// Which page to open on: the page of the newest sticker (or the first page).
export function startPage(pages, book, fresh = []) {
  const want = fresh.length ? fresh[fresh.length - 1] : book[book.length - 1];
  const i = pages.findIndex((pg) => pg.includes(want));
  return i < 0 ? 0 : i;
}

export function render(ctx) {
  const data = ctx.data;
  const pages = data.stickerBook;
  const owned = new Set(ctx.state.book);
  const fresh = ctx.session.newStickers || [];
  ctx.session.newStickers = []; // they shine once
  let page = startPage(pages, ctx.state.book, fresh);
  const grid = h('div', { class: 'book-page' });
  const dotsEl = h('div', { class: 'page-dots', 'aria-hidden': 'true' }, pages.map(() => h('span', { class: 'page-dot' })));
  const prevBtn = h('button', { type: 'button', class: 'icon-btn page-arrow prev', 'aria-label': 'Page back', onclick: () => turn(-1) }, icon('arrowLeft'));
  const nextBtn = h('button', { type: 'button', class: 'icon-btn page-arrow next', 'aria-label': 'Next page', onclick: () => turn(1) }, icon('arrowRight'));

  function slot(id) {
    const have = owned.has(id);
    const tilt = `tilt${[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 4}`;
    if (!have) {
      return h('span', { class: 'slot missing', 'data-sticker': id, 'aria-hidden': 'true' },
        h('span', { class: 'slot-art' }, drawing(stickerArt(id), { box: '0 0 100 100' })));
    }
    const b = h('button', { type: 'button', class: `slot have ${tilt}${fresh.includes(id) ? ' shine' : ''}`, 'data-sticker': id, 'aria-label': 'Sticker' },
      h('span', { class: 'die-cut' }, h('span', { class: 'slot-art' }, drawing(stickerArt(id), { box: '0 0 100 100' }))));
    b.addEventListener('click', () => {
      b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
      if (ctx.audio) ctx.audio.play([soundFor(id, data)]);
    });
    return b;
  }

  function show() {
    grid.replaceChildren(...pages[page].map(slot));
    grid.dataset.page = String(page);
    [...dotsEl.children].forEach((d, i) => d.classList.toggle('on', i === page));
    prevBtn.classList.toggle('dim', page === 0);
    nextBtn.classList.toggle('dim', page === pages.length - 1);
  }
  function turn(d) {
    const n = page + d;
    if (n < 0 || n >= pages.length) return;
    page = n;
    show();
    if (ctx.audio) ctx.audio.fx([data.clips.pop]);
  }

  // swipe left / right
  let x0 = null;
  grid.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  grid.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) turn(dx < 0 ? 1 : -1);
  });

  show();
  if (ctx.intro && ctx.audio) ctx.audio.play([ctx.intro]);
  ctx.intro = null;
  return h('main', { class: 'kid book' },
    topBar(ctx),
    h('div', { class: 'book-spread' }, grid),
    h('div', { class: 'book-nav' }, prevBtn, dotsEl, nextBtn));
}
