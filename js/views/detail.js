/* ============================================================
   views/detail.js — a single habit's numbers, in a sheet.
   ============================================================ */
import * as S from '../store.js';
import * as St from '../stats.js';
import { I } from '../icons.js';
import { sheet, esc, haptic } from '../ui.js';
import { openHabitForm } from './form.js';
import { heatmapHTML, barsHTML, statTile, alignHeatmaps } from './charts.js';

const DOW_FULL = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function bodyHTML(h, dateKey){
  const cur = St.currentStreak(h);
  const best = St.bestStreak(h);
  const rate = Math.round(St.completionRate(h, 30) * 100);
  const total = St.totalDone(h);
  const units = St.totalUnits(h);
  const val = S.getValue(h.id, dateKey);
  const when = dateKey === S.todayKey() ? 'today' : dateKey;

  let repeat = 'Every day';
  if (h.schedule.type === 'days') repeat = h.schedule.days.map(d => DOW_FULL[d]).join(', ');
  if (h.schedule.type === 'weekly') repeat = `${h.schedule.perWeek}× per week`;

  const unitWord = (n, u) => u === 'wk' ? (n === 1 ? 'week' : 'weeks') : (n === 1 ? 'day' : 'days');

  return `
    <div class="shead" style="--hc:var(--c-${h.color})">
      <span class="badge">${esc(h.emoji)}</span>
      <div>
        <div class="nm">${esc(h.name)}</div>
        <div class="sb">${esc(repeat)}${h.type === 'count' ? ` · ${h.target}${h.unit ? ' ' + esc(h.unit) : ''} a day` : ''}</div>
      </div>
    </div>

    ${h.note ? `<p class="muted" style="margin:-4px 0 16px">“${esc(h.note)}”</p>` : ''}

    <div class="statgrid">
      ${statTile('Current streak', cur.n, unitWord(cur.n, cur.unit))}
      ${statTile('Best streak', best.n, unitWord(best.n, best.unit))}
      ${statTile('Last 30 days', rate + '%', 'done')}
      ${statTile('All time', total, total === 1 ? 'day' : 'days')}
    </div>

    ${h.type === 'count' && units > 0 ? `
      <div class="card center" style="margin-top:10px">
        <div style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-3)">Total logged</div>
        <div style="font-size:27px;font-weight:800;letter-spacing:-.035em;margin-top:4px">${units.toLocaleString()}
          <small style="font-size:14px;color:var(--text-2);font-weight:650">${esc(h.unit || 'units')}</small></div>
      </div>` : ''}

    <div class="section-title"><span>Log for ${esc(when)}</span></div>
    <div class="card" style="--hc:var(--c-${h.color})">
      ${h.type === 'count' ? `
        <div class="spread">
          <button class="btn" data-q="-5" aria-label="Minus five">−5</button>
          <button class="btn" data-q="-1" aria-label="Minus one">−1</button>
          <span style="font-size:22px;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums">${val}</span>
          <button class="btn" data-q="1" aria-label="Plus one">+1</button>
          <button class="btn" data-q="5" aria-label="Plus five">+5</button>
        </div>
        <button class="btn btn-block" style="margin-top:10px" data-q="goal">${I.target} Set to goal (${h.target}${h.unit ? ' ' + esc(h.unit) : ''})</button>
      ` : `
        <button class="btn btn-block ${val ? '' : 'btn-primary'}" data-q="toggle">
          ${val ? I.x + ' Mark not done' : I.check + ' Mark done'}
        </button>`}
    </div>

    <div class="section-title"><span>Last 14 days</span></div>
    <div class="card">${barsHTML(h, 14)}</div>

    <div class="section-title"><span>Six months</span></div>
    <div class="card">${heatmapHTML(h, 26)}</div>

    <div class="stack" style="margin-top:20px">
      <button class="btn btn-block" data-edit>${I.pencil} Edit habit</button>
    </div>
    <div style="height:6px"></div>`;
}

export function openHabitDetail(habitId, dateKey = S.todayKey(), onChange){
  const habit = S.getHabit(habitId);
  if (!habit) return;

  sheet({
    title: '',
    body: bodyHTML(habit, dateKey),
    onMount(root, close){
      const inner = root.querySelector('.sheet-inner');

      const wire = () => {
        alignHeatmaps(inner);

        inner.querySelectorAll('[data-q]').forEach(btn => btn.addEventListener('click', () => {
          const a = btn.dataset.q;
          const h = S.getHabit(habitId);
          if (a === 'toggle') S.toggle(h.id, dateKey);
          else if (a === 'goal') S.setValue(h.id, dateKey, h.target);
          else S.bump(h.id, dateKey, Number(a));
          haptic(10);
          onChange?.();
          const top = inner.scrollTop;
          inner.innerHTML = bodyHTML(S.getHabit(habitId), dateKey);
          inner.scrollTop = top;
          wire();
        }));

        inner.querySelector('[data-edit]')?.addEventListener('click', () => {
          close();
          setTimeout(() => openHabitForm(habitId, onChange), 340);
        });
      };

      wire();
    }
  });
}
