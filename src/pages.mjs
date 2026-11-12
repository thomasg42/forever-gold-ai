import { SITE, liveStats, shownWork, statById } from '../site.config.mjs';
import {
  aboutSchema,
  breadcrumbSchema,
  businessSchema,
  callLabel,
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
import { CONSULT_FAQS, FAQ_TEASER, FAQS } from './faqs.mjs';
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
  const widget = ctx.SITE.goldie && ctx.SITE.goldie.widget;
  const agentId = widget && widget.agentId;
  const talk = agentId
    ? '<p>Tap to talk to Goldie, an AI receptionist built by Forever Gold AI. She can book a free call with Thomas. Her button sits at the bottom of every page on this site.</p>'
    : '<p>Goldie, our own AI receptionist, is coming to this page.</p>';
  return `<section id="talk-to-goldie" data-goldie-slot>
  <h2>Talk to Goldie</h2>
  ${talk}
  <div class="btn-row">
    <a class="btn btn-gold" href="${ctx.tel}">Call ${esc(ctx.SITE.phone.display)}</a>
    <a class="btn btn-ghost" href="${ctx.sms}">Text Thomas</a>
  </div>
</section>`;
}

const COVERS = [
  { id: 'invoices', title: 'Invoices and receipts', text: 'Every invoice and receipt in one place, tied to the job and the customer, instead of the truck, the inbox and a shoebox.' },
  { id: 'quotes', title: 'Quotes', text: 'Quotes drafted from your job notes and held for your approval before they go out.' },
  { id: 'customers', title: 'Customer records', text: 'One record per customer: what they asked for, what you quoted, what they paid. Nobody retypes a name.' },
  { id: 'calls', title: 'Calls and leads', text: 'Calls answered in your business name, every new lead followed up, and the record kept on the customer.' },
  { id: 'schedule', title: 'Scheduling and jobs', text: 'Bookings that check the slot before they confirm, with the job and the close-out in the same place.' },
  { id: 'crew', title: 'Crew and paperwork', text: 'Clock-ins, checklists, time sheets and signed agreements on a phone instead of a pile on the seat.', full: true },
  { id: 'numbers', title: 'The numbers', text: 'The numbers you choose to watch, on one screen, from the same records the rest of the business uses.' },
];

const STAKES = [
  'Quotes and invoices get written at night.',
  'Receipts ride around in the truck.',
  'Calls go to voicemail while you are on a job.',
  'Leads go cold before anyone calls back.',
  'Every new hire means explaining the business again.',
  'The numbers live in ten different tabs.',
];

function coversGrid({ full = false } = {}) {
  const cards = COVERS.filter((item) => full || !item.full).map((item) => `<article class="pillar frame reveal" data-cover="${item.id}"><div class="frame-inner"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div></article>`).join('');
  return `<div class="pillar-grid consult-grid">${cards}</div>`;
}

function stakes() {
  const items = STAKES.map((line) => `<li class="reveal">${esc(line)}</li>`).join('');
  return `<section class="section section-ivory" data-stakes>
  <div class="wrap">
    <p class="kicker">Sound familiar?</p>
    <h2>The business runs on your memory.</h2>
    <ul class="stakes-list">${items}</ul>
    <p class="stakes-turn reveal">None of that is a work ethic problem. It is a systems problem, and systems are what Thomas builds.</p>
  </div>
</section>`;
}

function guide(ctx, { more = true } = {}) {
  return `<div class="guide reveal" data-guide>
    <p class="kicker">Your AI consultant</p>
    <blockquote class="guide-quote"><p>Seven years as a restaurant general manager taught me a business runs on systems, not on how hard the owner works.</p></blockquote>
    <p class="guide-by">Thomas Gutierrez, founder of Forever Gold AI</p>
    <p>Thomas is an AI consultant in Bozeman, Montana. He comes into the business, finds what is holding it back, takes the pressure off the owner, and builds the systems himself. Everything is customized.</p>
    <p>He runs his own business on the same systems. If he has built it for himself, he can build it for you.</p>
    ${more ? `<p><a class="text-link" href="${ctx.link('about')}">Meet Thomas</a></p>` : ''}
  </div>`;
}

