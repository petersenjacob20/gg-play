// Playground (Amendment n / design.md §13.3–13.5, Amendment q: the Big Playground). Pure helpers,
// importable from Node. Ids only in routes and saves; real pet names never appear here.
// World units: 1 unit = 1 CSS px. The park is a grid of `cell` units; pieces are w x h cells.
import { routeIds } from './route.js';

export const PLAYGROUND_EDGE = '#B57EDC';
export const TRICK_BTN_MIN = 96;
export const PARK_CAP = 24;
export const TAP_SLOP = 10;      // px a press may move and still count as a tap
export const EDGE_FOLLOW = 72;   // px from the view edge where the camera follows a dragged character
export const OVERSCROLL = 36;    // px the camera may stretch past an edge while her thumb is down

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// ---- cast ----
// Friends always; pets only when switched on. Story Time never appears.
export function playgroundCast(data, state) {
  const friends = (data && data.friends) || [];
  const pets = (data && data.pets) || [];
  const on = [];
  for (const f of friends) on.push(f);
  for (const p of pets) {
    const row = state && state.pets && state.pets[p.id];
    if (!row || row.on !== false) on.push(p);
  }
  return on;
}

export function playgroundAllow(data, state, id) {
  if (typeof id !== 'string' || !id) return false;
  return playgroundCast(data, state).some((c) => c.id === id);
}

export function clampPct(n, lo = 0, hi = 100) {
  const v = Number(n);
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

// ---- data: pieces, animals, zones (q2, q3, q10) ----
export const pg = (data) => (data && isObj(data.playground) ? data.playground : null);
export const cellOf = (data) => Math.max(40, num(pg(data) && pg(data).cell, 100));
export function pieceById(data, id) {
  const p = pg(data);
  if (!p || !Array.isArray(p.pieces) || typeof id !== 'string') return null;
  const real = p.aliases && Object.hasOwn(p.aliases, id) ? p.aliases[id] : id; // "puddle" -> "splash" (q5)
  return p.pieces.find((x) => x && x.id === real) || null;
}
export function animalKind(data, id) {
  const p = pg(data);
  return (p && Array.isArray(p.animals) && p.animals.find((a) => a && a.id === id)) || null;
}
export function zonesOf(data) {
  const p = pg(data);
  return p && Array.isArray(p.zones) ? p.zones.filter((z) => isObj(z) && typeof z.id === 'string') : [];
}
export const readyZones = (data) => zonesOf(data).filter((z) => z.ready === true);
export function zoneById(data, id) {
  return readyZones(data).find((z) => z.id === id) || null;
}
// The zone gate strip shows only when 2 or more zones are ready (q10, Design's n1 rule: no dead button).
export function gatesFor(data) {
  const r = readyZones(data).filter((z) => Array.isArray(z.park) && z.park.length);
  return r.length >= 2 ? r : [];
}
// The gate strip on the play scene (design §16.1): only the OTHER ready zones, so no gate does nothing.
export function otherGates(data, zoneId) {
  return gatesFor(data).filter((z) => z.id !== zoneId);
}
export function worldOf(zone) {
  const w = zone && zone.world;
  return { w: Math.max(200, num(w && w.w, 1200)), h: Math.max(200, num(w && w.h, 1100)) };
}
export function gridOf(zone, data) {
  const c = cellOf(data); const w = worldOf(zone);
  return { cell: c, cols: Math.floor(w.w / c), rows: Math.floor((w.h - num(zone && zone.pad)) / c) };
}

// Design's n1 fix ("hide the Playground toggle until the tile ships"): the Playground ships only when
// its data has a ready park zone with a layout. The home tile, the route and Dad's Playground toggle
// all ask this, so a build without it has no toggle at all (absent, not greyed out) and no dead button.
export function playgroundShips(data) {
  const z = zoneById(data, 'park');
  return !!(z && Array.isArray(z.park) && z.park.length);
}

// ---- routes (q0, q10) ----
// "#playground" is the pick grid. "#playground/<id>" opens the park for a switched-on character;
// "#playground/<id>/<zone>" opens a ready zone (any other zone goes to the park); a bad id goes back
// to "#playground" (fix). Not shipped, or Dad's toggle off: home (view 'off').
export function resolvePlayground(data, state, hash) {
  if (!playgroundShips(data) || (state && state.playground === false)) return { view: 'off', id: null };
  const rest = String(hash || '').replace(/^#\/?/, '').split('?')[0].split('/').slice(1).filter(Boolean);
  if (!rest.length) return { view: 'pick', id: null };
  const [id, zone] = routeIds(hash);
  if (!id || !playgroundAllow(data, state, id)) return { view: 'pick', id: null, fix: '#playground' };
  const z = zone && zoneById(data, zone) ? zone : 'park';
  const out = { view: 'play', id, zone: z };
  if (rest.length > 1 && z !== rest[1]) out.fix = `#playground/${id}`;
  return out;
}

// ---- layouts and the parks save (q2, q6, q10) ----
export function defaultLayout(zone) {
  return (zone && Array.isArray(zone.park) ? zone.park : []).map((e) => [e[0], e[1], e[2]]);
}
function cellsOf(entry, data) {
  const p = pieceById(data, entry[0]);
  if (!p) return [];
  const out = [];
  for (let x = 0; x < p.w; x++) for (let y = 0; y < p.h; y++) out.push(`${entry[1] + x},${entry[2] + y}`);
  return out;
}
// Does a piece fit at (gx, gy): inside the world and on no other piece? `skip` = the index being moved.
export function fits(layout, id, gx, gy, zone, data, skip = -1) {
  const p = pieceById(data, id);
  if (!p || !Number.isInteger(gx) || !Number.isInteger(gy)) return false;
  const { cols, rows } = gridOf(zone, data);
  if (gx < 0 || gy < 0 || gx + p.w > cols || gy + p.h > rows) return false;
  const taken = new Set();
  layout.forEach((e, i) => { if (i !== skip) cellsOf(e, data).forEach((c) => taken.add(c)); });
  return !cellsOf([id, gx, gy], data).some((c) => taken.has(c));
}
// The nearest free cell to (gx, gy) for this piece, or null when the park is full there.
export function nearestFree(layout, id, gx, gy, zone, data, skip = -1) {
  const { cols, rows } = gridOf(zone, data);
  const tx = Math.round(num(gx)); const ty = Math.round(num(gy));
  let best = null;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (!fits(layout, id, x, y, zone, data, skip)) continue;
      const d = (x - tx) ** 2 + (y - ty) ** 2;
      if (!best || d < best.d) best = { gx: x, gy: y, d };
    }
  }
  return best ? { gx: best.gx, gy: best.gy } : null;
}
// Sanitise one zone's list: catalog ids that zone lists, whole cells inside the world, no duplicates
// or overlaps, at most PARK_CAP. Returns [] when nothing good is left.
// `base` = pieces already there (the zone's pinned pieces): her pieces must not overlap them.
export function sanitizeLayout(list, zone, data, base = []) {
  if (!zone || !Array.isArray(list)) return [];
  const allowed = new Set(Array.isArray(zone.pieces) ? zone.pieces : []);
  const out = [];
  const count = {};
  for (const e of list) {
    if (out.length >= PARK_CAP) break;
    if (!Array.isArray(e) || e.length !== 3) continue;
    const [id, gx, gy] = e;
    if (typeof id !== 'string' || !allowed.has(id) || !pieceById(data, id) || pieceById(data, id).id !== id) continue;
    const max = num(pieceById(data, id).max, PARK_CAP);
    if ((count[id] || 0) >= max) continue; // e.g. at most 1 dragon coaster
    if (!fits(base.concat(out), id, gx, gy, zone, data, -1)) continue; // out of the world, a duplicate or an overlap
    count[id] = (count[id] || 0) + 1;
    out.push([id, gx, gy]);
  }
  return out;
}
// Pinned pieces (design §16.2: the Water Park lifeguard): always there, never in the tray, never moved,
// binned or saved. Listed per zone as `pinned: [[pieceId, gx, gy]]`; a pinned id is never a tray id.
export function pinnedLayout(zone, data) {
  const out = [];
  for (const e of (zone && Array.isArray(zone.pinned) ? zone.pinned : [])) {
    if (!Array.isArray(e) || e.length !== 3 || !pieceById(data, e[0])) continue;
    if (Array.isArray(zone.pieces) && zone.pieces.includes(e[0])) continue;
    if (!fits(out, e[0], e[1], e[2], zone, data)) continue;
    out.push([e[0], e[1], e[2]]);
  }
  return out;
}
export const isPinned = (entry, zone) => !!(entry && zone && Array.isArray(zone.pinned) && zone.pinned.some((e) => e[0] === entry[0]));
// What gets saved for a zone: her pieces only (pinned ones are re-added on load).
export const savable = (layout, zone) => layout.filter((e) => !isPinned(e, zone)).map((e) => [e[0], e[1], e[2]]);
export function canAdd(layout, id, data) {
  const p = pieceById(data, id);
  if (!p) return false;
  return layout.filter((e) => e[0] === id).length < num(p.max, PARK_CAP);
}
// The per-profile `parks` field: { <ready zone id>: [[pieceId, gx, gy], ...] }. Zones that are not
// ready, unknown keys and empty or bad lists are dropped (an empty park falls back to the default).
export function normalizeParks(obj, data) {
  const out = {};
  if (!isObj(obj)) return out;
  for (const z of readyZones(data)) {
    if (!Object.hasOwn(obj, z.id)) continue;
    const list = sanitizeLayout(obj[z.id], z, data, pinnedLayout(z, data));
    if (list.length) out[z.id] = list;
  }
  return out;
}
// What she plays in: her saved park for this zone, or the zone's default.
// Pinned pieces come first and are always there (the sanitiser re-adds them).
export function layoutFor(profile, zone, data) {
  const saved = profile && isObj(profile.parks) ? profile.parks[zone && zone.id] : null;
  const pins = pinnedLayout(zone, data);
  const list = sanitizeLayout(saved, zone, data, pins);
  return pins.concat(list.length ? list : sanitizeLayout(defaultLayout(zone), zone, data, pins));
}
export function pieceBox(entry, data) {
  const p = pieceById(data, entry[0]); const c = cellOf(data);
  return { x: entry[1] * c, y: entry[2] * c, w: p.w * c, h: p.h * c };
}
export function pieceAt(layout, data, x, y) {
  for (let i = layout.length - 1; i >= 0; i--) {
    const b = pieceBox(layout[i], data);
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return i;
  }
  return -1;
}
// Where the character stands at the start: beside the slide (or the first piece), on open ground.
export function startSpot(layout, zone, data) {
  const id = (zone && zone.startBeside) || (pg(data) && pg(data).startBeside) || 'slide';
  const i = Math.max(0, layout.findIndex((e) => e[0] === id));
  const w = worldOf(zone);
  if (!layout.length) return { x: w.w / 2, y: w.h / 2 };
  const b = pieceBox(layout[i], data);
  // a zone may name the exact spot beside its start piece (from the piece's centre), e.g. the coaster station
  const at = zone && Array.isArray(zone.startAt) && layout[i][0] === id ? zone.startAt : null;
  if (at) return clampToWorld({ x: b.x + b.w / 2 + num(at[0]), y: b.y + b.h / 2 + num(at[1]) }, zone);
  return { x: Math.min(w.w - 60, b.x + b.w + 70), y: Math.min(w.h - 20, b.y + b.h - 10) };
}
// The spot in front of a piece where the character walks to play it.
export function frontOf(entry, data, zone) {
  const b = pieceBox(entry, data); const w = worldOf(zone);
  return { x: Math.min(w.w - 40, Math.max(40, b.x + b.w / 2)), y: Math.min(w.h - 10, b.y + b.h * 0.8) };
}

