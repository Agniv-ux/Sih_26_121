// Capture the screenshot-mode presets at 1920×1080 @2x for the PPT.
// Usage: npm run build && npm run preview     (in another terminal)
//        npm run screenshots
// Options: --url=http://localhost:4173  --out=screenshots  --only=01,03
//          --allow-blank-tiles   QA only: saves map shots even if tiles failed (never use for slides)
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const BASE = args.url || 'http://localhost:4173';
const OUT = args.out || 'screenshots';
const ALLOW_BLANK = !!args['allow-blank-tiles'];

const SHOTS = [
  { file: '01_dashboard.png', path: '/?shot=1', map: true },
  { file: '02_dashboard_popup.png', path: '/?shot=1&popup=OW-02', map: true },
  { file: '03_alerts.png', path: '/alerts?shot=1' },
  { file: '04_depth.png', path: '/depth?shot=1' },
  { file: '05_risk.png', path: '/risk?shot=1&interval=2850' },
  { file: '06_ask.png', path: '/ask?shot=1&q=tipam' },
  { file: '07_documents.png', path: '/documents?shot=1&doc=1' },
  { file: '08_review.png', path: '/review?shot=1' },
].filter((s) => !args.only || String(args.only).split(',').some((p) => s.file.startsWith(p)));

const executablePath = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath });
mkdirSync(OUT, { recursive: true });

const failures = [];
for (const shot of SHOTS) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const tileFailures = [];
  const isTile = (u) => u.includes('basemaps.cartocdn.com') || u.includes('tile.openstreetmap.org');
  page.on('requestfailed', (r) => isTile(r.url()) && tileFailures.push(r.url()));
  page.on('response', (r) => isTile(r.url()) && !r.ok() && tileFailures.push(`${r.status()} ${r.url()}`));

  await page.goto(BASE + shot.path, { waitUntil: 'networkidle' });
  await page.mouse.move(1919, 1079);
  await page.waitForFunction(() => window.__nwisReady === true, null, { timeout: 20000 });

  if (shot.map) {
    const tilesOk = await page
      .waitForFunction(() => {
        const t = window.__nwisTiles;
        return t && t.loadedOnce && !t.loading && t.tilesLoaded > 0;
      }, null, { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    const status = await page.evaluate(() => window.__nwisTiles);
    if ((!tilesOk || tileFailures.length > 0 || status.errors > 0) && !ALLOW_BLANK) {
      console.error(`[${shot.file}] Map tiles did not load (loaded=${status.tilesLoaded}, errors=${status.errors}, failed requests=${tileFailures.length}). Not saving a blank map.`);
      failures.push(shot.file);
      await page.close();
      continue;
    }
  }
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const file = join(OUT, shot.file);
  await page.screenshot({ path: file, type: 'png' });
  console.log(`saved ${file}${shot.map && tileFailures.length ? '  (TILES MISSING – QA only)' : ''}`);
  await page.close();
}
await browser.close();
if (failures.length) {
  console.error(`\nNot saved (map tiles unavailable): ${failures.join(', ')}. Check internet access to tile.openstreetmap.org.`);
  process.exit(1);
}
