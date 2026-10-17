// Ride Close-Up Scenes (a lazily loaded pack like Care): from a park item's close-up button, one pet rides it up
// close in a storybook-realistic scene. Finger controls only: drag the pet (it gets a glowing dashed ring), tap to go.
// No timer, no score, nothing to lose; motion is animation frames only. Ride pets are game targets, so they are not
// .pet[data-pet] (no tap-a-pet hello here); sounds are the pet's own fun sounds (fx clips).
import { h, drawing } from '../dom.js';
import { dadButton } from '../dad.js';
import { reducedMotion } from '../fun.js';
import * as R from '../rides.js';
import * as A from '../rides-art.js';

export const RIDES_CACHE = 'gg-pack-rides-d25e1a8bb0';
export const RIDES_PACK = ['./js/screens/rides.js', './js/rides.js', './js/rides-art.js', './css/rides.css'];
export async function ready(ctx) {
  await new Promise((ok) => { const k = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: './css/rides.css' }); k.onload = k.onerror = ok; document.head.append(k); });
  if (globalThis.caches) {
    caches.open(RIDES_CACHE).then(async (c) => {
      if (!(await c.match(RIDES_PACK[0]))) await c.addAll([...RIDES_PACK].map((u) => new Request(u, { cache: 'reload' })));
      for (const k of await caches.keys()) if (k.startsWith('gg-pack-rides-') && k !== RIDES_CACHE) await caches.delete(k); // an older pack
    }).catch(() => {});
  }
  return { render, leave };
}

const W = 360, H = 780, HORIZON = 234; // a phone-shaped frame; the horizon at 30 % (Design r1)
let raf = 0;
let MUD = {}; // this session's scooter mud, per pet (it stays until the splash pad)
const pp = (id, o = {}) => A.pet(id, { ...o, mud: R.mudOf(MUD, id) });
export function leave() { cancelAnimationFrame(raf); raf = 0; }
const backArt = () => drawing(['g', {}, ['circle', { cx: 32, cy: 32, r: 26, fill: '#FFFFFF', stroke: '#C9D6E2', 'stroke-width': 1.5 }],
  ['path', { d: 'M36 18L22 32L36 46', fill: 'none', stroke: '#4A6A86', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }]], { cls: 'icon', box: '0 0 64 64' });

// the park backdrop: sky, sun in sunglasses, far (35 %) / mid (60 %) / near layers
function park(defs) {
  return [A.sky(defs, W, H), A.cloud(70, 70, 0.9), A.cloud(200, 120, 0.7), A.bird(140, 60), A.bird(162, 74, 0.7),
    A.layer(defs, 'far', W, HORIZON, A.tree(defs, 20, HORIZON, 1.2), A.tree(defs, 140, HORIZON, 1), A.tree(defs, 300, HORIZON, 1.3), A.fence(0, HORIZON, W), A.kite(240, 120)),
    A.ground(defs, W, HORIZON, H),
    A.layer(defs, 'mid', W, HORIZON + 40, A.bush(defs, 20, HORIZON + 40), A.bench(defs, 150, HORIZON + 40), A.tree(defs, 330, HORIZON + 40, 0.9), A.squirrel(defs, 240, HORIZON + 40), A.bush(defs, 400, HORIZON + 40, 0.8)),
    A.sun(W - 64, 124)];
}
const near = () => A.layer([], 'near', W, H, A.flower(30, H - 30), A.flower(48, H - 20, '#FFE27A'), A.flower(320, H - 28, '#B9A3F0'), A.butterfly(300, HORIZON + 120));

export function render(ctx) {
  leave();
  const sess = (ctx.session.rides = ctx.session.rides || {}); sess.seen = sess.seen || {}; sess.mud = sess.mud || {}; // the park's button may have set only .from
  const back = R.backTo(sess.from);
  const hash = location.hash, ok = R.parseRide(hash); // allowlists only (Security): an unknown ride lands on the pet's park, an unknown pet on the picker
  if (!ok || !Object.hasOwn(BUILT, ok.scene)) { const to = R.fallbackTo(hash, sess.from); Promise.resolve().then(() => (ctx.replace ? ctx.replace(to) : ctx.go(to))); return h('main', { class: 'kid rides', 'data-game': 'rides' }); }
  const { scene, pet } = ok;
  const stage = h('div', { class: 'rd-stage' });
  const main = h('main', { class: 'kid rides', 'data-game': 'rides', 'data-scene': scene, 'data-pet': pet, 'data-phase': 'idle' },
    h('div', { class: 'topbar' }, h('button', { type: 'button', class: 'icon-btn home-btn rd-back', 'aria-label': 'Back', onclick: () => ctx.go(back) }, backArt()), h('span', { class: 'spacer grow' }), dadButton(ctx)),
    stage);
  const fx = (id) => { if (ctx.audio) ctx.audio.fx([id]); };
  const first = !sess.seen[scene]; sess.seen[scene] = true; MUD = sess.mud;
  const zone = /\/water$/.test(sess.from || '') ? 'water' : R.SCENES[scene].park;
  ctx.question = { dadText: `Ride close-up: ${scene}.` };
  BUILT[scene]({ ctx, main, stage, pet, sess, fx, first, reduced: reducedMotion(), zone, scene });
  return main;
}

// draw the scene SVG into the stage again (kept small: each change redraws the scene, it is one SVG)
function paint(stage, kids, defs) {
  stage.replaceChildren(drawing(['g', {}, ['defs', {}, ...defs], ...kids], { box: `0 0 ${W} ${H}`, cls: 'rd-svg' }));
  stage.firstChild.setAttribute('preserveAspectRatio', 'xMidYMax meet'); // the whole 360x780 frame fits its container; the backdrop bleeds past it
  return stage.firstChild;
}
// SVG units from a pointer event
const svgPt = (svg, ev) => { const m = svg.getScreenCTM(); if (!m) return [0, 0]; const q = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse()); return [q.x, q.y]; };
const loop = (step) => { let t0 = 0; const f = (t) => { const dt = t0 ? Math.min(0.05, (t - t0) / 1000) : 0; t0 = t; if (step(dt) !== false) raf = requestAnimationFrame(f); else raf = 0; }; raf = requestAnimationFrame(f); };

