// Generates the prototype's sample data in src/data/*.json from one place so that
// wells, events, documents, review queue and live readings stay consistent.
// All values are dummy data for demonstration only.
// Usage: node scripts/build-sample-data.mjs
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(import.meta.dirname, '..', 'src', 'data');
const ACTIVE = { lat: 27.45, lon: 95.15 };
const KM_PER_DEG_LAT = 111.0;
const KM_PER_DEG_LON = 111.0 * Math.cos((ACTIVE.lat * Math.PI) / 180);
const r1 = (x) => Math.round(x * 10) / 10;
const r4 = (x) => Math.round(x * 10000) / 10000;

function offset(lat, lon, distKm, bearingDeg) {
  const b = (bearingDeg * Math.PI) / 180;
  return [r4(lat + (distKm * Math.cos(b)) / KM_PER_DEG_LAT), r4(lon + (distKm * Math.sin(b)) / KM_PER_DEG_LON)];
}
function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// Same formula as src/lib/depth.ts (vertical to KOP, then a constant-inclination tangent).
const tvdOf = (traj, md) => (!traj || md <= traj.kop ? md : Math.round(traj.kop + (md - traj.kop) * Math.cos((traj.inc * Math.PI) / 180)));

const tops = (n, g, t, b, k) => [
  { name: 'Alluvium', top: 0 },
  { name: 'Namsang', top: n },
  { name: 'Girujan', top: g },
  ...(t ? [{ name: 'Tipam', top: t }] : []),
  ...(b ? [{ name: 'Barail', top: b }] : []),
  ...(k ? [{ name: 'Kopili', top: k }] : []),
];
const casing = (c13, c9, c7) => [
  { size: '13⅜"', shoe: c13 },
  { size: '9⅝"', shoe: c9 },
  ...(c7 ? [{ size: '7"', shoe: c7 }] : []),
];

