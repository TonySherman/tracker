/* ============================================================
   views/charts.js — shared SVG-free chart markup (divs + CSS).
   ============================================================ */
import * as St from '../stats.js';
import * as S from '../store.js';
import { esc } from '../ui.js';

const DOW = ['S','M','T','W','T','F','S'];
const DOW_LONG = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Colour ramp for a heatmap cell, tinted with the habit's colour. */
function cellStyle(level, color){
  if (level <= 0) return '';
  const alpha = [0, .22, .42, .68, 1][level];
  return `background:color-mix(in srgb, var(--c-${color}) ${Math.round(alpha * 100)}%, transparent)`;
}

export function heatmapHTML(habit, weeks = 18){
  const color = habit ? habit.color : 'violet';
  const cols = St.heatmap(habit, weeks);

  // a month label sits above the first column of each new month; the leading
  // column is skipped because it is usually a partial month with no room
  let lastMonth = cols.length ? S.parseKey(cols[0][0].key).getMonth() : -1;
  const months = cols.map(col => {
    const m = S.parseKey(col[0].key).getMonth();
    const show = m !== lastMonth;
    lastMonth = m;
    return `<span>${show ? MONTH[m] : ''}</span>`;
  }).join('');

  const body = cols.map(col => `<div class="heat-col">${col.map(c => `
      <div class="heat-cell ${c.scheduled ? '' : 'off'}" data-l="${c.level}"
           style="${cellStyle(c.level, color)}" title="${esc(c.key)}"></div>`).join('')}</div>`).join('');

  // rows follow the user's week-start, so label them from the same offset
  const ws = S.state.settings.weekStart ?? 1;
  const dows = Array.from({ length: 7 }, (_, i) => {
    const d = (ws + i) % 7;
    return `<span>${[1,3,5].includes(d) ? DOW_LONG[d] : ''}</span>`;
  }).join('');

  const legend = [0,1,2,3,4].map(l =>
    `<span class="heat-cell" data-l="${l}" style="${cellStyle(l, color)}"></span>`).join('');

  return `
    <div class="heat-block">
    <div class="heat-wrap">
      <div class="heat-dows">${dows}</div>
      <div class="heat-scroll" data-heat>
        <div class="heat-months">${months}</div>
        <div class="heat">${body}</div>
      </div>
    </div>
    <div class="heat-legend"><span>Less</span>${legend}<span>More</span></div>
    </div>`;
}

export function barsHTML(habit, days = 14){
  const data = St.dayBars(habit, days);
  const color = habit ? `var(--c-${habit.color})` : 'var(--grad)';
  return `<div class="bars">${data.map(d => {
    const h = Math.max(3, Math.round(Math.min(1, d.value) * 88));
    const bg = habit ? `background:${color};opacity:${d.value > 0 ? 0.35 + Math.min(1, d.value) * 0.65 : 0.18}` : '';
    return `<div class="b"><i style="height:${h}px;${bg}"></i><span>${DOW[d.dow]}</span></div>`;
  }).join('')}</div>`;
}

export function statTile(label, value, sub = ''){
  return `<div class="stat"><div class="k">${esc(label)}</div>
    <div class="v">${value}${sub ? ` <small>${esc(sub)}</small>` : ''}</div></div>`;
}

/** Scroll every heatmap to the most recent week. */
export function alignHeatmaps(root){
  root.querySelectorAll('[data-heat]').forEach(el => { el.scrollLeft = el.scrollWidth; });
}