// ---- camera (q1) ----
// cam = the world point at the view's top-left. Clamped so the world always fills the view (a world
// smaller than the view is centred). softClamp lets the thumb stretch a little past an edge; on
// release the screen eases back to clampCamera.
function axis(v, view, world) {
  if (world <= view) return (world - view) / 2;
  return Math.min(world - view, Math.max(0, v));
}
export function clampCamera(cam, view, world) {
  return { x: axis(num(cam.x), view.w, world.w), y: axis(num(cam.y), view.h, world.h) };
}
export function softClamp(cam, view, world, over = OVERSCROLL) {
  const c = clampCamera(cam, view, world);
  const stretch = (v, lim) => lim + Math.max(-over, Math.min(over, (v - lim) * 0.35));
  return { x: stretch(num(cam.x), c.x), y: stretch(num(cam.y), c.y) };
}
export function centerOn(pt, view, world) {
  return clampCamera({ x: pt.x - view.w / 2, y: pt.y - view.h / 2 }, view, world);
}
// Keep a dragged character in view: when it is within `margin` of an edge, move the camera.
export function followEdge(cam, pt, view, world, margin = EDGE_FOLLOW) {
  let { x, y } = cam;
  if (pt.x - x < margin) x = pt.x - margin;
  else if (x + view.w - pt.x < margin) x = pt.x + margin - view.w;
  if (pt.y - y < margin * 1.6) y = pt.y - margin * 1.6;
  else if (y + view.h - pt.y < margin * 0.6) y = pt.y + margin * 0.6 - view.h;
  return clampCamera({ x, y }, view, world);
}
export function clampToWorld(pt, zone, pad = 30) {
  const w = worldOf(zone);
  return { x: Math.min(w.w - pad, Math.max(pad, num(pt.x))), y: Math.min(w.h - 8, Math.max(pad * 3, num(pt.y))) };
}

// ---- the character's drawn box, and where it stands in build mode (design.md §15.1) ----
// The character is a 160 px drawing placed by its feet point (CSS translate(-50%, -88%)).
export const ACTOR = Object.freeze({ w: 160, above: 141, below: 19 });
export const actorBox = (pt) => ({ x: pt.x - ACTOR.w / 2, y: pt.y - ACTOR.above, w: ACTOR.w, h: ACTOR.above + ACTOR.below });
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
// Open ground: the whole drawing is off every piece and inside the world.
export function actorClear(pt, layout, data, zone, avoid = []) {
  const a = actorBox(pt); const w = worldOf(zone);
  if (a.x < 0 || a.y < 0 || a.x + a.w > w.w || a.y + a.h > w.h) return false;
  return !layout.some((e) => overlap(a, pieceBox(e, data))) && !avoid.some((b) => overlap(a, b));
}
// When build mode opens: the open-ground spot nearest the character along the edges of what she can
// see, with the whole drawing in view (so it never stands on or over a piece). null if there is none.
export function edgeSpot(from, cam, view, layout, data, zone, avoid = []) {
  const inset = 4;
  const x0 = cam.x + ACTOR.w / 2 + inset; const x1 = cam.x + view.w - ACTOR.w / 2 - inset;
  const y0 = cam.y + ACTOR.above + inset; const y1 = cam.y + view.h - ACTOR.below - inset;
  if (x1 < x0 || y1 < y0) return null;
  const pts = [];
  for (let x = x0; x <= x1; x += 10) pts.push({ x, y: y0 }, { x, y: y1 });
  for (let y = y0; y <= y1; y += 10) pts.push({ x: x0, y }, { x: x1, y });
  pts.push({ x: x1, y: y1 }, { x: x1, y: y0 });
  let best = null;
  for (const q of pts) {
    if (!actorClear(q, layout, data, zone, avoid)) continue;
    const d = Math.hypot(q.x - from.x, q.y - from.y);
    if (!best || d < best.d) best = { x: Math.round(q.x), y: Math.round(q.y), d };
  }
  return best ? { x: best.x, y: best.y } : null;
}
// The open-ground spot nearest a point (when the spot she came from is now under a piece).
export function openSpotNear(pt, layout, data, zone) {
  if (actorClear(pt, layout, data, zone)) return { x: pt.x, y: pt.y };
  for (let r = 20; r <= 800; r += 20) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const q = { x: Math.round(pt.x + Math.cos(a) * r), y: Math.round(pt.y + Math.sin(a) * r) };
      if (actorClear(q, layout, data, zone)) return q;
    }
  }
  return null;
}

