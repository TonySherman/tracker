/* ============================================================
   ui.js — DOM helpers, toasts, bottom sheets, dialogs.
   ============================================================ */
import { I } from './icons.js';

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape untrusted text before it goes into an innerHTML template. */
export function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

export function haptic(ms = 8){
  try{ navigator.vibrate?.(ms); }catch{}
}

/* ---------------- toast ---------------- */

let toastTimer;
export function toast(message, kind = ''){
  const root = $('#toast-root');
  root.innerHTML = '';
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  const ic = kind === 'ok' ? I.check : kind === 'err' ? I.warn : '';
  el.innerHTML = `${ic}<span>${esc(message)}</span>`;
  root.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 2600);
}

/* ---------------- bottom sheet ---------------- */

let openSheet = null;

/**
 * Open a bottom sheet.
 * @param {{title?:string, body:string, onMount?:(root:HTMLElement, close:Function)=>void}} opts
 */
export function sheet({ title = '', body, onMount }){
  closeSheet(true);

  const root = $('#sheet-root');
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const panel = document.createElement('div');
  panel.className = 'sheet';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  if (title) panel.setAttribute('aria-label', title);

  panel.innerHTML = `
    <div class="sheet-grab"><i></i></div>
    <div class="sheet-inner">
      ${title ? `<div class="sheet-hdr"><h2>${esc(title)}</h2>
        <button class="icon-btn" data-close aria-label="Close">${I.x}</button></div>` : ''}
      ${body}
    </div>`;

  root.append(scrim, panel);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => { scrim.classList.add('in'); panel.classList.add('in'); });

  const close = () => closeSheet();
  openSheet = { scrim, panel, close };

  scrim.addEventListener('click', close);
  panel.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  document.addEventListener('keydown', onKey);

  dragToDismiss(panel, close);
  onMount?.(panel, close);

  // focus the first meaningful control without yanking the keyboard open on mobile
  const first = panel.querySelector('[data-autofocus]');
  if (first) setTimeout(() => first.focus(), 380);

  return close;
}

function onKey(e){ if (e.key === 'Escape') closeSheet(); }

export function closeSheet(immediate = false){
  if (!openSheet) return;
  const { scrim, panel } = openSheet;
  openSheet = null;
  document.removeEventListener('keydown', onKey);
  document.body.style.overflow = '';
  if (immediate){ scrim.remove(); panel.remove(); return; }
  scrim.classList.remove('in');
  panel.classList.remove('in');
  setTimeout(() => { scrim.remove(); panel.remove(); }, 380);
}

/** Drag the grab handle down to dismiss. */
function dragToDismiss(panel, close){
  const grab = panel.querySelector('.sheet-grab');
  let y0 = 0, dy = 0, active = false;

  const start = e => {
    active = true; dy = 0;
    y0 = e.touches ? e.touches[0].clientY : e.clientY;
    panel.style.transition = 'none';
  };
  const move = e => {
    if (!active) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    dy = Math.max(0, y - y0);
    panel.style.transform = `translateY(${dy}px)`;
  };
  const end = () => {
    if (!active) return;
    active = false;
    panel.style.transition = '';
    panel.style.transform = '';
    if (dy > 90) close();
  };

  grab.addEventListener('touchstart', start, { passive: true });
  grab.addEventListener('touchmove', move, { passive: true });
  grab.addEventListener('touchend', end);
  grab.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
}

/* ---------------- confirm ---------------- */

export function confirmSheet({ title, message, confirmLabel = 'Confirm', danger = false }){
  return new Promise(resolve => {
    let settled = false;
    const done = v => { if (!settled){ settled = true; resolve(v); } };

    const close = sheet({
      title,
      body: `
        <p class="muted" style="margin:0 0 20px">${esc(message)}</p>
        <div class="stack">
          <button class="btn btn-block ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${esc(confirmLabel)}</button>
          <button class="btn btn-block btn-ghost" data-close>Cancel</button>
        </div>`,
      onMount(root, closeFn){
        root.querySelector('[data-yes]').addEventListener('click', () => { done(true); closeFn(); });
        root.querySelectorAll('[data-close]').forEach(b =>
          b.addEventListener('click', () => done(false)));
      }
    });
    // dismissing by scrim/drag/escape resolves false once the node is gone
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.sheet')){ observer.disconnect(); done(false); }
    });
    observer.observe($('#sheet-root'), { childList: true });
    void close;
  });
}

/* ---------------- misc ---------------- */

export function pluralise(n, one, many = one + 's'){ return `${n} ${n === 1 ? one : many}`; }

/** Confetti-ish burst from an element's centre. */
export function burst(host, color = '#a78bfa'){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const wrap = document.createElement('div');
  wrap.className = 'burst';
  const palette = [color, '#fbbf24', '#f472b6', '#a3e635'];
  for (let i = 0; i < 10; i++){
    const p = document.createElement('i');
    const a = (Math.PI * 2 * i) / 10 + Math.random();
    const d = 26 + Math.random() * 30;
    p.style.cssText =
      `left:50%;top:50%;background:${palette[i % palette.length]};` +
      `--bx:${Math.cos(a) * d}px;--by:${Math.sin(a) * d}px;animation-delay:${Math.random() * 60}ms`;
    wrap.appendChild(p);
  }
  host.appendChild(wrap);
  setTimeout(() => wrap.remove(), 900);
}
