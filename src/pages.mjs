import { SITE, liveStats, shownWork, statById } from '../site.config.mjs';
import {
  aboutSchema,
  breadcrumbSchema,
  businessSchema,
  contactSchema,
  ctaBand,
  faqSchema,
  serviceSchema,
  webSiteSchema,
} from './layout.mjs';
import {
  auditForm,
  bookLink,
  contactForm,
  faqList,
  flowList,
  homeHero,
  hoursCalc,
  leakCalc,
  numbersRail,
  pillarGrid,
  stagePicker,
  statCard,
  statGroup,
  swoosh,
  systemCard,
  tuesday,
} from './components.mjs';
import { FAQ_TEASER, FAQS } from './faqs.mjs';
import { SYSTEM_COPY } from './systems-copy.mjs';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function crumbs(ctx, items) {
  const lis = items.map((item, i) => (
    i === items.length - 1
      ? `<li aria-current="page">${esc(item.name)}</li>`
      : `<li><a href="${ctx.link(item.path)}">${esc(item.name)}</a></li>`
  )).join('');
  return `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol>${lis}</ol></nav>`;
}

function pageHead(kicker, h1, lead) {
  return `<header class="page-intro wrap"><p class="kicker">${esc(kicker)}</p><h1>${esc(h1)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</header>`;
}

function goldie(ctx) {
  return `<section id="talk-to-goldie" data-goldie-slot>
  <h2>Talk to Goldie</h2>
  <p>Goldie, our own AI receptionist, is coming to this page.</p>
  <div class="btn-row">
    <a class="btn btn-gold" href="${ctx.tel}">Call ${esc(ctx.SITE.phone.display)}</a>
    <a class="btn btn-ghost" href="${ctx.sms}">Text Thomas</a>
  </div>
</section>`;
}

function home(ctx) {
  const cards = ctx.SITE.systems.map((system) => systemCard(ctx, system)).join('');
  return `${homeHero(ctx)}
<section class="section">
  <div class="wrap">
    <p class="kicker">The cost of doing it by hand</p>
    <h2>Three numbers, from three sources.</h2>
    <p>These measure different things. Read them side by side on <a href="${ctx.link('the-numbers')}">The Numbers</a>.</p>
    <div class="stat-grid reveal">${statGroup(ctx.SITE.homeStatIds)}</div>
  </div>
</section>
${swoosh()}
${tuesday(ctx)}
${swoosh()}
<section class="section">
  <div class="wrap">
    <p class="kicker">The systems</p>
    <h2>Eight systems. One business.</h2>
    ${stagePicker(ctx)}
    <div class="card-grid">${cards}</div>
  </div>
</section>
<section class="section section-ivory">
  <div class="wrap">
    <h2>Adjustable. Fixable. Flexible. Customizable.</h2>
    ${pillarGrid(ctx)}
  </div>
</section>
<section class="section">
  <div class="wrap prose">
    <h2>We run our own business on it.</h2>
    <p>Gold Mobile Mechanic is owned by Forever Gold AI and runs on these systems. The site takes a booking. Ask Ken handles voice triage. The job and invoice app closes the work.</p>
    <p><a class="text-link" href="${ctx.link('work')}">See it working</a></p>
  </div>
</section>
<section class="section section-ivory"><div class="wrap">${leakCalc(ctx)}</div></section>
<section class="section">
  <div class="wrap">
    <h2>Questions owners ask</h2>
    ${faqList(FAQ_TEASER)}
    <p><a class="text-link" href="${ctx.link('faq')}">All questions</a></p>
  </div>
</section>
${ctaBand(ctx, { title: 'See what to build first.', href: ctx.link('free-audit'), lead: 'Free audit. Real answers. No pressure.' })}`;
}

function systemsHub(ctx) {
  const cards = ctx.SITE.systems.map((system) => systemCard(ctx, system)).join('');
  const who = ctx.SITE.audiences.map((name) => `<li>${esc(name)}</li>`).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'systems', name: 'Systems' }])}