const RAW = [
  {
    name: 'OW-01', dist: 2.4, bearing: 40, year: 2011, td: 3620, type: 'vertical', mainIssue: 'Stuck Pipe',
    tops: tops(415, 1170, 2835, 3400), casing: casing(1120, 3375, 3620),
    mw: { Girujan: [1.14, 1.18], Tipam: [1.18, 1.22], Barail: [1.26, 1.3] },
    events: [
      { type: 'Stuck Pipe', md: 3478, formation: 'Barail', date: '22-Aug-2011', page: 2,
        description: 'Differential sticking on a connection after 25 min static across Barail sand/shale interbeds.',
        action: 'Jarred down, spotted 30 bbl freeing pill; resumed with controlled ROP (≤12 m/hr) and wiper trips every 200 m.',
        result: 'Pipe freed after 14 h; no further sticking to TD.', timeLost: 16 },
      { type: 'Torque Spike', md: 3530, formation: 'Barail', date: '23-Aug-2011', page: 1,
        description: 'Erratic torque 18–24 kft·lbf in interbedded Barail shale.',
        action: 'Reduced WOB, increased flow rate, back-reamed one stand.',
        result: 'Torque normalised; drilled ahead.', timeLost: 2.5 },
    ],
  },
  {
    name: 'OW-02', dist: 3.9, bearing: 280, year: 2019, td: 3710, type: 'deviated', mainIssue: 'Mud Loss',
    traj: { kop: 1500, inc: 22, az: 255 },
    tops: tops(440, 1205, 2860, 3440), casing: casing(1150, 3405, 3710),
    mw: { Girujan: [1.15, 1.2], Tipam: [1.18, 1.24], Barail: [1.27, 1.31] },
    events: [
      { type: 'Mud Loss', md: 2872, formation: 'Tipam', date: '14-Mar-2019', page: 3,
        description: 'Partial losses of 12–15 bbl/hr on entering Tipam sand while drilling with 1.24 SG mud.',
        action: 'Pumped 50 bbl LCM pill (40 ppb CaCO₃ + fibre) and reduced mud weight to 1.18 SG.',
        result: 'Losses cured within 6 h; no further losses to 9⅝" shoe.', timeLost: 6, workedMw: 1.18 },
      { type: 'Torque Spike', md: 3515, formation: 'Barail', date: '02-Apr-2019', page: 2,
        description: 'Torque fluctuations 17–21 kft·lbf while rotating through Barail shale stringers.',
        action: 'Adjusted RPM and WOB; added lubricant 2% v/v.',
        result: 'Drilled ahead normally.', timeLost: 1.5 },
    ],
  },
  {
    name: 'OW-03', dist: 5.6, bearing: 160, year: 2008, td: 2600, type: 'vertical', mainIssue: 'No Issue',
    tops: tops(420, 1180), casing: casing(1130, 2590),
    mw: { Girujan: [1.14, 1.18] }, events: [],
    note: 'Shallow Girujan appraisal well; did not reach Tipam.',
  },
  {
    name: 'OW-04', dist: 6.3, bearing: 60, year: 2016, td: 3780, type: 'deviated', mainIssue: 'Stuck Pipe',
    traj: { kop: 1800, inc: 28, az: 40 },
    tops: tops(425, 1185, 2845, 3415), casing: casing(1135, 3390, 3780),
    mw: { Girujan: [1.15, 1.19], Tipam: [1.18, 1.23], Barail: [1.27, 1.32] },
    events: [
      { type: 'Torque Spike', md: 3495, formation: 'Barail', date: '07-Nov-2016', page: 2,
        description: 'Torque rose from 15 to 21 kft·lbf while ROP fell from 14 to 6 m/hr over about 40 min.',
        action: 'Picked up off bottom and circulated 30 min; resumed drilling.',
        result: 'Torque stayed high; string packed off at 3,520 m (see next report).', timeLost: 1 },
      { type: 'Stuck Pipe', md: 3520, formation: 'Barail', date: '08-Nov-2016', page: 3,
        description: 'String packed off and became stuck while drilling after the rising-torque / falling-ROP trend.',
        action: 'Worked pipe and jarred up, back-reamed; then held ROP at 10–12 m/hr with hi-vis sweeps and wiper trips every 150 m.',
        result: 'Pipe freed after 20 h; no repeat to TD.', timeLost: 22 },
    ],
  },
  {
    name: 'OW-05', dist: 7.1, bearing: 220, year: 2021, td: 3690, type: 'vertical', mainIssue: 'Mud Loss',
    tops: tops(435, 1195, 2870, 3445), casing: casing(1145, 3410, 3690),
    mw: { Girujan: [1.16, 1.2], Tipam: [1.18, 1.23], Barail: [1.26, 1.3] },
    events: [
      { type: 'Mud Loss', md: 2890, formation: 'Tipam', date: '19-Jan-2021', page: 2,
        description: 'Partial losses of about 20 bbl/hr in Tipam sand at 1.23 SG.',
        action: 'Pumped 40 bbl LCM pill, reduced mud weight to 1.18 SG and lowered flow rate by 10%.',
        result: 'Losses cured in about 5 h; drilled to 9⅝" shoe without further losses.', timeLost: 7, workedMw: 1.18 },
      { type: 'Torque Spike', md: 3510, formation: 'Barail', date: '26-Jan-2021', page: 2,
        description: 'Short torque spikes up to 20 kft·lbf in Barail shale.',
        action: 'Reduced WOB and RPM; back-reamed one single.',
        result: 'Torque back to normal.', timeLost: 1 },
    ],
  },
  {
    name: 'OW-06', dist: 8.2, bearing: 320, year: 2014, td: 4120, type: 'deviated', mainIssue: 'Kick',
    traj: { kop: 2000, inc: 18, az: 300 },
    tops: tops(430, 1190, 2855, 3425, 4065), casing: casing(1140, 3395, 4120),
    mw: { Girujan: [1.15, 1.2], Tipam: [1.18, 1.22], Barail: [1.28, 1.38], Kopili: [1.36, 1.38] },
    events: [
      { type: 'Kick', md: 3890, formation: 'Barail', date: '11-Jun-2014', page: 4,
        description: '12 bbl pit gain from an overpressured deep Barail sand while drilling with 1.32 SG mud.',
        action: 'Shut in, killed with the driller\'s method, raised mud weight to 1.38 SG.',
        result: 'Well killed and drilled ahead to TD.', timeLost: 19, workedMw: 1.38 },
    ],
  },
  {
    name: 'OW-07', dist: 9.4, bearing: 115, year: 2017, td: 3650, type: 'vertical', mainIssue: 'Cementing Issue',
    tops: tops(420, 1180, 2842, 3410), casing: casing(1130, 3385, 3650),
    mw: { Girujan: [1.15, 1.19], Tipam: [1.19, 1.24], Barail: [1.26, 1.31] },
    events: [
      { type: 'Mud Loss', md: 2868, formation: 'Tipam', date: '03-Sep-2017', page: 2,
        description: 'Partial losses of 8–10 bbl/hr in Tipam sand at 1.24 SG.',
        action: 'Pumped LCM pill; losses returned, then cut mud weight from 1.24 to 1.19 SG and pumped a second pill.',
        result: 'Losses controlled after the second pill.', timeLost: 4, workedMw: 1.19 },
      { type: 'Cementing Issue', md: 3385, formation: 'Tipam', date: '21-Sep-2017', page: 3,
        description: 'Losses into Tipam during 9⅝" cement displacement; top of cement ~350 m low, poor bond on CBL.',
        action: 'Remedial squeeze through perforations at 2,950 m; lighter lead slurry (1.50 SG) recommended for future wells.',
        result: 'Bond acceptable after squeeze.', timeLost: 26 },
    ],
  },
  {
    name: 'OW-08', dist: 11.2, bearing: 250, year: 2013, td: 3600, type: 'vertical', mainIssue: 'Mud Loss',
    tops: tops(445, 1210, 2865, 3450), casing: casing(1155, 3420, 3600),
    mw: { Girujan: [1.16, 1.2], Tipam: [1.19, 1.25], Barail: [1.26, 1.3] },
    events: [
      { type: 'Mud Loss', md: 2880, formation: 'Tipam', date: '27-Feb-2013', page: 3,
        description: 'Severe losses of about 40 bbl/hr in Tipam sand at 1.25 SG.',
        action: 'LCM pills ineffective; set a cement plug, then drilled on with mud weight reduced to 1.19 SG.',
        result: 'Losses cured after 30 h.', timeLost: 30, workedMw: 1.19 },
    ],
  },
  {
    name: 'OW-09', dist: 12.8, bearing: 20, year: 2020, td: 3580, type: 'vertical', mainIssue: 'No Issue',
    tops: tops(410, 1175, 2840, 3405), casing: casing(1125, 3380, 3580),
    mw: { Girujan: [1.15, 1.19], Tipam: [1.17, 1.19], Barail: [1.26, 1.3] }, events: [],
  },
  {
    name: 'OW-10', dist: 14.3, bearing: 135, year: 2010, td: 3640, type: 'deviated', mainIssue: 'No Issue',
    traj: { kop: 1700, inc: 20, az: 170 },
    tops: tops(430, 1195, 2860, 3440), casing: casing(1140, 3410, 3640),
    mw: { Girujan: [1.15, 1.2], Tipam: [1.17, 1.2], Barail: [1.26, 1.3] }, events: [],
  },
];

