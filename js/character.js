// Character Fun n1 (Amendment n, design.md §13): hello on host arrive, right-answer tricks.
// Friends use recorded clips. Pets use default-label clips, or on-device speech for Dad's typed
// name when Say pet names is on — only SpeechSynthesisVoice.localService === true. Names are
// never logged, put in a URL/title, cached by the SW, or sent anywhere.

export const HELLO_MAX_MS = 1500;

// Pick an on-device voice only. Cloud / network voices are never used (name must stay on the phone).
export function pickLocalVoice(synth = globalThis.speechSynthesis) {
  if (!synth || typeof synth.getVoices !== 'function') return null;
  let voices = [];
  try { voices = synth.getVoices() || []; } catch { return null; }
  const local = voices.filter((v) => v && v.localService === true);
  if (!local.length) return null;
  const en = local.find((v) => /^en\b/i.test(v.lang || '')) || local[0];
  return en;
}

// Speak a short line with an on-device voice only, with pitch/rate. Returns the utterance when one
// was started, else null (no speech, no local voice, or it failed). Cancels any prior utterance.
// Never logs the text. Used by the hello ("I'm <name>!") and Puppy Says' lead ("<name> says...").
export function speakLocal(text, { pitch = 1, rate = 1, synth = globalThis.speechSynthesis } = {}) {
  if (!synth || typeof synth.speak !== 'function') return null;
  const t = typeof text === 'string' ? text.trim() : '';
  if (!t) return null;
  const voice = pickLocalVoice(synth);
  if (!voice) return null;
  try {
    if (typeof synth.cancel === 'function') synth.cancel();
    const U = globalThis.SpeechSynthesisUtterance;
    if (typeof U !== 'function') return null;
    const u = new U(t);
    u.voice = voice;
    u.pitch = Math.min(2, Math.max(0.5, Number(pitch) || 1));
    u.rate = Math.min(2, Math.max(0.5, Number(rate) || 1));
    u.volume = 1;
    synth.speak(u);
    return u;
  } catch {
    return null;
  }
}

// Speak "I'm <name>!" with pitch/rate. Returns true if an utterance was started.
// Cancels any prior utterance. Never logs the name.
export function speakPetHello(name, { pitch = 1, rate = 1, synth = globalThis.speechSynthesis } = {}) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (!n) return false;
  return Boolean(speakLocal(`I'm ${n}!`, { pitch, rate, synth }));
}

// The name Dad typed for a pet, when the voice may say it (Amendment n): Say pet names on, Sound on,
// the pet switched on and a name typed. Otherwise '' (the default-label clip plays instead).
export function speakableName(state, id) {
  if (!state || state.sayNames === false || state.sound === false) return '';
  const p = state.pets && state.pets[id];
  if (!p || p.on === false || typeof p.name !== 'string') return '';
  return p.name.trim();
}

export function cancelSpeech(synth = globalThis.speechSynthesis) {
  try { if (synth && typeof synth.cancel === 'function') synth.cancel(); } catch { /* ignore */ }
}

export function isPetId(data, id) {
  return Boolean(data && Array.isArray(data.pets) && data.pets.some((p) => p.id === id));
}

export function characterById(data, id) {
  if (!data || !id) return null;
  return [...(data.pets || []), ...(data.friends || [])].find((c) => c.id === id) || null;
}

// Play a character's hello once. Non-blocking. Returns 'speech' | 'clip' | 'skip'.
export function playHello(ctx, character) {
  if (!ctx || !character || !character.hello) return 'skip';
  if (ctx.state && ctx.state.intros === false) return 'skip';
  if (ctx.state && ctx.state.sound === false) return 'skip';
  const hello = character.hello;
  const clip = typeof hello.clip === 'string' ? hello.clip : '';
  const isPet = isPetId(ctx.data, character.id);
  if (isPet && ctx.state && ctx.state.sayNames !== false) {
    const typed = ctx.state.pets && ctx.state.pets[character.id] && typeof ctx.state.pets[character.id].name === 'string'
      ? ctx.state.pets[character.id].name.trim() : '';
    if (typed) {
      const ok = speakPetHello(typed, { pitch: hello.pitch, rate: hello.rate });
      if (ok) return 'speech';
    }
  }
  if (clip && ctx.audio && typeof ctx.audio.fx === 'function') {
    ctx.audio.fx([clip]);
    return 'clip';
  }
  return 'skip';
}

// Next trick id: never the same as last when the list has more than one.
export function nextTrick(tricks, last) {
  const list = Array.isArray(tricks) ? tricks.filter((t) => typeof t === 'string' && t) : [];
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  const pool = list.filter((t) => t !== last);
  const pick = pool[Math.floor(Math.random() * pool.length)] || list[0];
  return pick;
}

// Whether Story Time (or a no-host route) should skip hello/tricks.
export function hostDoesFun(game) {
  if (!game) return true; // #play/<act> still has a host
  if (game.id === 'stories' || (typeof game.route === 'string' && game.route.includes('stories'))) return false;
  return true;
}