${pageHead('Systems', 'AI systems for the work you already do', 'Each system answers one pile of work. You can start with one and add the next when the business grows.')}
<section class="section"><div class="wrap card-grid">${cards}</div></section>
<section class="section section-ivory"><div class="wrap"><h2>Who it is for</h2><ul class="chip-list">${who}</ul></div></section>
${ctaBand(ctx, { title: 'Not sure which system comes first?', href: ctx.link('free-audit'), lead: 'The audit looks at your calls, leads, schedule, quotes, and invoices.' })}`;
}

function systemPage(ctx, system) {
  const copy = SYSTEM_COPY[system.id];
  const stats = (system.statIds || []).map((id) => statCard(statById(id))).join('');
  const trail = [
    { path: '', name: 'Home' },
    { path: 'systems', name: 'Systems' },
    { path: `systems/${system.id}`, name: system.nav },
  ];
  return `${crumbs(ctx, trail)}
<article class="section section-ivory">
  <div class="wrap prose">
    <p class="kicker">${esc(system.nav)}</p>
    <h1>${esc(system.h1)}</h1>
    <div data-system-copy>
      ${copy.problem}
      ${stats}
      ${flowList(system.steps)}
      ${copy.rest}
    </div>
    ${system.goldie ? goldie(ctx) : ''}
  </div>
</article>
${ctaBand(ctx, { title: 'Want this in your business?', href: `${ctx.link('free-audit')}?need=${system.id}`, lead: 'Tell us what hurts. We will show you the first systems worth building.' })}`;
}

function stagesPage(ctx) {
  const blocks = [
    ['start', 'Start', 'Only you', 'You answer the phone, write the quotes, and send the invoices yourself. The business moves when you move.', 'Calls go to voicemail while you are on a job. Leads sit until evening.', 'AI receptionist, Speed-to-Lead, and a website.', 'Those three keep the front door covered, so a crew can be added without you still catching every call.'],
    ['grow', 'Grow', 'A crew', 'People are on jobs, and you are still the one booking, invoicing, and checking the schedule.', 'Two people get offered the same slot. Invoices wait until night.', 'Booking, job to invoice, and team apps, on top of the Start systems.', 'The day has a calendar and a close-out, so another crew can follow the same pattern.'],
    ['scale', 'Scale', 'Crews or locations', 'More than one crew, or more than one place, and the numbers live in separate tabs.', 'Paperwork piles up. Nobody can see the week on one screen.', 'Documents, AI operations, and a custom assistant, on top of what you already run.', 'The same checks and alerts cover the next location. You are not rebuilding the company by hand.'],
  ].map(([id, title, who, signs, breaks, first, easier]) => `<article class="stage-block" id="${id}">
    <h2>${title}</h2>
    <p class="kicker">${who}</p>
    <h3>Signs you are here</h3><p>${signs}</p>
    <h3>What breaks first</h3><p>${breaks}</p>
    <h3>What to build first</h3><p>${first}</p>
    <h3>Why the next stage gets easier</h3><p>${easier}</p>
  </article>`).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'stages', name: 'Stages' }])}
${pageHead('Stages', 'Succeed at any stage.', 'Start, Grow, and Scale are a sequence. Build the front door before you build the dashboard.')}
<section class="section"><div class="wrap prose">${blocks}</div></section>
${ctaBand(ctx, { title: 'Which stage are you in?', href: ctx.link('free-audit'), lead: 'The audit names the stage and the first three systems.' })}`;
}

function numbersPage(ctx) {
  const cards = liveStats().map((stat) => statCard(stat, { rail: true })).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'the-numbers', name: 'The Numbers' }])}
${pageHead('The Numbers', 'Research you can check.', 'Every figure on this page has a source, a date, and a link.')}
<section class="section numbers-layout">
  ${numbersRail(ctx)}
  <div class="wrap stat-stack">${cards}</div>
