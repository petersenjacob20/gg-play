// Story Time rules (plan l3, design.md 9.10 and 11.2), pure and tested. Each story in stories.json has
// a seq (release order) and on: true | false. The shelf shows the stories that are on, in seq order;
// the newest (highest seq that is on) gets a small gold star. Every story that is on is open; a story
// that is off can't be opened by link either. Stories store nothing and have no levels.
import { pickStickers } from './engine.js';

export const MAX_WORDS = 15;
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
