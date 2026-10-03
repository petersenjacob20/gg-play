// Tiny DOM helpers. Text is only ever set with textContent (never innerHTML).
// Nothing here touches the DOM at import time, so Node tests can import the pure parts.

export const SVG_NS = 'http://www.w3.org/2000/svg';

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  setProps(el, props);
  append(el, children);
  return el;
}

function setProps(el, props) {
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'text') el.textContent = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'hidden') el[k] = Boolean(v);
    else if (k === 'style' || k === 'innerHTML' || k === 'outerHTML') throw new Error(`h(): "${k}" is not allowed`);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === undefined || c === null || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return el;
}

// Drawings are plain data trees: [tag, attrs, ...children]. svg() turns one into real SVG nodes
// with createElementNS + setAttribute only (no markup strings, no style attributes).
export function svg(tree) {
  if (tree === null || tree === undefined || tree === false) return null;
  if (!Array.isArray(tree)) return null;
  const [tag, attrs = {}, ...kids] = tree;
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'style') throw new Error('svg(): style attributes are not allowed');
    el.setAttribute(k, String(v));
  }
  addKids(el, kids);
  return el;
}

// Children may be trees ([tag, ...]) or plain lists of trees (from .map()).
function addKids(el, kids) {
  for (const k of kids) {
    if (Array.isArray(k) && typeof k[0] !== 'string') addKids(el, k);
    else {
      const n = svg(k);
      if (n) el.appendChild(n);
    }
  }
}

// Wrap a drawing tree in an <svg> with a viewBox. Kid-screen drawings are decorative to screen readers
// unless a generic label is given (never a pet's real name).
export function drawing(tree, { cls = '', label = '', box = '0 0 120 120' } = {}) {
  const root = svg(['svg', { viewBox: box, class: ('drawing ' + cls).trim(), xmlns: SVG_NS, focusable: 'false' }, tree]);
  if (label) { root.setAttribute('role', 'img'); root.setAttribute('aria-label', label); } else root.setAttribute('aria-hidden', 'true');
  return root;
}

export function clear(el) { el.replaceChildren(); return el; }
