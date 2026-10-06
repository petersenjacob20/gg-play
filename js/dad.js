// Dad help (design.md §5 and §12). The button opens ONLY after a 1-second press. Once a grown-up
// password exists, locked actions (profiles, reset, levels, family pets, change password) need an
// unlock; Show answer, Skip, Home, Sound and Delete my data stay open with the 1-second press alone.
import { h } from './dom.js';
import { deleteAll, defaults, activeProfile, resetProfileProgress, resetParks, freshProfile, save, NAME_MAX } from './store.js';
import { setLevel } from './engine.js';
import { PLAYABLE } from './acts/index.js';
import { tilePic } from './tiles.js';
import { builtGames, gameTitleFixed, ladderMax, stepAt, displayName, PROFILE_MAX, PROFILE_IDS, keysForLevel } from './games.js';
import { playgroundShips } from './playground.js';
import { canLock, makeLock, checkLock, validPassword, createGate, PASS_MIN } from './lock.js';

export { createGate };
export const HOLD_MS = 1000;

function levelWithKeys(game, prog) {
  const keys = keysForLevel(game && game.ladder, prog.lv, prog.top);
  return { lv: prog.lv, top: prog.top, good: prog.good === 1 ? 1 : 0, at: keys.at, topAt: keys.topAt };
}


const handPath = 'M8 15V7.5a1.7 1.7 0 0 1 3.4 0V13V5.2a1.7 1.7 0 0 1 3.4 0V13V6.4a1.7 1.7 0 0 1 3.4 0V14v-3.8a1.7 1.7 0 0 1 3.4 0V16q0 7.5-7.2 7.5q-4.6 0-7.2-4.2l-3-5a1.7 1.7 0 0 1 3-1.7z';

function ringSvg() {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', 'ring'); s.setAttribute('viewBox', '0 0 100 52');
  s.setAttribute('preserveAspectRatio', 'none'); s.setAttribute('aria-hidden', 'true');
  for (const cls of ['ring-track', 'ring-fill']) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('class', cls); r.setAttribute('x', '3'); r.setAttribute('y', '3');
    r.setAttribute('width', '94'); r.setAttribute('height', '46'); r.setAttribute('rx', '23'); r.setAttribute('pathLength', '100');
    s.appendChild(r);
  }
  return s;
}

function handSvg() {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', 'hand'); s.setAttribute('viewBox', '0 0 26 26'); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', handPath); p.setAttribute('fill', '#FFFFFF'); p.setAttribute('stroke', '#4A3426');
  p.setAttribute('stroke-width', '1.6'); p.setAttribute('stroke-linejoin', 'round');
  s.appendChild(p); return s;
}

export function createHold({ ms = HOLD_MS, onStart, onCancel, onDone, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let timer = null; let active = false;
  return {
    start() { if (active) return; active = true; onStart && onStart(); timer = setTimer(() => { timer = null; active = false; onDone && onDone(); }, ms); },
    cancel() { if (!active) return; active = false; clearTimer(timer); timer = null; onCancel && onCancel(); },
    get active() { return active; },
  };
}

export function dadButton(ctx) {
  const btn = h('button', { type: 'button', class: 'dad-btn', 'aria-label': 'Dad help. Press and hold for one second.' },
    ringSvg(), handSvg(), h('span', { class: 'dad-label', text: 'Dad' }));
  const hold = createHold({
    onStart: () => btn.classList.add('holding'),
    onCancel: () => btn.classList.remove('holding'),
    onDone: () => { btn.classList.remove('holding'); openDadPanel(ctx); },
  });
  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    try { btn.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    hold.start();
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) btn.addEventListener(ev, () => hold.cancel());
  btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); hold.start(); } });
  btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') hold.cancel(); });
  btn.addEventListener('blur', () => hold.cancel());
  btn.addEventListener('click', (e) => e.preventDefault());
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  return btn;
}

let lastFocus = null;
let onSheetClose = null;
export function closeDadPanel() {
  const wrap = document.getElementById('sheet');
  if (!wrap || wrap.hidden) return;
  if (onSheetClose) { const f = onSheetClose; onSheetClose = null; try { f(); } catch { /* ignore */ } }
  // Closing the grown-up panel ends the unlock (Amendment m3).
  if (typeof closeDadPanel._gateLock === 'function') closeDadPanel._gateLock();
  wrap.hidden = true;
  wrap.replaceChildren();
  document.body.classList.remove('sheet-open');
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
}

