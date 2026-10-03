// The activity pictures used on the home tiles (design.md 9.2), in Dad's level rows (9.9) and in the
// level-up moment (9.6). Pictures only, no words. Our own inline SVG drawings (art.js).
import { h, drawing } from './dom.js';
import { art } from './art.js';

export const pic = (id, cls, box = '0 0 100 100') => h('span', { class: cls, 'data-art': id, 'aria-hidden': 'true' }, drawing(art(id), { box }));

// Letters: a big "a" and one apple. Counting: "123" and three apples. Adding: 1 apple, a small gap,
// 2 apples, then a soft "=" sparkle (no numbers). Patterns: a little train (red, blue, red, an empty
// dashed car). Stories: an open picture book with a tiny ark and a star.
export function tilePic(id) {
  switch (id) {
    case 'letters':
      return [h('span', { class: 'big-glyph letter-font', 'aria-hidden': 'true', text: 'a' }), pic('apple', 'big-pic apple-pic')];
    case 'count':
      return [h('span', { class: 'big-glyph letter-font', 'aria-hidden': 'true', text: '123' }),
        h('span', { class: 'apples', 'aria-hidden': 'true' }, pic('apple', 'mini-pic'), pic('apple', 'mini-pic'), pic('apple', 'mini-pic'))];
    case 'add':
      return [h('span', { class: 'add-row', 'aria-hidden': 'true' },
        pic('apple', 'mini-pic'), h('span', { class: 'add-gap' }), pic('apple', 'mini-pic'), pic('apple', 'mini-pic')), pic('eqSparkle', 'eq-pic')];
    case 'pattern':
      return [pic('train', 'train-pic', '0 0 200 100')];
    case 'stories':
      return [pic('bookOpen', 'story-pic')];
    default:
      return [pic('star', 'mini-pic')];
  }
}
