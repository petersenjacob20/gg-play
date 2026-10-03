// The shared quiz screen (plan f3, design.md 9.10): every quiz activity (acts/*.js) plays here.
// Top bar (Home 64 px, 5 paws, Dad), a scene (the host plus the activity's scene, speaker 80 px) and
// 3 choice cards in the bottom half. It plays the prompt, draws the scene and the choices, handles
// taps (fade + head tilt on a wrong tap, glow after 2 misses), one silly reaction per right tap, the
// odd surprise, then the round end: the level step, the box and saving. Route: #play/<act>.
import { h, drawing } from '../dom.js';
import { art, itemArt } from '../art.js';
import { ROUND, host, countHost, treatFor, rowsOf5, activePets, pickNot, pickReaction, surpriseRoll, progress, pickStickers } from '../engine.js';
import { petView, paws, fillPaw, topBar, icon, setPose } from '../ui.js';
import { runQuestion, cue } from '../quiz.js';
import { ACTS } from '../acts/index.js';
import { hasPhoto } from '../photos.js';
import { react, surprise, reactionClip, surpriseClips, reducedMotion } from '../fun.js';
import { roundEnd } from '../reward.js';
import { getBook } from '../store.js';

// Which #play/<id> values exist: the quiz activities (Story Time has its own #stories route).
export const known = (id) => Object.hasOwn(ACTS, id);

function dots(n) {
  if (!n) return null;
  return h('span', { class: 'dots', 'aria-hidden': 'true' },
    rowsOf5(n).map((k) => h('span', { class: 'dot-row' }, Array.from({ length: k }, () => h('span', { class: 'dot' })))));
}

function card(c) {
  const f = c.face;
  if (f.type === 'pic') {
    return h('button', { type: 'button', class: 'choice pic-card', 'data-item': f.id, 'data-key': c.key, 'aria-label': f.name },
      drawing(itemArt(f.id), { box: '0 0 100 100' }));
  }
  if (f.type === 'number') {
    return h('button', { type: 'button', class: 'choice number-card', 'data-n': String(f.n), 'data-key': c.key, 'aria-label': String(f.n) },
      h('span', { class: 'nc-num', 'aria-hidden': 'true', text: String(f.n) }), dots(f.dots));
  }
  return h('button', { type: 'button', class: 'choice letter-card', 'data-id': c.key, 'data-key': c.key, 'aria-label': `letter ${f.lower}` },
    h('span', { class: 'lc-upper', 'aria-hidden': 'true', text: f.upper }),
    h('span', { class: 'lc-lower', 'aria-hidden': 'true', text: f.lower }));
}

