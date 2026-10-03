// Router + screen mounting. Routes: #home, #play/<activity> (the shared quiz screen, plan f3; the
// round end and the surprise box play inside it), #book (sticker book), #stories (the Story Time
// shelf), #story/<id> (one story that is on; anything else shows the shelf) and #pets. The old #letters and #count links still open their activity. Dad help (#dad in
// the plan) is a bottom sheet over the current screen, so Show answer and Skip act on the question in view.
import { load, save, defaults, setLetters, setBook } from './store.js';
import * as home from './screens/home.js';
import * as play from './screens/play.js';
import * as book from './screens/book.js';
import * as shelf from './screens/stories.js';
import * as story from './screens/story.js';
import * as pets from './screens/family.js';
import { closeDadPanel } from './dad.js';
import { createAudio } from './audio.js';
import { routeName, routeParam } from './route.js';
import { storyById } from './story.js';
import { loadPhotos, setPhotos, revokePhotoURLs, forgetAllPhotos } from './photos.js';

const ROUTES = { home, play, book, stories: shelf, story, pets, letters: play, count: play };
// #play/<id>, and the old #letters / #count links, name their activity.
function paramFor(name, hash) {
  if (name === 'letters' || name === 'count') return name;
  return routeParam(hash);
}

const ctx = {
  state: defaults(), // loaded after the data, so only enabled letters are kept
  data: null,
  audio: null,
  question: null, // the current question's Dad hooks: { showAnswer(), skip(), dadText }
  intro: null, // the clip naming the activity, said before its first prompt
  session: {}, // in memory only (never stored): last questions, rocky streaks, warm-ups, new stickers
  param: null, // the part after the slash in #play/<id>
  save() { save(ctx.state); },
  go(hash) { if (location.hash === hash) render(); else location.hash = hash; },
  refresh() { render(); },
  afterDelete() { forgetAllPhotos(); location.hash = '#home'; location.reload(); },
};

let current = null;
function render() {
  let name = routeName(location.hash, ROUTES);
  ctx.param = paramFor(name, location.hash);
  if (name === 'play' && !play.known(ctx.param)) { name = 'home'; ctx.param = null; }
  if (name === 'story' && !storyById(ctx.data.stories, ctx.param)) { name = 'stories'; ctx.param = null; } // off or unknown: the shelf
  const mod = ROUTES[name];
  closeDadPanel();
  if (ctx.audio) ctx.audio.stop();
  if (current && current.mod.leave) current.mod.leave(ctx);
  revokePhotoURLs(); // the photos' object URLs belong to the screen that is going away
  ctx.question = null;
  current = { name, mod };
  document.body.dataset.screen = name;
  const root = document.getElementById('app');
  const out = mod.render(ctx);
  root.replaceChildren(...[].concat(out).flat(Infinity).filter(Boolean));
  window.scrollTo(0, 0);
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { /* offline mode unavailable */ });
}

async function loadJSON(name) {
  const res = await fetch(`./data/${name}`);
  if (!res.ok) throw new Error(`Could not load ${name}`);
  return res.json();
}

async function start() {
  try {
    ctx.data = await loadJSON('activities.json');
    ctx.data.stories = (await loadJSON('stories.json')).stories;
    setLetters(ctx.data.letters.map((l) => l.id));
    setBook(ctx.data.stickerBook.flat());
    ctx.state = load();
  } catch {
    document.getElementById('app').textContent = 'Could not load the game. Reload once.';
    return;
  }
  // Which pets have a photo saved on this phone: read once. If the store can't be read, drawings show.
  setPhotos(await loadPhotos());
  ctx.audio = createAudio({ enabled: ctx.state.sound });
  await ctx.audio.init();
  // Audio unlocks on the first tap anywhere (iOS rule); until then, and whenever a clip is
  // missing, the game runs silently with its visual cues.
  const unlock = () => ctx.audio.unlock();
  document.addEventListener('pointerdown', unlock, { capture: true });
  document.addEventListener('keydown', unlock, { capture: true });
  window.addEventListener('hashchange', render);
  render();
  registerSW();
}

start();