function ownAi() {
  return `<div class="own-ai reveal" data-own-ai>
    <p class="kicker">Tell it once</p>
    <h2>Your business gets its own AI.</h2>
    <p>Everything Thomas builds feeds one system that knows your services, your customers, your invoices and your numbers. It answers from what you approved. Anything it is unsure about comes to you.</p>
    <p>It grows with you. Add a service, a crew or a location and you tell it once. The next person you hire does not need the whole business explained from memory.</p>
    <p>Forever Gold AI keeps it running and upgrading as AI changes. It is not sealed on launch day.</p>
  </div>`;
}

function steps() {
  return `<ol class="flow consult-steps">
      <li class="reveal"><span><strong>Sit down.</strong> A free AI consultant audit looks at how calls, leads, scheduling, quotes and invoices move through your business today, and names the first three systems worth building.</span></li>
      <li class="reveal"><span><strong>Build.</strong> Thomas builds those systems around the way you already work, in the order that pays first.</span></li>
      <li class="reveal"><span><strong>Run it.</strong> Forever Gold AI keeps it running and upgrading. If something breaks, Thomas gets the alert. Change a script, a time or a rule any time you grow.</span></li>
    </ol>`;
}

function actionRow(ctx, auditHref) {
  return `<div class="btn-row">
      <a class="btn btn-gold" href="${ctx.tel}" aria-label="${callLabel(ctx)}" data-call-now>Call Now · ${esc(ctx.SITE.phone.display)}</a>
      <a class="btn btn-ghost" href="${auditHref || ctx.link('free-audit')}">Get my free AI consultant audit</a>
    </div>`;
}

function home(ctx) {
  const cards = ctx.SITE.systems.map((system) => systemCard(ctx, system)).join('');
  return `${homeHero(ctx)}
${stakes()}
<section class="section">
  <div class="wrap">
    <p class="kicker">The cost of doing it by hand</p>
    <h2>Three numbers, from three sources.</h2>
    <p>These measure different things. Read them side by side on <a href="${ctx.link('the-numbers')}">The Numbers</a>.</p>
    <div class="stat-grid reveal">${statGroup(ctx.SITE.homeStatIds)}</div>
  </div>
</section>
<section class="section section-ivory">
  <div class="wrap prose">${guide(ctx)}</div>
</section>
<section class="section" data-covers>
  <div class="wrap">
    <p class="kicker">What AI consulting covers</p>
    <h2>The back office only you know about.</h2>
    <p class="lead">Most of the business lives in your head and a few tabs. Thomas puts it on one system that grows with you.</p>
    ${coversGrid()}
    <p><a class="text-link" href="${ctx.link('consulting')}">How AI consulting works</a></p>
  </div>
</section>
<section class="section section-ivory">
  <div class="wrap prose">${ownAi()}</div>
</section>
${swoosh()}
${tuesday(ctx)}
<section class="section" data-tuesday-action>
  <div class="wrap prose reveal">
    <h2>Want the second Tuesday?</h2>
    <p>It starts with one conversation about how your week runs today.</p>
    ${actionRow(ctx)}
  </div>
</section>
<section class="section section-ivory" data-plan>
  <div class="wrap prose">
    <p class="kicker">How it works</p>
    <h2>Sit down. Build. Run it.</h2>
    ${steps()}
  </div>
</section>
${swoosh()}
<section class="section">
  <div class="wrap">
    <p class="kicker">What gets built</p>
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
${ctaBand(ctx, { title: 'Sit down with an AI consultant.', href: ctx.link('free-audit'), lead: 'Free audit. Real answers. No pressure.' })}`;
}

function consultingPage(ctx) {
  const who = ctx.SITE.audiences.map((name) => `<li>${esc(name)}</li>`).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'consulting', name: 'AI consulting' }])}
<header class="page-intro wrap">
  <p class="kicker">AI consulting</p>
  <h1>The back office only you know about.</h1>
  <p class="lead">Invoices, receipts, customer notes, who still owes a call. Most of it lives in your head. Thomas Gutierrez is an AI consultant who puts it on one system, so the business stops running on your memory.</p>
  ${actionRow(ctx)}
  <p class="reassure">Free audit. Real answers. No pressure.</p>
</header>
<section class="section section-ivory"><div class="wrap prose reveal">
  <h2>What holds a business back</h2>
  <p>It is rarely the work. It is the bookkeeping that does not talk to the rest of the business. The receipt in the truck. The quote you meant to send. The customer who called twice and got two different answers.</p>
  <p>Things fall through the cracks because the only place they all meet is you. Every new hire, every new tool and every busy week means explaining the business again.</p>
  <p>An AI consultant fixes the system, not the people. Thomas comes in, finds what is holding the business back, and cleans it up.</p>
