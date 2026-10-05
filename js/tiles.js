// Game tile pictures (design.md §11.1) used on the home grid and in Dad's levels. Pictures only in
// the art area; the title sits in a cream strip under the picture (home.js).
import { h, drawing } from './dom.js';
import { art } from './art.js';
import { drawChar } from './pets.js';

export const pic = (id, cls, box = '0 0 100 100') => h('span', { class: cls, 'data-art': id, 'aria-hidden': 'true' }, drawing(art(id), { box }));
const who = (id, cls = 'tile-who') => h('span', { class: cls, 'aria-hidden': 'true' }, drawing(drawChar(id), { box: '0 0 120 120' }));

export function tilePic(id) {
  switch (id) {
    case 'letterhunt':
      return [who('kitty', 'tile-who peek'), h('span', { class: 'big-glyph letter-font', 'aria-hidden': 'true', text: 'A' }),
        h('span', { class: 'mini-glyph letter-font', 'aria-hidden': 'true', text: 'a' })];
    case 'fetch':
      return [who('yellowDog', 'tile-who leap'), pic('frisbee', 'mini-pic frisbee-pic'),
        h('span', { class: 'big-glyph letter-font small-num', 'aria-hidden': 'true', text: '123' })];
    case 'dig':
      return [who('friendDino', 'tile-who dig'), h('span', { class: 'big-glyph letter-font dirt-letter', 'aria-hidden': 'true', text: 'a' })];
    case 'sea':
      return [h('span', { class: 'sea-bubbles', 'aria-hidden': 'true' },
        pic('fish', 'bubble-item'), pic('yellow-star', 'bubble-item'), pic('fish', 'bubble-item'),
        h('span', { class: 'bubble empty' }))];
    case 'farm':
      return [who('chocolateDog', 'tile-who tiny'), who('blackDog', 'tile-who tiny'), pic('apple', 'mini-pic')];
    case 'monster':
      return [who('friendSilly', 'tile-who chomp'), pic('strawberry', 'mini-pic')];
    case 'stories':
    case 'story':
      return [pic('bookOpen', 'story-pic')];
    // legacy act ids (tests / Dad fallback)
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
    default:
      return [pic('star', 'mini-pic')];
  }
}