// ---------------------------------------------------------------- documents
const docs = [];
const addDoc = (d) => {
  const doc = { id: docs.length + 1, ...d };
  docs.push(doc);
  return doc;
};
const fileName = (type, well, date) => (date ? `${type} – ${well} – ${date}.pdf` : `${type} – ${well}.pdf`);
const RIG = { 'OW-01': 'Rig S-2', 'OW-02': 'Rig E-5', 'OW-03': 'Rig S-1', 'OW-04': 'Rig E-3', 'OW-05': 'Rig E-5', 'OW-06': 'Rig S-4', 'OW-07': 'Rig E-3', 'OW-08': 'Rig S-2', 'OW-09': 'Rig E-6', 'OW-10': 'Rig S-1' };

function conf(seed, lo, hi) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return Math.round((lo + (x - Math.floor(x)) * (hi - lo)) * 100) / 100;
}

function extractedFrom(w, e, method, seed) {
  const lo = method === 'OCR' ? 0.83 : 0.93;
  return [
    { field: 'Well', value: w.name, confidence: conf(seed + 1, 0.97, 0.995) },
    { field: 'Date', value: e.date, confidence: conf(seed + 2, lo + 0.05, 0.99) },
    { field: 'Depth', value: `${e.md.toLocaleString('en-IN')} m MD`, confidence: conf(seed + 3, lo, 0.97) },
    { field: 'Formation', value: e.formation, confidence: conf(seed + 4, lo, 0.96) },
    { field: 'Event', value: e.type, confidence: conf(seed + 5, lo + 0.04, 0.98) },
    { field: 'Action', value: e.action, confidence: conf(seed + 6, lo - 0.06, 0.93) },
    { field: 'Result', value: e.result, confidence: conf(seed + 7, lo - 0.04, 0.94) },
    { field: 'Time lost', value: `${e.timeLost} h`, confidence: conf(seed + 8, lo, 0.97) },
  ];
}

