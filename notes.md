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

---

## 2026-09-12 — Step 3: app icons, heatmap labels, swipe

**App icon — generated with `gpt-image-2`**
The brand mark is a flame (a streak that stays lit). Rather than hand-drawing
a raster icon, I generated one at 1024×1024 with OpenAI's `gpt-image-2` — a
gradient flame on the exact app background (`#0B0B12`) so the icon matches the
splash screen with no visible seam.

The raw generation isn't a shippable icon set, so `scratchpad/gen.py` + a Pillow
pass derives one:
- The flat background is detected and trimmed to the flame's true bounding box.
- That art is re-padded onto a square at two different scales: ~76% fill for
  normal icons, ~53% for the **maskable** variant so nothing important falls
  outside Android's circular safe zone.
- Exported at 192, 512 (normal), 512 (maskable), 180 (apple-touch) and 32
  (favicon), all LANCZOS-resampled from the 1024 original.

The UI icons stayed as hand-written SVG — they need to inherit `currentColor`
and stay crisp at 18px, which a raster can't do. Image generation earned its
place only where a rich, non-flat mark was actually wanted.

**Also in this pass**
- Heatmaps gained month labels across the top and Mon/Wed/Fri labels down the
  side, which is what made them readable rather than decorative. The leading
  column's label is suppressed — it's a partial month and would be clipped.
- Swipe left/right on the Today screen to step through days. Touches starting
  inside a horizontally scrollable child (date strip, heatmap, bar chart) are
  ignored so the gesture never fights those.
- Storage failures are now surfaced: a probe at boot warns if the browser
  blocks localStorage, and a failed write (quota) raises a toast instead of
  losing data silently.
- Service worker caches the icon set too.

---

## 2026-09-12 — Step 4: motivation and polish

**Streaks at risk.** The Today screen now shows a banner when habits with a live
streak of 2+ days are still unfinished, naming them. This is the single most
useful nudge a habit tracker can give: it turns an abstract list into "you have
something to lose in the next few hours". It only appears for *today* — there's
nothing to save on a day that's already gone.

**Perfect-day celebration.** Clearing the last habit of a day fires a confetti
shower, a long haptic and a toast. It's deliberately reserved for the whole day
rather than each check-in, so it stays meaningful.

**Fixed: date strip started scrolled to the wrong end.** `#app` was `hidden`
until the splash faded, so the centring maths ran against a zero-width element
and fell back to the left edge. The app is now unhidden before the first render
(the splash is fixed-position and covers it anyway), which also makes any future
layout measurement correct at boot.

**Verified** again in headless Chromium at 390×844 with a deterministic 120-day
dataset across all three schedule types: streak banner, per-habit detail,
stats screen, perfect-day celebration, the new-habit sheet, and a full
export→import round trip. No console errors.

**Deliberately not built**
- *Reminders / notifications.* A static page can't schedule a notification when
  it isn't open — that needs push infrastructure and a server, which would break
  the "no backend, your data never leaves the device" promise. The streaks-at-
  risk banner is the honest version of that nudge.
- *Cloud sync.* Same reason. Export/import is the migration path.

---

## 2026-09-12 — Step 5: responsive pass

Tested at 320, 390, 768 and 1280 px wide (plus the iPhone 390×844 profile) with
an automated check that the document never scrolls horizontally at any of them.

**Fixed at 320px** — the narrowest phones in use. Counter rows were collapsing:
the habit name truncated to a few characters while the meta line wrapped into a
three-line stack.
- Removed the "20 min goal" chip from counter rows entirely. The stepper already
  reads `22 / 20 min`; saying it twice was costing the name its space.
- `.hrow-meta` is now `nowrap` with an ellipsis, so it can never grow the row.
- A `≤360px` media query trims the badge, steppers, date cells and type scale.

**Heatmaps on wide screens** were pinned to the left of a much wider card. They
now sit in a `width:fit-content` block centred in the card, which leaves the
scrolling behaviour untouched when the grid *is* wider than the space.

Also dropped two unused helpers (`monthLabel`, `pluralise`) rather than leave
dead exports around.

---

## 2026-09-12 — Step 6: first run, splash timing, offline verification

**First-run welcome.** A one-time sheet covering the three things that change
how the app feels: streaks are forgiving, nothing leaves the device, and export
is the backup. It ends on "Create my first habit", which opens the habit form
directly. Gated on `settings.onboarded`, which was in the schema from day one
and is now actually used.

**Splash timing.** The title card held for 650ms on every launch. For an app
opened daily that's friction, so returning users (anyone with at least one
habit) now get 380ms — long enough for the fade to read as intentional, short
enough not to wait. First-time visitors still get the full 1100ms, because for
them it's the first impression rather than an obstacle.

**Offline verified, not assumed.** Automated run: load the app, create a habit,
wait for `navigator.serviceWorker.ready`, cut the network at the browser-context
level, reload. The app booted from cache and rendered the saved habit with no
network at all. Measured a warm start at ~855ms from reload to splash dismissed.

## Testing

