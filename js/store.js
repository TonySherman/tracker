/* ============================================================
   store.js — persistence, schema and all data mutations.
   Everything lives in localStorage under one key; the whole
   document is the export format too, so backup/restore is free.
   ============================================================ */

export const KEY = 'streak.data.v1';
export const SCHEMA = 1;

export const COLORS = ['violet','pink','orange','amber','lime','green','cyan','blue','rose','indigo'];

export const EMOJIS = [
  '🎸','🎹','🎻','🥁','🎤','🎨','✍️','📚','🧠','💻','🗣️','🧮',
  '🏃','🏋️','🧘','🚴','🏊','⚽','🥗','💧','🍎','😴','☀️','🌙',
  '🧹','💊','🪥','🧴','🧺','💰','📝','📵','🙏','❤️','🐶','🌱'
];

/** Today's date as a local YYYY-MM-DD key (never UTC — that shifts the day). */
export function todayKey(d = new Date()){
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key){
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n){
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

export function dowOf(key){ return parseKey(key).getDay(); }

const uid = () => 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function blank(){
  return {
    v: SCHEMA,
    habits: [],
    log: {},
    settings: { theme: 'dark', weekStart: 1, onboarded: false },
    createdAt: new Date().toISOString()
  };
}

/* ---------------- state + subscriptions ---------------- */

export let state = blank();
const listeners = new Set();

export function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
function emit(){ listeners.forEach(fn => fn(state)); }

export function save(){
  try{
    localStorage.setItem(KEY, JSON.stringify(state));
  }catch(err){
    console.error('Streak: save failed', err);
    // surfaced by app.js — silent data loss is the worst failure mode here
    document.dispatchEvent(new CustomEvent('streak:saveerror', { detail: err }));
    return false;
  }
  return true;
}

/** Can this browser actually persist anything? (private windows sometimes can't.) */
export function storageWorks(){
  try{
    localStorage.setItem('streak.probe', '1');
    localStorage.removeItem('streak.probe');
    return true;
  }catch{ return false; }
}

export function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if (raw) state = migrate(JSON.parse(raw));
  }catch(err){
    console.error('Streak: could not read saved data', err);
    state = blank();
  }
  return state;
}

/** Normalises anything we read or import into the current schema. */
export function migrate(data){
  const base = blank();
  if (!data || typeof data !== 'object') return base;

  const out = { ...base, ...data, v: SCHEMA };
  out.settings = { ...base.settings, ...(data.settings || {}) };
  out.habits = Array.isArray(data.habits) ? data.habits.map(normHabit).filter(Boolean) : [];
  out.log = (data.log && typeof data.log === 'object') ? data.log : {};

  // drop log entries for habits that no longer exist, and coerce values
  const ids = new Set(out.habits.map(h => h.id));
  for (const hid of Object.keys(out.log)){
    if (!ids.has(hid)){ delete out.log[hid]; continue; }
    const days = out.log[hid];
    for (const dk of Object.keys(days)){
      const n = Number(days[dk]);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dk) || !Number.isFinite(n) || n <= 0) delete days[dk];
      else days[dk] = n;
    }
  }
  out.habits.forEach((h, i) => { h.order = i; });
  return out;
}

function normHabit(h){
  if (!h || typeof h !== 'object' || !h.name) return null;
  const sch = h.schedule && typeof h.schedule === 'object' ? h.schedule : {};
  let days = Array.isArray(sch.days) ? sch.days.map(Number).filter(d => d >= 0 && d <= 6) : [1,2,3,4,5];
  if (!days.length) days = [1,2,3,4,5];
  return {
    id: typeof h.id === 'string' && h.id ? h.id : uid(),
    name: String(h.name).slice(0, 80),
    emoji: typeof h.emoji === 'string' && h.emoji ? h.emoji : '✨',
    color: COLORS.includes(h.color) ? h.color : 'violet',
    type: h.type === 'count' ? 'count' : 'check',
    target: Math.max(1, Math.round(Number(h.target) || 1)),
    unit: typeof h.unit === 'string' ? h.unit.slice(0, 12) : '',
    schedule: {
      type: ['daily','days','weekly'].includes(sch.type) ? sch.type : 'daily',
      days,
      perWeek: Math.min(7, Math.max(1, Math.round(Number(sch.perWeek) || 3)))
    },
    note: typeof h.note === 'string' ? h.note.slice(0, 200) : '',
    createdAt: typeof h.createdAt === 'string' ? h.createdAt : todayKey(),
    archived: !!h.archived,
    order: Number.isFinite(h.order) ? h.order : 0
  };
}

/* ---------------- habit CRUD ---------------- */

