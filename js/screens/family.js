// Family pets (Dad's screen, design.md sections 5 and 6c): 8 pet cards, each with its picture (the
// photo in its sticker frame, or the drawing), an "In our family" toggle, a name field (max 20
// characters, placeholder = generic label) and Add photo / Change photo / Remove photo.
// Names are stored in gg.v1 on this phone only, shown here as text, and never spoken. Photos are
// stored on this phone only (gg-photos) and never uploaded; the picked file itself is never kept.
import { h, drawing } from '../dom.js';
import { drawChar } from '../pets.js';
import { capName, NAME_MAX } from '../store.js';
import { photoSticker } from '../ui.js';
import { openSheet, closeDadPanel, sheetBtn } from '../dad.js';
import { openLineup } from '../lineup.js';
import { MESSAGES } from '../photo-core.js';
import {
  decodePhoto, renderPhoto, putPhoto, removePhoto, askToKeep,
  hasPhoto, photoCount, photoURL, rememberPhoto, forgetPhoto,
} from '../photos.js';

let saveTimer = null;

function art(p) {
  const url = photoURL(p.id);
  if (url) return h('div', { class: 'pc-art has-photo', 'data-photo': '1' }, h('div', { class: `pc-sticker photo-pet pose-still pet-${p.id}` }, photoSticker(url)));
  return h('div', { class: 'pc-art' }, drawing(drawChar(p.id)));
}

export function render(ctx) {
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => ctx.save(), 250); };
  // One hidden picker for all cards: accept="image/*" and no capture attribute, so the phone offers
  // both the photo library and the camera.
  const picker = h('input', { type: 'file', accept: 'image/*', class: 'photo-input', hidden: true, tabindex: '-1', 'aria-hidden': 'true' });
  let pickingFor = null;

  const cards = ctx.data.pets.map((p) => {
    const st = ctx.state.pets[p.id] || { on: true, name: '' };
    ctx.state.pets[p.id] = st;
    const title = h('strong', { class: 'pc-title', text: st.name || p.label });
    const card = h('div', { class: st.on ? 'pet-card' : 'pet-card off', 'data-pet': p.id });
    const sw = h('button', {
      type: 'button', class: 'switch', role: 'switch', 'aria-checked': st.on ? 'true' : 'false', id: `on-${p.id}`,
      onclick: () => {
        st.on = !st.on;
        sw.setAttribute('aria-checked', st.on ? 'true' : 'false');
        card.classList.toggle('off', !st.on);
        ctx.save();
      },
    });
    const input = h('input', {
      type: 'text', class: 'name-input', id: `name-${p.id}`, maxlength: String(NAME_MAX), placeholder: p.label,
      autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'done', value: st.name,
      oninput: () => {
        const v = capName(input.value);
        if (v !== input.value) input.value = v;
        st.name = v.trim();
        title.textContent = st.name || p.label;
        save();
      },
      onchange: () => { clearTimeout(saveTimer); ctx.save(); },
      onkeydown: (e) => { if (e.key === 'Enter') input.blur(); },
    });
    const status = h('p', { class: 'pc-status', role: 'status', 'aria-live': 'polite' });
    const photoRow = h('div', { class: 'pc-photo' });
    let artEl = art(p);

    const refresh = () => {
      const next = art(p);
      artEl.replaceWith(next);
      artEl = next;
      photoRow.replaceChildren(...photoButtons());
    };
    const pick = () => { status.textContent = ''; pickingFor = { id: p.id, status, refresh }; picker.click(); };
    function photoButtons() {
      if (!hasPhoto(p.id)) return [h('button', { type: 'button', class: 'photo-btn add', 'data-act': 'add', onclick: pick }, 'Add photo')];
      return [
        h('button', { type: 'button', class: 'photo-btn change', 'data-act': 'change', onclick: pick }, 'Change photo'),
        h('button', {
          type: 'button', class: 'photo-btn remove', 'data-act': 'remove',
          onclick: () => openSheet([
            h('h2', { id: 'sheet-title', text: 'Remove this photo? The drawing comes back.' }),
            sheetBtn('Remove', async () => {
              try { await removePhoto(p.id); forgetPhoto(p.id); status.textContent = ''; } catch { status.textContent = MESSAGES.save; }
              closeDadPanel();
              refresh();
            }, 'danger'),
            sheetBtn('Cancel', () => closeDadPanel()),
          ]),
        }, 'Remove photo'),
      ];
    }
    photoRow.replaceChildren(...photoButtons());

    card.append(
      artEl,
      h('div', { class: 'pc-body' },
        title,
        h('div', { class: 'pc-row' }, h('label', { for: `on-${p.id}`, text: 'In our family' }), sw),
        h('label', { class: 'pc-name', for: `name-${p.id}`, text: 'Name (optional)' }),
        input,
        photoRow,
        status));
    return card;
  });

  picker.addEventListener('change', async () => {
    const target = pickingFor;
    let file = picker.files && picker.files[0];
    picker.value = ''; // the page keeps no reference to the picked file
    if (!target || !file) return;
    let bitmap;
    try {
      bitmap = await decodePhoto(file); // checks the 20 MB cap first, then decodes the right way up
    } catch (e) {
      target.status.textContent = e && e.code === 'big' ? MESSAGES.big : MESSAGES.open;
      return;
    } finally {
      file = null;
    }
    openLineup(bitmap, {
      onUse: async (view) => {
        try {
          const first = photoCount() === 0;
          const blob = await renderPhoto(bitmap, view); // the new 512x512 JPEG is all that is kept
          await putPhoto(target.id, blob);
          rememberPhoto(target.id, blob);
          if (first) askToKeep();
          target.status.textContent = '';
          target.refresh();
          return true;
        } catch {
          return false;
        }
      },
      onCancel: () => { try { bitmap.close(); } catch { /* ignore */ } },
    });
  });

  return h('main', { class: 'dad-screen family' },
    h('header', { class: 'dad-head' },
      h('button', { type: 'button', class: 'dad-back', onclick: () => { clearTimeout(saveTimer); ctx.save(); ctx.go('#home'); } }, '\u2039 Done'),
      h('h1', { text: 'Family pets' })),
    h('p', { class: 'dad-sub', text: 'Names stay on this phone. The voice never says names.' }),
    h('p', { class: 'dad-sub', text: "Photos stay on this phone. They're never uploaded." }),
    h('p', { class: 'dad-note', text: 'Tip: add Pet Parade to your Home Screen so the phone keeps the photos.' }),
    h('p', { class: 'dad-note', text: 'Pets that are off stay out of the games. Bloop, Berry and Dottie always come to play.' }),
    picker,
    h('div', { class: 'pet-cards' }, cards));
}

export function leave(ctx) {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; ctx.save(); }
}
