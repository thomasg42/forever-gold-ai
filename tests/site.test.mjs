import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAIRS, SITE, liveStats, shownWork } from '../site.config.mjs';
import { hoursBack, missedCallLeak } from '../src/assets/calc.js';
import { facetState } from '../src/assets/site.js';
import { applyPrefill, bootForms, smsText } from '../src/assets/forms.js';
import { bootCalcs } from '../src/assets/site.js';
import { loadLinkedom } from '../tools/dev-deps.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'docs');
const { parseHTML } = loadLinkedom();

function relPosix(from, file) {
  return relative(from, file).replace(/\\/g, '/');
}
function samePayload(disk, fresh, rel) {
  if (disk.equals(fresh)) return true;
  if (/\.(png|jpe?g|gif|webp|ico|woff2?)$/i.test(rel)) return false;
  return disk.toString('utf8').replace(/\r\n/g, '\n') === fresh.toString('utf8').replace(/\r\n/g, '\n');
}
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
function words(text) {
  return String(text).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, ' and ').replace(/&[^;]+;/g, ' ').split(/\s+/).filter(Boolean);
}
function grams(text) {
  const list = words(text).map((w) => w.toLowerCase().replace(/[^a-z0-9-]/g, '')).filter(Boolean);
  const out = [];
  for (let i = 0; i <= list.length - 5; i += 1) out.push(list.slice(i, i + 5).join(' '));
  return out;
}
function htmlFiles() {
  return walk(docs).filter((f) => f.endsWith('.html'));
}
function lum(hex) {
  const n = hex.replace('#', '');
  const ch = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function ratio(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function read(rel) {
  return readFileSync(join(docs, rel), 'utf8');
}
function doc(rel) {
  return parseHTML(read(rel)).document;
}
function allowedExternal(decoded) {
  const allow = new Set([
    ...SITE.socials.map((item) => item.url),
    ...SITE.stats.map((stat) => stat.sourceUrl),
    ...shownWork().map((item) => item.url),
  ]);
  if (SITE.bookingUrl) allow.add(SITE.bookingUrl);
  if (allow.has(decoded)) return true;
  const u = new URL(decoded);
  const site = new URL(SITE.url);
  const prefix = site.pathname.replace(/\/$/, '');
  return u.origin === site.origin && (u.pathname === site.pathname || u.pathname.startsWith(`${prefix}/`));
}
function bodyText(html) {
  const { document } = parseHTML(html);
  document.querySelectorAll('script, style, .calc, .source').forEach((node) => node.remove());
  return document.body.textContent.replace(/\s+/g, ' ');
}
function submitForm(form) {
  const view = form.ownerDocument.defaultView;
  const ev = new view.Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(ev);
}
function fillLead(form) {
  form.querySelector('[name="name"]').value = 'Ada Owner';
  form.querySelector('[name="phone"]').value = '4065550144';
  form.querySelector('[name="email"]').value = 'ada@example.com';
  const business = form.querySelector('[name="business"]');
  if (business) business.value = 'North Shop';
  const industry = form.querySelector('[name="industry"]');
  if (industry) industry.querySelectorAll('option')[1].selected = true;
  const team = form.querySelector('[name="teamSize"]');
  if (team) [...team.querySelectorAll('option')].find((option) => option.value === 'Just me').selected = true;
  const need = form.querySelector('[name="needs"]');
  if (need) need.checked = true;
  const pref = form.querySelector('[name="contactPref"][value="text"]');
  if (pref) pref.checked = true;
  form.querySelector('[name="notes"]').value = 'Calls pile up after lunch.';
}

test('docs matches a fresh production build', () => {
  const out = mkdtempSync(join(tmpdir(), 'fgai-build-'));
  try {
    execFileSync(process.execPath, ['build.mjs', '--out', out], { cwd: root, stdio: 'pipe' });
    const fresh = walk(out).map((f) => relPosix(out, f)).sort();
    const have = walk(docs).map((f) => relPosix(docs, f)).sort();
    assert.deepEqual(have, fresh);
    for (const rel of fresh) {
      assert.equal(samePayload(readFileSync(join(docs, rel)), readFileSync(join(out, rel)), rel), true, rel);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('dev build refuses docs/', () => {
  assert.throws(() => {
    execFileSync(process.execPath, ['build.mjs', '--dev', '--out', docs], { cwd: root, stdio: 'pipe' });
  });
});

test('seo, assets, links, and page weight', () => {
  const titles = new Set();
  const descriptions = new Set();
  const css = statSync(join(docs, 'assets/site.css')).size;
  assert.ok(css < 60 * 1024, `css ${css}`);
  for (const file of walk(join(docs, 'assets')).filter((f) => f.endsWith('.js'))) {
    const size = statSync(file).size;
    assert.ok(size < 50 * 1024, `${file} ${size}`);
  }
  for (const file of htmlFiles()) {
    const html = readFileSync(file, 'utf8');
    const size = statSync(file).size;
    assert.ok(size < 70 * 1024, `${file} ${size}`);
    assert.match(html, /lang="en-US"/);
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    const desc = html.match(/name="description" content="([^"]*)"/)[1];
    assert.ok(title.length <= 60, title);
    assert.ok(desc.length >= 110 && desc.length <= 160, `${desc.length} ${file}`);
    assert.equal(titles.has(title), false, title);
    assert.equal(descriptions.has(desc), false, desc);
    titles.add(title);
    descriptions.add(desc);
    assert.match(html, /rel="canonical"/);
    assert.match(html, /property="og:image"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.match(html, /noindex, nofollow/);
    assert.match(html, /rel="preload"/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
    assert.match(html, /tel:\+14066986693/);
    assert.match(html, /sms:\+14066986693/);
    assert.match(html, /free-audit\/?/);
    assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|googletagmanager|google-analytics/);
    assert.doesNotMatch(html, /<video\b|autoplay/i);
    for (const block of html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []) {
      JSON.parse(block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
    }
    const { document } = parseHTML(html);
    for (const img of document.querySelectorAll('img')) {
      assert.ok(Number(img.getAttribute('width')) > 0, file);
      assert.ok(Number(img.getAttribute('height')) > 0, file);
    }
    const pageRel = relPosix(docs, file);
    const goldieScript = 'https://unpkg.com/@elevenlabs/convai-widget-embed@0.20.0/dist/index.js';
    for (const script of document.querySelectorAll('script[src]')) {
      const src = script.getAttribute('src');
      if (/^https?:/i.test(src)) {
        assert.equal(pageRel, 'systems/ai-receptionist/index.html', file);
        assert.equal(src, goldieScript);
      }
    }
    const dir = dirname(file);
    for (const href of [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1])) {
      if (/^(tel:|sms:|mailto:|#|data:)/.test(href)) continue;
      const decoded = href.replace(/&amp;/g, '&');
      if (/^https?:/.test(decoded)) {
        if (decoded === 'https://unpkg.com/@elevenlabs/convai-widget-embed@0.20.0/dist/index.js') {
          assert.equal(relPosix(docs, file), 'systems/ai-receptionist/index.html', file);
          continue;
        }
        assert.equal(allowedExternal(decoded), true, decoded);
        continue;
      }
      const clean = decoded.split('#')[0].split('?')[0];
      const url = new URL(clean, `http://local/${relPosix(docs, dir)}/`);
      let rel = decodeURIComponent(url.pathname).replace(/^\//, '');
      if (rel.endsWith('/')) rel += 'index.html';
      if (rel === '') rel = 'index.html';
      assert.equal(existsSync(join(docs, rel)), true, `${file} -> ${href}`);
    }
  }
  assert.match(read('robots.txt'), /Disallow: \//);
  assert.doesNotMatch(read('assets/config.js'), /calendly/i);
  assert.ok(read('assets/config.js').includes(`"leadEndpoint":${JSON.stringify(SITE.leadEndpoint)}`));
  const og = readFileSync(join(docs, 'assets/og.png'));
  assert.equal(og.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(og.readUInt32BE(16), 1200);
  assert.equal(og.readUInt32BE(20), 630);
  assert.ok(og.length < 300 * 1024, og.length);
});

test('schema stays inside confirmed fields', () => {
  const knows = SITE.systems.map((system) => system.h1);
  for (const file of htmlFiles()) {
    const rel = relPosix(docs, file);
    const blocks = [...readFileSync(file, 'utf8').matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const types = blocks.map((b) => b['@type']);
    const business = blocks.filter((b) => b['@type'] === 'ProfessionalService');
    const wantsBusiness = rel === 'index.html' || rel.startsWith('about/') || rel.startsWith('contact/');
    assert.equal(business.length, wantsBusiness ? 1 : 0, rel);
    for (const node of business) {
      assert.equal(node['@id'], `${SITE.url}/#business`);
      assert.equal(node.name, SITE.name);
      assert.equal(node.url, SITE.url);
      assert.equal(node.telephone, '+1-406-698-6693');
      assert.equal(node.slogan, SITE.motto);
      assert.equal(node.founder.name, 'Thomas Gutierrez');
      assert.deepEqual(node.areaServed.map((item) => item.name), ['Montana', 'US']);
      assert.equal(node.address.addressLocality, 'Bozeman');
      assert.equal(node.address.addressRegion, 'MT');
      assert.equal(node.address.addressCountry, 'US');
      assert.equal(node.address.streetAddress, undefined);
      assert.deepEqual(node.sameAs, SITE.socials.map((item) => item.url));
      assert.match(node.logo, /forever-gold-ai-logo\.png$/);
      assert.deepEqual(node.knowsAbout, knows);
      for (const key of ['price', 'priceRange', 'openingHours', 'aggregateRating', 'review', 'geo']) {
        assert.equal(node[key], undefined, key);
      }
    }
    if (rel === 'index.html') assert.ok(types.includes('WebSite'));
    if (rel.startsWith('systems/') && rel !== 'systems/index.html') assert.ok(types.includes('Service'), rel);
    if (rel.startsWith('faq/')) assert.ok(types.includes('FAQPage'));
    if (rel.startsWith('about/')) assert.ok(types.includes('AboutPage'));
    if (rel.startsWith('contact/') || rel.startsWith('free-audit/')) assert.ok(types.includes('ContactPage'));
    if (rel !== 'index.html' && rel !== '404.html') assert.ok(types.includes('BreadcrumbList'), rel);
  }
});

test('hero gem, footer, and claims gate', () => {
  const home = doc('index.html');
  const hero = home.querySelector('[data-hero-slot="v1-gem"]');
  assert.ok(hero);
  assert.equal(hero.querySelector('h1').textContent, SITE.h1);
  assert.equal(home.querySelectorAll('h1').length, 1);
  const chips = [...home.querySelectorAll('.facet-chip')].map((a) => a.getAttribute('href'));
  assert.deepEqual(chips, SITE.facets.map((facet) => `./systems/${facet.id}/`));
  assert.equal(home.querySelectorAll('[data-facet]').length, 6);
  for (const file of htmlFiles()) {
    const html = readFileSync(file, 'utf8');
    const parsed = parseHTML(html).document;
    const names = [...parsed.querySelectorAll('.social-list a span')].map((n) => n.textContent);
    assert.deepEqual(names, SITE.socials.map((item) => item.name), file);
    let text = bodyText(html);
    text = text.replace(/your best guess/gi, ' ');
    const justs = text.match(/\bjust\b/gi) || [];
    const justMe = text.match(/\bJust me\b/g) || [];
    assert.equal(justs.length, justMe.length, file);
    assert.doesNotMatch(text, /\b(really|very|actually|basically|best|guarantee|guaranteed|reviews?|ratings?|testimonials?|certified|top-rated)\b/i, file);
    assert.doesNotMatch(text, /24\/7|never miss|error-free|zero errors|no contracts|cancel anytime|#1|100%/i, file);
    assert.doesNotMatch(text, /[—–]/, file);
    assert.doesNotMatch(text, /\$/, file);
    const parens = text.replace(/\(406\)/g, '');
    assert.doesNotMatch(parens, /\(/, file);
    const phones = text.match(/\+?\d[\d\s().-]{8,}\d/g) || [];
    for (const phone of phones) {
      const digits = phone.replace(/\D/g, '');
      assert.equal(digits.endsWith('4066986693'), true, `${file} ${phone}`);
    }
    assert.doesNotMatch(html, /data-stat-id="s6"/);
    assert.doesNotMatch(html, /Got it|\bReceived\b/);
  }
  assert.equal(home.querySelector('[data-stat-id="s1"]') != null, true);
  assert.equal(home.querySelector('[data-stat-id="s5"]'), null);
});

test('contrast pairs pass AA', () => {
  for (const [fg, bg] of PAIRS) assert.ok(ratio(fg, bg) >= 4.5, `${fg} on ${bg} ${ratio(fg, bg)}`);
  assert.ok(ratio('#B8862B', '#F7F3EA') < 4.5);
});

test('system pages, work, stripe, and goldie', () => {
  const copies = [];
  for (const system of SITE.systems) {
    const rel = `systems/${system.id}/index.html`;
    const parsed = doc(rel);
    const copy = parsed.querySelector('[data-system-copy]');
    assert.ok(copy, system.id);
    const count = words(copy.textContent).length;
    assert.ok(count >= 700, `${system.id} ${count}`);
    const steps = [...parsed.querySelectorAll('ol.flow li')].map((li) => li.textContent.trim());
    assert.deepEqual(steps, system.steps, system.id);
    const slot = parsed.querySelector('[data-goldie-slot]');
    if (system.goldie) {
      assert.ok(slot);
      assert.equal(copy.contains(slot), false);
      assert.match(slot.textContent, /Talk to Goldie/);
      assert.match(slot.textContent, /Tap to talk to Goldie, an AI receptionist built by Forever Gold AI\. She can book a free call with Thomas\./);
      assert.equal(slot.querySelector('elevenlabs-convai').getAttribute('agent-id'), SITE.goldie.widget.agentId);
      assert.equal(slot.querySelector('script').getAttribute('src'), 'https://unpkg.com/@elevenlabs/convai-widget-embed@0.20.0/dist/index.js');
      assert.match(slot.textContent, /Call \(406\) 698-6693/);
      assert.match(slot.textContent, /Text Thomas/);
    } else {
      assert.equal(slot, null, system.id);
    }
    copies.push({ id: system.id, grams: new Set(grams(copy.textContent)) });
    const raw = read(rel);
    if (system.id === 'job-to-invoice') assert.match(raw, /Stripe/);
    else assert.doesNotMatch(raw, /Stripe/);
  }
  for (const file of htmlFiles()) {
    const rel = relPosix(docs, file);
    const html = readFileSync(file, 'utf8');
    const externalScripts = [...html.matchAll(/<script[^>]*\ssrc="(https?:[^"]+)"/gi)].map((m) => m[1]);
    if (rel === 'systems/ai-receptionist/index.html') {
      assert.deepEqual(externalScripts, ['https://unpkg.com/@elevenlabs/convai-widget-embed@0.20.0/dist/index.js']);
      assert.equal((html.match(/<elevenlabs-convai\b/g) || []).length, 1);
    } else {
      assert.deepEqual(externalScripts, [], rel);
      assert.equal(html.includes('elevenlabs-convai'), false, rel);
      assert.equal(html.includes('agent_5801m626gmhgf3b9xajs3dz9e48b'), false, rel);
    }
  }
  for (let i = 0; i < copies.length; i += 1) {
    for (let j = i + 1; j < copies.length; j += 1) {
      let shared = 0;
      for (const gram of copies[i].grams) if (copies[j].grams.has(gram)) shared += 1;
      const denom = Math.min(copies[i].grams.size, copies[j].grams.size) || 1;
      assert.ok(shared / denom <= 0.4, `${copies[i].id} ${copies[j].id} ${shared}/${denom}`);
    }
  }
  const workHtml = read('work/index.html');
  const work = parseHTML(workHtml).document;
  const hrefs = [...work.querySelectorAll('a[href^="http"]')].map((a) => a.getAttribute('href'));
  for (const item of SITE.work) {
    const present = hrefs.includes(item.url);
    assert.equal(present, item.show, item.id);
  }
  assert.doesNotMatch(workHtml, /kraken|montana-movers|bridger|birdies|coachdaddy|justus|noodles/i);
  const privacy = read('privacy/index.html');
  const sms = read('sms-terms/index.html');
  for (const needle of [
    'Msg &amp; data rates may apply',
    'Reply STOP to opt out',
    'Reply HELP for help',
    'We do not sell or share your mobile number or text-message consent with third parties or affiliates for marketing.',
  ]) {
    assert.ok(privacy.includes(needle), needle);
    assert.ok(sms.includes(needle), needle);
  }
  const rawBlob = walk(docs)
    .filter((f) => /\.(html|css|js|svg|txt|xml)$/i.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  const blob = rawBlob.toLowerCase();
  for (const needle of ['calendly', 'kraken', 'montana movers', 'bridger', 'birdies', 'coach daddy', 'coachdaddy', 'justus', 'noodles']) {
    assert.equal(blob.includes(needle), false, needle);
  }
  for (const needle of ['DRAFT', 'UNCONFIRMED', 'UNVERIFIED', 'review/']) {
    assert.equal(rawBlob.includes(needle), false, needle);
  }
});

test('calculators', () => {
  const leak = missedCallLeak({ callsPerWeek: 20, missPercent: 20, bookPercent: 30, jobValue: 500 });
  assert.deepEqual({ yearly: leak.yearly, monthly: leak.monthly, hint: leak.hint }, { yearly: 31200, monthly: 2600, hint: '' });
  const empty = missedCallLeak({ callsPerWeek: '', missPercent: 20, bookPercent: 30, jobValue: 500 });
  assert.equal(empty.yearly, 0);
  assert.equal(empty.hint, 'Enter each number above zero to see a result.');
  const zero = missedCallLeak({ callsPerWeek: 0, missPercent: 20, bookPercent: 30, jobValue: 500 });
  assert.equal(zero.yearly, 0);
  assert.equal(Number.isNaN(zero.yearly), false);
  const hours = hoursBack({ parts: [4, 3, 2, 5, 6], takeoverPercent: 50, hourlyValue: 40 });
  assert.deepEqual({ weekly: hours.weekly, yearly: hours.yearly, dollars: hours.dollars, hint: hours.hint }, { weekly: 10, yearly: 520, dollars: 20800, hint: '' });
  const partial = hoursBack({ parts: [0, 4, 3, 2, 5], takeoverPercent: 50, hourlyValue: 40 });
  assert.equal(partial.hint, '');
  assert.ok(partial.yearly > 0);
  const blank = hoursBack({ parts: ['', 4, 3, 2, 5], takeoverPercent: 50, hourlyValue: 40 });
  assert.equal(blank.dollars, 0);
  assert.match(blank.hint, /above zero/);
  assert.equal(facetState(0).lit, 0);
  assert.equal(facetState(0.5).lit, 3);
  assert.deepEqual(facetState(1), { lit: 6, swoosh: true, motto: true });

  const numbers = doc('the-numbers/index.html');
  bootCalcs(numbers);
  const leakRoot = numbers.querySelector('[data-calc="leak"]');
  leakRoot.querySelector('[data-field="calls"]').value = '20';
  leakRoot.querySelector('[data-field="miss"]').value = '20';
  leakRoot.querySelector('[data-field="book"]').value = '30';
  leakRoot.querySelector('[data-field="value"]').value = '500';
  leakRoot.dispatchEvent(new numbers.defaultView.Event('input', { bubbles: true }));
  assert.equal(leakRoot.querySelector('[data-out="yearly"]').textContent, '$31,200');
  assert.equal(leakRoot.querySelector('[data-out="monthly"]').textContent, '$2,600');
  assert.match(leakRoot.querySelector('[data-plan]').getAttribute('href'), /need=missed-calls&leak=31200/);
  assert.equal(liveStats().some((stat) => stat.id === 's6'), false);
  assert.equal(numbers.querySelectorAll('[data-source]').length, liveStats().length);
});

test('forms fall back to a prefilled text and never fake a send', async () => {
  const audit = doc('free-audit/index.html');
  const form = audit.querySelector('form[data-lead]');
  assert.equal(Boolean(form.querySelector('[name="smsConsent"]').checked), false);
  assert.equal(form.querySelector('[name="smsConsent"]').hasAttribute('checked'), false);
  assert.equal(form.querySelector('[name="type"][value="audit"]').hasAttribute('checked'), true);
  applyPrefill(form, '?type=call&need=booking&leak=31200');
  assert.equal(form.querySelector('[name="type"][value="call"]').checked, true);
  assert.equal(form.querySelector('[name="needs"][value="scheduling"]').checked, true);
  assert.equal(form.querySelector('[name="leakYearly"]').value, '31200');
  bootForms(audit, { leadEndpoint: '', phoneE164: '+14066986693' }, { search: '', page: '/free-audit/' });
  fillLead(form);
  submitForm(form);
  assert.equal(form.querySelector('[data-handoff]').hidden, false);
  assert.match(form.querySelector('[data-handoff]').textContent, /Last step: send it to Thomas/);
  assert.equal(form.querySelector('[data-thanks]').hidden, true);
  const href = form.querySelector('[data-sms]').getAttribute('href');
  const text = decodeURIComponent(href.split('body=')[1]);
  for (const line of ['Form: call', 'Name: Ada Owner', 'Phone: 4065550144', 'Email: ada@example.com', 'Business: North Shop', 'Team size: Just me', 'Stage: Start', 'Notes: Calls pile up after lunch.', 'Text consent: no', 'Yearly leak: 31200']) {
    assert.ok(text.includes(line), line);
  }
  assert.doesNotMatch(form.textContent, /Got it|Received/);
  assert.equal(smsText({ form: 'audit', name: 'A', phone: '1', email: '', business: '', industry: '', teamSize: '', stage: '', needs: [], contactPref: '', notes: '', smsConsent: false, calc: null }).includes('Yearly leak:'), true);

  const quiet = doc('free-audit/index.html');
  const trap = quiet.querySelector('form[data-lead]');
  bootForms(quiet, { leadEndpoint: 'https://example.test/lead', phoneE164: '+14066986693' }, {
    search: '',
    page: '/free-audit/',
    fetch: async () => { throw new Error('should not post'); },
  });
  fillLead(trap);
  trap.querySelector('[name="website"]').value = 'spam';
  submitForm(trap);
  assert.equal(trap.querySelector('[data-handoff]').hidden, true);

  const failDoc = doc('contact/index.html');
  const failForm = failDoc.querySelector('form[data-lead]');
  let posts = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  bootForms(failDoc, { leadEndpoint: 'https://example.test/lead', phoneE164: '+14066986693' }, {
    search: '',
    page: '/contact/',
    fetch: () => {
      posts += 1;
      return gate.then(() => ({ ok: false, json: async () => ({ ok: false, error: 'down' }) }));
    },
  });
  fillLead(failForm);
  const before = failForm.querySelector('[name="notes"]').value;
  submitForm(failForm);
  submitForm(failForm);
  assert.equal(posts, 1);
  release();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(failForm.querySelector('[name="notes"]').value, before);
  assert.equal(failForm.querySelector('[data-error]').hidden, false);
  assert.equal(failForm.querySelector('[data-thanks]').hidden, true);
  assert.match(failForm.querySelector('[data-error]').textContent, /did not send/);

  const okDoc = doc('contact/index.html');
  const okForm = okDoc.querySelector('form[data-lead]');
  bootForms(okDoc, { leadEndpoint: 'https://example.test/lead', phoneE164: '+14066986693' }, {
    search: '',
    page: '/contact/',
    fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
  });
  fillLead(okForm);
  submitForm(okForm);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(okForm.querySelector('[data-thanks]').hidden, false);
  assert.match(okForm.querySelector('[data-thanks]').textContent, /Sent to Thomas/);
  assert.equal(okForm.dataset.sent, '1');
});