function ddrRows(w, e) {
  const mwBefore = { 'Mud Loss': e.description.match(/1\.\d\d SG/)?.[0] ?? '1.22 SG' }[e.type] ?? `${(w.mw[e.formation] ?? [1.2, 1.25])[1].toFixed(2)} SG`;
  const d0 = e.md - 40;
  return [
    { time: '06:00–08:30', hrs: '2.5', text: `Drilled 12¼" hole from ${d0.toLocaleString('en-IN')} m to ${(d0 + 22).toLocaleString('en-IN')} m. MW ${mwBefore}. Parameters normal.` },
    { time: '08:30–09:00', hrs: '0.5', text: 'Connection. Circulated. Surveyed.' },
    { time: '09:00–11:00', hrs: '2.0', text: `Drilled ahead to ${e.md.toLocaleString('en-IN')} m in ${e.formation}.` },
    { time: '11:00–13:00', hrs: '2.0', text: e.description, hl: true },
    { time: '13:00–17:00', hrs: '4.0', text: e.action, hl: true },
    { time: '17:00–20:00', hrs: '3.0', text: e.result, hl: true },
    { time: '20:00–06:00', hrs: '10.0', text: `Time lost to ${e.type.toLowerCase()}: ${e.timeLost} h (NPT). Continued operations as per programme.` },
  ];
}

for (const w of RAW) w.mw = { Alluvium: [1.05, 1.08], Namsang: [1.08, 1.12], ...w.mw };

const wells = RAW.map((raw) => {
  const [lat, lon] = offset(ACTIVE.lat, ACTIVE.lon, raw.dist, raw.bearing);
  return { raw, lat, lon };
});

