// Pizza Kitchen (#game/pizza): crust, finger sauce and cheese (tap fallback), drag or tap toppings,
// bake (no timer shown), slice, serve to an original friend (trick + sticker). No score, no losing.
import { h, drawing, clear } from '../dom.js';
import { drawChar } from '../pets.js';
import { topBar } from '../ui.js';
import { activeProfile } from '../store.js';
import { stepAt } from '../games.js';
import * as K from '../kitchen.js';
let M = null; // extras pack; without it the game plays as before
import('../pizza-more.js').then((m) => { M = m; }, () => {});

// leave() (main.js calls it) removes render()'s window listeners
let winOn = [];
export function leave() { winOn.forEach(([t, f]) => removeEventListener(t, f)); winOn = []; }

export function render(ctx) {
  leave();
  const onWin = (t, f) => { addEventListener(t, f); winOn.push([t, f]); };
  const snd = (...ids) => { if (ctx.audio) ctx.audio.play(ids); };
  const prefs = K.pizzaPrefs(ctx.state.pizza);
  const pl = activeProfile(ctx.state).levels.pizza;
  const level = (stepAt(ctx.game || {}, (pl && pl.lv) || 1) || { lv: 1 }).lv;
  const order = (M || K).makeOrder(level, prefs);
  const pie = { base: null, sauce: 'red', dabs: 0, spread: [], shreds: [], pieces: [], half: level >= 3 };
  const eater = prefs.who || K.EATERS[Math.floor(Math.random() * K.EATERS.length)];
  let step = 0, card = null;
  const st = {};
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
  const inR = (e, r) => e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  let down = false;
  let drag = null, ghost = null; // a topping lifted from its button (1.1x, shadow) on its way to the pie
  onWin('pointermove', (e) => { if (ghost) ghost.style.translate = `${e.clientX - 28}px ${e.clientY - 28}px`; });
  onWin('pointerup', (e) => {
    const g = ghost; ghost = null;
    if (!drag) return;
    const [id, b, tap] = drag; drag = null;
    if (onPie(e)) { g && g.remove(); place(id, ...at(e)); return; }
    const r = b.getBoundingClientRect();
    if (inR(e, r)) { g && g.remove(); return tap(); }
    if (!g) return;
    g.classList.add('back'); g.style.translate = `${r.left}px ${r.top}px`;
    setTimeout(() => g.remove(), 300);
  });
  pieBox.addEventListener('pointerdown', (e) => { down = true; if (rub) rub(at(e)); });
  pieBox.addEventListener('pointermove', (e) => { if (down && rub) rub(at(e)); });
  onWin('pointerup', () => { down = false; });
  const btn = (label, pic, on, cls = 'pz-btn') => h('button', { type: 'button', class: cls, 'aria-label': label, onclick: on }, pic, h('span', { class: 'pz-lbl', text: label }));
  // a pick counts on pointerup inside the button (QA: dropped clicks); click is the fallback, once only
  let ghostClick = 0, dn; // swallow a late click after a pointerup pick
  main.addEventListener('pointerdown', (e) => { dn = e.target; }, true);
  main.addEventListener('click', (e) => { if (Date.now() - ghostClick < 600 && e.target !== dn) { e.stopPropagation(); e.preventDefault(); } }, true);
  const pick = (label, pic, on) => {
    let done = false, pid = null;
    const go = () => { if (!done) { done = true; on(); } };
    const b = btn(label, pic, go);
    b.addEventListener('pointerdown', (e) => { pid = e.pointerId; });
    b.addEventListener('pointerup', (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      if (inR(e, b.getBoundingClientRect())) { ghostClick = done ? ghostClick : Date.now(); go(); }
    });
    return b;
  };
  const mini = (p) => drawing(K.pieArt(p));
  const next = () => { step += 1; down = false; show(); };

  function place(id, x, y) {
    pie.pieces.push({ id, x, y });
    draw();
    const o = order.find((q) => q.id === id && (!q.side || (q.side === 'L') === (x < 60)));
    if (M) {
      const a = M.after(order, pie.pieces, level, o, st);
      if (o) bubble.textContent = `${K.countWord(K.countOf(o, pie.pieces))}!`;
      if (a.text) say.textContent = a.text;
      if (a.more && card) card.replaceWith(card = M.card(order));
      return snd(M.land(id), ...a.clips);
    }
    if (!o) { snd(K.CLIPS.land); return; }
    const n = K.countOf(o, pie.pieces);
    bubble.textContent = `${K.countWord(n)}!`;
    if (K.matched(order, pie.pieces)) { say.textContent = 'Yes! Just right!'; snd(K.numClip(n), K.CLIPS.match); } else snd(K.numClip(n));
  }

  function show() {
    const s = K.STEPS[step];
    main.setAttribute('data-step', s);
    rub = null; draw(); clear(row); bubble.textContent = '';
    main.removeAttribute('data-picked'); main.removeAttribute('data-drag'); pieBox.style.translate = '';
    pieBox.onpointerdown = pieBox.onpointermove = pieBox.onpointerup = pieBox.onpointercancel = null;
    if (s === 'base') {
      say.textContent = 'Pick a crust!';
      K.BASES.forEach((b) => row.append(pick(b.label, mini({ base: b.id }), () => { pie.base = b.id; snd(K.CLIPS.pick); next(); })));
    } else if (s === 'sauce') {
      say.textContent = 'Spread the sauce with your finger!';
      const got = new Set();
      rub = (xy) => { pie.spread.push(xy); draw(); if (K.cover(got, ...xy)) { pie.dabs = K.SAUCE_FULL; snd(K.CLIPS.pick); next(); } };
      K.SAUCES.forEach((c) => row.append(pick(c.label, mini(K.fullPie(pie.base, c.id)), () => { pie.sauce = c.id; pie.dabs = K.SAUCE_FULL; snd(K.CLIPS.pick); next(); })));
    } else if (s === 'cheese') {
      say.textContent = 'Sprinkle the cheese!';
      const got = new Set();
      rub = (xy) => { pie.shreds.push(xy); draw(); if (K.cover(got, ...xy, 12)) { pie.shreds = K.fullPie(0, 0, 'lots').shreds.concat(pie.shreds); next(); } };
      K.CHEESES.forEach((c) => row.append(pick(c.label, mini(K.fullPie(pie.base, pie.sauce, c.id)), () => { pie.shreds = K.fullPie(0, 0, c.id).shreds; snd(K.CLIPS.pick); next(); })));
    } else if (s === 'toppings') {
      say.textContent = (M || K).orderText(order);
      snd(...order.flatMap((o) => [K.numClip(o.n), K.CLIPS.pick]));
      let i = 0;
      if (M) row.append(card = M.card(order));
      [...K.TOPPINGS, ...(M ? M.EXTRA : [])].filter((t) => !prefs.off.includes(t.id)).forEach((t) => {
        const tap = () => place(t.id, ...K.spot(i++, (order.find((o) => o.id === t.id) || {}).side));
        const b = btn(t.label, drawing(K.toppingArt(t.id, 10, 10), { box: '0 0 20 20' }), (e) => e.detail || tap());
        b.addEventListener('pointerdown', (e) => {
          drag = [t.id, b, tap];
          ghost = h('span', { class: 'pz-ghost' }, drawing(K.toppingArt(t.id, 10, 10), { box: '0 0 20 20' }));
          ghost.style.translate = `${e.clientX - 28}px ${e.clientY - 28}px`;
          main.append(ghost);
        });
        row.append(b);
      });
      row.append(h('button', { type: 'button', class: 'pz-go', text: 'Bake it!', onclick: () => M?.hold(level, order, pie, say) || next() }));
    } else if (s === 'bake') {
      // drag the pizza near the oven, tap pizza then oven, or tap the oven
      say.textContent = 'Slide it in the oven!';
      const oven = h('button', { type: 'button', class: 'pz-oven', 'aria-label': 'Oven' }, drawing(K.ovenArt(false)));
      let baking = false, pd = null;
      const home = () => { pieBox.style.translate = ''; main.removeAttribute('data-drag'); };
      const bake = () => {
        if (baking) return; if (M && M.hold(level, order, pie, say)) return home(); baking = true; pd = null; home(); main.removeAttribute('data-picked');
        main.classList.add('pz-baking'); clear(oven).append(drawing(K.ovenArt(true))); snd(K.CLIPS.bake); oven.disabled = true;
        setTimeout(() => { pie.baked = true; main.classList.remove('pz-baking'); next(); }, 1200);
      };
      const near = (x, y) => { const r = oven.getBoundingClientRect(), m = 60; return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m; };
      pieBox.onpointerdown = (e) => {
        if (baking) return; e.preventDefault();
        try { pieBox.setPointerCapture(e.pointerId); } catch { /* old browsers */ }
        pd = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      };
      pieBox.onpointermove = (e) => {
        if (!pd || e.pointerId !== pd.id) return;
        const dx = e.clientX - pd.x, dy = e.clientY - pd.y;
        if (!pd.moved && Math.hypot(dx, dy) < 10) return;
        pd.moved = true; main.setAttribute('data-drag', near(e.clientX, e.clientY) ? 'over' : '1');
        pieBox.style.translate = `${dx}px ${dy}px`;
      };
      const mid = () => { const r = pieBox.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
      const up = (e) => {
        if (!pd || e.pointerId !== pd.id) return;
        const d = pd; pd = null;
        if (e.type === 'pointerup' && (near(e.clientX, e.clientY) || (d.moved && near(...mid())))) return bake();
        home();
        if (e.type === 'pointerup' && !d.moved) main.setAttribute('data-picked', '1');
      };
      pieBox.onpointerup = up; pieBox.onpointercancel = up;
      let op = null;
      oven.addEventListener('pointerdown', (e) => { op = e.pointerId; });
      oven.addEventListener('pointerup', (e) => { if (e.pointerId === op && near(e.clientX, e.clientY)) bake(); op = null; });
      oven.onclick = bake;
      row.append(oven);
    } else if (s === 'slice') {
      say.textContent = 'Slice it! Swipe across.';
      pie.guides = 1; draw();
      const cut = () => { if (pie.sliced) return; pie.sliced = true; snd(K.CLIPS.slice); pieBox.append(h('span', { class: 'pz-wheel' })); M ? M.countSlices(bubble, snd, next) : setTimeout(next, 700); };
      rub = M ? M.slicer(bubble, snd, next, pie, pieBox) : cut;
      row.append(h('button', { type: 'button', class: 'pz-go', text: 'Slice', onclick: () => rub() }));
    } else {
      say.textContent = 'Serve it!';
      const fin = (who) => {
        pie.bitten = true; draw(); snd(K.CLIPS.bite);
        say.textContent = 'Happy bite! A pizza sticker!';
        main.setAttribute('data-step', 'served');
        if (who) who.classList.add('pz-trick');
        const bk = activeProfile(ctx.state).book;
        if (!bk.includes('sk-pizza')) { bk.push('sk-pizza'); ctx.session.newStickers = ['sk-pizza']; ctx.save(); }
        row.append(h('span', { class: 'pz-sticker', 'aria-label': 'Pizza sticker' }, drawing(K.tileArt(), { box: '0 0 100 100' })));
        setTimeout(() => snd(K.CLIPS.done), 700);
      };
      if (M) return M.deliver({ row, say, main, snd, fin, pie, ctx });
      const who = h('button', { type: 'button', class: 'pz-who', 'aria-label': 'Friend' }, drawing(drawChar(eater)));
      who.onclick = () => fin(who);
      row.append(who);
    }
  }
  show();
  return main;
}
