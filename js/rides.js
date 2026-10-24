// Ride Close-Up Scenes (the pure parts): which park item opens which close-up scene, how each pet behaves on each
// ride (by pet id and trait only; spoken names come from petName / the phone-typed names), the scooter's mud that stays
// on a pet until the splash pad, and the fruit-and-veg spin-out. No timer, no score, nothing to lose.
export const PETS = ['yellowDog', 'chocolateDog', 'gingerDog', 'blackDog', 'puppy', 'kitty', 'bunny', 'bunny2'];
// park -> its scenes, in the order the park lists the item; `piece` is the park item that opens it
export const PARKS = {
  park: [['slide', 'slide'], ['swings', 'swings'], ['merry', 'merry'], ['scooter', 'scooter'], ['splash', 'splash']],
  coaster: [['coaster', 'dragonCoaster'], ['teacups', 'teapots']],
  water: [['curly', 'curlySlide'], ['bucket', 'bucket'], ['river', 'lazyPool'], ['sprayers', 'sprayers'], ['frisbee', 'floatTargets']],
};
export const SCENES = Object.fromEntries(Object.entries(PARKS).flatMap(([park, l]) => l.map(([id, piece]) => [id, { id, park, piece }])));
export const sceneFor = (zone, piece) => (PARKS[zone] || []).find((s) => s[1] === piece)?.[0] || null;
// the splash pad is in the park and the water park; either one opens the same scene (the water park's own backdrop)
export const sceneOfPiece = (zone, piece) => sceneFor(zone, piece) || (piece === 'splash' && zone === 'water' ? 'splash' : null);

// each pet's personality: its sound, a toy it carries, how it rides (a word per ride the art and motion read)
export const TRAIT = {
  puppy: { sound: 'fx-yip', loud: true },
  chocolateDog: { sound: 'fx-woof', cozy: true },
  blackDog: { sound: 'fx-woof', toy: 'ballBlue', frisbee: 'blue' },
  yellowDog: { sound: 'fx-woof', calm: true, frisbee: 'yellow' },
  gingerDog: { sound: 'fx-woof', toy: 'frisbeeGreen', frisbee: 'green', ears: true },
  kitty: { sound: 'fx-meow', king: true },
  bunny: { sound: 'fx-giggle', bunny: true, pair: 'bunny2' },
  bunny2: { sound: 'fx-giggle', bunny: true, pair: 'bunny' },
};
// the FINAL Dad-approved actions, one word per pet per ride (the scene's art and motion for that word)
export const ACT = {
  slide: { puppy: 'headfirst', chocolateDog: 'curlSpin', blackDog: 'holdBall', yellowDog: 'slowCalm', gingerDog: 'zoomFrisbee', kitty: 'kingTail', bunny: 'bunnyPile', bunny2: 'bunnyPile' },
  scooter: { puppy: 'aimPuddles', chocolateDog: 'zipQuiet', blackDog: 'grabRock', yellowDog: 'slowSteady', gingerDog: 'leanEars', kitty: 'swerveMud', bunny: 'zoom', bunny2: 'sniffFlowers' },
  merry: { puppy: 'hangHowl', chocolateDog: 'snuggleMiddle', blackDog: 'ballRolls', yellowDog: 'chinRest', gingerDog: 'earsOut', kitty: 'ownsCenter', bunny: 'bounceDizzy', bunny2: 'bounceDizzy' },
  coaster: { puppy: 'howl', chocolateDog: 'coverPeek', blackDog: 'hugBall', yellowDog: 'calmWise', gingerDog: 'earsFlap', kitty: 'pawsWave', bunny: 'earsBack', bunny2: 'earsBack' },
  swings: { puppy: 'barkUp', chocolateDog: 'curlCozy', blackDog: 'jumpOff', yellowDog: 'gentle', gingerDog: 'jumpOff', kitty: 'tailWave', bunny: 'shareSwing', bunny2: 'shareSwing' },
  splash: { puppy: 'tiptoeDry', chocolateDog: 'launchWiggle', blackDog: 'bounceBall', yellowDog: 'lieMist', gingerDog: 'snapStreams', kitty: 'hopJets', bunny: 'startleHop', bunny2: 'startleHop' },
  curly: { puppy: 'cannonball', chocolateDog: 'spinPopUp', blackDog: 'ballUp', yellowDog: 'drift', gingerDog: 'bellyFlop', kitty: 'barelyWet', bunny: 'littleWave', bunny2: 'littleWave' },
  bucket: { puppy: 'mouthOpen', chocolateDog: 'dodgeBack', blackDog: 'ballUp', yellowDog: 'sitCalm', gingerDog: 'catchWater', kitty: 'kingDry', bunny: 'hopCircles', bunny2: 'hopCircles' },
  river: { puppy: 'paddleCircles', chocolateDog: 'stretchOut', blackDog: 'ballBelly', yellowDog: 'napRing', gingerDog: 'chaseFrisbee', kitty: 'royalBoat', bunny: 'onHead', bunny2: 'ringSinks' },
  sprayers: { puppy: 'biteStream', chocolateDog: 'hidePeek', blackDog: 'chaseDrops', yellowDog: 'blinkHappy', gingerDog: 'spin', kitty: 'glareLaugh', bunny: 'earsFlop', bunny2: 'earsFlop' },
  frisbee: { puppy: 'cheer', chocolateDog: 'cheer', blackDog: 'diveBlue', yellowDog: 'diveYellow', gingerDog: 'diveGreen', kitty: 'cheer', bunny: 'cheer', bunny2: 'cheer' },
  teacups: null,
};
ACT.teacups = ACT.merry; // the teacups ride the way the merry-go-round does (FINAL: "Merry-go-round + Teacups")
export const actOf = (scene, pet) => (ACT[scene] && ACT[scene][pet]) || 'ride';
// the bunnies ride together where the FINAL list pairs them
export const riders = (scene, pet) => (TRAIT[pet]?.bunny && /bunnyPile|shareSwing|bounceDizzy|earsBack|startleHop|onHead|ringSinks|hopCircles|littleWave|earsFlop/.test(actOf(scene, pet)) ? [pet, TRAIT[pet].pair] : [pet]);

