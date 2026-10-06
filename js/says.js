// Puppy Says (Amendment 2026-10-05p): the pure parts, importable from Node. A round is a list of
// calls built from activities.json -> says: 5 moves (3 with Dad's Short round), then 1 gym move, then
// the calm finish, then the surprise box. There is no timer, no score and nobody is out: every call
// waits for the paw button. Only an L4 trick call (the lead dropped) moves on by itself, after the giggle.
//   L1  lead + move                      "Puppy says... touch your nose!"
//   L2  lead + count verb + n-N + times  "Puppy says... hop... 3... times!" (a big digit pops on each beat)
//   L3  lead + move A + then + move B    one paw tap at the end
//   L4  like L1, but about 1 call in 4 (never the first, never two in a row, never the calm) drops the lead
export const SAYS_MOVES = 5;
export const SAYS_SHORT_MOVES = 3;
export const COUNTS = [2, 3, 4, 5];
export const DROP_CHANCE = 0.4; // per eligible call; with "never first, never twice in a row" about 1 call in 4 drops
export const GIGGLE_MS = 2000; // after a dropped lead, the giggle comes about 2 s later
export const BEAT_MS = 850; // one beat of an L2 count (a digit pops)
export const ANIMS = ['hop', 'clap-paws', 'spin', 'reach', 'stomp', 'flap', 'wiggle', 'freeze-sit', 'breathe-lie'];

const pick = (list, rng) => list[Math.floor(rng() * list.length) % list.length];
function shuffled(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Every move, gym move and the calm finish by id.
export function moveIndex(says) {
  const out = {};
  for (const m of [...(says.moves || []), ...(says.gym || []), says.calm].filter(Boolean)) out[m.id] = m;
  return out;
}

// Build one round. level 1-4, short = Dad's Short round. Returns [{kind, move, then?, count?, drop?}].
export function buildRound(says, { level = 1, short = false, rng = Math.random } = {}) {
  const lv = Math.min(4, Math.max(1, Math.floor(Number(level)) || 1));
  const n = short ? SAYS_SHORT_MOVES : SAYS_MOVES;
  const moves = says.moves || [];
  let order;
  if (lv === 2) {
    // counting: the countable moves first, then plain moves fill up, in a mixed order
    const countable = shuffled(moves.filter((m) => m.count), rng);
    const plain = shuffled(moves.filter((m) => !m.count), rng);
    order = shuffled([...countable, ...plain].slice(0, n), rng);
  } else {
    order = shuffled(moves, rng).slice(0, n);
  }
  const calls = order.map((m) => {
    const c = { kind: 'move', move: m.id };
    if (lv === 2 && m.count) c.count = pick(COUNTS, rng);
    if (lv === 3) c.then = pick(moves.filter((x) => x.id !== m.id), rng).id;
    return c;
  });
  const gym = pick(says.gym || [], rng);
  const g = { kind: 'gym', move: gym.id };
  if (lv === 2 && gym.count) g.count = pick(COUNTS, rng);
  calls.push(g);
  if (lv === 4) {
    // never the first call, never two in a row; the calm finish always has the lead
    for (let i = 1; i < calls.length; i++) if (!calls[i - 1].drop && rng() < DROP_CHANCE) calls[i].drop = true;
  }
  calls.push({ kind: 'calm', move: says.calm.id });
  return calls;
}

// The clip sequence for a call. `lead` is the lead piece: the ps-lead clip id, or { speak: '...' }
// when the name rule (Amendment n) lets the phone's own voice say "<name> says...".
export function callSeq(says, call, lead = says.lead) {
  const ix = moveIndex(says);
  const m = ix[call.move];
  if (!m) return [];
  if (call.drop) return [m.clip];
  if (call.count) return [lead, m.countClip, `n-${call.count}`, says.times];
  if (call.then && ix[call.then]) return [lead, m.clip, says.then, ix[call.then].clip];
  return [lead, m.clip];
}

// The giggle after a dropped lead: "Silly! I didn't say..." + the lead.
export const giggleSeq = (says, lead = says.lead) => [says.silly, lead];

// The puppy poses for a call, in order (L3 does move A, then move B).
export function callAnims(says, call) {
  const ix = moveIndex(says);
  if (call.drop) return ['freeze-sit'];
  return [ix[call.move], ix[call.then]].filter(Boolean).map((m) => m.anim);
}

// Dad's one line for the current call (Dad text is allowed; never spoken).
export function dadLine(says, call) {
  const ix = moveIndex(says);
  const m = ix[call.move];
  if (!m) return '';
  if (call.drop) return `Trick: "${m.text.replace(/!$/, '')}" without "Puppy says". Stay still!`;
  if (call.count) return `${m.countText} ${call.count} times.`;
  if (call.then && ix[call.then]) return `${m.text.replace(/!$/, '')}, then ${ix[call.then].text.charAt(0).toLowerCase()}${ix[call.then].text.slice(1)}`;
  return m.text;
}

// Split a sequence into runs of clips and spoken pieces, played one after another.
export function splitSeq(seq) {
  const out = [];
  for (const x of seq) {
    if (x && typeof x === 'object' && typeof x.speak === 'string') out.push({ speak: x.speak });
    else if (typeof x === 'string' || (x && typeof x === 'object' && Number.isFinite(x.pause))) {
      const last = out[out.length - 1];
      if (last && last.clips) last.clips.push(x); else out.push({ clips: [x] });
    }
  }
  return out;
}

// The lead line the phone's own voice says when the name rule allows it.
export const leadText = (name) => `${name} says...`;