const eventDocs = new Map();
// Doc 1 must be the OW-02 Tipam DDR (used by /documents?doc=1).
const order = ['OW-02', 'OW-05', 'OW-07', 'OW-01', 'OW-04', 'OW-06', 'OW-08'];
for (const name of order) {
  const { raw: w } = wells.find((x) => x.raw.name === name);
  for (const e of w.events) {
    const method = ['OW-02', 'OW-07', 'OW-01', 'OW-06', 'OW-08'].includes(w.name) ? 'OCR' : 'Digital text';
    const d = addDoc({
      file: fileName('DDR', w.name, e.date), well: w.name, type: 'DDR', date: e.date, pages: 4, method, status: 'Processed',
      eventsExtracted: 1, page: e.page,
      excerpt: {
        title: 'DAILY DRILLING REPORT',
        meta: [['Well', w.name], ['Date', e.date], ['Rig', RIG[w.name]], ['Report no.', `DDR-${w.name.slice(3)}-${String(e.page * 7 + e.md % 13).padStart(3, '0')}`], ['Depth at 06:00', `${(e.md - 40).toLocaleString('en-IN')} m MD`], ['Formation', e.formation]],
        rows: ddrRows(w, e),
      },
      extracted: extractedFrom(w, e, method, docs.length * 10),
    });
    eventDocs.set(`${w.name}|${e.date}`, d);
  }
}
// Casing record for OW-07 cement job.
addDoc({
  file: 'Casing record – OW-07 – 9⅝in.pdf', well: 'OW-07', type: 'Casing record', date: '21-Sep-2017', pages: 6, method: 'OCR', status: 'Processed', eventsExtracted: 1, page: 2,
  excerpt: {
    title: 'CASING & CEMENTING RECORD – 9⅝" INTERMEDIATE',
    meta: [['Well', 'OW-07'], ['Date', '21-Sep-2017'], ['Casing', '9⅝" 47 ppf N-80'], ['Shoe', '3,385 m MD'], ['Planned TOC', '2,600 m MD']],
    rows: [
      { time: 'Slurry', hrs: '', text: 'Lead 1.65 SG (180 bbl), tail 1.90 SG (60 bbl). Spacer 1.30 SG.' },
      { time: 'Job', hrs: '', text: 'Returns lost during displacement at 70% of plan; job completed on partial returns.', hl: true },
      { time: 'CBL', hrs: '', text: 'Top of cement at ~2,950 m (about 350 m below plan). Poor bond across Tipam sand.', hl: true },
      { time: 'Remedial', hrs: '', text: 'Perforated at 2,950 m; squeezed 40 bbl 1.90 SG slurry. Bond acceptable after squeeze.', hl: true },
      { time: 'Lessons', hrs: '', text: 'Cure Tipam losses before the cement job. Use a lighter lead slurry (1.50 SG) for 9⅝" casing.', hl: true },
    ],
  },
  extracted: extractedFrom(RAW[6], RAW[6].events[1], 'OCR', 777),
});

// Well completion reports.
for (const { raw: w } of wells) {
  const method = w.year < 2015 ? 'OCR' : 'Digital text';
  const rows = [
    { time: 'Tops', hrs: '', text: w.tops.map((t) => `${t.name} ${t.top.toLocaleString('en-IN')} m`).join(' · ') },
    { time: 'Casing', hrs: '', text: w.casing.map((c) => `${c.size} at ${c.shoe.toLocaleString('en-IN')} m`).join(' · ') },
    ...Object.entries(w.mw).map(([f, [a, b]]) => ({ time: 'Mud', hrs: '', text: `${f}: water-based mud ${a.toFixed(2)}–${b.toFixed(2)} SG.` })),
    ...(w.events.length
      ? w.events.map((e) => ({ time: 'Problem', hrs: '', text: `${e.type} at ${e.md.toLocaleString('en-IN')} m (${e.formation}): ${e.description} ${e.result}`, hl: true }))
      : [{ time: 'Problems', hrs: '', text: w.note ?? 'No significant drilling problems recorded.' }]),
  ];
  if (w.name === 'OW-06')
    rows.push({ time: 'Remarks', hrs: '', text: 'Pressure ramp seen ~60 m above the kick depth: rising background gas (3% → 7%) and connection gas.', hl: true });
  const firstEvent = w.events[0];
  addDoc({
    file: fileName('WCR', w.name), well: w.name, type: 'WCR', date: `${w.year}`, pages: 32 + (w.td % 17), method, status: 'Processed',
    eventsExtracted: w.events.length, page: w.name === 'OW-06' ? 14 : 7,
    excerpt: { title: 'WELL COMPLETION REPORT – DRILLING SUMMARY', meta: [['Well', w.name], ['Year drilled', `${w.year}`], ['TD', `${w.td.toLocaleString('en-IN')} m MD`], ['Type', w.type]], rows },
    extracted: firstEvent
      ? extractedFrom(w, firstEvent, method, 300 + w.td)
      : [{ field: 'Well', value: w.name, confidence: 0.99 }, { field: 'Event', value: 'None recorded', confidence: 0.9 }],
  });
}