</section>
<section class="section section-ivory"><div class="wrap">${leakCalc(ctx)}${hoursCalc(ctx)}</div></section>
<section class="section"><div class="wrap prose">
  <h2>How to read these numbers</h2>
  <p>The Census figure and the Thryv figure measure different things. One counts production use across U.S. firms. The other counts any use among surveyed small businesses. Read them side by side. Do not fold them into one number.</p>
  <p>The callback figures come from one vendor's customers. They describe missed calls in that set.</p>
</div></section>`;
}

function goldPage(ctx) {
  const blocks = [
    ['Type it once', 'A name and a phone number entered on a form should not be typed again into the calendar, the text, and the invoice. The fact moves.'],
    ['Checks before it acts', 'A booking checks that the time is still open before it confirms. A form checks the phone number before it treats the request as ready. Double bookings get blocked by that second look.'],
    ['Every failure raises a flag', 'When a workflow fails, Thomas gets an email. A quiet failure is the thing we treat as a defect.'],
    ['A human where it matters', 'Invoices, document drafts, and messages that state a fact stay drafts until a person approves them.'],
    ['Fallbacks', 'A new lead gets a call, then a text, then an email. If one channel misses, the next one still runs, and you still get the record.'],
    ['Changes any time', 'A script, a time, or a rule can change when you grow. The system is not sealed on launch day.'],
  ].map(([title, text]) => `<article class="gold-block"><h2>${esc(title)}</h2><p>${esc(text)}</p></article>`).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'gold-standard', name: 'Gold Standard' }])}
${pageHead('Gold Standard', 'How mistakes get taken out.', 'The standard is what happens before a mistake reaches a customer, and what happens after something fails.')}
<section class="section section-ivory"><div class="wrap prose">${blocks}</div></section>
${ctaBand(ctx, { title: 'Want this standard on your tools?', href: ctx.link('free-audit'), lead: 'We will show you where a check, a draft, or an alert belongs.' })}`;
}

function workPage(ctx) {
  const items = shownWork();
  const card = (item) => `<article class="work-card frame"><div class="frame-inner">
    <p class="kicker">${esc(item.label)}</p>
    <h2>${esc(item.title)}</h2>
    <p>${esc(item.text)}</p>
    ${item.detail ? `<p>${esc(item.detail)}</p>` : ''}
    <p><a class="btn btn-gold" href="${esc(item.url)}" target="_blank" rel="noopener">Open ${esc(item.title)}</a></p>
  </div></article>`;
  const demos = items.filter((item) => item.group === 'demo').map(card).join('');
  const tools = items.filter((item) => item.group === 'tool').map(card).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'work', name: 'Work' }])}
${pageHead('Work', 'See it working.', 'Demo websites, plus the tools Forever Gold AI built and runs.')}
<section class="section"><div class="wrap"><h2>Demo websites</h2><div class="card-grid">${demos}</div></div></section>
<section class="section section-ivory"><div class="wrap"><h2>Tools we built and run</h2><div class="card-grid">${tools}</div></div></section>`;
}

function aboutPage(ctx) {
  const photo = ctx.SITE.photos.thomas
    ? `<img src="${ctx.asset(ctx.SITE.photos.thomas)}" alt="Thomas Gutierrez" width="800" height="1000">`
    : '';
  const socials = ctx.SITE.socials.map((item) => `<li><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.name)}</a></li>`).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'about', name: 'About' }])}
${pageHead('About', 'Thomas Gutierrez, founder', '')}
<section class="section"><div class="wrap prose about-grid">
  <div>
    <p>Seven years as a restaurant general manager taught me a business runs on systems, not on how hard the owner works.</p>
    <p>Thomas Gutierrez is an AI consultant. He builds AI operations and AI systems. The work is based in Bozeman, Montana. He uses the same systems in his own business.</p>
    <p>Built in Montana. Working with businesses anywhere.</p>
    <ul class="link-list">${socials}</ul>
  </div>
  ${photo}
</div></section>
${ctaBand(ctx, { title: 'Talk with Thomas.', href: ctx.link('free-audit'), lead: 'Free systems audit, or a free 15-minute call.' })}`;
}

