// Records the ~2.5 min NWIS demo video and exports video/nwis_demo.mp4 (H.264, 1920×1080, 30 fps, no audio).
//
// Usage: npm run build && npm run preview          (terminal 1)
//        node scripts/demo-video.mjs                 (terminal 2)
// Options: --url=http://localhost:4173   --allow-blank-tiles (draft only: continue if map tiles fail)
//          --out=video                   FFMPEG=/path/to/ffmpeg (needs libx264; default: imageio-ffmpeg or ffmpeg on PATH)
//
// Steps: 1) render title / problem / closing cards and caption bars to PNG with Playwright,
//        2) record the live site (simulation ON) with a visible cursor, logging scene start times,
//        3) trim + join + burn in captions with ffmpeg, 4) write scene_timings.txt.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const BASE = args.url || 'http://localhost:4173';
const OUT = resolve(args.out || 'video');
const WORK = join(OUT, '.work');
const ALLOW_BLANK = !!args['allow-blank-tiles'];
const W = 1920, H = 1080, FPS = 30;
const executablePath = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim(); } catch { return 'ffmpeg'; }
}
const FFMPEG = findFfmpeg();
const ff = (a) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });

// ---------------------------------------------------------------- script
const CARDS = { title: 8, problem: 10, closing: 10 };
const SCENES = [
  { id: 3, name: 'Document Processing', dur: 12, caption: 'Reading old reports with OCR & NLP' },
  { id: 4, name: 'Engineer Review', dur: 10, caption: 'Engineer verifies extracted data' },
  { id: 5, name: 'Dashboard – radius & filters', dur: 20, caption: 'Nearby wells within a chosen radius' },
  { id: 6, name: 'Offset well OW-02 popup', dur: 12, caption: 'Past problems of an offset well' },
  { id: 7, name: 'Depth Correlation', dur: 15, caption: 'Wells compared by depth & formation' },
  { id: 8, name: 'Risk Prediction', dur: 13, caption: 'Risk prediction with reasons' },
  { id: 9, name: 'Live Alerts', dur: 15, caption: 'Early warning before Tipam sand' },
  { id: 10, name: 'Ask the Reports', dur: 20, caption: 'Answer from old reports – with source' },
  { id: 11, name: 'Field Engineer view', dur: 7, caption: 'Simple view for field staff' },
];