// ---- animals (q3) ----
// Each zone animal: a kind from the shared library, a wander loop (world units, or offsets from the
// first piece of its `anchor` kind) and a speed (units per second). An anchored animal whose piece is
// not in her park stays home. At most `maxMoving` (about 6) move at once so phones stay smooth.
export function zoneAnimals(zone, layout, data) {
  const max = Math.max(0, Math.min(6, num(pg(data) && pg(data).maxMoving, 6)));
  const out = [];
  for (const a of (zone && Array.isArray(zone.animals) ? zone.animals : [])) {
    const kind = animalKind(data, a && a.kind);
    if (!kind || !Array.isArray(a.path) || a.path.length < 2) continue;
    let ox = 0; let oy = 0;
    if (a.anchor) {
      const e = layout.find((x) => x[0] === a.anchor);
      if (!e) continue;
      const b = pieceBox(e, data); ox = b.x + b.w / 2; oy = b.y + b.h / 2;
    }
    const w = worldOf(zone);
    const pts = a.path.map(([x, y]) => ({ x: Math.min(w.w - 20, Math.max(20, ox + num(x))), y: Math.min(w.h - 20, Math.max(20, oy + num(y))) }));
    // D (EM fix list): no animal ever lands on or crosses a pinned piece (the lifeguard)
    if (layout.some((e) => isPinned(e, zone) && loopCrosses(pts, pieceBox(e, data), ANIMAL_CLEAR))) continue;
    out.push({ kind: kind.id, art: kind.art, reaction: kind.reaction, sound: kind.sound || null, size: num(kind.size, 56), speed: Math.max(5, num(a.speed, 40)), pts, anchor: a.anchor || null });
    if (out.length >= max) break;
  }
  return out;
}
export const ANIMAL_CLEAR = 40;
export function loopCrosses(pts, box, pad = ANIMAL_CLEAR) {
  const L = loopLength(pts);
  for (let d = 0; d <= L; d += 10) {
    const q = alongLoop(pts, d);
    if (q.x >= box.x - pad && q.x <= box.x + box.w + pad && q.y >= box.y - pad && q.y <= box.y + box.h + pad) return true;
  }
  return false;
}
// Position along a closed loop after travelling `dist` units.
export function alongLoop(pts, dist) {
  const segs = pts.map((p, i) => [p, pts[(i + 1) % pts.length]]);
  const lens = segs.map(([a, b]) => Math.hypot(b.x - a.x, b.y - a.y));
  const total = lens.reduce((s, l) => s + l, 0) || 1;
  let d = ((dist % total) + total) % total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= lens[i] || i === segs.length - 1) {
      const [a, b] = segs[i]; const t = lens[i] ? d / lens[i] : 0;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dir: b.x >= a.x ? 1 : -1 };
    }
    d -= lens[i];
  }
  return { ...pts[0], dir: 1 };
}
export const loopLength = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + Math.hypot(q.x - p.x, q.y - p.y); }, 0);
// A dog trots a short way after a bird or squirrel and stops well short of it (no catching, q3).
export function chaseStep(from, to, max = 90, keep = 110) {
  const dx = to.x - from.x; const dy = to.y - from.y; const d = Math.hypot(dx, dy);
  if (d <= keep) return { x: from.x, y: from.y };
  const step = Math.min(max, d - keep);
  return { x: from.x + (dx / d) * step, y: from.y + (dy / d) * step };
}
export function nearestOf(list, pt, kinds) {
  let best = null;
  list.forEach((a, i) => {
    if (kinds && !kinds.includes(a.kind)) return;
    const d = Math.hypot(a.x - pt.x, a.y - pt.y);
    if (!best || d < best.d) best = { i, d };
  });
  return best;
}

// ---- tricks (q2, q5, q10 reduced motion) ----
// Which trick a piece plays for this character: at the splash pad or the pond a dog swims (q5).
export const isDog = (who) => !!who && who.kind === 'dog';
export function pieceTrick(piece, who) {
  if (!piece) return null;
  if (piece.water && isDog(who)) return 'swim';
  return piece.trick;
}
// The sounds a piece plays for this character: a swimming dog splashes and gives its own happy sound;
// anyone else at the water splashes and giggles (q5).
export function pieceSounds(piece, who) {
  if (!piece) return [];
  if (piece.water) return isDog(who) ? [piece.sound, who.sound || null].filter(Boolean) : [piece.sound, 'fx-giggle'].filter(Boolean);
  return piece.sound ? [piece.sound] : [];
}
// Reduced motion: every trick and ride becomes a short fade, with no spin loops (q10).
export function trickClass(kind, reduced) {
  return reduced ? 'pg-fade' : `pg-t-${kind}`;
}