function auditPage(ctx) {
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'free-audit', name: 'Free audit' }])}
${pageHead('Free audit', 'Free systems audit. Free 15-minute call.', 'We look at how calls, leads, scheduling, quotes and invoices move through your business, then show you the first three systems worth building.')}
<section class="section"><div class="wrap form-layout">
  ${auditForm(ctx)}
  <aside class="form-aside">
    <p><a class="btn btn-ghost" href="${ctx.tel}">Call ${esc(ctx.SITE.phone.display)}</a></p>
    <p><a class="btn btn-ghost" href="${ctx.sms}">Text Thomas</a></p>
    <p>${bookLink(ctx)}</p>
  </aside>
</div></section>`;
}

function contactPage(ctx) {
  const socials = ctx.SITE.socials.map((item) => `<li><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.name)}</a></li>`).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'contact', name: 'Contact' }])}
${pageHead('Contact', 'Call, text, or book a free call.', '')}
<section class="section"><div class="wrap contact-grid">
  <div>
    <p><a class="btn btn-gold" href="${ctx.tel}">Call ${esc(ctx.SITE.phone.display)}</a></p>
    <p><a class="btn btn-ghost" href="${ctx.sms}">Text Thomas</a></p>
    <p>${bookLink(ctx)}</p>
    <ul class="link-list">${socials}</ul>
  </div>
  ${contactForm(ctx)}
</div></section>`;
}

function faqPage(ctx) {
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'faq', name: 'FAQ' }])}
${pageHead('FAQ', 'Questions owners ask', '')}
<section class="section section-ivory"><div class="wrap">${faqList(FAQS)}</div></section>
${ctaBand(ctx, { title: 'Still deciding?', href: ctx.link('free-audit'), lead: 'The audit is free. The call is free.' })}`;
}

function privacyPage(ctx) {
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'privacy', name: 'Privacy' }])}
${pageHead('Privacy', 'Privacy', 'What the forms collect, why we ask, and how text messages work.')}
<section class="section"><div class="wrap prose">
  <h2>What the forms collect</h2>
  <p>The free audit form and the contact form ask for your name and phone number. Email, business name, industry, team size, and notes are there so we can answer the request you sent.</p>
  <h2>Text messages</h2>
  <p>If you check the box, Forever Gold AI may text you about that request. Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out. Reply HELP for help.</p>
  <p>We do not sell or share your mobile number or text-message consent with third parties or affiliates for marketing.</p>
  <h2>How to reach Thomas</h2>
  <p>Call or text <a href="${ctx.tel}">${esc(ctx.SITE.phone.display)}</a>. You can also use the contact form on this site.</p>
  <p><a href="${ctx.link('sms-terms')}">SMS terms</a></p>
</div></section>`;
}

function smsPage(ctx) {
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'sms-terms', name: 'SMS Terms' }])}
${pageHead('SMS terms', 'Text message terms', 'Who texts, what the texts are about, and how to stop them.')}
<section class="section"><div class="wrap prose">
  <p>Forever Gold AI texts people who asked to be texted about their audit request, their call request, or their contact message.</p>
  <p>Messages are about that request: scheduling a call, a follow-up, or a question we need answered. Message frequency varies.</p>
  <p>Msg &amp; data rates may apply. Reply STOP to opt out. Reply HELP for help.</p>
  <p>We do not sell or share your mobile number or text-message consent with third parties or affiliates for marketing.</p>
  <p>Read the <a href="${ctx.link('privacy')}">privacy policy</a>. Call or text <a href="${ctx.tel}">${esc(ctx.SITE.phone.display)}</a>.</p>
