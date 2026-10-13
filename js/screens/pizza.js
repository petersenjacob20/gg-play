// Pizza Kitchen (#game/pizza): crust, finger sauce and cheese (tap fallback), drag or tap toppings,
// bake (no timer shown), slice, serve to an original friend (trick + sticker). No score, no losing.
import { h, drawing, clear } from '../dom.js';
import { drawChar } from '../pets.js';
import { topBar } from '../ui.js';
import { activeProfile } from '../store.js';
import { stepAt } from '../games.js';
import * as K from '../kitchen.js';

export function render(ctx) {
  const snd = (...ids) => { if (ctx.audio) ctx.audio.play(ids); };
  const prefs = K.pizzaPrefs(ctx.state.pizza);
  const pl = activeProfile(ctx.state).levels.pizza;
  const level = (stepAt(ctx.game || {}, (pl && pl.lv) || 1) || { lv: 1 }).lv;
  const order = K.makeOrder(level, prefs);
  const pie = { base: null, sauce: 'red', dabs: 0, spread: [], shreds: [], pieces: [], half: level >= 3 };
  const eater = prefs.who || K.EATERS[Math.floor(Math.random() * K.EATERS.length)];
  let step = 0;
  let rub = null;
  const pieBox = h('div', { class: 'pz-pie' });
  const say = h('p', { class: 'pz-say', 'aria-live': 'polite' });
  const bubble = h('span', { class: 'pz-count letter-font', 'aria-live': 'polite' });
  const row = h('div', { class: 'pz-row' });
  const main = h('main', { class: 'kid pz', 'data-game': 'pizza', 'data-level': String(level) },
    topBar(ctx), say, h('div', { class: 'pz-stage' }, pieBox, bubble), row);
  ctx.question = { pizza: true };

  const at = (e) => { const r = pieBox.getBoundingClientRect(); return [(e.clientX - r.left) * 120 / r.width, (e.clientY - r.top) * 120 / r.height]; };
  const onPie = (e) => { const [x, y] = at(e); return x > 12 && x < 108 && y > 12 && y < 108; };
  const draw = () => clear(pieBox).appendChild(drawing(K.pieArt(pie), { label: 'Pizza' }));
  let down = false;
  let drag = null, ghost = null; // a topping lifted from its button (1.1x, shadow) on its way to the pie
  addEventListener('pointermove', (e) => { if (ghost) ghost.style.translate = `${e.clientX - 28}px ${e.clientY - 28}px`; });
  addEventListener('pointerup', (e) => {
    const g = ghost; ghost = null;
    if (!drag) return;
    const [id, b] = drag; drag = null;
    if (onPie(e)) { g && g.remove(); b.dataset.dragged = 1; place(id, ...at(e)); return; }
    if (!g) return;
    const r = b.getBoundingClientRect();
    g.classList.add('back'); g.style.translate = `${r.left}px ${r.top}px`;
    setTimeout(() => g.remove(), 300);
  });
  pieBox.addEventListener('pointerdown', (e) => { down = true; if (rub) rub(at(e)); });
  pieBox.addEventListener('pointermove', (e) => { if (down && rub) rub(at(e)); });
  addEventListener('pointerup', () => { down = false; });
  const btn = (label, pic, on, cls = 'pz-btn') => h('button', { type: 'button', class: cls, 'aria-label': label, onclick: on }, pic, h('span', { class: 'pz-lbl', text: label }));
  const mini = (p) => drawing(K.pieArt(p));
  const next = () => { step += 1; down = false; show(); };

  function place(id, x, y) {
    pie.pieces.push({ id, x, y });
    draw();
    const o = order.find((q) => q.id === id && (!q.side || (q.side === 'L') === (x < 60)));
    if (!o) { snd(K.CLIPS.land); return; }
    const n = K.countOf(o, pie.pieces);
    bubble.textContent = `${K.countWord(n)}!`;
    if (K.matched(order, pie.pieces)) { say.textContent = 'Yes! Just right!'; snd(K.numClip(n), K.CLIPS.match); } else snd(K.numClip(n));
  }

  function show() {
    const s = K.STEPS[step];
    main.setAttribute('data-step', s);
    rub = null; draw(); clear(row); bubble.textContent = '';
    if (s === 'base') {
      say.textContent = 'Pick a crust!';
      K.BASES.forEach((b) => row.append(btn(b.label, mini({ base: b.id }), () => { pie.base = b.id; snd(K.CLIPS.pick); next(); })));
    } else if (s === 'sauce') {
      say.textContent = 'Spread the sauce with your finger!';
      const got = new Set();
      rub = (xy) => { pie.spread.push(xy); draw(); if (K.cover(got, ...xy)) { pie.dabs = K.SAUCE_FULL; snd(K.CLIPS.pick); next(); } };
      K.SAUCES.forEach((c) => row.append(btn(c.label, mini(K.fullPie(pie.base, c.id)), () => { pie.sauce = c.id; pie.dabs = K.SAUCE_FULL; snd(K.CLIPS.pick); next(); })));
    } else if (s === 'cheese') {
      say.textContent = 'Sprinkle the cheese!';
      const got = new Set();
      rub = (xy) => { pie.shreds.push(xy); draw(); if (K.cover(got, ...xy, 12)) { pie.shreds = K.fullPie(0, 0, 'lots').shreds.concat(pie.shreds); next(); } };
      K.CHEESES.forEach((c) => row.append(btn(c.label, mini(K.fullPie(pie.base, pie.sauce, c.id)), () => { pie.shreds = K.fullPie(0, 0, c.id).shreds; snd(K.CLIPS.pick); next(); })));
    } else if (s === 'toppings') {
      say.textContent = K.orderText(order);
      snd(...order.flatMap((o) => [K.numClip(o.n), K.CLIPS.pick]));
      let i = 0;
      K.TOPPINGS.filter((t) => !prefs.off.includes(t.id)).forEach((t) => {
        const b = btn(t.label, drawing(K.toppingArt(t.id, 10, 10), { box: '0 0 20 20' }), () => {
          if (b.dataset.dragged) { delete b.dataset.dragged; return; }
          const side = (order.find((o) => o.id === t.id) || {}).side;
          place(t.id, ...K.spot(i++, side));
        });
        b.addEventListener('pointerdown', (e) => {
          drag = [t.id, b];
          ghost = h('span', { class: 'pz-ghost' }, drawing(K.toppingArt(t.id, 10, 10), { box: '0 0 20 20' }));
          ghost.style.translate = `${e.clientX - 28}px ${e.clientY - 28}px`;
          main.append(ghost);
        });
        row.append(b);
      });
      row.append(h('button', { type: 'button', class: 'pz-go', text: 'Bake it!', onclick: next }));
    } else if (s === 'bake') {
      say.textContent = 'Slide it in the oven!';
      const oven = h('button', { type: 'button', class: 'pz-oven', 'aria-label': 'Oven' }, drawing(K.ovenArt(false)));
      oven.onclick = () => { main.classList.add('pz-baking'); clear(oven).append(drawing(K.ovenArt(true))); snd(K.CLIPS.bake); oven.disabled = true; setTimeout(() => { pie.baked = true; main.classList.remove('pz-baking'); next(); }, 1200); };
      row.append(oven);
    } else if (s === 'slice') {
      say.textContent = 'Slice it! Swipe across.';
      pie.guides = 1; draw();
      const cut = () => { if (pie.sliced) return; pie.sliced = true; snd(K.CLIPS.slice); pieBox.append(h('span', { class: 'pz-wheel' })); setTimeout(next, 700); };
      rub = cut;
      row.append(h('button', { type: 'button', class: 'pz-go', text: 'Slice', onclick: cut }));
    } else {
      say.textContent = 'Serve it!';
      const who = h('button', { type: 'button', class: 'pz-who', 'aria-label': 'Friend' }, drawing(drawChar(eater)));
      who.onclick = () => {
        pie.bitten = true; draw(); snd(K.CLIPS.bite);
        say.textContent = 'Happy bite! A pizza sticker!';
        main.setAttribute('data-step', 'served');
        who.classList.add('pz-trick');
        const bk = activeProfile(ctx.state).book;
        if (!bk.includes('sk-pizza')) { bk.push('sk-pizza'); ctx.session.newStickers = ['sk-pizza']; ctx.save(); }
        row.append(h('span', { class: 'pz-sticker', 'aria-label': 'Pizza sticker' }, drawing(K.tileArt(), { box: '0 0 100 100' })));
        setTimeout(() => snd(K.CLIPS.done), 700);
      };
      row.append(who);
    }
  }
  show();
  return main;
}