export function sheetBtn(label, onClick, cls = '', extra = {}) {
  return h('button', { type: 'button', class: `sheet-btn ${cls}`.trim(), onclick: onClick, ...extra }, label);
}

export function openSheet(body, { cls = '', onClose = null, backdropCloses = true } = {}) {
  const wrap = document.getElementById('sheet');
  if (!wrap) return null;
  closeDadPanel();
  lastFocus = document.activeElement;
  const sheet = h('section', { class: `sheet ${cls}`.trim(), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sheet-title' }, body);
  const backdrop = h('div', { class: 'sheet-backdrop', onclick: () => { if (backdropCloses) closeDadPanel(); } });
  wrap.replaceChildren(backdrop, sheet);
  wrap.hidden = false;
  onSheetClose = onClose;
  document.body.classList.add('sheet-open');
  sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDadPanel(); });
  const first = sheet.querySelector('button:not([disabled]), input');
  if (first) first.focus();
  return sheet;
}

function gate(ctx) {
  if (!ctx.gate) ctx.gate = createGate();
  closeDadPanel._gateLock = () => ctx.gate.lock();
  return ctx.gate;
}

function hasLock(ctx) { return !!(ctx.state && ctx.state.lock); }

// Run a locked action: if no lock or already unlocked, run now; else show the password prompt.
function withUnlock(ctx, action, back = 'menu') {
  const g = gate(ctx);
  g.touch();
  if (!hasLock(ctx) || g.isUnlocked()) { action(); return; }
  openPasswordPrompt(ctx, () => { g.unlock(); action(); }, back);
}

function field(label, opts = {}) {
  const id = opts.id || `f-${Math.random().toString(36).slice(2, 8)}`;
  const input = h('input', {
    id, type: opts.type || 'text', class: 'sheet-input', maxlength: String(opts.max || NAME_MAX),
    autocomplete: opts.autocomplete || 'off', placeholder: opts.placeholder || '',
    value: opts.value || '', // never pre-fill passwords (caller passes '')
  });
  if (opts.type === 'password') input.value = '';
  return h('label', { class: 'sheet-field' },
    h('span', { class: 'sheet-label', text: label }),
    input,
    opts.hint ? h('span', { class: 'sheet-hint', text: opts.hint }) : null);
}

function openPasswordPrompt(ctx, onOk, back = 'menu') {
  const err = h('p', { class: 'sheet-err', role: 'status' });
  const passField = field('Password', { type: 'password', autocomplete: 'current-password', id: 'dad-pass' });
  const input = passField.querySelector('input');
  const cont = sheetBtn('Continue', async () => {
    const g = gate(ctx);
    const wait = g.waiting();
    if (wait > 0) { err.textContent = 'Wait a moment, then try again.'; return; }
    const r = await g.tryPassword(ctx.state.lock, input.value);
    input.value = '';
    if (r.ok) { onOk(); return; }
    if (r.wait > 0) {
      err.textContent = 'Wait a moment, then try again.';
      cont.disabled = true;
      const t0 = Date.now();
      const tick = () => {
        const left = Math.ceil((r.wait - (Date.now() - t0)) / 1000);
        if (left <= 0) { cont.disabled = false; err.textContent = ''; return; }
        err.textContent = 'Wait a moment, then try again.';
        setTimeout(tick, 250);
      };
      tick();
    } else err.textContent = 'Not that one. Try again.';
  }, 'primary');
  openSheet([
    h('h2', { id: 'sheet-title', text: 'Grown-up check' }),
    passField, err, cont,
    sheetBtn('Cancel', () => openDadPanel(ctx, back)),
    h('button', { type: 'button', class: 'sheet-link', onclick: () => {
      openSheet([
        h('h2', { id: 'sheet-title', text: 'Forgot password?' }),
        h('p', { class: 'sheet-sub', text: 'Use Delete my data on the Dad sheet. That wipes this game\'s progress on this phone and turns the lock off. It never touches the cooking app.' }),
        sheetBtn('Back', () => openPasswordPrompt(ctx, onOk, back)),
      ]);
    } }, 'Forgot password?'),
  ], { cls: 'pass-sheet' });
}

