// Capture the four screenshot-mode views at 1920×1080 @2x.
// Usage: npm run build && npm run preview   (in another terminal)
//        npm run screenshots
// Options: --url=http://localhost:4173  --out=screenshots  --allow-blank-tiles (QA only, never for slides)
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
const SHOTS = (args.only ? String(args.only).split(',') : ['dashboard', 'popup', 'depth', 'ask']);

const executablePath = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath });
mkdirSync(OUT, { recursive: true });

let failed = false;
for (const shot of SHOTS) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const tileFailures = [];
  page.on('requestfailed', (r) => r.url().includes('basemaps.cartocdn.com') && tileFailures.push(r.url()));
  page.on('response', (r) => r.url().includes('basemaps.cartocdn.com') && !r.ok() && tileFailures.push(`${r.status()} ${r.url()}`));

  await page.goto(`${BASE}/?shot=${shot}`, { waitUntil: 'networkidle' });
  await page.mouse.move(1919, 1079);
  await page.waitForFunction(() => window.__nwisReady === true, null, { timeout: 20000 });

  // Wait for Leaflet to report every visible tile loaded (also after popup auto-pan).
  const tilesOk = await page
    .waitForFunction(() => {
      const t = window.__nwisTiles;
      return t && t.loadedOnce && !t.loading && t.tilesLoaded > 0;
    }, null, { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  const status = await page.evaluate(() => window.__nwisTiles);
  if ((!tilesOk || tileFailures.length > 0 || status.errors > 0) && !ALLOW_BLANK) {
    console.error(`[${shot}] Map tiles did not load (loaded=${status.tilesLoaded}, errors=${status.errors}, failed requests=${tileFailures.length}).`);
    console.error('Not saving a screenshot with a blank map. Check internet access to basemaps.cartocdn.com.');
    failed = true;
    await page.close();
    break;
  }
  const file = join(OUT, `${shot}.png`);
  await page.screenshot({ path: file, type: 'png' });
  console.log(`saved ${file}${tileFailures.length ? ' (tiles missing – QA only)' : ''}`);
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
