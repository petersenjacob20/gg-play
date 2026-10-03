// Round end (design.md 9.5-9.6, plan f4). After the 5th paw: a confetti burst (1.5 s or less), then
// after a level-up the level-up moment (about 2.5 s: the activity's tile picture flies to the middle
// inside a gold star ring and every pet that is on dances), then a wrapped box drops in and bounces.
// "Tap the box!" If she waits, it wiggles every 3 s; it never times out and never opens by itself.
// One tap: the lid pops, the sticker rises to the middle, sparkles, "A new sticker!", then flies into
// the Sticker book button. A level-up box has a gold ribbon and gives 2 stickers, one after the other.
// Then Play again and Home, plus a small book button. Nothing moves on by itself. No counts anywhere.
import { h, drawing } from './dom.js';
import { art, stickerArt } from './art.js';
import { petView, topBar, icon } from './ui.js';
import { activePets } from './engine.js';
import { confetti, reducedMotion } from './fun.js';
import { tilePic } from './tiles.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const bump = (el, cls, ms) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); };

export function roundEnd(ctx, { act, got, leveledUp, playAgain }) {
  const data = ctx.data;
  const clips = data.clips;
  const play = (seq) => (ctx.audio ? ctx.audio.play(seq) : Promise.resolve(false));
  const layer = h('div', { class: 'fx-layer', 'aria-hidden': 'true' });
  const stage = h('div', { class: 'end-stage' });
  const bookBtn = h('button', { type: 'button', class: 'icon-btn book-btn', 'aria-label': 'Sticker book', onclick: () => { ctx.intro = clips.homeBook; ctx.go('#book'); } },
    drawing(art('bookClosed'), { box: '0 0 100 100' }));
  const buttons = h('div', { class: 'end-buttons', hidden: true },
    h('button', { type: 'button', class: 'icon-btn big-icon', 'aria-label': 'Play again', onclick: playAgain }, icon('replay')),
    h('button', { type: 'button', class: 'icon-btn big-icon', 'aria-label': 'Home', onclick: () => ctx.go('#home') }, icon('house')));
  const main = h('main', { class: `kid round-end${leveledUp ? ' leveled' : ''}`, 'data-act': act.id },
    topBar(ctx), stage, h('div', { class: 'end-foot' }, buttons, bookBtn), layer);
  const alive = () => main.isConnected;

  async function levelUpMoment() {
    const on = activePets(data, ctx.state).map((p) => p.id);
    const dancers = (on.length ? on : data.friends.map((f) => f.id)).slice(0, 8);
    const ring = h('div', { class: 'level-ring', 'aria-hidden': 'true' },
      h('span', { class: 'ring-art' }, drawing(art('starRing'), { box: '0 0 100 100' })),
      h('span', { class: 'ring-tile' }, tilePic(act.id)));
    const row = h('div', { class: `dancers run-in n${Math.min(dancers.length, 8)}` }, dancers.map((id, i) => {
      const v = petView(data, id, 'happy');
      v.classList.add('dance', `d${i % 4}`);
      return v;
    }));
    stage.replaceChildren(h('div', { class: 'level-up' }, ring, row));
    play([clips.levelUp]);
    await wait(2500);
  }

  function reveal(g) {
    const el = h('div', { class: `reveal${g.owned ? ' owned' : ''}`, 'data-sticker': g.id, 'aria-hidden': 'true' },
      h('span', { class: 'reveal-art' }, drawing(stickerArt(g.id), { box: '0 0 100 100' })),
      ...[0, 1, 2, 3, 4, 5].map((i) => h('span', { class: `twinkle t${i}` }, drawing(art('star'), { box: '0 0 100 100' }))));
    stage.appendChild(el);
    return el;
  }

  function showBox() {
    const gold = leveledUp;
    const box = h('button', { type: 'button', class: `gift drop${gold ? ' gold' : ''}`, 'aria-label': 'Open the box' },
      h('span', { class: 'gift-lid' }, drawing(art('boxLid', { gold }), { box: '0 0 100 100' })),
      h('span', { class: 'gift-base' }, drawing(art('boxBase', { gold }), { box: '0 0 100 100' })));
    stage.replaceChildren(box);
    play([clips.box]);
    setTimeout(() => box.classList.add('waiting'), 900); // then a wiggle every 3 s until she taps
    let opened = false;
    box.addEventListener('click', async () => {
      if (opened) return;
      opened = true;
      box.classList.remove('drop', 'waiting');
      box.classList.add('open');
      if (!got.length) { buttons.hidden = false; return; }
      for (let i = 0; i < got.length; i++) {
        const g = got[i];
        const el = reveal(g);
        const line = g.owned ? clips.yay : clips.newSticker;
        play(i === 0 ? [clips.pop, { pause: 120 }, line] : [line]);
        await wait(reducedMotion() ? 900 : 1700);
        if (!alive()) return;
        el.classList.add('fly');
        await wait(reducedMotion() ? 50 : 650);
        el.remove();
        bump(bookBtn, 'bounce', 600);
      }
      box.classList.add('done');
      buttons.hidden = false;
    });
  }

  (async () => {
    confetti(layer);
    play([clips.confetti]);
    await wait(1300);
    if (!alive()) return;
    if (leveledUp) { await levelUpMoment(); if (!alive()) return; }
    showBox();
  })();
  return main;
}
