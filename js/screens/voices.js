// Family voices (Dad, behind the lock): a row per slot; mic asked only on Record; clips in IndexedDB.
import { h } from '../dom.js';
import { nameBox, leave as flushName } from './family.js';
import { helloPrompt } from '../petname.js';
import { openSheet, closeDadPanel, sheetBtn, grownUpOpen } from '../dad.js';
import {
  voiceSlots, hasVoice, voiceCount, voiceBlob, rememberVoice, forgetVoice,
  putVoice, removeVoice, makeClip, REC_MS, VOICE_MESSAGES,
} from '../voices.js';

let rec = null; // { slot, mr, stream, timer } while recording
let player = null; // { ac, src } while a clip plays (Web Audio: no media element, no object URL)

function stopPlayer() {
  if (!player) return;
  const { ac, src } = player;
  player = null;
  try { src.stop(); } catch { /* ignore */ }
  try { ac.close(); } catch { /* ignore */ }
}
function stopRec(keep) {
  if (!rec) return;
  const r = rec;
  rec = null;
  clearTimeout(r.timer);
  r.keep = keep;
  try { if (r.mr.state !== 'inactive') r.mr.stop(); } catch { /* ignore */ }
  for (const t of r.stream.getTracks()) t.stop();
}

export function render(ctx) {
  if (!grownUpOpen(ctx)) { setTimeout(() => ctx.go('#home')); return h('main', { class: 'dad-screen voices' }); }
  const picker = h('input', { type: 'file', accept: 'audio/*', class: 'voice-input', hidden: true, tabindex: '-1', 'aria-hidden': 'true' });
  let pickingFor = null;
  const count = h('p', { class: 'dad-sub voice-count' });
  const rows = new Map();
  const setCount = () => { count.textContent = `${voiceCount()} of 19 slots have a family voice. Empty slots use the game's own sound, or stay quiet.`; };

  const save = async (row, blob) => {
    row.status.textContent = 'Saving\u2026';
    try {
      const clip = await makeClip(blob);
      await putVoice(row.slot.id, clip);
      rememberVoice(row.slot.id, clip);
      row.status.textContent = '';
    } catch (e) {
      row.status.textContent = VOICE_MESSAGES[e && e.code] || VOICE_MESSAGES.save;
    }
    paintAll();
  };

  async function record(row) {
    stopPlayer();
    if (rec) { const was = rec.slot; stopRec(true); if (was === row.slot.id) return; }
    row.status.textContent = '';
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // only here, only on this tap
    } catch {
      row.status.textContent = VOICE_MESSAGES.mic;
      return;
    }
    let mr;
    try { mr = new MediaRecorder(stream); } catch { for (const t of stream.getTracks()) t.stop(); row.status.textContent = VOICE_MESSAGES.open; return; }
    const parts = [];
    const me = { slot: row.slot.id, mr, stream, keep: true, timer: setTimeout(() => stopRec(true), REC_MS) };
    mr.ondataavailable = (e) => { if (e.data && e.data.size) parts.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(parts, { type: mr.mimeType || 'audio/webm' });
      parts.length = 0;
      if (me.keep) save(row, blob); else paintAll();
    };
    rec = me;
    mr.start();
    paintAll();
  }

  async function play(row) {
    stopPlayer();
    const blob = voiceBlob(row.slot.id);
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!blob || !AC) return;
    const ac = new AC(); // made inside the tap, so it may start
    const me = { ac, src: { stop() {} } };
    player = me;
    try {
      const buf = await ac.decodeAudioData(await blob.arrayBuffer());
      if (player !== me) return;
      const src = ac.createBufferSource();
      src.buffer = buf; src.connect(ac.destination);
      src.onended = () => { if (player === me) stopPlayer(); };
      me.src = src;
      src.start();
    } catch { if (player === me) stopPlayer(); row.status.textContent = VOICE_MESSAGES.open; }
  }

  function clear(row) {
    openSheet([
      h('h2', { id: 'sheet-title', text: `Clear ${row.slot.label}? The game's own sound comes back.` }),
      sheetBtn('Clear', async () => {
        try { await removeVoice(row.slot.id); forgetVoice(row.slot.id); row.status.textContent = ''; } catch { row.status.textContent = VOICE_MESSAGES.save; }
        closeDadPanel();
        paintAll();
      }, 'danger'),
      sheetBtn('Cancel', () => closeDadPanel()),
    ]);
  }

  function paint(row) {
    const id = row.slot.id;
    const has = hasVoice(id);
    const recording = !!(rec && rec.slot === id);
    row.el.className = `voice-row${has ? ' has' : ''}${recording ? ' rec' : ''}`;
    // a slot with no game sound of its own (Ready to play, Bye-bye) is silent when empty: no status then
    row.state.textContent = recording ? 'Recording\u2026 tap Stop' : has ? 'Family voice' : row.slot.game ? 'Game sound' : '';
    const b = (act, label, fn, extra = {}) => h('button', { type: 'button', class: `voice-btn ${act}`, 'data-act': act, onclick: fn, ...extra }, label);
    row.btns.replaceChildren(
      recording ? b('stop', 'Stop', () => stopRec(true)) : b('rec', has ? 'Re-record' : 'Record', () => record(row)),
      b('load', 'Pick file', () => { stopRec(false); row.status.textContent = ''; pickingFor = row; picker.click(); }, { disabled: recording }),
      b('play', 'Play', () => play(row), { disabled: !has || recording }),
      b('clear', 'Clear', () => clear(row), { disabled: !has || recording }),
    );
  }
  function paintAll() { for (const r of rows.values()) paint(r); setCount(); }

  const list = voiceSlots(ctx.data).map((slot) => {
    const row = {
      slot,
      el: h('div', { class: 'voice-row', 'data-slot': slot.id }),
      state: h('span', { class: 'voice-state' }),
      btns: h('div', { class: 'voice-btns' }),
      status: h('p', { class: 'pc-status', role: 'status', 'aria-live': 'polite' }),
    };
    row.el.append(h('div', { class: 'voice-head' }, h('strong', { class: 'voice-label', text: slot.label }), row.state));
    const p = slot.prompt && ctx.data.pets[+slot.id.slice(4) - 1];
    if (p) {
      const say = h('p', { class: 'voice-prompt', text: `Say: “${slot.prompt}”` });
      const st = ctx.state.pets[p.id] ||= { on: true, name: '' };
      if (!st.name) {
        const box = nameBox(ctx, p, st, () => { say.textContent = `Say: “${helloPrompt(ctx.data, p.id)}”`; });
        row.el.append(h('label', { class: 'pc-name', for: `name-${p.id}`, text: "Pet's name" }), box);
      }
      row.el.append(say);
    }
    if (slot.note) row.el.append(h('span', { class: 'voice-note', text: slot.note }));
    row.el.append(row.btns, row.status);
    rows.set(slot.id, row);
    paint(row);
    return row.el;
  });
  setCount();

  picker.addEventListener('change', () => {
    const row = pickingFor;
    const file = picker.files && picker.files[0];
    picker.value = '';
    pickingFor = null;
    if (row && file) save(row, file);
  });

  return h('main', { class: 'dad-screen voices' },
    h('header', { class: 'dad-head' },
      h('button', { type: 'button', class: 'dad-back', onclick: () => ctx.go('#home') }, '\u2039 Done'),
      h('h1', { text: 'Family voices' })),
    ctx.data.pets.some((p) => { const t = ctx.state.pets[p.id]; return !t || (t.on !== false && !t.name); })
      && h('button', { type: 'button', class: 'photo-btn voice-hint', onclick: () => ctx.go('#pets') }, 'Tap to add pet names'),
    h('p', { class: 'dad-sub', text: "Clips stay on this phone. They're never sent anywhere." }),
    count,
    h('p', { class: 'dad-note voice-tip', text: 'Tip: somewhere quiet, phone a hand away, one short happy line. Each clip is trimmed and evened out.' }),
    picker,
    h('div', { class: 'voice-rows' }, list));
}

export function leave(ctx) {
  flushName(ctx);
  stopRec(false);
  stopPlayer();
}
