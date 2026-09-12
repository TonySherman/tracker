/* ============================================================
   views/settings.js — data portability, theme, about.
   ============================================================ */
import * as S from '../store.js';
import { I } from '../icons.js';
import { sheet, esc, toast, haptic, confirmSheet } from '../ui.js';

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
  document.dispatchEvent(new CustomEvent('streak:installable'));
});

function fileName(){
  return `ember-backup-${S.todayKey()}.json`;
}

function bytes(n){
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

export function renderSettings(){
  const d = S.dataStats();
  const theme = S.state.settings.theme;
  const ws = S.state.settings.weekStart;

  return `
    <div class="wrap view">
      <header class="hdr"><div class="hdr-row"><div><h1>Settings</h1><p class="sub">Your data never leaves this device</p></div></div></header>

      <div class="section-title"><span>Backup &amp; transfer</span></div>
      <button class="srow" data-act="export">
        <span class="ic">${I.download}</span>
        <span class="tx"><b>Export backup</b><span>Download a JSON file with every habit and check-in</span></span>
        <span class="chev">${I.chevR}</span>
      </button>
      <button class="srow" data-act="import">
        <span class="ic">${I.upload}</span>
        <span class="tx"><b>Import backup</b><span>Restore, or merge a file from another device</span></span>
        <span class="chev">${I.chevR}</span>
      </button>
      ${navigator.share ? `
      <button class="srow" data-act="share">
        <span class="ic">${I.share}</span>
        <span class="tx"><b>Send to another device</b><span>Share the backup file straight from here</span></span>
        <span class="chev">${I.chevR}</span>
      </button>` : ''}

      <div class="section-title"><span>Appearance</span></div>
      <div class="card">
        <span class="lbl" style="display:block;margin-bottom:7px;font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-3)">Theme</span>
        <div class="seg" id="theme-seg">
          <button type="button" data-theme="dark" aria-pressed="${theme === 'dark'}">Dark</button>
          <button type="button" data-theme="light" aria-pressed="${theme === 'light'}">Light</button>
          <button type="button" data-theme="auto" aria-pressed="${theme === 'auto'}">Auto</button>
        </div>
        <span class="lbl" style="display:block;margin:16px 0 7px;font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-3)">Week starts on</span>
        <div class="seg" id="ws-seg">
          <button type="button" data-ws="1" aria-pressed="${ws === 1}">Monday</button>
          <button type="button" data-ws="0" aria-pressed="${ws === 0}">Sunday</button>
        </div>
      </div>

      <div class="section-title"><span>App</span></div>
      <button class="srow" data-act="install" ${deferredInstall ? '' : 'hidden'} id="install-row">
        <span class="ic">${I.install}</span>
        <span class="tx"><b>Install on this device</b><span>Run it full-screen, offline, like a native app</span></span>
        <span class="chev">${I.chevR}</span>
      </button>
      <button class="srow" data-act="about">
        <span class="ic">${I.info}</span>
        <span class="tx"><b>About Ember</b><span>${d.habits} habit${d.habits === 1 ? '' : 's'} · ${d.entries} check-in${d.entries === 1 ? '' : 's'} · ${bytes(d.bytes)}</span></span>
        <span class="chev">${I.chevR}</span>
      </button>

      <div class="section-title"><span>Danger zone</span></div>
      <button class="srow" data-act="reset" style="border-color:rgba(248,113,113,.25)">
        <span class="ic" style="background:rgba(248,113,113,.12)">${I.trash}</span>
        <span class="tx"><b style="color:var(--bad)">Erase all data</b><span>Delete every habit and check-in on this device</span></span>
        <span class="chev">${I.chevR}</span>
      </button>

      <p class="muted center" style="margin:26px 0 4px;font-size:12.5px">
        Ember keeps everything in this browser's local storage.<br>Clearing site data will remove it — export regularly.
      </p>
      <div style="height:8px"></div>
    </div>`;
}

/* ---------------- actions ---------------- */

function downloadBackup(){
  const blob = new Blob([S.exportData()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function exportSheet(){
  const json = S.exportData();
  const d = S.dataStats();

  sheet({
    title: 'Export backup',
    body: `
      <p class="muted" style="margin:0 0 16px">A single JSON file containing ${d.habits} habit${d.habits === 1 ? '' : 's'} and ${d.entries} check-in${d.entries === 1 ? '' : 's'}. Keep it somewhere safe — it's everything.</p>
      <div class="stack">
        <button class="btn btn-primary btn-block" data-x="download">${I.download} Download ${esc(fileName())}</button>
        ${navigator.share ? `<button class="btn btn-block" data-x="share">${I.share} Share file</button>` : ''}
        <button class="btn btn-block" data-x="copy">${I.copy} Copy JSON to clipboard</button>
      </div>
      <div class="section-title"><span>Or copy it by hand</span></div>
      <textarea class="input" readonly rows="7" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;min-height:150px" id="x-json">${esc(json)}</textarea>`,
    onMount(root, close){
      root.querySelector('[data-x="download"]').addEventListener('click', () => {
        downloadBackup();
        toast('Backup downloaded', 'ok');
        close();
      });

      root.querySelector('[data-x="share"]')?.addEventListener('click', async () => {
        try{
          const file = new File([json], fileName(), { type: 'application/json' });
          if (navigator.canShare?.({ files: [file] })){
            await navigator.share({ files: [file], title: 'Ember backup' });
          }else{
            await navigator.share({ title: 'Ember backup', text: json });
          }
          close();
        }catch(err){
          if (err?.name !== 'AbortError') toast('Sharing isn’t available here', 'err');
        }
      });

      root.querySelector('[data-x="copy"]').addEventListener('click', async () => {
        const ta = root.querySelector('#x-json');
        try{
          await navigator.clipboard.writeText(json);
          toast('Backup copied to clipboard', 'ok');
        }catch{
          ta.select();
          toast('Select all and copy', '');
        }
      });
    }
  });
}

function importSheet(rerender){
  sheet({
    title: 'Import backup',
    body: `
      <p class="muted" style="margin:0 0 16px">Choose a backup <code>.json</code> file, or paste its contents below. Files exported from an older version still work.</p>

      <div class="field">
        <span class="lbl">How should it be applied?</span>
        <div class="seg" id="imp-mode">
          <button type="button" data-mode="replace" aria-pressed="true">Replace everything</button>
          <button type="button" data-mode="merge" aria-pressed="false">Merge with existing</button>
        </div>
        <p class="muted" style="margin:8px 0 0;font-size:12.5px" id="imp-hint">Wipes what's here and restores the backup exactly. Best for moving to a new device.</p>
      </div>

      <div class="stack">
        <label class="btn btn-block" for="imp-file">${I.upload} Choose backup file</label>
        <input type="file" id="imp-file" accept="application/json,.json" class="sr-only">
      </div>

      <div class="section-title"><span>Or paste JSON</span></div>
      <textarea class="input" rows="6" id="imp-text" placeholder='{ "v": 1, "habits": [ … ] }'
                style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;min-height:120px"></textarea>
      <button class="btn btn-primary btn-block" style="margin-top:12px" id="imp-go">${I.check} Import pasted data</button>
      <div style="height:6px"></div>`,
    onMount(root, close){
      let mode = 'replace';

      root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
        mode = b.dataset.mode;
        root.querySelectorAll('[data-mode]').forEach(x =>
          x.setAttribute('aria-pressed', String(x.dataset.mode === mode)));
        root.querySelector('#imp-hint').textContent = mode === 'replace'
          ? "Wipes what's here and restores the backup exactly. Best for moving to a new device."
          : 'Adds habits you don’t have and keeps the higher value for any day logged in both.';
      }));

      const apply = json => {
        try{
          const res = S.importData(json, mode);
          haptic(16);
          toast(`Imported ${res.habits} habit${res.habits === 1 ? '' : 's'}`, 'ok');
          close();
          rerender();
        }catch(err){
          toast(err.message || 'Import failed', 'err');
        }
      };

      root.querySelector('#imp-file').addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => apply(String(reader.result));
        reader.onerror = () => toast('Could not read that file', 'err');
        reader.readAsText(file);
      });

      root.querySelector('#imp-go').addEventListener('click', () => {
        const text = root.querySelector('#imp-text').value.trim();
        if (!text) return toast('Paste a backup first', 'err');
        apply(text);
      });
    }
  });
}