function openSetupLock(ctx) {
  if (!canLock()) {
    openSheet([
      h('h2', { id: 'sheet-title', text: 'Grown-up password' }),
      h('p', { class: 'sheet-sub', text: 'This phone can\'t set a grown-up password. You can still play. Use Delete my data if you ever need a full wipe.' }),
      sheetBtn('Back', () => openDadPanel(ctx, 'menu')),
    ]);
    return;
  }
  const err = h('p', { class: 'sheet-err', role: 'status' });
  const nameF = field('Name for this player', { placeholder: 'Player', hint: 'Stays on this phone. The voice never says it.', id: 'setup-name' });
  const p1 = field('Password', { type: 'password', autocomplete: 'new-password', hint: 'At least 4 characters.', id: 'setup-p1' });
  const p2 = field('Type it again', { type: 'password', autocomplete: 'new-password', id: 'setup-p2' });
  const saveBtn = sheetBtn('Save', async () => {
    const a = p1.querySelector('input').value;
    const b = p2.querySelector('input').value;
    if (a !== b) { err.textContent = 'Those two don\'t match yet.'; return; }
    if (!validPassword(a)) { err.textContent = 'At least 4 characters.'; return; }
    const lock = await makeLock(a);
    if (!lock) { err.textContent = 'This phone can\'t set a grown-up password. You can still play. Use Delete my data if you ever need a full wipe.'; return; }
    const name = nameF.querySelector('input').value;
    const p = activeProfile(ctx.state);
    p.name = name.trim().slice(0, NAME_MAX);
    ctx.state.lock = lock;
    ctx.save();
    gate(ctx).unlock();
    closeDadPanel();
  }, 'primary');
  openSheet([
    h('h2', { id: 'sheet-title', text: 'Grown-up password' }),
    h('p', { class: 'sheet-sub', text: 'This is a lock against little hands on a shared phone. It is not bank-level security.' }),
    nameF, p1, p2, err,
    h('div', { class: 'sheet-row' }, sheetBtn('Cancel', () => openDadPanel(ctx, 'menu')), saveBtn),
  ], { cls: 'setup-sheet' });
}

function openChangePassword(ctx) {
  const err = h('p', { class: 'sheet-err', role: 'status' });
  const cur = field('Password', { type: 'password', autocomplete: 'current-password', id: 'chg-cur' });
  const p1 = field('Password', { type: 'password', autocomplete: 'new-password', hint: 'At least 4 characters.', id: 'chg-p1' });
  const p2 = field('Type it again', { type: 'password', autocomplete: 'new-password', id: 'chg-p2' });
  openSheet([
    h('h2', { id: 'sheet-title', text: 'Change grown-up password' }),
    cur, p1, p2, err,
    h('div', { class: 'sheet-row' },
      sheetBtn('Cancel', () => openDadPanel(ctx, 'menu')),
      sheetBtn('Save', async () => {
        if (!(await checkLock(ctx.state.lock, cur.querySelector('input').value))) { err.textContent = 'Not that one. Try again.'; return; }
        const a = p1.querySelector('input').value; const b = p2.querySelector('input').value;
        if (a !== b) { err.textContent = 'Those two don\'t match yet.'; return; }
        if (!validPassword(a)) { err.textContent = 'At least 4 characters.'; return; }
        const lock = await makeLock(a);
        if (!lock) { err.textContent = 'This phone can\'t set a grown-up password. You can still play. Use Delete my data if you ever need a full wipe.'; return; }
        ctx.state.lock = lock; ctx.save(); gate(ctx).unlock(); openDadPanel(ctx, 'menu');
      }, 'primary')),
  ]);
}