// ---------------------------------------------------------------- 1. cards + captions
// Noto Sans is embedded as data URLs so the stills render with the same font as the site.
const FONT_FACES = [400, 600, 700].map((w) => {
  const b64 = readFileSync(resolve(`node_modules/@fontsource/noto-sans/files/noto-sans-latin-${w}-normal.woff2`)).toString('base64');
  return `@font-face{font-family:'Noto Sans';font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
}).join('');
const CARD_CSS = `
  ${FONT_FACES}
  *{box-sizing:border-box;margin:0}
  body{width:${W}px;height:${H}px;background:#fff;font-family:'Noto Sans',system-ui,sans-serif;color:#0B3D91;display:flex;flex-direction:column;justify-content:center;padding:0 200px;position:relative}
  .bar{position:absolute;left:0;top:0;right:0;height:14px;background:#0B3D91}
  .accent{width:120px;height:8px;background:#E67E22;margin-bottom:44px}
  h1{font-size:84px;font-weight:700;line-height:1.1}
  h2{font-size:44px;font-weight:600;color:#1F2937;margin-top:30px}
  p{font-size:52px;line-height:1.35;color:#1F2937;font-weight:600}
  p.small{font-size:36px;color:#6B7280;font-weight:400;margin-top:36px}
  .label{font-size:30px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#E67E22;margin-bottom:28px}
  .foot{position:absolute;left:200px;right:200px;bottom:70px;display:flex;justify-content:space-between;font-size:26px;color:#6B7280;border-top:2px solid #D9DEE5;padding-top:22px}`;
const card = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CARD_CSS}</style></head><body><div class="bar"></div>${body}
  <div class="foot"><span>Team ALTITUDE · SIH 2026 · SIH26121</span><span>Prototype – sample data</span></div></body></html>`;
const CARD_HTML = {
  title: card(`<div class="accent"></div><h1>NWIS – Nearby Wells<br>Intelligence System</h1><h2>Team ALTITUDE · Smart India Hackathon 2026 · SIH26121</h2>`),
  problem: card(`<div class="label">The problem</div><div class="accent" style="margin-bottom:40px"></div>
    <p>Offset-well knowledge is buried in old reports.</p><p style="margin-top:18px">eRTMAC shows only the current well.</p>
    <p class="small">Drilling engineers cannot easily see what went wrong in nearby wells – or what fixed it.</p>`),
  closing: card(`<div class="accent"></div><h1 style="font-size:64px">Runs alongside eRTMAC · Open-source ·<br>On OIL's own servers</h1>
    <h2 style="color:#E67E22">Prototype – sample data</h2><h2 style="margin-top:18px">Team ALTITUDE</h2>`),
};
const captionHtml = (text) => `<!doctype html><html><head><meta charset="utf-8"><style>
  ${FONT_FACES}
  *{margin:0;box-sizing:border-box} html,body{background:transparent}
  body{width:${W}px;height:${H}px;position:relative;font-family:'Noto Sans',system-ui,sans-serif}
  .cap{position:absolute;left:290px;bottom:74px;display:flex;align-items:stretch;background:rgba(11,61,145,.9);box-shadow:0 2px 10px rgba(0,0,0,.18)}
  .cap i{width:10px;background:#E67E22} .cap span{color:#fff;font-size:40px;font-weight:600;padding:16px 34px 18px 26px;letter-spacing:.01em}
  </style></head><body><div class="cap"><i></i><span>${text}</span></div></body></html>`;

async function renderStills(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (const [k, html] of Object.entries(CARD_HTML)) {
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(WORK, `card_${k}.png`) });
  }
  for (const s of SCENES) {
    await page.setContent(captionHtml(s.caption));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(WORK, `cap_${s.id}.png`), omitBackground: true });
  }
  await page.close();
}

// ---------------------------------------------------------------- 2. recording
const CURSOR_JS = `(() => {
  const init = () => {
    if (document.getElementById('__demo_cursor')) return;
    const st = document.createElement('style');
    st.textContent = '#__demo_cursor{position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(17,24,39,.72);border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);z-index:2147483647;pointer-events:none;transition:none}'
      + '.__demo_ripple{position:fixed;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:3px solid #E67E22;z-index:2147483646;pointer-events:none;animation:__rip .7s ease-out forwards}'
      + '@keyframes __rip{from{transform:scale(1);opacity:.95}to{transform:scale(3.6);opacity:0}}';
    document.head.appendChild(st);
    const c = document.createElement('div'); c.id = '__demo_cursor'; c.style.transform = 'translate(-100px,-100px)';
    document.body.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
    addEventListener('mousedown', (e) => { const r = document.createElement('div'); r.className = '__demo_ripple'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; document.body.appendChild(r); setTimeout(() => r.remove(), 800); }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();`;

async function record(browser) {
  const context = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: WORK, size: { width: W, height: H } } });
  await context.addInitScript(CURSOR_JS);
  const t0 = Date.now();
  const page = await context.newPage();
  const now = () => (Date.now() - t0) / 1000;
  const sleep = (s) => page.waitForTimeout(s * 1000);
  let mx = W / 2, my = H / 2;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  // Time-based so a slow browser (video encoding) never stretches the move.
  async function moveTo(x, y, dur = 0.8) {
    const sx = mx, sy = my, t = Date.now();
    for (;;) {
      const k = Math.min(1, (Date.now() - t) / (dur * 1000));
      await page.mouse.move(sx + (x - sx) * ease(k), sy + (y - sy) * ease(k));
      if (k >= 1) break;
      await page.waitForTimeout(12);
    }
    mx = x; my = y;
  }
  async function center(locator) {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    const b = await locator.boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2, b];
  }
  async function hold(sec) {
    const end = Date.now() + sec * 1000;
    for (let i = 0; Date.now() < end; i++) { await page.mouse.move(mx + (i % 2), my); await page.waitForTimeout(250); }
  }
  const hover = async (loc, dur = 0.8, dx = 0) => { const [x, y] = await center(loc); await moveTo(x + dx, y, dur); };
  const click = async (loc, dur = 0.8) => { const [x, y] = await center(loc); await moveTo(x, y, dur); await sleep(0.25); await page.mouse.down(); await sleep(0.08); await page.mouse.up(); };
  async function sweep(loc, dur = 1.6) { const [, y, b] = await center(loc); await moveTo(b.x + 6, y, 0.6); await moveTo(b.x + Math.min(b.width - 6, 900), y, dur); }
  let tilesBlocked = false;
  async function waitTiles() {
    if (tilesBlocked) return false; // draft mode: already known to fail, don't stall the scene
    const ok = await page.waitForFunction(() => { const t = window.__nwisTiles; return t && t.loadedOnce && !t.loading && t.tilesLoaded > 0; }, null, { timeout: 8000 }).then(() => true).catch(() => false);
    tilesBlocked = !ok;
    if (!ok && !ALLOW_BLANK) throw new Error('Map tiles did not load (tile.openstreetmap.org). Not recording a blank map – rerun with internet access, or --allow-blank-tiles for a draft.');
    return ok;
  }
  const nav = (label) => page.locator('nav a', { hasText: label });
  // Sync marker: a black square in the bottom-right corner, found later in the video to measure recording lag.
  const FLASH = { x: 1860, y: 1030, s: 40 };
  async function flash() {
    await page.evaluate((f) => {
      const d = document.createElement('div');
      d.id = '__sync'; d.style.cssText = `position:fixed;left:${f.x}px;top:${f.y}px;width:${f.s}px;height:${f.s}px;background:#000;z-index:2147483647`;
      document.body.appendChild(d);
    }, FLASH);
    const t = now();
    await sleep(0.8);
    await page.evaluate(() => document.getElementById('__sync')?.remove());
    await sleep(0.8);
    return t;
  }
  const chartPx = (name, fn) => page.evaluate(([n, f]) => new Function('c', f)(window.__nwisCharts[n]), [name, fn]);

  // Pre-roll (trimmed off): load the dashboard once so tiles and chunks are cached, then park on Documents.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await waitTiles();
  await nav('Document Processing').click();
  await page.waitForLoadState('networkidle');
  await page.mouse.move(mx, my);
  await sleep(1.0);
  const flashes = [await flash()];

  const marks = [];
  let tilesOk = true;
  async function scene(s, fn) {
    const start = now();
    marks.push({ ...s, start });
    await fn();
    const left = s.dur - (now() - start);
    if (left > 0) await sleep(left);
    else console.warn(`scene ${s.id} overran by ${(-left).toFixed(1)} s`);
  }
  const S = Object.fromEntries(SCENES.map((s) => [s.id, s]));

  await scene(S[3], async () => {
    await sleep(1.2);
    await hover(page.locator('text=Processing pipeline'), 1.0);
    await sleep(1.2);
    await click(page.locator('tr', { hasText: 'DDR – OW-02 – 14-Mar-2019.pdf' }));
    await sleep(1.8);
    await sweep(page.locator('.doc-page mark.hl').nth(1), 1.6);
    await sleep(1.0);
    await hover(page.locator('td', { hasText: 'Pumped 50 bbl LCM pill' }).first(), 1.0, -150);
    await sleep(1.5);
  });
  await scene(S[4], async () => {
    await click(nav('Engineer Review'), 0.7);
    await sleep(1.2);
    await sweep(page.locator('.doc-page mark.hl').first(), 1.5);
    await sleep(0.8);
    await click(page.locator('button', { hasText: /^Approve$/ }), 0.8);
    await sleep(0.8);
    await hover(page.locator('text=Reviewed today'), 0.8);
  });
  await scene(S[5], async () => {
    await click(nav('Dashboard'));
    tilesOk = (await waitTiles()) && tilesOk;
    await sleep(0.5);
    await hover(page.locator('text=Bit depth').first(), 0.8, 40);
    await sleep(1.3);
    await hover(page.locator('text=Connected (simulated)'), 0.8);
    await sleep(1.3);
    const slider = page.locator('input[type=range]');
    const [, sy, b] = await center(slider);
    const xOf = (v) => b.x + 8 + ((v - 1) / 19) * (b.width - 16);
    await moveTo(xOf(10), sy, 0.9);
    await sleep(0.3);
    await page.mouse.down();
    for (const v of [5, 15, 10]) { await moveTo(xOf(v), sy, 1.2); await sleep(v === 10 ? 0.5 : 1.5); }
    await page.mouse.up();
    await sleep(0.8);
    await click(page.locator('button.chip', { hasText: 'Mud Loss' }), 0.7);
    await sleep(2.0);
    await click(page.locator('button.chip', { hasText: /^All/ }), 0.7);
    await sleep(0.6);
  });
  await scene(S[6], async () => {
    // The OW-02 marker sits just left of its permanent label.
    const label = page.locator('.well-label', { hasText: /^OW-02$/ });
    const [, ly, lb] = await center(label);
    await moveTo(lb.x - 13, ly, 1.1);
    await sleep(0.4);
    await page.mouse.down(); await sleep(0.08); await page.mouse.up();
    await sleep(2.0);
    const events = page.locator('.nwis-popup li');
    await hover(events.nth(0), 1.0, -60);
    await sleep(2.2);
    await hover(events.nth(1), 0.9, -60);
    await sleep(2.0);
  });
  await scene(S[7], async () => {
    await click(page.locator('.nwis-popup button', { hasText: 'View in Depth Correlation' }));
    await sleep(2.2);
    await click(page.locator('button', { hasText: 'True Vertical' }));
    await sleep(2.0);
    await click(page.locator('label', { hasText: 'Align by formation top' }).locator('input'));
    await sleep(2.0);
    const pt = await chartPx('depth', `
      const s = c.getOption().series.find((x) => x.name === 'Mud Loss');
      const d = s.data.find((x) => x.well === 'OW-02');
      const p = c.convertToPixel({ seriesName: 'Mud Loss' }, d.value);
      const r = c.getDom().getBoundingClientRect();
      return [r.left + p[0] + 12, r.top + p[1]];`);
    await moveTo(pt[0], pt[1], 1.2);
    await hold(3.2); // keep the tooltip up while the chart redraws with the live bit depth
  });
  await scene(S[8], async () => {
    await click(nav('Risk Prediction'));
    await sleep(2.0);
    const pt = await chartPx('risk', `
      const o = c.getOption();
      const xi = o.xAxis[0].data.indexOf('2850');
      const yi = o.yAxis[0].data.indexOf('Mud Loss');
      const p = c.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [xi, yi]);
      const r = c.getDom().getBoundingClientRect();
      return [r.left + p[0], r.top + p[1]];`);
    await moveTo(pt[0], pt[1], 1.3);
    await sleep(0.5);
    // The chart redraws every 3 s with the live bit depth; retry if a click lands mid-redraw.
    for (let i = 0; i < 3; i++) {
      await page.mouse.down(); await sleep(0.08); await page.mouse.up();
      if (await page.locator('aside li').first().waitFor({ timeout: 1500 }).then(() => true).catch(() => false)) break;
    }
    await sleep(1.2);
    const factors = page.locator('aside li');
    for (let i = 0; i < 3; i++) { await hover(factors.nth(i), 0.8, -80); await sleep(1.1); }
  });
  await scene(S[9], async () => {
    await click(nav('Live Alerts'));
    await sleep(1.8);
    await hover(page.locator('text=Torque').first(), 0.9, 40);
    await sleep(1.8);
    await hover(page.locator('button', { hasText: 'HIGH' }).first(), 1.0);
    await sleep(2.0);
    const high = page.locator('.card', { hasText: 'Mud losses expected in Tipam sand' }).last();
    await sweep(high.locator('p'), 1.5);
    await sleep(1.4);
    await hover(high.locator('text=What worked in offset wells'), 0.9, 120);
    await sleep(2.2);
  });
  await scene(S[10], async () => {
    const high = page.locator('.card', { hasText: 'Mud losses expected in Tipam sand' }).last();
    await click(high.locator('button', { hasText: 'Why?' }));
    await sleep(2.0);
    await sweep(page.locator('text=Partial losses were recorded').first(), 2.0);
    await sleep(1.5);
    const src = page.locator('ol li button').first();
    await hover(src, 1.0);
    await sleep(1.0);
    await click(src, 0.4);
    await sleep(1.6);
    await sweep(page.locator('[role=dialog] mark.hl').nth(1), 1.6);
    await sleep(2.2);
    await click(page.locator('[role=dialog] button', { hasText: 'Close' }));
    await sleep(1.2);
  });
  await scene(S[11], async () => {
    await click(nav('Dashboard'), 0.9);
    await sleep(1.2);
    await click(page.locator('header button', { hasText: 'Field Engineer' }));
    await sleep(2.5);
  });
  const end = now();
  await sleep(0.3);
  flashes.push(await flash());
  await context.close();
  const webm = readdirSync(WORK).filter((f) => f.endsWith('.webm')).map((f) => join(WORK, f)).pop();
  renameSync(webm, join(WORK, 'recording.webm'));
  return { marks, end, tilesOk, flashes, flashBox: FLASH };
}

// ---------------------------------------------------------------- 3. assemble
// Finds the sync flashes in the recording and returns a function mapping script time -> video time.
function syncMap(flashes, box) {
  const raw = execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', join(WORK, 'recording.webm'),
    '-vf', `fps=${FPS},crop=${box.s - 10}:${box.s - 10}:${box.x + 5}:${box.y + 5},scale=1:1:flags=area,format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 26 });
  const onsets = [];
  for (let i = 1; i < raw.length; i++) if (raw[i] < 60 && raw[i - 1] >= 60) onsets.push(i / FPS);
  if (onsets.length < flashes.length) throw new Error(`sync flashes not found in recording (found ${onsets.length})`);
  const [v0, v1] = [onsets[0], onsets[onsets.length - 1]];
  const [w0, w1] = [flashes[0], flashes[flashes.length - 1]];
  const k = (v1 - v0) / (w1 - w0);
  console.log(`sync: lag ${(v0 - w0).toFixed(2)} s at start, ${(v1 - w1).toFixed(2)} s at end (scale ${k.toFixed(4)})`);
  return { toVideo: (w) => v0 + (w - w0) * k, k };
}

function build(rec) {
  // The recording's timeline can run slower than real time; cut it using video times, then play it back
  // at speed k so the recorded segment matches the scripted (wall-clock) scene lengths again.
  const { toVideo, k } = syncMap(rec.flashes, rec.flashBox);
  const { marks, end, tilesOk } = rec;
  const recStart = marks[0].start;
  const recLen = end - recStart;
  const vStart = toVideo(recStart), vLen = toVideo(end) - vStart;
  const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-an'];
  const still = (name, dur, outName) =>
    ff(['-loop', '1', '-framerate', String(FPS), '-t', String(dur), '-i', join(WORK, `card_${name}.png`),
      '-vf', `format=yuv420p,fade=in:st=0:d=0.6:color=white,fade=out:st=${dur - 0.6}:d=0.6:color=white`, ...enc, join(WORK, outName)]);
  still('title', CARDS.title, 'p1.mp4');
  still('problem', CARDS.problem, 'p2.mp4');
  still('closing', CARDS.closing, 'p4.mp4');
  ff(['-ss', vStart.toFixed(3), '-t', vLen.toFixed(3), '-i', join(WORK, 'recording.webm'),
    '-vf', `setpts=(PTS-STARTPTS)/${k.toFixed(5)},fps=${FPS},scale=${W}:${H}:flags=lanczos,format=yuv420p,fade=in:st=0:d=0.5:color=white,fade=out:st=${(recLen - 0.5).toFixed(3)}:d=0.5:color=white`, ...enc, join(WORK, 'p3.mp4')]);

  const offset = CARDS.title + CARDS.problem;
  const timed = marks.map((m, i) => ({ ...m, a: offset + (m.start - recStart), b: offset + ((marks[i + 1]?.start ?? end) - recStart) }));
  const total = offset + recLen + CARDS.closing;
  const inputs = ['-i', join(WORK, 'p1.mp4'), '-i', join(WORK, 'p2.mp4'), '-i', join(WORK, 'p3.mp4'), '-i', join(WORK, 'p4.mp4')];
  // Each caption appears once the scene's page is on screen (scenes open with a menu click) and leaves just before the next.
  const win = timed.map((m) => ({ a: m.a + 1.2, d: m.b - m.a - 1.6 }));
  timed.forEach((m, i) => inputs.push('-loop', '1', '-framerate', String(FPS), '-t', win[i].d.toFixed(3), '-i', join(WORK, `cap_${m.id}.png`)));
  let fc = '[0:v][1:v][2:v][3:v]concat=n=4:v=1:a=0[v0]';
  timed.forEach((m, i) => {
    const { a, d } = win[i];
    fc += `;[${4 + i}:v]format=rgba,fade=in:st=0:d=0.35:alpha=1,fade=out:st=${(d - 0.35).toFixed(2)}:d=0.35:alpha=1,setpts=PTS+${a.toFixed(3)}/TB[c${i}]`;
    fc += `;[v${i}][c${i}]overlay=0:0:eof_action=pass[v${i + 1}]`;
  });
  ff([...inputs, '-filter_complex', fc, '-map', `[v${timed.length}]`, '-t', total.toFixed(3), ...enc, '-movflags', '+faststart', join(OUT, 'nwis_demo.mp4')]);

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
  const rows = [
    { id: 1, name: 'Title card', a: 0, b: CARDS.title },
    { id: 2, name: 'Problem card', a: CARDS.title, b: offset },
    ...timed,
    { id: 12, name: 'Closing card', a: offset + recLen, b: total },
  ];
  const txt = [
    'NWIS demo video – scene timings (video/nwis_demo.mp4, 1920x1080, 30 fps, no audio)',
    `Total length: ${fmt(total)}${tilesOk ? '' : '   [DRAFT: map tiles did not load – map scenes have a blank background]'}`,
    '',
    'Scene  Start     End       Length  Content / caption',
    ...rows.map((r) => `${String(r.id).padStart(5)}  ${fmt(r.a).padEnd(8)}  ${fmt(r.b).padEnd(8)}  ${(r.b - r.a).toFixed(1).padStart(5)} s  ${r.name}${r.caption ? ` – "${r.caption}"` : ''}`),
  ].join('\n') + '\n';
  writeFileSync(join(OUT, 'scene_timings.txt'), txt);
  console.log(txt);
  return rows;
}

// ---------------------------------------------------------------- main
mkdirSync(OUT, { recursive: true });
if (args.step === 'build') {
  // Re-export from an existing recording (video/.work) without recording again.
  build(JSON.parse(readFileSync(join(WORK, 'marks.json'), 'utf8')));
} else {
  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(WORK, { recursive: true });
  const browser = await chromium.launch({ executablePath });
  await renderStills(browser);
  const rec = await record(browser);
  await browser.close();
  writeFileSync(join(WORK, 'marks.json'), JSON.stringify(rec, null, 2));
  build(rec);
}