// ---- rides and snacks (q10 ride shape, q11) ----
// A ride piece carries `ride {anim, seats, speed, ms, path}`. The path is a loop of offsets from the
// piece's centre (so it rides along with the piece wherever her park puts it), kept inside the world.
// Rides are slow: never faster than the walk speed x 1.5. One rider per bike or scooter, at most 2 at once.
export const isRide = (piece) => !!(piece && isObj(piece.ride) && Array.isArray(piece.ride.path) && piece.ride.path.length >= 2);
export const maxRiding = (data) => Math.max(1, Math.min(2, num(pg(data) && pg(data).maxRiding, 2)));
export const walkSpeedOf = (data) => Math.max(100, num(pg(data) && pg(data).walkSpeed, 500));
export function rideSpeed(piece, data) {
  return Math.min(walkSpeedOf(data) * 1.5, Math.max(60, num(piece && piece.ride && piece.ride.speed, 240)));
}
export function ridePath(entry, data, zone, layout = null) {
  const p = pieceById(data, entry && entry[0]);
  if (!isRide(p)) return [];
  const b = pieceBox(entry, data); const w = worldOf(zone);
  const cx = b.x + b.w / 2; const cy = b.y + b.h / 2;
  const make = (k = 1, dx = 0, sy = 1) => p.ride.path.map(([x, y, tag]) => {
    const q = { x: Math.min(w.w - 40, Math.max(40, cx + dx + num(x) * k)), y: Math.min(w.h - 10, Math.max(120, cy + num(y) * k * sy)) };
    if (typeof tag === 'string') q.tag = tag; // a ride beat at this point: peek, whoosh, tunnel (Amendment x1)
    return q;
  });
  if (!p.ride.roam || !Array.isArray(layout)) return make();
  const a = seatsOf(useOf(data, p.id))[0].at; const o = clampToWorld({ x: b.x + a[0], y: b.y + a[1] }, zone);
  for (const k of [1, 0.85, 0.7, 0.55, 0.4]) for (const dx of [0, -100, 100, -200, 200]) for (const sy of [1, -1]) {
    const pts = make(k, dx, sy);
    if (roamClear(o, pts, entry, layout, data, w)) return pts;
  }
  return [{ x: o.x + 12, y: o.y }, { x: o.x - 12, y: o.y }];
}
export const ROAM_FOOT = { w: 160, up: 44, down: 8 };
const same = (a, b) => a === b || (a[0] === b[0] && a[1] === b[1] && a[2] === b[2]);
export function roamClear(start, pts, entry, layout, data, world = null) {
  const F = ROAM_FOOT; const S = [start, ...pts, pts[0], start];
  const foot = (x, y, w = 0, h = 0) => ({ x: x - F.w / 2, y: y - F.up, w: F.w + w, h: F.up + F.down + h });
  const X = S.map((q) => q.x); const Y = S.map((q) => q.y); const x0 = Math.min(...X); const y0 = Math.min(...Y);
  const all = foot(x0, y0, Math.max(...X) - x0, Math.max(...Y) - y0);
  const others = layout.filter((o) => !same(o, entry)).map((o) => pieceBox(o, data)).filter((o) => overlap(all, o));
  for (let i = 1; i < S.length; i++) {
    const a = S[i - 1]; const c = S[i]; const n = Math.ceil(Math.hypot(c.x - a.x, c.y - a.y) / 8) || 1;
    for (let j = 0; j <= n; j++) {
      const f = foot(a.x + ((c.x - a.x) * j) / n, a.y + ((c.y - a.y) * j) / n);
      if (others.some((o) => overlap(f, o)) || (world && (f.x < 0 || f.x + f.w > world.w || f.y + f.h > world.h))) return false;
    }
  }
  return true;
}
export const BIKE = { saddle: 28, wheels: 97, span: [21, 179] };
const r1 = (v) => Math.round(v * 10) / 10;
export function smallRide(p, data, who, photo = false) {
  const f = p && p.ride && isObj(p.ride.fit) ? p.ride.fit : null;
  if (!f) return null;
  const k = num(f.rider, 1); const w = num(f.w, 150); const s = w / 200; const c = sizeRow(data, photo ? 'P' : sizeOf(data, who));
  const bottom = Array.isArray(c.bottom) ? num(c.bottom[1], 130) : 130;
  return { k, w: w / k, h: w / 2 / k, top: r1(FOOT[1] - (BIKE.wheels * s) / k), up: r1(((BIKE.wheels - BIKE.saddle) * s) / k + bottom - FOOT[1]), span: (BIKE.span[1] - BIKE.span[0]) * s, riderW: 160 * k };
}
// Where a ride lets the rider off: where it started, or (lazy ring) at the ladder, an offset in data.
export function rideOff(entry, data, zone, start) {
  const p = pieceById(data, entry && entry[0]);
  if (!isRide(p) || !Array.isArray(p.ride.offAt)) return { x: start.x, y: start.y };
  const b = pieceBox(entry, data);
  return clampToWorld({ x: b.x + b.w / 2 + num(p.ride.offAt[0]), y: b.y + b.h / 2 + num(p.ride.offAt[1]) }, zone);
}
// Big but gentle (Amendment q11/x1): no inversions, and no downhill leg steeper than the data max
// (the drop over the distance along the track). Climbs may be steeper: climbing never reads as falling.
export const maxHillSlope = (data) => Math.min(0.8, Math.max(0.1, num(pg(data) && pg(data).maxHillSlope, 0.65)));
export function steepestDrop(path) {
  let worst = 0;
  for (let i = 0; i < path.length; i++) {
    const a = path[i]; const b = path[(i + 1) % path.length];
    const dx = num(b[0]) - num(a[0]); const dy = num(b[1]) - num(a[1]);
    const len = Math.hypot(dx, dy);
    if (dy > 0 && len) worst = Math.max(worst, dy / len);
  }
  return worst;
}
// The gear a rider always wears: a helmet (bikes, scooters and the coaster rides) or floaties (water).
export const rideGear = (piece) => (piece && piece.ride && piece.ride.gear === 'floaties' ? 'floaties' : 'helmet');
// The car drawn with the rider (the piece's art by default; per character, e.g. friendSilly's banana seat).
export function rideCar(piece, whoId) {
  const r = piece && piece.ride; if (!r) return null;
  if (isObj(r.carFor) && typeof whoId === 'string' && Object.hasOwn(r.carFor, whoId)) return r.carFor[whoId];
  return r.car || piece.art;
}
export const rideSeats = (piece) => Math.max(1, Math.min(2, num(piece && piece.ride && piece.ride.seats, 1)));
// Teapots spin slowly: one turn every 2 s or slower (q11). A lap of the path is one turn.
export const SPIN_MIN_MS = 2000;
export function lapMs(piece, data) {
  if (!isRide(piece)) return 0;
  const pts = piece.ride.path.map(([x, y]) => ({ x: num(x), y: num(y) }));
  return Math.round((loopLength(pts) / rideSpeed(piece, data)) * 1000);
}
// The legs of one ride from `start`: on at the first point, round the loop, back to the first point,
// then hop off where it started. Each leg's ms keeps the ride at `speed`.
export function rideLegs(start, pts, speed) {
  if (!pts.length) return [];
  const stops = [...pts, pts[0], { x: start.x, y: start.y }];
  const legs = [];
  let at = start;
  for (const q of stops) {
    const d = Math.hypot(q.x - at.x, q.y - at.y);
    const leg = { x: q.x, y: q.y, ms: Math.round((d / speed) * 1000), dir: q.x >= at.x ? 1 : -1 };
    if (q.tag) leg.tag = q.tag;
    legs.push(leg);
    at = q;
  }
  return legs;
}
// Where the ride parts sit on the 160 px character drawing (design.md §15.4): the vehicle hangs from
// the feet line (the bottom of the drawing box) so the seat is under the body and the wheels show below
// the feet; the helmet sits on the top of the head. Per-character nudges live in data (rideFit).
export const VEHICLE = Object.freeze({ w: 150, h: 75, seatTop: 0.18, wheelTop: 0.46 });
export const HELMET = Object.freeze({ domeTop: 0.12, brim: 0.74, straps: 0.80 }); // of its size, from the pgHelmet art
export const HELMET_DROP = 14; // the brim sits this far below the top of the head...
export const FACE_CLEAR = 10; // ...but its lowest point (the strap ends) stays at least this far above the eye line (eye centres)
export function rideFit(data, id) {
  const f = (pg(data) && isObj(pg(data).rideFit)) ? pg(data).rideFit : {};
  const base = { head: 22, eyes: 48, feet: 160, helmet: 54, helmetX: 0, ...(isObj(f.default) ? f.default : {}) };
  const own = typeof id === 'string' && id !== 'default' && Object.hasOwn(f, id) && isObj(f[id]) ? f[id] : {};
  const o = { ...base, ...own };
  const keepClear = Array.isArray(o.keepClear) ? o.keepClear.filter((q) => Array.isArray(q) && q.length === 2).map(([x, y]) => [num(x), num(y)]) : [];
  // `over`: a part of the drawing (a group class) drawn again on top of the helmet, e.g. friendCounter's antennae
  const over = typeof o.over === 'string' && /^[a-z]+$/.test(o.over) ? o.over : null;
  return { head: num(o.head, 22), eyes: num(o.eyes, 48), feet: num(o.feet, 160), helmet: num(o.helmet, 54), helmetX: num(o.helmetX, 0), keepClear, over, size: o.size };
}
// Is a point (px in the 160 box) under the helmet? The dome is two curves from the pgHelmet art
// (M10 66 Q10 14 50 12 Q90 14 90 66, in a 100 box), then the brim band down to 74.
export function underHelmet(a, x, y) {
  const s = a.helmetSize, cx = 80 + a.helmetX;
  const u = (x - (cx - s / 2)) / s * 100, v = (y - a.helmetTop) / s * 100;
  if (v > 74 || v < 12) return false;
  if (v >= 66) return u >= 10 && u <= 96;
  // left curve y(t) = 66 - 104t + 50t^2 (falling from 66 to 12); x(t) = 10 + 40t^2; mirrored on the right
  const t = (104 - Math.sqrt(Math.max(0, 104 * 104 - 200 * (66 - v)))) / 100;
  const half = 50 - (10 + 40 * t * t);
  return Math.abs(u - 50) <= half;
}
export function rideAnchors(data, id) {
  const fit = rideFit(data, id);
  const wheelsBelow = 4; // the wheel tops sit just under the feet line
  const vehicleTop = Math.round(fit.feet + wheelsBelow - VEHICLE.h * VEHICLE.wheelTop);
  const brimY = Math.floor(Math.min(fit.head + HELMET_DROP, fit.eyes - FACE_CLEAR - fit.helmet * (HELMET.straps - HELMET.brim)));
  const helmetTop = Math.round(brimY - fit.helmet * HELMET.brim);
  return { vehicleTop, helmetTop, helmetSize: fit.helmet, helmetX: fit.helmetX, brimY, domeY: Math.round(helmetTop + fit.helmet * HELMET.domeTop),
    strapY: helmetTop + fit.helmet * HELMET.straps, seatY: vehicleTop + Math.round(VEHICLE.h * VEHICLE.seatTop), wheelY: vehicleTop + Math.round(VEHICLE.h * VEHICLE.wheelTop), fit };
}
// Floaties (design §16.5): drawn whenever a character is in a water area, on the top layer, never over
// the face. The kind is per character (a pet life vest, armbands, or a ring for the noodle shape), with
// its top in the 160 px drawing box; the numbers live in data (rideFit.<id>.floaty).
export const FLOATY_KINDS = Object.freeze(['vest', 'armbands', 'ring']);
export function floatyFit(data, who) {
  const id = who && who.id;
  const f = (pg(data) && isObj(pg(data).rideFit)) ? pg(data).rideFit : {};
  const own = typeof id === 'string' && id !== 'default' && Object.hasOwn(f, id) && isObj(f[id]) && isObj(f[id].floaty) ? f[id].floaty : {};
  const kind = FLOATY_KINDS.includes(own.kind) ? own.kind : (who && who.kind === 'friend' ? 'armbands' : 'vest');
  const fit = rideFit(data, id);
  return { kind, top: num(own.top, fit.eyes + 30), x: num(own.x, 0), w: num(own.w, kind === 'armbands' ? 150 : 110) };
}
// The CSS timing functions a move uses (ease-in-out for walks, ease-in for the frisbee run, linear, ease,
// ease-out): the share of the way along at time share t (0..1), so a frame can tell where she is drawn.
const EASES = { 'ease-in-out': [0.42, 0, 0.58, 1], 'ease-in': [0.42, 0, 1, 1], 'ease-out': [0, 0, 0.58, 1], ease: [0.25, 0.1, 0.25, 1], linear: [0, 0, 1, 1] };
export function easeAt(name, t) {
  const k = Math.min(1, Math.max(0, Number(t) || 0));
  const [x1, y1, x2, y2] = EASES[name] || EASES['ease-in-out'];
  const bez = (a, b, u) => 3 * a * u * (1 - u) * (1 - u) + 3 * b * u * u * (1 - u) + u * u * u;
  let lo = 0; let hi = 1; let u = k;
  for (let i = 0; i < 30; i++) { u = (lo + hi) / 2; if (bez(x1, x2, u) < k) lo = u; else hi = u; }
  return bez(y1, y2, u);
}
// Is this spot in a water area of a floaties zone (design §16.5: the splash pad, the lazy pool, the slide
// landing, the sprayers, bucket and cups)? Floaties are drawn whenever it is.
export function inWater(layout, data, zone, pt) {
  if (!zone || zone.floaties !== true || !pt) return false;
  return layout.some((e) => {
    const p = pieceById(data, e[0]);
    if (!p || !(p.water || p.wet)) return false;
    const b = pieceBox(e, data);
    return pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h;
  });
}
// The Water Park's cheer (EM fix B): an existing clip from data, with a guard gap; null where a zone has none.
export const CHEER_GAP_MS = 2000;
export function cheerOf(zone) {
  const c = zone && zone.cheer;
  if (!c || typeof c.clip !== 'string' || !/^c-/.test(c.clip)) return null;
  return { clip: c.clip, gapMs: Math.max(800, Math.min(4000, Number(c.gapMs) || CHEER_GAP_MS)) };
}
// Seat 2 (Amendment x1, EM fix A): she boards a second character herself. Who may ride in seat 2 is in data
// (`playground.seat2`: "any" or a list of ids); it is never the rider in seat 1, and only characters that are
// switched on. Anything else is dropped.
export function seat2Allowed(data, state, id, whoId) {
  if (typeof id !== 'string' || !id || id === whoId) return false;
  const list = pg(data) && pg(data).seat2;
  if (Array.isArray(list) && !list.includes(id)) return false;
  return playgroundCast(data, state).some((c) => c.id === id);
}
export const seat2Choices = (data, state, whoId) => playgroundCast(data, state).map((c) => c.id).filter((id) => seat2Allowed(data, state, id, whoId));
// §16.10: the rider row shows up to 4 of them, never her; each time it opens it moves on to the next 4
// in pick order (wrapping), so everyone gets a turn. No scrolling.
export const RIDER_ROW = 4;
export function riderPage(ids, rot = 0, n = RIDER_ROW) {
  const list = Array.isArray(ids) ? ids : [];
  if (!list.length) return { ids: [], next: 0 };
  const k = Math.min(n, list.length);
  const start = ((Math.floor(Number(rot)) || 0) % list.length + list.length) % list.length;
  return { ids: Array.from({ length: k }, (_, i) => list[(start + i) % list.length]), next: (start + k) % list.length };
}
export const sanitizeSeat2 = (data, state, id, whoId) => (seat2Allowed(data, state, id, whoId) ? id : null);
// Design fix 3: the picked character's whole drawing stays in view with a margin (zone start, gate arrival,
// arriving at a piece). Moves the camera only as far as needed, inside the world.
export const VIEW_MARGIN = 16;
export function fitInView(cam, pt, view, world, margin = VIEW_MARGIN) {
  const b = actorBox(pt);
  let { x, y } = cam;
  if (b.x - margin < x) x = b.x - margin;
  if (b.x + b.w + margin > x + view.w) x = b.x + b.w + margin - view.w;
  if (b.y - margin < y) y = b.y - margin;
  if (b.y + b.h + margin > y + view.h) y = b.y + b.h + margin - view.h;
  return clampCamera({ x, y }, view, world);
}
export function actorInView(cam, pt, view, margin = VIEW_MARGIN) {
  const b = actorBox(pt);
  return b.x - margin >= cam.x - 0.5 && b.x + b.w + margin <= cam.x + view.w + 0.5 && b.y - margin >= cam.y - 0.5 && b.y + b.h + margin <= cam.y + view.h + 0.5;
}
// The camera at zone start and gate arrival: centred on her, clamped so her whole drawing is in view
// (16 px), then (§16.10) nudged, only if she stays fully in view, so a pinned piece near her (the
// lifeguard and chair) sits wholly in view and clear of the overlays: the build button (top right) and
// the gate strip (bottom left).
export const OVERLAY = Object.freeze({ top: 116, bottom: 104, side: 8 });
export function startCamera(pt, layout, zone, data, view, world) {
  let cam = fitInView(centerOn(pt, view, world), pt, view, world);
  for (const e of (Array.isArray(layout) ? layout : []).filter((x) => isPinned(x, zone))) {
    const b = pieceBox(e, data);
    let { x, y } = cam;
    if (b.x - x < OVERLAY.side) x = b.x - OVERLAY.side;
    if (b.x + b.w - x > view.w - OVERLAY.side) x = b.x + b.w + OVERLAY.side - view.w;
    if (b.y + b.h - y > view.h - OVERLAY.bottom) y = b.y + b.h + OVERLAY.bottom - view.h;
    if (b.y - y < OVERLAY.top) y = b.y - OVERLAY.top;
    const c = clampCamera({ x, y }, view, world);
    if (actorInView(c, pt, view)) cam = c;
  }
  if (startOk(cam, pt, layout, zone, data, view)) return cam;
  const W = Math.max(0, world.w - view.w); const H = Math.max(0, world.h - view.h);
  const near = (st, x0, y0, strict, r = W + H) => {
    let best = null;
    for (let y = Math.max(0, y0 - r); y <= Math.min(H, y0 + r); y += st) for (let x = Math.max(0, x0 - r); x <= Math.min(W, x0 + r); x += st) {
      const c = clampCamera({ x, y }, view, world); const d = Math.hypot(c.x - cam.x, c.y - cam.y);
      if ((!best || d < best.d) && startOk(c, pt, layout, zone, data, view, strict)) best = { x: c.x, y: c.y, d };
    }
    return best;
  };
  for (const strict of [true, false]) {
    const b = near(8, 0, 0, strict);
    if (b) { const f = near(1, b.x, b.y, strict, 8) || b; return { x: f.x, y: f.y }; }
  }
  return cam;
}
export const buildRect = (view) => ({ x: view.w - 104, y: 8, w: 96, h: 96 });
export function drawnRect(s, cam, head = 22) {
  const k = num(s.scale, 1); const r = (num(s.rot) * Math.PI) / 180; const C = Math.cos(r) * k; const S = Math.sin(r) * k;
  const P = [[-80, head - 141], [80, head - 141], [-80, 19], [80, 19]]; const X = P.map(([x, y]) => x * C - y * S); const Y = P.map(([x, y]) => x * S + y * C);
  const x = Math.min(...X); const y = Math.min(...Y);
  return { x: s.x - cam.x + x, y: s.y - cam.y + y, w: Math.max(...X) - x, h: Math.max(...Y) - y };
}
export function freeSide(r, ov) {
  const o = ov.find((q) => overlap(r, q)); if (!o) return Math.min(r.w, r.h);
  const P = [{ ...r, w: o.x - r.x }, { ...r, x: o.x + o.w, w: r.x + r.w - o.x - o.w }, { ...r, h: o.y - r.y }, { ...r, y: o.y + o.h, h: r.y + r.h - o.y - o.h }];
  return Math.max(0, ...P.filter((q) => q.w > 0 && q.h > 0).map((q) => freeSide(q, ov)));
}
export function startOk(cam, pt, layout, zone, data, view, strict = false) {
  if (!actorInView(cam, pt, view)) return false;
  const lay = Array.isArray(layout) ? layout : []; const g = gateRects(view, otherGates(data, zone && zone.id).length); const ov = [...g, buildRect(view)];
  for (const e of lay.filter((x) => isPinned(x, zone))) {
    const b = pieceBox(e, data); const v = { x: b.x - cam.x, y: b.y - cam.y, w: b.w, h: b.h };
    if (v.x < 0 || v.y < 0 || v.x + v.w > view.w || v.y + v.h > view.h || ov.some((q) => overlap(v, q))) return false;
  }
  for (const [id, n, tap] of (zone && zone.startSee) || []) {
    const e = lay.find((x) => x[0] === id); if (!e) continue;
    const v = seenPart(cam, tap ? slotBox(e, 0, data, zone) : pieceBox(e, data), view);
    if (!(v.w > 0 && v.h > 0) || freeSide(v, ov) < n || (tap && g.some((q) => overlap({ x: v.x - 8, y: v.y - 8, w: v.w + 16, h: v.h + 16 }, q)))) return false;
  }
  if (strict && ov.some((q) => overlap(drawnRect({ x: pt.x, y: pt.y }, cam), q))) return false;
  return blockedTargets(cam, lay, data, zone, view, g).length === 0;
}
// Design fix 4 / §16.10: friendBerry's offer stands BESIDE the rider on the same ground line, never on top:
// the rider's body (the middle half of the 160 px drawing), a gap, friendBerry's body (a 96 px drawing),
// with the strawberry in the gap at paw height. It goes on the side with room; if neither side has room
// in the view, the camera shifts just enough (keeping the rider fully in view, 16 px margin) and the
// result says so. With `avoid` (the ride she just left) friendBerry stands off it when the other side
// works. Returns { side, who: feet point, treat: centre, cam }.
export const OFFER = Object.freeze({ body: 40, whoW: 96, whoBody: 24, gap: 56, treat: 44, paw: 58, pad: 8 });
export function offerSpot(pt, cam, view, world = null, avoid = null) {
  const D = OFFER.body + OFFER.gap + OFFER.whoBody; // centre to centre
  const reach = D + OFFER.whoW / 2 + OFFER.pad;
  const roomR = cam.x + view.w - pt.x; const roomL = pt.x - cam.x;
  const order = roomR >= roomL ? [1, -1] : [-1, 1];
  const build = (side, c) => ({ side, who: { x: pt.x + side * D, y: pt.y }, treat: { x: pt.x + side * (OFFER.body + OFFER.gap / 2), y: pt.y - OFFER.paw }, cam: c });
  const clear = (o) => !avoid || o.who.x + OFFER.whoW / 2 <= avoid.x || o.who.x - OFFER.whoW / 2 >= avoid.x + avoid.w || o.who.y <= avoid.y || o.who.y - OFFER.whoW >= avoid.y + avoid.h;
  const options = [];
  for (const side of order) if (side > 0 ? roomR >= reach : roomL >= reach) options.push(build(side, cam));
  // a side that needs the camera to shift a little (the rider still fully in view, 16 px margin)
  for (const side of order) {
    const want = side > 0 ? pt.x + reach - view.w : pt.x - reach;
    const c = world ? clampCamera({ x: want, y: cam.y }, view, world) : { x: want, y: cam.y };
    const fits = side > 0 ? c.x + view.w - pt.x >= reach : pt.x - c.x >= reach;
    if (fits && actorInView(c, pt, view) && !options.some((o) => o.side === side)) options.push(build(side, c));
  }
  // never standing on the ride she just left (e.g. the teapots) when the other side works
  return options.find(clear) || options[0] || build(order[0], cam);
}
// Riders and animals share one moving cap (x4): with someone on a ride, one fewer animal wanders.
export const MOVING_CAP = 6;
export const movingAnimals = (animals, riders) => Math.max(0, Math.min(animals, MOVING_CAP - Math.max(0, riders)));
export function canRide(riding, i, data) {
  return !riding.has(i) && riding.size < maxRiding(data);
}
// The snack stand gives only what is on the allowlist (q11): plain popcorn, plain cotton candy and
// soft-serve in a cup. Anything else in data is ignored.
export const SNACKS_ALLOWED = Object.freeze(['popcorn', 'cottonCandy', 'iceCreamCup']);
// The Water Park cooler (x2, EM 6:14 PM): watermelon, fruit pops and orange slices only, fruit only.
export const COOLER_ALLOWED = Object.freeze(['watermelon', 'fruitPop', 'orangeSlices']);
export const allowedFor = (piece) => (piece && piece.cooler ? COOLER_ALLOWED : SNACKS_ALLOWED);
export function snackList(piece) {
  const ok = allowedFor(piece);
  return piece && Array.isArray(piece.snacks) ? piece.snacks.filter((x) => ok.includes(x)) : [];
}
export function snackArt(data, id) {
  const m = pg(data) && isObj(pg(data).snackArt) ? pg(data).snackArt : {};
  return (SNACKS_ALLOWED.includes(id) || COOLER_ALLOWED.includes(id)) && Object.hasOwn(m, id) ? m[id] : null;
}
// Personality reactions by id (design §16.4): after a piece (or any ride), that character plays one of
// its own tricks. Data: playground.reactions [{who, after: <piece id> | 'anyRide', trick}].
export function reactionFor(data, whoId, piece) {
  const list = pg(data) && Array.isArray(pg(data).reactions) ? pg(data).reactions : [];
  if (!piece) return null;
  const r = list.find((x) => isObj(x) && x.who === whoId && (x.after === piece.id || (x.after === 'anyRide' && isRide(piece))));
  return r ? r.trick : null;
}

