// Audio (build plan section 5): pre-made clips listed in ./audio/audio-manifest.json, played with
// Web Audio after the first tap (iOS needs a tap to unlock audio). Pet names are never in clips;
// Character Fun (Amendment n) may speak a typed pet name only via character.js on-device speech.
// A clip that is missing, still pending, or fails to load is simply skipped.
// Pure helpers (playable, planSequence, estimateMs) are importable from Node.

export const MANIFEST_URL = './audio/audio-manifest.json';
const DEFAULT_MS = { snd: 500, w: 650, n: 550, p: 1500, t: 900, c: 900, h: 900, fx: 600, q: 3200 };

export function playable(manifest, id) {
  const e = manifest && typeof id === 'string' ? manifest[id] : null;
  return Boolean(e && typeof e === 'object' && !e.pending && /^[a-zA-Z0-9-]+$/.test(id) && clipFile(manifest, id));
}

// The clip's file inside ./audio/: the manifest's own "file" field when it is a plain safe name,
// otherwise <id>.mp3 (the generator's default). Never a path or another origin.
export function clipFile(manifest, id) {
  const e = manifest && manifest[id];
  if (e && typeof e.file === 'string') return /^[a-zA-Z0-9-]+\.mp3$/.test(e.file) ? e.file : null;
  return `${id}.mp3`;
}

// A sequence is a list of clip ids and pauses ({ pause: ms }). Returns what will play and what is missing.
export function planSequence(seq, manifest) {
  const items = [];
  const missing = [];
  for (const x of seq || []) {
    if (x && typeof x === 'object' && Number.isFinite(x.pause)) items.push({ pause: Math.max(0, x.pause) });
    else if (typeof x === 'string') {
      if (playable(manifest, x)) items.push({ id: x });
      else missing.push(x);
    }
  }
  // Pauses only make sense between sounds.
  while (items.length && items[0].pause !== undefined) items.shift();
  while (items.length && items[items.length - 1].pause !== undefined) items.pop();
  return { items, missing };
}

// How long a sequence takes (or would take), for visual cues when the sound is off or missing.
export function estimateMs(seq, manifest = {}) {
  let ms = 0;
  for (const x of seq || []) {
    if (x && typeof x === 'object' && Number.isFinite(x.pause)) ms += x.pause;
    else if (typeof x === 'string') {
      const e = manifest[x];
      ms += e && Number.isFinite(e.seconds) ? Math.round(e.seconds * 1000) : (DEFAULT_MS[x.split('-')[0]] || 700);
    }
  }
  return ms;
}

export function createAudio({ enabled = true } = {}) {
  let manifest = {};
  let ac = null;
  let on = enabled;
  let token = 0;
  let sources = [];
  let doneTimer = null;
  let endWait = null; // resolves the running play() early when it is cut off
  const buffers = new Map();
  const loading = new Map();

  async function init() {
    try {
      const res = await fetch('./audio/audio-manifest.json');
      manifest = res.ok ? await res.json() : {};
    } catch { manifest = {}; }
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) manifest = {};
  }

  function load(id) {
    if (buffers.has(id)) return Promise.resolve(buffers.get(id));
    if (loading.has(id)) return loading.get(id);
    const p = (async () => {
      try {
        const res = await fetch(`./audio/${clipFile(manifest, id)}`);
        if (!res.ok) return null;
        const data = await res.arrayBuffer();
        const buf = await new Promise((resolve, reject) => {
          const r = ac.decodeAudioData(data, resolve, reject);
          if (r && typeof r.then === 'function') r.then(resolve, reject);
        });
        buffers.set(id, buf);
        return buf;
      } catch {
        return null;
      } finally {
        loading.delete(id);
      }
    })();
    loading.set(id, p);
    return p;
  }

  // Called from the first tap anywhere. Creates the AudioContext inside the gesture, plays one
  // silent sample (iOS unlock), then decodes every playable clip in the background.
  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return; }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    try {
      ac = new AC();
      const b = ac.createBuffer(1, 1, 22050);
      const s = ac.createBufferSource();
      s.buffer = b; s.connect(ac.destination); s.start(0);
      if (ac.state === 'suspended') ac.resume().catch(() => {});
    } catch { ac = null; return; }
    for (const id of Object.keys(manifest)) if (playable(manifest, id)) load(id);
  }

  // Stops whatever is playing. A play() that gets cut off (a new play, Sound off, a screen change)
  // still reports finished at once, so nothing waiting on it hangs until a fallback timer.
  function stop() {
    token++;
    clearTimeout(doneTimer);
    if (endWait) { const end = endWait; endWait = null; end(); }
    for (const s of sources) { try { s.stop(); } catch { /* already stopped */ } }
    sources = [];
  }

  // Play a sequence; resolves when it has finished, at once if nothing can play, and as soon as it
  // is stopped or cut off by another play (then with false).
  async function play(seq) {
    stop();
    const my = token;
    if (!on || !ac) return false;
    const { items } = planSequence(seq, manifest);
    if (!items.length) return false;
    const bufs = await Promise.all(items.map((x) => (x.id ? load(x.id) : null)));
    if (my !== token) return false;
    let t = ac.currentTime + 0.03;
    const start = t;
    let any = false;
    items.forEach((x, i) => {
      if (x.pause !== undefined) { t += x.pause / 1000; return; }
      const buf = bufs[i];
      if (!buf) return;
      const s = ac.createBufferSource();
      s.buffer = buf;
      s.connect(ac.destination);
      s.start(t);
      sources.push(s);
      t += buf.duration;
      any = true;
    });
    if (!any) return false;
    await new Promise((resolve) => {
      endWait = resolve;
      doneTimer = setTimeout(() => { endWait = null; resolve(); }, Math.ceil((t - start) * 1000) + 40);
    });
    return my === token;
  }

  // A short effect (a pop, a boing) on top of whatever is playing: it never cuts the voice line off.
  // The next play() or stop() ends it like any other sound. Resolves when it has been scheduled.
  async function fx(seq) {
    const my = token;
    if (!on || !ac) return false;
    const { items } = planSequence([].concat(seq), manifest);
    if (!items.length) return false;
    const bufs = await Promise.all(items.map((x) => (x.id ? load(x.id) : null)));
    if (my !== token) return false;
    let t = ac.currentTime + 0.02;
    items.forEach((x, i) => {
      if (x.pause !== undefined) { t += x.pause / 1000; return; }
      if (!bufs[i]) return;
      const s = ac.createBufferSource();
      s.buffer = bufs[i];
      s.connect(ac.destination);
      s.start(t);
      sources.push(s);
      t += bufs[i].duration;
    });
    return true;
  }

  return {
    init,
    unlock,
    play,
    fx,
    stop,
    has: (id) => playable(manifest, id),
    estimateMs: (seq) => estimateMs(seq, manifest),
    setEnabled(v) { on = Boolean(v); if (!on) stop(); },
    get enabled() { return on; },
    get unlocked() { return Boolean(ac); },
    get manifest() { return manifest; },
  };
}