// Pattern items in a car (Design fix, piece 4): each item fills about 85% of its car. CAR_BOX is the
// first, cropped view; once the train is on screen fitItem() frames each drawing on its own outline
// (its box through its own transform), so a tall bunch of grapes and a wide heart both reach 85% of the car's width.
export const CAR_BOX = '8 8 84 84';
export const ITEM_FILL = 0.85;
function fitItem(car) {
  const svg = car.querySelector('svg');
  const g = svg && svg.firstElementChild;
  if (!g || typeof g.getBBox !== 'function' || !car.offsetWidth) return;
  // the drawing's outline in viewBox units: its box, through its own transform (no CSS motion)
  const b = g.getBBox();
  if (!b.width) return;
  const t = g.transform && g.transform.baseVal && g.transform.baseVal.consolidate();
  const m = t ? t.matrix : { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
    .map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const w = Math.max(...xs) - x;
  const hh = Math.max(...ys) - y;
  const load = svg.parentNode;
  const side = Math.max(w, hh) * Math.min(load.clientWidth, load.clientHeight) / (ITEM_FILL * car.offsetWidth);
  if (!side || !Number.isFinite(side)) return;
  const r = (v) => Math.round(v * 10) / 10;
  svg.setAttribute('viewBox', `${r(x + w / 2 - side / 2)} ${r(y + hh / 2 - side / 2)} ${r(side)} ${r(side)}`);
}

// The right tile flies into the empty car (Web Animations; no style attributes). With reduced motion,
// or without element.animate, the item just appears in the car.
function flyInto(fromEl, toEl, tree, layer, done) {
  const a = fromEl.getBoundingClientRect();
  const b = toEl.getBoundingClientRect();
  const base = layer.getBoundingClientRect();
  if (reducedMotion() || !a.width || !b.width || typeof layer.animate !== 'function') { done(); return; }
  const f = h('span', { class: 'fly-item' }, drawing(tree, { box: '0 0 100 100' }));
  layer.append(f);
  const s = 0.8 * Math.min(b.width / a.width, b.height / a.height);
  const from = `translate(${a.left - base.left}px, ${a.top - base.top}px) scale(1)`;
  const to = `translate(${b.left - base.left + (b.width - a.width * s) / 2}px, ${b.top - base.top + (b.height - a.height * s) / 2}px) scale(${s})`;
  const anim = f.animate([{ transform: from, width: `${a.width}px`, height: `${a.height}px` }, { transform: to, width: `${a.width}px`, height: `${a.height}px` }],
    { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' });
  let over = false;
  const finish = () => { if (over) return; over = true; done(); f.remove(); };
  anim.onfinish = finish;
  setTimeout(finish, 800);
}

export function render(ctx) {
  const id = ctx.param;
  const act = ACTS[id];
  const data = ctx.data;
  const session = (ctx.session[act.id] = ctx.session[act.id] || { prev: null, rocky: 0, warm: 0, lastCheer: null, lastReaction: null, surprisedLastRound: false, lastSurprise: null });
  const pawsEl = paws(0);
  const stage = h('div', { class: { count: 'stage count-stage', add: 'stage count-stage add-stage', pattern: 'stage count-stage pattern-stage' }[act.id] || 'stage' });
  const cardsRow = h('div', { class: 'cards' });
  const layer = h('div', { class: 'fx-layer', 'aria-hidden': 'true' });
  const main = h('main', { class: `kid play ${act.id === 'letters' ? 'letters' : 'count'}${act.id === 'add' ? ' add' : ''}${act.id === 'pattern' ? ' pattern' : ''}`, 'data-act': act.id }, topBar(ctx, { progress: pawsEl }), stage, cardsRow, layer);
  const round = { done: 0, firstTries: 0, helped: false, surprised: false };
  const dogs = activePets(data, ctx.state).filter((p) => p.kind === 'dog');
  const dogId = dogs.length ? dogs[0].id : 'yellowDog';

  function endRound() {
    const prog = ctx.state.levels[act.id];
    const p = progress({ ...prog, rocky: session.rocky }, round.firstTries, round.helped, act.max);
    ctx.state.levels[act.id] = { lv: p.lv, top: p.top, good: p.good };
    session.rocky = p.rocky;
    if (p.leveledUp) session.warm = 2; // the next round opens with 2 questions from the level below
    session.surprisedLastRound = round.surprised;
    const got = pickStickers(ctx.state.book, getBook(), p.leveledUp ? 2 : 1);
    for (const g of got) if (!g.owned && !ctx.state.book.includes(g.id)) ctx.state.book.push(g.id);
    ctx.session.newStickers = got.filter((g) => !g.owned).map((g) => g.id);
    ctx.save();
    ctx.question = null;
    if (main.isConnected) main.replaceWith(roundEnd(ctx, { act, got, leveledUp: p.leveledUp, playAgain: () => ctx.refresh() }));
  }

  function next() {
    if (round.done > 0 && !main.isConnected) return;
    if (round.done >= ROUND) { endRound(); return; }
    const lv = ctx.state.levels[act.id].lv;
    const level = session.warm > 0 && lv > 1 ? lv - 1 : lv;
    if (session.warm > 0) session.warm--;
    const q = act.makeQuestion(data, level, session.prev, Math.random);
    session.prev = q;
    const who = q.host === 'count' ? countHost(data, ctx.state) : host(data, ctx.state);
    const pet = petView(data, who.id);
    const speaker = h('button', { type: 'button', class: 'speaker', 'aria-label': 'Hear it again' }, icon('speaker'));
    let treat = null;
    let sign = null;
    let joinGroups = null;
    let trainGo = null;
    // A tappable picture that counts up out loud across the whole scene (Counting and Adding).
    let counted = 0;
    const countable = (pic) => {
      const badge = h('span', { class: 'count-badge', 'aria-hidden': 'true' });
      const t = h('button', { type: 'button', class: 'treat', 'aria-label': pic }, drawing(art(pic), { box: '0 0 100 100' }), badge);
      t.addEventListener('click', () => {
        if (t.classList.contains('counted')) return; // already counted: nothing happens
        counted++;
        t.classList.add('counted');
        badge.textContent = String(counted);
        if (who.countHost) { pet.classList.remove('twirl'); void pet.offsetWidth; pet.classList.add('twirl'); }
        if (ctx.audio) ctx.audio.play([q.countClip(counted)]);
      });
      return t;
    };
    const rowsOf = (n, pic) => rowsOf5(n).map((k) => h('div', { class: 'treat-row' }, Array.from({ length: k }, () => countable(pic))));
    if (q.scene.type === 'treats') {
      treat = treatFor(who, data.treats);
      const n = q.scene.n;
      const blanket = h('div', { class: `blanket size-${n <= 4 ? 'big' : 'rows'}` }, rowsOf(n, treat));
      stage.replaceChildren(h('div', { class: 'host small' }, pet, speaker), blanket);
    } else if (q.scene.type === 'groups') {
      // Adding (design.md 9.10): two groups of the same fruit or veg, a soft dashed divider between
      // them; on a right tap the divider melts away and the groups slide together.
      const { item, a, b, rows } = q.scene;
      const blanket = h('div', { class: `blanket add-blanket ${rows ? 'stacked' : 'side'}`, 'data-a': String(a), 'data-b': String(b), 'data-item': item },
        h('div', { class: 'add-group' }, rowsOf(a, item)),
        h('span', { class: 'add-divider', 'aria-hidden': 'true' }),
        h('div', { class: 'add-group' }, rowsOf(b, item)));
      joinGroups = () => blanket.classList.add('joined');
      stage.replaceChildren(h('div', { class: 'host small' }, pet, speaker), blanket);
    } else if (q.scene.type === 'train') {
      // Patterns (design.md 9.10, Design fix): the engine leads on the left, the cars trail to the right
      // and the last car (far right) is empty, a dashed outline that pulses gently. Every new train rolls
      // in from the right. Items are drawn cropped (CAR_BOX) so each fills about 85% of its car.
      const box = '0 0 100 100';
      const empty = h('span', { class: 'car empty' }, h('span', { class: 'car-load' }));
      const train = h('div', { class: 'train roll-in', 'data-cars': String(q.scene.cars), 'data-unit': q.scene.unit, 'data-set': q.scene.set, 'aria-hidden': 'true' },
        h('span', { class: 'engine' }, drawing(art('trainEngine'), { box })),
        q.scene.row.map((id) => h('span', { class: 'car', 'data-item': id }, h('span', { class: 'car-load' }, drawing(itemArt(id), { box: CAR_BOX })))),
        empty);
      trainGo = () => {
        const fill = () => { empty.classList.add('filled'); empty.firstChild.replaceChildren(drawing(itemArt(q.answer), { box: CAR_BOX })); fitItem(empty); setTimeout(() => fitItem(empty), 120); };
        flyInto(rightCard, empty, itemArt(q.answer), layer, fill);
        setTimeout(() => { if (train.isConnected) train.classList.add('roll-off'); }, reducedMotion() ? 300 : 650);
      };
      stage.replaceChildren(h('div', { class: 'host small' }, pet, speaker), h('div', { class: 'track' }, train));
      // the first train is drawn before the screen is mounted: frame the items once it is on screen
      let tries = 0;
      const fitAll = () => {
        if (!train.isConnected) { if (++tries < 60 && typeof requestAnimationFrame === 'function') requestAnimationFrame(fitAll); return; }
        const fit = () => train.querySelectorAll('.car:not(.empty)').forEach(fitItem);
        fit();
        setTimeout(() => { if (train.isConnected) fit(); }, 120); // once the pet drawings' styles have settled
        // and again whenever the cars change size (fonts, rotation, the first layout settling)
        if (typeof ResizeObserver === 'function') {
          const ro = new ResizeObserver(() => { if (!train.isConnected) ro.disconnect(); else fit(); });
          ro.observe(train.querySelector('.car'));
        }
      };
      fitAll();
    } else {
      sign = h('div', { class: 'sign', 'aria-hidden': 'true' }, drawing(art(q.scene.pic, { dogId }), { box: '0 0 100 100' }));
      stage.replaceChildren(h('div', { class: 'host' }, pet, sign), speaker);
    }
    const say = () => {
      const seq = [...q.prompt];
      if (ctx.intro) { seq.unshift(ctx.intro, { pause: 300 }); ctx.intro = null; }
      const ms = ctx.audio ? ctx.audio.estimateMs(seq) : 2500;
      cue(speaker, ms);
      if (sign) cue(sign, ms, 'wiggle');
      if (ctx.audio) ctx.audio.play(seq);
    };
    speaker.addEventListener('click', say);

    const cards = q.choices.map(card);
    const rightCard = cards[q.choices.findIndex((c) => c.key === q.answer)];
    rightCard.dataset.right = '1';
    cardsRow.replaceChildren(...cards);

    let rightLine = q.right(pickNot(data.clips.cheer, session.lastCheer));
    const qq = runQuestion(ctx, {
      cards, rightCard, pet,
      rightSeq: () => rightLine,
      againSeq: (m) => q.again(m),
      onRight: () => {
        round.done++;
        fillPaw(pawsEl, round.done);
        if (joinGroups) joinGroups();
        if (trainGo) trainGo();
        // one silly reaction (never the same twice in a row), and now and then a surprise
        const kind = pickReaction(session.lastReaction, who, hasPhoto(who.id));
        session.lastReaction = kind;
        const cheer = pickNot(data.clips.cheer, session.lastCheer);
        session.lastCheer = cheer;
        const sp = surpriseRoll({ thisRound: round.surprised, lastRound: session.surprisedLastRound, talking: false, reducedMotion: reducedMotion(), lastKind: session.lastSurprise });
        let tail = [reactionClip(kind, data.clips) || cheer];
        if (sp) { round.surprised = true; session.lastSurprise = sp; tail = surpriseClips(sp, data.clips, cheer); }
        rightLine = [...q.lead, ...tail];
        const leadMs = ctx.audio ? ctx.audio.estimateMs(q.lead) : 700;
        react({ kind, pet, card: rightCard, layer, delay: (kind === 'boing' || kind === 'twirl') && !sp ? leadMs : 0 });
        // the pop rides on top of the voice line (scheduled just after the right line starts, so it is not cut)
        if (kind === 'starpop' && ctx.audio) setTimeout(() => ctx.audio.fx([data.clips.pop]), 30);
        if (sp) surprise({ kind: sp, layer, data, state: ctx.state, hostEl: pet, delay: Math.min(leadMs, 600) });
      },
      onDone: ({ firstTry, skipped, helped }) => {
        if (!main.isConnected) return;
        if (skipped) { round.done++; fillPaw(pawsEl, round.done); }
        if (helped) round.helped = true;
        if (firstTry) round.firstTries++;
        act.record(ctx.state, q);
        ctx.save(); // written at the end of each question
        next();
      },
    });
    ctx.question = {
      showAnswer: () => { round.helped = true; qq.showAnswer(); },
      skip: () => { round.helped = true; qq.skip(); },
      dadText: q.dadText({ treat }),
    };
    setPose(pet, 'idle');
    say();
  }

  next();
  return main;
}
