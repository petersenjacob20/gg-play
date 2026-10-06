// Playground pick + play (design.md §13.4–13.5, Amendment n; Amendment q: the Big Playground).
// Wordless for her. The park is bigger than the screen: her thumb on empty ground pans the camera
// (a JS-set transform, clamped, a light ease on release; no pinch, no fling, no scroll bars); a press
// on the character drags it (pointer capture) and the camera follows near the edge; dropping it on a
// piece plays that piece's trick; tapping a piece walks there and plays it. Positions are set from JS
// (element.style), never with style= in h(). Every trick is under 1 s and always works.
import { h, drawing } from '../dom.js';
import { art, ART } from '../art.js';
import { petView, icon } from '../ui.js';
import { playHello, characterById } from '../character.js';
import { playTrick, trickClip, confetti, reducedMotion } from '../fun.js';
import { activeProfile } from '../store.js';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
import * as PG from '../playground.js';

const FX_MS = 900;      // every trick finishes inside a second
const WALK_MAX_MS = 900;

let live = null; // the running scene: its timers and animal loop stop when the screen goes away
export function leave() { if (live) live.stop(); live = null; }

const glyph = (id) => drawing(art(id) || art('star'), { box: '0 0 100 100' });
function homeBtn(ctx) {
  return h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Home', onclick: () => ctx.go('#home') }, icon('house'));
}
function backBtn(ctx) {
  return h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Back', onclick: () => ctx.go('#playground') }, icon('arrowLeft'));
}

// ---- pick screen ----
function pickScreen(ctx) {
  const cast = PG.playgroundCast(ctx.data, ctx.state);
  const tiles = cast.map((c) => h('button', {
    type: 'button',
    class: 'pg-pick-tile',
    'data-id': c.id,
    'aria-label': c.label || 'Friend',
    onclick: () => {
      const sess = (ctx.session.playground = ctx.session.playground || { hellos: {} });
      sess.hellos = sess.hellos || {};
      if (!sess.hellos[c.id]) { sess.hellos[c.id] = true; playHello(ctx, c); }
      ctx.go(`#playground/${c.id}`);
    },
  }, petView(ctx.data, c.id, 'idle')));
  return h('main', { class: 'playground pick' },
    h('div', { class: 'topbar' }, homeBtn(ctx)),
    h('div', { class: 'pg-pick-grid', role: 'list' }, tiles));
}

// timers that all stop together
function makeClock() {
  const ids = new Set();
  let raf = null;
  let stopped = false;
  const later = (ms, f) => {
    const id = setTimeout(() => { ids.delete(id); if (!stopped) f(); }, Math.max(0, ms));
    ids.add(id); return id;
  };
  const frame = (f) => {
    if (stopped) return;
    if (typeof globalThis.requestAnimationFrame === 'function') raf = globalThis.requestAnimationFrame((t) => { if (!stopped) f(t); });
    else later(50, () => f(Date.now()));
  };
  const stop = () => {
    stopped = true;
    ids.forEach((id) => clearTimeout(id)); ids.clear();
    if (raf != null && typeof globalThis.cancelAnimationFrame === 'function') globalThis.cancelAnimationFrame(raf);
  };
  return { later, frame, stop, get stopped() { return stopped; } };
}

const px = (n) => `${Math.round(n)}px`;
function placeBox(el, b) {
  el.style.left = px(b.x); el.style.top = px(b.y); el.style.width = px(b.w); el.style.height = px(b.h);
}

