// "Our pet photos" (plan Amendment 2026-10-01c, design.md section 6c): the pure parts, importable
// from Node. Which ids may have a photo, the size cap, the crop to the "Line up the face" guide,
// and a JPEG metadata check that keeps only the image itself (no Exif, GPS, comments or profiles).
// Nothing here touches the browser. photos.js does the decoding, canvas and on-phone storage.
import { PET_IDS, PHOTO_DB_NAME } from './store.js';

export const PHOTO_DB = PHOTO_DB_NAME; // 'gg-photos'
export const PHOTO_STORE = 'photos';
export const PHOTO_DB_VERSION = 1;
export const OUT_SIZE = 512;
export const JPEG_QUALITY = 0.8;
export const MAX_BYTES = 20 * 1024 * 1024;
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;

// Only the 8 pet ids can have a photo (never a friend, never anything else).
export function validPetId(id) {
  return typeof id === 'string' && PET_IDS.includes(id);
}

// Checked before decoding: an empty file or one over 20 MB is refused. The type is not trusted
// (phones sometimes send none); a file that is not a picture simply fails to decode.
export function checkFile(file) {
  const size = file && Number.isFinite(file.size) ? file.size : -1;
  if (size <= 0) return { ok: false, error: 'open' };
  if (size > MAX_BYTES) return { ok: false, error: 'big' };
  return { ok: true };
}

export const MESSAGES = {
  big: 'That photo is too big. Pick another one.',
  open: "That photo didn't open. Pick another one.",
  save: "That photo didn't save. The drawing stays.",
  saving: 'Saving on this phone\u2026',
};

// A stored record is exactly { v:1, blob, w:512, h:512 }: no name, time, file name or original bytes.
export function photoRecord(blob) {
  return { v: 1, blob, w: OUT_SIZE, h: OUT_SIZE };
}
export function validRecord(rec) {
  return Boolean(rec && typeof rec === 'object' && rec.v === 1 && rec.w === OUT_SIZE && rec.h === OUT_SIZE
    && rec.blob && typeof rec.blob === 'object' && rec.blob.type === 'image/jpeg' && Object.keys(rec).length === 4);
}

// ---- crop to the guide --------------------------------------------------------------------------
// The view is { zoom, cx, cy }: the zoom (1 to 4) and the centre of the crop in photo pixels. At
// zoom 1 the guide holds the largest square that fits the photo; zoom 4 holds a quarter of that.
// The crop square never goes past the photo's edge.
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function cropSide(w, h, zoom) {
  return Math.min(w, h) / clamp(Number.isFinite(zoom) ? zoom : ZOOM_MIN, ZOOM_MIN, ZOOM_MAX);
}

export function startView(w, h) {
  return { zoom: ZOOM_MIN, cx: w / 2, cy: h / 2 };
}

export function clampView(w, h, view) {
  const zoom = clamp(Number.isFinite(view && view.zoom) ? view.zoom : ZOOM_MIN, ZOOM_MIN, ZOOM_MAX);
  const half = cropSide(w, h, zoom) / 2;
  const cx = clamp(Number.isFinite(view && view.cx) ? view.cx : w / 2, half, w - half);
  const cy = clamp(Number.isFinite(view && view.cy) ? view.cy : h / 2, half, h - half);
  return { zoom, cx, cy };
}

// The source square to draw into the 512x512 output.
export function cropRect(w, h, view) {
  const v = clampView(w, h, view);
  const side = cropSide(w, h, v.zoom);
  return { sx: v.cx - side / 2, sy: v.cy - side / 2, side };
}

// Dad drags the photo by (dx, dy) screen pixels while the guide is guidePx wide: the photo follows
// the finger, so the crop centre moves the other way.
export function dragView(w, h, view, dx, dy, guidePx) {
  const per = cropSide(w, h, view.zoom) / Math.max(1, guidePx);
  return clampView(w, h, { zoom: view.zoom, cx: view.cx - dx * per, cy: view.cy - dy * per });
}

// Zooming keeps the same centre (as far as the edges allow).
export function zoomView(w, h, view, zoom) {
  return clampView(w, h, { ...view, zoom });
}

// ---- JPEG metadata --------------------------------------------------------------------------------
// The segments before the image data: [{ marker, start, end }]. Stops at Start of Scan.
export function jpegSegments(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  const out = [];
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xFF) return null;
    const marker = b[i + 1];
    if (marker === 0xFF) { i++; continue; } // fill byte
    if (marker === 0xD9) break;
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2 || i + 2 + len > b.length) return null;
    out.push({ marker, start: i, end: i + 2 + len });
    if (marker === 0xDA) break; // image data follows
    i += 2 + len;
  }
  return out;
}

const isMeta = (m) => (m >= 0xE1 && m <= 0xEF) || m === 0xFE; // APP1-APP15 and comments (APP0 JFIF stays)

export function hasMetadata(bytes) {
  const segs = jpegSegments(bytes);
  return !segs || segs.some((s) => isMeta(s.marker));
}

// A copy with every APP1-APP15 and comment segment removed. The image data is untouched.
export function stripMetadata(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const segs = jpegSegments(b);
  if (!segs) return null;
  const keep = [b.subarray(0, 2)];
  for (const s of segs) if (!isMeta(s.marker)) keep.push(b.subarray(s.start, s.end));
  const last = segs[segs.length - 1];
  keep.push(b.subarray(last ? last.end : 2));
  const out = new Uint8Array(keep.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of keep) { out.set(x, o); o += x.length; }
  return out;
}

// The picture size from the frame header (SOF0-SOF15 except DHT/JPG/DAC).
export function jpegSize(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const s of jpegSegments(b) || []) {
    const m = s.marker;
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      return { h: (b[s.start + 5] << 8) | b[s.start + 6], w: (b[s.start + 7] << 8) | b[s.start + 8] };
    }
  }
  return null;
}

// The Exif Orientation tag (1-8), or 0 when there is no Exif.
export function exifOrientation(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const s of jpegSegments(b) || []) {
    if (s.marker !== 0xE1) continue;
    const p = s.start + 4;
    if (String.fromCharCode(...b.subarray(p, p + 4)) !== 'Exif') continue;
    const t = p + 6;
    const le = b[t] === 0x49;
    const u16 = (o) => (le ? b[t + o] | (b[t + o + 1] << 8) : (b[t + o] << 8) | b[t + o + 1]);
    const u32 = (o) => (le ? (b[t + o] | (b[t + o + 1] << 8) | (b[t + o + 2] << 16)) + b[t + o + 3] * 0x1000000 : b[t + o] * 0x1000000 + ((b[t + o + 1] << 16) | (b[t + o + 2] << 8) | b[t + o + 3]));
    const ifd = u32(4);
    const n = u16(ifd);
    for (let k = 0; k < n; k++) {
      const e = ifd + 2 + k * 12;
      if (u16(e) === 0x0112) return u16(e + 8);
    }
  }
  return 0;
}

// Width and height once an Exif orientation is applied (5-8 turn the picture a quarter turn).
export function orientedSize(w, h, orientation) {
  return orientation >= 5 && orientation <= 8 ? { w: h, h: w } : { w, h };
}