// ---- trick button glyphs (design.md §15.2) ----
// Each trick button gets its own picture from the art library; no two buttons for one character
// match. Candidates in order (Design's suggested map first); the star only as a last resort.
export const TRICK_GLYPHS = Object.freeze({
  offerBerry: ['strawberry'], numberSparkles: ['eqSparkle'], happyToot: ['cloud'], tailFlip: ['fish'],
  crunchSnack: ['carrot'], pawTap: ['paw'], dropBall: ['ball'],
  snuggle: ['red-heart', 'sh-heart'], cuddleLean: ['red-heart', 'sh-heart'], pileHug: ['red-heart', 'sh-heart'],
  spin: ['starRing'], boing: ['bubbles', 'kite', 'cloud'], tongueBoing: ['bubbles', 'cloud'], twirl: ['flower'],
  zoomies: ['jet'], loudHopPeek: ['kite'], petThenHop: ['kite'],
});
const GLYPH_SPARES = ['bubbles', 'kite', 'flower', 'cloud', 'ball', 'fish', 'paw', 'jet', 'starRing', 'eqSparkle', 'sh-heart'];
export function trickGlyphs(tricks, hasArt = () => true) {
  const used = new Set();
  return (Array.isArray(tricks) ? tricks : []).map((k) => {
    const pick = [...(Object.hasOwn(TRICK_GLYPHS, k) ? TRICK_GLYPHS[k] : []), ...GLYPH_SPARES].find((id) => !used.has(id) && hasArt(id)) || 'star';
    used.add(pick);
    return pick;
  });
}

