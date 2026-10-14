// Hide and Seek Puppy (Amendment r): the pure parts. A round is one scene (never twice in a row): Puppy counts
// (Dad's hideCount), then 4 questions by level (L1 in/on/under with a peek, L2 + behind/next to with a wiggle,
// L3 colour + where, L4 her turn) and find-all (3 hiders, L1 peeks); about 1 round in 5 has the silly moment.
// Questions are joined clips; never a typed name (r5). friendSilly/friendDino hide only at L1 and in find-all.
export const HIDE_COUNTS = [30, 20, 10, 0]; // 0 = Skip (store.js keeps the same rule for a save)
export const HIDE_COUNT_DEFAULT = 30;
export const QUESTIONS = 4; // then find-all: 5 in a round (the standard progress() rule)
export const FIND_ALL = 3;

const pickOne = (list, rng) => list[Math.floor(rng() * list.length) % list.length];
// Dad's count setting, sanitised: 30, 20, 10 or 0 (Skip); anything else is the default 30.
export function sanitizeHideCount(v) {
  return HIDE_COUNTS.includes(v) ? v : HIDE_COUNT_DEFAULT;
}
// The next count option, for the Dad button (30 -> 20 -> 10 -> Skip -> 30).
export const nextHideCount = (v) => HIDE_COUNTS[(HIDE_COUNTS.indexOf(sanitizeHideCount(v)) + 1) % HIDE_COUNTS.length];
export const countLabel = (v) => (sanitizeHideCount(v) === 0 ? 'Skip' : String(sanitizeHideCount(v)));

export function shuffled(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}


// The count: n-1 ... n-N, and Puppy's tail wags at 10, 20 and 30.
export function countClips(hide, n) {
  const N = sanitizeHideCount(n);
  const pre = (hide.clips && hide.clips.numberPrefix) || 'n-';
  return Array.from({ length: N }, (_, i) => `${pre}${i + 1}`);
}
export const wagsAt = (hide, k) => k > 0 && k % ((hide.count && hide.count.wagEvery) || 10) === 0;

export const levelOf = (hide, lv) => hide.levels[Math.min(hide.levels.length, Math.max(1, Math.floor(Number(lv)) || 1)) - 1];
export const wordById = (hide, id) => hide.words.find((w) => w.id === id) || null;
export const sceneById = (hide, id) => hide.scenes.find((s) => s.id === id) || null;
export const hiderById = (hide, id) => hide.hiders.find((x) => x.id === id) || null;
export const colorById = (hide, id) => hide.colors.find((c) => c.id === id) || null;
export const spotOf = (scene, id) => scene.spots.find((s) => s.id === id) || null;

// Who may hide: friends always; kitty and bunny only when Dad has them switched on (ids only).
export function hidersFor(hide, state) {
  const pets = (state && state.pets) || {};
  return hide.hiders.filter((x) => !x.pet || !pets[x.id] || pets[x.id].on !== false);
}

// One scene per round, rotating: never the same scene twice in a row.
export function pickScene(hide, last, rng = Math.random) {
  const pool = hide.scenes.length > 1 ? hide.scenes.filter((s) => s.id !== last) : hide.scenes;
  return pickOne(pool, rng);
}

// The silly moment: about 1 round in 5, never on the first round of the visit.
export function sillyRoll(hide, roundNo, rng = Math.random) {
  if (!(roundNo > 1)) return false;
  return rng() < ((hide.silly && hide.silly.chance) || 0.2);
}
export function sillyHider(hide, state) {
  const on = hidersFor(hide, state).map((x) => x.id);
  return ((hide.silly && hide.silly.hiders) || []).find((id) => on.includes(id)) || on[0];
}

// One question. kind 'find' (L1-L3) or 'put' (L4). spots: [{id, color?}] in screen order.
export function buildQuestion(hide, { level = 1, scene, hiders, lastHider = null, lastSpot = null, rng = Math.random }) {
  const L = levelOf(hide, level);
  const words = L.words;
  // the answer: a spot in this scene that takes at least one of the level's words (not the last answer)
  let cands = scene.spots.filter((s) => s.words.some((w) => words.includes(w)) && (!L.color || s.colorable));
  if (cands.length > 1) cands = cands.filter((s) => s.id !== lastSpot);
  const ans = pickOne(cands, rng);
  const word = pickOne(ans.words.filter((w) => words.includes(w)), rng);
  const others = shuffled(scene.spots.filter((s) => s.id !== ans.id), rng).slice(0, L.spots - 1);
  const shown = shuffled([ans, ...others], rng);
  // friendSilly's horn and friendDino's spikes always show, so they hide only at L1 (and in find-all);
  // L2-L4 use kitty, bunny (when on) or friendCounter, so those levels stay without a peek (design §17.1)
  const who = L.lv === 1 ? hiders : hiders.filter((x) => !x.always);
  const base = who.length ? who : hiders;
  const pool = base.length > 1 ? base.filter((x) => x.id !== lastHider) : base;
  const hider = pickOne(pool, rng);
  const spots = shown.map((s) => ({ id: s.id }));
  let color = null;
  if (L.color) {
    // every colourable spot on screen gets its own colour; the call names the answer's colour
    const cols = shuffled(hide.colors, rng);
    let k = 0;
    for (const s of spots) if (spotOf(scene, s.id).colorable) s.color = cols[k++ % cols.length].id;
    color = spots.find((s) => s.id === ans.id).color;
  }
  return {
    kind: L.yourTurn ? 'put' : 'find', level: L.lv, scene: scene.id, spots, answer: ans.id, word, color,
    hider: hider.id, clue: hiderClue(hide, hider, L),
  };
}