</div></section>
<section class="section" data-covers><div class="wrap">
  <p class="kicker">What AI consulting covers</p>
  <h2>Seven piles of work. One system.</h2>
  ${coversGrid({ full: true })}
</div></section>
<section class="section section-ivory" data-plan><div class="wrap prose">
  <p class="kicker">How it works</p>
  <h2>Sit down. Map and build. Run it.</h2>
  <ol class="flow consult-steps">
    <li class="reveal"><span><strong>Sit down.</strong> A free AI consultant audit looks at how calls, leads, scheduling, quotes and invoices move through your business today. Thomas shows what AI can do for a business like yours right now and names the first three systems worth building.</span></li>
    <li class="reveal"><span><strong>Map and build.</strong> Thomas maps how a call becomes a job, a job becomes an invoice, and an invoice becomes a paid week. He finds where things fall through, cleans it up, and builds in the order that pays first, around the tools you already use.</span></li>
    <li class="reveal"><span><strong>Run it.</strong> Everything connects into one system that remembers the business. Forever Gold AI keeps it running and upgrading. If something breaks, Thomas gets the alert and fixes it.</span></li>
  </ol>
  ${actionRow(ctx)}
</div></section>
<section class="section"><div class="wrap prose">${ownAi()}</div></section>
<section class="section section-ivory" data-subscriptions><div class="wrap prose reveal">
  <h2>Stop paying for tools that each do one piece.</h2>
  <p>If you pay a stack of monthly subscriptions for tools that each do one piece, Thomas can rebuild some of those platforms around your business. It is customized, on your terms, and not at the mercy of someone else's price changes.</p>
  <p>Ask about it in the free audit.</p>
</div></section>
<section class="section"><div class="wrap">
  <h2>Who it is for</h2>
  <p class="lead">Owners who are still the bottleneck in their own business. If a missed call is a lost job, start here.</p>
  <ul class="chip-list chip-dark">${who}</ul>
</div></section>
<section class="section section-ivory"><div class="wrap prose">${guide(ctx)}</div></section>
<section class="section"><div class="wrap">
  <h2>Questions owners ask about AI consulting</h2>
  ${faqList(CONSULT_FAQS)}
  <p><a class="text-link" href="${ctx.link('faq')}">All questions</a></p>
</div></section>
${ctaBand(ctx, { title: 'Sit down with an AI consultant. Free.', href: ctx.link('free-audit'), lead: 'Call now, or request the free audit.' })}`;
}

function systemsHub(ctx) {
  const cards = ctx.SITE.systems.map((system) => systemCard(ctx, system)).join('');
  const who = ctx.SITE.audiences.map((name) => `<li>${esc(name)}</li>`).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'systems', name: 'Systems' }])}
${pageHead('Systems', 'AI systems for the work you already do', 'Each system answers one pile of work. Start with one and add the next when the business grows. The free audit names which comes first.')}
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
    ${system.id === 'ai-operations' ? `<p class="consult-link">Want the whole picture first? <a href="${ctx.link('consulting')}">AI consulting</a> starts with the map and ends with one system that remembers the business, at any stage.</p>` : ''}
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
</div></section>
${ctaBand(ctx, { title: 'Want your own numbers looked at?', href: ctx.link('free-audit'), lead: 'The free audit starts from your calls, leads and invoices.' })}`;
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
<section class="section section-ivory"><div class="wrap"><h2>Tools we built and run</h2><div class="card-grid">${tools}</div></div></section>
${ctaBand(ctx, { title: 'Want this working in your business?', href: ctx.link('free-audit'), lead: 'Tell us what hurts. We will show you the first systems worth building.' })}`;
}

function aboutPage(ctx) {
  const photo = ctx.SITE.photos.thomas
    ? `<img src="${ctx.asset(ctx.SITE.photos.thomas)}" alt="Thomas Gutierrez" width="800" height="1000">`
    : '';
  const socials = ctx.SITE.socials.map((item) => `<li><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.name)}</a></li>`).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'about', name: 'About' }])}
${pageHead('About', 'Thomas Gutierrez, AI consultant', 'The founder of Forever Gold AI, and the person who comes into your business.')}
<section class="section"><div class="wrap prose about-grid">
  <div>
    <blockquote class="guide-quote"><p>Seven years as a restaurant general manager taught me a business runs on systems, not on how hard the owner works.</p></blockquote>
    <p>Thomas Gutierrez is an AI consultant based in Bozeman, Montana, and the founder of Forever Gold AI. He goes into a business, finds what is holding it back, takes the pressure off the owner, and builds the systems that fix it.</p>
    <p>Everything is customized. If he has built it for himself, he can build it for you. He runs his own business on the same systems, including Gold Mobile Mechanic, the mechanic business Forever Gold AI owns.</p>
    <p>Built in Montana. Working with businesses anywhere. Meetings are in person or on Google Meet.</p>
    <ul class="link-list">${socials}</ul>
  </div>
  ${photo}
</div></section>
${ctaBand(ctx, { title: 'Talk with Thomas.', href: ctx.link('free-audit'), lead: 'Free AI consultant audit, or a free 15-minute call.' })}`;
}