// ---- frisbee (q4) ----
// Dogs only. The colour is in data (ids only); any other dog gets the default (red). Friends and
// non-dog pets get no frisbee.
export function frisbeeColor(data, who) {
  if (!isDog(who)) return null;
  const p = pg(data) || {};
  const colors = isObj(p.frisbeeColors) ? p.frisbeeColors : {};
  const name = typeof who.frisbee === 'string' && Object.hasOwn(colors, who.frisbee) ? who.frisbee : (p.frisbeeDefault || 'red');
  return { name, fill: Object.hasOwn(colors, name) ? colors[name] : '#E5484D' };
}
export function frisbeeTiming(data) {
  const m = (pg(data) && pg(data).frisbeeMs) || {};
  const fly = Math.min(600, Math.max(300, num(m.fly, 500)));
  const back = Math.min(980 - fly, Math.max(200, num(m.back, 380)));
  return { fly, back, total: fly + back };
}
// Where the disc lands: open ground a good throw away (ahead first, then behind), inside the world and
// off the pieces. If nothing is open it still lands, just a short hop away: it never gets lost.
export function frisbeeTarget(from, layout, zone, data, dir = 1) {
  const s = dir < 0 ? -1 : 1;
  // a midway or floating target nearby (Amendment x1/x2): the disc lands right on it
  let best = null;
  layout.forEach((e) => {
    const p = pieceById(data, e[0]);
    if (!p || !p.target) return;
    const b = pieceBox(e, data); const c = clampToWorld({ x: b.x + b.w / 2, y: b.y + b.h / 2 }, zone);
    const d = Math.hypot(c.x - from.x, c.y - from.y);
    if (d >= 110 && d <= 520 && (!best || d < best.d)) best = { ...c, d };
  });
  if (best) return { x: best.x, y: best.y, target: true };
  const open = (pt) => pieceAt(layout, data, pt.x, pt.y) < 0 && pieceAt(layout, data, pt.x, pt.y - 50) < 0;
  for (const d of [280, 240, 200, 160, 130]) {
    for (const side of [s, -s]) {
      for (const dy of [0, -70, 70]) {
        const c = clampToWorld({ x: from.x + side * d, y: from.y + dy }, zone);
        if (Math.hypot(c.x - from.x, c.y - from.y) >= 110 && open(c)) return c;
      }
    }
  }
  return clampToWorld({ x: from.x + s * 120, y: from.y }, zone);
}

