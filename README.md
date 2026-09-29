# NWIS – Nearby Wells Intelligence System

**Team ALTITUDE** · Smart India Hackathon 2026
**Problem statement:** SIH26121 – _Nearby Wells Intelligence System (NWIS)_, for Oil India Limited (OIL)

> **Prototype.** Frontend only, sample data only. There is no backend and there are no real AI calls: every "AI" output is pre-written sample data. This is not an official Oil India Limited or Government of India website, and it uses no official logos.

## What it is

NWIS is a decision-support system that runs alongside OIL's real-time drilling monitor (eRTMAC). It:

- reads old well reports (WCRs, DDRs, mud logs, casing records) with OCR and NLP,
- shows nearby (offset) wells on a map,
- compares wells by depth and formation,
- predicts drilling risks from offset-well history,
- warns engineers **before** the bit reaches a risky zone, and shows what worked before,
- lets engineers ask questions of old reports (RAG assistant), with the sources cited.

## Pages and features

| # | Page | Route | What it shows |
|---|------|-------|---------------|
| 1 | Dashboard – Nearby Wells Map | `/` | Summary cards, Leaflet map with the active well, a radius slider (1–20 km), wells coloured by main past problem, deviated-well paths, filter chips with counts, a legend, well popups, the top 3 alerts and a nearby-wells table (click a row to fly to that well) |
| 2 | Live Alerts | `/alerts` | Simulated eRTMAC readings with 30-min sparklines, a "risk ahead" strip (next 300 m in 25 m intervals), and look-ahead / pattern-match alert cards with "What worked" and **Why?** |
| 3 | Depth Correlation | `/depth` | ECharts correlation panel: formation bands correlated across wells, casing shoes, events at depth, a bit-depth line, MD/TVD toggle, align by formation top, and a formation summary table |
| 4 | Risk Prediction | `/risk` | Risk heatmap (5 problem types × 25 m intervals to TD), a "Why this risk?" panel with SHAP-style factors, a Model / Rule-based badge per interval, and a model info card (sample figures) |
| 5 | Ask the Reports | `/ask` | Scoped Q&A (wells, formation, depth), cited answers with a source excerpt modal, feedback buttons, and a "no relevant information" reply when nothing matches |
| 6 | Knowledge Search | `/search` | Search and filter events and lessons learned; the details panel shows similar incidents from other wells |
| 7 | Document Processing | `/documents` | Simulated drag-and-drop upload, the pipeline view, a documents table, and a side-by-side mock report page vs. extracted fields with confidence |
| 8 | Engineer Review | `/review` | Review queue, highlighted source sentence, editable fields, Approve / Correct & Approve / Reject, and counters |
| 9 | About NWIS | `/about` | Problem and solution, SVG architecture diagram, and the planned tech stack |

Other features:

- **Roles.** The header switches between *Field Engineer* (summary cards hidden, larger alerts) and *Office Engineer*.
- **Live simulation.** Every 3 s the bit moves 0.5 m deeper (accelerated), and the header strip, alert distances, readings and risk strip update. The status strip has a pause/play button.
- **Consistent sample data.** Every page reads the same wells, events and documents. Counts in map chips, the radius card, tables, alerts and the RAG scope are all computed from wells inside the current radius. At the default 10 km:

| Wells in radius | With incidents | Total NPT | Alerts | Mud Loss | Stuck Pipe | Kick | Cementing | No Issue |
|---|---|---|---|---|---|---|---|---|
| 7 | 6 | 106 h | 5 (1 high) | 2 | 2 | 1 | 1 | 1 |

## Screenshot mode

Adding `?shot=1` to any URL pauses the simulation and fixes the bit depth at 2,765 m. It also turns off animations, hides the cursor and scrollbars, and uses the Office Engineer role with a 10 km radius.

| File | URL |
|------|-----|
| `01_dashboard.png` | `/?shot=1` |
| `02_dashboard_popup.png` | `/?shot=1&popup=OW-02` |
| `03_alerts.png` | `/alerts?shot=1` |
| `04_depth.png` | `/depth?shot=1` |
| `05_risk.png` | `/risk?shot=1&interval=2850` |
| `06_ask.png` | `/ask?shot=1&q=tipam` |
| `07_documents.png` | `/documents?shot=1&doc=1` |
| `08_review.png` | `/review?shot=1` |