function aboutSheet(){
  const d = S.dataStats();
  sheet({
    title: 'About Ember',
    body: `
      <p class="muted" style="margin:0 0 16px">A small, private habit tracker. No account, no server, no analytics — everything is stored in this browser and only leaves when you export it.</p>
      <div class="statgrid">
        <div class="stat"><div class="k">Habits</div><div class="v">${d.habits}</div></div>
        <div class="stat"><div class="k">Check-ins</div><div class="v">${d.entries}</div></div>
        <div class="stat"><div class="k">Data size</div><div class="v" style="font-size:20px">${bytes(d.bytes)}</div></div>
        <div class="stat"><div class="k">Version</div><div class="v" style="font-size:20px">1.0</div></div>
      </div>
      <div class="section-title"><span>How streaks work</span></div>
      <p class="muted" style="margin:0">A streak counts consecutive days you hit a habit, skipping days it isn't scheduled for. Today never breaks a streak until the day is over, so an unfinished habit won't punish you at breakfast. Habits set to “× per week” count streaks in weeks instead.</p>
      <div style="height:10px"></div>`
  });
}

export function mountSettings(root, rerender){
  root.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', async () => {
    haptic(6);
    switch (btn.dataset.act){
      case 'export': exportSheet(); break;
      case 'import': importSheet(rerender); break;
      case 'about':  aboutSheet(); break;
      case 'share': {
        const json = S.exportData();
        try{
          const file = new File([json], fileName(), { type: 'application/json' });
          if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Ember backup' });
          else await navigator.share({ title: 'Ember backup', text: json });
        }catch(err){
          if (err?.name !== 'AbortError') toast('Sharing isn’t available here', 'err');
        }
        break;
      }
      case 'install': {
        if (!deferredInstall) return toast('Use your browser’s “Add to Home Screen”', '');
        deferredInstall.prompt();
        const { outcome } = await deferredInstall.userChoice;
        if (outcome === 'accepted') toast('Installing…', 'ok');
        deferredInstall = null;
        document.getElementById('install-row')?.setAttribute('hidden', '');
        break;
      }
      case 'reset': {
        const yes = await confirmSheet({
          title: 'Erase everything?',
          message: 'Every habit and all check-in history on this device will be deleted. Export a backup first if there is any chance you want it back.',
          confirmLabel: 'Erase all data',
          danger: true
        });
        if (yes){ S.resetAll(); toast('All data erased', 'ok'); rerender(); }
        break;
      }
    }
  }));

  root.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => {
    S.setSetting('theme', b.dataset.theme);
    applyTheme();
    rerender();
  }));

  root.querySelectorAll('[data-ws]').forEach(b => b.addEventListener('click', () => {
    S.setSetting('weekStart', Number(b.dataset.ws));
    rerender();
  }));

  document.addEventListener('streak:installable', () =>
    document.getElementById('install-row')?.removeAttribute('hidden'), { once: true });
}

/** Reflect the saved theme on <html> and in the browser chrome colour. */
export function applyTheme(){
  const pref = S.state.settings.theme || 'dark';
  const dark = pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0b12' : '#f6f5fb');
}
