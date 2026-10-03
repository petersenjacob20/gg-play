// Counting (design.md sections 3 and 9.10, plan f3/f5): a pet sits by a blanket of N treats in rows of
// 5; tapping a treat counts it out loud. 3 number cards: numeral + dot pattern when every card in the
// round is 10 or less, numerals only on all 3 as soon as any card is over 10. Levels 1-5, 3-10, 8-20.
// Pure: makeQuestion only reads the data and the rng; the shared quiz screen picks the host and its
// treat (the bunny gets the carrot) and does the rest.
import { countFor, numberChoices, levelFor, showDots, pickNot } from '../engine.js';
import { LEVEL_MAX } from '../store.js';

const num = (data, n) => `${data.clips.numberPrefix}${n}`;

export const promptSeq = (data) => [data.clips.count];
export const rightSeq = (data, n, cheer = pickNot(data.clips.cheer, null)) => [num(data, n), { pause: 200 }, cheer];
export const againSeq = (data, misses) => [data.clips.tryAgain[(misses - 1) % data.clips.tryAgain.length], { pause: 300 }, data.clips.count];

// What each number card shows: the numeral, plus a dot count only when the whole round has dots.
export function cardFaces(nums) {
  const withDots = showDots(nums);
  return nums.map((n) => ({ n, dots: withDots ? n : 0 }));
}

export default {
  id: 'count',
  kind: 'quiz',
  max: LEVEL_MAX.count,
  label: 'homeCount',
  makeQuestion(data, level, prev, rng = Math.random) {
    const lvl = levelFor(data.counting.levels, level);
    const n = countFor(lvl, prev && prev.act === 'count' ? prev.target : null, rng);
    const nums = numberChoices(n, lvl, rng);
    return {
      act: 'count',
      level: lvl.id,
      target: n,
      host: 'count',
      prompt: promptSeq(data),
      lead: [num(data, n), { pause: 200 }],
      right: (cheer) => rightSeq(data, n, cheer),
      again: (misses) => againSeq(data, misses),
      scene: { type: 'treats', n },
      choices: cardFaces(nums).map((f) => ({ key: String(f.n), face: { type: 'number', n: f.n, dots: f.dots } })),
      answer: String(n),
      countClip: (k) => num(data, k),
      dadText: ({ treat } = {}) => `Now: count the ${treat || 'treat'}s. The answer is ${n}. Level ${lvl.id} (${lvl.min} to ${lvl.max}).`,
    };
  },
  record() {},
};
