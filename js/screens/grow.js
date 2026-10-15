// Grow It! (game idea 2026-10-01 §2; a lazily loaded pack like Hide): a growing set comes up jumbled over empty frames;
// "What comes first?" (then next, last). A right card slides into its frame; a wrong one wiggles back and, after two,
// the right one glows. When the frames are full the set plays as a tiny cartoon. 3 sets a round, then the surprise box.
import { h, drawing } from '../dom.js';
import { drawChar } from '../pets.js';
import { topBar, paws, fillPaw, genericLabel } from '../ui.js';
import { progress, pickStickers } from '../engine.js';
import { roundEnd } from '../reward.js';
import { getBook, activeProfile } from '../store.js';
import { gameById, ladderMax, stepAt, keysForLevel } from '../games.js';
import { GROW_ART, buildRound, isRight, CARE_TAPS, CARE, careFor, fitCare } from '../grow.js';
import { art } from '../art.js';
import { petLabel } from '../petname.js';

export const GROW_CACHE = 'gg-pack-grow-7447d8765e';
export const GROW_PACK = ['./js/screens/grow.js', './js/grow.js', './data/grow.json', './data/grow-clips.json', './css/grow.css'];
export async function ready(ctx) {
  const get = async (f) => { const r = await fetch(`./data/${f}`); if (!r.ok) throw new Error(f); return r.json(); };
  const [grow, clips] = await Promise.all([get('grow.json'), get('grow-clips.json')]);
  await new Promise((ok) => { const k = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: './css/grow.css' }); k.onload = k.onerror = ok; document.head.append(k); });
  ctx.data.grow = grow;
  if (ctx.audio) ctx.audio.more(clips);
  if (globalThis.caches) {
    caches.open(GROW_CACHE).then(async (c) => {
      if (!(await c.match(GROW_PACK[0]))) await c.addAll([...GROW_PACK, ...Object.keys(clips).map((k) => `./audio/${k}.mp3`)]);
      for (const k of await caches.keys()) if (k.startsWith('gg-pack-grow-') && k !== GROW_CACHE) await caches.delete(k); // an older pack
    }).catch(() => {});
  }
  return { render };
}

export const SLIDE_MS = 450; // a right card slides into its frame
export const GROW_MS = 700; // each frame of the cartoon
const cheer = ['c-yay1', 'c-yay2', 'c-great'];

