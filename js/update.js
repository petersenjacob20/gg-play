// Apply an update on reopen (pub6, Amendment w). sw.js already does skipWaiting + clients.claim, so
// a new version takes control of an open page with a `controllerchange` event. This decides what to
// do about it. Pure: no DOM, no storage, no timers, no network; main.js feeds it what is on screen.
// - First visit (the page had no controller when it loaded): never reload.
// - Reload only when home is fully clear: the home screen is showing, no activity, story, surprise
//   box or game is open, and the Dad sheet and password prompt are closed.
// - Otherwise the update waits (pending) and applies the next time she lands on a clear home.
// - At most one reload per page, ever (no loops). Saves and other stored keys are never touched.
// - When the app comes back into view, ask for an update at most once every 60 s (a timestamp check).
export const UPDATE_EVERY_MS = 60000;

// Is it safe to reload right now? `screen` = the router's current screen name.
export function homeClear({ screen, sheetOpen = false, passwordOpen = false, activityOpen = false, storyOpen = false, boxOpen = false } = {}) {
  return screen === 'home' && !sheetOpen && !passwordOpen && !activityOpen && !storyOpen && !boxOpen;
}

export function createUpdater({ hadController = false, reload = () => {} } = {}) {
  let reloaded = false;
  let updatePending = false;
  let lastCheck = -Infinity;
  const go = () => {
    reloaded = true;
    updatePending = false;
    reload();
    return 'reload';
  };
  return {
    // a new service worker took control of this page
    onControllerChange(view) {
      if (!hadController || reloaded) return 'ignore';
      if (homeClear(view)) return go();
      updatePending = true;
      return 'defer';
    },
    // something changed on screen (a new screen, the Dad sheet closed): apply a waiting update if home is clear
    onSettle(view) {
      if (!updatePending || reloaded) return 'ignore';
      return homeClear(view) ? go() : 'wait';
    },
    // the app became visible: true when it is time to call registration.update()
    shouldCheck(now) {
      if (now - lastCheck < UPDATE_EVERY_MS) return false;
      lastCheck = now;
      return true;
    },
    get pending() { return updatePending; },
    get reloaded() { return reloaded; },
  };
}

// registration.update() that never throws or rejects (offline does nothing)
export function safeUpdate(reg) {
  try {
    const p = reg && typeof reg.update === 'function' ? reg.update() : null;
    if (p && typeof p.catch === 'function') return p.catch(() => false);
  } catch { /* offline or gone: nothing to do */ }
  return Promise.resolve(false);
}