To capture them at 1920×1080 with deviceScaleFactor 2 into `screenshots/`:

```bash
npm run build
npm run preview          # terminal 1 – http://localhost:4173
npm run screenshots      # terminal 2 – uses the pre-installed Chromium (no "playwright install")
```

The script waits for network idle, fonts, the Leaflet tile `load` event and a further 1.5 s. If map tiles fail to load, it refuses to save the map screenshots and exits with an error.

## Demo video

`video/nwis_demo.mp4` is a ~2.5 min walkthrough (H.264, 1920×1080, 30 fps, no audio, ready for a voiceover). `video/scene_timings.txt` lists each scene's start and end time.

To re-record it, you need internet access for the map tiles and an ffmpeg build with libx264 (`pip install imageio-ffmpeg` provides one):

```bash
npm run build
npm run preview          # terminal 1
npm run demo-video       # terminal 2 – records the live site (simulation on) and exports video/
```

The script renders the title, problem and closing cards, records the site with a visible cursor, and burns in the lower-third captions. It stops rather than record a blank map; `--allow-blank-tiles` makes a draft for checking timing. `node scripts/demo-video.mjs --step=build` re-exports from the last recording.

## Tech stack

| Layer | Planned full system | This prototype |
|-------|--------------------|----------------|
| Document processing | PaddleOCR, OpenCV, pdfplumber, Camelot | Mock report pages + pre-extracted fields |
| NLP | spaCy + rules | Pre-extracted sample events |
| Database | PostgreSQL + PostGIS, TimescaleDB, pgvector | Local JSON in `src/data/` |
| Prediction | XGBoost + SHAP | Transparent scoring from offset-well events (`src/lib/risk.ts`) |
| RAG | bge-m3, pgvector, Llama / Qwen via Ollama (on-premise) | Pre-written answers matched by keywords |
| Live data | WITSML, Kafka, FastAPI, WebSockets | Timer-based simulation |
| Frontend | React, Leaflet, ECharts | React 19 + Vite + TypeScript, Tailwind CSS v4, React Router, React-Leaflet (OpenStreetMap tiles), Apache ECharts (`echarts-for-react`), Noto Sans |
| Security | Keycloak, Docker, on-premise | – |

Planned validation: Equinor's public Volve dataset, with recorded real-time data replayed as eRTMAC.

## Project structure

```
src/
  App.tsx, main.tsx          routes + layout shell
  state/AppState.tsx         role, radius, filter, simulation, derived wells-in-radius + alerts
  pages/                     one file per page (9)
  components/                Header, Footer, MapView, WellPopup, SidePanel, WellsTable,
                             AlertCard, RiskStrip, DepthView, AskPanel, IssueTag
    layout/                  StatusStrip, Sidebar
    alerts/                  LiveReadings (sparklines)
    docs/                    ReportPage (mock scanned page), ExtractedFields
    ui/                      PageHeader, Modal
  lib/                       risk.ts (risk profile, alerts), wells.ts (TVD, formation mapping),
                             qa.ts (keyword matching, scope), geo.ts, format.ts, constants.ts, shot.ts
  data/                      wells.json, documents.json, review.json, live.json (generated),
                             qa.json, alerts.json (hand-written), index.ts
scripts/
  build-sample-data.mjs      regenerates the generated JSON so all pages stay consistent
  screenshots.mjs            Playwright capture of the 8 presets
```

## Run locally

```bash
npm install
npm run dev              # http://localhost:5173
```

To change the sample wells or events, edit `scripts/build-sample-data.mjs` and run `node scripts/build-sample-data.mjs`.

## Deploy on Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Vercel detects Vite: build command `npm run build`, output directory `dist` (already set in `vercel.json`).
4. Click **Deploy**. `vercel.json` rewrites every route to `index.html`, so deep links such as `/risk?shot=1&interval=2850` work.

Or deploy from the command line: `npx vercel --prod`.

---

Team ALTITUDE · Smart India Hackathon 2026 · SIH26121 · Prototype – sample data for demonstration only. Map data © OpenStreetMap contributors.
