// Pet Care (a lazily loaded pack like Hide and Grow It!): two big buttons, Bath and Heal. Bath: a pet has mud spots;
// drag the hose over them (or tap a spot) and each spray fades a spot until it is gone. Heal: a pet has little pink
// scuffs; the healer bottle sprays each away and a bandage pops on. Then a big cheer and a silly line (a family voice
// or the on-device voice with the typed pet name), then the surprise box. Finishing on her own goes up a level.
import { h, drawing } from '../dom.js';
import { drawChar } from '../pets.js';
import { topBar } from '../ui.js';
import { petLabel, petSpeak } from '../petname.js';
import { pickStickers } from '../engine.js';
import { roundEnd } from '../reward.js';
import { getBook, activeProfile } from '../store.js';
import { gameById, ladderMax, stepAt, keysForLevel } from '../games.js';
import { CARE_ART, SPRAY_MS, pickPet, makeRound, spray, fade, hitSpot, levelAfter, brows } from '../care.js';

export const CARE_CACHE = 'gg-pack-care-bfa718de1c';
export const CARE_PACK = ['./js/screens/care.js', './js/care.js', './data/care.json', './css/care.css'];
export async function ready(ctx) {
  const get = async (f) => { const r = await fetch(`./data/${f}`, { cache: 'reload' }); if (!r.ok) throw new Error(f); return r.json(); };
  const [care] = await Promise.all([get('care.json')]);
  await new Promise((ok) => { const k = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: './css/care.css' }); k.onload = k.onerror = ok; document.head.append(k); });
  ctx.data.care = care;
  if (globalThis.caches) {
    caches.open(CARE_CACHE).then(async (c) => {
      if (!(await c.match(CARE_PACK[0]))) await c.addAll([...CARE_PACK].map((u) => new Request(u, { cache: 'reload' })));
      for (const k of await caches.keys()) if (k.startsWith('gg-pack-care-') && k !== CARE_CACHE) await caches.delete(k); // an older pack
    }).catch(() => {});
  }
  return { render };
}

export const CHEER_MS = 2200; // the clean pet hops and cheers, then the surprise box
const at = (el, s) => { el.style.left = `${s.x}%`; el.style.top = `${s.y}%`; return el; };
const pic = (id, cls, v) => h('span', { class: cls, 'aria-hidden': 'true' }, drawing(CARE_ART[id](v), { box: '0 0 100 100' }));