Three scripted Chromium passes (in the scratchpad, not committed — they're
scaffolding, not app code):
- `smoke.mjs` — full user journey at 390×844: welcome, create all three schedule
  types, tick and step habits, seed history, open every screen and sheet, switch
  theme, export→import round trip.
- `demo.mjs` — deterministic 120-day dataset for reviewing the real visual
  design, including the streak banner and perfect-day celebration.
- `resp.mjs` — 320 / 768 / 1280px with an assertion that the document never
  scrolls horizontally.
- `offline.mjs` — service-worker cold/warm start with the network disabled.

All pass with no console errors.

## Status: complete

Every piece of the brief is in place — multi-habit daily tracking, streaks and
stats, mobile-first design, installable PWA, browser storage with JSON export
and import for device migration, and a static `index.html` that loads it all.

---

## 2026-09-12 — Renamed: Streak → Ember

"Streak" was generic and already carries baggage (Streak CRM, and roughly every
other habit app). **Ember** was chosen for three reasons:

1. **It keeps the flame mark meaningful.** The icon didn't have to change — an
   ember *is* the thing the app asks you to keep alive.
2. **It matches the app's actual philosophy.** The streak logic here is
   deliberately forgiving: only scheduled days can break a run, and today never
   breaks one until the day is over. "Streak" is the aggressive framing of that;
   an ember you tend is the honest one. The tagline moved from "Small things.
   Every day." to **"Keep it lit."**
3. It's short, says itself, and survives being a home-screen label.

"Streak" survives as the **domain term** — streaks are still what the app
counts, and every function name, stat label and piece of copy about them is
unchanged. Only the brand moved.

**The part that mattered: not losing anyone's data.** The storage key changed
from `streak.data.v1` to `ember.data.v1`, which would silently orphan the
history of anyone who had already used the preview. `load()` now checks a
`LEGACY_KEYS` list when the current key is empty, adopts what it finds, and only
removes the old key *after* the re-save succeeds — so a failed write leaves the
original untouched rather than destroying both copies.

Old `streak-backup-*.json` files still import: the parser validates the shape of
the data, never the brand name on it.

**Brand consistency fix, found while reviewing the rename.** The splash mark was
a hand-drawn SVG flame that didn't match the generated app icon — different
silhouette, and a waist so thin that at 84px the top curl read as a detached
shard. Rather than redraw it by eye, I traced the actual icon: threshold the
generated PNG against its flat background, take the largest contour with
scikit-image's `find_contours`, simplify with `approximate_polygon` (tolerance
1.4 → 61 points, sub-pixel facets at display size), and normalise into a 64-unit
viewBox. The splash and `icon.svg` now carry the exact silhouette of the
installed icon. The inner flame detail was dropped deliberately — it's a soft
gradient transition in the source, not a hard-edged shape, so it can't be traced
cleanly, and the silhouette is what makes a mark recognisable anyway.

**Re-verified** all five suites after the rename: journey, visual demo,
responsive (320/768/1280), offline boot, plus a new `rename.mjs` that seeds data
under the old key and asserts it migrates, renders and streaks correctly.

---

## 2026-10-11 — Fixed: a violet disc in the top-left corner

Reported as "an odd blue circle in the top left, when I take a screenshot".
The app was in fact drawing one.

**What was wrong.** The ambient background wash (`body::before`) was three
radial gradients, the first of them `radial-gradient(60% 40% at 12% -6%,
rgba(167,139,250,.20), transparent 70%)`. Two problems compounded:

1. **The centre was on-screen.** `at 12% -6%` puts the bright core at
   x = 0.12 × 390 ≈ 47px — just inside the left edge. Scanning the blue channel
   across the top row confirmed it: brightness *rose* from 47 at the corner to a
   peak of 54 at x≈40, then fell away. A local maximum inside the viewport is a
   blob with a middle, which is to say a circle. (The top-left gradient is the
   violet one; the top-right is pink. "Blue, top left" picks out exactly the one
   that is blue.)
2. **It faded to bare `transparent`.** `transparent` is `rgba(0,0,0,0)`, so the
   ramp from a violet to it passes through *darkened grey*, drawing a faint ring
   at the gradient's edge. Browsers are meant to interpolate in premultiplied
   alpha and Chromium does, which is why this never showed up in testing here —
   WebKit is historically less consistent about it, and the effect is worst on a
   near-black background, which is exactly this app.

**The fix.** Every ambient ramp now ends on *its own hue* at zero alpha
(`rgba(167,139,250,0)`) rather than `transparent`, and each centre was moved
off-canvas (`at -12% -18%`) with a much larger radius. The light now washes in
from an edge with no visible core. Same correction applied to `.splash-glow`.

Measured across the top row, before → after: peak 54 at x=40 → peak 46 at x=0,
falling monotonically to 24. No interior maximum, so nothing that can read as a
disc. The ambient depth is still there; it just isn't a shape any more.

**Worth knowing for anything like this in future:** screenshots capture raw
pixel values, while True Tone, Night Shift and auto-brightness change only what
the eye sees live. A subtle wash on a dark background can therefore look far
stronger in the saved file than it ever did on the screen — which is why this
was reported as a screenshot problem rather than a display one.

