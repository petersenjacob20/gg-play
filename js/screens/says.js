// Puppy Says (Amendment 2026-10-05p; route #game/says or #says). A real "Puppy says" game she plays
// off the screen: the drawn puppy (never a photo, always the default label when Dad has the puppy off)
// calls a move and does it slowly, she does it for real, and she or Dad taps the big paw button
// ("I'm done", the only tap target). Nothing is checked: there is no camera and no microphone. No
// timer, no score, nobody is out: Puppy bounces and waits as long as it takes. The only thing that
// moves on by itself is the L4 giggle after a call without "Puppy says". A round is 5 moves (3 with
// Dad's Short round), 1 gym move, the calm finish, then the surprise box; it always counts as a good round.
import { h, drawing } from '../dom.js';
import { drawChar } from '../pets.js';
import { ICONS } from '../pics.js';
import { topBar, paws, fillPaw, icon } from '../ui.js';
import { progress, pickStickers, pickNot, ROUND } from '../engine.js';
import { roundEnd } from '../reward.js';
import { getBook, activeProfile } from '../store.js';
import { gameById, ladderMax, stepAt, keysForLevel } from '../games.js';
import { speakLocal, speakableName, cancelSpeech } from '../character.js';
import { buildRound, callSeq, giggleSeq, callAnims, dadLine, splitSeq, leadText, GIGGLE_MS, BEAT_MS } from '../says.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SPEECH_MAX_MS = 4000; // a spoken lead that never reports its end does not hold the call up

// When the route changes, the phone's own voice stops too (clips are stopped by the router).
export function leave() { cancelSpeech(); }