export function render(ctx) {
  const data = ctx.data; const grow = data.grow;
  const game = ctx.game || gameById(data.games, 'grow');
  const profile = activeProfile(ctx.state);
  const max = ladderMax(game);
  const level = (stepAt(game, (profile.levels.grow && profile.levels.grow.lv) || 1) || { lv: 1 }).lv;
  const session = (ctx.session.grow = ctx.session.grow || { last: null, rocky: 0 });
  const round = buildRound(grow, level, { last: session.last });
  session.last = round[0].id;
  const cares = careFor(round);
  const label = (q, id) => { for (const s of [grow.sets.find((x) => x.id === q.id), ...grow.sets]) { const i = s.steps.indexOf(id); if (i >= 0) return s.labels[i]; } return ''; };
  const pic = (id, q) => drawing(GROW_ART[id](), { box: '0 0 100 100', label: label(q, id) });

  const frames = h('div', { class: 'gr-frames' });
  const cards = h('div', { class: 'gr-cards' });
  const host = h('div', { class: 'pet gr-host', 'data-pet': 'friendBerry' }, drawing(drawChar('friendBerry'), { label: genericLabel(data, 'friendBerry') }));
  const pawsEl = paws(0, round.length);
  const main = h('main', { class: 'kid grow theme-grow', 'data-game': 'grow', 'data-level': String(level), 'data-phase': 'start' },
    topBar(ctx, { progress: pawsEl }), h('div', { class: 'gr-stage' }, host, cards, frames));
  const alive = () => main.isConnected !== false;
  let at = -1, ask = 0, tries = 0, gen = 0, timers = [];
  const got = { firstTries: 0, helped: 0 };
  let helpedQ = false;
  const later = (f, ms) => { timers.push(setTimeout(f, ms)); };
  const play = (seq) => (ctx.audio ? ctx.audio.play(seq) : Promise.resolve(true));
  const setPhase = (p) => { main.dataset.phase = p; };

  function startSet(i) {
    gen++; at = i; ask = 0; tries = 0; helpedQ = false;
    const q = round[i];
    main.dataset.set = q.id; main.dataset.n = String(q.steps.length); frames.dataset.n = String(q.steps.length);
    // Design §23: an ink arrow between the frames (left to right) and a number dot on each empty frame
    frames.replaceChildren(...q.steps.flatMap((id, k) => [...(k ? [h('span', { class: 'gr-arrow', 'aria-hidden': 'true' })] : []),
      h('div', { class: `gr-frame${q.given.includes(k) ? ' in' : ''}`, 'data-k': String(k) }, h('span', { class: 'gr-num', 'aria-hidden': 'true', text: String(k + 1) }), q.given.includes(k) ? pic(id, q) : null)]));
    cards.replaceChildren(...q.cards.map((id) => h('button', { type: 'button', class: 'gr-card', 'data-card': id, 'aria-label': label(q, id), onclick: (e) => tap(e.currentTarget) }, pic(id, q))));
    ctx.question = { grow: true, showAnswer: () => hint(true), skip: () => skip(), dadText: `Put them in order: ${q.steps.map((id) => label(q, id)).join(', ')}.` };
    call();
  }
  function call() {
    setPhase('call');
    const q = round[at]; const k = q.ask[ask];
    frames.querySelectorAll('.gr-frame').forEach((f) => f.classList.toggle('now', Number(f.dataset.k) === k));
    play([grow.clips[q.words[ask]]]);
  }
  function hint(help) {
    const q = round[at]; if (!q || main.dataset.phase === 'grow') return;
    if (help) helpedQ = true;
    const want = q.steps[q.ask[ask]];
    cards.querySelectorAll('.gr-card').forEach((b) => b.classList.toggle('glow', b.dataset.card === want));
  }
  function tap(b) {
    const q = round[at];
    if (!b.isConnected || !['call', 'wait'].includes(main.dataset.phase)) return;
    if (!isRight(q, ask, b.dataset.card)) {
      tries++;
      b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
      if (tries >= 2) hint(false);
      play(['t-again1', grow.clips[q.words[ask]]]);
      return;
    }
    const f = frames.querySelector(`.gr-frame[data-k="${q.ask[ask]}"]`);
    b.remove();
    f.classList.remove('now'); f.append(pic(b.dataset.card, q)); f.classList.add('in');
    if (ctx.audio) ctx.audio.fx(['fx-pop']);
    ask++; setPhase('wait');
    if (ask < q.ask.length) { const my = gen; later(() => { if (my === gen) call(); }, SLIDE_MS); } else cartoon();
  }
  function cartoon() {
    const my = gen; const q = round[at];
    setPhase('grow');
    if (!tries && !helpedQ) got.firstTries++;
    if (helpedQ) got.helped++;
    play([grow.clips.watch]);
    q.steps.forEach((_, k) => later(() => { if (my === gen) frames.querySelector(`.gr-frame[data-k="${k}"]`).classList.add('pop'); }, GROW_MS * (k + 1)));
    later(() => {
      if (my !== gen || !alive()) return;
      fillPaw(pawsEl, at + 1); play([cheer[at % 3]]);
      later(() => { if (my === gen) care(); }, GROW_MS * 2);
    }, GROW_MS * (q.steps.length + 1));
  }
  // care time (game idea §2): what grew stays up; she taps the can (or the corn) 3 times, each counted; it perks up and dances
  function care() {
    const my = ++gen; const q = round[at]; let n = 0;
    cares[at] = fitCare(cares[at], q); const c = cares[at] && CARE[cares[at]];
    if (!c) { next(); return; } // the weather set has no care time
    setPhase('care'); main.dataset.careGame = cares[at];
    const big = h(c.tool ? 'div' : 'button', { class: 'gr-big', ...(c.tool ? {} : { type: 'button', 'aria-label': 'belly rub', onclick: () => tapCare() }) },
      c.pet ? drawing(drawChar(c.pet), { label: genericLabel(data, c.pet) }) : pic(c.who || q.steps[q.steps.length - 1], q));
    const got = h('div', { class: 'gr-got', 'aria-hidden': 'true' });
    frames.replaceChildren(big, got);
    function tapCare() {
      if (my !== gen || n >= CARE_TAPS) return;
      n++; main.dataset.care = String(n);
      big.classList.remove('perk', 'roll'); void big.offsetWidth; big.classList.add(c.tool ? 'perk' : 'roll');
      if (cares[at] === 'eggs') got.append(drawing(GROW_ART.grEgg(), { box: '0 0 100 100' }));
      const t = cards.firstChild; if (cares[at] === 'ball' && t) { t.classList.remove('throw'); void t.offsetWidth; t.classList.add('throw'); } // fetched back
      play([`n-${n}`, c.fx]);
      if (n === CARE_TAPS) { big.classList.add('dance'); later(() => { if (my === gen) next(); }, GROW_MS * 3); }
    }
    cards.replaceChildren(...(c.tool ? [h('button', { type: 'button', class: 'gr-card gr-tool', 'data-tool': c.tool, 'aria-label': c.tool.replace(/^gr/, '').toLowerCase(), onclick: tapCare },
      drawing(c.a ? art(c.tool) : GROW_ART[c.tool](), { box: '0 0 100 100' }))] : []));
    ctx.question = { grow: true, skip: () => { if (my === gen) next(); }, dadText: `Care time (${cares[at]}${c && c.pet ? ` with ${petLabel(data, c.pet)}` : ''}): tap 3 times. Nothing to get wrong.` };
  }
  function next() { gen++; delete main.dataset.care; delete main.dataset.careGame; at + 1 < round.length ? startSet(at + 1) : endRound(); }
  function skip() { helpedQ = true; const q = round[at]; ask = q.ask.length; frames.querySelectorAll('.gr-frame').forEach((f, k) => { if (!f.classList.contains('in')) { f.append(pic(q.steps[k], q)); f.classList.add('in'); } }); cards.replaceChildren(); cartoon(); }
  function endRound() {
    setPhase('end'); gen++; timers.forEach(clearTimeout); ctx.question = null;
    const prog = profile.levels.grow || { lv: 1, top: 1, good: 0 };
    const p = progress({ ...prog, rocky: session.rocky }, got.firstTries, got.helped, max);
    session.rocky = p.rocky;
    const keys = keysForLevel(game.ladder, p.lv, p.top);
    profile.levels.grow = { lv: p.lv, top: p.top, good: p.good, at: keys.at, topAt: keys.topAt };
    const stickers = pickStickers(profile.book, getBook(), p.leveledUp ? 2 : 1);
    for (const s of stickers) if (!s.owned && !profile.book.includes(s.id)) profile.book.push(s.id);
    ctx.session.newStickers = stickers.filter((s) => !s.owned).map((s) => s.id);
    ctx.save();
    if (!alive()) return;
    const end = roundEnd(ctx, { act: game, got: stickers, leveledUp: p.leveledUp, playAgain: () => ctx.refresh() });
    // Design §23: Berry in the middle with arms up, what grew in a row under her; the shared end keeps confetti and the book
    const b = drawChar('friendBerry');
    const arm = (d) => ['g', {}, ...[['#4A3426', 11], ['#F9C2A0', 5]].map(([c, w]) => ['path', { d, fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round' }])];
    b[2][2][6] = arm('M50 66q-14-6-16-26'); b[2][2].push(arm('M70 62q14-6 16-26')); b[2].splice(4, 1);
    end.insertBefore(h('div', { class: 'gr-end' }, h('div', { class: 'pet gr-cheer', 'data-pet': 'friendBerry' }, drawing(b, { label: genericLabel(data, 'friendBerry') })),
      h('div', { class: 'gr-row' }, ...['grBerry', 'grHen', 'grTulip'].map((id) => drawing(GROW_ART[id](), { box: '0 0 100 100' })))), end.querySelector('.end-stage'));
    main.replaceWith(end);
  }

  main.growRound = round; main.growCares = cares; // for the tests
  main.growLeave = () => { gen++; timers.forEach(clearTimeout); };
  queueMicrotask(() => startSet(0));
  return main;
}
