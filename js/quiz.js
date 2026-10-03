// One question with 3 big answer cards (design.md sections 2-3 and 9.3, build plan f4).
// Right tap: the card grows with a green edge, the pet hops, the voice line plays, and the next
// question comes on its own after about 1.5 s (or when the voice line ends, if longer).
// Wrong tap: the card fades to 40% and the pet tilts its head ("hmm"), and a try-again clip plays.
// No wobble, no shake, no buzzer. After 2 misses the right card glows. Faded cards still take taps
// but do nothing. No timer, no score. Show answer and Skip (Dad help) mark the question as helped.
import { setPose } from './ui.js';

export const NEXT_MS = 1500;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function runQuestion(ctx, { cards, rightCard, pet, rightSeq, againSeq, onDone, onRight }) {
  let misses = 0;
  let locked = false;
  let firstTry = true;
  let helped = false;
  const glow = () => rightCard.classList.add('glow');

  async function finish(skipped) {
    locked = true;
    for (const c of cards) c.setAttribute('aria-disabled', 'true');
    if (skipped) { onDone({ firstTry: false, skipped: true, helped: true }); return; }
    const t0 = Date.now();
    await Promise.race([ctx.audio ? ctx.audio.play(rightSeq()) : null, wait(6000)]);
    const spent = Date.now() - t0;
    await wait(spent >= NEXT_MS ? 250 : NEXT_MS - spent);
    onDone({ firstTry, skipped: false, helped });
  }

  for (const c of cards) {
    c.addEventListener('click', () => {
      if (locked) return;
      if (c === rightCard) {
        rightCard.classList.remove('glow');
        rightCard.classList.add('right');
        setPose(pet, 'happy', 1400);
        if (onRight) onRight({ firstTry });
        finish(false);
        return;
      }
      if (c.classList.contains('miss')) return; // faded: does nothing
      firstTry = false;
      misses++;
      c.classList.add('miss');
      setPose(pet, 'hmm', 1600);
      if (ctx.audio) ctx.audio.play(againSeq(misses));
      if (misses >= 2) glow();
    });
  }

  return {
    showAnswer() { if (!locked) { firstTry = false; helped = true; glow(); } },
    skip() { if (!locked) { helped = true; finish(true); } },
    get helped() { return helped; },
    get locked() { return locked; },
  };
}

// Speaker / picture cue that runs for as long as the voice line would (works with sound off too).
export function cue(el, ms, cls = 'talking') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  clearTimeout(el._cueTimer);
  el._cueTimer = setTimeout(() => el.classList.remove(cls), Math.max(600, ms));
}