// What shows of a hidden friend: L1 a peek (ears, horn, feelers or spikes); friendSilly's horn and friendDino's
// spikes always poke out (so they hide only at L1 and in find-all); L2 a little wiggle of the spot; L3 nothing.
export function hiderClue(hide, hider, L) {
  if (L.yourTurn) return null;
  if (hider.always) return 'peek';
  return L.clue || null;
}

// The last question: "Find ALL my friends!" 3 different friends in 3 of the scene's 4 spots.
// It is the celebration at the end of the round: the L1 peek clues at every level (design §17.1).
export function buildFindAll(hide, { level = 1, scene, hiders, rng = Math.random }) {
  const LL = levelOf(hide, 1);
  const who = shuffled(hiders, rng).slice(0, FIND_ALL);
  const spots = shuffled(scene.spots, rng);
  const hidden = shuffled(spots, rng).slice(0, who.length).map((s, i) => ({ spot: s.id, hider: who[i].id, word: pickOne(s.words, rng), clue: hiderClue(hide, who[i], LL) }));
  return { kind: 'findAll', scene: scene.id, spots: spots.map((s) => ({ id: s.id })), hidden };
}

// A whole round: the scene, the count, 4 questions and find-all, and the silly moment.
export function buildRound(hide, { level = 1, state = {}, lastScene = null, roundNo = 1, rng = Math.random } = {}) {
  const scene = pickScene(hide, lastScene, rng);
  const hiders = hidersFor(hide, state);
  const questions = [];
  let lastHider = null; let lastSpot = null;
  for (let i = 0; i < QUESTIONS; i++) {
    const q = buildQuestion(hide, { level, scene, hiders, lastHider, lastSpot, rng });
    lastHider = q.hider; lastSpot = q.answer;
    questions.push(q);
  }
  questions.push(buildFindAll(hide, { level, scene, hiders, rng }));
  const silly = sillyRoll(hide, roundNo, rng);
  return {
    scene: scene.id, level: levelOf(hide, level).lv, count: sanitizeHideCount(state.hideCount), questions,
    silly: silly ? { after: (hide.silly && hide.silly.after) || 2, hider: sillyHider(hide, state) } : null,
  };
}

// The joined call for a question.
export function questionSeq(hide, q) {
  const c = hide.clips;
  if (q.kind === 'findAll') return [c.findAll];
  const scene = sceneById(hide, q.scene);
  const word = wordById(hide, q.word);
  const spot = spotOf(scene, q.answer);
  const who = hiderById(hide, q.hider);
  const col = q.color ? [colorById(hide, q.color).clip] : [];
  if (q.kind === 'put') return [c.yourTurn, { pause: 250 }, c.put, who.clip, word.clip, ...col, spot.clip];
  return [c.where, who.clip, { pause: 200 }, c.tap, word.clip, ...col, spot.clip];
}
// After a wrong tap the spot peeks open (empty) and the call plays again; nothing else happens.
export const peekSeq = (hide, q) => [hide.clips.peek, { pause: 250 }, ...questionSeq(hide, q)];
export const ringSeq = (hide) => [hide.clips.giggle];

// Dad's text for the current question (text only, never spoken).
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
export function hiderName(data, id) {
  const x = [...(data.pets || []), ...(data.friends || [])].find((p) => p.id === id);
  if (!x) return id;
  return x.kind === 'friend' ? x.label : `the ${x.label.toLowerCase()}`;
}
export function dadLine(hide, data, q) {
  const scene = sceneById(hide, q.scene);
  if (q.kind === 'findAll') {
    return `Find all 3: ${q.hidden.map((x) => `${hiderName(data, x.hider)} (${spotOf(scene, x.spot).text})`).join(', ')}.`;
  }
  const spot = spotOf(scene, q.answer);
  const where = `${wordById(hide, q.word).text} the ${q.color ? `${q.color} ` : ''}${spot.text}`;
  if (q.kind === 'put') return `Her turn: tap ${hiderName(data, q.hider)}, then the ${spot.text}. ("Put ${hiderName(data, q.hider)} ${where}.")`;
  return `${cap(hiderName(data, q.hider))} is ${where}.`;
}
export const realIdea = (hide, sceneId) => (sceneById(hide, sceneId) || {}).real || '';
