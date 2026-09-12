/* ============================================================
   views/form.js — create / edit a habit in a bottom sheet.
   ============================================================ */
import * as S from '../store.js';
import { I } from '../icons.js';
import { sheet, esc, toast, haptic, confirmSheet } from '../ui.js';

const DOW = ['S','M','T','W','T','F','S'];
const DOW_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const PRESETS = [
  { name: 'Practice guitar', emoji: '🎸', color: 'orange', type: 'count', target: 20, unit: 'min' },
  { name: 'Study',           emoji: '📚', color: 'blue',   type: 'count', target: 30, unit: 'min' },
  { name: 'Read',            emoji: '📖', color: 'amber',  type: 'count', target: 15, unit: 'pages' },
  { name: 'Exercise',        emoji: '🏋️', color: 'lime',   type: 'check' },
  { name: 'Meditate',        emoji: '🧘', color: 'cyan',   type: 'count', target: 10, unit: 'min' },
  { name: 'Drink water',     emoji: '💧', color: 'blue',   type: 'count', target: 8,  unit: 'glasses' },
  { name: 'Walk',            emoji: '🚶', color: 'green',  type: 'count', target: 8000, unit: 'steps' },
  { name: 'Journal',         emoji: '✍️', color: 'violet', type: 'check' },
  { name: 'No phone in bed', emoji: '📵', color: 'rose',   type: 'check' },
  { name: 'Sleep by 11',     emoji: '😴', color: 'indigo', type: 'check' }
];

export function openHabitForm(habitId, onSaved){
  const editing = habitId ? S.getHabit(habitId) : null;

  const draft = editing ? JSON.parse(JSON.stringify(editing)) : {
    name: '', emoji: '✨', color: 'violet', type: 'check', target: 1, unit: '',
    schedule: { type: 'daily', days: [1,2,3,4,5], perWeek: 3 }, note: ''
  };

  sheet({
    title: editing ? 'Edit habit' : 'New habit',
    body: bodyHTML(draft, !!editing),
    onMount(root, close){ wire(root, close, draft, editing, onSaved); }
  });
}

function bodyHTML(d, editing){
  return `
    ${!editing ? `
    <div class="field">
      <span class="lbl">Quick start</span>
      <div class="picker" id="presets">
        ${PRESETS.map((p, i) => `<button type="button" class="chip" data-preset="${i}">${p.emoji} ${esc(p.name)}</button>`).join('')}
      </div>
    </div>` : ''}

    <div class="field">
      <label for="f-name">Habit name</label>
      <input class="input" id="f-name" data-autofocus maxlength="80" autocomplete="off"
             placeholder="e.g. Practice guitar" value="${esc(d.name)}">
    </div>

    <div class="field">
      <span class="lbl">Icon</span>
      <div class="emoji-pick" id="f-emoji">
        ${S.EMOJIS.map(e => `<button type="button" data-emoji="${e}" aria-pressed="${e === d.emoji}" aria-label="Icon ${e}">${e}</button>`).join('')}
      </div>
    </div>

    <div class="field">
      <span class="lbl">Colour</span>
      <div class="picker" id="f-color">
        ${S.COLORS.map(c => `<button type="button" class="swatch" style="--sc:var(--c-${c})" data-color="${c}"
           aria-pressed="${c === d.color}" aria-label="Colour ${c}"></button>`).join('')}
      </div>
    </div>

    <div class="field">
      <span class="lbl">How do you track it?</span>
      <div class="seg" id="f-type">
        <button type="button" data-type="check" aria-pressed="${d.type === 'check'}">Simple check</button>
        <button type="button" data-type="count" aria-pressed="${d.type === 'count'}">Count a goal</button>
      </div>
    </div>

    <div class="field" id="f-goal" ${d.type === 'count' ? '' : 'hidden'}>
      <span class="lbl">Daily goal</span>
      <div class="row-2">
        <input class="input" id="f-target" type="number" inputmode="numeric" min="1" max="100000"
               value="${d.target}" aria-label="Goal amount">
        <input class="input" id="f-unit" maxlength="12" placeholder="min, pages…" value="${esc(d.unit)}" aria-label="Unit">
      </div>
    </div>

    <div class="field">
      <span class="lbl">Repeat</span>
      <div class="seg" id="f-sched">
        <button type="button" data-sched="daily"  aria-pressed="${d.schedule.type === 'daily'}">Every day</button>
        <button type="button" data-sched="days"   aria-pressed="${d.schedule.type === 'days'}">Some days</button>
        <button type="button" data-sched="weekly" aria-pressed="${d.schedule.type === 'weekly'}">× / week</button>
      </div>
    </div>

    <div class="field" id="f-days" ${d.schedule.type === 'days' ? '' : 'hidden'}>
      <span class="lbl">Which days</span>
      <div class="dowpick" id="f-dow">
        ${DOW.map((l, i) => `<button type="button" data-dow="${i}" aria-label="${DOW_FULL[i]}"
           aria-pressed="${d.schedule.days.includes(i)}">${l}</button>`).join('')}
      </div>
    </div>

    <div class="field" id="f-perweek" ${d.schedule.type === 'weekly' ? '' : 'hidden'}>
      <label for="f-pw">Times per week</label>
      <select class="input" id="f-pw">
        ${[1,2,3,4,5,6,7].map(n => `<option value="${n}" ${n === d.schedule.perWeek ? 'selected' : ''}>${n}× per week</option>`).join('')}
      </select>
    </div>

    <div class="field">
      <label for="f-note">Why it matters <span style="text-transform:none;letter-spacing:0">(optional)</span></label>
      <textarea class="input" id="f-note" maxlength="200" rows="2"
                placeholder="A line you'll want to read on a hard day">${esc(d.note)}</textarea>
    </div>

    <div class="stack" style="margin-top:22px">
      <button class="btn btn-primary btn-block" id="f-save">${I.check} ${editing ? 'Save changes' : 'Create habit'}</button>
      ${editing ? `
        <button class="btn btn-block btn-ghost" id="f-archive">${editing.archived ? I.restore : I.archive} ${editing.archived ? 'Unarchive' : 'Archive'}</button>
        <button class="btn btn-block btn-danger" id="f-delete">${I.trash} Delete habit</button>` : ''}
    </div>
    <div style="height:6px"></div>`;
}

