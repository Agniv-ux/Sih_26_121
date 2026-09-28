# NWIS – Nearby Wells Intelligence System

**Team ALTITUDE** · Smart India Hackathon 2026
**Problem statement:** SIH26121 – _Nearby Wells Intelligence System (NWIS)_, for Oil India Limited

> Prototype: frontend only, sample data only, no backend and no real AI calls.

## What it is

NWIS is a decision-support dashboard that runs alongside OIL's real-time drilling monitor (eRTMAC). It:

- shows nearby (offset) wells on a map around the well being drilled,
- warns drilling engineers **before** the bit reaches a depth or formation where nearby wells had problems,
- shows **what worked before** in those wells, and
- lets engineers **ask questions of old well reports**, with sources cited.

## Features

- **Offset-well map** (React-Leaflet, CARTO Dark Matter): active well with pulse marker, search-radius circle (1–20 km slider, live update), wells coloured by main past problem, well labels, trajectory lines for deviated wells, legend, filter chips by main past problem (All / Mud Loss / Stuck Pipe / Kick / Cementing / No issue — counts always add up to the wells in radius), and a popup card per well with a “View depth comparison” button.
- **Alerts tab**: a _Risk ahead_ strip covering the next 300 m below the bit in 25 m intervals (low / medium / high), plus alert cards sorted by urgency. Each card shows the formation, distance ahead of the bit, the offset wells involved, _what worked_, and a **Why?** button that opens the reasoning in the Ask tab.
- **Nearby Wells tab**: sortable table (distance, main issue, NPT, events). Click a row to fly to the well and open its popup.
- **Ask the Reports tab**: chat-style Q&A answered only from the reports of the wells selected on the map. Answers are pre-written and end with source chips (e.g. `OW-02 DDR 14-Mar-2019 p.3`). Free-typed questions are matched by keyword to the closest answer.
- **Depth comparison** (Apache ECharts): the active well next to 5 nearby offset wells. Formation tops are drawn as coloured bands correlated across wells, with casing shoes, event markers (tooltips give details and source), and a dashed line at the current bit depth.
- **Live simulation**: the bit advances every 3 s, and the header, risk strip and “distance ahead” values update. Pause/play button in the header.
- **Screenshot mode** for pixel-identical slide images (see below).

Risk is worked out from the data. Each offset-well event is mapped onto the active well by its offset below the same formation top. An interval is **high** risk when two or more wells had a problem near that depth, and **medium** when one well did or when at least 30 % of the wells that drilled that formation had problems in it.

## Tech stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · React-Leaflet + CARTO Dark Matter tiles · Apache ECharts (`echarts-for-react`) · Inter font · Playwright (screenshots). All data lives in local JSON under `src/data/`.

```
src/
  components/  Header, Footer, MapView, WellPopup, SidePanel, AlertCard, RiskStrip,
               WellsTable, AskPanel, DepthView, IssueTag
  data/        wells.json (active + 10 offset wells), alerts.json, qa.json, index.ts
  lib/         risk.ts (risk strip + alerts), wells.ts, qa.ts (keyword matching), geo.ts, shot.ts
```

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview      # http://localhost:4173
```

## Screenshot mode

Add a URL parameter to get a clean, fixed view. The live simulation is paused, the bit depth is fixed at 2,765 m, animations are turned off, and cursors, scrollbars and zoom controls are hidden.

| URL                | View                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `/?shot=dashboard` | Alerts tab, 10 km radius, all filters, map fitted to the full radius circle                                    |
| `/?shot=popup`     | Same as dashboard, with OW-02's popup open beside the marker, clear of the radius card, legend and other wells |
| `/?shot=depth`     | Depth comparison modal open                                                                                    |
| `/?shot=ask`       | Ask the Reports tab with the Tipam losses question answered, with source chips                                 |

To capture all four at 1920×1080 with deviceScaleFactor 2 into `screenshots/`:

```bash
npm run build && npm run preview    # terminal 1
npm run screenshots                 # terminal 2
```

The script waits for network idle, the Leaflet tile `load` event and `document.fonts.ready`, plus 1.5 s. **It exits with an error instead of saving an image if the map tiles cannot load** (for example, with no internet). Options: `--url=http://host:port`, `--only=dashboard,ask`. If Playwright's bundled Chromium is not installed, run `npx playwright install chromium` or set `PW_CHROMIUM` to a Chrome/Chromium path.

## Deploy on Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output directory `dist` (already set in `vercel.json`).
4. Click **Deploy**. The site is fully static; screenshot URLs work on the deployed domain too, e.g. `https://<your-app>.vercel.app/?shot=dashboard`.

CLI alternative: `npm i -g vercel && vercel --prod`.

---

Team ALTITUDE · SIH 2026 · SIH26121 · Prototype – sample data for demonstration only
