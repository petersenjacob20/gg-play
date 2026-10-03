// Adding (plan f5 piece 3b, design.md 9.10): one long blanket with two groups of the same fruit or veg
// and a soft dashed divider between them; no "+" on her screen, the voice carries it: "Two... and
// three... how many in all?" Tapping any item lights it and counts up across both groups. On a right
// tap the divider melts away and the groups slide together. Cards are numerals with dots, as in
// Counting. L1 sums 2-5 (one row), L2 sums 6-10 (each group in rows of 5). Pure: makeQuestion only
// reads the data and the rng; the shared quiz screen does the rest.
import { partsFor, numberChoices, levelFor, pickNot, ADD_LEVELS_DEFAULT } from '../engine.js';
import { LEVEL_MAX } from '../store.js';
import { cardFaces } from './count.js';

const num = (data, n) => `${data.clips.numberPrefix}${n}`;
const levelsOf = (data) => (data.adding && data.adding.levels) || ADD_LEVELS_DEFAULT;

export const promptSeq = (data, a, b) => [num(data, a), { pause: 350 }, data.clips.and, { pause: 350 }, num(data, b), { pause: 400 }, data.clips.all];
export const rightSeq = (data, sum, cheer = pickNot(data.clips.cheer, null)) => [num(data, sum), { pause: 200 }, cheer];
export const againSeq = (data, a, b, misses) => [data.clips.tryAgain[(misses - 1) % data.clips.tryAgain.length], { pause: 300 }, ...promptSeq(data, a, b)];

export default {
  id: 'add',
  kind: 'quiz',
  max: LEVEL_MAX.add,
  label: 'homeAdd',
  makeQuestion(data, level, prev, rng = Math.random) {
    const lvl = levelFor(levelsOf(data), level);
    const last = prev && prev.act === 'add' ? prev : null;
    const { a, b, sum } = partsFor(lvl, last ? last.target : null, rng);
    const item = pickNot(data.adding.items, last ? data.adding.items.find((x) => x.id === last.scene.item) : null, rng);
    const nums = numberChoices(sum, lvl, rng);
    const say = (n) => `${n} ${n === 1 ? item.one : item.many}`;
    return {
      act: 'add',
      level: lvl.id,
      target: sum,
      host: 'any',
      prompt: promptSeq(data, a, b),
      lead: [num(data, sum), { pause: 200 }],
      right: (cheer) => rightSeq(data, sum, cheer),
      again: (misses) => againSeq(data, a, b, misses),
      scene: { type: 'groups', item: item.id, a, b, rows: lvl.id >= 2 },
      choices: cardFaces(nums).map((f) => ({ key: String(f.n), face: { type: 'number', n: f.n, dots: f.dots } })),
      answer: String(sum),
      countClip: (k) => num(data, k),
      dadText: () => `Now: ${say(a)} and ${say(b)}. How many in all? The answer is ${sum}. Level ${lvl.id} (${lvl.min} to ${lvl.max}).`,
    };
  },
  record() {},
};
