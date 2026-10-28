#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from './dev-deps.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'review/screenshots');
mkdirSync(outDir, { recursive: true });
const base = 'http://127.0.0.1:8080';
const server = spawn(process.execPath, ['tools/serve.mjs', 'docs', '8080'], { cwd: root, stdio: 'ignore' });
const notes = [];
const log = (line) => { notes.push(line); console.log(line); };

function waitForServer() {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = async () => {
      try {
        const res = await fetch(`${base}/`);
        if (res.ok) return resolve();
      } catch { /* retry */ }
      if (Date.now() - started > 8000) return reject(new Error('server did not start'));
      setTimeout(tick, 150);
    };
    tick();
  });
}

async function shot(page, name) {
  await page.screenshot({ path: join(outDir, name) });
  log(`shot ${name}`);
}

async function clickables(page, label) {
  const hrefs = await page.$$eval('a[href]', (nodes) => nodes.map((a) => a.getAttribute('href')));
  const bad = [];
  for (const href of hrefs) {
    if (!href || href.startsWith('tel:') || href.startsWith('sms:') || href.startsWith('#')) continue;
    const url = new URL(href, page.url()).href;
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (!res.ok && res.status !== 404) bad.push(`${res.status} ${href}`);
      if (href.startsWith('/') || href.startsWith('.') || !/^https?:/.test(href)) {
        if (res.status === 404 && !url.includes('404')) bad.push(`404 ${href}`);
      }
    } catch (error) {
      bad.push(`ERR ${href} ${error.message}`);
    }
  }
  log(`${label} links ${hrefs.length}, problems ${bad.length}${bad.length ? `: ${bad.slice(0, 8).join(' | ')}` : ''}`);
}

const { chromium } = loadPlaywright();
await waitForServer();
const browser = await chromium.launch({ headless: true });
try {
  for (const [tag, viewport] of [['1440', { width: 1440, height: 900 }], ['390', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    await shot(page, `home-top-${tag}.png`);
    await page.evaluate((fraction) => {
      const hero = document.querySelector('[data-hero-slot]');
      const span = Math.max(1, hero.offsetHeight - innerHeight);
      window.scrollTo({ top: hero.offsetTop + span * fraction, behavior: 'instant' });
    }, 0.45);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await shot(page, `home-gem-mid-${tag}.png`);
    await page.evaluate(() => {
      const hero = document.querySelector('[data-hero-slot]');
      const span = Math.max(1, hero.offsetHeight - innerHeight);
      window.scrollTo({ top: hero.offsetTop + span, behavior: 'instant' });
    });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForTimeout(450);
    const lit = await page.locator('.gem-facet.is-on').count();
    log(`gem facets lit at end ${tag}: ${lit}`);
    await shot(page, `home-gem-full-${tag}.png`);
    await page.locator('[data-tuesday]').scrollIntoViewIfNeeded();
    await shot(page, `home-tuesday-${tag}.png`);
    await page.locator('[data-calc="leak"]').scrollIntoViewIfNeeded();
    await shot(page, `home-calc-${tag}.png`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    log(`home overflow ${tag}: ${overflow}px`);
    if (tag === '1440') await clickables(page, 'home');
    await page.goto(`${base}/systems/ai-receptionist/`, { waitUntil: 'networkidle' });
    await shot(page, `system-receptionist-${tag}.png`);
    if (tag === '1440') await clickables(page, 'receptionist');
    await page.close();
  }

  const wide = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await wide.goto(`${base}/the-numbers/`, { waitUntil: 'networkidle' });
  await wide.waitForTimeout(900);
  await shot(wide, 'numbers-1440.png');
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await phone.goto(`${base}/the-numbers/`, { waitUntil: 'networkidle' });
  await shot(phone, 'numbers-390.png');

  const audit = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await audit.goto(`${base}/free-audit/`, { waitUntil: 'networkidle' });
  await shot(audit, 'audit-empty-390.png');
  await audit.locator('input[name="name"]').fill('QA Probe');
  await audit.locator('input[name="phone"]').fill('4065550199');
  await audit.locator('button[type="submit"]').click();
  await audit.locator('[data-handoff]').waitFor({ state: 'visible' });
  await shot(audit, 'audit-handoff-390.png');
  const handoff = await audit.locator('[data-handoff]').innerText();
  log(`handoff text: ${handoff.split('\n')[0]}`);

  const missing = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const res = await missing.goto(`${base}/not-a-page`, { waitUntil: 'networkidle' });
  log(`404 status ${res.status()}`);
  await shot(missing, 'missing-390.png');

  const still = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const reduced = await still.newPage();
  await reduced.goto(`${base}/`, { waitUntil: 'networkidle' });
  await shot(reduced, 'home-reduced-motion-1440.png');
  const complete = await reduced.evaluate(() => document.querySelector('[data-hero-slot]').classList.contains('is-complete'));
  log(`reduced motion gem complete: ${complete}`);

  const keys = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await keys.goto(`${base}/`, { waitUntil: 'networkidle' });
  await keys.locator('.nav-toggle').click();
  const menuOpen = await keys.locator('#nav-menu').evaluate((el) => el.classList.contains('is-open'));
  await keys.locator('.nav-systems-btn').click();
  const sysOpen = await keys.locator('#nav-systems-list').evaluate((el) => el.classList.contains('is-open'));
  await keys.keyboard.press('Escape');
  const closed = await keys.evaluate(() => ({
    menu: document.querySelector('#nav-menu').classList.contains('is-open'),
    sys: document.querySelector('#nav-systems-list').classList.contains('is-open'),
  }));
  log(`keyboard menu opened ${menuOpen}, systems opened ${sysOpen}, after Esc menu ${closed.menu} systems ${closed.sys}`);
  await keys.keyboard.press('Tab');
  const first = await keys.evaluate(() => document.activeElement && (document.activeElement.textContent || document.activeElement.getAttribute('aria-label') || document.activeElement.className || '').trim().slice(0, 80));
  log(`first tab target: ${first}`);

  const back = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await back.goto(`${base}/free-audit/`, { waitUntil: 'networkidle' });
  await back.locator('input[name="name"]').fill('Kept Name');
  await back.evaluate(() => history.pushState({}, '', `${location.href}#qa`));
  await back.goBack({ waitUntil: 'domcontentloaded' });
  const kept = await back.locator('input[name="name"]').inputValue();
  log(`back-navigation name: ${kept}`);
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(join(root, 'review/qa-browser.txt'), `${notes.join('\n')}\n`);