export function render(ctx) {
  const data = ctx.data;
  const says = data.says;
  const game = ctx.game || gameById(data.games, 'says');
  const profile = activeProfile(ctx.state);
  const max = ladderMax(game);
  const step = stepAt(game, (profile.levels.says && profile.levels.says.lv) || 1);
  const level = step ? step.lv : 1;
  const calls = buildRound(says, { level, short: ctx.state.saysShort === true });
  const puppy = (data.pets || []).find((p) => p.id === 'puppy') || { label: 'Puppy', hello: {} };
  const voice = puppy.hello || {};
  // Amendment n / p4: "<name> says..." only with Say pet names on, a typed name, the puppy on and an
  // on-device voice; otherwise the ps-lead clip. Nothing new is stored.
  const name = speakableName(ctx.state, 'puppy');
  const lead = () => (name ? { speak: leadText(name) } : says.lead);

  const mouth = h('span', { class: 'mouth-paw', 'aria-hidden': 'true' }, drawing(ICONS.paw('#F5DC9C'), { box: '0 0 64 64' }));
  const pup = h('div', { class: 'pet says-pup', 'data-pet': 'puppy', 'data-anim': '' },
    h('span', { class: 'pup-bounce' }, drawing(drawChar('puppy'), { label: puppy.label })), mouth);
  const digit = h('span', { class: 'digit-pop letter-font', 'aria-hidden': 'true' });
  const stage = h('div', { class: 'says-stage' }, pup, digit);
  const pawsEl = paws(0, calls.length);
  const pawBtn = h('button', { type: 'button', class: 'paw-btn', 'aria-label': "I'm done" }, icon('paw', 'paw-icon', '#4A3426'));
  const main = h('main', { class: 'kid says theme-park', 'data-game': 'says', 'data-level': String(level) },
    topBar(ctx, { progress: pawsEl }), stage, h('div', { class: 'paw-row' }, pawBtn));
  const alive = () => main.isConnected !== false;

  let at = 0; // the current call
  let gen = 0; // bumps whenever a call starts or ends, so a late step of an old call never acts
  let phase = 'call'; // call | wait | giggle | cheer | end
  let lastCheer = null;
  let timers = [];
  const later = (f, ms) => { timers.push(setTimeout(f, ms)); };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  // Plays clips and spoken pieces one after another. Resolves true when it finished for this call.
  async function playSeq(seq, my) {
    for (const part of splitSeq(seq)) {
      if (my !== gen || !alive()) return false;
      if (part.speak) {
        const u = speakLocal(part.speak, { pitch: voice.pitch, rate: voice.rate });
        if (u) {
          await Promise.race([new Promise((r) => { u.onend = r; u.onerror = r; }), wait(SPEECH_MAX_MS)]);
          continue;
        }
        if (ctx.audio) await ctx.audio.play([says.lead]); // no local voice: the default clip
      } else if (ctx.audio) await ctx.audio.play(part.clips);
    }
    return my === gen && alive();
  }

  // The puppy does the move slowly (CSS poses); L3 does move A, then move B.
  function pose(anim) {
    pup.dataset.anim = anim;
    pup.classList.remove('moving');
    void pup.offsetWidth; // restart the pose animation
    pup.classList.add('moving');
  }
  function animate(call, my) {
    const anims = callAnims(says, call);
    if (anims[0]) pose(anims[0]);
    if (anims[1]) {
      const ms = ctx.audio ? ctx.audio.estimateMs(callSeq(says, { ...call, then: undefined })) : 1800;
      later(() => { if (my === gen) pose(anims[1]); }, ms);
    }
  }

  // L2: a big digit pops on each beat of the count, and the puppy does the move once per beat.
  function countBeats(call, my) {
    for (let k = 1; k <= call.count; k++) {
      later(() => {
        if (my !== gen) return;
        digit.textContent = String(k);
        digit.classList.remove('pop');
        void digit.offsetWidth;
        digit.classList.add('pop');
        pose(callAnims(says, call)[0]);
      }, k * BEAT_MS);
    }
    later(() => { if (my === gen) { digit.textContent = ''; digit.classList.remove('pop'); } }, (call.count + 1) * BEAT_MS);
  }

  function startCall(i) {
    const my = ++gen;
    at = i;
    phase = 'call';
    clearTimers();
    const call = calls[i];
    main.classList.remove('waiting');
    pup.classList.remove('giggle', 'cheer');
    digit.textContent = '';
    main.dataset.call = String(i + 1);
    main.dataset.kind = call.kind;
    if (call.drop) main.dataset.drop = '1'; else delete main.dataset.drop;
    ctx.question = { says: true, skip: () => paw(), dadText: dadLine(says, call) };
    const seq = callSeq(says, call, lead());
    if (i === 0 && ctx.intro) { seq.unshift(ctx.intro, { pause: 300 }); ctx.intro = null; }
    animate(call, my);
    playSeq(seq, my).then((ok) => {
      if (!ok || phase !== 'call') return;
      phase = 'wait';
      main.classList.add('waiting');
      // the trick: no "Puppy says", so Puppy freezes and giggles about 2 s later, then moves on
      if (call.drop) later(() => giggle(my), GIGGLE_MS);
      else if (call.count) countBeats(call, my);
    });
  }

  // "Silly! I didn't say..." + the lead, with a paw over its mouth. Then straight on (no cheer).
  async function giggle(my) {
    if (my !== gen || phase === 'giggle' || phase === 'cheer' || phase === 'end') return;
    phase = 'giggle';
    clearTimers();
    main.classList.remove('waiting');
    pose('freeze-sit');
    pup.classList.add('giggle');
    const [ok] = await Promise.all([playSeq(giggleSeq(says, lead()), my), wait(900)]);
    if (!ok || my !== gen) return;
    pup.classList.remove('giggle');
    fillPaw(pawsEl, at + 1);
    advance();
  }

  // The paw button ("I'm done"), and Dad's Skip. On a trick call it only ever brings the giggle.
  function paw() {
    if (phase === 'giggle' || phase === 'cheer' || phase === 'end') return;
    const call = calls[at];
    if (call.drop) { giggle(gen); return; }
    const my = ++gen;
    phase = 'cheer';
    clearTimers();
    main.classList.remove('waiting');
    digit.textContent = '';
    fillPaw(pawsEl, at + 1);
    pup.classList.add('cheer');
    pose('hop');
    const cheer = pickNot(says.cheer, lastCheer);
    lastCheer = cheer;
    playSeq([cheer], my).then((ok) => { if (ok) advance(); });
  }
  pawBtn.addEventListener('click', paw);

  function advance() {
    if (at + 1 >= calls.length) endRound();
    else startCall(at + 1);
  }

  // A finished round is a good round (Amendment p3): she moves up every 2 rounds and never down.
  function endRound() {
    phase = 'end';
    gen++;
    clearTimers();
    ctx.question = null;
    const prog = profile.levels.says || { lv: 1, top: 1, good: 0 };
    const p = progress({ ...prog, rocky: 0 }, ROUND, false, max);
    const keys = keysForLevel(game.ladder, p.lv, p.top);
    profile.levels.says = { lv: p.lv, top: p.top, good: p.good, at: keys.at, topAt: keys.topAt };
    const got = pickStickers(profile.book, getBook(), p.leveledUp ? 2 : 1);
    for (const g of got) if (!g.owned && !profile.book.includes(g.id)) profile.book.push(g.id);
    ctx.session.newStickers = got.filter((g) => !g.owned).map((g) => g.id);
    ctx.save();
    if (alive()) main.replaceWith(roundEnd(ctx, { act: game, got, leveledUp: p.leveledUp, playAgain: () => ctx.refresh() }));
  }

  // The first call starts once the screen is on the page (render() returns before the router mounts it).
  queueMicrotask(() => startCall(0));
  return main;
}