function auditPage(ctx) {
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'free-audit', name: 'Free AI consultant audit' }])}
${pageHead('Free AI consultant audit', 'Sit down with an AI consultant. Free.', 'AI changes every month. A free audit with AI consultant Thomas Gutierrez shows you what is out there right now and where it fits your business.')}
<section class="section section-ivory"><div class="wrap">
  <div class="reveal">
    <p class="kicker">Why owners ask for it</p>
    <h2>You keep hearing AI can run half your office. Nobody has shown you which half.</h2>
    <p>Thomas is an AI consultant based in Bozeman, Montana. He builds AI operations and AI systems, and he runs his own business on them.</p>
  </div>
  <div class="reveal">
    <h2>What the AI consultant looks at</h2>
    <ol class="flow">
      <li><span>How calls, leads, scheduling, quotes and invoices move through your business today.</span></li>
      <li><span>What AI tools can do for a business like yours right now.</span></li>
      <li><span>The first three systems worth building.</span></li>
    </ol>
  </div>
</div></section>
<section class="section"><div class="wrap form-layout">
  <div>
    <h2 class="reveal">Request your free AI consultant audit</h2>
    ${auditForm(ctx)}
  </div>
  <aside class="form-aside">
    <p>Rather talk to the AI consultant now?</p>
    <p><a class="btn btn-gold" href="${ctx.tel}" aria-label="${callLabel(ctx)}" data-call-now>Call Now · ${esc(ctx.SITE.phone.display)}</a></p>
    <p><a class="btn btn-ghost" href="${ctx.sms}">Text Thomas</a></p>
    <p>${bookLink(ctx)}</p>
  </aside>
</div></section>`;
}

function contactPage(ctx) {
  const socials = ctx.SITE.socials.map((item) => `<li><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.name)}</a></li>`).join('');
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'contact', name: 'Contact' }])}
${pageHead('Contact', 'Call, text, or book a free call.', 'The fastest way to reach Thomas is to call. If he is with a client, text and he will get back to you.')}
<section class="section"><div class="wrap contact-grid">
  <div>
    <p><a class="btn btn-gold" href="${ctx.tel}" aria-label="${callLabel(ctx)}" data-call-now>Call Now · ${esc(ctx.SITE.phone.display)}</a></p>
    <p><a class="btn btn-ghost" href="${ctx.sms}">Text Thomas</a></p>
    <p>${bookLink(ctx)}</p>
    <ul class="link-list">${socials}</ul>
  </div>
  ${contactForm(ctx)}
</div></section>`;
}

function faqPage(ctx) {
  return `${crumbs(ctx, [{ path: '', name: 'Home' }, { path: 'faq', name: 'FAQ' }])}
${pageHead('FAQ', 'Questions owners ask', 'Straight answers on AI consulting, the systems, cost, timing, and working outside Montana.')}
<section class="section section-ivory"><div class="wrap">
  <h2>About AI consulting</h2>
  ${faqList(CONSULT_FAQS)}
  <h2>About the systems</h2>
  ${faqList(FAQS)}
</div></section>
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
  <h2>Ads and measurement</h2>
  <p>This site uses the Meta Pixel so we can see which Facebook and Instagram ads bring visitors and requests. It records page visits, and whether a form was sent or a call, text, or booking link was tapped. We do not add your form answers to what it sends. Meta may set cookies under its own data policy. You can limit ad tracking in your Facebook and Instagram ad settings or block cookies in your browser.</p>
  <h2>Talking to Goldie</h2>
  <p>Goldie is Forever Gold AI's AI voice assistant. She runs on ElevenLabs. If you tap her button and talk, your voice is processed and the conversation is recorded and transcribed so Thomas gets a summary. If you book a meeting, your name, email and phone number go to Thomas's calendar and email. Please do not share payment details or other sensitive information with her.</p>
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
    <a class="btn btn-gold" href="${ctx.tel}" aria-label="${callLabel(ctx)}" data-call-now>Call Now · ${esc(ctx.SITE.phone.display)}</a>
    <a class="text-link" href="${ctx.sms}">Text Thomas</a>
  </div>
</div></section>`;
}

