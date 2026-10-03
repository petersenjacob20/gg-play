// "Our pet photos" on this phone only (plan Amendment 2026-10-01c, design.md section 6c).
// Dad picks a photo per pet in Family pets; it is decoded with the phone's own orientation, cropped
// to the guide, drawn at 512x512 on a canvas and saved as a new JPEG. Only that new picture is kept,
// in IndexedDB `gg-photos` (store `photos`, keyed by pet id). The picked file itself is never
// stored, cached, shown or sent, and its name is never read. Nothing here runs at import time.
import {
  PHOTO_DB, PHOTO_STORE, PHOTO_DB_VERSION, OUT_SIZE, JPEG_QUALITY,
  validPetId, checkFile, cropRect, photoRecord, validRecord, hasMetadata, stripMetadata,
} from './photo-core.js';

// ---- on-phone store ---------------------------------------------------------------------------------
function req(r) {
  return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}

// Only saving a photo creates the database. Reading or removing never does, so after Delete all
// (or on a phone that never had a photo) there is no gg-photos database at all.
export function openPhotoDB(idb = globalThis.indexedDB, { create = true } = {}) {
  return new Promise((resolve, reject) => {
    if (!idb) { reject(new Error('no store')); return; }
    const r = idb.open(PHOTO_DB, PHOTO_DB_VERSION);
    r.onupgradeneeded = (e) => {
      if (!create && (!e || !e.oldVersion)) { r.transaction.abort(); return; } // nothing saved yet: don't make one
      if (!r.result.objectStoreNames.contains(PHOTO_STORE)) r.result.createObjectStore(PHOTO_STORE);
    };
    r.onsuccess = () => {
      const db = r.result;
      db.onversionchange = () => db.close(); // Delete all is never blocked by an open connection
      resolve(db);
    };
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('blocked'));
  });
}

async function withStore(mode, fn, idb) {
  const db = await openPhotoDB(idb, { create: mode === 'readwrite' && fn.creates === true });
  try {
    const tx = db.transaction(PHOTO_STORE, mode);
    const done = new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });
    const out = await fn(tx.objectStore(PHOTO_STORE));
    await done;
    return out;
  } finally { db.close(); }
}

// Every saved photo, read once when the app opens: Map(pet id -> Blob). Anything that is not one
// of the 8 ids or not a proper record is ignored. If the store cannot be read, the drawings show.
export async function loadPhotos(idb = globalThis.indexedDB) {
  const out = new Map();
  try {
    await withStore('readonly', async (st) => {
      const keys = await req(st.getAllKeys());
      for (const k of keys) {
        if (!validPetId(k)) continue;
        const rec = await req(st.get(k));
        if (validRecord(rec)) out.set(k, rec.blob);
      }
    }, idb);
  } catch { /* no store: drawings */ }
  return out;
}

export async function putPhoto(id, blob, idb = globalThis.indexedDB) {
  if (!validPetId(id)) throw new Error('not a pet id');
  const rec = photoRecord(blob);
  if (!validRecord(rec)) throw new Error('not a photo');
  const write = (st) => req(st.put(rec, id));
  write.creates = true;
  await withStore('readwrite', write, idb);
}

export async function removePhoto(id, idb = globalThis.indexedDB) {
  if (!validPetId(id)) throw new Error('not a pet id');
  try {
    await withStore('readwrite', (st) => req(st.delete(id)), idb);
  } catch (e) {
    if (e && e.name === 'AbortError') return; // no database: nothing to remove
    throw e;
  }
}

// Best effort: ask the phone to keep this site's storage (photos) when space runs low.
export async function askToKeep(nav = globalThis.navigator) {
  try { if (nav && nav.storage && nav.storage.persist) return await nav.storage.persist(); } catch { /* ignore */ }
  return false;
}

// ---- the photos in memory (one Blob per pet) and their object URLs ---------------------------------
const photos = new Map();
const urls = new Map();

export function setPhotos(map) { photos.clear(); for (const [k, v] of map) if (validPetId(k)) photos.set(k, v); }
export function hasPhoto(id) { return photos.has(id); }
export function photoCount() { return photos.size; }
export function rememberPhoto(id, blob) { revokePhotoURL(id); if (validPetId(id)) photos.set(id, blob); }
export function forgetPhoto(id) { revokePhotoURL(id); photos.delete(id); }
export function forgetAllPhotos() { revokePhotoURLs(); photos.clear(); }

// One object URL per pet for the screen in view; all of them are revoked when the screen changes.
export function photoURL(id) {
  if (!photos.has(id)) return null;
  if (!urls.has(id)) urls.set(id, URL.createObjectURL(photos.get(id)));
  return urls.get(id);
}
export function revokePhotoURL(id) {
  if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
}
export function revokePhotoURLs() {
  for (const u of urls.values()) URL.revokeObjectURL(u);
  urls.clear();
}

// ---- pick and process ------------------------------------------------------------------------------
// Decode the picked file the right way up (the phone's orientation applied). Returns an ImageBitmap,
// or throws { code: 'big' | 'open' }. The file is only read here and is not kept.
export async function decodePhoto(file) {
  const c = checkFile(file);
  if (!c.ok) throw Object.assign(new Error(c.error), { code: c.error });
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw Object.assign(new Error('open'), { code: 'open' });
  }
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', JPEG_QUALITY));
}

// Crop the decoded picture to the guide and make the new 512x512 JPEG. Only this new picture is
// ever stored. A last check drops any metadata segment a browser might add (none do today).
export async function renderPhoto(bitmap, view) {
  const { sx, sy, side } = cropRect(bitmap.width, bitmap.height, view);
  const canvas = document.createElement('canvas');
  canvas.width = OUT_SIZE;
  canvas.height = OUT_SIZE;
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(bitmap, sx, sy, side, side, 0, 0, OUT_SIZE, OUT_SIZE);
  const blob = await toBlob(canvas);
  canvas.width = 0; canvas.height = 0;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (!hasMetadata(bytes)) return new Blob([bytes], { type: 'image/jpeg' });
  const clean = stripMetadata(bytes);
  if (!clean) throw new Error('encode');
  return new Blob([clean], { type: 'image/jpeg' });
}

// Decode + crop + encode in one step (used by the browser check and by Use photo).
export async function processFile(file, view) {
  const bitmap = await decodePhoto(file);
  try { return await renderPhoto(bitmap, view); } finally { bitmap.close && bitmap.close(); }
}
