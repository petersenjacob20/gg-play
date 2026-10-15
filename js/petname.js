// Pet names (Amendment pn): the name Dad typed (gg.v1, this phone only), else the default label. Speech: Family clip,
// else on-device voice (localService, Say pet names on), else the game clip. Names are never logged, cached or sent.
import { speakLocal, characterById } from './character.js';

let get = () => null;
export function usePetState(fn) { get = typeof fn === 'function' ? fn : () => fn; }
const cur = () => get() || {};
export const SPEECH_MAX_MS = 6000;

// The typed name, or ''.
export function petName(id, pets = cur().pets) {
  const p = pets && pets[id];
  return p && typeof p.name === 'string' ? p.name.trim() : '';
}
// The name to show (and for screen readers): typed name, else the default label.
export function petLabel(data, id) {
  const x = [...((data && data.pets) || []), ...((data && data.friends) || [])].find((p) => p.id === id);
  if (!x) return 'Pet';
  return (x.kind !== 'friend' && petName(id)) || x.label;
}
// The name the voice may say: Say pet names on, Sound on, the pet on and a name typed. Else ''.
export function sayName(id, state = cur()) {
  if (!state || state.sayNames === false || state.sound === false) return '';
  const p = state.pets && state.pets[id];
  if (!p || p.on === false) return '';
  return petName(id, state.pets);
}
// Fill {name}: the typed name when set, else the fallback.
export const petLine = (tpl, id, fallback) => String(tpl).split('{name}').join(petName(id) || fallback);
// A pet's hello line, for the Voices recording prompt.
export const helloPrompt = (data, id) => `Hi, I'm ${petLabel(data, id)}!`;

const waitSpeech = (u) => Promise.race([new Promise((r) => { u.onend = r; u.onerror = r; }), new Promise((r) => setTimeout(r, SPEECH_MAX_MS))]);

// Say a line about a pet (text with {name}): Family clip for slot, else on-device speech, else clips.
export async function petSpeak(ctx, { id, text, clips = [], slot = '', pitch = 1, rate = 1 }) {
  const a = ctx && ctx.audio;
  if (slot && a && typeof a.hasFamily === 'function' && a.hasFamily(slot)) { await a.play([slot]); return 'family'; }
  const n = text ? sayName(id, ctx && ctx.state) : '';
  if (n) {
    const u = speakLocal(String(text).split('{name}').join(n), { pitch, rate });
    if (u) { await waitSpeech(u); return 'speech'; }
  }
  if (a && clips.length) { await a.play(clips); return 'clip'; }
  return 'skip';
}

// Hide's call as words with the pet hider's typed name: { lead, text } (lead: clips before the first word), or null.
export function hideText(hide, data, seq, state = cur()) {
  const c = hide.clips;
  const words = new Map([[c.where, 'Where is'], [c.tap, 'tap'], [c.put, 'Put'], [c.yourTurn, 'Your turn to hide!'], [c.findAll, 'Find all my friends!']]);
  for (const w of hide.words || []) words.set(w.clip, w.text);
  for (const s of hide.scenes || []) for (const sp of s.spots || []) words.set(sp.clip, `the ${sp.text}`);
  for (const k of hide.colors || []) words.set(k.clip, k.id);
  let named = false;
  for (const x of hide.hiders || []) {
    const n = x.pet ? sayName(x.id, state) : '';
    if (n) named = true;
    words.set(x.clip, n || (x.pet ? `the ${x.id}` : petLabel(data, x.id)));
  }
  if (!named || !seq.some((s) => typeof s === 'string' && [...(hide.hiders || [])].some((x) => x.pet && x.clip === s && sayName(x.id, state)))) return null;
  const lead = [];
  let i = 0;
  while (i < seq.length && !(typeof seq[i] === 'string' && words.has(seq[i]))) lead.push(seq[i++]);
  const out = [];
  for (; i < seq.length; i++) {
    const s = seq[i];
    if (typeof s !== 'string') { if (out.length && !/[.?!]$/.test(out[out.length - 1])) out.push(out[0] === 'Where is' ? '?' : '.'); continue; }
    if (!words.has(s)) return null;
    out.push(words.get(s));
  }
  let text = out.join(' ').replace(/ ([?.])/g, '$1');
  // a spot with a colour: "the red couch" (the colour clip comes before the spot clip)
  text = text.replace(/\b(red|yellow|blue|green) the /g, 'the $1 ');
  text = text.replace(/([?.]) ([a-z])/g, (m, p, l) => `${p} ${l.toUpperCase()}`);
  return { lead, text: /[.?!]$/.test(text) ? text : `${text}.` };
}

// Hide's call: on-device voice with the pet's name when it may be said, else the game's own clips.
export async function hidePlay(ctx, hide, seq) {
  const a = ctx && ctx.audio;
  const t = hide && ctx && ctx.state ? hideText(hide, ctx.data, seq, ctx.state) : null;
  if (t) {
    if (t.lead.length && a) await a.play(t.lead);
    const u = speakLocal(t.text);
    if (u) { await waitSpeech(u); return true; }
  }
  return a ? a.play(seq) : true;
}

// Hello tap: a tap on a .pet[data-pet] that means nothing else (no control, not a quiet screen) says hello: Family clip,
// else on-device "Hi, I'm <name or label>!", else hi-<id>. Same pet again within HELLO_MS: ignored.
export const HELLO_MS = 1500;
const NO = 'button,a,input,label,[role=button],.count-pup';
const QUIET = ['playground', 'says', 'pets', 'voices'];
let last = {};
export function sayHello(ctx, id, now = Date.now()) {
  const a = ctx.audio || {}; const st = ctx.state || {}; const c = characterById(ctx.data, id); const k = `hi-${id}`;
  if (!c || st.sound === false || (last.id === id && now - last.at < HELLO_MS)) return 'skip';
  last = { id, at: now };
  if (a.hasFamily && a.hasFamily(k)) return a.fx([k]), 'family';
  if (c.kind !== 'friend' && st.sayNames !== false && (st.pets || {})[id]?.on !== false && speakLocal(`Hi, I'm ${sayName(id, st) || c.label}!`, c.hello)) return 'speech';
  return a.fx ? (a.fx([k]), 'clip') : 'skip';
}
export const helloAt = (t, screen) => !QUIET.includes(screen) && !t.closest(NO) && t.closest('.pet[data-pet]');
export function bindHello(doc, ctx) {
  doc.addEventListener('click', (e) => {
    const el = !e.defaultPrevented && e.target.closest && helloAt(e.target, doc.body.dataset.screen);
    if (el) { el.classList.remove('hello-bop'); void el.offsetWidth; el.classList.add('hello-bop'); sayHello(ctx(), el.dataset.pet); }
  });
}
