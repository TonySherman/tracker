/* ============================================================
   app.js — boot, routing and the bottom navigation.
   ============================================================ */
import * as S from './store.js';
import { I } from './icons.js';
import { renderToday, mountToday } from './views/today.js';
import { renderHabits, mountHabits } from './views/habits.js';
import { renderStats, mountStats } from './views/statsview.js';
import { renderSettings, mountSettings, applyTheme } from './views/settings.js';
import { toast, sheet } from './ui.js';
import { openHabitForm } from './views/form.js';

const TABS = [
  { id: 'today',    label: 'Today',  icon: 'today', render: renderToday,    mount: mountToday },
  { id: 'habits',   label: 'Habits', icon: 'list',  render: renderHabits,   mount: mountHabits },
  { id: 'stats',    label: 'Stats',  icon: 'chart', render: renderStats,    mount: mountStats },
  { id: 'settings', label: 'You',    icon: 'cog',   render: renderSettings, mount: mountSettings }
];

const appEl = document.getElementById('app');
let current = 'today';

function tabFromHash(){
  const id = location.hash.replace('#/', '');
  return TABS.some(t => t.id === id) ? id : 'today';
}

function navHTML(){
  return `
    <nav class="nav" aria-label="Main">
      <div class="nav-inner">
        ${TABS.map(t => `
          <button class="nav-btn ${t.id === current ? 'active' : ''}" data-tab="${t.id}"
                  aria-current="${t.id === current ? 'page' : 'false'}">
            ${I[t.icon]}<span>${t.label}</span><span class="dot"></span>
          </button>`).join('')}
      </div>
    </nav>`;
}

export function render(){
  const tab = TABS.find(t => t.id === current) || TABS[0];
  const scroll = window.scrollY;

  appEl.innerHTML = `<div id="screen">${tab.render()}</div>${navHTML()}`;

  const screen = document.getElementById('screen');
  tab.mount?.(screen, render);

  appEl.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.tab;
    if (id === current){ window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    current = id;
    location.hash = `#/${id}`;
    window.scrollTo(0, 0);
    render();
  }));

  // keep the scroll position across in-tab re-renders (ticking a habit, etc.)
  if (appEl.dataset.lastTab === current) window.scrollTo(0, scroll);
  appEl.dataset.lastTab = current;
}

window.addEventListener('hashchange', () => {
  const id = tabFromHash();
  if (id !== current){ current = id; render(); }
});

/* ---------------- boot ---------------- */

S.load();
applyTheme();

document.addEventListener('streak:saveerror', () =>
  toast('Couldn’t save — storage is full or blocked', 'err'));

if (!S.storageWorks()){
  setTimeout(() => toast('This browser is blocking storage, so nothing will be saved', 'err'), 1800);
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (S.state.settings.theme === 'auto') applyTheme();
});

current = tabFromHash();
// unhide before the first render: layout maths (centring the date strip)
// reads zero widths on a hidden subtree. The splash overlays it either way.
appEl.hidden = false;
render();

// dismiss the splash once the first paint is done
const splash = document.getElementById('splash');
const reveal = () => {
  splash.classList.add('hide');
  setTimeout(() => splash.remove(), 600);
};
const hasData = S.state.habits.length > 0;
// returning users shouldn't sit through a title card every morning
setTimeout(() => { reveal(); if (!hasData) maybeWelcome(); }, hasData ? 380 : 1100);

/** One-time welcome, shown only before the first habit exists. */
function maybeWelcome(){
  if (S.state.settings.onboarded || S.state.habits.length) return;
  S.setSetting('onboarded', true);

  const point = (emoji, title, text) => `
    <div style="display:flex;gap:13px;align-items:flex-start;margin-bottom:16px">
      <span style="font-size:22px;line-height:1.2;flex:0 0 auto">${emoji}</span>
      <div><b style="display:block;font-size:15px;font-weight:700;letter-spacing:-.015em">${title}</b>
      <span style="display:block;color:var(--text-2);font-size:13.5px;margin-top:2px">${text}</span></div>
    </div>`;

  sheet({
    title: 'Welcome to Streak',
    body: `
      <p class="muted" style="margin:0 0 20px">Three things worth knowing before you start.</p>
      ${point('🔥', 'Streaks are forgiving', 'Only days a habit is actually scheduled can break a streak — and today never breaks one until the day is over.')}
      ${point('🔒', 'Everything stays on this device', 'No account, no server. Your history lives in this browser and nowhere else.')}
      ${point('📤', 'Back it up now and then', 'Settings → Export gives you one file that carries everything to a new phone.')}
      <div class="stack" style="margin-top:22px">
        <button class="btn btn-primary btn-block" data-start>${I.plus} Create my first habit</button>
        <button class="btn btn-block btn-ghost" data-close>I'll look around first</button>
      </div>
      <div style="height:6px"></div>`,
    onMount(root, close){
      root.querySelector('[data-start]').addEventListener('click', () => {
        close();
        setTimeout(() => openHabitForm(null, render), 340);
      });
    }
  });
}

// a new day while the app sits open should refresh the Today screen
let dayStamp = S.todayKey();
setInterval(() => {
  const now = S.todayKey();
  if (now !== dayStamp){ dayStamp = now; render(); }
}, 60_000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible'){
    const now = S.todayKey();
    if (now !== dayStamp){ dayStamp = now; }
    render();
  }
});

if ('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