// mud: a puddle hit on the scooter adds a splat that stays on that pet (every scene, this session) until the splash pad
export const mudOf = (mud, pet) => (mud && mud[pet]) || 0;
export function splat(mud, pet) { mud[pet] = Math.min(6, mudOf(mud, pet) + 1); return mud[pet]; }
export function wash(mud, pet) { const had = mudOf(mud, pet); delete mud[pet]; return had; }

// scooter path items: fruit and veg only; a hit is a cartoon spin-out (a twirl, stars, a giggle, back up), never a crash
export const PATH_ITEMS = ['banana', 'carrot', 'strawberry'];
export const PATH = [['puddle', 0.24, 0.36], ['banana', 0.42, 0.62], ['puddle', 0.55, 0.3], ['carrot', 0.68, 0.7], ['strawberry', 0.82, 0.42], ['puddle', 0.92, 0.6]];
// the swerving pet (the cat) steers round mud on his own unless she drives straight into it
export const hits = (x, y, item, r = 0.09) => Math.abs(x - item[1]) < r && Math.abs(y - item[2]) < r * 1.4;
export function spinOut(kind) { return PATH_ITEMS.includes(kind) ? { twirl: 360, stars: 3, sound: 'fx-giggle', after: 'popUp' } : null; }

// the swing: each push goes a little higher, never scary (a low cap); the jumpers hop off at the top onto soft grass
export const SWING_MAX = 34; // degrees
export const push = (a) => Math.min(SWING_MAX, a + 8);
export const jumper = (pet) => actOf('swings', pet) === 'jumpOff';
// the slide: drag up the ladder (0 = ground, 1 = the top), then a tap sends the pet down
export const atTop = (t) => t >= 0.92;
// spin rides (merry-go-round, teacups): the finger sets the speed, kept gentle; all wobble off after
export const SPIN_MAX = 2.4; // turns a second at most
export const spinSpeed = (v) => Math.max(0, Math.min(SPIN_MAX, v));
// the tipping bucket fills one drop a tap; at FULL it tips and everyone cheers (counting along, never a score)
export const FULL = 5;
export const fill = (n) => (n + 1 >= FULL ? 0 : n + 1);

