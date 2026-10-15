// Character Fun n1 (Amendment n, §13): hellos and tricks. Pet names are spoken only by a localService voice, never sent.

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

// Speak a line with an on-device voice only (cancels any prior); the utterance, or null. Never logs the text.
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

// Speak "I'm <name>!"; true if started.
export function speakPetHello(name, { pitch = 1, rate = 1, synth = globalThis.speechSynthesis } = {}) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (!n) return false;
  return Boolean(speakLocal(`I'm ${n}!`, { pitch, rate, synth }));
}

// Dad's typed name when the voice may say it (Say pet names and Sound on, pet on), else ''.
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
  // a grown-up's Family voices clip for this hello comes first (audio.js plays it in place of the app clip)
  if (clip && ctx.audio && typeof ctx.audio.hasFamily === 'function' && ctx.audio.hasFamily(clip) && typeof ctx.audio.fx === 'function') {
    ctx.audio.fx([clip]);
    return 'family';
  }
  if (isPet && ctx.state && ctx.state.sayNames !== false) {
    const typed = speakableName(ctx.state, character.id);
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