// ---- the slide: drag the pet up the ladder, tap it at the top to slide down ----------------------------------------
// the camera (Design r1): horizon at 30 %, the ladder top near 40 %, the slide about 70 % of the frame, the pet about 30 % wide
const SX0 = 130, SY = 700, PS = 0.65, K0 = 1.62; // Design r4: the whole ride down stays in frame
// how each pet rides down (FINAL, by id): everyone on the way down tilts to the chute, ears and tail blown back, mouth open
function slidePose(act, ph) {
  const o = { crown: true };
  if (act === 'holdBall') { o.toy = 'ballBlue'; o.toyAt = 'mouth'; }
  if (act === 'zoomFrisbee') { o.toy = 'frisbeeGreen'; o.toyAt = 'mouth'; }
  if (act === 'kingTail') { o.chinUp = true; if (ph === 'after') o.tail = 'flick'; }
  if (ph === 'after' && act === 'bunnyPile') return { ...o, mouth: 'open', shut: true };
  if (ph !== 'down') return o;
  const go = { ...o, ears: 'back', tail: 'back', mouth: o.toy ? undefined : 'open' };
  if (act === 'curlSpin') return { ...go, curl: true, shut: true, mouth: undefined };
  if (act === 'slowCalm') return { ...go, half: true, mouth: undefined, ears: undefined };
  if (act === 'kingTail') return { ...go, mouth: undefined, tail: undefined };
  return go;
}
const SPEED = { slowCalm: 0.35, zoomFrisbee: 1.1, headfirst: 0.9, drift: 0.35, cannonball: 0.9 };
const LEAN = { headfirst: 25, bellyFlop: 25 }; // headfirst lies along the chute, head downhill
function slideScene({ main, stage, pet, fx, first, reduced, scene = 'slide' }) {
  const curly = scene === 'curly'; const G0 = curly ? A.CURLY : A.SLIDE;
  const SX = curly ? 128 : SX0, K = curly ? 1.28 : K0; // the curly slide a little further back so the tube, the pool and the landing stay in frame
  const act = R.actOf(scene, pet); const who = R.riders(scene, pet);
  let ph = 'idle', t = 0, spin = 0, ghost = first && !reduced;
  const at = (tt = t) => {
    if (ph === 'idle' || ph === 'climb') { const [[x0, y0], [x1, y1]] = G0.ladder; return [x0 + (x1 - x0) * tt + 9, y0 + (y1 - y0) * tt, 0]; } // 20 px in from the edge (Design r2)
    if (ph === 'top') return [...G0.top, 0];
    const u = Math.max(0, Math.min(1, tt)); const [x0, y] = G0.path(u); if (ph === 'after' && curly) return [...G0.land, 0]; const x = ph === 'after' ? x0 - 16 : x0; return [x, y, ph === 'after' ? 0 : G0.angle(u) * (curly ? 1 : 0.55)];
  };
  const one = (id, x, y, ang, o, extra = []) => ['g', { class: 'rd-rider', 'data-act': act, 'data-pet-id': id, transform: `translate(${x} ${y}) rotate(${ang + (ph === 'down' ? LEAN[act] || 0 : 0)}) scale(${PS})` },
    ph === 'down' ? A.speedLines() : null, ['g', { transform: `rotate(${spin} 0 -40)` }, pp(id, o)], ...extra].filter(Boolean);
  function draw() {
    main.dataset.phase = ph;
    const defs = []; const [x, y, ang] = at();
    const o = curly ? curlyPose(act, ph) : slidePose(act, ph);
    let riders;
    if (who.length > 1 && ph === 'down') { const [x2, y2, a2] = at(t - 0.12); riders = [one(who[1], x2, y2, a2, o), one(who[0], x, y, ang, o)]; } // two bunnies hop down in a row
    else if (who.length > 1 && ph === 'after') riders = [one(who[0], x, y, 0, o), ['g', { transform: `translate(${x + 21 * PS} ${y - 30 * PS}) rotate(-14) scale(${PS})` }, pp(who[1], o)], ['g', { transform: `translate(${x} ${y}) scale(${PS})` }, A.stars(3)]]; // the giggle pile
    else if (who.length > 1) riders = [one(who[1], x + 24, y + 2, ang, o), one(who[0], x, y, ang, o)]; // the pair climbs and waits together
    else riders = [one(who[0], x, y, ang, o, ph === 'after' && act === 'kingTail' ? [A.stars(2)] : [])];
    const ring = ph === 'idle' || ph === 'climb' ? ['g', { transform: `translate(${x} ${y}) scale(${PS})` }, A.grabRing(48)] : ph === 'top' ? ['g', { transform: `translate(${x} ${y}) scale(${PS})` }, ['circle', { class: 'r-tap', cx: 0, cy: -50, r: 48, fill: 'none', stroke: '#FFF3A8', 'stroke-width': 3 }]] : null;
    const hand = ghost && ph === 'idle' ? ['g', { class: 'r-cue', transform: `translate(${x + 52} ${y - 30}) scale(0.55)` }, A.ghostHand('M30 -10V-200m-12 14l12 -14l12 14')] : null;
    const [plx, ply, plw, plh] = G0.pool || [0, 0, 0, 0]; // the splash ring sits on the water top; the water's front covers the pet's legs
    const wet = curly && ph === 'after' ? [A.water(plx, y - 10, plw, ply + plh - (y - 10)), ['g', { transform: `translate(${x} ${ply + 4})` }, A.splash(act === 'cannonball' || act === 'bellyFlop' ? 1.2 : 0.7)]] : [];
    const svg = paint(stage, [...(curly ? poolside(defs) : park(defs)), ['g', { transform: `translate(${SX} ${SY}) scale(${K})` }, curly ? A.pool(plx, ply, plw, plh) : null, curly ? A.curlySlide(defs, 0, 0) : A.slide(defs, 0, 0), ...(curly && ph === 'down' ? A.inTube(defs, riders) : riders), ...wet, ring, hand].filter(Boolean), curly ? null : near()].filter(Boolean), defs);
    return svg;
  }
  let svg = draw(), dragging = false, moved = false; stage.onpointerdown = (e) => down(e);
  const goDown = () => { ph = 'down'; t = 0; fx(act === 'headfirst' ? 'fx-yip' : 'fx-zoom');
    loop((dt) => { t += dt * (SPEED[act] || 0.6); if (!curly && act === 'curlSpin') spin += dt * 540; if (t >= 1) { t = 1; spin = 0; ph = 'after'; fx(act === 'bunnyPile' ? 'fx-giggle' : R.TRAIT[pet].sound); svg = draw(); return false; } svg = draw(); return true; }); };
  // a tap on the pet or the slide: it climbs the ladder by itself, then slides down (a drag up the ladder still works)
  const climbUp = () => { ph = 'climb'; loop((dt) => { t = Math.min(1, t + dt * 1.1); if (t >= 1) { ph = 'top'; t = 0; fx(R.TRAIT[pet].sound); svg = draw(); raf = 0; goDown(); return false; } svg = draw(); return true; }); };
  function down(ev) {
    const [qx, qy] = svgPt(svg, ev); const px = (qx - SX) / K, py = (qy - SY) / K; const [x, y] = at();
    const onPet = Math.hypot(px - x, py - (y - 50 * PS)) <= 56, onSlide = px > -80 && px < 90 && py > -210 && py < 12;
    if (raf || (!onPet && !onSlide)) { if (ph === 'after' && !raf) { ph = 'idle'; t = 0; svg = draw(); } return; }
    if (ph === 'idle' || ph === 'climb') { ghost = false; dragging = onPet; moved = false; try { stage.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
      stage.onpointermove = (e) => { if (!dragging) return; const qy2 = (svgPt(svg, e)[1] - SY) / K; const [[, y0], [, y1]] = G0.ladder; const t2 = Math.max(0, Math.min(1, (qy2 - y0) / (y1 - y0)));
        if (t2 < t + 0.04 && !moved) return; moved = true; ph = 'climb'; t = Math.max(t, t2);
        if (t >= 0.97) { dragging = false; ph = 'top'; t = 0; fx(R.TRAIT[pet].sound); } svg = draw(); };
      stage.onpointerup = () => { dragging = false; if (!moved && (ph === 'idle' || ph === 'climb') && !raf) climbUp(); moved = false; }; return; }
    if (ph === 'top') { goDown(); return; }
    if (ph === 'after') { ph = 'idle'; t = 0; svg = draw(); }
  }
  // test/screenshot hook: set a phase directly
  main.rideSet = (p, tt = 0) => { leave(); ph = p; t = tt; ghost = p === 'ghost'; if (ghost) ph = 'idle'; spin = p === 'down' && !curly && act === 'curlSpin' ? 200 : 0; svg = draw(); };
}

// ---- the swings: tap or flick the seat to push higher; the jumpers hop off at the top and land with a puff ----------
function swingPose(act, ph) {
  const o = { crown: true };
  if (act === 'barkUp') return { ...o, mouth: 'open' };
  if (act === 'curlCozy') return { ...o, shut: true };
  if (act === 'tailWave') return { ...o, chinUp: true, tail: 'flick' };
  if (act === 'gentle') return { ...o, half: true };
  if (act === 'jumpOff' && ph === 'jump') return { ...o, pawsUp: true, mouth: 'open', ears: 'out' };
  return { ...o, mouth: ph === 'swing' || ph === 'after' ? 'open' : undefined };
}
const WX = 180, WY = 730, WK = 1.75, WS = 0.8, VIS = 0.62; // VIS: the seat's drawn angle (Design r4: the high point stays in frame) // the swing set 2x up close; the seated pet about 30 % of the frame wide
function swingScene({ main, stage, pet, fx, first, reduced }) {
  const act = R.actOf('swings', pet); const who = R.riders('swings', pet);
  let amp = 0, ph = 'idle', phase = 0, jump = 0, land = 1, ghost = first && !reduced, from = [WX, WY - 300];
  const seatAt = (a) => { const r = (a * VIS * Math.PI) / 180; return [WX - Math.sin(r) * 160 * WK, WY - 218 * WK + Math.cos(r) * 160 * WK]; };
  const TO = [WX + 58, WY + 40], LS = 0.75; // Design r3: lands whole inside the frame, ~40 px left of the right post, low and a bit smaller so it sits below the seat's sweep
  function draw() {
    main.dataset.phase = ph; main.dataset.amp = String(Math.round(amp));
    const defs = []; const a = amp * Math.sin(phase) * VIS;
    const gone = act === 'jumpOff' && (ph === 'jump' || ph === 'after');
    const seat = gone ? [] : who.map((id, i) => ['g', { class: 'rd-rider', 'data-act': act, transform: `translate(${(i - (who.length - 1) / 2) * 30} 0) scale(${who.length > 1 ? WS * 0.8 : WS})` }, pp(id, swingPose(act, ph))]);
    let jumper = null;
    if (gone) {
      const k = Math.min(1, jump); const x = from[0] + (TO[0] - from[0]) * k, y = from[1] + (TO[1] - from[1]) * k - Math.sin(k * Math.PI) * 110;
      const sq = ph === 'after' ? 1 - 0.18 * Math.sin(Math.min(1, land) * Math.PI) : 1; // the landing bounce
      jumper = ['g', { class: 'rd-rider', 'data-act': act, transform: `translate(${x} ${y})` }, ph === 'after' && land < 1 ? ['g', { transform: `scale(${WS * WK})` }, A.dust(land)] : null,
        ['g', { transform: `scale(${WS * WK * (1 - (1 - LS) * k) * (2 - sq)} ${WS * WK * (1 - (1 - LS) * k) * sq})` }, pp(pet, swingPose(act, ph === 'after' ? 'after' : 'jump'))]].filter(Boolean);
    }
    const ring = ph === 'idle' ? A.grabRing(34, -40) : null;
    const hand = ghost && ph === 'idle' ? ['g', { transform: 'translate(0 -40) scale(0.6)' }, A.ghostHand('M40 30q50 -20 60 -70m-16 4l16 -4l2 16')] : null;
    const svg = paint(stage, [...park(defs), ['g', { transform: `translate(${WX} ${WY}) scale(${WK}) translate(${-WX} ${-WY})` }, A.swings(defs, WX, WY, a, [ring, ...seat, hand].filter(Boolean))], jumper, near()].filter(Boolean), defs);
    return svg;
  }
  let svg = draw(); stage.onpointerdown = (e) => down(e);
  function down(ev) {
    const [px, py] = svgPt(svg, ev);
    if (ph === 'after' || ph === 'jump') { if (ph === 'after' && amp < 0.5 && land >= 1) { ph = 'idle'; amp = 0; jump = 0; svg = draw(); } return; }
    if (Math.abs(px - WX) > 170 || py < WY - 470 || py > WY + 20) return; // anywhere on the swing set pushes (the seat moves)
    ghost = false; amp = Math.max(22, R.push(amp)); fx('fx-boing'); // the first push already swings well
    if (ph === 'idle') { ph = 'swing'; loop(step); }
  }
  function step(dt) {
    if (ph === 'swing') { phase += dt * 3.2; amp = Math.max(0, amp - dt * 0.9);
      if (R.jumper(pet) && amp >= R.SWING_MAX - 4 && Math.sin(phase) > -0.5 && Math.sin(phase) < -0.38 && Math.cos(phase) > 0) { ph = 'jump'; jump = 0; from = seatAt(amp * Math.sin(phase)); fx('fx-zoom'); }
      if (amp <= 0.2) { ph = 'idle'; amp = 0; svg = draw(); return false; } }
    else if (ph === 'jump') { phase += dt * 3.2; amp = Math.max(0, amp - dt * R.SWING_MAX); jump += dt * 1.1; if (jump >= 1) { jump = 1; ph = 'after'; land = 0; fx('fx-giggle'); } }
    else if (ph === 'after') { phase += dt * 3.2; amp = Math.max(0, amp - dt * R.SWING_MAX); land = Math.min(1, land + dt / 0.6); // the empty seat eases to rest in about a second
      if (amp <= 0 && land >= 1) { svg = draw(); return false; } }
    svg = draw(); return true;
  }
  main.rideSet = (p, v = 0, kk = null) => { leave(); ph = p; ghost = false; if (p === 'ghost') { ph = 'idle'; ghost = true; } if (p === 'swing') { amp = v || R.SWING_MAX; phase = kk == null ? -Math.PI / 2 : kk; }
    if (p === 'jump') { amp = R.SWING_MAX / 2; phase = -Math.PI / 2; from = seatAt(-R.SWING_MAX * 0.45); jump = v || 0.5; }
    if (p === 'after') { from = seatAt(-R.SWING_MAX * 0.45); jump = 1; amp = v ? R.SWING_MAX * 0.4 : 0; phase = -Math.PI / 2; land = v || 1; } svg = draw(); };
}

// ---- the other backdrops: the fair (coaster park) and the poolside (water park) --------------------------------------
function fair(defs) {
  return [A.sky(defs, W, H), A.cloud(60, 80, 0.8), A.cloud(210, 130, 0.6), A.bird(150, 70),
    A.layer(defs, 'far', W, HORIZON, A.ferris(defs, 70, HORIZON, 1.3), A.tent(defs, 220, HORIZON, '#4AA3DF'), A.tent(defs, 330, HORIZON), A.balloon(270, 120, '#E5484D'), A.balloon(300, 100, '#4FB35A')),
    A.ground(defs, W, HORIZON, H),
    A.layer(defs, 'mid', W, HORIZON + 40, A.tent(defs, 30, HORIZON + 40, '#F28C28'), A.bush(defs, 160, HORIZON + 40), A.tree(defs, 330, HORIZON + 40, 0.8), A.bench(defs, 240, HORIZON + 40)),
    A.bunting(HORIZON - 70), A.sun(W - 64, 124)];
}
function poolside(defs) {
  return [A.sky(defs, W, H), A.cloud(70, 80, 0.8), A.cloud(220, 130, 0.6), A.bird(150, 66),
    A.layer(defs, 'far', W, HORIZON, A.tree(defs, 30, HORIZON, 1.2), A.umbrella(defs, 160, HORIZON, '#E5484D'), A.tree(defs, 320, HORIZON, 1.3), A.fence(0, HORIZON, W)),
    A.deck(defs, W, HORIZON, H),
    A.layer(defs, 'mid', W, HORIZON + 40, A.umbrella(defs, 40, HORIZON + 40), A.lounger(defs, 150, HORIZON + 40), A.umbrella(defs, 300, HORIZON + 40, '#4AA3DF'), A.bush(defs, 400, HORIZON + 40)),
    A.sun(W - 64, 124)];
}
const back = (zone, defs) => (zone === 'water' ? poolside(defs) : zone === 'coaster' ? fair(defs) : park(defs));
// the curly slide (water park), the slide's template with a pool at the bottom
function curlyPose(act, ph) {
  const o = {};
  if (act === 'ballUp') { o.toy = 'ballBlue'; o.toyAt = ph === 'after' ? 'up' : 'mouth'; if (ph === 'after') o.pawsUp = true; }
  if (act === 'barelyWet') o.chinUp = true;
  if (ph === 'after') {
    if (act === 'barelyWet') return { ...o, tail: 'flick' };
    if (act === 'littleWave') return { ...o, wet: true, pawsUp: true, mouth: 'open' };
    if (act === 'drift') return { ...o, wet: true, half: true };
    return { ...o, wet: true, mouth: 'open', ears: act === 'spinPopUp' ? 'out' : undefined };
  }
  if (ph !== 'down') return o;
  const go = { ...o, ears: 'back', tail: 'back', mouth: o.toy ? undefined : 'open' };
  if (act === 'cannonball') return { ...go, curl: true, shut: true };
  if (act === 'drift') return { ...go, half: true, mouth: undefined, ears: undefined };
  if (act === 'barelyWet') return { ...go, mouth: undefined, tail: undefined };
  return go;
}
// a ghost hand once per scene: a see-through hand on the thing to move, a pulsing ring, a drag arrow
const ghostAt = (x, y, arrow, s = 1) => ['g', { transform: `translate(${x} ${y}) scale(${s})` }, A.ghostHand(arrow)];
const tapRing = (x, y, r = 30) => ['circle', { class: 'r-tap', cx: x, cy: y, r, fill: 'none', stroke: '#FFF3A8', 'stroke-width': 3 }];
const dragRing = (x, y, s, r = 48) => ['g', { transform: `translate(${x} ${y}) scale(${s})` }, A.grabRing(r)];
const near2 = (x, y, px, py, r) => Math.hypot(px - x, py - y) <= r;

// ---- merry-go-round (park) and teacups (coaster park): swipe across to spin, faster or slower; it slows by itself ----
const SPIN_POSE = {
  hangHowl: (ph) => (ph === 'spin' ? { pawsUp: true, mouth: 'open', ears: 'out' } : {}), snuggleMiddle: () => ({ shut: true }), ballRolls: () => ({}),
  chinRest: (ph) => ({ half: true, mouth: ph === 'spin' ? 'open' : undefined }), earsOut: (ph) => (ph === 'spin' ? { ears: 'out', mouth: 'open' } : {}),
  ownsCenter: () => ({ chinUp: true }), bounceDizzy: (ph) => (ph === 'after' ? { shut: true, mouth: 'open' } : { mouth: 'open' }),
};
function spinScene({ main, stage, pet, fx, first, reduced, scene, zone }) {
  const cups = scene === 'teacups'; const act = R.actOf(scene, pet); const who = R.riders(scene, pet);
  const CX = 180, CY = 640;
  let rot = 0, vel = 0, ph = 'idle', ghost = first && !reduced, last = null, wob = 0;
  const pose = (id) => { const o = { ...(SPIN_POSE[act] ? SPIN_POSE[act](ph) : {}) }; if (ph === 'after') o.tilt = Math.sin(wob * 9) * 8 * Math.max(0, 1 - wob); return o; };
  const center = act === 'snuggleMiddle';
  function riderG(id, i, s) {
    const b = act === 'bounceDizzy' && ph === 'spin' ? -Math.abs(Math.sin((rot + i * 90) * 0.05)) * 18 : 0;
    return ['g', { class: 'rd-rider', 'data-act': act, 'data-pet-id': id, transform: `translate(${(i - (who.length - 1) / 2) * 38} ${b}) scale(${s})` }, pp(id, pose(id)),
      ph === 'after' && act === 'bounceDizzy' ? A.stars(3) : null].filter(Boolean);
  }
  function draw() {
    main.dataset.phase = ph; main.dataset.spin = String(Math.round(Math.abs(vel)));
    const defs = []; let ride;
    if (cups) {
      const a = (rot * 0.6 * Math.PI) / 180; const x = CX - 6 + Math.cos(a) * 46, y = CY + Math.sin(a) * 16;
      const kids = who.map((id, i) => ['g', { transform: `translate(0 -30) rotate(${Math.sin(rot / 40) * 6})` }, riderG(id, i, who.length > 1 ? 0.62 : 0.72)]);
      ride = [A.teapot(defs, 180, 470, 1.1), ['g', { transform: `translate(${x} ${y}) scale(1.35)` }, A.teacup(defs, '#F28CA0', kids)]];
    } else {
      const a = ((rot + 135) * Math.PI) / 180; const r = center ? 34 : 84; /* the ears stay in frame all the way round (Design r4) */ const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.25 - 8;
      const rider = ['g', { transform: `translate(${x} ${y})` }, ...who.map((id, i) => riderG(id, i, who.length > 1 ? 0.8 : 0.95))];
      const b = ((rot * 1.6 + 200) * Math.PI) / 180; const ball = act === 'ballRolls' ? [Math.sin(b), ['g', { transform: `translate(${Math.cos(b) * 128} ${Math.sin(b) * 32 - 8}) scale(1.2)` }, A.TOY.ballBlue(defs)]] : null;
      ride = [['g', { transform: `translate(${CX} ${CY}) scale(1.2)` }, A.merry(defs, 0, 0, rot, [[2, rider], ball].filter(Boolean))]]; // the rider sits up on the deck, drawn over the low bars and the pole (never a pole across a face)
    }
    const hint = ph === 'idle' ? [ghost ? ghostAt(CX - 70, CY - 40, 'M0 0h150m-14 -12l14 12l-14 12', 0.9) : null, ['path', { class: 'r-tap', d: `M${CX - 120} ${CY + 70}q120 30 240 0`, fill: 'none', stroke: '#FFF3A8', 'stroke-width': 4, 'stroke-dasharray': '10 8' }]] : [];
    paint(stage, [...back(zone, defs), ...ride, ...hint.filter(Boolean), zone === 'park' ? near() : null].filter(Boolean), defs);
  }
  draw();
  let tap = false; stage.onpointerdown = (ev) => { ghost = false; if (ph === 'after') { ph = 'idle'; wob = 0; draw(); return; } last = svgPt(stage.firstChild, ev); tap = ph === 'idle'; try { stage.setPointerCapture(ev.pointerId); } catch { /* ignore */ } };
  stage.onpointermove = (ev) => { if (!last) return; const q = svgPt(stage.firstChild, ev); const dx = q[0] - last[0]; last = q; if (Math.abs(dx) > 2) tap = false;
    vel = Math.sign(vel + dx) * R.spinSpeed(Math.abs(vel + dx * 6) / 360) * 360; if (ph !== 'spin' && Math.abs(vel) > 20) { ph = 'spin'; fx(R.TRAIT[pet].sound); go(); } };
  stage.onpointerup = () => { last = null; if (tap && ph === 'idle') { vel = 300; ph = 'spin'; fx(R.TRAIT[pet].sound); go(); } tap = false; }; // a single tap spins it too
  const go = () => { if (!raf) loop((dt) => { rot += vel * dt; vel *= Math.max(0, 1 - 0.5 * dt);
    if (ph === 'spin' && Math.abs(vel) < 12 && !last) { ph = 'after'; wob = 0; vel = 0; fx(act === 'bounceDizzy' ? 'fx-giggle' : R.TRAIT[pet].sound); }
    if (ph === 'after') { wob += dt; if (wob >= 1) { draw(); return false; } } draw(); return true; }); };
  main.rideSet = (p, v = 0, kk = null) => { leave(); ph = p; ghost = p === 'ghost'; if (ghost) ph = 'idle'; if (p === 'spin') { vel = 400; rot = v || 30; } if (p === 'after') { vel = 0; wob = v || 0.15; } if (kk != null) wob = kk; draw(); };
}

// ---- scooter (park): she steers the pet along the path; puddles splat mud that stays; fruit and veg spin it out ----
const SC_POSE = { aimPuddles: { mouth: 'open' }, zipQuiet: { ears: 'back' }, grabRock: { toy: 'rock', toyAt: 'mouth' }, slowSteady: { half: true }, leanEars: { ears: 'back', mouth: 'open' }, swerveMud: { chinUp: true }, zoom: { ears: 'back', mouth: 'open' }, sniffFlowers: {} };
function scooterScene({ main, stage, pet, fx, first, reduced }) {
  const act = R.actOf('scooter', pet);
  let p = 0, l = 0.5, ph = 'idle', ghost = first && !reduced, spin = 0, spinning = null, hit = new Set(), huff = 0, drag = false;
  const Y0 = 742, Y1 = 330; const yOf = (q) => Y0 - q * (Y0 - Y1); const wOf = (q) => 280 - q * 170; const xOf = (q, ll) => 180 + (ll - 0.5) * wOf(q); const sOf = (q) => 1 - q * 0.5;
  function draw() {
    main.dataset.phase = ph; main.dataset.mud = String(R.mudOf(MUD, pet));
    const defs = []; const items = R.PATH.map((it, i) => { const [k, q, ll] = it; const s = sOf(q);
      return ['g', { class: `rd-item${hit.has(i) ? ' hit' : ''}`, 'data-item': k, transform: `translate(${xOf(q, ll)} ${yOf(q)}) scale(${s * (k === 'puddle' ? 1 : 1.6)})` }, k === 'puddle' ? A.puddle(0, 0) : A.FOOD[k]()]; }).reverse();
    const o = { ...SC_POSE[act] }; if (huff > 0) { o.mouth = 'open'; o.chinUp = true; } if (ph === 'after') { o.mouth = 'open'; o.pawsUp = act !== 'grabRock'; }
    if (act === 'sniffFlowers') o.tilt = Math.sin(p * 30) * 8;
    const s = sOf(p) * 1.55; const x = xOf(p, l), y = yOf(p);
    const rider = ['g', { class: 'rd-rider', 'data-act': act, transform: `translate(${x} ${y}) scale(${s}) rotate(${spin})` }, A.scooter(defs, [['g', { transform: 'scale(0.62)' }, pp(pet, o)]]),
      spinning ? A.stars(3) : null, ph === 'idle' || ph === 'ride' ? A.grabRing(52, -60) : null].filter(Boolean);
    paint(stage, [...park(defs), A.path(defs, Y1 - 40, H + 20, 90, 320), ...items, rider, ghost && ph === 'idle' ? ghostAt(x, y - 60, 'M0 -10V-160m-12 14l12 -14l12 14', 0.8) : null, near()].filter(Boolean), defs);
  }
  draw();
  const anim = () => { if (!raf) loop((dt) => { let more = false;
    if (spinning) { spinning.t += dt / 0.8; spin = 360 * Math.min(1, spinning.t); more = true; if (spinning.t >= 1) { spinning = null; spin = 0; } }
    if (huff > 0) { huff = Math.max(0, huff - dt); more = true; } draw(); return more; }); };
  stage.onpointerdown = (ev) => { const [qx, qy] = svgPt(stage.firstChild, ev); ghost = false;
    if (ph === 'after') { ph = 'idle'; p = 0; l = 0.5; hit = new Set(); draw(); return; }
    if (raf && auto) return; tapAt = [qx, qy]; if (!near2(xOf(p, l), yOf(p) - 50 * sOf(p), qx, qy, 70)) return; drag = true; try { stage.setPointerCapture(ev.pointerId); } catch { /* ignore */ } };
  let tapAt = null, auto = false;
  const step = () => { R.PATH.forEach((it, i) => { if (hit.has(i) || !R.hits(p, l, it)) return; hit.add(i);
      if (it[0] === 'puddle') { R.splat(MUD, pet); fx('fx-splash'); if (act === 'swerveMud') { huff = 0.8; fx('fx-meow'); } anim(); }
      else { const so = R.spinOut(it[0]); spinning = { t: 0 }; drag = false; fx(so.sound); anim(); } });
    if (p >= 0.97) { ph = 'after'; drag = false; fx(R.TRAIT[pet].sound); }
    draw(); };
  stage.onpointermove = (ev) => { if (!drag || spinning) return; const [qx, qy] = svgPt(stage.firstChild, ev); if (tapAt && Math.hypot(qx - tapAt[0], qy - tapAt[1]) < 8) return; tapAt = null; ph = 'ride';
    p = Math.max(0, Math.min(1, (Y0 - (qy + 30)) / (Y0 - Y1))); l = Math.max(0.05, Math.min(0.95, (qx - 180) / wOf(p) + 0.5)); step(); };
  stage.onpointerup = () => { drag = false; if (!tapAt || ph === 'after') return; tapAt = null; ph = 'ride'; auto = true; // a single tap rides it up the path by itself
    loop((dt) => { if (!spinning) p = Math.min(1, p + dt * 0.3); if (spinning) { spinning.t += dt / 0.8; spin = 360 * Math.min(1, spinning.t); if (spinning.t >= 1) { spinning = null; spin = 0; } } huff = Math.max(0, huff - dt);
      step(); if (ph === 'after') { auto = false; return false; } return true; }); };
  main.rideSet = (ph2, v = 0) => { leave(); ghost = ph2 === 'ghost'; ph = ghost ? 'idle' : ph2;
    if (ph2 === 'ride') { p = v || 0.3; l = 0.42; } if (ph2 === 'spin') { ph = 'ride'; p = 0.42; l = 0.62; spinning = { t: 0.4 }; spin = 144; } if (ph2 === 'after') { p = 1; l = 0.5; } draw(); };
}

// ---- splash pad (park and water park): tap a nozzle to pop its jet; drag the pet into a jet; mud washes off in sparkles
const SP_POSE = { tiptoeDry: (on) => (on ? { mouth: 'open', ears: 'out' } : {}), launchWiggle: (on) => (on ? { pawsUp: true, mouth: 'open' } : {}), bounceBall: () => ({ toy: 'ballBlue', toyAt: 'up', pawsUp: true }),
  lieMist: () => ({ half: true }), snapStreams: (on) => ({ mouth: on ? 'open' : undefined }), hopJets: () => ({ chinUp: true }), startleHop: (on) => (on ? { pawsUp: true, mouth: 'open', ears: 'back' } : {}) };
function splashScene({ main, stage, pet, fx, first, reduced, zone }) {
  const act = R.actOf('splash', pet); const who = R.riders('splash', pet);
  const NZ = [[100, 562], [260, 562], [180, 548], [80, 640], [280, 640]]; // the middle nozzle at the back, never under the pet (Design r4)
  let px = 180, py = 700, jets = NZ.map(() => 0), ph = 'idle', ghost = first && !reduced, wet = false, sparkle = 0, drag = false, k = 0;
  if (!R.mudOf(MUD, pet)) for (let i = 0; i < 3; i++) R.splat(MUD, pet); // Design: the pet comes to the splash pad muddy
  const reach = (i) => Math.min(1, (1 - jets[i]) * 5 + 0.05); // how far a popped jet's arc has got (it lands on the pet)
  const onJet = () => NZ.findIndex((_, i) => jets[i] > 0 && reach(i) >= 1); // every jet arcs onto the pet
  function draw() {
    main.dataset.phase = ph; main.dataset.mud = String(R.mudOf(MUD, pet));
    const defs = []; const live = jets.some((j) => j > 0); const j = onJet();
    const o = { ...SP_POSE[act](live), wet }; if (ph === 'after' && act === 'tiptoeDry') o.tilt = Math.sin(k * 20) * 10;
    const lift = j >= 0 && act === 'launchWiggle' ? 60 * jets[j] : act === 'hopJets' && live ? 24 * Math.abs(Math.sin(k * 6)) : 0;
    const pad = [A.splashPad(defs, 180, 600, 160, 66), ...NZ.map(([x, y], i) => ['g', { class: 'rd-nozzle', 'data-n': String(i), transform: `translate(${x} ${y})` }, A.nozzle(jets[i] > 0), ph === 'idle' && !jets[i] ? tapRing(0, 0, 24) : null].filter(Boolean))];
    const arcs = NZ.map(([x, y], i) => (jets[i] > 0 ? ['g', { transform: `translate(${x} ${y})` }, A.jetTo(px - x, py - lift - 58 - y, reach(i), k)] : null)).filter(Boolean);
    const rider = ['g', { class: 'rd-rider', 'data-act': act, transform: `translate(${px} ${py - lift})` }, ...who.map((id, i) => ['g', { transform: `translate(${(i - (who.length - 1) / 2) * 64} 0) scale(1)` }, pp(id, i ? { ...o } : o)]),
      sparkle > 0 ? ['g', { transform: 'scale(1.4)', opacity: String(Math.min(1, sparkle)) }, A.sparkles(6)] : null, ph !== 'after' ? dragRing(0, 0, 1, 52) : null].filter(Boolean);
    const sorted = py > 640 ? [...pad, rider] : [pad[0], ...pad.slice(1).filter((_, i) => NZ[i][1] <= py), rider, ...pad.slice(1).filter((_, i) => NZ[i][1] > py)];
    paint(stage, [...back(zone, defs), ...sorted, ...arcs, ghost && ph === 'idle' ? ghostAt(NZ[2][0], NZ[2][1], '', 0.8) : null, zone === 'park' ? near() : null].filter(Boolean), defs);
  }
  draw();
  const run = () => { if (!raf) loop((dt) => { k += dt; jets = jets.map((v) => Math.max(0, v - dt / 1.2)); sparkle = Math.max(0, sparkle - dt);
    const j = onJet(); if (j >= 0) { wet = true; if (R.mudOf(MUD, pet)) { R.wash(MUD, pet); sparkle = 1.2; fx('fx-chime'); } }
    if (!jets.some((v) => v > 0) && sparkle <= 0) { if (wet) { ph = 'after'; fx(act === 'startleHop' ? 'fx-giggle' : R.TRAIT[pet].sound); } draw(); return false; } draw(); return true; }); };
  const pop = (i) => { jets[i] = 1; ph = 'spray'; fx('fx-splash'); draw(); run(); };
  stage.onpointerdown = (ev) => { const [qx, qy] = svgPt(stage.firstChild, ev); ghost = false;
    const n = NZ.findIndex(([x, y]) => near2(x, y, qx, qy, 32)); if (n >= 0) { pop(n); return; } // a jet tap wins, even beside the pet
    if (near2(px, py - 40, qx, qy, 60)) { drag = true; try { stage.setPointerCapture(ev.pointerId); } catch { /* ignore */ } } };
  stage.onpointermove = (ev) => { if (!drag) return; const [qx, qy] = svgPt(stage.firstChild, ev); px = Math.max(40, Math.min(320, qx)); py = Math.max(540, Math.min(740, qy + 40)); if (!raf) draw(); };
  stage.onpointerup = () => { drag = false; };
  main.rideSet = (p, v = 0, kk = null) => { leave(); ghost = p === 'ghost'; ph = ghost ? 'idle' : p; jets = NZ.map(() => 0); sparkle = 0;
    if (p === 'spray') { jets[3] = Math.min(1, 0.8 + (kk || 0) * 0.01); px = 180; py = 700; wet = true; if (R.mudOf(MUD, pet)) R.wash(MUD, pet); sparkle = v || 0.8; k = 0.3; } if (p === 'after') { wet = true; px = 180; py = 690; } if (p === 'idle') { px = 180; py = 700; wet = false; } if (kk != null) { k = kk; } draw(); };
  main.ridePop = pop; main.rideMove = (x, y) => { px = x; py = y; draw(); };
}

// ---- dragon coaster (coaster park): tap the car and it rides the whole loop (climb, loop, spin, turn, barrel roll, brake) ----
// the camera stays still with the whole loop in frame; each pet's own action plays on the straight parts, the face otherwise
// simply happy; at the stop it is upright with a happy pose and a small puff
const CO_POSE = { howl: (ph) => (ph === 'ride' ? { mouth: 'O', chinUp: true, tilt: -8 } : { mouth: 'open' }), coverPeek: (ph) => (ph === 'after' ? { mouth: 'open' } : { cover: true }), hugBall: () => ({ toy: 'ballBlue', toyAt: 'paws' }), calmWise: () => ({ half: true }),
  earsFlap: (ph, x) => (ph === 'ride' ? { ears: Math.sin(x / 9) > 0 ? 'out' : 'back', mouth: 'open' } : {}), pawsWave: (ph) => (ph === 'idle' ? {} : { pawsUp: true, mouth: 'open' }), earsBack: (ph) => (ph === 'ride' ? { ears: 'back', mouth: 'open' } : {}) };
const CO_STRAIGHT = ['station', 'spin', 'brake'];
export const busy = () => raf !== 0; // test hook: a ride animation is still running
function coasterScene({ main, stage, pet, fx, first, reduced }) {
  const act = R.actOf('coaster', pet); const who = R.riders('coaster', pet);
  const CS = 1.1, WB = 48 * CS, LIFT = 3 * CS; let t = 0, k = 0, ph = 'idle', ghost = first && !reduced;
  // the car's middle runs WB/2 in from each rail end, so it moves right up to the stop
  const LM = A.RAIL.at(-1)[2], at = (tt) => { const c = A.coasterAt(tt), Wd = WB * Math.max(0.02, Math.abs(c.s)), L = WB / 2 + c.L * (LM - WB) / LM, La = Math.max(0, Math.min(LM - Wd, L - Wd / 2)), [xa, ya] = A.railAt(La); let Lb = La + Wd, xb, yb;
    for (let i = 0; i < 4; i++) { [xb, yb] = A.railAt(Lb); Lb += Wd - Math.hypot(xb - xa, yb - ya); } return { c, Wd, xa, ya, ang: (Math.atan2(yb - ya, xb - xa) * 180) / Math.PI }; }; // both wheels on the rail (closer in a spin)
  const P0 = at(0), P1 = at(A.CO_T);
  function draw() {
    const { c, Wd, xa, ya, ang } = at(t); const run = ph === 'ride' && CO_STRAIGHT.includes(c.seg);
    main.dataset.phase = ph; main.dataset.t = String(Math.round(t * 1000)); main.dataset.seg = ph === 'idle' ? 'station' : c.seg;
    const defs = []; const o = ph === 'ride' && !run ? { mouth: 'open' } : { ...CO_POSE[act](ph, c.L), ...(ph === 'after' ? { mouth: 'open', pawsUp: true } : {}) };
    const sink = ph !== 'ride' ? 0 : 24 * (c.seg === 'turn' || c.seg === 'roll' ? 1 : c.seg === 'spin' ? Math.max(0, c.u * 2 - 1) : c.seg === 'brake' ? Math.max(0, 1 - c.u * 4) : 0); // through the turn and roll the pet sits down in the car, over the rail
    const howl = run && act === 'howl' ? ['g', { class: 'r-howl', transform: 'translate(2 -86)' }, ...[0, 1, 2].map((i) => ['path', { d: `M${i * 9} ${-i * 7}q6 -6 0 -12`, fill: 'none', stroke: '#6A4A2E', 'stroke-width': 2.4, 'stroke-linecap': 'round' }])] : null; // the puppy's howl: song lines from its raised chin
    const kids = who.map((id, i) => ['g', { transform: `translate(${-12 - i * 26} ${sink - 22}) scale(${who.length > 1 ? 0.42 : 0.5})` }, pp(id, o)]).concat(howl ? [howl] : []);
    // after the stop: the puff at once, then (g 0 to 1, about 0.8 s) the car glides back to the station with a little turnaround hop
    const g = ph === 'after' ? Math.max(0, Math.min(1, (k - 0.15) / 0.8)) : 0, e = g * g * (3 - 2 * g), sx = g ? Math.sign(e - 0.5 || 1) * Math.max(0.3, Math.abs(Math.cos(Math.PI * e))) : 1;
    const tr = g ? `translate(${P1.xa + (P0.xa - P1.xa) * e} ${P1.ya + (P0.ya - P1.ya) * e - 30 * Math.sin(Math.PI * e)}) scale(${sx} 1) translate(${WB / 2} ${-LIFT}) scale(${CS}) translate(10 2)`
      : `translate(${xa} ${ya}) rotate(${ang}) scale(1 ${c.f}) translate(${Wd / 2} ${-LIFT}) scale(${c.s * CS} ${CS}) translate(10 2)`;
    const car = ['g', { class: 'rd-rider', 'data-act': act, 'data-run': run ? '1' : '0', 'data-ang': ang.toFixed(1), 'data-spin': c.s.toFixed(3), 'data-roll': c.f.toFixed(3), transform: tr },
      A.dragonCar(defs, kids, true, sink > 12), ph === 'idle' ? A.grabRing(46, -30) : null].filter(Boolean);
    paint(stage, [...fair(defs), A.coasterTrack(defs), car, ph === 'after' && k < 1 ? ['g', { class: 'r-puff', transform: `translate(${P1.xa - 40} ${P1.ya - 20 - k * 20}) scale(${0.7 + k * 0.3})`, opacity: Math.max(0, 1 - k).toFixed(2) }, A.cloud(0, 0)] : null,
      ph === 'after' && k < 1 ? ['g', { transform: `translate(${P1.xa} ${P1.ya})` }, A.stars(3)] : null, ghost && ph === 'idle' ? ghostAt(xa + 20, ya - 40, '', 0.8) : null].filter(Boolean), defs);
  }
  draw();
  const roll = () => { ph = 'ride'; t = 0; k = 0; fx(act === 'howl' ? 'fx-yip' : 'fx-zoom');
    loop((dt) => { if (ph === 'ride') { t = Math.min(A.CO_T, t + dt); if (t >= A.CO_T) { ph = 'after'; k = 0; fx(R.TRAIT[pet].sound); } } else if ((k += dt) >= 0.95) { ph = 'idle'; t = 0; draw(); return false; } draw(); return true; }); };
  // a tap (touch has no hover) anywhere within 56 px of the car starts it, on the press or, failing that, the release; never mid-ride
  const near = (ev) => { const r = stage.querySelector('.rd-rider'); if (!r) return false; const b = r.getBoundingClientRect(); return ev.clientX >= b.left - 56 && ev.clientX <= b.right + 56 && ev.clientY >= b.top - 56 && ev.clientY <= b.bottom + 56; };
  const go = (ev) => { ghost = false; if (raf || ph !== 'idle' || !near(ev)) return; roll(); };
  stage.onpointerdown = go; stage.onpointerup = go;
  main.rideSet = (p, v = 0) => { leave(); ghost = p === 'ghost'; ph = ghost ? 'idle' : p; t = p === 'ride' ? v * A.CO_T : p === 'after' ? A.CO_T : 0; k = p === 'after' ? v : 0.5; draw(); };
  main.rideNear = (x, y) => A.railNear(x, y, A.coasterAt(t).L, 90); main.rideLift = LIFT; main.rideT = A.CO_T; // test hooks: a point's distance to the rail, a wheel centre's height over it, the ride's length
}

// ---- tipping bucket (water park): tap the bucket, a drop at a time; when it is full it tips over the pet; all cheer ----
const BU_POSE = { mouthOpen: (t) => (t ? { mouth: 'open', chinUp: true } : {}), dodgeBack: () => ({ mouth: 'open' }), ballUp: () => ({ toy: 'ballBlue', toyAt: 'up', pawsUp: true }), sitCalm: () => ({ half: true }),
  catchWater: (t) => (t ? { pawsUp: true, mouth: 'open' } : {}), kingDry: () => ({ chinUp: true }), hopCircles: () => ({ mouth: 'open' }) };
function bucketScene({ main, stage, pet, fx, first, reduced }) {
  const act = R.actOf('bucket', pet); const who = R.riders('bucket', pet);
  let n = 0, tip = 0, ph = 'idle', ghost = first && !reduced, wet = false, k = 0, aft = 9;
  function draw() {
    main.dataset.phase = ph; main.dataset.drops = String(n);
    const defs = []; const tipping = ph === 'tip';
    const o = { ...BU_POSE[act](tipping || ph === 'after'), wet }; if (ph === 'after') { o.mouth = 'open'; if (act === 'kingDry') o.tilt = Math.sin(k * 24) * 10; }
    const dodge = act === 'dodgeBack' && tipping && tip < 0.9 ? 70 : 0;
    const riders = who.map((id, i) => { const a = act === 'hopCircles' && ph !== 'idle' ? k * 3 + i * Math.PI : 0; const hx = act === 'hopCircles' && ph !== 'idle' ? Math.cos(a) * 40 : (i - (who.length - 1) / 2) * 56;
      const hy = act === 'hopCircles' && ph !== 'idle' ? -Math.abs(Math.sin(k * 6 + i)) * 20 : 0;
      return ['g', { class: 'rd-rider', 'data-act': act, transform: `translate(${180 + hx + dodge} ${720 + hy}) scale(1)` }, pp(id, o)]; });
    paint(stage, [...poolside(defs), A.splashPad(defs, 180, 720, 150, 40), ...riders, ['g', { transform: 'translate(180 730) scale(1.05) translate(-180 -730)' }, A.bucket(defs, 180, 730, n, tip, ph === 'tip' && tip > 0.6, -100)],
      ph === 'tip' && tip > 0.6 ? ['g', { transform: 'translate(180 712)' }, A.splash(1.6)] : null, ph === 'after' && aft < 1 ? ['g', { transform: 'translate(180 700)' }, A.stars(3)] : null,
      ph !== 'tip' ? tapRing(180, 440, 66) : null, ghost && ph === 'idle' ? ghostAt(180, 450, '', 0.8) : null].filter(Boolean), defs);
  }
  draw();
  const tipIt = () => { ph = 'tip'; tip = 0; fx('fx-splash'); loop((dt) => { k += dt; if (ph === 'tip') tip = Math.min(1, tip + dt / 0.9); if (tip > 0.7) wet = true; // it tips, then (after) rights itself
    if (tip >= 1 && ph === 'tip') { ph = 'after'; n = 0; aft = 0; fx('c-yay1'); } if (ph === 'after') { aft += dt; tip = Math.max(0, tip - dt); if (aft >= 1) wet = false; if (tip <= 0 && aft >= 1) { draw(); return false; } } draw(); return true; }); }; // drops and stars gone 1 s after the tip
  stage.onpointerdown = (ev) => { const [qx, qy] = svgPt(stage.firstChild, ev); ghost = false; if (ph === 'tip' || raf) return; // the pail rights itself first
    if (ph === 'after') { ph = 'idle'; draw(); }
    if (!near2(180, 440, qx, qy, 110)) return; n = R.FULL; fx('fx-pop'); draw(); tipIt(); }; // one tap fills it and tips it
  main.rideSet = (p, v = 0, kk = null) => { leave(); ghost = p === 'ghost'; ph = ghost ? 'idle' : p; tip = 0; wet = false; k = 0.4; aft = 9;
    if (p === 'fill') n = v || 3; if (p === 'tip') { n = R.FULL; tip = v || 0.8; wet = true; } if (p === 'after') { n = 0; wet = true; tip = v || 0; aft = 0.5; } if (p === 'idle') n = 0; if (kk != null) { k = kk; } draw(); };
}

// ---- lazy river (water park): drag the pet's ring round the river ----------------------------------------------------
const RV_POSE = { paddleCircles: () => ({ mouth: 'open', pawsUp: true }), stretchOut: () => ({ half: true }), ballBelly: () => ({ toy: 'ballBlue', toyAt: 'paws', shut: true }), napRing: () => ({ shut: true }),
  chaseFrisbee: () => ({ mouth: 'open', ears: 'out' }), royalBoat: () => ({ chinUp: true }), onHead: () => ({ mouth: 'open' }), ringSinks: () => ({ mouth: 'open' }) };
function riverScene({ main, stage, pet, fx, first, reduced }) {
  const act = R.actOf('river', pet); const who = R.riders('river', pet);
  const CX = 180, CY = 560, RX = 96, RY = 150; let a = Math.PI / 2, ph = 'idle', ghost = first && !reduced, drag = false, went = 0, k = 0;
  function draw() {
    main.dataset.phase = ph;
    const defs = [];
    const x = CX + Math.cos(a) * RX, y = CY + Math.sin(a) * RY; const s = 0.78 + 0.22 * Math.sin(a);
    const o = { ...RV_POSE[act](), wet: true }; const spinR = act === 'paddleCircles' && ph === 'float' ? k * 120 : 0;
    let inner;
    if (who.length > 1) { // one bunny rides on the other's head; that ring sinks a little
      const low = who.includes('bunny2') ? 'bunny2' : who[0], top = who.find((w) => w !== low);
      inner = [['g', { transform: 'translate(0 14) scale(0.62)' }, pp(low, o)], ['g', { transform: 'translate(0 -30) scale(0.48)' }, pp(top, { ...o, pawsUp: true })]];
    } else inner = [['g', { transform: `translate(0 ${act === 'stretchOut' ? 4 : 8}) scale(0.66) rotate(${act === 'stretchOut' ? -70 : 0} 0 -40)` }, pp(pet, o)]];
    const float = act === 'royalBoat' ? A.boat(defs, inner) : A.ring(defs, '#E5484D', inner);
    const rider = ['g', { class: 'rd-rider', 'data-act': act, transform: `translate(${x} ${y + (who.length > 1 ? 6 : 0)}) scale(${s * 1.35}) rotate(${Math.sin(spinR / 57) * 8})` }, float, ph === 'idle' ? A.grabRing(60, -20) : null].filter(Boolean);
    const fr = act === 'chaseFrisbee' ? ['g', { transform: `translate(${CX + Math.cos(a + 0.5) * RX} ${CY + Math.sin(a + 0.5) * RY}) scale(1.4)` }, A.frisbee(defs, 'green')] : null;
    paint(stage, [...poolside(defs), A.river(defs, CX, CY, RX, RY, 110), fr, rider, ghost && ph === 'idle' ? ghostAt(x, y - 30, `M0 0q80 0 110 -60m-2 16l2 -16l-16 4`, 0.8) : null].filter(Boolean), defs);
  }
  draw();
  stage.onpointerdown = (ev) => { const [qx, qy] = svgPt(stage.firstChild, ev); ghost = false; if (ph === 'after') { ph = 'idle'; went = 0; draw(); return; }
    if (!near2(CX + Math.cos(a) * RX, CY + Math.sin(a) * RY - 30, qx, qy, 80)) return; drag = true; ph = 'float'; try { stage.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
    if (!raf) loop((dt) => { k += dt; draw(); return ph === 'float'; }); };
  stage.onpointermove = (ev) => { if (!drag) return; const [qx, qy] = svgPt(stage.firstChild, ev); const b = Math.atan2((qy + 30 - CY) / RY, (qx - CX) / RX);
    let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; a = b; went += Math.abs(d);
    if (went >= 2 * Math.PI) { ph = 'after'; drag = false; fx(R.TRAIT[pet].sound); } };
  stage.onpointerup = () => { drag = false; if (ph === 'float') { ph = 'idle'; draw(); } };
  main.rideSet = (p, v = 0, kk = null) => { leave(); ghost = p === 'ghost'; ph = ghost ? 'idle' : p; a = p === 'float' ? v || 0.4 : Math.PI / 2; k = 0.5; if (kk != null) { k = kk; } draw(); };
}

// ---- sprayers (water park): tap a sprayer to turn it on or off; the pet in the middle reacts ------------------------
const SR_POSE = { biteStream: (on) => (on ? { mouth: 'open', chinUp: true } : {}), hidePeek: (on, ph) => (on ? { cover: true } : ph === 'after' ? { mouth: 'open' } : {}), chaseDrops: (on) => (on ? { pawsUp: true, mouth: 'open' } : {}),
  blinkHappy: (on) => (on ? { half: true, mouth: 'open' } : {}), spin: (on) => (on ? { mouth: 'open', ears: 'out' } : {}), glareLaugh: (on, ph, k) => (on ? (k % 2 < 1 ? { chinUp: true } : { mouth: 'open' }) : {}), earsFlop: (on) => (on ? { ears: 'flop', mouth: 'open' } : {}) };
function sprayScene({ main, stage, pet, fx, first, reduced }) {
  const act = R.actOf('sprayers', pet); const who = R.riders('sprayers', pet);
  const POSTS = [[52, 690, 1], [308, 690, -1], [180, 470, 1]]; let on = [false, false, false], ph = 'idle', ghost = first && !reduced, wet = false, k = 0;
  function draw() {
    main.dataset.phase = ph; main.dataset.on = on.map(Number).join('');
    const defs = []; const live = on.some(Boolean); const o = { ...SR_POSE[act](live, ph, k), wet }; const sp = act === 'spin' && live ? k * 360 : 0; const wx = act === 'chaseDrops' && live ? Math.sin(k * 2) * 40 : 0;
    const riders = who.map((id, i) => ['g', { class: 'rd-rider', 'data-act': act, transform: `translate(${180 + wx + (i - (who.length - 1) / 2) * 70} 700) scale(1) rotate(${Math.sin(sp / 57) * 14} 0 -40)` }, pp(id, o)]);
    const posts = POSTS.map(([x, y, f], i) => ['g', { class: 'rd-sprayer', 'data-n': String(i), transform: `translate(${x} ${y}) scale(${f * (i === 2 ? 0.8 : 1.1)} ${i === 2 ? 0.8 : 1.1})` }, A.sprayer(defs, on[i], ['#4FB35A', '#F28C28', '#8E5CC7'][i], k + i * 0.37, i === 2 ? [12, 236] : [120, 30]), ph === 'idle' && !on[i] ? tapRing(0, -74, 26) : null].filter(Boolean));
    paint(stage, [...poolside(defs), A.splashPad(defs, 180, 680, 170, 60), posts[2], ...riders, posts[0], posts[1], ghost && ph === 'idle' ? ghostAt(52, 610, '', 0.8) : null].filter(Boolean), defs);
  }
  draw();
  stage.onpointerdown = (ev) => { const [qx, qy] = svgPt(stage.firstChild, ev); ghost = false;
    const i = POSTS.findIndex(([x, y]) => near2(x, y - 74, qx, qy, 44)); if (i < 0) return; on[i] = !on[i]; fx(on[i] ? 'fx-splash' : 'fx-pop');
    if (on.some(Boolean)) { ph = 'spray'; wet = true; if (!raf) loop((dt) => { k += dt; draw(); return on.some(Boolean); }); } else { ph = 'after'; fx(R.TRAIT[pet].sound); } draw(); };
  main.rideSet = (p, v = 0) => { leave(); ghost = p === 'ghost'; ph = ghost ? 'idle' : p; on = p === 'spray' ? [true, true, true] : [false, false, false]; wet = p !== 'idle' && !ghost; k = v || 0.6; draw(); };
}

// ---- frisbee splash (water park): flick the frisbee at a floating target; the frisbee dogs dive for their colour ----
function frisbeeScene({ main, stage, pet, fx, first, reduced }) {
  const act = R.actOf('frisbee', pet); const color = R.TRAIT[pet].frisbee || 'yellow'; const dives = /^dive/.test(act) || /Dog$|^puppy$/.test(pet); // Design r6: every dog chases and catches it
  const TG = [[90, 440, 'blue'], [252, 420, 'green'], [180, 520, 'yellow']]; const HAND = [250, 690]; const OWN = Math.max(0, TG.findIndex((t) => t[2] === color));
  let ph = 'idle', ghost = first && !reduced, fly = 0, to = 2, dive = 0, drag = null, k = 0;
  function draw() {
    main.dataset.phase = ph; main.dataset.to = TG[to][2];
    const defs = []; const T0 = TG[to];
    const f = Math.min(1, fly), bob = Math.sin(k * 2 + to) * 3, ty = T0[1] + bob - 2; // lands in the target's middle, bobbing with it
    const fx0 = ph === 'idle' ? HAND : [HAND[0] + (T0[0] - HAND[0]) * f, HAND[1] + (ty - HAND[1]) * f - Math.sin(f * Math.PI) * 90];
    const disc = ph === 'after' && dives ? null : ['g', { class: 'rd-frisbee', transform: `translate(${drag ? drag[0] : fx0[0]} ${drag ? drag[1] : fx0[1]}) scale(${1.6 - 0.3 * f}) rotate(${ph === 'fly' ? -12 * Math.cos(f * Math.PI) : 0})` }, A.frisbee(defs, color)];
    const o = dives ? (ph === 'dive' ? { ears: 'back', tail: 'back', mouth: 'open' } : ph === 'after' ? { wet: true, toy: { blue: 'frisbeeBlue', green: 'frisbeeGreen', yellow: 'frisbeeYellow' }[color], toyAt: 'mouth' } : {}) : ph === 'idle' ? {} : { pawsUp: true, mouth: 'open' };
    const start = [130, 720]; const dk = Math.min(1, dive);
    const pos = dives && (ph === 'dive' || ph === 'after') ? [start[0] + (T0[0] - start[0]) * dk, start[1] + (T0[1] + 10 - start[1]) * dk - Math.sin(dk * Math.PI) * 120] : start;
    const who = R.riders('frisbee', pet);
    const rider = ['g', { class: 'rd-rider', 'data-act': act, transform: `translate(${pos[0]} ${pos[1]}) rotate(${ph === 'dive' ? 60 * dk : 0}) scale(${ph === 'after' && dives ? 0.6 : 0.8})` }, ...who.map((id) => pp(id, o))];
    paint(stage, [...poolside(defs), A.pool(20, 340, 320, 250), ...TG.map(([x, y, c], i) => ['g', { class: 'rd-target', 'data-c': c, transform: `translate(${x} ${y + Math.sin(k * 2 + i) * 3}) scale(1.4)` }, A.target(defs, { blue: '#3D7BE0', green: '#4FB35A', yellow: '#F2C230' }[c])]),
      ph === 'after' ? ['g', { transform: `translate(${T0[0]} ${T0[1] + 6})` }, dives ? A.splash(1.2) : A.sparkles(5)] : null,
      ph === 'after' && dives ? A.water(T0[0] - 50, T0[1] - 4, 100, 30) : null, rider, disc, ph === 'idle' ? dragRing(HAND[0], HAND[1] + 30, 0.7, 50) : null,
      ghost && ph === 'idle' ? ghostAt(HAND[0], HAND[1], 'M0 0L-60 -160m2 16l-2 -16l14 6', 0.8) : null].filter(Boolean), defs);
  }
  draw();
  stage.onpointerdown = (ev) => { const [qx, qy] = svgPt(stage.firstChild, ev); ghost = false; if (ph === 'after') { ph = 'idle'; fly = 0; dive = 0; draw(); return; }
    if (ph === 'idle' && near2(HAND[0], HAND[1], qx, qy, 60)) { drag = [qx, qy]; try { stage.setPointerCapture(ev.pointerId); } catch { /* ignore */ } draw(); } };
  stage.onpointermove = (ev) => { if (!drag) return; drag = svgPt(stage.firstChild, ev); draw(); };
  stage.onpointerup = () => { if (!drag) return; const [dx, dy] = [drag[0] - HAND[0], drag[1] - HAND[1]]; drag = null;
    const aim = [HAND[0] + dx * 4, HAND[1] + dy * 4]; to = TG.reduce((b, t, i) => (Math.hypot(t[0] - aim[0], t[1] - aim[1]) < Math.hypot(TG[b][0] - aim[0], TG[b][1] - aim[1]) ? i : b), 0);
    if (Math.hypot(dx, dy) < 20) to = 2; // a tap throws too (to the middle)
    if (dives) to = OWN; // FINAL: a frisbee dog's own colour frisbee flies to its own colour target and it dives to fetch it
    throwIt(); };
  const throwIt = () => { ph = 'fly'; fly = 0; fx('fx-zoom'); loop((dt) => { k += dt; if (ph === 'fly') { fly += dt / 0.9; if (fly >= 1) { fly = 1; if (dives) { ph = 'dive'; dive = 0; fx(R.TRAIT[pet].sound); } else { ph = 'after'; fx('c-yay1'); } } }
    else if (ph === 'dive') { dive += dt / 0.8; if (dive >= 1) { dive = 1; ph = 'after'; fx('fx-splash'); } } draw(); return ph !== 'after'; }); };
  main.rideSet = (p, v = 0, kk = null) => { leave(); ghost = p === 'ghost'; ph = ghost ? 'idle' : p; to = 2; fly = p === 'fly' ? v || 0.5 : p === 'idle' || ghost ? 0 : 1; dive = p === 'dive' ? v || 0.5 : p === 'after' ? 1 : 0; k = 0.3;
    if (dives) to = OWN; if (kk != null) { k = kk; } draw(); };
}

// every scene (FINAL: all three parks; the splash pad opens from the park or the water park)
const BUILT = { slide: slideScene, curly: (c) => slideScene({ ...c, scene: 'curly' }), swings: swingScene, merry: spinScene, teacups: spinScene, scooter: scooterScene, splash: splashScene,
  coaster: coasterScene, bucket: bucketScene, river: riverScene, sprayers: sprayScene, frisbee: frisbeeScene };

