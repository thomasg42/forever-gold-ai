import { shownWork } from '../site.config.mjs';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function makeCtx(SITE, slug, opts = {}) {
  const base = SITE.url.replace(/\/$/, '');
  const depth = opts.depth != null ? opts.depth : (slug ? String(slug).split('/').filter(Boolean).length : 0);
  const root = depth ? '../'.repeat(depth) : './';
  return {
    SITE,
    slug: slug || '',
    root,
    esc,
    dev: !!opts.dev,
    abs: (path = '') => `${base}/${String(path).replace(/^\//, '')}`,
    link: (path) => (path ? `${root}${String(path).replace(/^\//, '').replace(/\/$/, '')}/` : root),
    tel: `tel:${SITE.phone.e164}`,
    sms: `sms:${SITE.phone.e164}?&body=${encodeURIComponent(SITE.smsBody)}`,
    asset: (p) => `${root}assets/${p}?v=${encodeURIComponent(SITE.assetVersion)}`,
    font: (p) => `${root}assets/fonts/${p}`,
  };
}

function icon(network) {
  if (network === 'instagram') {
    return '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm8 1.8H8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8a3.2 3.2 0 0 0 3.2-3.2V8A3.2 3.2 0 0 0 16 4.8zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.4 6.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/></svg>';
  }
  return '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M14.2 8.5H16V5.6h-1.8c-2.2 0-3.7 1.4-3.7 3.6v1.6H8.4V14h2.1v6.4h2.7V14h2.2l.4-3.2h-2.6V9.4c0-.7.3-.9 1-.9z"/></svg>';
}

function logo(ctx, className) {
  return `<img class="${className}" src="${ctx.asset(ctx.SITE.logo)}" alt="Forever Gold AI" width="500" height="500">`;
}

function ld(schema) {
  return schema.filter(Boolean).map((obj) =>
    `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`).join('\n');
}

function head(ctx, page, schema) {
  const { SITE } = ctx;
  const url = page.file === '404.html' ? ctx.abs('404.html') : ctx.abs(page.slug ? `${page.slug}/` : '');
  const noindex = !SITE.launched || page.noindex;
  const og = ctx.abs(`assets/og.png?v=${encodeURIComponent(SITE.assetVersion)}`);
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow'}">
<meta name="theme-color" content="#0A0A0B">
<link rel="icon" href="${ctx.root}assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${ctx.font('playfair-display-latin-800.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${ctx.asset('site.css')}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Forever Gold AI. More money. More time. Fewer mistakes.">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${og}">
${ld(schema)}
<script>
(function(){
  document.documentElement.classList.add('js');
  var motion = false, save = false;
  try { motion = window.matchMedia('(prefers-reduced-motion: no-preference)').matches; } catch (e) {}
  try { save = !!(navigator.connection && navigator.connection.saveData); } catch (e) {}
  if (motion && !save) document.documentElement.classList.add('js-motion');
  setTimeout(function(){ if (!window.__fgaiReady) document.documentElement.classList.remove('js'); }, 3000);
})();
</script>
</head>`;
}

function current(ctx, path) {
  return ctx.slug === path ? ' aria-current="page"' : '';
}

function header(ctx) {
  const { SITE } = ctx;
  const systems = SITE.systems.map((system) =>
    `<li><a href="${ctx.link(`systems/${system.id}`)}"${current(ctx, `systems/${system.id}`)}>${esc(system.nav)}</a></li>`).join('');
  const links = [
    ['stages', 'Stages'],
    ['the-numbers', 'The Numbers'],
    ['gold-standard', 'Gold Standard'],
    ['work', 'Work'],
    ['about', 'About'],
  ].map(([path, label]) => `<a href="${ctx.link(path)}"${current(ctx, path)}>${label}</a>`).join('');
  const ig = SITE.socials.find((item) => item.header);
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <div class="wrap header-row">
    <a class="brand" href="${ctx.link('')}">${logo(ctx, 'brand-logo')}</a>
    <a class="header-ig" href="${esc(ig.url)}" target="_blank" rel="noopener">${icon(ig.network)}<span>${esc(ig.name)}</span></a>
    <a class="header-phone" href="${ctx.tel}">${esc(SITE.phone.display)}</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu">Menu</button>
    <nav id="nav-menu" class="nav-menu" aria-label="Main">
      <div class="nav-systems">
        <button class="nav-services-btn nav-systems-btn" type="button" aria-expanded="false" aria-controls="nav-systems-list">Systems</button>
        <ul id="nav-systems-list" class="nav-systems-list">${systems}</ul>
      </div>
      ${links}
      <a class="btn btn-gold nav-audit" href="${ctx.link('free-audit')}"${current(ctx, 'free-audit')}>Free audit</a>
    </nav>
  </div>
</header>`;
}

