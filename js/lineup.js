// "Line up the face" (design.md section 6c): a full-screen Dad sheet that shows the picked photo
// behind a circle guide. Dad drags to move it and uses the zoom slider (1x to 4x); it starts
// centred. The crop never goes past the photo's edge (photo-core clampView). Use photo hands the
// view back; the app crops what is inside the guide.
import { h } from './dom.js';
import { openSheet, closeDadPanel, sheetBtn } from './dad.js';
import { startView, dragView, zoomView, cropSide, ZOOM_MIN, ZOOM_MAX, MESSAGES } from './photo-core.js';

export const GUIDE = 0.72; // the guide circle's share of the preview width

export function openLineup(bitmap, { onUse, onCancel }) {
  const W = bitmap.width;
  const H = bitmap.height;
  let view = startView(W, H);
  let busy = false;
  let closed = false;
  const canvas = h('canvas', { class: 'lineup-canvas', tabindex: '0', 'aria-label': 'Photo with a circle guide. Drag to move it.' });
  const zoom = h('input', { type: 'range', class: 'lineup-zoom', id: 'lineup-zoom', min: String(ZOOM_MIN), max: String(ZOOM_MAX), step: '0.01', value: String(ZOOM_MIN) });
  const status = h('p', { class: 'lineup-status', role: 'status', 'aria-live': 'polite' });

  let frame = 0;
  function draw() {
    frame = 0;
    if (closed) return;
    const css = canvas.getBoundingClientRect().width || 300;
    const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
    const px = Math.round(css * dpr);
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    const g = canvas.getContext('2d');
    const guide = px * GUIDE;
    const side = cropSide(W, H, view.zoom);
    const k = guide / side;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#2B2420';
    g.fillRect(0, 0, px, px);
    g.imageSmoothingEnabled = true;
    g.setTransform(k, 0, 0, k, px / 2 - view.cx * k, px / 2 - view.cy * k);
    g.drawImage(bitmap, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.beginPath();
    g.rect(0, 0, px, px);
    g.arc(px / 2, px / 2, guide / 2, 0, Math.PI * 2);
    g.fillStyle = 'rgba(30, 20, 14, .55)';
    g.fill('evenodd');
    g.beginPath();
    g.arc(px / 2, px / 2, guide / 2, 0, Math.PI * 2);
    g.lineWidth = 3 * dpr;
    g.strokeStyle = '#FFFFFF';
    g.stroke();
  }
  const redraw = () => { if (!frame) frame = requestAnimationFrame(draw); };
  const guidePx = () => (canvas.getBoundingClientRect().width || 300) * GUIDE;

  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    view = dragView(W, H, view, e.clientX - drag.x, e.clientY - drag.y, guidePx());
    drag.x = e.clientX; drag.y = e.clientY;
    redraw();
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(ev, () => { drag = null; });
  canvas.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [12, 0], ArrowRight: [-12, 0], ArrowUp: [0, 12], ArrowDown: [0, -12] }[e.key];
    if (!step) return;
    e.preventDefault();
    view = dragView(W, H, view, step[0], step[1], guidePx());
    redraw();
  });
  zoom.addEventListener('input', () => { view = zoomView(W, H, view, Number(zoom.value)); redraw(); });

  const use = sheetBtn('Use photo', async () => {
    if (busy) return;
    busy = true;
    use.disabled = true; cancel.disabled = true; zoom.disabled = true;
    status.textContent = MESSAGES.saving;
    const ok = await onUse({ ...view });
    if (!ok) { busy = false; use.disabled = false; cancel.disabled = false; zoom.disabled = false; status.textContent = MESSAGES.save; return; }
    closeDadPanel();
  }, 'primary');
  const cancel = sheetBtn('Cancel', () => closeDadPanel(), 'plain');

  openSheet([
    h('h2', { id: 'sheet-title', text: 'Line up the face' }),
    h('p', { class: 'sheet-sub', text: 'Drag the photo so the face fills the circle. Zoom with the slider.' }),
    h('div', { class: 'lineup-stage' }, canvas),
    h('div', { class: 'lineup-zoom-row' },
      h('label', { for: 'lineup-zoom', text: 'Zoom' }), zoom),
    status,
    h('div', { class: 'lineup-buttons' }, use, cancel),
  ], {
    cls: 'lineup',
    backdropCloses: false,
    onClose: () => {
      closed = true;
      if (frame) cancelAnimationFrame(frame);
      if (onCancel) onCancel(busy);
    },
  });
  draw();
  requestAnimationFrame(draw); // once more after layout settles
  return { get view() { return { ...view }; } };
}