function wire(root, close, draft, editing, onSaved){
  const q = sel => root.querySelector(sel);
  const nameInput = q('#f-name');

  const press = (group, attr, value) => {
    root.querySelectorAll(`${group} [${attr}]`).forEach(b =>
      b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(value))));
  };

  // presets
  root.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => {
    const p = PRESETS[Number(btn.dataset.preset)];
    Object.assign(draft, { name: p.name, emoji: p.emoji, color: p.color, type: p.type, target: p.target || 1, unit: p.unit || '' });
    nameInput.value = p.name;
    q('#f-target').value = draft.target;
    q('#f-unit').value = draft.unit;
    press('#f-emoji', 'data-emoji', p.emoji);
    press('#f-color', 'data-color', p.color);
    press('#f-type', 'data-type', p.type);
    q('#f-goal').hidden = p.type !== 'count';
    haptic(6);
  }));

  root.querySelectorAll('[data-emoji]').forEach(b => b.addEventListener('click', () => {
    draft.emoji = b.dataset.emoji; press('#f-emoji', 'data-emoji', draft.emoji); haptic(5);
  }));

  root.querySelectorAll('[data-color]').forEach(b => b.addEventListener('click', () => {
    draft.color = b.dataset.color; press('#f-color', 'data-color', draft.color); haptic(5);
  }));

  root.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => {
    draft.type = b.dataset.type;
    press('#f-type', 'data-type', draft.type);
    q('#f-goal').hidden = draft.type !== 'count';
    haptic(5);
  }));

  root.querySelectorAll('[data-sched]').forEach(b => b.addEventListener('click', () => {
    draft.schedule.type = b.dataset.sched;
    press('#f-sched', 'data-sched', draft.schedule.type);
    q('#f-days').hidden = draft.schedule.type !== 'days';
    q('#f-perweek').hidden = draft.schedule.type !== 'weekly';
    haptic(5);
  }));

  root.querySelectorAll('[data-dow]').forEach(b => b.addEventListener('click', () => {
    const i = Number(b.dataset.dow);
    const days = new Set(draft.schedule.days);
    days.has(i) ? days.delete(i) : days.add(i);
    if (!days.size) days.add(i);                 // never allow an empty schedule
    draft.schedule.days = [...days].sort();
    root.querySelectorAll('[data-dow]').forEach(x =>
      x.setAttribute('aria-pressed', String(draft.schedule.days.includes(Number(x.dataset.dow)))));
    haptic(5);
  }));

  q('#f-save').addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name){
      nameInput.focus();
      toast('Give the habit a name first', 'err');
      return;
    }
    const patch = {
      name,
      emoji: draft.emoji,
      color: draft.color,
      type: draft.type,
      target: draft.type === 'count' ? Math.max(1, parseInt(q('#f-target').value, 10) || 1) : 1,
      unit: draft.type === 'count' ? q('#f-unit').value.trim() : '',
      schedule: { type: draft.schedule.type, days: draft.schedule.days, perWeek: Number(q('#f-pw').value) || 3 },
      note: q('#f-note').value.trim()
    };

    if (editing) S.updateHabit(editing.id, patch);
    else S.addHabit(patch);

    haptic(14);
    toast(editing ? 'Habit updated' : `“${name}” added`, 'ok');
    close();
    onSaved?.();
  });

  q('#f-archive')?.addEventListener('click', () => {
    S.setArchived(editing.id, !editing.archived);
    toast(editing.archived ? 'Habit restored' : 'Habit archived — its history is kept', 'ok');
    close(); onSaved?.();
  });

  q('#f-delete')?.addEventListener('click', async () => {
    close();
    const yes = await confirmSheet({
      title: 'Delete this habit?',
      message: `“${editing.name}” and all of its logged history will be removed. This can't be undone — export a backup first if you might want it.`,
      confirmLabel: 'Delete forever',
      danger: true
    });
    if (yes){
      S.deleteHabit(editing.id);
      toast('Habit deleted', 'ok');
      onSaved?.();
    }
  });
}