function footer(ctx) {
  const { SITE } = ctx;
  const systems = SITE.systems.map((system) => `<li><a href="${ctx.link(`systems/${system.id}`)}">${esc(system.nav)}</a></li>`).join('');
  const pages = [
    ['', 'Home'],
    ['systems', 'Systems'],
    ['stages', 'Stages'],
    ['the-numbers', 'The Numbers'],
    ['gold-standard', 'Gold Standard'],
    ['work', 'Work'],
    ['about', 'About'],
    ['free-audit', 'Free audit'],
    ['contact', 'Contact'],
    ['faq', 'FAQ'],
    ['privacy', 'Privacy'],
    ['sms-terms', 'SMS Terms'],
  ].map(([path, label]) => `<li><a href="${ctx.link(path)}">${label}</a></li>`).join('');
  const socials = SITE.socials.map((item) =>
    `<li><a href="${esc(item.url)}" target="_blank" rel="noopener">${icon(item.network)}<span>${esc(item.name)}</span></a></li>`).join('');
  return `<footer class="site-footer">
  <div class="wrap foot-grid">
    <div>
      <a class="brand foot-brand" href="${ctx.link('')}">${logo(ctx, 'brand-logo')}</a>
      <p class="motto">${esc(SITE.motto)}</p>
      <p><a href="${ctx.tel}">${esc(SITE.phone.display)}</a></p>
      <p><a href="${ctx.sms}">Text Thomas</a></p>
    </div>
    <div>
      <p class="foot-title">Systems</p>
      <ul class="link-list">${systems}</ul>
    </div>
    <div>
      <p class="foot-title">Pages</p>
      <ul class="link-list">${pages}</ul>
    </div>
    <div>
      <p class="foot-title">Social</p>
      <ul class="link-list social-list">${socials}</ul>
    </div>
  </div>
  <p class="wrap legal">© ${SITE.year} ${esc(SITE.name)}. ${esc(SITE.motto)}</p>
</footer>
<nav class="tap-bar" aria-label="Call, text, or free audit">
  <a href="${ctx.tel}">Call</a>
  <a href="${ctx.sms}">Text</a>
  <a href="${ctx.link('free-audit')}">Free audit</a>
</nav>`;
}

export function crumbs(ctx, items) {
  const lis = items.map((item, i) => {
    if (i === items.length - 1) return `<li aria-current="page">${esc(item.name)}</li>`;
    return `<li><a href="${ctx.link(item.path)}">${esc(item.name)}</a></li>`;
  }).join('');
  return `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol>${lis}</ol></nav>`;
}

export function businessSchema(ctx) {
  const { SITE } = ctx;
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ctx.abs('#business'),
    name: SITE.name,
    url: SITE.url,
    telephone: SITE.phone.schema,
    slogan: SITE.motto,
    founder: { '@type': 'Person', name: SITE.founder },
    areaServed: [
      { '@type': 'State', name: 'Montana' },
      { '@type': 'Country', name: 'US' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bozeman',
      addressRegion: 'MT',
      addressCountry: 'US',
    },
    sameAs: SITE.socials.map((item) => item.url),
    logo: ctx.abs(`assets/brand/${SITE.logo.split('/').pop()}`),
    knowsAbout: SITE.systems.map((system) => system.h1),
  };
}

export function webSiteSchema(ctx) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ctx.SITE.name,
    url: ctx.SITE.url,
    publisher: { '@id': ctx.abs('#business') },
  };
}

export function breadcrumbSchema(ctx, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.path ? ctx.abs(`${item.path}/`) : ctx.abs(''),
    })),
  };
}

export function serviceSchema(ctx, system) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: system.h1,
    serviceType: system.nav,
    description: system.card,
    provider: { '@id': ctx.abs('#business') },
  };
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}

export function aboutSchema() {
  return { '@context': 'https://schema.org', '@type': 'AboutPage' };
}

export function contactSchema(name) {
  return { '@context': 'https://schema.org', '@type': 'ContactPage', name };
}

export function ctaBand(ctx, { title, href, lead }) {
  const { SITE } = ctx;
  const book = SITE.bookingUrl
    ? `<a class="text-link" href="${esc(SITE.bookingUrl)}" target="_blank" rel="noopener">Book a free call</a>`
    : `<a class="text-link" href="${ctx.link('free-audit')}?type=call">Book a free call</a>`;
  return `<section class="band flake">
  <div class="wrap frame"><div class="frame-inner band-inner">
    <h2>${esc(title)}</h2>
    ${lead ? `<p>${esc(lead)}</p>` : ''}
    <div class="btn-row">
      <a class="btn btn-gold" href="${href}">Get my free systems audit</a>
      <a class="text-link" href="${ctx.tel}">Call ${esc(SITE.phone.display)}</a>
      <a class="text-link" href="${ctx.sms}">Text Thomas</a>
      ${book}
    </div>
  </div></div>
</section>`;
}

function scripts(ctx) {
  return `<script src="${ctx.root}assets/config.js?v=${encodeURIComponent(ctx.SITE.assetVersion)}"></script>
<script type="module" src="${ctx.asset('site.js')}"></script>`;
}

export function renderPage(ctx, page) {
  const schema = page.schema ? page.schema(ctx) : [];
  return `${head(ctx, page, schema)}
<body class="${page.bodyClass || 'page-marketing'}">
${header(ctx)}
<main id="main">
${page.body(ctx)}
</main>
${footer(ctx)}
${scripts(ctx)}
</body>
</html>
`;
}

export function externalAllow(ctx) {
  const { SITE } = ctx;
  const urls = [
    ...SITE.socials.map((item) => item.url),
    ...SITE.stats.map((stat) => stat.sourceUrl),
    ...shownWork(SITE).map((item) => item.url),
  ];
  if (SITE.bookingUrl) urls.push(SITE.bookingUrl);
  return urls;
}
