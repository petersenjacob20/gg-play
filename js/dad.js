// Dad help (design.md section 5). The button opens ONLY after a 1-second press: a ring fills around
// it while held; letting go early empties it and nothing happens; a quick tap does nothing.
// The panel is a bottom sheet with text for Dad.
import { h } from './dom.js';
import { deleteAll, defaults, LEVEL_MAX } from './store.js';
import { setLevel } from './engine.js';
import { TILES } from './acts/index.js';
import { tilePic } from './tiles.js';

export const HOLD_MS = 1000;

const handPath = 'M8 15V7.5a1.7 1.7 0 0 1 3.4 0V13V5.2a1.7 1.7 0 0 1 3.4 0V13V6.4a1.7 1.7 0 0 1 3.4 0V14v-3.8a1.7 1.7 0 0 1 3.4 0V16q0 7.5-7.2 7.5q-4.6 0-7.2-4.2l-3-5a1.7 1.7 0 0 1 3-1.7z';

function ringSvg() {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', 'ring');
  s.setAttribute('viewBox', '0 0 100 52');
  s.setAttribute('preserveAspectRatio', 'none');
  s.setAttribute('aria-hidden', 'true');
  for (const cls of ['ring-track', 'ring-fill']) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('class', cls);
    r.setAttribute('x', '3'); r.setAttribute('y', '3'); r.setAttribute('width', '94'); r.setAttribute('height', '46');
    r.setAttribute('rx', '23'); r.setAttribute('pathLength', '100');
    s.appendChild(r);
  }
  return s;
}

function handSvg() {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', 'hand');
  s.setAttribute('viewBox', '0 0 26 26');
  s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', handPath);
  p.setAttribute('fill', '#FFFFFF');
  p.setAttribute('stroke', '#4A3426');
  p.setAttribute('stroke-width', '1.6');
  p.setAttribute('stroke-linejoin', 'round');
  s.appendChild(p);
  return s;
}

// Press-and-hold logic, kept separate from the DOM so it can be tested with a fake clock.
export function createHold({ ms = HOLD_MS, onStart, onCancel, onDone, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let timer = null;
  let active = false;
  return {
    start() {
      if (active) return;
      active = true;
      onStart && onStart();
      timer = setTimer(() => { timer = null; active = false; onDone && onDone(); }, ms);
    },
    cancel() {
      if (!active) return;
      active = false;
      clearTimer(timer);
      timer = null;
      onCancel && onCancel();
    },
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
  btn.addEventListener('click', (e) => e.preventDefault()); // a quick tap does nothing
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  return btn;
}

let lastFocus = null;
let onSheetClose = null;
export function closeDadPanel() {
  const wrap = document.getElementById('sheet');
  if (!wrap || wrap.hidden) return;
  if (onSheetClose) { const f = onSheetClose; onSheetClose = null; try { f(); } catch { /* ignore */ } }
  wrap.hidden = true;
  wrap.replaceChildren();
  document.body.classList.remove('sheet-open');
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
}

export function sheetBtn(label, onClick, cls = '', extra = {}) {
  return h('button', { type: 'button', class: `sheet-btn ${cls}`.trim(), onclick: onClick, ...extra }, label);
}

// Any other Dad sheet (Family pets: the photo line-up and the Remove confirm). onClose runs once
// when it closes, however that happens (a button, the backdrop, Escape or a screen change).
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
  const first = sheet.querySelector('button:not([disabled])');
  if (first) first.focus();
  return sheet;
}

export function openDadPanel(ctx, view = 'menu') {
  const wrap = document.getElementById('sheet');
  if (!wrap) return;
  if (wrap.hidden) lastFocus = document.activeElement;
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
  } else {
    body = [
      h('h2', { id: 'sheet-title', text: 'Dad help' }),
      q && q.dadText ? h('p', { class: 'sheet-sub', text: q.dadText }) : null,
      sheetBtn('Show answer', () => { closeDadPanel(); q && q.showAnswer(); }, '', { disabled: !q }),
      sheetBtn('Skip', () => { closeDadPanel(); q && q.skip(); }, '', { disabled: !q }),
      sheetBtn('Home', () => { closeDadPanel(); ctx.go('#home'); }),
      sheetBtn(`Sound: ${ctx.state.sound ? 'On' : 'Off'}`, () => {
        ctx.state.sound = !ctx.state.sound;
        ctx.save();
        ctx.audio && ctx.audio.setEnabled(ctx.state.sound);
        openDadPanel(ctx, 'menu');
      }, '', { 'aria-pressed': ctx.state.sound ? 'true' : 'false' }),
      sheetBtn('Family pets', () => { closeDadPanel(); ctx.go('#pets'); }),
      sheetBtn('Levels', () => openDadPanel(ctx, 'levels')),
      sheetBtn('Delete my data', () => openDadPanel(ctx, 'confirm'), 'danger-outline'),
      sheetBtn('Close', () => closeDadPanel(), 'plain'),
    ];
  }
  const sheet = h('section', { class: view === 'levels' ? 'sheet levels-sheet' : 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sheet-title' }, body);
  const backdrop = h('div', { class: 'sheet-backdrop', onclick: () => closeDadPanel() });
  wrap.replaceChildren(backdrop, sheet);
  wrap.hidden = false;
  document.body.classList.add('sheet-open');
  const first = sheet.querySelector('button:not([disabled])');
  if (first) first.focus();
  sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDadPanel(); });
}

