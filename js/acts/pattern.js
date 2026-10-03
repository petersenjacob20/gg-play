// Patterns (plan f5 piece 4, design.md 9.10): a little train, the engine on the left and 5-6 cars each
// carrying one item (5 or 6 at level 1, always 6 at levels 2-3); the last car (far right) is empty (a dashed outline that pulses gently, no "?"). The voice asks "What
// comes next?" and she taps 1 of 3 picture tiles from the same set. On a right tap the tile flies into
// the empty car, the train goes "toot toot" and rolls off to the left, and a new train rolls in from the right.
// L1 AB, L2 AAB or ABB, L3 ABC; sets: pets, fruit, shapes (one colour) and colours (always a colour
// with its own shape, never colour alone). Pure: makeQuestion only reads the data and the rng.
import { patternFor, levelFor, PATTERN_LEVELS_DEFAULT } from '../engine.js';
import { LEVEL_MAX } from '../store.js';

const levelsOf = (data) => (data.patterns && data.patterns.levels) || PATTERN_LEVELS_DEFAULT;

export const promptSeq = (data) => [data.clips.next];
export const leadSeq = (data) => [data.clips.toot, { pause: 150 }];
export const againSeq = (data, misses) => [data.clips.tryAgain[(misses - 1) % data.clips.tryAgain.length], { pause: 300 }, ...promptSeq(data)];

export function nameOf(data, id) {
  for (const s of data.patterns.sets) { const it = s.items.find((i) => i.id === id); if (it) return it.name; }
  return id;
}

export default {
  id: 'pattern',
  kind: 'quiz',
  max: LEVEL_MAX.pattern,
  label: 'homePattern',
  makeQuestion(data, level, prev, rng = Math.random) {
    const lvl = levelFor(levelsOf(data), level);
    const last = prev && prev.act === 'pattern' ? prev.scene : null;
    const p = patternFor(lvl, data.patterns.sets, last, rng);
    const nm = (id) => nameOf(data, id);
    const roles = [...new Set(p.unit)];
    const key = roles.map((r) => `${r} = ${nm(p.items[r])}`).join(', '); // named by its unit wherever the train starts
    return {
      act: 'pattern',
      level: lvl.id,
      target: p.answer,
      host: 'any',
      prompt: promptSeq(data),
      lead: leadSeq(data),
      right: (cheer) => [...leadSeq(data), cheer],
      again: (misses) => againSeq(data, misses),
      scene: { type: 'train', set: p.set, unit: p.unit, cars: p.cars, start: p.start, pos: p.pos, row: p.row, answer: p.answer },
      choices: p.choices.map((id) => ({ key: id, face: { type: 'pic', id, name: nm(id) } })),
      answer: p.answer,
      dadText: () => `Now: what comes next? ${p.unit} (${key}). The train shows ${p.row.map(nm).join(', ')}, then an empty car. The answer is the ${nm(p.answer)}. Level ${lvl.id} (${lvl.units.join(', ')}).`,
    };
  },
  record() {},
};
