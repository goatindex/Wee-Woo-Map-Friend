// Minimal Puppeteer script to capture real screenshots of the app
// Requires the site to be served locally (e.g., python -m http.server 8000)

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE = process.env.APP_BASE || 'http://127.0.0.1:8000';
const OUTDIR = path.join(__dirname, '..', 'docs', 'assets');

async function ensureOutDir() {
  await fs.promises.mkdir(OUTDIR, { recursive: true });
}

async function capture() {
  await ensureOutDir();
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();

  // Faster/quiet
  page.setDefaultTimeout(15000);

  // Go to the app
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle2' });

  // Give Leaflet time to settle
  await page.waitForTimeout(800);

  // Open docs drawer for a consistent sidebar look
  await page.evaluate(() => {
    const evt = new CustomEvent('sidebar-tool-click', { detail: { id: 'sidebarBtn2', index: 2 }});
    document.dispatchEvent(evt);
  });
  await page.waitForTimeout(400);

  // Screenshot 1: sidebar + All Active collapsed state
  const shot1 = path.join(OUTDIR, 'sidebar-all-active.png');
  await page.screenshot({ path: shot1, fullPage: false });

  // Interactions: search and activate first result if present
  await page.focus('#globalSidebarSearch');
  await page.type('#globalSidebarSearch', 'City', { delay: 20 });
  await page.waitForTimeout(400);

  // Click the first dropdown item if exists
  await page.evaluate(() => {
    const dd = document.getElementById('sidebarSearchDropdown');
    const first = dd && dd.querySelector('.dropdown-item');
    if (first) first.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });
  await page.waitForTimeout(700);

  // Screenshot 2: search/activate result state
  const shot2 = path.join(OUTDIR, 'search-activate.png');
  await page.screenshot({ path: shot2, fullPage: false });

  await browser.close();
  console.log('Saved:', shot1, 'and', shot2);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
