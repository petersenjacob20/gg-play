// Letters (design.md sections 2 and 9.10, plan f3/f5): "Find the letter that says /b/ ... like ball".
// The host holds a sign with the picture word; 3 letter cards (lowercase big, the capital small in the
// corner). Pure: makeQuestion only reads the data and the rng; the shared quiz screen does the rest.
// Levels 1-5 add letter batches (plan f5, piece 2): 1 m s a t p b, 2 n d f o i, 3 h l r g c,
// 4 e u w j k, 5 v y z q x. A letter's batch is its "level" field in activities.json.
import { choicesFor, letterPool, pickLetter, pickNot, NEVER_TOGETHER } from '../engine.js';
import { LEVEL_MAX, activeProfile } from '../store.js';

// How Dad's line writes a sound when it isn't the letter itself: c as in cat, x as in fox.
export const SAY = { c: 'k', x: 'ks' };
// x is at the end of its word (fox), so Dad's line says so.
export const LIKE = { x: 'the end of ' };

export function promptSeq(data, l) {
  const c = data.clips;
  return [c.find, { pause: 250 }, l.sound, { pause: 450 }, c.like, { pause: 60 }, l.wordClip];
}
// The voice line after a right tap: the sound and the word, then a cheer (passed in by the quiz
// screen so cheers rotate; a random one when called on its own).
export function rightSeq(data, l, cheer = pickNot(data.clips.cheer, null)) {
  return [l.sound, { pause: 300 }, l.wordClip, { pause: 250 }, cheer];
}
export function againSeq(data, l, misses) {
  return [data.clips.tryAgain[(misses - 1) % data.clips.tryAgain.length], { pause: 300 }, l.sound];
}

export default {
  id: 'letters',
  kind: 'quiz',
  max: LEVEL_MAX.letters,
  label: 'homeLetters',
  makeQuestion(data, level, prev, rng = Math.random) {
    const pool = letterPool(data.letters, level);
    const target = pickLetter(pool, prev && prev.target, rng);
    const ids = choicesFor(target.id, pool.map((l) => l.id), 3, rng, data.neverTogether || NEVER_TOGETHER);
    return {
      act: 'letters',
      level,
      target: target.id,
      host: 'any',
      prompt: promptSeq(data, target),
      lead: [target.sound, { pause: 300 }, target.wordClip, { pause: 250 }], // the right line before its cheer
      right: (cheer) => rightSeq(data, target, cheer),
      again: (misses) => againSeq(data, target, misses),
      scene: { type: 'sign', pic: target.pic },
      choices: ids.map((id) => {
        const l = data.letters.find((x) => x.id === id);
        return { key: id, face: { type: 'letter', lower: l.lower, upper: l.upper } };
      }),
      answer: target.id,
      dadText: () => `Now: find the letter ${target.lower}. It says /${SAY[target.id] || target.id}/, like ${LIKE[target.id] || ''}"${target.word}".`,
    };
  },
  // Written with each finished question: how often each letter came up (letters enabled only).
  record(state, q) {
    const p = activeProfile(state); p.seenLetters[q.target] = (p.seenLetters[q.target] || 0) + 1;
  },
};
