# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SaveCharge is a **publishing-only** (static HTML/CSS/vanilla JS) front end for a web service that recommends the most cost-effective nearby gas station or EV charger and hands off to a navigation app. There is no build step, bundler, framework, package.json, linter, or test suite. All data is dummy data generated in the browser; server integration is out of scope for now. UI text and code comments are in Korean — keep them that way.

The product spec (PRD) lives in a Claude Doc, not in the repo; README.md maps screens to PRD feature IDs (F-01 … F-20) and lists the integration points for real backends.

## Running

Serve over HTTP (geolocation and the service worker do not work on `file://`):

```bash
npx http-server -p 5173 -c-1
```

`sw.js` is network-first, but if a change does not show up, unregister the service worker or hard-reload. When adding a new page or JS/CSS file, add it to the `ASSETS` list in `sw.js`.

- Deploy: GitHub `ultraJH-collab/Save_Charge` `main` → Vercel static hosting (no build). `vercel.json` sets `sw.js` to no-cache; keep that when editing headers.
- `.claude/launch.json` points to a `serve.js` in an old session's temp scratchpad. If preview fails to start, switch it to `npx http-server -p 5173 -c-1`.
- Verify ranking from the page console: `SC.cost.rank(SC.store.get().search.base, { search: {...search, sort, radius}, vot })` → check `best`, `results`, `gap`. Unregister the SW and reload with `?t=` first.

## Architecture

**Script loading, no modules.** Every page loads classic `<script>` tags that attach to one global namespace `window.SC`. Load order matters and is the same on every page:
`config.js` → `store.js` (both in `<head>`; `store.js` applies the theme early to avoid a flash) → `data.js` → `cost.js` → `ui.js` → `map.js` (home only) → `<page>.js`.
Page scripts are IIFEs that run on `DOMContentLoaded`. The tab bar is injected by `SC.ui` into `<nav data-tabbar="<id>">`, and any element with `data-icon="<name>"` gets an inline SVG prepended from the icon map in `ui.js`.

**State (`SC.store`).** A single object persisted to `localStorage` under `savecharge:v1`, deep-merged over `DEFAULTS` on load, so new fields get defaults automatically. Mutate through `SC.store.update(fn)` (saves) and read with `SC.store.get()`. `SC.store.get()` returns the live object, so page-level `st` references stay valid after updates (except after `reset()`). `search` holds the last query (base location, radius, fuel mode, SOC, filters, sort), and other pages use `search.base` as "the current reference location" via `SC.ui.lastBase()`.

**Dummy data (`SC.data`).** Stations are generated deterministically per lat/lng tile (~2.2 km). `near(center, radiusKm, kind)` scans the tiles around a point, and `get(id)` re-creates a station from its ID (`g<tx>_<ty>_<n>` fuel / `e<tx>_<ty>_<n>` EV). Search works anywhere, and favorites and alerts can store IDs only. Changing the hash/RNG or the per-station field order changes every generated station and ID. EV charger status re-rolls every 5 minutes.

**Cost model (`SC.cost`)** implements PRD §6: everything is converted into one "실질 비용" (effective cost, in won) and sorted ascending.
- Fuel: `P·Q + (D/E)·P + V·T/60 + F`. EV: `P·K + (D/Ev)·P + V·(T + wait + chargeMin)/60 + F`.
- `D`/`T` are round-trip estimates (straight-line × `DETOUR_FACTOR`, `AVG_SPEED_KMH`), and `F` (toll) is 0. In production, only the top `TMAP_TOP_N` (3) results get real T map routes, because the free T map tier is 1,000 route calls/day and route matrix is only 20/day. Keep that constraint in mind before adding route calls.
- In amount mode (`fuelMode: 'amount'`), every station is compared at the same quantity, `amount ÷ average price in radius`, not at the amount's per-station liters.
- The recommend-#1 station (lowest effective cost, `res.best`) is the baseline. `gap` = this station's cost − best's cost (0 for the best). It drives the "최저 비용" / "최저보다 +○원" labels in the list, the map marker `최저` / `+○원` sub-labels, and the detail page. `rank()` always keeps `best` in `results`, even when another sort pushes it out of the top `RESULT_LIMIT`.
- `saving` = average effective cost of all candidates − this station's cost. It is only recorded on trips for the savings report.
- Card/membership discounts from settings are subtracted per brand before ranking.

**Map (`SC.map.create`)** is an adapter. If `SC.config.TMAP_APP_KEY` is set, `config.js` `document.write`s the T map JS SDK v2 during head parsing (the SDK itself requires synchronous loading), and `TmapMap` draws SVG data-URL markers. Otherwise `MockMap` renders a CSS-gradient street grid with HTML markers, drag, zoom, and a pick-on-map mode. Both expose `setView / setMarkers / select / setPickMode / zoom / recenter`, so feature work must update both implementations. Marker items are `{ id, lat, lng, label, sub, gap, rank, top }`.

**Bottom sheets and nav hand-off (`SC.ui`).** `openSheet(id)` / `closeSheet()` manage a stack plus a shared backdrop. `[data-close-sheet]` closes the enclosing sheet. `startNav(station, onStart)` deep-links to T map, Kakao Map, or Naver Map. Without a saved default it opens a picker sheet; on desktop it opens the web map instead. `onStart` is where trips are recorded for the savings report.

## Styling

`css/common.css` defines all color tokens on `:root`, overridden for dark mode both via `prefers-color-scheme` (unless `data-theme="light"`) and via `[data-theme="dark"]`. Use the tokens, not raw colors. The layout is mobile-first (max-width 520px). The home page alone switches to a two-column list/map layout at ≥960px (`css/home.css`). Page-specific styles for all subpages are in `css/pages.css`.
