// Hide and Seek Puppy (Amendment 2026-10-05r; #game/hide or #hide). Puppy counts (Dad's 30, 20, 10 or Skip)
// while a friend tiptoes off, then 4 questions by level and "Find ALL my friends!". Right: pop, giggle, spin;
// wrong: the spot peeks open empty and the call replays. L4: tap the friend, then the spot. About 1 round in 5
// (never the first) has the silly moment. progress(): 4 of 5 first-tap rights.
// No typed name is ever spoken here (Amendment r5); the drawings carry the default labels.
import { h, drawing } from '../dom.js';
import { drawChar } from '../pets.js';
import { art, ART } from '../art.js';
import { HIDE_ART } from '../art-hide.js';
import { DAD } from '../dad.js';
import { ICONS } from '../pics.js';
import { topBar, paws, fillPaw, genericLabel } from '../ui.js';
import { progress, pickStickers } from '../engine.js';
import { roundEnd } from '../reward.js';
import { react } from '../fun.js';
import { getBook, activeProfile } from '../store.js';
import { gameById, ladderMax, stepAt, keysForLevel } from '../games.js';
import { countLabel, nextHideCount, buildRound, questionSeq, peekSeq, ringSeq, countClips, wagsAt, dadLine, realIdea, sceneById, spotOf, wordById, hiderById, colorById } from '../hide.js';
import { hidePlay } from '../petname.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
Object.assign(ART, HIDE_ART);
// Dad sheet (r4): the note, the count (30, 20, 10, Skip) and the real-play idea, behind the lock.
DAD.hide = ({ ctx, h: el, sheetBtn, withUnlock, open, on }) => {
  const q = ctx.question;
  if (!on) return [sheetBtn('Hide and Seek settings', () => withUnlock(ctx, () => open(ctx, 'menu')), '', { 'data-dad': 'hide-settings' })];
  return [el('p', { class: 'sheet-hint', 'data-dad': 'hide-note', text: ctx.data.hide.note }),
    sheetBtn(`Count to: ${countLabel(ctx.state.hideCount)}`, () => withUnlock(ctx, () => {
      ctx.state.hideCount = nextHideCount(ctx.state.hideCount); ctx.save(); open(ctx, 'menu');
    }), '', { 'data-dad': 'hide-count' }),
    el('p', { class: 'sheet-hint', text: '30, 20, 10 or Skip. Starts with the next round.' }),
    ...(q.real ? [el('p', { class: 'sheet-hint', 'data-dad': 'hide-real', text: `Play it for real: ${q.real}` })] : [])];
};

// The Hide pack (EM ruling b): loaded on first open; ready() fetches data, clips and styles and caches them
// under a content hash (tests/packhash.mjs), so app updates keep it while the pack is unchanged.
export const HIDE_CACHE = 'gg-pack-hide-f68021e625';
export const HIDE_PACK = ['./js/screens/hide.js', './js/hide.js', './js/art-hide.js', './data/hide.json', './data/hide-clips.json', './css/hide.css'];
export async function ready(ctx) {
  const get = async (f) => { const r = await fetch(`./data/${f}`); if (!r.ok) throw new Error(f); return r.json(); };
  const [hide, clips] = await Promise.all([get('hide.json'), get('hide-clips.json')]);
  await new Promise((ok) => { const k = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: './css/hide.css' }); k.onload = k.onerror = ok; document.head.append(k); });
  ctx.data.hide = hide;
  if (ctx.audio) ctx.audio.more(clips);
  if (globalThis.caches) {
    caches.open(HIDE_CACHE).then(async (c) => {
      if (!(await c.match(HIDE_PACK[0]))) await c.addAll([...HIDE_PACK, ...Object.keys(clips).map((k) => `./audio/${k}.mp3`)]);
      for (const k of await caches.keys()) if (k.startsWith('gg-pack-hide-') && k !== HIDE_CACHE) await caches.delete(k); // an older pack
    }).catch(() => {});
  }
  return { render };
}