// ---- the use engine (y3) ----
export const SLOP = 24;
export const TARGET_MIN = 148;
export const HOP_MS = 400;
export const BOARD_MS = 300;
export const FOOT = Object.freeze([80, 141]);
const useT = (data) => (pg(data) && isObj(pg(data).use) ? pg(data).use : {});
const typeOf = (data, t) => (isObj(useT(data).types) && isObj(useT(data).types[t]) ? useT(data).types[t] : {});
export function useOf(data, id) {
  const t = useT(data).pieces; const p = pieceById(data, id);
  return p && isObj(t) && Object.hasOwn(t, p.id) && isObj(t[p.id]) ? t[p.id] : null;
}
export const seatsOf = (u) => (u && Array.isArray(u.seats) ? u.seats.slice(0, 2) : []);
const seatOf = (u, k) => seatsOf(u)[k] || seatsOf(u)[0];
export function sizeOf(data, who, photo = false) {
  const s = rideFit(data, who && who.id).size;
  return photo || !['S', 'M', 'L'].includes(s) ? 'M' : s;
}
export function useFit(data, who, type, photo = false, u = null) {
  const k = sizeOf(data, who, photo); const c = sizeRow(data, photo ? 'P' : k);
  const T = typeOf(data, type);
  const scale = num(u && isObj(u.scale) ? u.scale[k] : isObj(T.scale) ? T.scale[k] : c.scale, 1);
  const b = !T.feet && Array.isArray(c.bottom) ? c.bottom : FOOT;
  return { size: k, scale, dx: (num(b[0]) - FOOT[0]) * scale, dy: (num(b[1]) - FOOT[1]) * scale };
}
export function slotBox(entry, k, data, zone) {
  const b = pieceBox(entry, data); const s = seatsOf(useOf(data, entry[0]));
  let r = { ...b };
  if (s.length === 2) {
    const [a, c] = s.map((q) => q.at);
    const vx = Math.abs(a[0] - c[0]) >= Math.abs(a[1] - c[1]); const ax = vx ? 0 : 1; const len = vx ? b.w : b.h;
    const cut = Math.min(len - 100, Math.max(100, (a[ax] + c[ax]) / 2));
    const P = vx ? 'x' : 'y'; const L = vx ? 'w' : 'h';
    if (s[k ? 1 : 0].at[ax] <= s[k ? 0 : 1].at[ax]) r[L] = cut; else { r[P] += cut; r[L] = len - cut; }
  }
  const w = worldOf(zone);
  const grow = (lo, size, max) => {
    let a = lo - SLOP; let z = lo + size + SLOP;
    if (a < 0) { z = Math.min(max, z - a); a = 0; }
    if (z > max) { a = Math.max(0, a - (z - max)); z = max; }
    return [a, z - a];
  };
  const [x, ww] = grow(r.x, r.w, w.w); const [y, hh] = grow(r.y, r.h, w.h);
  return { x, y, w: ww, h: hh };
}
export const bodyBox = (pt) => ({ x: pt.x - 40, y: pt.y - 116, w: 80, h: 110 });
const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
const inBox = (p, b) => !!p && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
export function dropTarget(layout, data, zone, body, finger = null) {
  let best = null;
  layout.forEach((e, i) => seatsOf(useOf(data, e[0])).forEach((_, seat) => {
    const t = slotBox(e, seat, data, zone);
    const score = area(t, body) || (inBox(finger, t) ? 0.5 : 0);
    if (!score) return;
    const d = Math.hypot(t.x + t.w / 2 - body.x - body.w / 2, t.y + t.h / 2 - body.y - body.h / 2);
    if (!best || score > best.score || (score === best.score && d < best.d)) best = { i, seat, score, d };
  }));
  return best && { i: best.i, seat: best.seat };
}
export function useExit(entry, k, data, zone, layout = []) {
  const u = useOf(data, entry[0]); const b = pieceBox(entry, data); const s = seatOf(u, k);
  const at = clampToWorld({ x: b.x + s.at[0], y: b.y + s.at[1] }, zone);
  if (isRide(pieceById(data, entry[0]))) return rideOff(entry, data, zone, at);
  const q = s.exit || u.exit;
  const pt = q ? clampToWorld({ x: b.x + q[0], y: b.y + q[1] }, zone) : at;
  const on = pieceAt(layout, data, pt.x, pt.y);
  return on >= 0 && !same(layout[on], entry) ? openSpotNear(pt, layout, data, zone) || pt : pt;
}
export function useSteps(entry, k, who, data, zone, reduced = false, photo = false, layout = []) {
  const u = useOf(data, entry[0]); if (!u) return [];
  const p = pieceById(data, entry[0]); const b = pieceBox(entry, data); const s = seatOf(u, k);
  const ride = isRide(p); const f = useFit(data, who, u.type, photo, u); const T = typeOf(data, u.type);
  const st = (q, ms, pose = '', layer = '', tag = '', phase = 'using', rot = 0) => ({ x: Math.round(q.x), y: Math.round(q.y), ms: Math.max(0, Math.round(num(ms))), pose, layer, scale: ride ? 1 : f.scale, tag, phase, rot: photo ? 0 : Math.round(rot) });
  const loc = (q) => ({ x: b.x + num(q[0]) - f.dx, y: b.y + num(q[1]) - f.dy });
  const ex = useExit(entry, k, data, zone, layout);
  const board = st(ride ? clampToWorld({ x: b.x + s.at[0], y: b.y + s.at[1] }, zone) : loc(s.at), BOARD_MS, s.hands ? 'hold' : 'sit', '', '', 'boarding');
  const hop = { ...st(ex, HOP_MS, '', '', '', 'hopOff'), scale: 1 };
  if (ride) {
    const pts = ridePath(entry, data, zone, layout);
    if (reduced) {
      const pk = pts.find((q) => q.tag === 'peek' || q.tag === 'view');
      const mid = p.ride.go || pk ? [st(pk || board, 1000, 'sit', '', 'fun'), st(board, 1000, 'sit')] : [st(board, 600, 'sit', '', 'fun')];
      return [{ ...board, ms: 0 }, ...mid, { ...hop, ms: 0, fade: true }];
    }
    return [board, ...rideLegs(board, pts, rideSpeed(p, data)).map((L) => st(L, L.ms + (L.tag === 'view' ? 1000 : 0), 'sit', '', L.tag || '')), hop];
  }
  if (reduced) return [{ ...board, ms: 0, fade: true }, { ...board, ms: 600, pose: T.rm || '', tag: 'fun', phase: 'using' }, { ...hop, ms: 0, fade: true }];
  const out = [board];
  if (isObj(u.orbit)) {
    const o = u.orbit; const [cx, cy] = o.c; const n = 8;
    const a0 = Math.atan2((s.at[1] - cy) / o.ry, (s.at[0] - cx) / o.rx);
    for (let i = 1; i <= n * num(o.turns, 1); i++) {
      const a = a0 + (i * 2 * Math.PI) / n; const q = [cx + o.rx * Math.cos(a), cy + o.ry * Math.sin(a)];
      const far = q[1] < cy - 1;
      out.push({ ...st(loc(q), num(o.ms, 1600) / n, 'hold', '', i === 1 ? 'fun' : ''), pole: true, ...(far ? { far: true } : {}), scale: far ? Math.round(f.scale * 90) / 100 : f.scale }); // far half: behind the post
    }
  }
  if (isObj(u.pivot)) {
    const v = u.pivot; const pv = Array.isArray(v.at) ? v.at : [s.at[0], num(v.y)]; const n = num(v.cycles, 3) * 4;
    const dx = s.at[0] - pv[0]; const dy = s.at[1] - pv[1];
    for (let i = 0; i < n; i++) {
      const a = [1, 0, -1, 0][i % 4] * num(v.deg, 12); const r = (a * Math.PI) / 180;
      if (v.tilt) {
        const m = 1 + 0.1 * Math.sin(r);
        out.push({ ...st({ x: b.x + s.at[0] - f.dx * m, y: b.y + pv[1] + dy * Math.cos(r) - f.dy * m }, num(v.ms, 2400) / n, 'hold', '', i ? '' : 'fun'), scale: Math.round(f.scale * m * 1000) / 1000, swing: a, seat: Math.round(FOOT[1] + f.dy / f.scale) });
        continue;
      }
      const q = loc([pv[0] + dx * Math.cos(r) - dy * Math.sin(r), pv[1] + dx * Math.sin(r) + dy * Math.cos(r)]);
      out.push(st(q, num(v.ms, 2400) / n, 'hold', '', i ? '' : 'fun'));
    }
  }
  for (const q of (Array.isArray(u.path) ? u.path : [])) {
    const o = isObj(q[6]) ? q[6] : {}; const cl = o.peek ? peekLine(data, who, photo) : 0;
    const t = st(cl ? { x: b.x + num(q[0]) - f.dx, y: b.y + num(q[1]) + (FOOT[1] - cl) * f.scale } : loc(q), q[2], q[3] || '', q[4] || '', q[5] || '');
    out.push(cl ? { ...t, clip: cl } : o.wade ? { ...t, clip: waterLine(data, who), ripple: true } : o.hide ? { ...t, hide: true } : t);
  }
  out.push(hop);
  return out;
}
const sizeRow = (data, k) => { const z = pg(data).rideFit.size; return isObj(z) && isObj(z[k]) ? z[k] : {}; };
export function peekLine(data, who, photo = false) {
  const c = sizeRow(data, photo ? 'P' : sizeOf(data, who)); const head = rideFit(data, who && who.id).head;
  return Math.min(160, Math.max((Array.isArray(c.paws) ? num(c.paws[1], 100) : 100) + 10, Math.ceil(head + (160 - head) / 2)));
}
export const FLOATY_H = { vest: 60, armbands: 40, ring: 44 };
export const waterLine = (data, who) => { const f = floatyFit(data, who); return Math.round(Math.min(150, f.top + (f.w * (FLOATY_H[f.kind] || 50)) / 200)); };
export const GATE = { inset: 8, size: 96, gap: 10 };
export const gateRects = (view, n) => Array.from({ length: n }, (_, i) => ({ x: GATE.inset + i * (GATE.size + GATE.gap), y: view.h - GATE.inset - GATE.size, w: GATE.size, h: GATE.size }));
export function seenPart(cam, t, view) {
  const x = Math.max(0, t.x - cam.x); const y = Math.max(0, t.y - cam.y);
  return { x, y, w: Math.min(view.w, t.x - cam.x + t.w) - x, h: Math.min(view.h, t.y - cam.y + t.h) - y };
}
export function targetClear(cam, t, view, blocks) {
  const s = seenPart(cam, t, view);
  return s.w >= TARGET_MIN && s.h >= TARGET_MIN && !blocks.some((g) => overlap(s, g));
}
export function useCam(cam, t, view, world, blocks, feet = null) {
  const base = feet ? fitInView(cam, feet, view, world) : clampCamera(cam, view, world);
  if (targetClear(base, t, view, blocks)) return base;
  const gy = Math.min(view.h, ...blocks.map((g) => g.y)) - 1;
  const ys = [base.y, t.y + t.h - gy, t.y - 8]; const xs = [base.x, t.x + t.w / 2 - view.w / 2, t.x - 8];
  const score = (c) => (feet && !actorInView(c, feet, view) ? 1e6 : 0) + Math.hypot(c.x - base.x, c.y - base.y);
  const ok = ys.flatMap((y) => xs.map((x) => clampCamera({ x, y }, view, world))).filter((c) => targetClear(c, t, view, blocks));
  return ok.sort((a, c) => score(a) - score(c))[0] || base;
}
export function boxClear(cam, s, view, ov, head = 22, m = VIEW_MARGIN) {
  const d = drawnRect(s, cam, head);
  if (d.x < m - 0.5 || d.y < m - 0.5 || d.x + d.w > view.w - m + 0.5 || d.y + d.h > view.h - m + 0.5) return false;
  const g = { x: d.x - m + 0.5, y: d.y - m + 0.5, w: d.w + 2 * m - 1, h: d.h + 2 * m - 1 };
  return !ov.some((q) => overlap(g, q));
}
const camCands = (s, view, ov, head, m = VIEW_MARGIN) => {
  const d = drawnRect(s, O, head);
  const xs = [d.x - m, d.x + d.w + m - view.w]; const ys = [d.y - m, d.y + d.h + m - view.h];
  for (const q of ov) { xs.push(d.x - m - q.x - q.w, d.x + d.w + m - q.x); ys.push(d.y - m - q.y - q.h, d.y + d.h + m - q.y); }
  return { xs, ys };
};
export const USE_ROOM = 96; const O = { x: 0, y: 0 };
const lim = (v, hi) => Math.min(hi + USE_ROOM, Math.max(-USE_ROOM, num(v)));
export const clampUse = (c, view, world) => ({ x: lim(c.x, world.w - view.w), y: lim(c.y, world.h - view.h) });
export function keepCam(cam, s, view, world, ov, head = 22, ok = () => true) {
  if (boxClear(cam, s, view, ov, head) && ok(cam)) return cam;
  const { xs, ys } = camCands(s, view, ov, head);
  const all = [cam.x, ...xs].flatMap((x) => [cam.y, ...ys].map((y) => clampUse({ x, y }, view, world)));
  const by = (a, b) => Math.hypot(a.x - cam.x, a.y - cam.y) - Math.hypot(b.x - cam.x, b.y - cam.y);
  const pick = (o) => all.filter((c) => boxClear(c, s, view, o, head) && ok(c)).sort(by)[0];
  return pick(ov) || pick([]) || cam;
}
export function useCams(cam, t, steps, view, world, nGates, head = 22) {
  const gates = gateRects(view, nGates); const ov = [...gates, buildRect(view)];
  const c0 = useCam(cam, t, view, world, gates, steps[0]);
  const tOk = (c) => targetClear(c, t, view, gates);
  if (steps.every((s) => boxClear(c0, s, view, ov, head))) return steps.map(() => c0);
  const out = []; let c = keepCam(c0, steps[0], view, world, ov, head, tOk);
  if (c === c0 && !boxClear(c0, steps[0], view, ov, head)) c = keepCam(c0, steps[0], view, world, ov, head);
  for (const s of steps) { c = keepCam(c, s, view, world, ov, head); out.push(c); }
  return out;
}
export function blockedTargets(cam, layout, data, zone, view, blocks) {
  const out = [];
  layout.forEach((e, i) => seatsOf(useOf(data, e[0])).forEach((_, seat) => {
    const s = seenPart(cam, slotBox(e, seat, data, zone), view);
    if (s.w > 0 && s.h > 0 && blocks.some((g) => overlap(s, g))) out.push({ i, id: e[0], seat });
  }));
  return out;
}
