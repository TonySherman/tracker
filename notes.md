# Streak — build notes

A mobile-first, offline-capable habit tracker. Static files only, no build step,
no backend. All data lives in the browser; JSON export/import moves it between
devices.

---

## 2026-09-12 — Step 1: shell + title screen

**Added**
- `index.html` — app shell with an animated splash/title screen, PWA meta tags
  (`theme-color`, `apple-mobile-web-app-*`, viewport with `viewport-fit=cover`
  for notched phones), and mount points for the app, bottom sheets and toasts.
- `css/styles.css` — the full design system up front so later screens are just
  composition: CSS custom-property tokens, dark theme with a light override via
  `html[data-theme="light"]`, a 10-colour habit palette, safe-area padding vars,
  and component classes (cards, buttons, chips, bottom nav, habit rows, sheets,
  form controls, heatmap, toasts).
- `icons/icon.svg` — flame mark drawn as SVG (crisp at any size, no binary).
- `manifest.webmanifest` — installable PWA metadata, standalone display.
- `js/app.js` — temporary bootstrap that dismisses the splash.

**Decisions**
- **Vanilla JS + ES modules.** No framework or bundler: the repo is served as
  static files, so `index.html` loads everything directly. Keeps payload tiny
  and the preview instant.
- **Design tokens in CSS variables.** Theme switching is one attribute on
  `<html>`; habit colours resolve through a per-row `--hc` variable so a single
  set of rules paints every accent.
- **System rounded font stack.** Avoids a webfont download — important for an
  offline-first app that should paint instantly on a phone.
- **SVG-first visuals.** The mark, all UI icons and the charts are vector, so
  there is nothing to download and everything stays sharp on high-DPI screens.

**Next**
- Data layer (`store.js`) with localStorage persistence + schema versioning.
- Today view with tap-to-complete and counter habits.

---

## 2026-09-12 — Step 2: the working app

The whole tracker now runs: create habits, tick them off, browse history, see
streaks, export/import.

**Modules**
- `js/store.js` — single-key localStorage document (`streak.data.v1`) that is
  also the export format, so backup and restore are the same shape as runtime
  state. Every read and every import goes through `migrate()`, which normalises
  shape, clamps values, drops orphaned log entries and re-numbers ordering —
  so a hand-edited or older file can't corrupt the app.
- `js/stats.js` — streaks, completion rates and chart data, all schedule-aware.
- `js/ui.js` — DOM helpers, toasts, draggable bottom sheets, confirm dialogs,
  haptics and a small confetti burst.
- `js/icons.js` — the full icon set as inline SVG strings.
- `js/views/` — `today`, `habits`, `statsview`, `settings` (screens) plus
  `form`, `detail` (sheets) and `charts` (shared chart markup).
- `js/app.js` — hash router, bottom nav, boot sequence, service-worker
  registration, and a midnight/visibility check that re-renders on a new day.
- `sw.js` — cache-first service worker so the app opens with no network.

**Data model**

```
{ v:1,
  habits: [{ id, name, emoji, color, type:'check'|'count', target, unit,
             schedule:{ type:'daily'|'days'|'weekly', days:[0-6], perWeek },
             note, createdAt, archived, order }],
  log: { habitId: { 'YYYY-MM-DD': number } },
  settings: { theme, weekStart, onboarded } }
```

Dates are stored as **local** `YYYY-MM-DD` strings, never ISO timestamps — a
UTC timestamp shifts the day for anyone west of Greenwich and would silently
mis-attribute evening check-ins.

**Streak rules (the interesting part)**
- Only *scheduled* days can break a streak. A Mon/Wed/Fri habit survives a
  Tuesday untouched.
- **Today never breaks a streak.** The day isn't over, so an unfinished habit
  at breakfast shouldn't show a zero. The walk-back starts at yesterday if
  today isn't done yet.
- "× per week" habits count streaks in *weeks*, not days, and the in-progress
  week can only help — it can't break the run.
- Both walks are bounded (10-year / 520-week caps) so no data shape can hang
  the UI in a loop.

**Interaction decisions**
- Tap the circle to tick; tap the rest of the row to open detail. Counter
  habits get −/+ steppers instead, stepping by 5 when the goal is 30+.
- Completing a habit fires a haptic tap and a small colour burst — the reward
  moment is the point of the app.
- Off-schedule habits still appear under "Not scheduled" so a bonus session can
  be logged without editing the schedule.
- Bottom sheets drag down to dismiss and close on Escape or scrim tap.

**Export / import**
- Export offers three routes because mobile browsers differ: file download,
  Web Share (so it can go straight into Files/AirDrop/a message), and
  copy-to-clipboard with the raw JSON visible as a last resort.
- Import takes a file *or* pasted JSON, and offers **replace** (new device) or
  **merge** (keeps both histories, taking the higher value for any day logged
  in both). Merge matches on habit id first, then name, so a re-created habit
  doesn't duplicate.

**Verified** with a headless Chromium pass at iPhone viewport (390×844, DPR 2):
created all three schedule types, ticked and stepped habits, seeded 70 days of
history, opened every screen and sheet, switched themes, and round-tripped an
export through import — no console errors.

**Next**
- Onboarding for first run, app icons (PNG/maskable), polish pass.
