// Story Time shelf (#stories; design.md 9.10 and 11.2, plan l3): a 2-column grid of cover tiles with
// art only, Home top left. Only the stories that are on show, in seq order, and the newest one has a
// small gold star at its top corner (no word "new"). No host, pets, friends or surprises here.
import { h, drawing } from '../dom.js';
import { art } from '../art.js';
import { storyScene } from '../story-art.js';
import { topBar } from '../ui.js';
import { shelf, newestId } from '../story.js';

export function sceneView(parts, cls) {
  return drawing(storyScene(parts), { cls, box: '0 0 100 100' });
}

export function render(ctx) {
  const stories = ctx.data.stories || [];
  const newest = newestId(stories);
  const tiles = shelf(stories).map((s) => h('button', {
    type: 'button', class: `cover-tile${s.id === newest ? ' newest' : ''}`, 'data-story': s.id, 'aria-label': s.title,
    onclick: () => ctx.go(`#story/${s.id}`),
  }, sceneView(s.cover, 'cover-art'),
  s.id === newest ? h('span', { class: 'new-star', 'aria-hidden': 'true' }, drawing(art('star'), { box: '0 0 100 100' })) : null));
  if (ctx.intro && ctx.audio) ctx.audio.play([ctx.intro]);
  ctx.intro = null;
  return h('main', { class: 'kid shelf' }, topBar(ctx), h('div', { class: 'shelf-grid' }, tiles));
}
