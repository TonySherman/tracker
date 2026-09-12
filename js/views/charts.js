/* ============================================================
   views/charts.js — shared SVG-free chart markup (divs + CSS).
   ============================================================ */
import * as St from '../stats.js';
import * as S from '../store.js';
import { esc } from '../ui.js';

const DOW = ['S','M','T','W','T','F','S'];
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
  const body = cols.map(col => `<div class="heat-col">${col.map(c => `
      <div class="heat-cell ${c.scheduled ? '' : 'off'}" data-l="${c.level}"
           style="${cellStyle(c.level, color)}"
           title="${esc(c.key)}"></div>`).join('')}</div>`).join('');

  const legend = [0,1,2,3,4].map(l =>
    `<span class="heat-cell" data-l="${l}" style="${cellStyle(l, color)}"></span>`).join('');

  return `
    <div class="heat" data-heat>${body}</div>
    <div class="heat-legend"><span>Less</span>${legend}<span>More</span></div>`;
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

export function monthLabel(key){
  const d = S.parseKey(key);
  return `${MONTH[d.getMonth()]} ${d.getFullYear()}`;
}
