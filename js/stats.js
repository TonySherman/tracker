/* ============================================================
   stats.js — streaks, rates and chart data.
   All calculations are schedule-aware: a habit you only do on
   Mon/Wed/Fri doesn't lose its streak on a Tuesday.
   ============================================================ */
import { state, getValue, isDone, isScheduled, todayKey, addDays, parseKey, dowOf, activeHabits } from './store.js';

const MAX_LOOKBACK = 3650; // 10 years of safety on every backward walk

/** Ratio of a day's target that was met (0..1+). */
export function ratio(habit, dateKey){
  const v = getValue(habit.id, dateKey);
  const target = habit.type === 'count' ? habit.target : 1;
  return target > 0 ? v / target : 0;
}

/** Earliest date worth scanning for a habit. */
function originOf(habit){
  const days = Object.keys(state.log[habit.id] || {});
  let earliest = habit.createdAt || todayKey();
  for (const d of days) if (d < earliest) earliest = d;
  return earliest;
}

/* ---------------- streaks ---------------- */

function weekStartOf(dateKey){
  const ws = state.settings.weekStart ?? 1;
  const diff = (dowOf(dateKey) - ws + 7) % 7;
  return addDays(dateKey, -diff);
}

/** Completions inside the 7 days beginning at `startKey`. */
function weekCount(habit, startKey){
  let n = 0;
  for (let i = 0; i < 7; i++) if (isDone(habit, addDays(startKey, i))) n++;
  return n;
}

/** Streak in weeks for "N times per week" habits. The week in progress never breaks it. */
function weeklyStreak(habit){
  const origin = weekStartOf(originOf(habit));
  let week = weekStartOf(todayKey());
  let n = 0;

  if (weekCount(habit, week) >= habit.schedule.perWeek) n++;
  week = addDays(week, -7);

  for (let i = 0; i < 520 && week >= origin; i++){
    if (weekCount(habit, week) >= habit.schedule.perWeek){ n++; week = addDays(week, -7); }
    else break;
  }
  return n;
}

function weeklyBest(habit){
  const origin = weekStartOf(originOf(habit));
  const end = weekStartOf(todayKey());
  let best = 0, run = 0;
  for (let w = origin; w <= end; w = addDays(w, 7)){
    if (weekCount(habit, w) >= habit.schedule.perWeek){ run++; best = Math.max(best, run); }
    else if (w !== end) run = 0;   // the current week being unfinished isn't a miss
  }
  return best;
}

/** Current streak. Today being unfinished doesn't break it — the day isn't over. */
export function currentStreak(habit){
  if (habit.schedule.type === 'weekly') return { n: weeklyStreak(habit), unit: 'wk' };

  let key = todayKey();
  if (isScheduled(habit, key) && !isDone(habit, key)) key = addDays(key, -1);

  const origin = originOf(habit);
  let n = 0;
  for (let i = 0; i < MAX_LOOKBACK && key >= origin; i++){
    if (!isScheduled(habit, key)){ key = addDays(key, -1); continue; }
    if (isDone(habit, key)){ n++; key = addDays(key, -1); }
    else break;
  }
  return { n, unit: 'day' };
}

/** Longest streak ever recorded. */
export function bestStreak(habit){
  if (habit.schedule.type === 'weekly') return { n: weeklyBest(habit), unit: 'wk' };

  const today = todayKey();
  let key = originOf(habit);
  let best = 0, run = 0;

  for (let i = 0; i < MAX_LOOKBACK && key <= today; i++){
    if (isScheduled(habit, key)){
      if (isDone(habit, key)){ run++; if (run > best) best = run; }
      else if (key !== today) run = 0;  // an unfinished today is not yet a miss
    }
    key = addDays(key, 1);
  }
  return { n: Math.max(best, currentStreak(habit).n), unit: 'day' };
}

/* ---------------- rates & totals ---------------- */