export function activeHabits(){
  return state.habits.filter(h => !h.archived).sort((a, b) => a.order - b.order);
}
export function allHabits(){
  return [...state.habits].sort((a, b) => (a.archived - b.archived) || (a.order - b.order));
}
export function getHabit(id){ return state.habits.find(h => h.id === id) || null; }

export function addHabit(patch){
  const h = normHabit({ ...patch, id: uid(), createdAt: todayKey() });
  h.order = state.habits.length;
  state.habits.push(h);
  save(); emit();
  return h;
}

export function updateHabit(id, patch){
  const i = state.habits.findIndex(h => h.id === id);
  if (i < 0) return null;
  const merged = normHabit({ ...state.habits[i], ...patch, id });
  state.habits[i] = merged;
  save(); emit();
  return merged;
}

export function deleteHabit(id){
  state.habits = state.habits.filter(h => h.id !== id);
  delete state.log[id];
  state.habits.forEach((h, i) => { h.order = i; });
  save(); emit();
}

export function setArchived(id, archived){ return updateHabit(id, { archived }); }

export function moveHabit(id, dir){
  const list = activeHabits();
  const i = list.findIndex(h => h.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  list.forEach((h, k) => { h.order = k; });
  // archived habits keep their relative order after the active ones
  state.habits.filter(h => h.archived).forEach((h, k) => { h.order = list.length + k; });
  save(); emit();
}

/* ---------------- log entries ---------------- */

export function getValue(habitId, dateKey){
  return (state.log[habitId] && state.log[habitId][dateKey]) || 0;
}

export function setValue(habitId, dateKey, value){
  const v = Math.max(0, Math.round(Number(value) || 0));
  if (!state.log[habitId]) state.log[habitId] = {};
  if (v === 0) delete state.log[habitId][dateKey];
  else state.log[habitId][dateKey] = v;
  save(); emit();
  return v;
}

export function bump(habitId, dateKey, delta){
  return setValue(habitId, dateKey, getValue(habitId, dateKey) + delta);
}

/** Check habits flip 0 <-> 1; counters jump between empty and target. */
export function toggle(habitId, dateKey){
  const h = getHabit(habitId);
  if (!h) return 0;
  const cur = getValue(habitId, dateKey);
  if (h.type === 'count') return setValue(habitId, dateKey, cur >= h.target ? 0 : h.target);
  return setValue(habitId, dateKey, cur ? 0 : 1);
}

export function isDone(habit, dateKey){
  return getValue(habit.id, dateKey) >= (habit.type === 'count' ? habit.target : 1);
}

/** Is this habit expected on this date? Flexible weekly habits are always offerable. */
export function isScheduled(habit, dateKey){
  const s = habit.schedule;
  if (s.type === 'days') return s.days.includes(dowOf(dateKey));
  return true; // daily + weekly (n-times-per-week) can be logged any day
}

/* ---------------- settings ---------------- */

export function setSetting(key, value){
  state.settings[key] = value;
  save(); emit();
}

/* ---------------- import / export ---------------- */

export function exportData(){
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString(), app: 'Streak' }, null, 2);
}

/**
 * @param {string} json
 * @param {'replace'|'merge'} mode
 */
export function importData(json, mode = 'replace'){
  let parsed;
  try{ parsed = JSON.parse(json); }
  catch{ throw new Error('That file isn’t valid JSON.'); }
  if (!parsed || !Array.isArray(parsed.habits)) throw new Error('That doesn’t look like a Streak backup.');

  const incoming = migrate(parsed);

  if (mode === 'replace'){
    state = incoming;
  }else{
    const byId = new Map(state.habits.map(h => [h.id, h]));
    const byName = new Map(state.habits.map(h => [h.name.toLowerCase(), h]));
    for (const h of incoming.habits){
      const existing = byId.get(h.id) || byName.get(h.name.toLowerCase());
      const targetId = existing ? existing.id : h.id;
      if (!existing){
        state.habits.push({ ...h, order: state.habits.length });
      }
      const src = incoming.log[h.id] || {};
      if (!state.log[targetId]) state.log[targetId] = {};
      for (const [dk, v] of Object.entries(src)){
        state.log[targetId][dk] = Math.max(state.log[targetId][dk] || 0, v);
      }
    }
    state = migrate(state);
  }
  save(); emit();
  return { habits: incoming.habits.length };
}

export function resetAll(){
  state = blank();
  state.settings.onboarded = true;
  save(); emit();
}

/** Counts for the settings screen. */
export function dataStats(){
  let entries = 0;
  for (const days of Object.values(state.log)) entries += Object.keys(days).length;
  let bytes = 0;
  try{ bytes = new Blob([JSON.stringify(state)]).size; }catch{}
  return { habits: state.habits.length, entries, bytes };
}
