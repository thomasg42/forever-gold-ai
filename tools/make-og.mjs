#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from './dev-deps.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logo = readFileSync(join(root, 'src/assets/brand/forever-gold-ai-logo.png')).toString('base64');
const font = readFileSync(join(root, 'src/assets/fonts/playfair-display-latin-800.woff2')).toString('base64');
const { chromium } = loadPlaywright();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>
    @font-face { font-family: Playfair; src: url(data:font/woff2;base64,${font}); font-weight: 800; }
    * { box-sizing: border-box; }
    body { margin: 0; width: 1200px; height: 630px; background: #0A0A0B; color: #F7F3EA; }
    .frame { position: absolute; inset: 28px; border: 1px solid #B8862B; }
    .inner { position: absolute; inset: 40px; border: 1px solid #D4A537; display: flex; align-items: center; gap: 48px; padding: 48px; }
    img { width: 280px; height: 280px; object-fit: contain; background: radial-gradient(circle, rgba(212,165,55,0.45), rgba(212,165,55,0) 70%); }
    h1 { font: 800 68px/1.05 Playfair, serif; margin: 0; max-width: 680px; }
    p { color: #F3D27A; letter-spacing: 0.14em; text-transform: uppercase; font: 600 18px/1.4 Inter, sans-serif; margin: 0 0 18px; }
  </style></head><body>
    <div class="frame"></div>
    <div class="inner">
      <img src="data:image/png;base64,${logo}" alt="">
      <div>
        <p>Forever Gold AI</p>
        <h1>More money. More time. Fewer mistakes.</h1>
      </div>
    </div>
  </body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, 'src/assets/og.png') });
  console.log('og.png written at 1200x630');
} finally {
  await browser.close();
}