// Mud logs used by the Girujan mud-weight answer.
for (const name of ['OW-02', 'OW-05']) {
  const w = RAW.find((x) => x.name === name);
  addDoc({
    file: `Mud log – ${name} – Girujan–Tipam.pdf`, well: name, type: 'Mud log', date: w.events[0].date, pages: 12, method: 'Digital text', status: 'Processed', eventsExtracted: 0, page: 1,
    excerpt: {
      title: 'MUD LOG – SUMMARY SHEET', meta: [['Well', name], ['Interval', `${w.tops[2].top.toLocaleString('en-IN')}–${w.tops[4].top.toLocaleString('en-IN')} m`], ['Mud system', 'Water-based (KCl-polymer)']],
      rows: [
        { time: 'Girujan', hrs: '', text: `Clay/claystone. MW ${w.mw.Girujan[0].toFixed(2)}–${w.mw.Girujan[1].toFixed(2)} SG. No losses, no gas shows.`, hl: true },
        ...(name === 'OW-02' ? [{ time: 'Base Girujan', hrs: '', text: 'MW raised to 1.20 SG ahead of Tipam as per programme.', hl: true }] : []),
        { time: 'Tipam', hrs: '', text: `Sandstone, friable. MW ${w.mw.Tipam[0].toFixed(2)}–${w.mw.Tipam[1].toFixed(2)} SG. Losses at top of Tipam (see DDR).` },
        { time: 'Gas', hrs: '', text: 'Background gas 0.4–1.2%. No significant peaks.' },
      ],
    },
    extracted: [{ field: 'Well', value: name, confidence: 0.99 }, { field: 'Formation', value: 'Girujan / Tipam', confidence: 0.95 }, { field: 'Mud weight', value: `${w.mw.Girujan[0].toFixed(2)}–${w.mw.Girujan[1].toFixed(2)} SG`, confidence: 0.94 }],
  });
}

