// Router + screen mounting. Routes: #home, #game/<id> (a built game's current ladder step),
// #play/<act> (test-only: plays that act via the game that owns it), #book, #stories, #story/<id>,
// #pets, #says (Puppy Says, also reached as #game/says), #playground, #playground/<id>. Dad help is a bottom sheet over the current screen.
import { load, save, defaults, setLetters, setBook, setGames, setPlayground } from './store.js';
import * as home from './screens/home.js';
import * as play from './screens/play.js';
import * as book from './screens/book.js';
import * as shelf from './screens/stories.js';
import * as story from './screens/story.js';
import * as pets from './screens/family.js';
import * as says from './screens/says.js';
import * as playground from './screens/playground.js';
import { closeDadPanel } from './dad.js';
import { createGate } from './lock.js';
import { createUpdater, safeUpdate } from './update.js';
import { createAudio } from './audio.js';
import { routeName, routeParam } from './route.js';
import { resolvePlayground } from './playground.js';
import { storyById } from './story.js';
import { gameById, isBuilt } from './games.js';
import { ACTS, SCREENS, PLAYABLE } from './acts/index.js';
import { loadPhotos, setPhotos, revokePhotoURLs, forgetAllPhotos } from './photos.js';

// the routes that are a kid's game screen (with its round end); the Playground scene is added in render()
const KID_PLAY = new Set(['game', 'play', 'letters', 'count', 'says']);
const ROUTES = { home, play, game: play, book, stories: shelf, story, pets, says, playground, letters: play, count: play };

function paramFor(name, hash) {
  if (name === 'letters' || name === 'count') return name;
  return routeParam(hash);
}

const ctx = {
  state: defaults(),
  data: null,
  audio: null,
  question: null,
  intro: null,
  session: {},
  param: null,
  zone: null, // #playground/<id>/<zone>: a ready zone id (q10)
  game: null, // the games.json entry when playing via #game/<id>
  gate: null, // grown-up unlock gate (in memory only)
  save() { save(ctx.state); },
  go(hash) { if (location.hash === hash) render(); else location.hash = hash; },
  // a zone gate swaps the place without a new history entry, so Back still goes to the pick screen
  replace(hash) { if (location.hash === hash) render(); else location.replace(hash); },
  refresh() { render(); },
  afterDelete() { forgetAllPhotos(); location.hash = '#home'; location.reload(); },
};

let current = null;
// pub6 (Amendment w): apply a new version on reopen (update.js decides; at most one reload per page)
let updater = createUpdater({ hadController: false });
let registration = null;
// What is on screen now, for the update rule: home showing with nothing open on top.
function onScreen() {
  const sheet = document.getElementById('sheet');
  const app = document.getElementById('app');
  const name = current ? current.name : 'home';
  return {
    screen: name,
    sheetOpen: !!(sheet && !sheet.hidden),
    passwordOpen: !!(sheet && !sheet.hidden && sheet.querySelector('input[type="password"]')),
    activityOpen: name !== 'home',
    storyOpen: name === 'story',
    boxOpen: !!(app && app.querySelector('.gift')),
  };
}

function render() {
  let name = routeName(location.hash, ROUTES);
  // a waiting update applies on landing at a clear home (an open Dad sheet waits for it to close)
  if (updater.onSettle({ ...onScreen(), screen: name, activityOpen: name !== 'home', storyOpen: false, boxOpen: false }) === 'reload') return;
  ctx.param = paramFor(name, location.hash);
  ctx.game = null;
  ctx.zone = null;
  let scene = false; // the Playground play scene (not its pick screen)
  if (name === 'game') {
    const g = gameById(ctx.data.games, ctx.param);
    if (!g || !isBuilt(g, PLAYABLE)) { name = 'home'; ctx.param = null; }
    else if (g.route) { name = routeName(g.route, ROUTES); ctx.param = routeParam(g.route); }
    else {
      ctx.game = g;
      const own = SCREENS[g.ladder[0].act]; // a game with its own screen (Puppy Says)
      if (own) name = own;
    }
  } else if (name === 'playground') {
    // #playground/<id>: camelCase ids need routeIds (q0); a bad or switched-off id goes back to #playground
    const r = resolvePlayground(ctx.data, ctx.state, location.hash);
    if (r.view === 'off') { name = 'home'; ctx.param = null; }
    else {
      if (r.fix) history.replaceState(null, '', r.fix);
      ctx.param = r.id;
      ctx.zone = r.zone || null;
      scene = r.view === 'play';
    }
  } else if (name === 'says') {
    ctx.game = gameById(ctx.data.games, 'says');
  } else if (name === 'play' || name === 'letters' || name === 'count') {
    // test-only / old links: find a built game whose ladder uses this act
    const actId = ctx.param;
    if (!play.known(actId)) { name = 'home'; ctx.param = null; }
    else {
      const g = (ctx.data.games || []).find((x) => isBuilt(x, ACTS) && (x.ladder || []).some((s) => s.act === actId));
      if (g) ctx.game = g;
    }
  }
  if (name === 'story' && !storyById(ctx.data.stories, ctx.param)) { name = 'stories'; ctx.param = null; }
  const mod = ROUTES[name];
  closeDadPanel();
  if (ctx.audio) ctx.audio.stop();
  if (current && current.mod.leave) current.mod.leave(ctx);
  revokePhotoURLs();
  ctx.question = null;
  current = { name, mod };
  document.body.dataset.screen = name;
  // No pull-to-refresh anywhere (EM, home pub r3): html contains its overscroll (app.css); while a kid plays
  // (a game screen, its round end, the Playground scene) .kid-play on the root switches it to none.
  const kidPlay = KID_PLAY.has(name) || (name === 'playground' && scene);
  document.documentElement.classList.toggle('kid-play', kidPlay);
  const root = document.getElementById('app');
  const out = mod.render(ctx);
  root.replaceChildren(...[].concat(out).flat(Infinity).filter(Boolean));
  window.scrollTo(0, 0);
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  // a page that already had a controller is an update when control changes; a first visit is not
  const hadController = !!sw.controller;
  updater = createUpdater({ hadController, reload: () => location.reload() });
  sw.addEventListener('controllerchange', () => { updater.onControllerChange(onScreen()); });
  // the Dad sheet or password prompt closing on home can be the moment it is clear
  const sheet = document.getElementById('sheet');
  if (sheet && typeof MutationObserver === 'function') {
    new MutationObserver(() => { if (sheet.hidden) updater.onSettle(onScreen()); }).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && registration && updater.shouldCheck(Date.now())) safeUpdate(registration);
  });
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then((reg) => { registration = reg; }).catch(() => { /* offline mode unavailable */ });
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
    ctx.data.games = (await loadJSON('games.json')).games;
    setLetters(ctx.data.letters.map((l) => l.id));
    setBook(ctx.data.stickerBook.flat());
    setGames(ctx.data.games);
    setPlayground(ctx.data);
    ctx.state = load();
  } catch {
    document.getElementById('app').textContent = 'Could not load the game. Reload once.';
    return;
  }
  setPhotos(await loadPhotos());
  ctx.gate = createGate();
  ctx.audio = createAudio({ enabled: ctx.state.sound });
  await ctx.audio.init();
  const unlock = () => ctx.audio.unlock();
  document.addEventListener('pointerdown', unlock, { capture: true });
  document.addEventListener('keydown', unlock, { capture: true });
  window.addEventListener('hashchange', render);
  render();
  registerSW();
}

start();
