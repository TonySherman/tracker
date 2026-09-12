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