// Documents waiting in the engineer review queue (new, not yet in the database).
const REVIEW = [
  { well: 'OW-09', type: 'DDR', date: '12-Oct-2020', method: 'OCR', event: 'Torque Spike', md: '3,215', formation: 'Barail', sentence: 'Erratic torque 16–20 kft·lbf while reaming tight spot at 3,215 m; back-reamed one stand and increased flow 10%.', action: 'Back-reamed one stand; increased flow rate 10%.', result: 'Torque normal.', timeLost: '1.5 h', c: [0.99, 0.95, 0.88, 0.9, 0.81, 0.74, 0.79, 0.86] },
  { well: 'OW-10', type: 'DDR', date: '18-Apr-2010', method: 'OCR', event: 'Mud Loss', md: '2,9O5', formation: 'Tipam', sentence: 'Seepage losses 2–3 bbl/hr at 2,9O5 m in Tipam sand; added fine CaCO₃ to active system and continued drilling.', action: 'Added fine CaCO₃ to active system; continued drilling.', result: 'Seepage stopped.', timeLost: '0 h', c: [0.99, 0.93, 0.58, 0.92, 0.84, 0.77, 0.8, 0.9] },
  { well: 'OW-03', type: 'DDR', date: '07-Jul-2008', method: 'OCR', event: 'Stuck Pipe', md: '2,410', formation: 'Girujan', sentence: 'Overpull 20 klbf at 2,410 m while pulling out; wiped through, hole free.', action: 'Wiped through tight spot.', result: 'Hole free.', timeLost: '0.5 h', c: [0.98, 0.94, 0.9, 0.88, 0.52, 0.7, 0.75, 0.83] },
  { well: 'OW-09', type: 'WCR', date: '2020', method: 'Digital text', event: 'Cementing Issue', md: '3,380', formation: 'Tipam', sentence: 'Top of cement on 9⅝" casing 80 m below plan; accepted without remedial work.', action: 'None – accepted.', result: 'No remedial work needed.', timeLost: '0 h', c: [0.99, 0.97, 0.93, 0.9, 0.61, 0.82, 0.85, 0.95] },
  { well: 'OW-08', type: 'DDR', date: '02-Mar-2013', method: 'OCR', event: 'Torque Spike', md: '3,480', formation: 'Barail', sentence: 'Torque spikes to 22 kft·lbf at 3,480 m in Barail shale; reduced WOB and back-reamed.', action: 'Reduced WOB; back-reamed.', result: 'Torque normalised.', timeLost: '1 h', c: [0.99, 0.91, 0.89, 0.93, 0.86, 0.72, 0.84, 0.88] },
  { well: 'OW-10', type: 'Mud log', date: '22-Apr-2010', method: 'OCR', event: 'Kick', md: '3,390', formation: 'Tipam', sentence: 'Gas peak 11% at 3,390 m after trip (trip gas); no pit gain, MW unchanged.', action: 'Circulated bottoms up.', result: 'Gas dropped to background.', timeLost: '0 h', c: [0.98, 0.9, 0.87, 0.85, 0.47, 0.72, 0.78, 0.9] },
];
const review = REVIEW.map((r, i) => {
  const file = r.type === 'WCR' ? `WCR – ${r.well} – addendum.pdf` : r.type === 'Mud log' ? `Mud log – ${r.well} – ${r.date}.pdf` : fileName('DDR', r.well, r.date);
  const d = addDoc({
    file, well: r.well, type: r.type, date: r.date, pages: r.type === 'WCR' ? 5 : 4, method: r.method, status: 'In review', eventsExtracted: 1, page: 2,
    excerpt: {
      title: r.type === 'DDR' ? 'DAILY DRILLING REPORT' : r.type === 'WCR' ? 'WELL COMPLETION REPORT – ADDENDUM' : 'MUD LOG – SUMMARY SHEET',
      meta: [['Well', r.well], ['Date', r.date], ['Rig', RIG[r.well]]],
      rows: [
        { time: '06:00–10:00', hrs: '4.0', text: `Drilled / tripped as per programme in ${r.formation}. Parameters normal.` },
        { time: '10:00–12:00', hrs: '2.0', text: r.sentence, hl: true },
        { time: '12:00–18:00', hrs: '6.0', text: `${r.action} ${r.result}` },
        { time: '18:00–06:00', hrs: '12.0', text: 'Continued operations. No further remarks.' },
      ],
    },
    extracted: [],
  });
  const fields = [['Well', r.well], ['Date', r.date], ['Depth', `${r.md} m MD`], ['Formation', r.formation], ['Event', r.event], ['Action', r.action], ['Result', r.result], ['Time lost', r.timeLost]];
  d.extracted = fields.map(([field, value], k) => ({ field, value, confidence: r.c[k] }));
  return { id: `R-${String(i + 1).padStart(3, '0')}`, docId: d.id, well: r.well, event: r.event, depth: `${r.md} m`, formation: r.formation, confidence: Math.min(...r.c), sentence: r.sentence };
});

addDoc({ file: 'DDR – OW-10 – 05-May-2010.pdf', well: 'OW-10', type: 'DDR', date: '05-May-2010', pages: 3, method: 'OCR', status: 'Failed', eventsExtracted: 0, page: 1, failReason: 'Unreadable scan – page skew > 15° and faded print', excerpt: null, extracted: [] });

