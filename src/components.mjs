import { liveStats, statById } from '../site.config.mjs';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function gemSvg() {
  const cx = 100;
  const cy = 102;
  const r = 68;
  const verts = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2)];
  });
  const facets = verts.map((v, i) => {
    const n = verts[(i + 1) % 6];
    return `<polygon class="gem-facet" data-facet="${i}" points="${cx},${cy} ${v[0]},${v[1]} ${n[0]},${n[1]}"></polygon>`;
  }).join('');
  const spokes = verts.map((v) => `<line class="gem-line" x1="${cx}" y1="${cy}" x2="${v[0]}" y2="${v[1]}"></line>`).join('');
  const hull = `<polygon class="gem-line gem-hull" points="${verts.map((v) => v.join(',')).join(' ')}"></polygon>`;
  const inner = verts.map((v) => {
    const x = cx + (v[0] - cx) * 0.48;
    const y = cy + (v[1] - cy) * 0.48;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const dots = verts.map((v) => `<circle class="gem-dot" cx="${v[0]}" cy="${v[1]}" r="2.3"></circle>`).join('');
  return `<svg class="gem-svg" viewBox="0 0 200 214" role="img" aria-label="Six gold facets, one for each system">
  <defs>
    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FBE7A1"></stop>
      <stop offset="45%" stop-color="#E2B04A"></stop>
      <stop offset="100%" stop-color="#9C6B1C"></stop>
    </linearGradient>
  </defs>
  ${facets}
  ${hull}
  <polygon class="gem-line" points="${inner.join(' ')}"></polygon>
  ${spokes}
  ${dots}
  <circle class="gem-dot" cx="${cx}" cy="${cy}" r="2.6"></circle>
  <path class="gem-swoosh" d="M22 196 C62 208, 100 184, 138 196 S184 208, 184 196"></path>
</svg>`;
}

export function bookLink(ctx) {
  const { SITE } = ctx;
  if (SITE.bookingUrl) {
    return `<a class="text-link" href="${esc(SITE.bookingUrl)}" target="_blank" rel="noopener">Book a free call</a>`;
  }
  return `<a class="text-link" href="${ctx.link('free-audit')}?type=call">Book a free call</a>`;
}

export function homeHero(ctx) {
  const { SITE } = ctx;
  const chips = SITE.facets.map((facet, i) =>
    `<li><a class="facet-chip" data-chip="${i}" href="${ctx.link(`systems/${facet.id}`)}">${esc(facet.label)}</a></li>`).join('');
  return `<section class="hero flake" data-hero-slot="v1-gem">
  <div class="hero-stage">
    <div class="hero-media" data-hero-media></div>
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="kicker">${esc(SITE.kicker)}</p>
        <h1>${esc(SITE.h1)}</h1>
        <p class="lead">${esc(SITE.sub)}</p>
        <div class="btn-row">
          <a class="btn btn-gold" href="${ctx.link('free-audit')}">Get my free systems audit</a>
          <a class="btn btn-ghost" href="${ctx.sms}">Text Thomas</a>
        </div>
        <p class="text-row">
          <a class="text-link" href="${ctx.tel}">Call ${esc(SITE.phone.display)}</a>
          ${bookLink(ctx)}
        </p>
        <p class="reassure">Free audit. Real answers. No pressure.</p>
      </div>
      <div class="hero-gem">
        ${gemSvg()}
        <ol class="facet-chips">${chips}</ol>
        <p class="hero-motto">${esc(SITE.motto)}</p>
      </div>
    </div>
  </div>
</section>`;
}

export function statCard(stat, { rail = false } = {}) {
  const railAttr = rail ? ' data-source' : '';
  const count = stat.count == null ? '' : ` data-count="${stat.count}" data-decimals="${stat.decimals || 0}" data-suffix="${esc(stat.suffix || '')}"`;
  return `<article class="stat-card frame" id="stat-${stat.id}" data-stat-id="${stat.id}"${railAttr}>
  <div class="frame-inner">
    <p class="stat-num"${count}>${esc(stat.figure)}</p>
    <p>${esc(stat.label)}</p>
    <p class="source"><a href="${esc(stat.sourceUrl)}" target="_blank" rel="noopener">${esc(stat.sourceChip)}</a></p>
  </div>
</article>`;
}

export function statGroup(ids, opts) {
  return ids.map((id) => statCard(statById(id), opts)).join('');
}

export function systemCard(ctx, system) {
  return `<article class="system-card frame" data-stages="${system.stages.join(' ')}">
  <div class="frame-inner">
    <p class="kicker">${esc(system.nav)}</p>
    <h3>${esc(system.h1)}</h3>
    <p>${esc(system.card)}</p>
    <a class="text-link" href="${ctx.link(`systems/${system.id}`)}">How it works</a>
  </div>
</article>`;
}

export function stagePicker(ctx) {
  const buttons = ctx.SITE.stages.map((stage, i) =>
    `<button type="button" data-stage="${stage.id}" aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(stage.label)} <span>${esc(stage.who)}</span></button>`).join('');
  return `<div class="stage-picker" data-stage-picker role="group" aria-label="Business stage">${buttons}</div>`;
}

export function pillarGrid(ctx) {
  const cards = ctx.SITE.pillars.map((pillar) =>
    `<article class="pillar frame"><div class="frame-inner"><h3>${esc(pillar.title)}</h3><p>${esc(pillar.text)}</p></div></article>`).join('');
  return `<div class="pillar-grid">${cards}</div>`;
}

export function tuesday(ctx) {
  const rows = ctx.SITE.tuesday.map((row) => `<li data-hour="${esc(row.hour)}">
    <p class="hour">${esc(row.hour)}</p>
    <article class="day-card"><h3>By hand</h3><p>${esc(row.hand)}</p></article>
    <article class="day-card day-sys"><h3>With systems</h3><p>${esc(row.systems)}</p></article>
  </li>`).join('');
  return `<section class="tuesday" data-tuesday>
  <div class="wrap tuesday-head">
    <p class="kicker">Story</p>
    <h2>Same Tuesday. Two businesses.</h2>
    <p class="tuesday-clock" data-tuesday-clock>${esc(ctx.SITE.tuesday[0].hour)}</p>
  </div>
  <ol class="tuesday-list wrap">${rows}</ol>
</section>`;
}

export function swoosh() {
  return '<svg class="swoosh-rule" viewBox="0 0 1200 36" aria-hidden="true"><path d="M0 24 C180 4, 360 34, 600 16 S980 4, 1200 22" fill="none" stroke="#B8862B" stroke-width="1.4"></path></svg>';
}

export function flowList(steps) {
  return `<h2>How it works</h2><ol class="flow">${steps.map((step) => `<li><span>${esc(step)}</span></li>`).join('')}</ol>`;
}

export function faqList(faqs) {
  return `<div class="faq-list">${faqs.map((faq) => `<details class="faq"><summary>${esc(faq.q)}</summary><p>${esc(faq.a)}</p></details>`).join('')}</div>`;
}

export function leakCalc(ctx) {
  return `<section class="calc" data-calc="leak" data-base="${ctx.root}">
  <h2>Missed-call leak</h2>
  <p>Only your numbers go into this. Nothing here is a hidden industry rate.</p>
  <div class="calc-grid">
    <label>Calls per week <input type="number" inputmode="decimal" min="0" data-field="calls" name="calls"></label>
    <label>Percent you miss <input type="range" min="0" max="80" value="20" data-field="miss"> <span data-live="miss">20</span><span class="calc-note">your best guess</span></label>
    <label>Percent of those callers who would have booked <input type="range" min="0" max="100" value="30" data-field="book"> <span data-live="book">30</span><span class="calc-note">your best guess</span></label>
    <label>Average job value <span class="calc-prefix">$</span><input type="number" inputmode="decimal" min="0" data-field="value" name="value"></label>
  </div>
  <p class="calc-output">Yearly revenue at risk <strong data-out="yearly">$0</strong></p>
  <p class="calc-output">Monthly revenue at risk <strong data-out="monthly">$0</strong></p>
  <p data-hint>Enter each number above zero to see a result.</p>
  <p class="formula">Calls each week, times the share you miss, times the share who would have booked, times the job value, times 52. The month is that year divided by 12.</p>
  <p><a class="btn btn-gold" data-plan href="${ctx.link('free-audit')}?need=missed-calls&amp;leak=0">Send me a plan to catch these</a></p>
</section>`;
}

export function hoursCalc(ctx) {
  const field = (label, name) => `<label>${label} <input type="number" inputmode="decimal" min="0" data-field="${name}"></label>`;
  return `<section class="calc" data-calc="hours" data-base="${ctx.root}">
  <h2>Hours back</h2>
  <p>Add the hours you spend on the work a system can carry. Then say what share it could take, and what an hour of your time is worth.</p>
  <div class="calc-grid">
    ${field('Hours a week answering and returning calls', 'calls')}
    ${field('Hours a week on follow-up texts and emails', 'follow')}
    ${field('Hours a week on scheduling', 'schedule')}
    ${field('Hours a week on quotes and invoices', 'quotes')}
    ${field('Hours a week on paperwork, data entry, and team time sheets', 'paper')}
    <label>Percent a system could take <input type="range" min="0" max="100" value="50" data-field="take"> <span data-live="take">50</span><span class="calc-note">your estimate</span></label>
    <label>Your hourly value <span class="calc-prefix">$</span><input type="number" inputmode="decimal" min="0" data-field="rate"></label>
  </div>
  <p class="calc-output">Hours back per week <strong data-out="weekly">0</strong></p>
  <p class="calc-output">Hours back per year <strong data-out="yearly">0</strong></p>
  <p class="calc-output">Value of those hours <strong data-out="dollars">$0</strong></p>
  <p data-hint>Enter each number above zero to see a result.</p>
  <p class="formula">Add the hours, times the share a system could take. The year is that week times 52. The value is the year times your hourly number.</p>
  <p><a class="btn btn-gold" data-plan href="${ctx.link('free-audit')}?need=hours&amp;hours=0">Send me a plan to get these hours back</a></p>
</section>`;
}

function consent(ctx) {
  return `<label class="check"><input type="checkbox" name="smsConsent" value="yes"> <span>Text me about my request. Msg &amp; data rates may apply. Reply STOP to opt out. <a href="${ctx.link('sms-terms')}">SMS terms</a></span></label>`;
}

function trap() {
  return '<div class="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>';
}

function resultBlock(ctx) {
  return `<p data-form-alert role="alert" hidden></p>
  <div data-handoff hidden>
    <p>Last step: send it to Thomas</p>
    <p><a class="btn btn-gold" data-sms href="${ctx.sms}">Text Thomas</a></p>
    <p><a class="text-link" href="${ctx.tel}">Call ${esc(ctx.SITE.phone.display)}</a></p>
  </div>
  <p data-thanks hidden>Sent to Thomas.</p>
  <p data-error hidden>That did not send. Your answers are still here.</p>`;
}

export function auditForm(ctx) {
  const { SITE } = ctx;
  const industries = SITE.industries.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join('');
  const teams = SITE.teamSizes.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join('');
  const needs = SITE.needs.map((need) =>
    `<label class="check"><input type="checkbox" name="needs" value="${need.id}"> <span>${esc(need.label)}</span></label>`).join('');
  return `<form data-lead data-form="audit" method="post" action="">
  <fieldset class="choices">
    <legend>What do you want?</legend>
    <label class="choice"><input type="radio" name="type" value="audit" checked> <span>Free systems audit</span></label>
    <label class="choice"><input type="radio" name="type" value="call"> <span>Free 15-minute call</span></label>
    ${bookLink(ctx)}
  </fieldset>
  <label>Name <input name="name" autocomplete="name" required></label>
  <label>Phone <input name="phone" type="tel" autocomplete="tel" required></label>
  <label>Email <input name="email" type="email" autocomplete="email"></label>
  <label>Business name <input name="business" autocomplete="organization"></label>
  <label>Industry <select name="industry"><option value="">Select one</option>${industries}</select></label>
  <label>Team size <select name="teamSize"><option value="">Select one</option>${teams}</select></label>
  <p data-stage-echo hidden></p>
  <fieldset>
    <legend>What hurts most</legend>
    ${needs}
  </fieldset>
  <fieldset>
    <legend>Reach me by</legend>
    <label class="check"><input type="radio" name="contactPref" value="call"> <span>Call</span></label>
    <label class="check"><input type="radio" name="contactPref" value="text"> <span>Text</span></label>
    <label class="check"><input type="radio" name="contactPref" value="email"> <span>Email</span></label>
  </fieldset>
  <label>Notes <textarea name="notes" rows="4"></textarea></label>
  <input type="hidden" name="leakYearly" value="">
  <input type="hidden" name="hoursYearly" value="">
  ${consent(ctx)}
  ${trap()}
  <button class="btn btn-gold" type="submit">Send my request</button>
  ${resultBlock(ctx)}
</form>`;
}

export function contactForm(ctx) {
  return `<form data-lead data-form="contact" method="post" action="">
  <input type="hidden" name="type" value="contact">
  <label>Name <input name="name" autocomplete="name" required></label>
  <label>Phone <input name="phone" type="tel" autocomplete="tel" required></label>
  <label>Email <input name="email" type="email" autocomplete="email"></label>
  <label>Message <textarea name="notes" rows="5" required></textarea></label>
  <input type="hidden" name="leakYearly" value="">
  <input type="hidden" name="hoursYearly" value="">
  ${consent(ctx)}
  ${trap()}
  <button class="btn btn-gold" type="submit">Send my request</button>
  ${resultBlock(ctx)}
</form>`;
}

export function numbersRail(ctx) {
  const stats = liveStats();
  const links = stats.map((stat) => `<li><a href="#stat-${stat.id}">${esc(stat.id.toUpperCase())}</a></li>`).join('');
  return `<aside class="rail" data-rail>
  <p class="rail-count">SOURCES <span data-rail-count>0</span> OF <span data-rail-total>${stats.length}</span></p>
  <ol>${links}</ol>
</aside>`;
}