function openProfiles(ctx) {
  const profiles = ctx.state.profiles;
  const ids = PROFILE_IDS.filter((id) => profiles[id]);
  const rows = ids.map((id) => {
    const p = profiles[id];
    const active = id === ctx.state.active;
    const label = displayName(p.name);
    const menu = h('button', { type: 'button', class: 'profile-more', 'aria-label': `More for ${label}`, onclick: (e) => {
      e.stopPropagation();
      openProfileMenu(ctx, id);
    } }, '⋯');
    return h('div', { class: `profile-row${active ? ' active' : ''}`, 'data-profile': id },
      h('button', {
        type: 'button', class: 'profile-pick', 'aria-label': label,
        onclick: () => {
          if (active) return;
          withUnlock(ctx, () => {
            ctx.state.active = id; ctx.save(); closeDadPanel(); ctx.go('#home');
          }, 'profiles');
        },
      },
        h('span', { class: 'profile-face', 'aria-hidden': 'true' }),
        h('span', { class: 'profile-name', text: label }),
        active ? h('span', { class: 'profile-check', 'aria-hidden': 'true' }) : h('span', { class: 'spacer' })),
      menu);
  });
  const body = [
    h('h2', { id: 'sheet-title', text: 'Who\'s playing' }),
    ...rows,
  ];
  if (ids.length < PROFILE_MAX) {
    body.push(sheetBtn('Add another player', () => withUnlock(ctx, () => openAddProfile(ctx), 'profiles'), 'primary'));
  }
  body.push(sheetBtn('Back', () => openDadPanel(ctx, 'menu')));
  openSheet(body, { cls: 'profiles-sheet' });
}

function openProfileMenu(ctx, id) {
  const p = ctx.state.profiles[id];
  const active = id === ctx.state.active;
  const only = Object.keys(ctx.state.profiles).length === 1;
  const label = displayName(p.name);
  const body = [
    h('h2', { id: 'sheet-title', text: label }),
    sheetBtn('Rename', () => withUnlock(ctx, () => openRename(ctx, id), 'profiles')),
  ];
  if (!active && !only) {
    body.push(sheetBtn('Remove', () => withUnlock(ctx, () => openRemove(ctx, id), 'profiles'), 'danger-outline'));
  }
  body.push(sheetBtn('Back', () => openProfiles(ctx)));
  openSheet(body);
}

function openRename(ctx, id) {
  const p = ctx.state.profiles[id];
  const nameF = field('Name for this player', { placeholder: 'Player', value: p.name, hint: 'Stays on this phone. The voice never says it.' });
  openSheet([
    h('h2', { id: 'sheet-title', text: 'Rename' }),
    nameF,
    h('div', { class: 'sheet-row' },
      sheetBtn('Cancel', () => openProfiles(ctx)),
      sheetBtn('Save', () => {
        p.name = nameF.querySelector('input').value.trim().slice(0, NAME_MAX);
        ctx.save(); openProfiles(ctx);
      }, 'primary')),
  ]);
}

function openRemove(ctx, id) {
  const p = ctx.state.profiles[id];
  const label = displayName(p.name);
  const body = h('p', { class: 'sheet-sub' });
  body.textContent = `Remove ${label} from this phone?`;
  openSheet([
    h('h2', { id: 'sheet-title', text: 'Remove player?' }),
    body,
    sheetBtn('Remove', () => {
      delete ctx.state.profiles[id];
      if (ctx.state.active === id) ctx.state.active = Object.keys(ctx.state.profiles)[0];
      ctx.save(); openProfiles(ctx);
    }, 'danger'),
    sheetBtn('Cancel', () => openProfiles(ctx)),
  ]);
}

function openAddProfile(ctx) {
  const nameF = field('Name for this player', { placeholder: 'Player', hint: 'Stays on this phone. The voice never says it.' });
  openSheet([
    h('h2', { id: 'sheet-title', text: 'Add another player' }),
    nameF,
    h('div', { class: 'sheet-row' },
      sheetBtn('Cancel', () => openProfiles(ctx)),
      sheetBtn('Save', () => {
        const id = PROFILE_IDS.find((x) => !ctx.state.profiles[x]);
        if (!id) return;
        ctx.state.profiles[id] = freshProfile(nameF.querySelector('input').value);
        ctx.state.active = id;
        ctx.save(); closeDadPanel(); ctx.go('#home');
      }, 'primary')),
  ]);
}

