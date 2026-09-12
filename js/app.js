/* ============================================================
   app.js — boot, routing and the bottom navigation.
   ============================================================ */
import * as S from './store.js';
import { I } from './icons.js';
import { renderToday, mountToday } from './views/today.js';
import { renderHabits, mountHabits } from './views/habits.js';
import { renderStats, mountStats } from './views/statsview.js';
import { renderSettings, mountSettings, applyTheme } from './views/settings.js';

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
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (S.state.settings.theme === 'auto') applyTheme();
});

current = tabFromHash();
render();

// dismiss the splash once the first paint is done
const splash = document.getElementById('splash');
const reveal = () => {
  appEl.hidden = false;
  splash.classList.add('hide');
  setTimeout(() => splash.remove(), 600);
};
const hasData = S.state.habits.length > 0;
setTimeout(reveal, hasData ? 650 : 1200);

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
