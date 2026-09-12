/* ============================================================
   views/habits.js — manage the habit list: order, edit, archive.
   ============================================================ */
import * as S from '../store.js';
import * as St from '../stats.js';
import { I } from '../icons.js';
import { esc, haptic, toast } from '../ui.js';
import { openHabitForm } from './form.js';
import { openHabitDetail } from './detail.js';

const DOW = ['S','M','T','W','T','F','S'];

function scheduleLabel(h){
  if (h.schedule.type === 'daily') return 'Every day';
  if (h.schedule.type === 'weekly') return `${h.schedule.perWeek}× per week`;
  return h.schedule.days.map(d => DOW[d]).join(' ');
}

function row(h, i, n){
  const streak = St.currentStreak(h);
  return `
    <div class="mrow ${h.archived ? 'archived' : ''}" data-habit="${h.id}" style="--hc:var(--c-${h.color})">
      <div class="hrow-badge" style="width:38px;height:38px;font-size:18px" data-open>${esc(h.emoji)}</div>
      <div class="hrow-main" data-open>
        <div class="hrow-name">${esc(h.name)}</div>
        <div class="hrow-meta">
          <span>${esc(scheduleLabel(h))}</span>
          ${h.type === 'count' ? `<span aria-hidden="true">·</span><span>${h.target}${h.unit ? ' ' + esc(h.unit) : ''}</span>` : ''}
          ${streak.n > 0 ? `<span aria-hidden="true">·</span><span class="flame">${I.flame}${streak.n}</span>` : ''}
        </div>
      </div>
      ${h.archived ? `
        <button class="icon-btn" data-unarchive aria-label="Restore ${esc(h.name)}">${I.restore}</button>` : `
        <div style="display:flex;gap:4px">
          <button class="icon-btn" data-move="-1" ${i === 0 ? 'disabled style="opacity:.3"' : ''} aria-label="Move ${esc(h.name)} up">${I.up}</button>
          <button class="icon-btn" data-move="1" ${i === n - 1 ? 'disabled style="opacity:.3"' : ''} aria-label="Move ${esc(h.name)} down">${I.down}</button>
          <button class="icon-btn" data-edit aria-label="Edit ${esc(h.name)}">${I.pencil}</button>
        </div>`}
    </div>`;
}

export function renderHabits(){
  const active = S.activeHabits();
  const archived = S.allHabits().filter(h => h.archived);

  return `
    <div class="wrap view">
      <header class="hdr">
        <div class="hdr-row">
          <div>
            <h1>Habits</h1>
            <p class="sub">${active.length} active${archived.length ? ` · ${archived.length} archived` : ''}</p>
          </div>
          <div class="hdr-actions">
            <button class="icon-btn accent" data-new aria-label="New habit">${I.plus}</button>
          </div>
        </div>
      </header>

      ${active.length ? `
        <div class="stack">${active.map((h, i) => row(h, i, active.length)).join('')}</div>
      ` : `
        <div class="empty card">
          <div class="emoji">📋</div>
          <h3>No habits yet</h3>
          <p>Add your first one and it will show up on the Today screen straight away.</p>
          <button class="btn btn-primary" data-new>${I.plus} Create a habit</button>
        </div>`}

      ${archived.length ? `
        <div class="section-title"><span>Archived</span></div>
        <p class="muted" style="margin:-4px 0 10px">Hidden from Today, history kept.</p>
        <div class="stack">${archived.map((h, i) => row(h, i, archived.length)).join('')}</div>` : ''}

      <div style="height:10px"></div>
    </div>`;
}

export function mountHabits(root, rerender){
  root.querySelectorAll('[data-new]').forEach(b =>
    b.addEventListener('click', () => openHabitForm(null, rerender)));

  root.querySelectorAll('.mrow').forEach(el => {
    const id = el.dataset.habit;

    el.querySelectorAll('[data-open]').forEach(part =>
      part.addEventListener('click', () => openHabitDetail(id, S.todayKey(), rerender)));

    el.querySelector('[data-edit]')?.addEventListener('click', () => openHabitForm(id, rerender));

    el.querySelectorAll('[data-move]').forEach(btn => btn.addEventListener('click', () => {
      S.moveHabit(id, Number(btn.dataset.move));
      haptic(6);
      rerender();
    }));

    el.querySelector('[data-unarchive]')?.addEventListener('click', () => {
      S.setArchived(id, false);
      toast('Habit restored', 'ok');
      rerender();
    });
  });
}