// Reset park (Amendment q6, design.md §15.5): behind the lock, with a confirm. Only this player's parks go.
function openResetPark(ctx) {
  const p = activeProfile(ctx.state);
  const name = p.name && p.name.trim();
  const body = h('p', { class: 'sheet-sub' });
  body.textContent = name ? `This puts ${name}'s parks back to the starting parks.` : "This puts this player's parks back to the starting parks."; // all 3 zones (§16)
  openSheet([
    h('h2', { id: 'sheet-title', text: 'Reset park?' }),
    body,
    h('p', { class: 'sheet-sub', text: 'Levels, stickers and other players stay.' }),
    sheetBtn('Reset park', () => {
      resetParks(ctx.state);
      ctx.save();
      closeDadPanel();
      const t = h('p', { class: 'toast', role: 'status', text: 'Park reset.' });
      document.body.append(t);
      setTimeout(() => t.remove(), 2000);
      // on the play scene, show the starting park right away
      if (typeof location !== 'undefined' && /^#\/?playground\//.test(location.hash || '') && ctx.refresh) ctx.refresh();
    }, 'danger', { 'data-dad': 'reset-park-yes' }),
    sheetBtn('Cancel', () => openDadPanel(ctx, 'menu')),
  ], { cls: 'reset-sheet' });
}

function openReset(ctx) {
  const p = activeProfile(ctx.state);
  const named = !!(p.name && p.name.trim());
  const body = h('p', { class: 'sheet-sub' });
  body.textContent = named ? `This erases ${p.name.trim()}'s progress` : 'This erases this player\'s progress';
  openSheet([
    h('h2', { id: 'sheet-title', text: 'Reset progress?' }),
    body,
    h('p', { class: 'sheet-sub', text: 'Stickers and letter progress for this player go away. Other players, pet names and the cooking app stay.' }),
    sheetBtn('Erase progress', () => {
      resetProfileProgress(ctx.state);
      ctx.save();
      closeDadPanel();
      // toast then home
      const t = h('p', { class: 'toast', role: 'status', text: 'Progress erased.' });
      document.body.append(t);
      setTimeout(() => t.remove(), 2000);
      ctx.go('#home');
    }, 'danger'),
    sheetBtn('Cancel', () => openDadPanel(ctx, 'menu')),
  ], { cls: 'reset-sheet' });
}

export const LEVEL_LINES = {
  letters: ['m s a t p b', '+ n d f o i', '+ h l r g c', '+ e u w j k', '+ v y z q x'],
  count: ['1 to 5', '3 to 10', '8 to 20'],
  add: ['Up to 5', '6 to 10'],
  pattern: ['AB', 'AAB, ABB', 'ABC'],
  says: ['Puppy says one move', 'Count the moves (2 to 5)', 'Two moves in a row', 'Listen for "Puppy says"'],
};

export function levelLine(actId, lv) {
  return (LEVEL_LINES[actId] || [])[lv - 1] || `Step ${lv}`;
}

function stepLine(game, lv) {
  const step = stepAt(game, lv);
  if (!step) return '';
  const base = levelLine(step.act, step.lv);
  return `Step ${lv} of ${ladderMax(game)}: ${base}`;
}

function levelsView(ctx) {
  const games = builtGames(ctx.data.games, PLAYABLE).filter((g) => !g.noLevels);
  const profile = activeProfile(ctx.state);
  const note = h('p', { class: 'sheet-saved', role: 'status', 'aria-live': 'polite' });
  let noteTimer = null;
  const flash = (msg) => { note.textContent = msg; clearTimeout(noteTimer); noteTimer = setTimeout(() => { note.textContent = ''; }, 2000); };
  const rows = games.map((g) => {
    const max = ladderMax(g);
    const title = gameTitleFixed(g, ctx.state.pets);
    const line = h('p', { class: 'level-line' });
    const paint = () => {
      const p = profile.levels[g.id] || { lv: 1, top: 1, good: 0 };
      line.textContent = stepLine(g, p.lv);
    };
    paint();
    const tune = (kind) => {
      const p = profile.levels[g.id] || { lv: 1, top: 1, good: 0 };
      if (kind === 'easy') {
        if (p.lv >= max) { flash('She\'s at the top step.'); return; }
        profile.levels[g.id] = levelWithKeys(g, setLevel(p, p.lv + 1, max));
        flash('Moved up a step.');
      } else if (kind === 'hard') {
        if (p.lv <= 1) { flash('This is the first step.'); return; }
        profile.levels[g.id] = levelWithKeys(g, setLevel(p, p.lv - 1, max));
        flash('Moved to an easier step.');
      } else flash('Staying right here.');
      const s = ctx.session && ctx.session[g.id];
      if (s) { s.warm = 0; s.rocky = 0; }
      ctx.save(); paint();
    };
    return h('div', { class: `level-row ${g.id}`, 'data-game': g.id },
      h('div', { class: 'level-head' },
        h('span', { class: `level-pic tile-${g.id}`, 'aria-hidden': 'true' }, tilePic(g.id)),
        h('span', { class: 'level-name', text: title })),
      line,
      h('div', { class: 'tune-btns', role: 'group', 'aria-label': `${title} tuning` },
        sheetBtn('Too easy', () => tune('easy')),
        sheetBtn('Just right', () => tune('ok')),
        sheetBtn('Too hard', () => tune('hard'))),
      h('button', { type: 'button', class: 'sheet-link', onclick: () => openPickStep(ctx, g) }, 'Pick a step'));
  });
  return [
    h('h2', { id: 'sheet-title', text: 'Levels' }),
    h('p', { class: 'sheet-sub', text: 'Tap how it\'s going. The game also moves up on its own after two good rounds.' }),
    ...rows, note,
    sheetBtn('Back', () => openDadPanel(ctx, 'menu')),
    sheetBtn('Close', () => closeDadPanel(), 'plain'),
  ];
}

function openPickStep(ctx, game) {
  const profile = activeProfile(ctx.state);
  const max = ladderMax(game);
  const title = gameTitleFixed(game, ctx.state.pets);
  const btns = h('div', { class: 'level-btns', role: 'group', 'aria-label': `${title} step` });
  const paint = () => {
    const p = profile.levels[game.id] || { lv: 1, top: 1, good: 0 };
    btns.replaceChildren(...Array.from({ length: max }, (_, i) => {
      const n = i + 1;
      const cls = n === p.lv ? 'current' : n <= p.top ? 'reached' : 'unreached';
      return h('button', {
        type: 'button', class: `level-btn ${cls}`, 'data-level': String(n),
        'aria-pressed': n === p.lv ? 'true' : 'false',
        'aria-label': `${title} step ${n}`,
        onclick: () => {
          profile.levels[game.id] = levelWithKeys(game, setLevel(p, n, max));
          ctx.save(); paint();
        },
      }, String(n));
    }));
  };
  paint();
  openSheet([
    h('h2', { id: 'sheet-title', text: title }),
    h('p', { class: 'sheet-sub', text: 'Pick a step.' }),
    btns,
    sheetBtn('Back', () => openDadPanel(ctx, 'levels')),
  ]);
}

export function openDadPanel(ctx, view = 'menu') {
  const wrap = document.getElementById('sheet');
  if (!wrap) return;
  if (wrap.hidden) lastFocus = document.activeElement;
  gate(ctx).touch();
  const q = ctx.question;
  let body;
  if (view === 'confirm') {
    body = [
      h('h2', { id: 'sheet-title', text: 'Delete everything on this phone, including pet photos?' }),
      h('p', { class: 'sheet-sub', text: 'Pet photos, pet names, family pets, stickers and settings for this game are removed from this phone.' }),
      sheetBtn('Delete', async () => {
        await deleteAll();
        ctx.state = defaults();
        closeDadPanel();
        ctx.afterDelete ? ctx.afterDelete() : ctx.go('#home');
      }, 'danger'),
      sheetBtn('Cancel', () => openDadPanel(ctx, 'menu')),
    ];
  } else if (view === 'levels') {
    body = levelsView(ctx);
  } else if (view === 'fun') {
    // behind the grown-up lock (the menu only offers it through withUnlock; this guards a direct open too)
    if (hasLock(ctx) && !gate(ctx).isUnlocked()) { withUnlock(ctx, () => openDadPanel(ctx, 'fun')); return; }
    body = [
      h('h2', { id: 'sheet-title', text: 'Voices' }),
      h('p', { class: 'sheet-sub', text: 'Hello voices and pet names.' }),
    ];
    body.push(sheetBtn(`Hello voices: ${ctx.state.intros !== false ? 'On' : 'Off'}`, () => {
      ctx.state.intros = !(ctx.state.intros !== false); ctx.save(); openDadPanel(ctx, 'fun');
    }, '', { 'aria-pressed': ctx.state.intros !== false ? 'true' : 'false' }));
    body.push(h('p', { class: 'sheet-hint', text: 'Characters say hi when they show up.' }));
    body.push(sheetBtn(`Say pet names: ${ctx.state.sayNames !== false ? 'On' : 'Off'}`, () => {
      ctx.state.sayNames = !(ctx.state.sayNames !== false); ctx.save(); openDadPanel(ctx, 'fun');
    }, '', { 'aria-pressed': ctx.state.sayNames !== false ? 'true' : 'false' }));
    body.push(h('p', { class: 'sheet-hint', text: "Uses this phone's own voice for names you typed. Names stay on the phone." }));
    body.push(sheetBtn('Back', () => openDadPanel(ctx, 'menu')));
    body.push(sheetBtn('Close', () => closeDadPanel(), 'plain'));
  } else if (view === 'moves') {
    // Puppy Says (Amendment p5): every move, read-only, for playing without the screen. Behind the
    // grown-up lock like Short round: with a password set and not unlocked, this asks for it first.
    if (hasLock(ctx) && !gate(ctx).isUnlocked()) { withUnlock(ctx, () => openDadPanel(ctx, 'moves')); return; }
    const says = ctx.data.says;
    body = [
      h('h2', { id: 'sheet-title', text: 'Park moves' }),
      h('p', { class: 'sheet-sub', text: says.note }),
      h('ul', { class: 'moves-list' }, [...says.moves, ...says.gym, says.calm].map((m) => h('li', { text: m.text }))),
      sheetBtn('Back', () => openDadPanel(ctx, 'menu')),
      sheetBtn('Close', () => closeDadPanel(), 'plain'),
    ];
  } else if (view === 'profiles') {
    openProfiles(ctx); return;
  } else {
    const locked = hasLock(ctx);
    body = [
      h('h2', { id: 'sheet-title', text: 'Dad help' }),
      q && q.dadText ? h('p', { class: 'sheet-sub', text: q.dadText }) : null,
      sheetBtn('Show answer', () => { closeDadPanel(); q && q.showAnswer && q.showAnswer(); }, '', { disabled: !q || !q.showAnswer }),
      sheetBtn('Skip', () => { closeDadPanel(); q && q.skip(); }, '', { disabled: !q }),
      sheetBtn('Home', () => { closeDadPanel(); ctx.go('#home'); }),
      sheetBtn(`Sound: ${ctx.state.sound ? 'On' : 'Off'}`, () => {
        ctx.state.sound = !ctx.state.sound; ctx.save();
        ctx.audio && ctx.audio.setEnabled(ctx.state.sound);
        openDadPanel(ctx, 'menu');
      }, '', { 'aria-pressed': ctx.state.sound ? 'true' : 'false' }),
    ];
    // Character Fun toggles (design.md §13.6) — behind the grown-up lock
    const funToggles = () => {
      body.push(sheetBtn(`Hello voices: ${ctx.state.intros !== false ? 'On' : 'Off'}`, () => {
        ctx.state.intros = !(ctx.state.intros !== false); ctx.save(); openDadPanel(ctx, 'menu');
      }, '', { 'aria-pressed': ctx.state.intros !== false ? 'true' : 'false' }));
      body.push(h('p', { class: 'sheet-hint', text: 'Characters say hi when they show up.' }));
      body.push(sheetBtn(`Say pet names: ${ctx.state.sayNames !== false ? 'On' : 'Off'}`, () => {
        ctx.state.sayNames = !(ctx.state.sayNames !== false); ctx.save(); openDadPanel(ctx, 'menu');
      }, '', { 'aria-pressed': ctx.state.sayNames !== false ? 'true' : 'false' }));
      body.push(h('p', { class: 'sheet-hint', text: "Uses this phone's own voice for names you typed. Names stay on the phone." }));
    };
    // Puppy Says (Amendment p5, the whole Dad sheet behind the lock): the soft-space note, Short round and
    // the read-only move list. With a password set and not unlocked, only one button shows, and it asks first.
    if (q && q.says) {
      if (!locked || gate(ctx).isUnlocked()) {
        body.push(h('p', { class: 'sheet-hint', text: ctx.data.says.note }));
        body.push(sheetBtn(`Short round: ${ctx.state.saysShort ? 'On' : 'Off'}`, () => withUnlock(ctx, () => {
          ctx.state.saysShort = !ctx.state.saysShort; ctx.save(); openDadPanel(ctx, 'menu');
        }), '', { 'aria-pressed': ctx.state.saysShort ? 'true' : 'false' }));
        body.push(h('p', { class: 'sheet-hint', text: '3 moves instead of 5. Starts with the next round.' }));
        body.push(sheetBtn('Park moves', () => withUnlock(ctx, () => openDadPanel(ctx, 'moves'))));
      } else {
        body.push(sheetBtn('Puppy Says settings', () => withUnlock(ctx, () => openDadPanel(ctx, 'menu'))));
      }
    }
    // Playground (design.md §13.6, Amendment q): only when the Playground ships (Design's fix: no toggle
    // before the tile exists). Behind the lock like Puppy Says: locked, one button asks for the password.
    if (playgroundShips(ctx.data)) {
      if (!locked || gate(ctx).isUnlocked()) {
        body.push(sheetBtn(`Playground: ${ctx.state.playground !== false ? 'On' : 'Off'}`, () => withUnlock(ctx, () => {
          ctx.state.playground = !(ctx.state.playground !== false); ctx.save(); openDadPanel(ctx, 'menu');
        }), '', { 'aria-pressed': ctx.state.playground !== false ? 'true' : 'false', 'data-dad': 'playground' }));
        body.push(h('p', { class: 'sheet-hint', text: 'Shows the Playground (park, coaster and water) on home.' }));
        body.push(sheetBtn('Reset park', () => withUnlock(ctx, () => openResetPark(ctx)), 'danger-outline', { 'data-dad': 'reset-park' }));
        body.push(h('p', { class: 'sheet-hint', text: "Puts this player's parks back to the starting parks." }));
      } else {
        body.push(sheetBtn('Playground settings', () => withUnlock(ctx, () => openDadPanel(ctx, 'menu')), '', { 'data-dad': 'playground-settings' }));
      }
    }
    if (!locked) {
      body.push(sheetBtn('Set up a grown-up password', () => openSetupLock(ctx)));
      body.push(h('p', { class: 'sheet-hint', text: 'Stops little hands from changing levels or wiping progress.' }));
    } else {
      body.push(sheetBtn('Who\'s playing', () => withUnlock(ctx, () => openProfiles(ctx))));
      body.push(sheetBtn('Reset this player\'s progress', () => withUnlock(ctx, () => openReset(ctx)), 'danger-outline'));
      body.push(sheetBtn('Change grown-up password', () => withUnlock(ctx, () => openChangePassword(ctx))));
    }
    body.push(sheetBtn('Family pets', () => withUnlock(ctx, () => { closeDadPanel(); ctx.go('#pets'); })));
    body.push(sheetBtn('Levels', () => withUnlock(ctx, () => openDadPanel(ctx, 'levels'))));
    // Hello / Say pet names: require unlock when a password exists
    if (locked) {
      body.push(sheetBtn('Hello voices & names', () => withUnlock(ctx, () => {
        // expand toggles on a mini view — or apply funToggles into menu after unlock by opening menu unlocked
        ctx._dadUnlocked = true;
        openDadPanel(ctx, 'fun');
      })));
    } else {
      funToggles();
    }
    body.push(sheetBtn('Delete my data', () => openDadPanel(ctx, 'confirm'), 'danger-outline'));
    body.push(sheetBtn('Close', () => closeDadPanel(), 'plain'));
  }
  const sheet = h('section', { class: view === 'levels' ? 'sheet levels-sheet' : view === 'moves' ? 'sheet moves-sheet' : 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sheet-title' }, body);
  const backdrop = h('div', { class: 'sheet-backdrop', onclick: () => closeDadPanel() });
  wrap.replaceChildren(backdrop, sheet);
  wrap.hidden = false;
  onSheetClose = null;
  document.body.classList.add('sheet-open');
  const first = sheet.querySelector('button:not([disabled])');
  if (first) first.focus();
  sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDadPanel(); });
}
