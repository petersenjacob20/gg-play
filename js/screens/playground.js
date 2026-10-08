// Playground pick + play (design.md §13.4–13.5, Amendment n; Amendment q: the Big Playground).
// Wordless for her. The park is bigger than the screen: her thumb on empty ground pans the camera
// (a JS-set transform, clamped, a light ease on release; no pinch, no fling, no scroll bars); a press
// on the character drags it (pointer capture) and the camera follows near the edge; dropping it on a
// piece, or tapping it, uses it (y). Moved by transform.
import { h, drawing } from '../dom.js';
import { art, ART } from '../art.js';
import { petView, icon } from '../ui.js';
import { playHello, characterById } from '../character.js';
import { playTrick, trickClip, confetti, reducedMotion } from '../fun.js';
import { activeProfile } from '../store.js';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
import * as PG from '../playground.js';

const FX_MS = 900;
const HOP_MS = 400; // the hop off a ride, before the prop comes back and the offer appears
const OFFER_MS = 1400; // how long a treat offer stays beside her
const CAR_LIFT = 31;    // px a rider sits up in a ride car: the feet in the seat, the wheels on the track      // every trick finishes inside a second
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
// the elements with a class among a node's children and grandchildren (the frame loop looks only this deep)
const byClassIn = (root, cls, depth = 2) => {
  const out = [];
  const walk = (n, d) => { for (const c of n.children || []) { if (c.classList && c.classList.contains(cls)) out.push(c); if (d > 1) walk(c, d - 1); } };
  if (root) walk(root, depth);
  return out;
};
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
  if (zone.ground) { worldEl.style.backgroundColor = zone.ground; view.style.backgroundColor = zone.ground; }
  const sky = h('div', { class: 'pg-sky', 'aria-hidden': 'true' });
  if (zone.sky) sky.style.backgroundColor = zone.sky;
  const piecesEl = h('div', { class: 'pg-pieces' });
  const animalsEl = h('div', { class: 'pg-animals' });
  const layer = h('div', { class: 'fx-layer pg-fx', 'aria-hidden': 'true' });
  view.appendChild(worldEl);
  const vsize = () => ({ w: view.clientWidth || 360, h: view.clientHeight || 520 });

  // camera
  let cam = { x: 0, y: 0 };
  let onCam = () => {};
  const applyCam = (ease = false) => {
    worldEl.classList.toggle('pg-ease', !!ease && !reduced);
    worldEl.style.transform = `translate(${-Math.round(cam.x)}px, ${-Math.round(cam.y)}px)`;
    onCam();
  };
  const toWorld = (ev) => {
    const r = view.getBoundingClientRect();
    return { x: cam.x + (ev.clientX - r.left - (view.clientLeft || 0)), y: cam.y + (ev.clientY - r.top - (view.clientTop || 0)) };
  };

  // the character
  const actor = petView(data, who.id, 'idle');
  actor.classList.add('pg-actor');
  const actorWrap = h('div', { class: 'pg-actor-wrap', 'data-who': who.id, 'data-kind': who.kind || '' }, actor);
  let pos = PG.startSpot(layout, zone, data);
  let lift = 0; // in a ride car the rider sits up in the seat while the wheels stay on the track
  // Where she is DRAWN right now (Architect x2, 3:13 AM): a walk is one CSS transition from one placeActor
  // call, so mid-walk her drawn spot is between where she was and `pos` (the destination). In a browser the
  // live computed left/top says exactly; otherwise the same ease curve is worked out from the start time.
  let placedAt = { x: Math.round(pos.x), y: Math.round(pos.y) }; // the last destination (her feet)
  let glide = null; // the move in progress: { from, to, t0, ms, ease }
  const drawnPos = () => {
    if (!glide) return { x: placedAt.x, y: placedAt.y };
    const k = (Date.now() - glide.t0) / glide.ms;
    if (!(k < 1)) { glide = null; return { x: placedAt.x, y: placedAt.y }; }
    if (typeof globalThis.getComputedStyle === 'function' && actorWrap.isConnected) {
      const cs = globalThis.getComputedStyle(actorWrap);
      const [x, y] = String(cs.translate).split(' ').map(parseFloat);
      if (Number.isFinite(x) && Number.isFinite(y)) return { x, y: y + lift };
    }
    const e = PG.easeAt(glide.ease, Math.max(0, k));
    return { x: glide.from.x + (glide.to.x - glide.from.x) * e, y: glide.from.y + (glide.to.y - glide.from.y) * e };
  };
  const placeActor = (ms = 0) => {
    const from = drawnPos();
    placedAt = { x: Math.round(pos.x), y: Math.round(pos.y - lift) + lift }; // what the style draws (whole px)
    const dur = reduced ? 0 : Math.round(ms);
    glide = dur > 0 && (from.x !== pos.x || from.y !== pos.y)
      ? { from, to: placedAt, t0: Date.now(), ms: dur, ease: actorWrap.style.transitionTimingFunction || 'ease-in-out' } : null;
    actorWrap.style.transitionDuration = `${dur}ms`;
    actorWrap.style.translate = `${px(pos.x)} ${px(pos.y - lift)}`;
    onPlace();
  };
  let onPlace = () => {}; // the water park: floaties, the lifeguard's look, the slide's tube row
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
      // Design fix 3: arriving at a piece, her whole drawing is in view (16 px margin); the camera moves only if needed
      if (!rideOn && !building && !gesture && !PG.actorInView(cam, pos, vsize())) { cam = PG.fitInView(cam, pos, vsize(), world); applyCam(true); }
      if (then) then();
    });
  };

  // tricks: a class on the character for under a second (a fade with reduced motion)
  const dropsAt = (cls, ms) => {
    const d = h('div', { class: `pg-drops${cls}`, 'aria-hidden': 'true' }, ...Array.from({ length: 8 }, (_, i) => h('span', { class: `drop d${i}` })));
    d.style.left = px(pos.x); d.style.top = px(pos.y); layer.appendChild(d); clock.later(ms, () => d.remove());
  };
  const runFx = (kind, clip, low = false) => {
    busy = true;
    flash(actor, PG.trickClass(kind, reduced));
    if ((kind === 'splash' || kind === 'swim') && !reduced) {
      // a splash sprays at once; a swimming dog paddles with its head up, then dries off with a spray of drops (q5)
      const at = kind === 'swim' ? 480 : 0;
      clock.later(at, () => {
        dropsAt(`${kind === 'swim' ? ' dry' : ''}${low ? ' low' : ''}`, FX_MS - at);
      });
    }
    fx(clip);
    clock.later(FX_MS, () => { busy = false; });
  };
  // ride gear (q11, design §16.5): a helmet on every coaster-zone ride and bike; floaties in the water
  const helmetEl = (id = who.id) => {
    const helmet = h('span', { class: 'pg-helmet', 'aria-hidden': 'true' }, drawing(art('pgHelmet'), { box: '0 0 100 100' }));
    const anc = PG.rideAnchors(data, id);
    helmet.style.top = px(anc.helmetTop);
    helmet.style.width = px(anc.helmetSize); helmet.style.height = px(anc.helmetSize);
    if (anc.helmetX) helmet.style.marginLeft = px(anc.helmetX);
    if (anc.fit.over) {
      // that part of her drawing again, on top of the helmet (friendCounter's antennae show above it)
      const pet = petView(data, id, 'happy');
      if (pet.getAttribute('data-photo') !== '1') { // a photo sticker has no antennae to draw
        const over = h('span', { class: 'pg-over', 'data-over': anc.fit.over, 'aria-hidden': 'true' }, pet);
        over.style.left = px(-(80 - anc.helmetSize / 2 + anc.helmetX)); over.style.top = px(-anc.helmetTop);
        helmet.append(over);
      }
    }
    return helmet;
  };
  const FLOATY_ART = { vest: ['pgVest', 60], armbands: ['pgArmbands', 40], ring: ['pgWaistRing', 44] };
  const floatyEl = (c = who, k = 1) => { // k: the drawing's size over 160 px (a hop-off or an offer's giver is smaller)
    const f = PG.floatyFit(data, c);
    const [id, hgt] = FLOATY_ART[f.kind];
    const el = h('span', { class: `pg-floaty fl-${f.kind}`, 'data-floaty': f.kind, 'aria-hidden': 'true' }, drawing(art(id), { box: `0 0 160 ${hgt}` }));
    el.style.top = px(f.top * k); el.style.width = px(f.w * k); el.style.height = px(Math.round((f.w * k * hgt) / 160));
    el.style.left = px((80 - f.w / 2 + f.x) * k);
    return el;
  };
  const carEl = (p) => {
    const front = !!p.ride.front;
    if (!front && !p.ride.car && !p.ride.carFor) {
      // a bike or scooter (design §15.4): the vehicle hangs from the feet line, behind the body
      const vehicle = h('span', { class: `pg-vehicle pv-${p.id}`, 'aria-hidden': 'true' }, drawing(art(p.art), { box: '0 0 200 100' }));
      const sr = PG.smallRide(p, data, who, isPhoto());
      if (sr) Object.assign(vehicle.style, { top: px(sr.top), width: px(sr.w), height: px(sr.h) });
      else vehicle.style.top = px(PG.rideAnchors(data, who.id).vehicleTop);
      return vehicle;
    }
    const el = h('span', { class: `pg-car pv-${p.id}${front ? ' front' : ''}`, 'data-car': PG.rideCar(p, who.id), 'aria-hidden': 'true' },
      h('span', { class: 'pg-car-in' }, drawing(art(PG.rideCar(p, who.id)), { box: '0 0 200 100' })));
    const fit = PG.rideFit(data, who.id);
    el.style.top = px(fit.feet - (front ? 80 : 74));
    return el;
  };
  let rideFloat = false;
  const smile = (on) => { actor.classList.toggle('pose-happy', on); actor.classList.toggle('pose-idle', !on); };
  const sparkleAt = (pt, cls = '') => {
    const sp = h('span', { class: `pg-sparkle ${cls}`, 'aria-hidden': 'true' }, drawing(art('pgSparkles'), { box: '0 0 100 100' }));
    sp.style.left = px(pt.x); sp.style.top = px(pt.y);
    layer.appendChild(sp);
    clock.later(FX_MS, () => sp.remove());
  };
  const react = (trick, at = 0) => {
    if (!trick) return;
    clock.later(at, () => {
      if (trick === 'pomPoms') {
        // friendSea waves pom-poms at the finish
        const poms = ['l', 'r'].map((sd) => h('span', { class: `pg-pom ${sd}`, 'aria-hidden': 'true' }, drawing(art('pgPomPom'), { box: '0 0 100 100' })));
        actorWrap.append(...poms);
        flash(actor, PG.trickClass('boing', reduced)); fx('fx-chime');
        if (!reduced) confetti(layer, 18);
        clock.later(FX_MS, () => poms.forEach((x) => x.remove()));
        return;
      }
      fx(trickClip(trick, data.clips));
      playTrick({ kind: trick, pet: actor, layer, data, state: ctx.state });
    });
  };
  const counter = (n) => [].concat(...Array.from({ length: n }, (_, k) => [`n-${k + 1}`, { pause: 200 }]));
  // the 2-seat rides (x1, EM fix A): tapping or dropping her on the dragon coaster or the teapots seats her.
  // Seat 2 stays empty until she boards someone herself: the row of characters replaces the trick row, she
  // taps one and then the glowing empty seat (or drags it onto the seat), like the build tray. It never
  // fills by itself. The big green Go paw shows with 1 or 2 riders while the station is in view.
  let seated = null; // { i, p, car, helmet, seat2: null | { id, el }, hot }
  let rootEl = null;
  let pickedRider = null;
  const goPaw = h('button', { type: 'button', class: 'pg-go', 'data-pg': 'go', 'aria-label': 'Go', hidden: true }, drawing(art('pgGoPaw'), { box: '0 0 100 100' }));
  goPaw.addEventListener('pointerdown', (ev) => { if (ev.stopPropagation) ev.stopPropagation(); });
  const stationInView = () => {
    if (!seated) return false;
    const v = vsize();
    return pos.x >= cam.x && pos.x <= cam.x + v.w && pos.y - 60 >= cam.y && pos.y - 60 <= cam.y + v.h;
  };
  const updateGo = () => {
    const on = !!seated && !rideOn && !building && stationInView();
    goPaw.hidden = !on; goPaw.classList.toggle('on', on);
    if (rootEl) rootEl.classList.toggle('pg-go-on', on); // Design fix 1: no gates while the Go paw shows
  };
  onCam = updateGo;
  goPaw.addEventListener('click', () => { if (seated && !rideOn) startRide(seated.i, true); });
  // held props and offers (Design fix 2) go away when anyone boards a ride and come back at hop-off:
  // a happy pose's frisbee (CSS, while .pg-prop-away is on), a caught disc, a snack treat, a trick prop
  // and a treat offer (put away here, given back for a moment after the hop-off; an offer comes back
  // beside her). A part of a character's own drawing is not a prop and stays on (§16.10: friendBerry's
  // strawberry, friendDino's spade, friendSea's pom-poms).
  let heldAway = [];
  // the hop-off and a live offer beside her hold her still: no ambient behaviour (a dog's bird chase)
  // until both are over (the Architect's ride rule, build_plan 2026-10-06 12:58 AM)
  let stillUntil = 0;
  const holdStill = (ms) => { stillUntil = Math.max(stillUntil, Date.now() + ms); };
  const AWAY = [[() => actorWrap, ['pg-held', 'pg-treat']], [() => actor, ['trick-prop']], [() => layer, ['pg-offer']]];
  const propAway = () => {
    actorWrap.classList.add('pg-prop-away');
    for (const [parent, cls] of AWAY) {
      for (const el of [...(parent().children || [])]) {
        if (el.classList && cls.some((c) => el.classList.contains(c))) { heldAway.push({ el, parent }); el.remove(); }
      }
    }
  };
  const propBack = () => {
    actorWrap.classList.remove('pg-prop-away');
    const back = heldAway; heldAway = [];
    for (const { el, parent } of back) {
      const offer = el.classList.contains('pg-offer');
      if (offer) {
        const at = PG.offerSpot(pos, cam, vsize(), world);
        if (at.cam !== cam) { cam = at.cam; applyCam(true); }
        for (const c of el.children || []) {
          if (c.classList.contains('pg-offer-who')) { c.style.left = px(at.who.x); c.style.top = px(at.who.y); }
          if (c.classList.contains('pg-offer-treat')) { c.style.left = px(at.treat.x); c.style.top = px(at.treat.y); }
        }
      }
      parent().appendChild(el);
      if (offer) holdStill(OFFER_MS);
      clock.later(offer ? OFFER_MS : FX_MS, () => el.remove());
    }
    actor.classList.add('pose-happy'); actor.classList.remove('pose-idle'); // the drawn prop shows again for a moment
    clock.later(FX_MS, () => { if (!rideOn && !seated) { actor.classList.remove('pose-happy'); actor.classList.add('pose-idle'); } });
  };
  const riderRow = h('div', { class: 'pg-tricks pg-riders', role: 'group', 'aria-label': 'Riders', hidden: true });
  const showRiders = () => {
    const sess = (ctx.session && (ctx.session.playground = ctx.session.playground || {})) || {};
    const page = PG.riderPage(PG.seat2Choices(data, ctx.state, who.id), sess.riderRot);
    sess.riderRot = page.next; // the next time it opens: the next 4
    const ids = page.ids;
    riderRow.setAttribute('class', `pg-tricks pg-riders n${ids.length}`); // one row, sized by §15.2's floors
    riderRow.replaceChildren(...ids.map((id) => {
      const t = h('button', { type: 'button', class: 'pg-trick-btn pg-rider-tile', 'data-rider': id, 'aria-label': id }, petView(data, id, 'idle'));
      t.addEventListener('pointerdown', (ev) => {
        if (gesture || (ev.button != null && ev.button !== 0)) return;
        gesture = { kind: 'rider', pid: ev.pointerId, id, x0: ev.clientX, y0: ev.clientY, moved: false };
        try { t.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
      });
      t.addEventListener('click', (ev) => { if (ev.detail === 0) pickRider(id); }); // keyboard only; taps are pointerup
      return t;
    }));
    riderRow.hidden = !ids.length; if (trickRow && ids.length) trickRow.hidden = true;
  };
  const hideRiders = () => { riderRow.hidden = true; pickedRider = null; if (trickRow && tubesAt < 0) trickRow.hidden = false; };
  function pickRider(id) {
    if (use && use.two) { boardPartner(id); return; }
    pickedRider = pickedRider === id ? null : id;
    for (const t of riderRow.children || []) t.classList.toggle('picked', t.getAttribute('data-rider') === pickedRider);
  }
  const seat2Hot = () => {
    // the empty seat, glowing, on the back of the car (a 96 px target)
    const hot = h('button', { type: 'button', class: 'pg-seat2', 'data-pg': 'seat2', 'aria-label': 'Seat' });
    hot.style.top = px(PG.rideFit(data, who.id).feet - 110);
    hot.addEventListener('pointerdown', (ev) => { if (ev.stopPropagation) ev.stopPropagation(); });
    hot.addEventListener('click', () => { if (pickedRider) board2(pickedRider); });
    return hot;
  };
  function board2(id) {
    if (!seated || seated.seat2 || rideOn || !PG.sanitizeSeat2(data, ctx.state, id, who.id)) return false;
    const pet = petView(data, id, 'happy');
    const el = h('span', { class: 'pg-rider2', 'data-rider2': id, 'aria-hidden': 'true' }, pet, helmetEl(id));
    actorWrap.insertBefore ? actorWrap.insertBefore(el, actor) : actorWrap.prepend(el);
    seated.seat2 = { id, el };
    if (seated.hot) { seated.hot.remove(); seated.hot = null; } // both seats full: the glow stops
    hideRiders();
    fx(['fx-pop']);
    return true;
  }
  const unseat = () => {
    if (!seated) return;
    seated.car.remove(); seated.helmet.remove();
    if (seated.hot) seated.hot.remove();
    if (seated.seat2) seated.seat2.el.remove();
    if (pieceEls[seated.i]) pieceEls[seated.i].classList.remove('pg-ride-on');
    actorWrap.classList.remove('pg-seated', 'pg-two', 'pg-k1'); smile(false);
    lift = 0; placeActor(0);
    seated = null; hideRiders(); propBack(); updateGo();
  };
  const seat = (i, k = 0) => {
    const e = layout[i]; const p = PG.pieceById(data, e[0]);
    if (seated || rideOn) return;
    walkToken++; walking = false;
    propAway();
    lift = CAR_LIFT; placeActor(0);
    actorWrap.classList.toggle('pg-k1', k === 1);
    if (pieceEls[i]) pieceEls[i].classList.add('pg-ride-on');
    const car = carEl(p); const helmet = helmetEl();
    actorWrap.append(car, helmet);
    actorWrap.classList.add('pg-seated'); smile(true);
    seated = { i, p, car, helmet, seat2: null, hot: null };
    if (PG.rideSeats(p) >= 2) { actorWrap.classList.add('pg-two'); seated.hot = seat2Hot(); actorWrap.append(seated.hot); hideTubes(); showRiders(); }
    fx(['fx-pop']);
    cam = PG.fitInView(PG.followEdge(cam, { x: pos.x, y: pos.y - 60 }, vsize(), world, 140), { x: pos.x, y: pos.y - lift }, vsize(), world); applyCam(true);
    updateGo();
  };
  // a ride (q11, x1): on with its gear (always drawn while riding), slowly round the track with its beats,
  // off where it started (or at the ladder)
  const startRide = (i, viaGo = false, k = 0) => {
    const e = layout[i]; const p = PG.pieceById(data, e[0]);
    if (rideOn || !PG.canRide(riding, i, data)) return;
    if ((p.ride.go || PG.rideSeats(p) >= 2) && !viaGo) { seat(i, k); return; }
    riding.add(i); rideOn = true; walkToken++; walking = false;
    const big = !!p.ride.go;
    const parked = pieceEls[i];
    if (parked && !big && p.ride.hide !== false) parked.classList.add('pg-away'); // the carousel and tower stay drawn
    if (parked && big) parked.classList.add('pg-ride-on'); // the track stays; the parked car hides
    if (p.ride.front) { lift = CAR_LIFT; placeActor(0); }
    let car; let gear; let rider2 = null;
    if (seated) {
      car = seated.car; gear = seated.helmet; rider2 = seated.seat2;
      if (seated.hot) seated.hot.remove(); // the ride starts: no glow on an empty seat
      seated = null; actorWrap.classList.remove('pg-seated'); hideRiders();
    } else {
      propAway();
      car = carEl(p);
      if (p.ride.front) actorWrap.append(car); else actorWrap.prepend(car); // a seat sits behind the body; a car in front of the legs
      // the floaties go on (or stay on) now: with reduced motion the ride is a fade with no path steps, so
      // nothing else places her until the hop-off (QA npfloat: boarding from the deck had none)
      if (PG.rideGear(p) === 'floaties') { rideFloat = true; gear = null; syncFloaty(); }
      else { gear = helmetEl(); actorWrap.append(gear); }
    }
    const sr = PG.smallRide(p, data, who, isPhoto());
    if (sr) { actorWrap.style.scale = String(sr.k); actor.style.translate = `0 ${-sr.up}px`; if (gear) gear.style.translate = `0 ${-sr.up}px`; }
    root.classList.add('pg-on-ride'); if (big) root.classList.add('pg-big-ride');
    actorWrap.classList.add('pg-riding', `pg-ride-${p.ride.anim || 'pedal'}`);
    smile(true); updateGo();
    if (p.chime && ctx.audio && ctx.audio.tone) p.chime.forEach((hz, k) => clock.later(k * 260, () => ctx.audio.tone(hz)));
    else if (!big) fx(p.sound);
    const start = { ...pos };
    const off = PG.rideOff(e, data, zone, start);
    const finish = () => {
      car.remove(); if (gear) gear.remove();
      if (sr) { actorWrap.style.scale = ''; actor.style.translate = ''; }
      if (rider2) {
        // seat 2 hops off beside the station too, then goes on its way
        rider2.el.remove();
        const off2 = h('span', { class: 'pg-hopoff', 'data-hopoff': rider2.id, 'aria-hidden': 'true' }, petView(data, rider2.id, 'happy'));
        off2.style.left = px(off.x - 120); off2.style.top = px(off.y);
        layer.appendChild(off2);
        clock.later(FX_MS + 300, () => off2.remove());
      }
      rideFloat = false;
      actorWrap.classList.remove('pg-riding', `pg-ride-${p.ride.anim || 'pedal'}`, 'flip', 'pg-two', 'pg-k1');
      root.classList.remove('pg-on-ride', 'pg-big-ride');
      if (parked) parked.classList.remove('pg-away', 'pg-ride-on');
      riding.delete(i); rideOn = false;
      // the hop off (beside the teapots, by the station) comes first; only then the held prop comes back
      // and the offer appears (§16.10)
      lift = 0; pos = off; placeActor(reduced ? 0 : HOP_MS);
      holdStill(HOP_MS + (p.ride.after && p.ride.after.treat ? OFFER_MS : 0)); // every ride's hop-off, then any offer
      if (!PG.actorInView(cam, pos, vsize())) { cam = PG.fitInView(cam, pos, vsize(), world); applyCam(!reduced); } // she stays fully in view as she hops off
      smile(false);
      flash(actor, PG.trickClass('boing', reduced), big ? 600 : HOP_MS);
      if (big) { playHello(ctx, who); sparkleAt({ x: pos.x, y: pos.y - 150 }); } // a happy hello and sparkles by the station
      clock.later(HOP_MS, () => {
        if (rideOn || seated) return; // already boarding again: the prop waits for the next hop-off
        propBack();
        if (p.ride.after && p.ride.after.treat) offerTreat(p.ride.after, PG.pieceBox(e, data));
      });
      react(PG.reactionFor(data, who.id, p), 300);
      updateGo();
    };
    const pts = PG.ridePath(e, data, zone, layout);
    if (reduced) {
      // no chase: a fade to the peek frame for a second, then back (about 2 s for the coaster)
      const peek = pts.find((q) => q.tag === 'peek' || q.tag === 'view');
      flash(actor, 'pg-fade', 600);
      if (big || peek) {
        if (peek) { pos = { x: peek.x, y: peek.y }; placeActor(0); cam = PG.centerOn(pos, vsize(), world); applyCam(false); }
        clock.later(1000, () => { flash(actor, 'pg-fade', 600); pos = start; placeActor(0); cam = PG.centerOn(pos, vsize(), world); applyCam(false); });
        clock.later(2000, finish);
      } else clock.later(600, finish);
      return;
    }
    const legs = PG.rideLegs(start, pts, PG.rideSpeed(p, data));
    const beat = (tag) => {
      if (tag === 'peek') { flash(car, 'pg-flap', FX_MS); sparkleAt({ x: pos.x + 70, y: pos.y - 120 }); }
      else if (tag === 'whoosh') { fx('fx-zoom'); flash(actorWrap, 'pg-whoosh', FX_MS); }
      else if (tag === 'tunnel') { sparkleAt({ x: pos.x, y: pos.y - 110 }, 'tunnel'); sparkleAt({ x: pos.x - 50, y: pos.y - 70 }, 'tunnel'); }
      const r = PG.reactionFor(data, who.id, { id: tag });
      if (r) react(r);
    };
    const step = (k) => {
      if (k >= legs.length) { finish(); return; }
      const L = legs[k];
      pos = { x: L.x, y: L.y };
      actorWrap.classList.toggle('flip', L.dir < 0);
      placeActor(L.ms);
      cam = big ? PG.centerOn({ x: pos.x, y: pos.y - 60 }, vsize(), world) : PG.followEdge(cam, pos, vsize(), world, 110);
      applyCam(true);
      clock.later(L.ms, () => {
        if (L.tag) beat(L.tag);
        if (L.tag === 'view') clock.later(1000, () => step(k + 1)); else step(k + 1);
      });
    };
    if (big) {
      // friendCounter counts the riders in first; then the Go call; soft climb clicks are tones
      const pre = who.id === 'friendCounter' ? counter(3) : [];
      fx([...pre, 'pk-go']);
      const climb = legs.findIndex((L) => L.tag === 'peek');
      let t = 0;
      for (let k = 0; k <= climb && k < legs.length; k++) {
        t += legs[k].ms;
        if (k >= 1 && ctx.audio && ctx.audio.tone) clock.later(t - 40, () => ctx.audio.tone(440 + k * 40));
      }
    }
    step(0);
  };
  // after the teapots friendBerry offers a strawberry (x1); after a ride with a treat in data
  const offerTreat = (after, from = null) => {
    for (const old of [...(layer.children || [])]) if (old.classList && old.classList.contains('pg-offer')) old.remove(); // one offer at a time
    const allowed = after.who && after.who !== who.id && PG.playgroundAllow(data, ctx.state, after.who);
    // beside her on the same ground line, never on top; the strawberry between them at paw height (§16.10)
    const at = PG.offerSpot(pos, cam, vsize(), world, from);
    if (at.cam !== cam) { cam = at.cam; applyCam(true); }
    const treat = h('span', { class: 'pg-offer-treat' }, drawing(art(after.treat), { box: '0 0 100 100' }));
    const parts = [treat];
    if (allowed) {
      const giver = h('span', { class: 'pg-offer-who', 'data-who': after.who }, petView(data, after.who, 'happy'));
      giver.style.left = px(at.who.x); giver.style.top = px(at.who.y);
      parts.unshift(giver);
      treat.style.left = px(at.treat.x);
    } else treat.style.left = px(pos.x + at.side * (PG.OFFER.body + PG.OFFER.treat / 2 + 4)); // no giver: just the treat beside her
    treat.style.top = px(at.treat.y);
    const box = h('span', { class: 'pg-offer', 'data-offer': after.treat, 'data-side': at.side > 0 ? 'right' : 'left', 'aria-hidden': 'true' }, ...parts);
    layer.appendChild(box);
    fx('fx-mmm');
    holdStill(OFFER_MS);
    clock.later(OFFER_MS, () => box.remove());
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
  const tapPiece = (i) => {
    const e = layout[i];
    const pc = e && PG.pieceById(data, e[0]);
    if (pc && (pc.pumps || pc.sprayers) && ((use && use.i === i) || (!walking && !use && PG.pieceAt(layout, data, pos.x, pos.y) === i))) { pc.pumps ? pump(i, pc) : spray(i, pc); return; }
    if (!e || rideOn || (use && use.i === i)) return;
    if (seated) { if (seated.i === i) return; unseat(); }
    stopUse();
    const seats = PG.seatsOf(PG.useOf(data, e[0]));
    const at = seats.map((_, k) => PG.useSteps(e, k, who, data, zone, true, isPhoto(), layout)[0]);
    const k = at.length > 1 && Math.hypot(at[1].x - pos.x, at[1].y - pos.y) < Math.hypot(at[0].x - pos.x, at[0].y - pos.y) ? 1 : 0;
    if (at[k]) walkTo(at[k], () => (pc.tubes ? showTubes(i, pc) : runUse(i, k)));
  };
  // ---- the use runner (y3) ----
  let use = null;
  let phase = '';
  let tubeTurn = 0;
  const isPhoto = () => actor.getAttribute('data-photo') === '1';
  const pose = (q) => { for (const x of ['sit', 'hold', 'climb', 'whee']) actorWrap.classList.toggle(`pg-p-${x}`, x === q); };
  const fit = (s = 1, r = 0, zi = '') => { actorWrap.style.scale = s === 1 ? '' : String(s); actorWrap.style.rotate = r ? `${r}deg` : ''; actorWrap.style.zIndex = zi; };
  const swingSeat = (i, k, s) => {
    const g = pieceEls[i] && byClassIn(pieceEls[i], `s${k}`, 6).find((x) => x.classList.contains('pg-sw'));
    if (!g) return;
    const on = s && s.phase === 'using' && s.swing;
    g.style.transitionDuration = `${reduced || !s ? 0 : s.ms}ms`; g.style.scale = on ? `1 ${Math.cos((s.swing * Math.PI) / 180).toFixed(3)}` : '';
  };
  const partnerTo = (P, s) => {
    if (!P || !s) return;
    if (use && use.two && P === use.partner && !P.a) swingSeat(use.i, 1 - use.k, s);
    if (P.a) { P.a.x = s.x; P.a.y = s.y - P.a.size / 2; placeAnimal(P.a, s.ms); return; }
    P.el.style.transitionDuration = `${reduced ? 0 : s.ms}ms`; P.el.style.translate = `${px(s.x)} ${px(s.y)}`; P.el.style.scale = String(s.scale);
  };
  const dropPartner = (U) => {
    const P = U && U.partner; if (!P) return;
    if (P.a) P.a.reacting = false; else clock.later(HOP_MS, () => P.el.remove());
    U.partner = null;
  };
  function boardPartner(id) {
    const U = use;
    if (!U || !U.two || !PG.sanitizeSeat2(data, ctx.state, id, who.id)) return false;
    if (U.partner && U.partner.a) dropPartner(U); else if (U.partner) return false;
    const el = h('span', { class: 'pg-partner', 'data-partner': id, 'aria-hidden': 'true' }, petView(data, id, 'happy'));
    U.partner = { el, steps: PG.useSteps(layout[U.i], 1 - U.k, castOf(id), data, zone, reduced, false, layout) };
    layer.appendChild(el); partnerTo(U.partner, U.partner.steps[Math.max(0, U.n - 1)]);
    hideRiders(); fx(['fx-pop']);
    return true;
  }
  let deco = {};
  const hidePeek = (s = {}) => {
    actorWrap.classList.toggle('pg-hid', !!s.hide); actor.style.clipPath = s.clip ? `inset(0 0 ${160 - s.clip}px 0)` : '';
    for (const [k, cls] of [['ripple', 'pg-ripple'], ['pole', 'pg-pole'], ['seat', `pg-seat${use && use.k ? ' k1' : ''}`]]) {
      if (s[k] && !deco[k]) { deco[k] = h('span', { class: cls, 'aria-hidden': 'true' }); actorWrap.append(deco[k]); }
      if (!s[k] && deco[k]) { deco[k].remove(); deco[k] = null; }
    }
    if (deco.ripple) deco.ripple.style.top = px(s.clip - 12);
    if (deco.seat) deco.seat.style.top = px(s.seat - 6);
    if (s.pole && !deco.top && use) { deco.top = h('span', { class: 'pg-canopy', 'aria-hidden': 'true' }, drawing(art('pgMerryTop'), { box: '0 0 200 200' })); placeBox(deco.top, PG.pieceBox(layout[use.i], data)); layer.append(deco.top); }
    if (!s.pole && deco.top) { deco.top.remove(); deco.top = null; }
  };
  const endUse = (U, cancel) => {
    if (use !== U) return;
    use = null; phase = ''; rideFloat = false; hidePeek(); swingSeat(U.i, U.k, null); swingSeat(U.i, 1 - U.k, null);
    pose(''); fit(); smile(false);
    const cc = PG.clampCamera(cam, vsize(), world);
    if (cc.x !== cam.x || cc.y !== cam.y) { cam = cc; applyCam(!reduced); }
    actorWrap.classList.remove('pg-using'); root.classList.remove('pg-using');
    if (U.tubeEl) U.tubeEl.remove();
    if (cancel) { dropPartner(U); hideRiders(); propBack(); pos = drawnPos(); placeActor(0); return; }
    if (U.partner && !U.partner.a) partnerTo(U.partner, U.partner.steps[U.steps.length - 1]);
    dropPartner(U); hideRiders();
    propBack();
    react(PG.reactionFor(data, who.id, U.p), 0);
    if (U.p.tubes) showTubes(U.i, U.p);
  };
  const stopUse = () => { if (use && !PG.isRide(use.p)) endUse(use, true); };
  const beat = (U, tag) => {
    const p = U.p; const at = { x: pos.x, y: pos.y - 150 };
    if (tag === 'tube' || (tag === 'fun' && p.tubes && !U.tubeEl)) {
      const c = U.tube || p.tubes[tubeTurn++ % p.tubes.length];
      U.tubeEl = h('span', { class: 'pg-car front pg-tube-ride', 'data-tube': c, 'aria-hidden': 'true' }, h('span', { class: 'pg-car-in' }, drawing(art('pgTube', { fill: TUBE_FILL[c] }), { box: '0 0 100 100' })));
      U.tubeEl.style.top = px(PG.rideFit(data, who.id).feet - 60);
      actorWrap.append(U.tubeEl); fx([`pk-${c}`, { pause: 150 }, 'fx-zoom']);
      if (tag === 'tube') return;
    }
    if (tag === 'splash' || (tag === 'puff' && !reduced)) {
      dropsAt(tag === 'puff' ? ' dust' : '', FX_MS);
      if (tag === 'splash') { fx(PG.pieceSounds({ sound: 'fx-splash', water: true }, who)); cheer(300); }
      return;
    }
    if (tag !== 'fun') return;
    if (p.snacks) giveSnack(p);
    else if (PG.isPinned(layout[U.i], zone)) lifeguardWave(U.i);
    else if (p.pumps) pump(U.i, p);
    else if (p.sprayers) spray(U.i, p);
    else if (p.water) runFx(PG.pieceTrick(p, who), PG.pieceSounds(p, who), !!deco.ripple);
    else {
      fx(p.sounds ? p.sounds.filter(Boolean) : PG.pieceSounds(p, who));
      if (!reduced) sparkleAt(at, PG.useOf(data, p.id).type === 'hide' ? 'tunnel' : '');
    }
  };
  const stepUse = (U) => {
    if (use !== U) return;
    const s = U.steps[U.n++];
    if (!s) { endUse(U, false); return; }
    phase = s.phase;
    if (s.phase === 'hopOff') rideFloat = false;
    pose(s.pose);
    fit(s.scale, s.rot, s.layer === 'b' && pieceEls[U.i] ? String(Number(pieceEls[U.i].style.zIndex) - 1) : '');
    hidePeek(s);
    swingSeat(U.i, U.k, s);
    pos = { x: s.x, y: s.y };
    const c = U.cams[U.n - 1];
    if (c && (c.x !== cam.x || c.y !== cam.y)) { cam = c; applyCam(!reduced); }
    if (s.fade) flash(actor, 'pg-fade', 600);
    placeActor(s.ms);
    if (U.partner) partnerTo(U.partner, U.partner.steps[U.n - 1]);
    if (s.tag) beat(U, s.tag);
    if (s.fade) stepUse(U); else clock.later(s.ms, () => stepUse(U));
  };
  function runUse(i, k = 0, tube = null) {
    const e = layout[i]; const p = e && PG.pieceById(data, e[0]); const u = p && PG.useOf(data, p.id);
    if (!u || rideOn || building || (seated && seated.i === i)) return false;
    if (seated) unseat();
    stopUse(); hideTubes();
    walkToken++; walking = false; actorWrap.classList.remove('walking', 'pg-trot');
    const steps = PG.useSteps(e, k, who, data, zone, reduced, isPhoto(), layout);
    const cams = PG.useCams(cam, PG.slotBox(e, k, data, zone), PG.isRide(p) ? [steps[0]] : steps, vsize(), world, gates.length, PG.rideFit(data, who.id).head);
    cam = cams[0]; applyCam(!reduced);
    if (PG.isRide(p)) {
      use = { i, p, ride: true }; phase = 'boarding';
      pos = steps[0]; placeActor(reduced ? 0 : PG.BOARD_MS);
      clock.later(reduced ? 0 : PG.BOARD_MS, () => { if (use && use.p === p) { use = null; phase = ''; startRide(i, false, k); } });
      return true;
    }
    const U = use = { i, k, p, steps, cams, n: 0, tube, two: PG.seatsOf(u).length === 2, partner: null };
    if (u.type === 'water' && zone.floaties === true) rideFloat = true;
    propAway(); smile(true);
    actorWrap.classList.add('pg-using'); root.classList.add('pg-using');
    if (U.two) {
      showRiders();
      const a = u.partner === 'animal' && (animals.find((x) => x.kind === 'squirrel' && !x.reacting) || animals.find((x) => x.kind === 'bird' && !x.reacting));
      if (a) { a.reacting = true; U.partner = { a, steps: PG.useSteps(e, 1 - k, null, data, zone, reduced, false, layout) }; }
    }
    stepUse(U);
    return true;
  }

  // ---- the Water Park (Amendment x2, design §16.5) ----
  // floaties are drawn whenever she is in a water area (top layer, never over the face, reduced motion
  // too); leaving the water: a towel wrap for 600 ms (dogs dry off with drops), then the floaties come off
  // Floaties are derived state (Architect x2, 3:13 AM): every drawn frame, for every character drawn in the
  // Water zone, floaties = inWater(where it is drawn now) || on a water ride. This one function applies that
  // for her (from the frame loop and when she is placed); its only event is the towel moment on leaving.
  let floaty = null;
  const syncFloaty = () => {
    if (zone.floaties !== true) return;
    const inW = rideFloat || PG.inWater(layout, data, zone, drawnPos());
    if (inW && floaty && floaty.leaving) { floaty.towel.remove(); floaty.el.remove(); floaty = null; }
    if (inW && !floaty) {
      floaty = { el: floatyEl(), leaving: false };
      actorWrap.append(floaty.el);
      lifeguardThumb();
    } else if (!inW && floaty && !floaty.leaving) {
      const f = floaty; f.leaving = true;
      f.towel = h('span', { class: 'pg-towel', 'aria-hidden': 'true' }, drawing(art('pgTowelWrap'), { box: '0 0 160 60' }));
      f.towel.style.top = px(PG.floatyFit(data, who).top - 6);
      actorWrap.append(f.towel);
      if (PG.isDog(who) && !reduced) {
        const drops = h('div', { class: 'pg-drops dry', 'aria-hidden': 'true' }, ...Array.from({ length: 8 }, (_, k) => h('span', { class: `drop d${k}` })));
        drops.style.left = px(pos.x); drops.style.top = px(pos.y);
        layer.appendChild(drops);
        clock.later(600, () => drops.remove());
      }
      clock.later(600, () => {
        if (floaty !== f) return;
        f.towel.remove(); f.el.remove(); floaty = null;
        syncFloaty();
      });
    }
  };
  // the lifeguard: looks towards her, a thumbs-up when she gets in the water, a wave when pressed
  const guards = () => layout.map((e, i) => (PG.isPinned(e, zone) ? i : -1)).filter((i) => i >= 0);
  const lookAt = () => {
    for (const i of guards()) {
      const el = pieceEls[i]; if (!el) continue;
      const b = PG.pieceBox(layout[i], data);
      el.classList.toggle('look-r', pos.x > b.x + b.w * 0.35);
      el.classList.toggle('look-l', pos.x <= b.x + b.w * 0.35);
    }
  };
  function lifeguardThumb() { for (const i of guards()) flash(pieceEls[i], reduced ? 'pg-fade' : 'lg-thumb', FX_MS); }
  function lifeguardWave(i) { flash(pieceEls[i], reduced ? 'pg-fade' : 'lg-wave', FX_MS); runFx('rest', []); } // no whistle sound, ever
  // the curly slide: at the slide the trick row swaps to 4 tube buttons; a tube says its colour, then
  // whoosh into a splash
  const TUBE_FILL = { red: '#E5484D', yellow: '#F2C230', blue: '#4AA3DF', green: '#5DBB63' };
  let tubesAt = -1;
  const tubeRow = h('div', { class: 'pg-tricks pg-tubes n4', role: 'group', 'aria-label': 'Tubes', hidden: true });
  const hideTubes = () => {
    if (tubesAt < 0) return;
    tubesAt = -1; tubeRow.hidden = true; if (trickRow) trickRow.hidden = false;
  };
  function showTubes(i, p) {
    tubesAt = i;
    tubeRow.replaceChildren(...p.tubes.filter((c) => TUBE_FILL[c]).slice(0, 4).map((c) => h('button', {
      type: 'button', class: 'pg-trick-btn pg-tube-btn', 'data-tube': c, 'aria-label': c, onclick: () => runUse(tubesAt, 0, c),
    }, drawing(art('pgTube', { fill: TUBE_FILL[c] }), { box: '0 0 100 100' }))));
    tubeRow.hidden = false; if (trickRow) trickRow.hidden = true;
  }
  // the cheer (EM fix B): every Water station that finishes (slide splash-down, bucket tip, spray rainbow,
  // frisbee catch) cheers with the existing cheer clip and a little sparkle. Never the surprise box, no new
  // audio, nothing with Sound: Off, and one cheer at a time (a short guard so two never overlap).
  const cheerCfg = PG.cheerOf(zone);
  let cheering = false;
  function cheer(delay = 0) {
    if (!cheerCfg) return;
    clock.later(delay, () => {
      if (cheering) return;
      cheering = true; clock.later(cheerCfg.gapMs, () => { cheering = false; });
      sparkleAt({ x: pos.x, y: pos.y - 160 }, 'star');
      if (!(ctx.state && ctx.state.sound === false)) fx(cheerCfg.clip);
    });
  }
  // the giant bucket: pump taps count 1 to 10, then it tips. Dogs dry off, friendSilly hic-giggles,
  // everyone else giggles
  let pumps = { i: -1, n: 0 };
  function pump(i, p) {
    if (pumps.i !== i) pumps = { i, n: 0 };
    pumps.n++;
    flash(pieceEls[i], reduced ? 'pg-fade' : 'pg-pump', 400);
    if (pumps.n < p.pumps) { fx(`n-${pumps.n}`); return; }
    fx([`n-${pumps.n}`, { pause: 200 }, 'fx-splash']);
    pumps = { i: -1, n: 0 };
    busy = true;
    clock.later(400, () => {
      flash(pieceEls[i], reduced ? 'pg-fade' : 'pg-tip', FX_MS);
      cheer(600);
      const drops = h('div', { class: 'pg-drops', 'aria-hidden': 'true' }, ...Array.from({ length: 8 }, (_, k) => h('span', { class: `drop d${k}` })));
      drops.style.left = px(pos.x); drops.style.top = px(pos.y - 120);
      if (!reduced) layer.appendChild(drops);
      clock.later(FX_MS, () => drops.remove());
      if (PG.isDog(who)) runFx('swim', [who.sound]);                         // a happy dry-off with a spray of drops
      else if (who.id === 'friendSilly') { flash(actor, reduced ? 'pg-fade' : 'pg-hic', FX_MS); fx(['fx-giggle', { pause: 160 }, 'fx-giggle']); clock.later(FX_MS, () => { busy = false; }); }
      else runFx('boing', ['fx-giggle']);
    });
  }
  // the sprayer garden: each tap sprays the next one; all three sprayed shows a rainbow for 1.5 s
  const sprayed = new Set();
  function spray(i, p) {
    const k = [0, 1, 2].find((n) => !sprayed.has(n)) ?? 0;
    sprayed.add(k);
    flash(pieceEls[i], `spray-${k}`, FX_MS);
    runFx('splash', PG.pieceSounds({ sound: p.sound, water: true }, who));
    if (sprayed.size >= Math.min(3, p.sprayers || 3)) {
      sprayed.clear();
      const b = PG.pieceBox(layout[i], data);
      const bow = h('span', { class: 'pg-rainbow', 'aria-hidden': 'true' }, drawing(art('rainbow'), { box: '0 0 100 100' }));
      bow.style.left = px(b.x + b.w / 2); bow.style.top = px(b.y + 10);
      layer.appendChild(bow);
      fx('fx-chime');
      cheer(500);
      clock.later(1500, () => bow.remove());
    }
  }
  let trickRow = null;

  // pieces
  const pieceEls = [];
  const renderPieces = () => {
    piecesEl.replaceChildren(); pieceEls.length = 0;
    layout.forEach((e, i) => {
      const p = PG.pieceById(data, e[0]);
      const el = h('button', { type: 'button', class: `pg-piece pc-${p.id}`, 'data-piece': p.id, 'data-slots': PG.seatsOf(PG.useOf(data, p.id)).length, 'aria-label': p.id },
        drawing(art(p.art), { box: `0 0 ${p.w * 100} ${p.h * 100}` }));
      const b = PG.pieceBox(e, data);
      placeBox(el, b);
      el.style.zIndex = String(Math.round(b.y + b.h));
      el.addEventListener('pointerdown', (ev) => {
        if (gesture || (ev.button != null && ev.button !== 0) || onActor(ev)) return;
        if (building) {
          if (PG.isPinned(e, zone)) return; // the lifeguard stays put: never moved or binned
          gesture = { kind: 'move', piece: i, x0: ev.clientX, y0: ev.clientY, cam0: { ...cam }, moved: false };
          try { el.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
          return;
        }
        gesture = { kind: 'press', pid: ev.pointerId, piece: i, x0: ev.clientX, y0: ev.clientY, cam0: { ...cam }, moved: false };
      });
      el.addEventListener('click', (ev) => { if (ev.detail === 0 && !building) tapPiece(i); }); // keyboard only; taps are pointerup
      piecesEl.appendChild(el); pieceEls.push(el);
    });
  };
  renderPieces();
  if (zone.floaties === true || (zone.pinned || []).length) {
    onPlace = () => {
      syncFloaty(); lookAt();
      if (tubesAt >= 0 && PG.pieceAt(layout, data, pos.x, pos.y) !== tubesAt) hideTubes();
    };
  }
  onPlace();

  // animals: wander loops, soft reactions, pause during tricks
  let animals = [];
  const makeAnimals = () => PG.zoneAnimals(zone, layout, data).map((a, k) => {
    const el = h('button', { type: 'button', class: `pg-animal an-${a.kind}`, 'data-animal': a.kind, 'aria-label': a.kind },
      h('span', { class: 'pg-animal-in' }, drawing(art(a.art), { box: '0 0 100 100' })));
    el.style.width = px(a.size); el.style.height = px(a.size);
    const st = { ...a, k, el, dist: (k * 137) % Math.max(1, PG.loopLength(a.pts)), x: a.pts[0].x, y: a.pts[0].y, dir: 1, reacting: false };
    el.addEventListener('pointerdown', (ev) => {
      if (gesture || (ev.button != null && ev.button !== 0) || onActor(ev)) return;
      gesture = { kind: 'pressAnimal', pid: ev.pointerId, animal: k, x0: ev.clientX, y0: ev.clientY, cam0: { ...cam }, moved: false };
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
  // the other characters drawn in the Water zone (seat 2, a hop-off, an offer's giver): same rule, every frame
  const castOf = (id) => PG.playgroundCast(data, ctx.state).find((c) => c.id === id) || { id };
  const othersFloaty = () => {
    const figs = [...byClassIn(actorWrap, 'pg-rider2').map((el) => ({ el, id: el.getAttribute('data-rider2'), size: 160, inW: rideFloat || PG.inWater(layout, data, zone, drawnPos()) })),
      ...byClassIn(layer, 'pg-hopoff').map((el) => ({ el, id: el.getAttribute('data-hopoff'), size: 128 })),
      ...byClassIn(layer, 'pg-offer-who').map((el) => ({ el, id: el.getAttribute('data-who'), size: 96 })),
      ...byClassIn(layer, 'pg-partner').map((el) => { const [x, y] = String(el.style.translate).split(' ').map(parseFloat); return { el, id: el.getAttribute('data-partner'), size: 160, inW: PG.inWater(layout, data, zone, { x, y }) }; })];
    for (const f of figs) {
      const inW = f.inW != null ? f.inW : PG.inWater(layout, data, zone, { x: parseFloat(f.el.style.left), y: parseFloat(f.el.style.top) });
      const on = byClassIn(f.el, 'pg-floaty')[0];
      if (inW && !on) f.el.append(floatyEl(castOf(f.id), f.size / 160));
      else if (!inW && on) on.remove();
    }
  };
  const floatyFrame = () => { if (zone.floaties === true) { syncFloaty(); othersFloaty(); } };
  let last = null;
  const tick = (t) => {
    const dt = last == null ? 0 : Math.min(100, Math.max(0, t - last));
    last = t;
    floatyFrame();
    const dragging = gesture && gesture.kind === 'drag';
    if (!busy && !dragging && !reduced && !building) {
      const moving = PG.movingAnimals(animals.length, riding.size); // riders and animals share the cap (x4)
      for (const a of animals) {
        if (a.reacting || a.k >= moving) continue;
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
  const ambientHeld = () => busy || !!gesture || walking || building || rideOn || !!seated || !!use || !!phase || tubesAt >= 0 || Date.now() < stillUntil;
  if (who.kind === 'dog' && animals.length) {
    const chase = () => {
      if (!ambientHeld()) {
        const n = PG.nearestOf(animals, pos, ['bird', 'squirrel']);
        if (n && n.d < 450) walkTo(PG.chaseStep(pos, animals[n.i]), null, 'pg-trot');
      }
      clock.later(8000 + Math.random() * 6000, chase);
    };
    clock.later(6000 + Math.random() * 4000, chase);
  }

  // one gesture at a time: character drag, press on a piece or animal (a tap unless it moves), or pan
  function onActor(ev) {
    if (building || rideOn || (use && use.ride)) return false;
    const w = toWorld(ev); const b = PG.bodyBox(drawnPos());
    return w.x >= b.x - 16 && w.x <= b.x + b.w + 16 && w.y >= b.y - 16 && w.y <= b.y + b.h + 16;
  }
  view.addEventListener('pointerdown', (ev) => {
    if (ev.button != null && ev.button !== 0) return;
    if (root.classList.contains('pg-big-ride')) return; // the camera follows the train: no panning away mid-ride
    if (!gesture && onActor(ev)) {
      stopUse(); unseat();
      const w = toWorld(ev);
      gesture = { kind: 'drag', pid: ev.pointerId, x0: ev.clientX, y0: ev.clientY, cam0: { ...cam }, moved: false, off: { x: pos.x - w.x, y: pos.y - w.y } };
      try { actorWrap.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
      actorWrap.classList.add('dragging');
      walkToken++; walking = false;
      if (ev.preventDefault) ev.preventDefault();
      return;
    }
    if (!gesture) gesture = { kind: 'pan', pid: ev.pointerId, x0: ev.clientX, y0: ev.clientY, cam0: { ...cam }, moved: false };
    if (gesture.kind !== 'drag') { try { view.setPointerCapture(ev.pointerId); } catch { /* ignore */ } }
  });
  const other = (g, ev) => g.pid != null && ev.pointerId != null && ev.pointerId !== g.pid;
  view.addEventListener('pointermove', (ev) => {
    const g = gesture;
    if (!g || other(g, ev)) return;
    const dx = ev.clientX - g.x0; const dy = ev.clientY - g.y0;
    if (!g.moved && Math.hypot(dx, dy) > PG.TAP_SLOP) g.moved = true;
    if ((g.kind === 'press' || g.kind === 'pressAnimal') && g.moved) g.kind = 'pan';
    if (g.kind === 'pan') {
      cam = PG.softClamp({ x: g.cam0.x - dx, y: g.cam0.y - dy }, vsize(), world);
      applyCam(false);
    } else if (g.kind === 'drag' && g.moved) {
      const w = toWorld(ev);
      pos = PG.clampToWorld({ x: w.x + g.off.x, y: w.y + g.off.y }, zone);
      placeActor(0);
      cam = PG.followEdge(cam, pos, vsize(), world);
      applyCam(false);
      footstep();
    }
  });
  const end = (ev) => {
    const g = gesture;
    if (!g || g.kind === 'tray' || g.kind === 'move' || other(g, ev)) return;
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
      const hit = PG.dropTarget(layout, data, zone, PG.bodyBox(pos), g.moved ? toWorld(ev) : null);
      cam = PG.clampCamera(cam, vsize(), world);
      applyCam(true);
      if (hit && (g.moved || up)) runUse(hit.i, hit.seat);
    }
  };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);

  worldEl.append(sky, piecesEl, animalsEl, layer, actorWrap);

  // start centred on the character beside the slide (again once the view has its real size)
  // zone start and gate arrival (Design fix 3): centred on her, then clamped so her whole drawing is in view
  const startCam = () => PG.startCamera(pos, layout, zone, data, vsize(), world);
  cam = startCam(); applyCam(false);
  clock.later(0, () => { cam = startCam(); applyCam(false); });

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
      clock.later(600, () => { d.remove(); fx(who.sound); busy = false; throwing = false; cheer(); });
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
      if (to.target) { sparkleAt({ x: to.x, y: to.y - 150 }, 'star'); fx('fx-pop'); } // a catch on a target: a star pop
      cheer(400); // in the Water Park a catch cheers
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

  // zone gates (design §16.1): the other ready zones' gates, 96 px cream cards overlaid bottom-left;
  // hidden in build mode and on a ride (CSS). A tap fades to cream (300 ms; a 150 ms crossfade with
  // reduced motion), then replaces the hash so Back still goes to the pick screen.
  const gates = PG.otherGates(data, zone.id);
  const cream = h('div', { class: 'pg-cream', 'aria-hidden': 'true' });
  let leaving = false;
  const goZone = (z) => {
    if (leaving || building || rideOn) return;
    leaving = true;
    root.classList.add(reduced ? 'pg-leave-rm' : 'pg-leave');
    const to = `#playground/${who.id}/${z.id}`;
    clock.later(reduced ? 150 : 300, () => (ctx.replace ? ctx.replace(to) : ctx.go(to)));
  };
  const gateStrip = gates.length ? h('div', { class: 'pg-gates', role: 'group', 'aria-label': 'Places' },
    gates.map((z) => h('button', {
      type: 'button', class: 'pg-gate', 'data-gate': z.id, 'aria-label': z.id, onclick: () => goZone(z),
    }, drawing(art(z.gate), { box: '0 0 100 100' })))) : null;
  if (gateStrip) gateStrip.addEventListener('pointerdown', (ev) => { if (ev.stopPropagation) ev.stopPropagation(); });

  // ---- build mode (q6, q10): her own park, saved per profile and per zone ----
  const cap = Math.min(PG.PARK_CAP, Math.max(1, Number(pgData.cap) || PG.PARK_CAP));
  const cell = PG.cellOf(data);
  const catalog = (Array.isArray(zone.pieces) ? zone.pieces : []).map((id) => PG.pieceById(data, id)).filter((p) => p && p.id && zone.pieces.includes(p.id));
  const persist = () => {
    const parks = isObj(prof.parks) ? { ...prof.parks } : {};
    parks[zone.id] = PG.savable(layout, zone); // the pinned lifeguard is never saved
    prof.parks = parks;
    if (ctx.save) ctx.save();
  };
  const tiles = catalog.map((p) => {
    const t = h('button', { type: 'button', class: 'pg-tray-tile', 'data-tray': p.id, 'aria-label': p.id },
      drawing(art(p.art), { box: `0 0 ${p.w * 100} ${p.h * 100}` }));
    t.addEventListener('pointerdown', (ev) => {
      if (gesture || (ev.button != null && ev.button !== 0) || layout.length >= cap || !PG.canAdd(layout, p.id, data)) return;
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
      const off = full || !PG.canAdd(layout, t.getAttribute('data-tray'), data); // one dragon coaster at most
      t.setAttribute('aria-disabled', off ? 'true' : 'false');
      t.classList.toggle('picked', !off && t.getAttribute('data-tray') === picked);
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
    if (layout.length >= cap || !PG.canAdd(layout, id, data)) return false;
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
  rootEl = root;
  trickRow = h('div', { class: `pg-tricks n${btns.length}`, role: 'group', 'aria-label': 'Tricks' }, btns);
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
  // seat 2 by drag: a small copy of the character follows her finger; dropped on the glowing seat, it boards
  const riderGhost = h('div', { class: 'pg-rider-ghost', 'aria-hidden': 'true' });
  root.addEventListener('pointermove', (ev) => {
    const g = gesture;
    if (!g || g.kind !== 'rider') return;
    if (!g.moved && Math.hypot(ev.clientX - g.x0, ev.clientY - g.y0) > PG.TAP_SLOP) {
      g.moved = true; riderGhost.replaceChildren(petView(data, g.id, 'happy')); layer.appendChild(riderGhost);
    }
    if (!g.moved) return;
    const pt = toWorld(ev);
    riderGhost.style.left = px(pt.x - 40); riderGhost.style.top = px(pt.y - 70);
    if (seated && seated.hot) seated.hot.classList.toggle('to-seat', over(seated.hot, ev));
  });
  const riderEnd = (ev) => {
    const g = gesture;
    if (!g || g.kind !== 'rider' || (g.pid != null && ev.pointerId != null && ev.pointerId !== g.pid)) return;
    gesture = null; riderGhost.remove();
    if (seated && seated.hot) seated.hot.classList.remove('to-seat');
    const up = ev.type === 'pointerup';
    if (!g.moved) { if (up) pickRider(g.id); return; }
    if (up && seated && seated.hot && over(seated.hot, ev)) board2(g.id);
    else if (up && use && use.two && over(view, ev)) boardPartner(g.id);
  };
  root.addEventListener('pointerup', riderEnd);
  root.addEventListener('pointercancel', riderEnd);

  const buildBtn = h('button', { type: 'button', class: 'pg-build-btn', 'data-pg': 'build', 'aria-label': 'Build' }, drawing(art('pgBuild'), { box: '0 0 100 100' }));
  const doneBtn = h('button', { type: 'button', class: 'pg-done-btn', 'data-pg': 'done', 'aria-label': 'Done' }, drawing(art('pgDone'), { box: '0 0 100 100' }));
  for (const b of [buildBtn, doneBtn]) b.addEventListener('pointerdown', (ev) => { if (ev.stopPropagation) ev.stopPropagation(); });
  const enterBuild = () => {
    if (building || rideOn || throwing) return;
    unseat(); hideTubes();
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
  if (gateStrip) view.append(gateStrip);
  view.append(goPaw);
  updateTray();

  root.append(
    h('div', { class: 'topbar' }, backBtn(ctx), h('span', { class: 'grow' }), homeBtn(ctx)),
    view,
    trickRow, tubeRow, riderRow,
    tray, cream);
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