// ---------------------------------------------------------------- wells
const out = {
  active: {
    name: 'NWIS-ACTIVE-01', lat: ACTIVE.lat, lon: ACTIVE.lon, plannedTd: 4100, type: 'vertical', startBitDepth: 2765, holeSection: '12¼" hole',
    formationTops: tops(430, 1190, 2850, 3420, 4060),
    casing: [{ size: '13⅜"', shoe: 1140, status: 'set' }, { size: '9⅝"', shoe: 3390, status: 'planned' }, { size: '7"', shoe: 4100, status: 'planned' }],
    plannedMw: { Alluvium: 1.06, Namsang: 1.1, Girujan: 1.2, Tipam: 1.24, Barail: 1.3, Kopili: 1.36 },
  },
  offsets: wells.map(({ raw: w, lat, lon }) => {
    const traj = w.traj
      ? {
          ...w.traj,
          points: Array.from({ length: 6 }, (_, i) => {
            const md = w.traj.kop + ((w.td - w.traj.kop) * i) / 5;
            const hdKm = ((md - w.traj.kop) * Math.sin((w.traj.inc * Math.PI) / 180)) / 1000;
            return offset(lat, lon, hdKm, w.traj.az);
          }),
        }
      : undefined;
    const allMw = Object.values(w.mw).flat();
    const events = w.events.map((e) => {
      const d = eventDocs.get(`${w.name}|${e.date}`);
      return {
        type: e.type, md: e.md, tvd: tvdOf(w.traj, e.md), formation: e.formation, description: e.description, action: e.action, result: e.result,
        timeLost: e.timeLost, ...(e.workedMw ? { workedMw: e.workedMw } : {}),
        source: { docId: d.id, file: d.file, report: 'DDR', date: e.date, page: e.page },
      };
    });
    return {
      name: w.name, lat, lon, distanceKm: r1(haversineKm([ACTIVE.lat, ACTIVE.lon], [lat, lon])), year: w.year, td: w.td, tdTvd: tvdOf(w.traj, w.td), type: w.type,
      mainIssue: w.mainIssue, ...(traj ? { trajectory: traj } : {}),
      formationTops: w.tops, casing: w.casing, mudWeight: { min: Math.min(...allMw), max: Math.max(...allMw), byFormation: w.mw },
      nptHours: events.reduce((s, e) => s + e.timeLost, 0), events,
      documents: docs.filter((d) => d.well === w.name).map((d) => d.file),
      ...(w.note ? { note: w.note } : {}),
    };
  }),
};

// ---------------------------------------------------------------- live readings (last 30 min, 1 point/min)
const noise = (i, s) => Math.sin(i * 1.7 + s) * 0.5 + Math.sin(i * 0.37 + s * 2) * 0.5;
const live = {
  minutes: Array.from({ length: 30 }, (_, i) => i - 29),
  rop: Array.from({ length: 30 }, (_, i) => r1(11.5 - (4.5 * i) / 29 + noise(i, 1) * 0.6)),
  torque: Array.from({ length: 30 }, (_, i) => r1(14.2 + (2.9 * i) / 29 + noise(i, 2) * 0.35)),
  spp: Array.from({ length: 30 }, (_, i) => Math.round(2850 + noise(i, 3) * 18)),
  pitVolume: Array.from({ length: 30 }, (_, i) => r1(412 + noise(i, 4) * 1.2)),
  mudWeight: Array.from({ length: 30 }, () => 1.2),
};
live.rop[29] = 7.0;
live.torque[29] = 17.1;
let depth = 2765;
live.bitDepth = new Array(30);
for (let i = 29; i >= 0; i--) {
  live.bitDepth[i] = r1(depth);
  depth -= live.rop[i] / 60;
}

const write = (f, data) => writeFileSync(join(OUT, f), JSON.stringify(data, null, 2) + '\n');
write('wells.json', out);
write('documents.json', docs);
write('review.json', review);
write('live.json', live);
console.log(`wells: ${out.offsets.length}, documents: ${docs.length}, review items: ${review.length}`);
for (const w of out.offsets) console.log(w.name, w.distanceKm, 'km', w.mainIssue, 'NPT', w.nptHours, 'docs', w.documents.length);