function consultingSchema(ctx) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'AI consulting',
    serviceType: 'AI consulting',
    description: DESCRIPTIONS.consulting,
    provider: { '@id': ctx.abs('#business') },
  };
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
  home: 'AI consultant Thomas Gutierrez puts your invoices, receipts, leads and calls on one system that remembers your business. Bozeman, Montana, working anywhere.',
  consulting: 'AI consulting for the back office only you know about. Thomas maps the work, cleans it up, and builds one system that grows with your business.',
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
  about: 'Thomas Gutierrez, AI consultant and founder of Forever Gold AI in Bozeman, Montana. Seven years as a restaurant GM, now building AI systems for owners.',
  audit: 'Free audit with an AI consultant. Thomas looks at your calls, leads, scheduling, quotes, and invoices, shows what AI can do now, and names the first systems.',
  contact: 'Call or text Thomas at (406) 698-6693, book a free 15-minute call, or send a short note. Forever Gold AI is based in Bozeman, Montana.',
  faq: 'Straight answers on AI consulting, tech skill, breakdowns, later changes, voice, staff, cost, timing, working outside Montana, and the tools.',
  privacy: 'What Forever Gold AI forms collect and why, how text messages work, STOP and HELP, and the rule that your number is not sold for marketing.',
  sms: 'SMS terms for Forever Gold AI. Who texts, what the texts cover, frequency varies, STOP and HELP, message rates, and a link to the privacy policy.',
  missing: 'This page is not on the Forever Gold AI site. Go home, see the systems, request a free audit, or call and text Thomas.',
};

export const PAGES = [
  { slug: '', title: 'AI Consultant for Small Business | Forever Gold AI', description: DESCRIPTIONS.home, body: home, bodyClass: 'page-home', schema: (ctx) => [businessSchema(ctx), webSiteSchema(ctx)] },
  { slug: 'consulting', title: 'AI Consulting for Your Back Office | Forever Gold AI', description: DESCRIPTIONS.consulting, body: consultingPage, schema: (ctx) => [consultingSchema(ctx), faqSchema(CONSULT_FAQS), breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'consulting', name: 'AI consulting' }])] },
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
  { slug: 'about', title: 'Thomas Gutierrez, AI Consultant | Forever Gold AI', description: DESCRIPTIONS.about, body: aboutPage, schema: (ctx) => [aboutSchema(), businessSchema(ctx), breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'about', name: 'About' }])] },
  { slug: 'free-audit', title: 'Free AI Consultant Audit | Forever Gold AI', description: DESCRIPTIONS.audit, body: auditPage, schema: (ctx) => [contactSchema('Free AI consultant audit'), breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'free-audit', name: 'Free AI consultant audit' }])] },
  { slug: 'contact', title: 'Call or Text Thomas | Forever Gold AI', description: DESCRIPTIONS.contact, body: contactPage, schema: (ctx) => [contactSchema('Contact'), businessSchema(ctx), breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'contact', name: 'Contact' }])] },
  { slug: 'faq', title: 'Questions Owners Ask | Forever Gold AI', description: DESCRIPTIONS.faq, body: faqPage, schema: (ctx) => [faqSchema([...CONSULT_FAQS, ...FAQS]), breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'faq', name: 'FAQ' }])] },
  { slug: 'privacy', title: 'Privacy Policy | Forever Gold AI', description: DESCRIPTIONS.privacy, body: privacyPage, schema: (ctx) => [breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'privacy', name: 'Privacy' }])] },
  { slug: 'sms-terms', title: 'Text Message Terms | Forever Gold AI', description: DESCRIPTIONS.sms, body: smsPage, schema: (ctx) => [breadcrumbSchema(ctx, [{ path: '', name: 'Home' }, { path: 'sms-terms', name: 'SMS Terms' }])] },
  { slug: '', file: '404.html', linkSlug: '', depth: 0, inSitemap: false, noindex: true, title: 'Page Not Found | Forever Gold AI', description: DESCRIPTIONS.missing, body: missing, schema: () => [] },
];
