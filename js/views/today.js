/* ============================================================
   views/today.js — the day screen: pick a date, tick things off.
   ============================================================ */
import * as S from '../store.js';
import * as St from '../stats.js';
import { I } from '../icons.js';
import { esc, haptic, burst, toast, celebrate } from '../ui.js';
import { openHabitDetail } from './detail.js';
import { openHabitForm } from './form.js';

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];

let selected = S.todayKey();

export function setSelectedDate(key){ selected = key; }

function niceDate(key){
  const today = S.todayKey();
  if (key === today) return 'Today';
  if (key === S.addDays(today, -1)) return 'Yesterday';
  if (key === S.addDays(today, 1)) return 'Tomorrow';
  const d = S.parseKey(key);
  return `${DOW[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()].slice(0, 3)}`;
}

function greeting(){
  const h = new Date().getHours();
  if (h < 5)  return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/* ---------------- pieces ---------------- */

function dateStrip(){
  const today = S.todayKey();
  const cells = [];
  for (let i = 20; i >= 0; i--){
    const key = S.addDays(today, -i);
    const d = S.parseKey(key);
    const sum = St.daySummary(key);
    const pct = Math.round(sum.pct * 100);
    cells.push(`
      <button class="dcell ${key === today ? 'today' : ''} ${key === selected ? 'sel' : ''}"
              data-date="${key}" aria-pressed="${key === selected}"
              aria-label="${esc(niceDate(key))}, ${sum.done} of ${sum.total} done">
        <span class="dow">${DOW[d.getDay()][0]}${DOW[d.getDay()][1]}</span>
        <span class="dnum">${d.getDate()}</span>
        <span class="dbar"><i style="width:${pct}%"></i></span>
      </button>`);
  }
  return `<div class="datestrip" id="datestrip">${cells.join('')}</div>`;
}

function summaryCard(){
  const sum = St.daySummary(selected);
  const pct = Math.round(sum.pct * 100);
  const R = 30, C = 2 * Math.PI * R;
  const off = C * (1 - sum.pct);

  let line;
  if (sum.total === 0) line = 'Nothing scheduled for this day.';
  else if (sum.done === sum.total) line = selected === S.todayKey() ? 'Every habit done. Beautiful.' : 'A clean sweep.';
  else if (sum.done === 0) line = `${sum.total} habit${sum.total === 1 ? '' : 's'} waiting for you.`;
  else line = `${sum.total - sum.done} to go — keep it rolling.`;

  return `
    <div class="card daysum">
      <div class="ring">
        <svg viewBox="0 0 70 70">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="70" y2="70" gradientUnits="userSpaceOnUse">
              <stop stop-color="#a78bfa"/><stop offset=".55" stop-color="#f472b6"/><stop offset="1" stop-color="#fb923c"/>
            </linearGradient>
          </defs>
          <circle class="track" cx="35" cy="35" r="${R}" fill="none" stroke-width="7"/>
          <circle class="prog" cx="35" cy="35" r="${R}" fill="none" stroke-width="7"
                  stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
        </svg>
        <span class="lbl">${pct}%</span>
      </div>
      <div class="daysum-txt">
        <h2>${sum.done} of ${sum.total} done</h2>
        <p>${esc(line)}</p>
      </div>
    </div>`;
}

/** Habits with a live streak that today could still break. */
function atRisk(){
  if (selected !== S.todayKey()) return [];
  return S.activeHabits()
    .filter(h => S.isScheduled(h, selected) && !S.isDone(h, selected) && h.createdAt <= selected)
    .map(h => ({ h, streak: St.currentStreak(h) }))
    .filter(x => x.streak.n >= 2 && x.streak.unit === 'day')
    .sort((a, b) => b.streak.n - a.streak.n);
}

function riskBanner(){
  const risky = atRisk();
  if (!risky.length) return '';
  const names = risky.slice(0, 3).map(x => x.h.name);
  const rest = risky.length - names.length;
  const list = names.join(', ') + (rest > 0 ? ` +${rest} more` : '');
  const top = risky[0].streak.n;
  return `
    <div class="risk">
      <span class="fl">${I.flame}</span>
      <div>
        <b>${risky.length === 1 ? `A ${top}-day streak is on the line` : `${risky.length} streaks on the line`}</b>
        <span>${esc(list)}</span>
      </div>
    </div>`;
}

function habitRow(h){
  const val = S.getValue(h.id, selected);
  const done = S.isDone(h, selected);
  const streak = St.currentStreak(h);
  const isCount = h.type === 'count';
  const pct = isCount ? Math.min(100, Math.round((val / h.target) * 100)) : 0;

  const meta = [];
  if (streak.n > 0) meta.push(`<span class="flame">${I.flame}${streak.n}${streak.unit === 'wk' ? 'w' : ''}</span>`);
  if (h.schedule.type === 'days') meta.push(esc(h.schedule.days.map(d => DOW[d][0]).join('')));
  if (h.schedule.type === 'weekly') meta.push(`${h.schedule.perWeek}× / week`);
  // counters already show "/ target unit" in the stepper — don't say it twice

  const control = isCount ? `
    <div class="hcount">
      <button class="stepper" data-step="-1" aria-label="Decrease ${esc(h.name)}">${I.minus}</button>
      <span class="val">${val}<small>/ ${h.target}${h.unit ? ' ' + esc(h.unit) : ''}</small></span>
      <button class="stepper" data-step="1" aria-label="Increase ${esc(h.name)}">${I.plus}</button>
    </div>` : `
    <button class="hcheck" data-toggle aria-pressed="${done}" aria-label="Mark ${esc(h.name)} ${done ? 'not done' : 'done'}">${I.check}</button>`;

  return `
    <div class="hrow ${done ? 'done' : ''}" data-habit="${h.id}" style="--hc:var(--c-${h.color})">
      <div class="hrow-badge" data-open>${esc(h.emoji)}</div>
      <div class="hrow-main" data-open>
        <div class="hrow-name">${esc(h.name)}</div>
        ${meta.length ? `<div class="hrow-meta">${meta.join('<span aria-hidden="true">·</span>')}</div>` : ''}
        ${isCount ? `<div class="hrow-prog"><i style="width:${pct}%"></i></div>` : ''}
      </div>
      ${control}
    </div>`;
}

/* ---------------- view ---------------- */

export function renderToday(){
  const all = S.activeHabits().filter(h => h.createdAt <= selected);
  const due = all.filter(h => S.isScheduled(h, selected));
  const off = all.filter(h => !S.isScheduled(h, selected));
  const isToday = selected === S.todayKey();
  const d = S.parseKey(selected);

  if (S.activeHabits().length === 0){
    return `
      <div class="wrap view">
        ${header(isToday, d)}
        <div class="empty card">
          <div class="emoji">🌱</div>
          <h3>Let's plant the first one</h3>
          <p>Pick something small and repeatable — ten minutes of guitar, one chapter, a walk. Consistency beats intensity.</p>
          <button class="btn btn-primary" data-new>${I.plus} Create a habit</button>
        </div>
      </div>`;
  }

  return `
    <div class="wrap view">
      ${header(isToday, d)}
      ${dateStrip()}
      ${summaryCard()}
      ${riskBanner()}
      ${due.length ? `
        <div class="section-title"><span>${isToday ? 'Today' : niceDate(selected)}</span><span>${due.filter(h => S.isDone(h, selected)).length}/${due.length}</span></div>
        <div class="habits">${due.map(habitRow).join('')}</div>` : `
        <div class="empty card" style="padding:34px 20px">
          <div class="emoji">🌤️</div>
          <h3>Rest day</h3>
          <p>Nothing is scheduled. Enjoy it — or log one of the habits below anyway.</p>
        </div>`}
      ${off.length ? `
        <div class="section-title"><span>Not scheduled</span></div>
        <div class="habits">${off.map(habitRow).join('')}</div>` : ''}
      <div style="height:8px"></div>
    </div>`;
}

function header(isToday, d){
  return `
    <header class="hdr">
      <div class="hdr-row">
        <div>
          <h1>${isToday ? greeting() : niceDate(selected)}</h1>
          <p class="sub">${DOW[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}</p>
        </div>
        <div class="hdr-actions">
          <button class="icon-btn accent" data-new aria-label="New habit">${I.plus}</button>
        </div>
      </div>
    </header>`;
}

/** Wire up interactions after the view is in the DOM. */
export function mountToday(root, rerender){
  root.querySelectorAll('[data-new]').forEach(b =>
    b.addEventListener('click', () => openHabitForm(null)));

  const strip = root.querySelector('#datestrip');
  if (strip){
    // centre the selected day; rAF so it runs after first layout, not before
    const centre = () => {
      const sel = strip.querySelector('.dcell.sel');
      strip.scrollLeft = sel
        ? sel.offsetLeft - strip.clientWidth / 2 + sel.offsetWidth / 2
        : strip.scrollWidth;
    };
    centre();
    requestAnimationFrame(centre);
    strip.addEventListener('click', e => {
      const cell = e.target.closest('.dcell');
      if (!cell) return;
      if (cell.dataset.date > S.todayKey()) return;
      selected = cell.dataset.date;
      haptic(6);
      rerender();
    });
  }

  // swipe left/right anywhere on the page body to step through days
  let sx = 0, sy = 0, tracking = false;
  root.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    if (e.target.closest('.datestrip, .heat-scroll, .bars')) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
  }, { passive: true });
  root.addEventListener('touchend', e => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
    const next = S.addDays(selected, dx < 0 ? 1 : -1);
    if (next > S.todayKey()) return;
    selected = next;
    haptic(8);
    rerender();
  }, { passive: true });

  root.querySelectorAll('.hrow').forEach(row => {
    const habit = S.getHabit(row.dataset.habit);
    if (!habit) return;

    row.querySelector('[data-toggle]')?.addEventListener('click', e => {
      e.stopPropagation();
      const nowDone = S.toggle(habit.id, selected) > 0;
      haptic(nowDone ? 14 : 6);
      e.currentTarget.classList.add('pop');
      if (nowDone){
        burst(row, getComputedStyle(row).getPropertyValue('--hc').trim() || '#a78bfa');
        checkPerfectDay();
      }
      setTimeout(rerender, nowDone ? 300 : 120);
    });

    row.querySelectorAll('[data-step]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const step = Number(btn.dataset.step);
        const before = S.isDone(habit, selected);
        const stepSize = habit.target >= 30 ? 5 : 1;
        S.bump(habit.id, selected, step * stepSize);
        haptic(6);
        const after = S.isDone(habit, selected);
        if (!before && after){
          haptic(16);
          burst(row, getComputedStyle(row).getPropertyValue('--hc').trim() || '#a78bfa');
          checkPerfectDay();
          setTimeout(rerender, 300);
        }else{
          rerender();
        }
      });
    });

    row.querySelectorAll('[data-open]').forEach(part =>
      part.addEventListener('click', () => openHabitDetail(habit.id, selected)));
  });
}

/** Fire the celebration exactly once, on the check-in that clears the day. */
function checkPerfectDay(){
  const sum = St.daySummary(selected);
  if (sum.total < 1 || sum.done !== sum.total) return;
  celebrate();
  haptic(30);
  toast(sum.total === 1 ? 'Done for the day 🎉' : `Perfect day — all ${sum.total} done 🎉`, 'ok');
}

export function currentDate(){ return selected; }
