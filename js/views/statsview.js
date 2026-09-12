/* ============================================================
   views/statsview.js — the numbers screen.
   ============================================================ */
import * as S from '../store.js';
import * as St from '../stats.js';
import { I } from '../icons.js';
import { esc } from '../ui.js';
import { openHabitDetail } from './detail.js';
import { heatmapHTML, barsHTML, statTile, alignHeatmaps } from './charts.js';

function habitCard(h){
  const cur = St.currentStreak(h);
  const best = St.bestStreak(h);
  const rate = Math.round(St.completionRate(h, 30) * 100);
  const suffix = cur.unit === 'wk' ? 'wk' : 'd';

  return `
    <div class="card" data-habit="${h.id}" style="--hc:var(--c-${h.color});margin-bottom:10px">
      <div class="shead" style="margin-bottom:10px">
        <span class="badge">${esc(h.emoji)}</span>
        <div style="flex:1;min-width:0">
          <div class="nm">${esc(h.name)}</div>
          <div class="sb">${rate}% in the last 30 days</div>
        </div>
        <div style="text-align:right;flex:0 0 auto">
          <div style="font-size:21px;font-weight:800;letter-spacing:-.03em;color:var(--hc);font-variant-numeric:tabular-nums">${cur.n}<small style="font-size:12px">${suffix}</small></div>
          <div style="font-size:10.5px;color:var(--text-3);font-weight:650;letter-spacing:.04em">BEST ${best.n}${suffix}</div>
        </div>
      </div>
      ${heatmapHTML(h, 18)}
    </div>`;
}

export function renderStats(){
  const habits = S.activeHabits();
  const o = St.overview();

  if (!habits.length){
    return `
      <div class="wrap view">
        <header class="hdr"><div class="hdr-row"><div><h1>Stats</h1><p class="sub">Your consistency, visualised</p></div></div></header>
        <div class="empty card">
          <div class="emoji">📊</div>
          <h3>Nothing to measure yet</h3>
          <p>Create a habit and check in for a few days — streaks, rates and your year-at-a-glance grid will appear here.</p>
        </div>
      </div>`;
  }

  return `
    <div class="wrap view">
      <header class="hdr"><div class="hdr-row"><div><h1>Stats</h1><p class="sub">Your consistency, visualised</p></div></div></header>

      <div class="statgrid">
        ${statTile('Longest active streak', o.bestCurrentStreak, o.bestCurrentStreak === 1 ? 'day' : 'days')}
        ${statTile('Perfect days', o.perfectDays, 'of 30')}
        ${statTile('30-day rate', Math.round(o.rate30 * 100) + '%', '')}
        ${statTile('Check-ins', o.totalCompletions.toLocaleString(), 'all time')}
      </div>

      <div class="section-title"><span>Everything, last 14 days</span></div>
      <div class="card">${barsHTML(null, 14)}</div>

      <div class="section-title"><span>All habits</span></div>
      <div class="card" style="margin-bottom:10px">${heatmapHTML(null, 18)}</div>

      <div class="section-title"><span>Habit by habit</span></div>
      ${habits.map(habitCard).join('')}
      <div style="height:8px"></div>
    </div>`;
}

export function mountStats(root, rerender){
  alignHeatmaps(root);
  root.querySelectorAll('[data-habit]').forEach(card =>
    card.addEventListener('click', () => openHabitDetail(card.dataset.habit, S.todayKey(), rerender)));
}