export function render(ctx) {
  const data = ctx.data; const cd = data.care;
  const game = ctx.game || gameById(data.games, 'care');
  const profile = activeProfile(ctx.state);
  const max = ladderMax(game);
  const level = (stepAt(game, (profile.levels.care && profile.levels.care.lv) || 1) || { lv: 1 }).lv;
  const session = (ctx.session.care = ctx.session.care || { last: null, n: 0 });
  const stage = h('div', { class: 'pc-stage' });
  const main = h('main', { class: 'kid care theme-care', 'data-game': 'care', 'data-level': String(level), 'data-phase': 'menu' }, topBar(ctx), stage);
  const alive = () => main.isConnected !== false;
  const timers = []; const later = (f, ms) => { timers.push(setTimeout(f, ms)); };
  const fx = (id) => { if (ctx.audio) ctx.audio.fx([id]); };
  let round = null, helped = false, box = null, tool = null, home = null, last = {}, noise = 0;

  function menu() {
    main.dataset.phase = 'menu'; ctx.question = null;
    stage.replaceChildren(h('div', { class: 'pc-menu' },
      h('button', { type: 'button', class: 'pc-big', 'data-kind': 'bath', 'aria-label': 'Bath', onclick: () => start('bath') }, pic('tub', 'pc-icon'), pic('hose', 'pc-icon')),
      h('button', { type: 'button', class: 'pc-big', 'data-kind': 'heal', 'aria-label': 'Heal', onclick: () => start('heal') }, pic('bottle', 'pc-icon'), pic('bandage', 'pc-icon'))));
  }
  function start(kind) {
    const pet = pickPet(data.pets, ctx.state, session.last); session.last = pet;
    round = makeRound(kind, level, cd.at, pet); helped = false; last = {};
    const name = petLabel(data, pet);
    main.dataset.phase = 'play'; main.dataset.kind = kind; main.dataset.pet = pet;
    const face = kind === 'heal' ? [h('div', { class: 'pc-brows', 'aria-hidden': 'true' }, drawing(['g', {}, ...brows(drawChar(pet))]))] : [];
    main.dataset.face = kind === 'heal' ? 'sad' : '';
    box = h('div', { class: 'pc-box' }, h('div', { class: 'pc-pet' }, drawing(drawChar(pet), { label: name })), ...face,
      ...round.spots.map((s) => at(h('button', { type: 'button', class: `pc-spot ${kind === 'bath' ? 'mud' : 'bump'}`, 'data-spot': String(s.i), 'aria-label': kind === 'bath' ? 'Mud' : 'Bump',
        onclick: () => hit(s.i) }, pic(kind === 'bath' ? 'mud' : 'bump', 'pc-mark', s.i % 2)), s)));
    tool = h('button', { type: 'button', class: 'pc-tool', 'data-tool': kind === 'bath' ? 'hose' : 'bottle', 'aria-label': kind === 'bath' ? 'Hose' : 'Healer bottle' }, pic(kind === 'bath' ? 'hose' : 'bottle', 'pc-tool-art'));
    drag(tool);
    stage.replaceChildren(box, h('div', { class: 'pc-dock' }, tool));
    ctx.question = { care: true, showAnswer: () => { helped = true; box.querySelectorAll('.pc-spot').forEach((b) => b.classList.add('glow')); }, skip: () => { helped = true; done(); },
      dadText: kind === 'bath' ? `Bath time: spray the mud off ${name}.` : `Heal: spray ${name}'s bumps, then a bandage.` };
    petSpeak(ctx, { id: pet, text: cd.lines[kind], clips: ['fx-giggle'] });
  }
  // one spray on spot i: it fades, then goes; a healed spot gets a bandage; all gone: the cheer
  function hit(i) {
    if (main.dataset.phase !== 'play') return;
    const r = spray(round, i); if (!r) return;
    const s = round.spots[i]; const b = box.querySelector(`[data-spot="${i}"]`);
    b.style.opacity = String(fade(round, s)); b.dataset.left = String(r.left);
    const d = at(pic('drops', 'pc-drops'), s); box.append(d); later(() => d.remove(), 500);
    if (Date.now() - noise > 350) { noise = Date.now(); fx(cd.fx[round.kind]); }
    if (r.gone) {
      b.classList.add('gone'); b.disabled = true;
      if (round.kind === 'heal') bandage(s); else { const w = at(pic('shine', 'pc-shine'), s); box.append(w); later(() => w.remove(), 900); }
    }
    if (r.done) done();
  }
  // the hose (or bottle) follows the finger; held over a spot it sprays it every SPRAY_MS
  function drag(t) {
    let id = null, sx = 0, sy = 0;
    const move = (e) => {
      if (e.pointerId !== id) return;
      t.style.transform = `translate(${e.clientX - sx}px,${e.clientY - sy}px)`;
      const tr = t.getBoundingClientRect(), br = box.getBoundingClientRect();
      const i = hitSpot(round, tr.left + tr.width / 2 - br.left, tr.top + 10 - br.top, br.width, br.height);
      if (i >= 0 && !(Date.now() - (last[i] || 0) < SPRAY_MS)) { last[i] = Date.now(); hit(i); }
    };
    const up = (e) => { if (e.pointerId !== id) return; id = null; t.classList.remove('held'); t.style.transform = ''; };
    t.addEventListener('pointerdown', (e) => { if (id !== null || main.dataset.phase !== 'play') return; e.preventDefault(); id = e.pointerId; sx = e.clientX; sy = e.clientY; t.classList.add('held'); try { t.setPointerCapture(id); } catch {} move(e); });
    t.addEventListener('pointermove', move); t.addEventListener('pointerup', up); t.addEventListener('pointercancel', up);
  }
  function bandage(s) { const p = at(pic('bandage', 'pc-bandage'), s); p.dataset.bandage = String(s.i); box.append(p); }
  function done() {
    if (main.dataset.phase !== 'play') return;
    main.dataset.phase = 'clean'; ctx.question = null;
    box.querySelectorAll('.pc-spot').forEach((b) => { b.classList.add('gone'); b.disabled = true; });
    if (round.kind === 'heal') round.spots.forEach((s) => { if (!box.querySelector(`[data-bandage="${s.i}"]`)) bandage(s); });
    main.dataset.face = round.kind === 'heal' ? 'smile' : ''; box.querySelectorAll('.pc-brows').forEach((b) => b.remove());
    box.classList.add('cheer'); box.append(pic('stars', 'pc-stars')); fx('fx-confetti');
    const lines = cd.lines[`${round.kind}Done`];
    const line = lines[session.n++ % lines.length];
    later(() => { if (alive()) petSpeak(ctx, { id: round.pet, slot: `hi-${round.pet}`, text: line, clips: [cd.cheer[session.n % 3]], pitch: 1.3 }); }, 400);
    later(() => { if (alive()) end(); }, CHEER_MS);
  }
  function end() {
    main.dataset.phase = 'end';
    const p = levelAfter(profile.levels.care, helped, max);
    const keys = keysForLevel(game.ladder, p.lv, p.top);
    profile.levels.care = { lv: p.lv, top: p.top, good: 0, at: keys.at, topAt: keys.topAt };
    const stickers = pickStickers(profile.book, getBook(), p.leveledUp ? 2 : 1);
    for (const s of stickers) if (!s.owned && !profile.book.includes(s.id)) profile.book.push(s.id);
    ctx.session.newStickers = stickers.filter((s) => !s.owned).map((s) => s.id);
    ctx.save();
    main.replaceWith(roundEnd(ctx, { act: game, got: stickers, leveledUp: p.leveledUp, playAgain: () => ctx.refresh() }));
  }

  main.careHit = (i) => hit(i); // for the tests
  main.careRound = () => round;
  queueMicrotask(menu);
  return main;
}