// #ride/<ride>/<pet> (Security): both parts are checked against fixed allowlists (Maps, never a plain-object lookup, so
// __proto__ or constructor match nothing); anything else gives null and the screen falls back to the park
export const RIDE_IDS = ['slide', 'swings', 'merry', 'teacups', 'scooter', 'splash', 'coaster', 'curly', 'bucket', 'river', 'sprayers', 'frisbee'];
const RIDE_OK = new Map(RIDE_IDS.map((k) => [k, k])), PET_OK = new Map(PETS.map((k) => [k, k]));
export function parseRide(hash) {
  const m = /^#ride\/([A-Za-z0-9]{1,20})\/([A-Za-z0-9]{1,20})$/.exec(String(hash || ''));
  if (!m) return null;
  const scene = RIDE_OK.get(m[1]), pet = PET_OK.get(m[2]);
  return scene && pet ? { scene, pet } : null;
}
// where Back (and a bad ride link) goes: the park it came from, only if it is a plain park route
// a bad ride link: a known pet lands on its own park (the park it came from if that was its), else the pet picker
export function fallbackTo(hash, from) {
  const m = /^#ride\/[^/]{0,80}\/([A-Za-z0-9]{1,20})$/.exec(String(hash || '')), pet = m && PET_OK.get(m[1]);
  if (!pet) return '#playground';
  const b = backTo(from);
  return b === `#playground/${pet}` || b.startsWith(`#playground/${pet}/`) ? b : `#playground/${pet}`;
}
export const backTo = (from) => (/^#playground(\/[A-Za-z0-9]{1,20}){0,2}$/.test(String(from || '')) ? from : '#playground');

// shared magnifier placement (Design's rule, J3): `seen` is the ride's own visible box on screen (already clamped
// to the viewport by the caller); nudge its middle clear of any block (the top bar, the Build card), then clamp
// inside the view. It never hides, only moves inward (so the bucket's button still lands somewhere on screen).
export function magnifierAt(seen, blocks, view, half = 24) {
  let x = seen.x + seen.w / 2, y = seen.y + seen.h / 2;
  for (const b of blocks) {
    if (x + half <= b.x || x - half >= b.x + b.w || y + half <= b.y || y - half >= b.y + b.h) continue;
    y = y < b.y + b.h / 2 ? b.y - half : b.y + b.h + half;
  }
  return { x: Math.max(half, Math.min(view.w - half, x)), y: Math.max((view.t || 0) + half, Math.min(view.h - half, y)) };
}
// the Playground's hook (startup keeps only `list` = [button, world box]): each camera move puts every magnifier over its
// ride's visible middle, >= 8 px below the top bar, clear of the Build card, inside the side edges; 48 px tap area
const LAST = new WeakMap();
// px² of drawn ride art inside q (view px at the target camera): a cached 8 px grid of the svg's opaque shapes (shadows skipped)
const GRID = new WeakMap();
function painted(pc, q, cam, b) {
  const sv = pc?.querySelector?.('svg'); if (!sv?.getScreenCTM) return 1e9;
  let g = GRID.get(sv);
  if (!g) {
    const P = pc.getBoundingClientRect(); g = new Set();
    for (const e of sv.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line')) {
      const cs = getComputedStyle(e), m = e.getScreenCTM?.(); if (!m || +cs.opacity * +cs.fillOpacity < 0.5 && cs.stroke == 'none' || cs.display == 'none') continue;
      const k = e.getBBox(), c0 = new DOMPoint(k.x, k.y).matrixTransform(m), c1 = new DOMPoint(k.x + k.width, k.y + k.height).matrixTransform(m);
      for (let y = Math.floor((Math.min(c0.y, c1.y) - P.top) / 8); y * 8 < Math.max(c0.y, c1.y) - P.top; y++) for (let x = Math.floor((Math.min(c0.x, c1.x) - P.left) / 8); x * 8 < Math.max(c0.x, c1.x) - P.left; x++) g.add(x + ',' + y);
    }
    GRID.set(sv, g);
  }
  let n = 0;
  for (const c of g) { const [x, y] = c.split(',').map(Number), vx = b.x + x * 8 + 4 - cam.x, vy = b.y + y * 8 + 4 - cam.y; if (vx >= q.x && vx < q.x + q.w && vy >= q.y && vy < q.y + q.h) n++; }
  return n * 64;
}
export function placeMags(v, cam, list) {
  const d = globalThis.document; if (!d?.querySelector || !v.getBoundingClientRect) return; // no real page (gone, or a test stub)
  const r = v.getBoundingClientRect(), W = v.clientWidth, H = v.clientHeight;
  // the cards come and go (on a ride, a throw, the riders row) without a camera move: place again when they do
  const pg = v.closest?.('.playground'); LAST.set(v, [{ x: cam.x, y: cam.y }, list]);
  if (pg && !LAST.has(pg) && globalThis.MutationObserver) {
    let q = 0; LAST.set(pg, 1);
    new MutationObserver(() => q || (q = requestAnimationFrame(() => { q = 0; const a = LAST.get(v); if (v.isConnected && a) placeMags(v, a[0], a[1]); }))).observe(pg, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  }
  const rel = (e) => { const b = e && e.getBoundingClientRect(); return b && b.width ? { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height } : null; };
  const bar = rel(d.querySelector('.playground .topbar'));
  const view = { w: W, h: H, t: Math.max(0, bar ? bar.y + bar.h : 0) + 8 };
  // clear of the Build card, the Places cards and the trick/rider row (Design FIX on c1b59cc)
  const blocks = [...d.querySelectorAll('.pg-build-btn, .pg-gates, .pg-tricks:not([hidden])')].map(rel).filter(Boolean).map((q) => ({ x: q.x - 8, y: q.y - 8, w: q.w + 16, h: q.h + 16 })); // 8 px air
  for (const [el, b] of list) {
    // the drawn art in screen px (its svg's bbox through the screen matrix), back to world px against its piece, then to the view
    const pc = el.previousElementSibling, sv = pc?.querySelector?.('svg'), m = sv?.getScreenCTM?.(); let a = { x: b.x, y: b.y, w: b.w, h: b.h };
    if (m && sv.getBBox) { const k = sv.getBBox(), P = pc.getBoundingClientRect(), c0 = new DOMPoint(k.x, k.y).matrixTransform(m), c1 = new DOMPoint(k.x + k.width, k.y + k.height).matrixTransform(m);
      a = { x: b.x + Math.min(c0.x, c1.x) - P.left, y: b.y + Math.min(c0.y, c1.y) - P.top, w: Math.abs(c1.x - c0.x), h: Math.abs(c1.y - c0.y) }; }
    // what shows: inside the view, below the top bar, then the biggest piece left beside each card it meets
    let q = { x: Math.max(a.x - cam.x, 0), y: Math.max(a.y - cam.y, view.t) }; q.w = Math.min(a.x + a.w - cam.x, W) - q.x; q.h = Math.min(a.y + a.h - cam.y, H) - q.y;
    for (const k of blocks) {
      if (q.x >= k.x + k.w || k.x >= q.x + q.w || q.y >= k.y + k.h || k.y >= q.y + q.h) continue;
      q = [{ ...q, w: k.x - q.x }, { ...q, x: k.x + k.w, w: q.x + q.w - k.x - k.w }, { ...q, h: k.y - q.y }, { ...q, y: k.y + k.h, h: q.y + q.h - k.y - k.h }].sort((u, v) => Math.min(v.w, v.h) - Math.min(u.w, u.h))[0];
    }
    const s = Math.max(48, el.offsetWidth), all = q.w >= a.w - 1 && q.h >= a.h - 1, off = !(all ? q.w > 0 && q.h > 0 : q.w >= 48 && q.h >= 48 && painted(pc, q, cam, b) >= 2304); // q = art no card or bar covers: >= 48 px (and 48x48 px of drawn art), or a small ride wholly clear
    const p = off ? { x: a.x - cam.x + a.w / 2, y: a.y - cam.y + a.h / 2 } : { x: q.x + q.w / 2, y: q.y + q.h / 2 };
    el.tabIndex = off ? -1 : 0;
    Object.assign(el.style, { visibility: off ? 'hidden' : '', width: `${s}px`, height: `${s}px`, margin: '0', left: `${Math.round(cam.x + p.x - s / 2)}px`, top: `${Math.round(cam.y + p.y - s / 2)}px` });
  }
}
// a tap on a shown magnifier wins over walk-to, pan and pieces: tested in the view's capture phase against where it is drawn now (mid-ease too)
const T = { back: -1e9, up: -1e9, syn: 0, z: null };
export const dropTaps = () => { T.back = performance.now(); T.z = null; }; // Back drops a queued or late close-up tap
// queued or ghost taps (350 ms after Back), and the native click after a pointerup already opened it (no double open)
export const dropped = (t = performance.now()) => t - T.back < 350 || (!T.syn && t - T.up < 700);
// pointerdown only notes a magnifier (the pan still sees it, so a drag from one pans); pointerup within 10 px of the down
// opens it (a momentum release often fires no native click) and ends the pan with a pointercancel; a longer move just pans
export function hitMag(ev, list) {
  if (ev.timeStamp - T.back < 350) { ev.stopPropagation(); ev.preventDefault(); T.z = null; return 1; }
  const at = (z) => { const r = z.getBoundingClientRect(); return z.style.visibility != 'hidden' && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; };
  if (ev.type == 'pointerup') {
    const z = T.z; T.z = null; if (!z) return; T.up = performance.now();
    if (!z.isConnected || Math.hypot(ev.clientX - T.x, ev.clientY - T.y) >= 10 || !at(z)) return; // moved: it was a pan
    ev.stopPropagation(); ev.currentTarget.dispatchEvent(new PointerEvent('pointercancel', { pointerId: ev.pointerId }));
    T.syn = 1; try { z.click(); } finally { T.syn = 0; } T.up = performance.now(); return 1;
  }
  T.z = null;
  for (const [z] of list) if (at(z)) { T.z = z; T.x = ev.clientX; T.y = ev.clientY; return; }
}