// ---- play screen ----
function playScreen(ctx, who, zone) {
  const data = ctx.data;
  const reduced = reducedMotion();
  const clock = makeClock();
  if (live) live.stop();
  live = clock;
  const prof = activeProfile(ctx.state);
  const world = PG.worldOf(zone);
  const pgData = PG.pg(data);
  const walkSpeed = Math.max(100, Number(pgData.walkSpeed) || 500);
  const layout = PG.layoutFor(prof, zone, data);
  const tricks = Array.isArray(who.tricks) && who.tricks.length ? who.tricks.slice(0, 4) : ['spin'];
  let trickCount = 0;
  let busy = false;      // a trick is playing: animals pause
  let gesture = null;    // the one pointer gesture in progress
  let walkToken = 0;
  let walking = false;   // on the way to a piece (or a short trot)
  let rideOn = false;    // riding a bike or scooter
  const riding = new Set();
  let snackCount = 0;
  let building = false;  // build mode (q6): the tray is out, pieces move, the character rests
  let picked = null;     // a tray tile tapped, waiting for a tap on the ground

  const fx = (clip) => {
    const seq = [].concat(clip || []).filter(Boolean);
    if (seq.length && ctx.audio) ctx.audio.fx(seq);
  };
  const flash = (el, cls, ms = FX_MS) => {
    if (!el) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    clock.later(ms, () => el.classList.remove(cls));
  };

  // the scene
  const view = h('div', { class: 'pg-scene pg-view', 'data-zone': zone.id });
  const worldEl = h('div', { class: 'pg-world' });
  worldEl.style.width = px(world.w); worldEl.style.height = px(world.h);
  if (zone.ground) worldEl.style.backgroundColor = zone.ground;
  const sky = h('div', { class: 'pg-sky', 'aria-hidden': 'true' });
  if (zone.sky) sky.style.backgroundColor = zone.sky;
  const piecesEl = h('div', { class: 'pg-pieces' });
  const animalsEl = h('div', { class: 'pg-animals' });
  const layer = h('div', { class: 'fx-layer pg-fx', 'aria-hidden': 'true' });
  view.appendChild(worldEl);
  const vsize = () => ({ w: view.clientWidth || 360, h: view.clientHeight || 520 });

  // camera
  let cam = { x: 0, y: 0 };
  const applyCam = (ease = false) => {
    worldEl.classList.toggle('pg-ease', !!ease && !reduced);
    worldEl.style.transform = `translate(${-Math.round(cam.x)}px, ${-Math.round(cam.y)}px)`;
  };
  const toWorld = (ev) => {
    const r = view.getBoundingClientRect();
    return { x: cam.x + (ev.clientX - r.left), y: cam.y + (ev.clientY - r.top) };
  };

  // the character
  const actor = petView(data, who.id, 'idle');
  actor.classList.add('pg-actor');
  const actorWrap = h('div', { class: 'pg-actor-wrap', 'data-who': who.id }, actor);
  let pos = PG.startSpot(layout, zone, data);
  const placeActor = (ms = 0) => {
    actorWrap.style.transitionDuration = `${reduced ? 0 : Math.round(ms)}ms`;
    actorWrap.style.left = px(pos.x); actorWrap.style.top = px(pos.y);
  };
  placeActor(0);

  const footstep = () => {
    if (reduced || Math.random() > 0.3) return;
    const spark = h('span', { class: 'pg-foot', 'aria-hidden': 'true' }, drawing(art('star'), { box: '0 0 100 100' }));
    spark.style.left = px(pos.x); spark.style.top = px(pos.y);
    layer.appendChild(spark);
    clock.later(500, () => spark.remove());
  };

  const walkTo = (pt, then, cls = 'walking') => {
    const to = PG.clampToWorld(pt, zone);
    const ms = reduced ? 0 : Math.min(WALK_MAX_MS, Math.max(180, (Math.hypot(to.x - pos.x, to.y - pos.y) / walkSpeed) * 1000));
    const token = ++walkToken;
    walking = true;
    pos = to;
    actorWrap.classList.add(cls);
    placeActor(ms);
    clock.later(ms, () => {
      actorWrap.classList.remove(cls);
      if (token !== walkToken) return;
      walking = false;
      if (then) then();
    });
  };

  // tricks: a class on the character for under a second (a fade with reduced motion)
  const runFx = (kind, clip) => {
    busy = true;
    flash(actor, PG.trickClass(kind, reduced));
    if ((kind === 'splash' || kind === 'swim') && !reduced) {
      // a splash sprays at once; a swimming dog paddles with its head up, then dries off with a spray of drops (q5)
      const at = kind === 'swim' ? 480 : 0;
      clock.later(at, () => {
        const drops = h('div', { class: `pg-drops${kind === 'swim' ? ' dry' : ''}`, 'aria-hidden': 'true' }, ...Array.from({ length: 8 }, (_, i) => h('span', { class: `drop d${i}` })));
        drops.style.left = px(pos.x); drops.style.top = px(pos.y);
        layer.appendChild(drops);
        clock.later(FX_MS - at, () => drops.remove());
      });
    }
    fx(clip);
    clock.later(FX_MS, () => { busy = false; });
  };
  // a ride (q11): on with a helmet (always drawn while riding), slowly round the loop, off where it started
  const startRide = (i) => {
    const e = layout[i]; const p = PG.pieceById(data, e[0]);
    if (rideOn || !PG.canRide(riding, i, data)) return;
    riding.add(i); rideOn = true; walkToken++; walking = false;
    const parked = pieceEls[i];
    if (parked) parked.classList.add('pg-away');
    const vehicle = h('span', { class: `pg-vehicle pv-${p.id}`, 'aria-hidden': 'true' }, drawing(art(p.art), { box: '0 0 200 100' }));
    const helmet = h('span', { class: 'pg-helmet', 'aria-hidden': 'true' }, drawing(art('pgHelmet'), { box: '0 0 100 100' }));
    const anc = PG.rideAnchors(data, who.id);
    vehicle.style.top = px(anc.vehicleTop);
    helmet.style.top = px(anc.helmetTop);
    helmet.style.width = px(anc.helmetSize); helmet.style.height = px(anc.helmetSize);
    if (anc.helmetX) helmet.style.marginLeft = px(anc.helmetX);
    actorWrap.prepend(vehicle); // behind the body: the seat is under it, the wheels below the feet
    actorWrap.append(helmet);
    actorWrap.classList.add('pg-riding', `pg-ride-${p.ride.anim || 'pedal'}`);
    fx(p.sound);
    const start = { ...pos };
    const finish = () => {
      vehicle.remove(); helmet.remove();
      actorWrap.classList.remove('pg-riding', `pg-ride-${p.ride.anim || 'pedal'}`, 'flip');
      if (parked) parked.classList.remove('pg-away');
      riding.delete(i); rideOn = false;
      pos = start; placeActor(0);
    };
    if (reduced) { flash(actor, 'pg-fade', 600); clock.later(600, finish); return; }
    const legs = PG.rideLegs(start, PG.ridePath(e, data, zone), PG.rideSpeed(p, data));
    const step = (k) => {
      if (k >= legs.length) { finish(); return; }
      const L = legs[k];
      pos = { x: L.x, y: L.y };
      actorWrap.classList.toggle('flip', L.dir < 0);
      placeActor(L.ms);
      cam = PG.followEdge(cam, pos, vsize(), world, 110); applyCam(true);
      clock.later(L.ms, () => step(k + 1));
    };
    step(0);
  };
  // the snack stand (q11): a treat from the allowlist and a happy wiggle; never a shop, nothing to count
  const giveSnack = (p) => {
    const list = PG.snackList(p);
    if (!list.length) return;
    const id = list[snackCount++ % list.length];
    const treat = h('span', { class: 'pg-treat', 'data-snack': id, 'aria-hidden': 'true' }, drawing(art(PG.snackArt(data, id)), { box: '0 0 100 100' }));
    actorWrap.appendChild(treat);
    clock.later(FX_MS, () => treat.remove());
    runFx('treat', PG.pieceSounds(p, who));
  };
  const playPiece = (i) => {
    const e = layout[i]; const p = e && PG.pieceById(data, e[0]);
    if (!p) return;
    if (PG.isRide(p)) startRide(i);
    else if (p.snacks) giveSnack(p);
    else runFx(PG.pieceTrick(p, who), PG.pieceSounds(p, who));
  };
  const tapPiece = (i) => {
    const e = layout[i];
    if (!e || rideOn) return;
    walkTo(PG.frontOf(e, data, zone), () => playPiece(i));
  };

  // pieces
  const pieceEls = [];
  const renderPieces = () => {
    piecesEl.replaceChildren(); pieceEls.length = 0;
    layout.forEach((e, i) => {
      const p = PG.pieceById(data, e[0]);
      const el = h('button', { type: 'button', class: `pg-piece pc-${p.id}`, 'data-piece': p.id, 'aria-label': p.id },
        drawing(art(p.art), { box: `0 0 ${p.w * 100} ${p.h * 100}` }));
      const b = PG.pieceBox(e, data);
      placeBox(el, b);
      el.style.zIndex = String(Math.round(b.y + b.h));
      el.addEventListener('pointerdown', (ev) => {
        if (gesture || (ev.button != null && ev.button !== 0)) return;
        if (building) {
          gesture = { kind: 'move', piece: i, x0: ev.clientX, y0: ev.clientY, cam0: { ...cam }, moved: false };
          try { el.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
          return;
        }
        gesture = { kind: 'press', piece: i, x0: ev.clientX, y0: ev.clientY, cam0: { ...cam }, moved: false };
      });
      el.addEventListener('click', (ev) => { if (ev.detail === 0 && !building) tapPiece(i); }); // keyboard only; taps are pointerup
      piecesEl.appendChild(el); pieceEls.push(el);
    });
  };
  renderPieces();

  // animals: wander loops, soft reactions, pause during tricks
  let animals = [];
  const makeAnimals = () => PG.zoneAnimals(zone, layout, data).map((a, k) => {
    const el = h('button', { type: 'button', class: `pg-animal an-${a.kind}`, 'data-animal': a.kind, 'aria-label': a.kind },
      h('span', { class: 'pg-animal-in' }, drawing(art(a.art), { box: '0 0 100 100' })));
    el.style.width = px(a.size); el.style.height = px(a.size);
    const st = { ...a, k, el, dist: (k * 137) % Math.max(1, PG.loopLength(a.pts)), x: a.pts[0].x, y: a.pts[0].y, dir: 1, reacting: false };
    el.addEventListener('pointerdown', (ev) => {
      if (gesture || (ev.button != null && ev.button !== 0)) return;
      gesture = { kind: 'pressAnimal', animal: k, x0: ev.clientX, y0: ev.clientY, cam0: { ...cam }, moved: false };
    });
    el.addEventListener('click', (ev) => { if (ev.detail === 0) reactAnimal(st); });
    animalsEl.appendChild(el);
    return st;
  });
  const placeAnimal = (a, ms = 0) => {
    a.el.style.transitionDuration = `${reduced ? 0 : Math.round(ms)}ms`;
    a.el.style.transform = `translate(${Math.round(a.x - a.size / 2)}px, ${Math.round(a.y - a.size / 2)}px)`;
    a.el.classList.toggle('flip', a.dir < 0);
  };
  const startAnimals = () => {
    animalsEl.replaceChildren();
    animals = makeAnimals();
    animals.forEach((a) => { const p = PG.alongLoop(a.pts, a.dist); a.x = p.x; a.y = p.y; a.dir = p.dir; placeAnimal(a); });
  };
  startAnimals();
  const pieceCentre = (id, near) => {
    let best = null;
    layout.forEach((e) => {
      if (e[0] !== id) return;
      const b = PG.pieceBox(e, data);
      const c = { x: b.x + b.w / 2, y: b.y + b.h * 0.25 };
      const d = Math.hypot(c.x - near.x, c.y - near.y);
      if (!best || d < best.d) best = { ...c, d };
    });
    return best;
  };
  function reactAnimal(a) {
    if (a.reacting) return;
    a.reacting = true;
    fx(a.sound);
    const home = { x: a.x, y: a.y };
    const visit = a.reaction === 'treePeek' ? pieceCentre('tree', a) : a.reaction === 'flutterFlower' ? pieceCentre('flowers', a) : null;
    const cls = reduced ? 'pg-fade' : { hopLoop: 'pg-r-loop', treePeek: 'pg-r-peek', quackPaddle: 'pg-r-paddle', flutterFlower: 'pg-r-flutter' }[a.reaction] || 'pg-r-loop';
    if (visit) { a.x = visit.x; a.y = visit.y; placeAnimal(a, 380); }
    flash(a.el, cls, FX_MS);
    clock.later(FX_MS, () => {
      if (visit) { a.x = home.x; a.y = home.y; placeAnimal(a, 380); }
      clock.later(visit ? 400 : 0, () => { a.reacting = false; });
    });
  }
  let last = null;
  const tick = (t) => {
    const dt = last == null ? 0 : Math.min(100, Math.max(0, t - last));
    last = t;
    const dragging = gesture && gesture.kind === 'drag';
    if (!busy && !dragging && !reduced && !building) {
      for (const a of animals) {
        if (a.reacting) continue;
        a.dist += (a.speed * dt) / 1000;
        const p = PG.alongLoop(a.pts, a.dist);
        a.x = p.x; a.y = p.y; a.dir = p.dir;
        placeAnimal(a);
      }
    }
    clock.frame(tick);
  };
  clock.frame(tick);

  // dogs trot after a bird or squirrel for a moment, then stop (no catching, no barking)
  if (who.kind === 'dog' && animals.length) {
    const chase = () => {
      if (!busy && !gesture && !walking && !rideOn && !building) {
        const n = PG.nearestOf(animals, pos, ['bird', 'squirrel']);
        if (n && n.d < 450) walkTo(PG.chaseStep(pos, animals[n.i]), null, 'pg-trot');
      }
      clock.later(8000 + Math.random() * 6000, chase);
    };
    clock.later(6000 + Math.random() * 4000, chase);
  }

  // one gesture at a time: character drag, press on a piece or animal (a tap unless it moves), or pan
  actorWrap.addEventListener('pointerdown', (ev) => {
    if (gesture || rideOn || building || (ev.button != null && ev.button !== 0)) return;
    gesture = { kind: 'drag', x0: ev.clientX, y0: ev.clientY, cam0: { ...cam }, moved: false };
    try { actorWrap.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
    actorWrap.classList.add('dragging');
    walkToken++; walking = false;
    if (ev.preventDefault) ev.preventDefault();
  });
  view.addEventListener('pointerdown', (ev) => {
    if (ev.button != null && ev.button !== 0) return;
    if (!gesture) gesture = { kind: 'pan', x0: ev.clientX, y0: ev.clientY, cam0: { ...cam }, moved: false };
    if (gesture.kind !== 'drag') { try { view.setPointerCapture(ev.pointerId); } catch { /* ignore */ } }
  });
  view.addEventListener('pointermove', (ev) => {
    const g = gesture;
    if (!g) return;
    const dx = ev.clientX - g.x0; const dy = ev.clientY - g.y0;
    if (!g.moved && Math.hypot(dx, dy) > PG.TAP_SLOP) g.moved = true;
    if ((g.kind === 'press' || g.kind === 'pressAnimal') && g.moved) g.kind = 'pan';
    if (g.kind === 'pan') {
      cam = PG.softClamp({ x: g.cam0.x - dx, y: g.cam0.y - dy }, vsize(), world);
      applyCam(false);
    } else if (g.kind === 'drag' && g.moved) {
      pos = PG.clampToWorld(toWorld(ev), zone);
      placeActor(0);
      cam = PG.followEdge(cam, pos, vsize(), world);
      applyCam(false);
      footstep();
    }
  });
  const end = (ev) => {
    const g = gesture;
    if (!g || g.kind === 'tray' || g.kind === 'move') return; // build gestures end at the screen root
    gesture = null;
    try { view.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
    const up = ev.type === 'pointerup';
    if (g.kind === 'pan') {
      cam = PG.clampCamera(cam, vsize(), world);
      applyCam(true);
      if (up && !g.moved && building && picked) placeAt(picked, toWorld(ev));
    } else if (g.kind === 'press') {
      if (up) tapPiece(g.piece);
    } else if (g.kind === 'pressAnimal') {
      if (up) reactAnimal(animals[g.animal]);
    } else if (g.kind === 'drag') {
      actorWrap.classList.remove('dragging');
      try { actorWrap.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      const i = PG.pieceAt(layout, data, pos.x, pos.y);
      if (g.moved && i >= 0) playPiece(i);
      cam = PG.clampCamera(cam, vsize(), world);
      applyCam(true);
    }
  };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);

  worldEl.append(sky, piecesEl, animalsEl, layer, actorWrap);

  // start centred on the character beside the slide (again once the view has its real size)
  cam = PG.centerOn(pos, vsize(), world); applyCam(false);
  clock.later(0, () => { cam = PG.centerOn(pos, vsize(), world); applyCam(false); });

  // her own trick buttons (Amendment n): always work, pause the animals for the trick
  const runTrick = (kind) => {
    if (!kind) return;
    trickCount++;
    busy = true;
    fx(trickClip(kind, data.clips));
    playTrick({ kind, pet: actor, layer, data, state: ctx.state });
    if (trickCount % 5 === 0) confetti(layer, 24);
    clock.later(FX_MS, () => { busy = false; });
  };
  // one row (design §15.2): each button its own glyph from the art library
  const glyphs = PG.trickGlyphs(tricks, (id) => typeof ART[id] === 'function');
  const btns = tricks.map((kind, i) => h('button', {
    type: 'button', class: 'pg-trick-btn', 'data-trick': kind, 'data-glyph': glyphs[i], 'aria-label': kind, onclick: () => runTrick(kind),
  }, glyph(glyphs[i])));

  // the frisbee (q4), dogs only: the disc flies in an arc over open ground, the dog runs and catches it
  // (the camera follows), then trots back. Under a second, always lands, never lost.
  const disc = PG.frisbeeColor(data, who);
  let throwing = false;
  const discArt = () => drawing(art('pgFrisbee', { fill: disc.fill }), { box: '0 0 100 100' });
  const throwFrisbee = () => {
    if (throwing || rideOn || building) return;
    throwing = true; busy = true; trickCount++;
    walkToken++; walking = false;
    const T = PG.frisbeeTiming(data);
    const from = { ...pos };
    const dir = from.x < world.w / 2 ? 1 : -1; // towards the roomier side
    const to = PG.frisbeeTarget(from, layout, zone, data, dir);
    const d = h('span', { class: 'pg-disc', 'data-disc': disc.name, 'aria-hidden': 'true' }, h('span', { class: 'pg-disc-in' }, discArt()));
    d.style.left = px(from.x); d.style.top = px(from.y - 70);
    layer.appendChild(d);
    fx('fx-zoom');
    if (reduced) {
      // no flight and no run: the disc shows where it lands, a soft fade, and it is back in her paws
      d.style.left = px(to.x); d.style.top = px(to.y - 20);
      flash(d, 'pg-fade', 600); flash(actor, 'pg-fade', 600);
      clock.later(600, () => { d.remove(); fx(who.sound); busy = false; throwing = false; });
      return;
    }
    void d.offsetWidth;
    d.style.transitionDuration = `${T.fly}ms`;
    d.classList.add('fly');
    d.style.left = px(to.x); d.style.top = px(to.y - 70);
    pos = to; actorWrap.classList.add('pg-run'); actorWrap.style.transitionTimingFunction = 'ease-in'; placeActor(T.fly); // the disc leads, the dog catches up
    cam = PG.followEdge(cam, to, vsize(), world, 110); applyCam(true);
    clock.later(T.fly, () => {
      // the catch: the disc is in the dog's mouth, a happy sound, and it trots back
      d.remove();
      actorWrap.classList.remove('pg-run'); actorWrap.style.transitionTimingFunction = '';
      const held = h('span', { class: 'pg-held', 'aria-hidden': 'true' }, discArt());
      actorWrap.appendChild(held);
      flash(actor, 'pg-t-catch', 300);
      fx(who.sound);
      pos = from; actorWrap.classList.add('pg-trot'); placeActor(T.back);
      cam = PG.followEdge(cam, from, vsize(), world, 110); applyCam(true);
      clock.later(T.back, () => {
        held.remove(); actorWrap.classList.remove('pg-trot');
        busy = false; throwing = false;
      });
    });
  };
  if (disc) {
    btns.push(h('button', { type: 'button', class: 'pg-trick-btn pg-frisbee-btn', 'data-trick': 'frisbee', 'data-glyph': 'pgFrisbee', 'aria-label': 'frisbee', onclick: throwFrisbee }, discArt()));
  }

  // zone gates (q10): only when 2 or more zones are ready, so none in this build
  const gates = PG.gatesFor(data);
  const gateStrip = gates.length ? h('div', { class: 'pg-gates', role: 'group', 'aria-label': 'Places' },
    gates.map((z) => h('button', {
      type: 'button', class: `pg-gate${z.id === zone.id ? ' on' : ''}`, 'data-gate': z.id, 'aria-label': z.id,
      onclick: () => ctx.go(`#playground/${who.id}/${z.id}`),
    }, drawing(art(z.gate), { box: '0 0 100 100' })))) : null;

  // ---- build mode (q6, q10): her own park, saved per profile and per zone ----
  const cap = Math.min(PG.PARK_CAP, Math.max(1, Number(pgData.cap) || PG.PARK_CAP));
  const cell = PG.cellOf(data);
  const catalog = (Array.isArray(zone.pieces) ? zone.pieces : []).map((id) => PG.pieceById(data, id)).filter((p) => p && p.id && zone.pieces.includes(p.id));
  const persist = () => {
    const parks = isObj(prof.parks) ? { ...prof.parks } : {};
    parks[zone.id] = layout.map((e) => [e[0], e[1], e[2]]);
    prof.parks = parks;
    if (ctx.save) ctx.save();
  };
  const tiles = catalog.map((p) => {
    const t = h('button', { type: 'button', class: 'pg-tray-tile', 'data-tray': p.id, 'aria-label': p.id },
      drawing(art(p.art), { box: `0 0 ${p.w * 100} ${p.h * 100}` }));
    t.addEventListener('pointerdown', (ev) => {
      if (gesture || (ev.button != null && ev.button !== 0) || layout.length >= cap) return;
      gesture = { kind: 'tray', id: p.id, el: t, x0: ev.clientX, y0: ev.clientY, moved: false };
      try { t.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
    });
    t.addEventListener('click', (ev) => { if (ev.detail === 0) pick(p.id); });
    return t;
  });
  const bin = h('button', { type: 'button', class: 'pg-bin', 'data-pg': 'bin', 'aria-label': 'Bin' }, drawing(art('pgBin'), { box: '0 0 100 100' }));
  const tray = h('div', { class: 'pg-tray', role: 'group', 'aria-label': 'Pieces' }, bin, h('div', { class: 'pg-tray-tiles' }, tiles));
  const ghost = h('div', { class: 'pg-ghost', 'aria-hidden': 'true' });
  const over = (el, ev) => {
    const r = el.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  };
  const snap = (id, pt) => {
    const p = PG.pieceById(data, id);
    return { gx: Math.round(pt.x / cell - p.w / 2), gy: Math.round(pt.y / cell - p.h / 2) };
  };
  const updateTray = () => {
    const full = layout.length >= cap;
    tray.classList.toggle('full', full);
    tiles.forEach((t) => {
      t.setAttribute('aria-disabled', full ? 'true' : 'false');
      t.classList.toggle('picked', !full && t.getAttribute('data-tray') === picked);
    });
  };
  // build mode: the character steps aside to open ground at the edge of the view, fully drawn (§15.1)
  let homeSpot = null;
  const buttonZone = () => { const v = vsize(); return [{ x: cam.x + v.w - 116, y: cam.y, w: 116, h: 116 }]; };
  const stepTo = (to) => {
    if (!to) return;
    if (reduced) { flash(actor, 'pg-fade', 600); pos = { x: to.x, y: to.y }; placeActor(0); return; }
    walkTo(to);
  };
  const stepAside = () => {
    stepTo(PG.edgeSpot(pos, cam, vsize(), layout, data, zone, buttonZone()) || PG.openSpotNear(pos, layout, data, zone));
  };
  const changed = () => {
    renderPieces(); updateTray(); persist();
    if (building && !PG.actorClear(pos, layout, data, zone)) stepAside(); // a piece landed on her spot
  };
  function pick(id) { picked = picked === id ? null : id; updateTray(); }
  // place a piece where she tapped or dropped it: snapped to the grid; on top of another piece it moves
  // to the nearest free cell; nothing at the cap
  function placeAt(id, pt) {
    if (layout.length >= cap) return false;
    const c = snap(id, pt);
    const spot = PG.nearestFree(layout, id, c.gx, c.gy, zone, data);
    if (!spot) return false;
    layout.push([id, spot.gx, spot.gy]);
    picked = null;
    fx('fx-pop');
    changed();
    return true;
  }
  function moveTo(i, pt) {
    const e = layout[i];
    const c = snap(e[0], pt);
    const spot = PG.nearestFree(layout, e[0], c.gx, c.gy, zone, data, i);
    if (spot) { layout[i] = [e[0], spot.gx, spot.gy]; fx('fx-pop'); }
    changed();
  }
  const root = h('main', { class: 'playground play', 'data-id': who.id, 'data-zone': zone.id });
  root.addEventListener('pointermove', (ev) => {
    const g = gesture;
    if (!g || (g.kind !== 'tray' && g.kind !== 'move')) return;
    if (!g.moved && Math.hypot(ev.clientX - g.x0, ev.clientY - g.y0) > PG.TAP_SLOP) g.moved = true;
    if (!g.moved) return;
    const pt = toWorld(ev);
    const id = g.kind === 'tray' ? g.id : layout[g.piece][0];
    const p = PG.pieceById(data, id);
    const b = { x: pt.x - (p.w * cell) / 2, y: pt.y - (p.h * cell) / 2, w: p.w * cell, h: p.h * cell };
    if (g.kind === 'tray') {
      if (!ghost.parent) layer.appendChild(ghost);
      ghost.classList.toggle('off', !over(view, ev));
      placeBox(ghost, b);
    } else {
      const el = pieceEls[g.piece];
      if (el) { placeBox(el, b); el.style.zIndex = '7500'; el.classList.toggle('to-bin', over(bin, ev)); }
    }
  });
  const buildEnd = (ev) => {
    const g = gesture;
    if (!g || (g.kind !== 'tray' && g.kind !== 'move')) return;
    gesture = null;
    ghost.remove();
    const up = ev.type === 'pointerup';
    if (g.kind === 'tray') {
      if (!g.moved) { if (up) pick(g.id); return; }
      if (up && over(view, ev) && !over(bin, ev)) placeAt(g.id, toWorld(ev));
      return;
    }
    if (!g.moved) return;
    if (up && over(bin, ev)) { layout.splice(g.piece, 1); fx('fx-pop'); changed(); return; }
    if (up && over(view, ev)) moveTo(g.piece, toWorld(ev));
    else changed();
  };
  root.addEventListener('pointerup', buildEnd);
  root.addEventListener('pointercancel', buildEnd);

  const buildBtn = h('button', { type: 'button', class: 'pg-build-btn', 'data-pg': 'build', 'aria-label': 'Build' }, drawing(art('pgBuild'), { box: '0 0 100 100' }));
  const doneBtn = h('button', { type: 'button', class: 'pg-done-btn', 'data-pg': 'done', 'aria-label': 'Done' }, drawing(art('pgDone'), { box: '0 0 100 100' }));
  for (const b of [buildBtn, doneBtn]) b.addEventListener('pointerdown', (ev) => { if (ev.stopPropagation) ev.stopPropagation(); });
  const enterBuild = () => {
    if (building || rideOn || throwing) return;
    building = true; picked = null; walkToken++; walking = false;
    root.classList.add('building');
    updateTray();
    homeSpot = { ...pos };
    stepAside();
  };
  const exitBuild = () => {
    if (!building) return;
    building = false; picked = null; gesture = null; ghost.remove();
    root.classList.remove('building');
    persist();
    startAnimals(); // anchored animals follow her pieces
    // back to where it was (or the nearest open ground, if she built on that spot)
    const back = homeSpot ? (PG.pieceAt(layout, data, homeSpot.x, homeSpot.y) < 0 ? homeSpot : PG.openSpotNear(homeSpot, layout, data, zone) || homeSpot) : null;
    homeSpot = null;
    stepTo(back);
  };
  buildBtn.addEventListener('click', enterBuild);
  doneBtn.addEventListener('click', exitBuild);
  view.append(buildBtn, doneBtn);
  updateTray();

  root.append(
    h('div', { class: 'topbar' }, backBtn(ctx), h('span', { class: 'grow' }), homeBtn(ctx)),
    view,
    ...(gateStrip ? [gateStrip] : []),
    h('div', { class: `pg-tricks n${btns.length}`, role: 'group', 'aria-label': 'Tricks' }, btns),
    tray);
  return root;
}

export function render(ctx) {
  leave();
  // main.js already sent a bad or switched-off id back to #playground (resolvePlayground); this check
  // is the screen's own allowlist, so a stray id still only ever shows the pick grid.
  const id = ctx.param;
  const who = id && PG.playgroundAllow(ctx.data, ctx.state, id) ? characterById(ctx.data, id) : null;
  const zone = PG.zoneById(ctx.data, ctx.zone) || PG.zoneById(ctx.data, 'park');
  if (!who || !zone) return pickScreen(ctx);
  const sess = (ctx.session.playground = ctx.session.playground || { hellos: {} });
  sess.hellos = sess.hellos || {};
  if (!sess.hellos[id]) {
    sess.hellos[id] = true;
    playHello(ctx, who);
  }
  return playScreen(ctx, who, zone);
}