Note also that `apple-mobile-web-app-status-bar-style: black-translucent` draws
app content *under* the iOS status bar. Any system indicator iOS puts up there
(the blue capsule round the clock during screen mirroring or background location
use, a "‹ Back to …" pill) lands directly on top of this corner and will look
like part of the app. Kept as is — the edge-to-edge look is worth it, and the
safe-area padding already keeps content clear — but it's the first thing to rule
out if something odd appears up there again.

---

## 2026-10-11 — The blue circle, actually diagnosed

The screenshot settled it, and corrected my earlier guess. Two details gave it
away: the capture toggle was on **Full Page**, and the blob was *bright* violet
— far stronger than the 20%-alpha wash the CSS asks for. A gradient that is
merely badly placed cannot render brighter than the alpha it was given, so the
previous entry's explanation (on-screen centre, `transparent` fade) was not the
cause. Those were real improvements, but they were not this bug.

**The actual cause.** `body::before` was `position: fixed` with `inset: 0`.
Safari's "Full Page" screenshot rasterises a long page in tiles, and a fixed
full-bleed layer is painted into *every* tile and composited onto the same
output. A 20%-alpha wash stacked n times reaches `1 - 0.8ⁿ` — eight tiles is
83% opacity. That is precisely the near-opaque violet blob with an apparently
hard edge (the accumulation saturates, so the falloff clips), and it explains
every part of the report at once: why it is bright, why it is only in
screenshots, why only Full Page, and why it never reproduced in testing here.

**The fix.** The ambient layer is now `position: absolute` pinned to the top of
the document at `height: 100dvh`, so it is painted exactly once — in screenshots
and on screen alike. Measured on-screen appearance before and after: top-row
blue channel went `[46,45,44,…,24]` → `[47,46,45,…,25]`, i.e. identical within a
level. The cost is that the wash no longer follows you down a long page, which
is barely perceptible — light from the top of the page is the effect anyway.

Verified on the Stats page that triggered it (1352px tall): the layer now covers
844px of it rather than being repainted across the whole thing, and a full-page
capture shows no blob.

**The general rule this leaves behind:** a `position: fixed` full-bleed layer
with partial alpha is not safe. Any tiled or paginated rasteriser — Safari's
Full Page screenshot, print, PDF export — may composite it once per tile. If a
decorative overlay must span the viewport, anchor it to the document rather than
the viewport, or give it no alpha to accumulate.

`.nav` is still `position: fixed`, which is unavoidable for a bottom tab bar,
but it is near-opaque and short, so tile accumulation has nothing visible to do
to it.

---

## 2026-10-12 — GitHub Pages: why a pushed fix can look like it never landed

Testing happens at `https://tonysherman.github.io/tracker/`. Verified the
deployment chain rather than assuming it: Pages serves the
`claude/eloquent-babbage-gssqz4` branch (`main` holds only a README), and the
live `css/styles.css` already contained the `position:absolute` ambient layer.
So the fix was deployed. Two caching layers were hiding it.

**1. The service worker took two reloads to show any change.** The old fetch
handler was stale-while-revalidate — `return hit || net` hands back the cached
response immediately and refreshes the cache in the background. The new bytes
therefore only appear on the *next* load. For a user checking whether a fix
worked, that reads as "it didn't".

**2. GitHub Pages sends `cache-control: max-age=600`.** Confirmed from the
response headers. Even a network-first worker would be answered from the
browser's own HTTP cache for up to ten minutes.

**The fix, split by what the file is:**
- **Code** (`html/css/js/webmanifest`) is now **network-first**, cache as the
  offline fallback — a deploy is live on the very next load.
- **Everything else** (icons, images) stays **cache-first** with a background
  refresh. They change about once a year; a round trip per launch buys nothing.
- Every network fetch uses `cache: 'no-cache'`, which forces revalidation
  against the server rather than disabling caching — an unchanged file still
  costs only a 304, but the `max-age=600` window can no longer serve stale
  bytes. Applied to the install step too, which otherwise warms the cache
  through the same stale HTTP cache it was meant to bypass.
- `VERSION` → `ember-v3`, so activate purges the v2 caches.

**Two things to make this debuggable rather than mysterious:**
- **Settings → Check for updates** — messages the worker to drop every cached
  response, calls `registration.update()`, then reloads. The manual escape hatch
  when a cache is suspected.
- **Settings → About now shows a Build stamp**, derived from
  `document.lastModified` (the HTML's `Last-Modified` header, i.e. the deploy
  time). It needs no manual version bumping and cannot drift from what is
  actually running, so "am I even on the new build?" is answerable in two taps.

Added `.nojekyll` — standard for a non-Jekyll Pages site, cheap insurance
against Jekyll's handling of unusual paths.

**Verified** by simulating a deploy: edit a CSS custom property on disk, reload
**once**, and the new value is live (was: needed two). Offline boot still works,
and the app passes at 320/390/1280px with an export→import round trip and no
console errors.
