// Pet names (Amendment pn): one helper for every place a pet is shown or said. The name is the one
// Dad typed in Family pets (gg.v1 pets[id].name, on this phone only); without one, the neutral default
// label. Speech order: the grown-up's Family voices clip for that slot, else an on-device voice saying
// the line with the name (localService only, Say pet names on), else the game's own clip.
// Names are never logged, put in a URL or title, cached or sent anywhere.
import { speakLocal } from './character.js';

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

// Say a line about one pet. slot: the app clip a Family voices clip may stand in for; text has
// {name}; clips: the game's own sequence. Resolves 'family' | 'speech' | 'clip' | 'skip'.
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

// Hide and Seek: the joined call (clip ids) as words, with the pet hider's typed name. Returns
// { lead, text } (lead: clips before the first word, e.g. the game intro) or null when no pet
// hider in the call has a sayable name or a piece has no words.
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