/** Completion rate over the trailing `days` window, counting only scheduled days. */
export function completionRate(habit, days = 30){
  const today = todayKey();
  const origin = originOf(habit);
  let due = 0, done = 0;

  for (let i = 0; i < days; i++){
    const key = addDays(today, -i);
    if (key < origin) break;
    if (habit.schedule.type === 'weekly'){ due++; if (isDone(habit, key)) done++; continue; }
    if (!isScheduled(habit, key)) continue;
    due++;
    if (isDone(habit, key)) done++;
  }
  if (habit.schedule.type === 'weekly' && due > 0){
    // for flexible habits, measure against the weekly quota rather than every day
    const quota = Math.max(1, Math.round(due * habit.schedule.perWeek / 7));
    return Math.min(1, done / quota);
  }
  return due ? done / due : 0;
}

export function totalDone(habit){
  const days = state.log[habit.id] || {};
  let n = 0;
  for (const key of Object.keys(days)) if (isDone(habit, key)) n++;
  return n;
}

/** Sum of logged units — meaningful for counter habits ("340 minutes"). */
export function totalUnits(habit){
  const days = state.log[habit.id] || {};
  let n = 0;
  for (const v of Object.values(days)) n += v;
  return n;
}

/* ---------------- day summary ---------------- */

/** How the given day went across every active, scheduled habit. */
export function daySummary(dateKey){
  const habits = activeHabits().filter(h => isScheduled(h, dateKey) && h.createdAt <= dateKey);
  const done = habits.filter(h => isDone(h, dateKey)).length;
  return { total: habits.length, done, pct: habits.length ? done / habits.length : 0 };
}

/* ---------------- charts ---------------- */

/** 0–4 intensity level for a heatmap cell. */
function levelFor(r){
  if (r <= 0) return 0;
  if (r < 0.34) return 1;
  if (r < 0.67) return 2;
  if (r < 1) return 3;
  return 4;
}

/**
 * Week-columns of day cells, oldest first, ending with the current week.
 * Pass `null` as habit to summarise every active habit.
 */
export function heatmap(habit, weeks = 18){
  const ws = state.settings.weekStart ?? 1;
  const today = todayKey();
  const thisWeekStart = weekStartOf(today);
  const start = addDays(thisWeekStart, -7 * (weeks - 1));
  const cols = [];

  for (let w = 0; w < weeks; w++){
    const col = [];
    for (let d = 0; d < 7; d++){
      const key = addDays(start, w * 7 + d);
      const future = key > today;
      let r = 0, scheduled = true;
      if (habit){
        scheduled = isScheduled(habit, key) && habit.createdAt <= key;
        r = scheduled && !future ? ratio(habit, key) : 0;
      }else{
        const s = daySummary(key);
        scheduled = s.total > 0;
        r = future ? 0 : s.pct;
      }
      col.push({ key, level: future ? 0 : levelFor(r), scheduled, future, dow: (ws + d) % 7 });
    }
    cols.push(col);
  }
  return cols;
}

/** Trailing-N-day bars, oldest first. */
export function dayBars(habit, days = 14){
  const today = todayKey();
  const out = [];
  for (let i = days - 1; i >= 0; i--){
    const key = addDays(today, -i);
    const r = habit ? Math.min(1.4, ratio(habit, key)) : daySummary(key).pct;
    out.push({ key, value: r, dow: dowOf(key) });
  }
  return out;
}

/** Aggregate headline numbers for the stats screen. */
export function overview(){
  const habits = activeHabits();
  const today = todayKey();
  const best = habits.reduce((m, h) => Math.max(m, currentStreak(h).n), 0);
  const totals = habits.reduce((n, h) => n + totalDone(h), 0);
  let perfectDays = 0;
  for (let i = 0; i < 30; i++){
    const s = daySummary(addDays(today, -i));
    if (s.total > 0 && s.done === s.total) perfectDays++;
  }
  const rate = habits.length
    ? habits.reduce((n, h) => n + completionRate(h, 30), 0) / habits.length
    : 0;
  return { habitCount: habits.length, bestCurrentStreak: best, totalCompletions: totals, perfectDays, rate30: rate };
}
