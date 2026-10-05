import { activeProfile } from '../store.js';
// One story (#story/<id>; design.md 9.10 and 11.2, plan l3 and f5). The page art fills the top of the
// screen and one 22 px line of text sits under it, the same words the voice reads. Narration plays on
// page entry and tapping the art plays it again. Big arrows (88 px), swipe, page dots (no numbers) and
// Home on every page. After the last page: one happy question with 3 picture cards. A right pick
// gets the "yes" line, then confetti and the surprise box with one sky and nature sticker. A wrong
// pick (only when the story has one answer) gets the same gentle fade and a try-again line; after 2
// misses the right card glows. No host, pets, friends, reactions, surprises or sparks in a story.
import { h, drawing } from '../dom.js';
import { topBar, icon } from '../ui.js';
import { storyPart } from '../story-art.js';
import { storyById, storySticker, isRight } from '../story.js';
import { roundEnd } from '../reward.js';
import { sceneView } from './stories.js';
import * as shelfScreen from './stories.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const LABEL = { jesus: 'Jesus' };

export function render(ctx) {
  const story = storyById(ctx.data.stories, ctx.param);
  if (!story) return shelfScreen.render(ctx); // off, unknown or missing: the shelf
  const data = ctx.data;
  const last = story.pages.length; // index of the question
  let at = 0;
  let misses = 0;
  let done = false;
  let swiped = false; // a swipe is not a tap
  const artBox = h('div', { class: 'story-art', role: 'button', 'aria-label': 'Hear it again' });
  const line = h('p', { class: 'story-line' });
  const dots = h('div', { class: 'page-dots', 'aria-hidden': 'true' }, [...story.pages, story.question].map(() => h('span', { class: 'page-dot' })));
  const prev = h('button', { type: 'button', class: 'icon-btn page-arrow prev', 'aria-label': 'Page back', onclick: () => turn(-1) }, icon('arrowLeft'));
  const next = h('button', { type: 'button', class: 'icon-btn page-arrow next', 'aria-label': 'Next page', onclick: () => turn(1) }, icon('arrowRight'));
  const main = h('main', { class: 'kid story', 'data-story': story.id }, topBar(ctx), artBox, line, h('div', { class: 'book-nav story-nav' }, prev, dots, next));
  const say = (clip) => { if (ctx.audio) { ctx.audio.stop(); ctx.audio.play([clip]); } };

  function card(key) {
    const c = h('button', { type: 'button', class: 'choice pic-card story-card', 'data-key': key, 'aria-label': LABEL[key] || key },
      drawing(storyPart(key), { box: '0 0 100 100' }));
    c.addEventListener('click', () => pick(c, key));
    return c;
  }

  async function pick(c, key) {
    if (done || swiped || c.classList.contains('miss')) return;
    const q = story.question;
    if (!isRight(q, key)) {
      misses++;
      c.classList.add('miss');
      if (ctx.audio) ctx.audio.play([data.clips.tryAgain[Math.min(misses, 2) - 1]]);
      if (misses >= 2) artBox.querySelectorAll('.story-card').forEach((x) => { if (isRight(q, x.dataset.key)) x.classList.add('glow'); });
      return;
    }
    done = true;
    c.classList.remove('glow');
    c.classList.add('right');
    artBox.querySelectorAll('.story-card').forEach((x) => x.setAttribute('aria-disabled', 'true'));
    line.textContent = q.yesText;
    if (ctx.audio) ctx.audio.stop();
    await Promise.race([ctx.audio ? ctx.audio.play([q.yes]) : wait(1200), wait(5000)]);
    await wait(250);
    if (!main.isConnected) return;
    const got = storySticker(activeProfile(ctx.state).book, data.stickerBook);
    for (const g of got) if (!g.owned && !activeProfile(ctx.state).book.includes(g.id)) activeProfile(ctx.state).book.push(g.id);
    ctx.session.newStickers = got.filter((g) => !g.owned).map((g) => g.id);
    ctx.save();
    main.replaceWith(roundEnd(ctx, { act: { id: 'stories' }, got, leveledUp: false, playAgain: () => ctx.refresh() }));
  }

  function show() {
    const isQ = at === last;
    main.dataset.page = isQ ? 'question' : String(at + 1);
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === at));
    prev.classList.toggle('dim', at === 0);
    next.classList.toggle('dim', isQ);
    if (isQ) {
      misses = 0;
      artBox.classList.add('question');
      artBox.replaceChildren(h('div', { class: 'cards story-cards' }, story.question.choices.map(card)));
      line.textContent = story.question.text;
      say(story.question.clip);
      return;
    }
    const pg = story.pages[at];
    artBox.classList.remove('question');
    artBox.replaceChildren(sceneView(pg.art, 'page-art'));
    line.textContent = pg.text;
    say(pg.clip);
  }
  function turn(d) {
    const n = at + d;
    if (done || n < 0 || n > last) return;
    at = n;
    show();
  }

  // tap the picture to hear the page again (not on the question, where the cards are the taps)
  artBox.addEventListener('click', (e) => {
    if (swiped) { swiped = false; return; }
    if (at === last || e.target.closest('.choice')) return;
    say(story.pages[at].clip);
  });
  // swipe left / right
  let x0 = null;
  artBox.addEventListener('pointerdown', (e) => { x0 = e.clientX; swiped = false; });
  artBox.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) { swiped = true; turn(dx < 0 ? 1 : -1); }
  });

  ctx.intro = null;
  show();
  return main;
}
