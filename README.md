# Streak — Habit Tracker

A fast, private, mobile-first habit tracker that runs entirely in the browser.
No account, no server, no analytics. Open `index.html` and it works.

![Today screen](https://img.shields.io/badge/PWA-installable-a78bfa) ![No build step](https://img.shields.io/badge/build-none-f472b6)

## What it does

- **Track any number of habits** — simple check-offs ("meditated") or counted
  goals ("20 minutes of guitar", "8 glasses of water").
- **Flexible schedules** — every day, specific weekdays, or *N times a week*.
- **Streaks that behave sensibly** — only scheduled days can break a streak, and
  an unfinished habit doesn't zero your streak before the day is over.
- **Stats** — current and best streaks, 30-day completion rate, perfect days, a
  14-day bar chart and a GitHub-style year heatmap per habit.
- **Backdating** — scroll or swipe the date strip to log a day you missed.
- **Export / import** — one JSON file carries every habit and check-in to a new
  device, with replace-or-merge on the way in.
- **Installable and offline** — a PWA with a service worker; add it to your home
  screen and it launches full-screen without a network.

## Running it

It's static. Serve the folder with anything:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

There is no build step, no dependency install, and no bundler — `index.html`
loads plain ES modules directly.

## Moving your data to a new device

**Settings → Export backup** produces `streak-backup-YYYY-MM-DD.json` (download,
share sheet, or clipboard). On the new device, **Settings → Import backup** and
choose *Replace everything*. To fold two devices' histories together instead,
choose *Merge* — habits are matched by id, then by name, and the higher value
wins for any day logged on both.

Everything lives in this browser's `localStorage`, so clearing site data will
erase it. Export now and then.

## Layout

```
index.html              entry point — shell, splash, PWA meta
manifest.webmanifest    installable app metadata
sw.js                   cache-first service worker
css/styles.css          design tokens + every component
icons/                  app icon set (SVG mark + generated PNGs)
js/store.js             schema, persistence, mutations, import/export
js/stats.js             streaks, rates, chart data
js/ui.js                toasts, bottom sheets, dialogs, effects
js/icons.js             inline SVG icon set
js/app.js               router, bottom nav, boot
js/views/               today · habits · statsview · settings · form · detail · charts
notes.md                build log and design decisions
```