export const COUNT_MS = 650; // each number stays up at least this long (sound off too)
export const READY_MS = 1600; // "Ready or not..." plus a pause to shout along
export const RIGHT_MS = 1300; // the pop, the giggle and the spin before the next question
export const PEEK_MS = 600; // a wrong spot lifts about 20 px this long, showing it empty (design §17.2)
export const LEAVE_MS = 600; // a found friend pops out, then leaves its spot to join Puppy (never drawn twice)
export const SNUG_MS = 700; // L4: the friend snuggles in, then Puppy finds it
export const HUG_MS = 1600; // find-all: the group hug before the surprise box

export function render(ctx) {
  const data = ctx.data;
  const hide = data.hide;
  const game = ctx.game || gameById(data.games, 'hide');
  const profile = activeProfile(ctx.state);
  const max = ladderMax(game);
  const step = stepAt(game, (profile.levels.hide && profile.levels.hide.lv) || 1);
  const level = step ? step.lv : 1;
  const session = (ctx.session.hide = ctx.session.hide || { rounds: 0, lastScene: null, rocky: 0 });
  session.rounds++;
  const round = buildRound(hide, { level, state: ctx.state, lastScene: session.lastScene, roundNo: session.rounds });
  session.lastScene = round.scene;
  const scene = sceneById(hide, round.scene);
  const puppy = (data.pets || []).find((p) => p.id === 'puppy') || { label: 'Puppy' };

  const charView = (id, cls = '', t = drawChar(id)) => h('div', { class: `pet hider-char ${cls}`.trim(), 'data-pet': id }, drawing(t, { label: genericLabel(data, id) }));
  const pupEl = h('div', { class: 'pet hide-pup', 'data-pet': 'puppy' }, h('span', { class: 'char' }, drawing(drawChar('puppy'), { label: puppy.label })));
  const found = h('div', { class: 'hide-found', 'aria-hidden': 'true' });
  const pupRow = h('div', { class: 'hide-pup-row' }, pupEl, found);
  const spotsRow = h('div', { class: 'hide-spots' });
  const tray = h('div', { class: 'hide-tray' });
  const layer = h('div', { class: 'fx-layer', 'aria-hidden': 'true' });
  const stage = h('div', { class: `hide-stage scene-${scene.id}${scene.calm ? ' calm' : ''}` }, pupRow, spotsRow, tray, layer);
  const pawsEl = paws(0, round.questions.length);
  const main = h('main', { class: 'kid hide theme-hide', 'data-game': 'hide', 'data-level': String(level), 'data-scene': scene.id, 'data-phase': 'start' },
    topBar(ctx, { progress: pawsEl }), stage);
  const alive = () => main.isConnected !== false;

  let at = -1; // the current question
  let gen = 0; // bumps whenever something new starts, so a late step of an old one never acts
  let phase = 'start'; // count | call | wait | right | silly | hug | end
  let tries = 0; // wrong taps on this question
  let picked = false; // L4: the friend is chosen
  let helpedQ = false;
  const got = { firstTries: 0, helped: false };
  const foundAll = new Set();
  let timers = [];
  const later = (f, ms) => { timers.push(setTimeout(f, ms)); };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const setPhase = (p) => { phase = p; main.dataset.phase = p; };
  const play = (seq) => hidePlay(ctx, hide, seq);
  const flash = (el, cls, ms) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); later(() => el.classList.remove(cls), ms); };

  // ---- the count (r3.1): Puppy covers its eyes at the tree, the numbers pop, the tail wags at 10s
  const num = h('span', { class: 'count-num letter-font', 'aria-hidden': 'true' });
  const tiptoe = h('div', { class: 'tiptoe' }, charView(round.questions[0].hider || 'friendSilly'));
  const bubble = h('span', { class: 'ready-bubble', 'aria-hidden': 'true' }, drawing(art('hsBubble'), { box: '0 0 120 100' }));
  const counter = h('div', { class: 'pet count-pup', 'data-pet': 'puppy' }, h('span', { class: 'char' }, drawing(drawChar('puppy'), { label: puppy.label })),
    h('span', { class: 'eyes-paw', 'aria-hidden': 'true' }, drawing(ICONS.paw('#B0703C'), { box: '0 0 64 64' })));
  const countBox = h('div', { class: 'hide-count' },
    h('span', { class: 'count-tree' }, drawing(art('hsTree'), { box: '0 0 120 150' })), counter, num, tiptoe, bubble);

  async function runCount() {
    const my = ++gen;
    setPhase('count');
    stage.appendChild(countBox);
    ctx.question = { hide: true, skip: () => endCount(), dadText: `Puppy is counting to ${round.count}. Skip goes straight to the hiding spots.`, real: realIdea(hide, scene.id) };
    tiptoe.classList.add('go');
    if (ctx.intro) { await play([ctx.intro]); ctx.intro = null; if (my !== gen || !alive()) return; }
    const clips = countClips(hide, round.count);
    for (let k = 1; k <= clips.length; k++) {
      if (my !== gen || !alive()) return;
      num.textContent = String(k);
      flash(num, 'pop', 500);
      if (wagsAt(hide, k)) flash(counter, 'wag', 600);
      await Promise.all([play([clips[k - 1]]), wait(COUNT_MS)]);
    }
    if (my !== gen || !alive()) return;
    num.textContent = '';
    countBox.classList.add('ready');
    await Promise.all([play([hide.clips.ready]), wait(READY_MS)]);
    if (my !== gen || !alive()) return;
    endCount();
  }
  function endCount() {
    if (phase !== 'count') return;
    gen++;
    countBox.classList.add('done');
    stage.replaceChildren(pupRow, spotsRow, tray, layer);
    startQ(0);
  }

  // ---- the scene's spots for one question
  const spotEls = new Map();
  function spotButton(s) {
    const sp = spotOf(scene, s.id);
    const fill = s.color ? colorById(hide, s.color).fill : undefined;
    const hider = h('div', { class: 'hider', 'data-state': 'none' });
    const b = h('button', {
      type: 'button', class: 'hide-spot', 'data-spot': s.id, 'data-color': s.color || null, 'aria-label': `${s.color ? `${s.color} ` : ''}${sp.text}`,
      onclick: () => tapSpot(s.id),
    }, h('span', { class: 'spot-hollow', 'aria-hidden': 'true' }), h('span', { class: 'spot-art' }, drawing(art(sp.art, fill ? { fill } : undefined), { box: '0 0 120 100' })), hider);
    spotEls.set(s.id, { b, hider });
    return b;
  }
  // a friend in a spot's slot: state none | hidden | peek | snug | out | left (found: off to Puppy)
  function placeHider(spotId, hiderId, word, state, clue) {
    const { hider } = spotEls.get(spotId);
    hider.replaceChildren(charView(hiderId));
    hider.dataset.hider = hiderId;
    hider.dataset.pose = wordById(hide, word).pose;
    hider.dataset.clue = clue === 'peek' ? hiderById(hide, hiderId).clue : '';
    hider.dataset.state = state;
  }

  function startQ(i) {
    const my = ++gen;
    clearTimers();
    at = i; tries = 0; picked = false; helpedQ = false;
    const q = round.questions[i];
    setPhase('call');
    main.dataset.q = String(i + 1);
    main.dataset.kind = q.kind;
    spotEls.clear();
    spotsRow.replaceChildren(...q.spots.map((s) => spotButton(s)));
    spotsRow.dataset.n = String(q.spots.length);
    tray.replaceChildren();
    found.replaceChildren();
    pupRow.classList.remove('hug');
    if (q.kind === 'find') {
      placeHider(q.answer, q.hider, q.word, q.clue === 'peek' ? 'peek' : 'hidden', q.clue);
      if (q.clue === 'wiggle') spotEls.get(q.answer).b.classList.add('wiggle');
    } else if (q.kind === 'put') {
      tray.appendChild(h('button', { type: 'button', class: 'hider-pick', 'data-hider': q.hider, 'aria-label': genericLabel(data, q.hider), onclick: () => pick() }, charView(q.hider)));
    } else {
      foundAll.clear();
      for (const x of q.hidden) placeHider(x.spot, x.hider, x.word, x.clue === 'peek' ? 'peek' : 'hidden', x.clue);
    }
    ctx.question = { hide: true, showAnswer: () => showAnswer(), skip: () => skip(), dadText: dadLine(hide, data, q), real: realIdea(hide, scene.id) };
    const seq = questionSeq(hide, q);
    if (i === 0 && ctx.intro) { seq.unshift(ctx.intro, { pause: 300 }); ctx.intro = null; }
    callAgain(seq, my);
  }
  function callAgain(seq, my) {
    play(seq).then(() => { if (my === gen && phase === 'call') setPhase('wait'); });
  }
  const tappable = () => phase === 'call' || phase === 'wait';

  // L4: the friend is picked up (hops in the tray) and waits for the spot
  function pick() {
    if (!tappable() || round.questions[at].kind !== 'put') return;
    picked = true;
    const p = tray.children[0];
    if (p) p.classList.add('picked');
  }

  function tapSpot(id) {
    if (!tappable()) return;
    const q = round.questions[at];
    if (q.kind === 'findAll') {
      if (foundAll.has(id)) return;
      const x = q.hidden.find((y) => y.spot === id);
      if (x) foundOne(x, q); else wrong(id, q);
      return;
    }
    if (q.kind === 'put' && !picked) {
      // a spot before the friend: the friend in the tray wiggles and the call plays again (not a miss)
      const p = tray.children[0];
      if (p) flash(p, 'nudge', 700);
      const my = ++gen; setPhase('call'); callAgain(questionSeq(hide, q), my);
      return;
    }
    if (id === q.answer) right(q); else wrong(id, q);
  }

  // A wrong spot peeks open to show it is empty, and the call plays again. Nothing else.
  function wrong(id, q) {
    tries++;
    const my = ++gen;
    flash(spotEls.get(id).b, 'peek-open', PEEK_MS);
    if (q.kind === 'put') {
      picked = false;
      const p = tray.children[0];
      if (p) p.classList.remove('picked');
    }
    setPhase('call');
    callAgain(peekSeq(hide, q), my);
  }

  function spin() { react({ kind: 'spin', pet: pupEl, layer }); }

  async function right(q) {
    const my = ++gen;
    setPhase('right');
    clearTimers();
    if (tries === 0 && !helpedQ) got.firstTries++;
    fillPaw(pawsEl, at + 1);
    spotEls.forEach(({ b }) => b.classList.remove('wiggle', 'glow'));
    if (q.kind === 'put') {
      tray.replaceChildren();
      placeHider(q.answer, q.hider, q.word, 'snug', null);
      await wait(SNUG_MS);
      if (my !== gen || !alive()) return;
    }
    spotEls.get(q.answer).hider.dataset.state = 'out';
    spin();
    // the pop, then the friend leaves its spot and runs over to Puppy: never drawn twice (design §17.2)
    later(() => { if (my === gen) leave(q.answer, q.hider); }, LEAVE_MS);
    await Promise.all([play(ringSeq(hide)), wait(RIGHT_MS)]);
    if (my !== gen || !alive()) return;
    next();
  }

  // a found friend leaves its spot (a quick hop and fade) and joins Puppy's row
  function leave(spotId, hiderId) {
    const { hider } = spotEls.get(spotId);
    hider.dataset.state = 'left';
    found.appendChild(charView(hiderId, 'joined'));
    later(() => { if (hider.dataset.state === 'left') hider.dataset.state = 'none'; }, 350);
  }

  // find-all: each friend she finds leaves its spot and joins Puppy; all 3, then the group hug
  async function foundOne(x, q) {
    foundAll.add(x.spot);
    leave(x.spot, x.hider);
    spin();
    if (foundAll.size < q.hidden.length) {
      if (ctx.audio) ctx.audio.fx([data.clips.pop || 'fx-pop']);
      return;
    }
    const my = ++gen;
    setPhase('hug');
    if (tries === 0 && !helpedQ) got.firstTries++;
    fillPaw(pawsEl, at + 1);
    pupRow.classList.add('hug');
    await Promise.all([play(ringSeq(hide)), wait(HUG_MS)]);
    if (my !== gen || !alive()) return;
    endRound();
  }

  function next() {
    if (round.silly && at + 1 === round.silly.after && phase !== 'silly') { silly(); return; }
    if (at + 1 >= round.questions.length) endRound();
    else startQ(at + 1);
  }

  // Silly moment (r3.5): the bunny head first in a box half its size. Puppy looks
  // the other way for about a second, then finds it. Nothing to tap; Dad's Skip goes straight on.
  async function silly() {
    const my = ++gen;
    setPhase('silly');
    const who = round.silly.hider;
    const t = drawChar(who);
    if (who === 'bunny') t[2].push(['circle', { cx: 60, cy: 113, r: 7, fill: '#fff', stroke: '#4A3426', 'stroke-width': 2 }], ...[37, 83].map((x) => ['ellipse', { cx: x, cy: 60, rx: 4, ry: 14, fill: '#F4B6C2', transform: `rotate(${(60 - x) / 1.6} ${x} 58)` }]));
    const box = h('div', { class: 'hide-silly', 'data-hider': who },
      h('span', { class: 'silly-who' }, charView(who, '', t)),
      h('span', { class: 'silly-box' }, drawing(art('hsTinyBox'), { box: '0 0 120 100' })));
    spotsRow.replaceChildren(box);
    tray.replaceChildren();
    found.replaceChildren();
    ctx.question = { hide: true, skip: () => { if (phase === 'silly') { gen++; startQ(at + 1); } }, dadText: 'The silly one: hiding in a box much too small.', real: realIdea(hide, scene.id) };
    pupEl.classList.add('pretend');
    await wait((hide.silly && hide.silly.pretendMs) || 1000);
    if (my !== gen || !alive()) return;
    pupEl.classList.remove('pretend');
    box.classList.add('found');
    spin();
    if (ctx.audio) ctx.audio.fx([data.clips.giggle || 'fx-giggle']);
    await Promise.all([play(ringSeq(hide)), wait(RIGHT_MS)]);
    if (my !== gen || !alive()) return;
    startQ(at + 1);
  }

  // Dad's Show answer: the right spot (or the next friend in find-all) glows; the round counts as helped.
  function showAnswer() {
    if (!tappable()) return;
    got.helped = true; helpedQ = true;
    const q = round.questions[at];
    if (q.kind === 'findAll') {
      const x = q.hidden.find((y) => !foundAll.has(y.spot));
      if (x) spotEls.get(x.spot).b.classList.add('glow');
    } else {
      spotEls.get(q.answer).b.classList.add('glow');
      if (q.kind === 'put' && !picked && tray.children[0]) tray.children[0].classList.add('glow');
    }
  }
  // Dad's Skip: on to the next question (helped, no first-tap credit).
  function skip() {
    if (phase === 'count') { endCount(); return; }
    if (!tappable()) return;
    got.helped = true;
    gen++;
    fillPaw(pawsEl, at + 1);
    next();
  }

  function endRound() {
    setPhase('end');
    gen++;
    clearTimers();
    ctx.question = null;
    const prog = profile.levels.hide || { lv: 1, top: 1, good: 0 };
    const p = progress({ ...prog, rocky: session.rocky }, got.firstTries, got.helped, max);
    session.rocky = p.rocky;
    const keys = keysForLevel(game.ladder, p.lv, p.top);
    profile.levels.hide = { lv: p.lv, top: p.top, good: p.good, at: keys.at, topAt: keys.topAt };
    const stickers = pickStickers(profile.book, getBook(), p.leveledUp ? 2 : 1);
    for (const g of stickers) if (!g.owned && !profile.book.includes(g.id)) profile.book.push(g.id);
    ctx.session.newStickers = stickers.filter((g) => !g.owned).map((g) => g.id);
    ctx.save();
    if (alive()) main.replaceWith(roundEnd(ctx, { act: game, got: stickers, leveledUp: p.leveledUp, playAgain: () => ctx.refresh() }));
  }

  main.hideRound = round; // for the tests
  queueMicrotask(() => { if (round.count > 0) runCount(); else startQ(0); });
  return main;
}
