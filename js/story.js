// Story Time rules (plan l3, design.md 9.10 and 11.2), pure and tested. Each story in stories.json has
// a seq (release order) and on: true | false. The shelf shows the stories that are on, in seq order;
// the newest (highest seq that is on) gets a small gold star. Every story that is on is open; a story
// that is off can't be opened by link either. Stories store nothing and have no levels.
import { pickStickers } from './engine.js';

export const MAX_WORDS = 15;
export const MIN_PAGES = 4;
export const MAX_PAGES = 6;
// Amendment o: the ark's promise line is approved word for word (about 37 words), so ark page 7 is
// the one page allowed past MAX_WORDS, and the ark is the one story with a 7th page. By id, nothing else.
export const LONG_PAGES = [{ story: 'ark', page: 7 }];
export const wordLimitExempt = (storyId, pageNo) => LONG_PAGES.some((x) => x.story === storyId && x.page === pageNo);
export const pageLimit = (storyId) => (LONG_PAGES.some((x) => x.story === storyId) ? MAX_PAGES + 1 : MAX_PAGES);
export const SKY_PAGE = 2; // the sticker book's sky and nature page (activities.json stickerBook[2])

export const words = (text) => (String(text).match(/[A-Za-z0-9']+/g) || []).length;

export function shelf(stories) {
  return (stories || []).filter((s) => s && s.on === true).sort((a, b) => a.seq - b.seq);
}

export function newestId(stories) {
  const on = shelf(stories);
  return on.length ? on[on.length - 1].id : null;
}

export function storyById(stories, id) {
  return shelf(stories).find((s) => s.id === id) || null;
}

// The finishing box: one sticker from the sky and nature page only (a new one while any is missing,
// then an owned one with a sparkle).
export function storySticker(book, stickerBook, rng = Math.random) {
  return pickStickers(book, stickerBook[SKY_PAGE] || [], 1, rng);
}

// Is this pick right? "any" means every card is right.
export const isRight = (question, key) => question.answer === 'any' || question.answer === key;

// Amendment o2: tap-to-color. One tap target that is never wrong: each tap fills the next band from
// the top and calls chime(n) once (n = bands filled so far); the tap that fills the last band also
// calls done() once. Taps after that do nothing (tap() returns false). A new page visit makes a new
// one, so coming back starts grey again; nothing is stored.
export function coloring(count, { chime = () => {}, done = () => {} } = {}) {
  let filled = 0;
  return {
    get filled() { return filled; },
    get complete() { return filled >= count; },
    tap() {
      if (filled >= count) return false;
      filled++;
      chime(filled);
      if (filled === count) done();
      return true;
    },
  };
}
// Design ruling (pub4): each band gets a soft made-in-code tone (audio.tone), rising C5 D5 E5 G5 A5 C6,
// and the promise line starts once the 6th tone has faded.
export const RAINBOW_TONES_HZ = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
export const CLIP_AFTER_CHIME_MS = 250;