</div></section>`;
}

function missing(ctx) {
  return `<section class="section miss"><div class="wrap">
  <h1>This page moved on. Your business doesn't have to.</h1>
  <div class="btn-row">
    <a class="btn btn-gold" href="${ctx.link('')}">Home</a>
    <a class="btn btn-ghost" href="${ctx.link('systems')}">Systems</a>
    <a class="btn btn-ghost" href="${ctx.link('free-audit')}">Free audit</a>
    <a class="text-link" href="${ctx.tel}">Call ${esc(ctx.SITE.phone.display)}</a>
    <a class="text-link" href="${ctx.sms}">Text Thomas</a>
  </div>
</div></section>`;
}

const TITLES = {
  'ai-receptionist': 'AI Receptionist for Your Calls | Forever Gold AI',
  'speed-to-lead': 'Follow-Up for Every New Lead | Forever Gold AI',
  websites: 'Websites That Book the Job | Forever Gold AI',
  booking: 'Booking That Blocks Double Slots | Forever Gold AI',
  'job-to-invoice': 'Clock-In to Invoice on One Phone | Forever Gold AI',
  documents: 'Paperwork and Phone Signatures | Forever Gold AI',
  'team-apps': "Apps That Run Your Crew's Day | Forever Gold AI",
  'ai-operations': 'One System Instead of Ten Tabs | Forever Gold AI',
};

const DESCRIPTIONS = {
  home: 'Forever Gold AI builds systems that answer calls, follow up leads, book the job, and send the invoice. Built in Bozeman, Montana, for businesses anywhere.',
  systems: 'Eight AI systems for calls, follow-up, websites, booking, invoices, documents, crew apps, and operations. See which stage each one fits.',
  'ai-receptionist': 'An AI receptionist answers in your business name, books or takes a message, and sends you the summary. Unsure calls come to you.',
  'speed-to-lead': 'Speed-to-lead calls a new lead, then texts, then emails, and shows you what was said. The path is adjustable when your offer changes.',
  websites: 'Websites with the offer above the fold, click to call, click to text, and a form tested before launch. Search basics on every page.',
  booking: 'Online booking shows open times, checks the slot again before confirm, reminds the customer, and puts the job on your calendar.',
  'job-to-invoice': 'Clock in, log parts, close the job, and approve the invoice draft before it sends. The close-out lives on the phone at the job.',
  documents: 'Drop in paperwork, approve the draft, send the agreement, and keep one signed PDF with an audit trail for both sides.',
  'team-apps': 'Crew apps for photo clock-in, a first-week checklist, shift check sheets, and reports that land in your inbox.',
  'ai-operations': 'Map how the business runs, connect the tools you already use, and put the numbers on one screen. Failures raise an alert.',
  stages: 'Start, Grow, and Scale. See the signs of each stage, what breaks first, what to build first, and why the next stage gets easier.',
  numbers: 'Verified research on missed-call callbacks and small-business AI use, plus two calculators that use only the numbers you type.',
  gold: 'How Forever Gold AI takes mistakes out: type a fact once, check before acting, flag every failure, and keep a person where it matters.',
  work: 'See Gold Mobile Mechanic and the tools Forever Gold AI runs, including GoldSign, Crew Start, and Document Processing.',
  about: 'Thomas Gutierrez, founder of Forever Gold AI in Bozeman, Montana. Seven years as a restaurant general manager, now building AI systems for owners.',
  audit: 'Request a free systems audit or a free 15-minute call. We look at calls, leads, scheduling, quotes, and invoices, then name the first systems.',
  contact: 'Call or text Thomas at (406) 698-6693, book a free 15-minute call, or send a short note. Forever Gold AI is based in Bozeman, Montana.',
  faq: 'Straight answers on tech skill, breakdowns, later changes, voice, staff, cost, timing, working outside Montana, and the tools we use.',
  privacy: 'What Forever Gold AI forms collect and why, how text messages work, STOP and HELP, and the rule that your number is not sold for marketing.',
  sms: 'SMS terms for Forever Gold AI. Who texts, what the texts cover, frequency varies, STOP and HELP, message rates, and a link to the privacy policy.',
  missing: 'This page is not on the Forever Gold AI site. Go home, see the systems, request a free audit, or call and text Thomas.',
};

export const PAGES = [
  { slug: '', title: 'AI Automation for Small Business | Forever Gold AI', description: DESCRIPTIONS.home, body: home, bodyClass: 'page-home', schema: (ctx) => [businessSchema(ctx), webSiteSchema(ctx)] },
  { slug: 'systems', title: 'Eight AI Systems for Business | Forever Gold AI', description: DESCRIPTIONS.systems, body: systemsHub, schema: (ctx) => [breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'systems', name: 'Systems' }])] },
  ...SITE.systems.map((system) => ({
    slug: `systems/${system.id}`,
    title: TITLES[system.id],
    description: DESCRIPTIONS[system.id],
    body: (ctx) => systemPage(ctx, system),
    schema: (ctx) => [
      serviceSchema(ctx, system),
      breadcrumbSchema(ctx, [
        { path: '', name: 'Home' },
        { path: 'systems', name: 'Systems' },
        { path: `systems/${system.id}`, name: system.nav },
      ]),
    ],
  })),
  { slug: 'stages', title: 'Start, Grow, and Scale | Forever Gold AI', description: DESCRIPTIONS.stages, body: stagesPage, schema: (ctx) => [breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'stages', name: 'Stages' }])] },
  { slug: 'the-numbers', title: 'The Numbers Behind the Work | Forever Gold AI', description: DESCRIPTIONS.numbers, body: numbersPage, schema: (ctx) => [breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'the-numbers', name: 'The Numbers' }])] },
  { slug: 'gold-standard', title: 'How Failures Get Caught | Forever Gold AI', description: DESCRIPTIONS.gold, body: goldPage, schema: (ctx) => [breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'gold-standard', name: 'Gold Standard' }])] },
  { slug: 'work', title: 'See the Systems Working | Forever Gold AI', description: DESCRIPTIONS.work, body: workPage, schema: (ctx) => [breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'work', name: 'Work' }])] },
  { slug: 'about', title: 'Thomas Gutierrez, Founder | Forever Gold AI', description: DESCRIPTIONS.about, body: aboutPage, schema: (ctx) => [aboutSchema(), businessSchema(ctx), breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'about', name: 'About' }])] },
  { slug: 'free-audit', title: 'Free Systems Audit | Forever Gold AI', description: DESCRIPTIONS.audit, body: auditPage, schema: (ctx) => [contactSchema('Free audit'), breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'free-audit', name: 'Free audit' }])] },
  { slug: 'contact', title: 'Call or Text Thomas | Forever Gold AI', description: DESCRIPTIONS.contact, body: contactPage, schema: (ctx) => [contactSchema('Contact'), businessSchema(ctx), breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'contact', name: 'Contact' }])] },
  { slug: 'faq', title: 'Questions Owners Ask | Forever Gold AI', description: DESCRIPTIONS.faq, body: faqPage, schema: (ctx) => [faqSchema(FAQS), breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'faq', name: 'FAQ' }])] },
  { slug: 'privacy', title: 'Privacy Policy | Forever Gold AI', description: DESCRIPTIONS.privacy, body: privacyPage, schema: (ctx) => [breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'privacy', name: 'Privacy' }])] },
  { slug: 'sms-terms', title: 'Text Message Terms | Forever Gold AI', description: DESCRIPTIONS.sms, body: smsPage, schema: (ctx) => [breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'sms-terms', name: 'SMS Terms' }])] },
  { slug: '', file: '404.html', linkSlug: '', depth: 0, inSitemap: false, title: 'Page Not Found | Forever Gold AI', description: DESCRIPTIONS.missing, body: missing, schema: () => [] },
];