// ---- Levels (design.md 9.9, plan f2): text for Dad. One row per activity with levels: the tile
// picture, the name, then 44 px level buttons. Current = filled, reached = solid outline, not reached
// yet = light outline (still tappable; tapping unlocks it). A tap saves right away: "Saved." for 2 s.
// One plain line says what the current level covers. Never "down", "behind" or "failed".
export const LEVEL_LINES = {
  letters: ['m s a t p b', '+ n d f o i', '+ h l r g c', '+ e u w j k', '+ v y z q x'],
  count: ['1 to 5', '3 to 10', '8 to 20'],
  add: ['Up to 5', '6 to 10'],
  pattern: ['AB', 'AAB, ABB', 'ABC'],
};

// The plain line under a row. Until a level's content ships, the line says what plays for now.
export function levelLine(id, lv, data) {
  const base = (LEVEL_LINES[id] || [])[lv - 1] || '';
  if (id === 'letters' && data && Array.isArray(data.letters)) {
    const ready = data.letters.some((l) => (l.level || 1) === lv);
    if (!ready) {
      const now = data.letters.filter((l) => (l.level || 1) <= lv).map((l) => l.lower).join(' ');
      return `${base} (coming soon; for now it plays ${now})`;
    }
  }
  if (TILES.some((t) => t.id === id && t.soon)) return `${base} (coming soon)`; // a tile still marked soon (none with levels since piece 4)
  return base;
}

function levelsView(ctx) {
  const saved = h('p', { class: 'sheet-saved', role: 'status', 'aria-live': 'polite' });
  let savedTimer = null;
  const rows = TILES.filter((t) => !t.noLevels && LEVEL_MAX[t.id]).map((t) => {
    const max = LEVEL_MAX[t.id];
    const line = h('p', { class: 'level-line' });
    const btns = h('div', { class: 'level-btns', role: 'group', 'aria-label': `${t.name} level` });
    const paint = () => {
      const p = ctx.state.levels[t.id];
      line.textContent = levelLine(t.id, p.lv, ctx.data);
      btns.replaceChildren(...Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const cls = n === p.lv ? 'current' : n <= p.top ? 'reached' : 'unreached';
        return h('button', {
          type: 'button',
          class: `level-btn ${cls}`,
          'data-level': String(n),
          'aria-pressed': n === p.lv ? 'true' : 'false',
          'aria-label': `${t.name} level ${n}`,
          onclick: () => {
            const r = setLevel(ctx.state.levels[t.id], n, max);
            ctx.state.levels[t.id] = { lv: r.lv, top: r.top, good: r.good };
            const s = ctx.session && ctx.session[t.id];
            if (s) { s.warm = 0; s.rocky = 0; }
            if (ctx.save) ctx.save();
            paint();
            saved.textContent = 'Saved.';
            clearTimeout(savedTimer);
            savedTimer = setTimeout(() => { saved.textContent = ''; }, 2000);
          },
        }, String(n));
      }));
    };
    paint();
    return h('div', { class: `level-row ${t.id}`, 'data-act': t.id },
      h('div', { class: 'level-head' }, h('span', { class: `level-pic tile-${t.id}`, 'aria-hidden': 'true' }, tilePic(t.id)), h('span', { class: 'level-name', text: t.name })),
      btns, line);
  });
  return [
    h('h2', { id: 'sheet-title', text: 'Levels' }),
    h('p', { class: 'sheet-sub', text: 'Pick where to play. The game also moves up on its own after two good rounds.' }),
    ...rows,
    saved,
    sheetBtn('Back', () => openDadPanel(ctx, 'menu')),
    sheetBtn('Close', () => closeDadPanel(), 'plain'),
  ];
}
