// Forever Gold CRM front end. Plain ES modules with no build step.
// This file is public, so it holds no client names and no customer data. Everything comes from the Worker
// after sign-in. All sheet text is untrusted (it comes from callers and forms), so it is only ever
// placed with text nodes, never as HTML.
import { HAND_SOURCES, MONEY_FIELDS, NOTES_MAX, STATUS_OPTIONS, adIdFromSource, digitsOnly, needsFollowUp, summarize } from './shared/leads.js';

const API_BASE = 'https://forever-gold-crm.forevergoldai.workers.dev';
const SESSION_KEY = 'fg_crm_session';
const TIME_ZONE = 'America/Denver';
const HELP_PHONE = '(406) 698-6693';
// Live updates: an open dashboard checks for new customers and numbers on its own.
// It never redraws while someone is typing, saving, or has touched the page in the last QUIET_MS,
// and the lead and add-a-customer pages never redraw on their own at all.
const LIVE_EVERY_MS = 60_000;
const QUIET_MS = 20_000;

class ApiError extends Error {
  constructor(status, code, message, data = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function call(path, { method = 'GET', body, token } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'offline', 'Could not reach the CRM. Check your connection and try again.');
  }
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) throw new ApiError(response.status, data.error || 'server_error', data.message || 'Something went wrong. Nothing was changed.', data);
  return data;
}

const liveApi = {
  businesses: () => call('/api/businesses'),
  login: (business, pin, remember) => call('/api/login', { method: 'POST', body: { business, pin, remember } }),
  leads: (business, token) => call(`/api/leads?business=${encodeURIComponent(business)}`, { token }),
  overview: (token) => call('/api/overview', { token }),
  update: (payload, token) => call('/api/leads/update', { method: 'POST', body: payload, token }),
  add: (payload, token) => call('/api/leads/add', { method: 'POST', body: payload, token }),
  ads: (business, range, token) => call(`/api/ads?business=${encodeURIComponent(business)}&range=${encodeURIComponent(range)}`, { token }),
  site: (business, range, token) => call(`/api/site?business=${encodeURIComponent(business)}&range=${encodeURIComponent(range)}&t=${Date.now()}`, { token }),
};
const api = () => window.CRM_API || liveApi;

const state = {
  ticket: 0,
  businesses: null,
  teamSlug: 'forever-gold',
  cache: {},
  drafts: {},
  filter: { view: 'follow', source: 'all', q: '', showTests: false },
  adsRange: 'launch',
  siteRange: '7d',
  siteCache: {},
  adsCache: {},
  adNames: {},
  lastTouch: 0,
  saving: 0,
  liveTimer: null,
  teamData: null,
  prints: {},
};

// Sessions: the token only, never customer data. A browser may refuse storage, so every touch is guarded.
function readStore(store) {
  try {
    return JSON.parse(window[store].getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}
function getSession() {
  const session = readStore('localStorage') || readStore('sessionStorage') || state.memorySession || null;
  if (session && session.expiresAt && session.expiresAt * 1000 <= Date.now()) {
    clearSession();
    return null;
  }
  return session;
}
function saveSession(session, remember) {
  clearSession();
  state.memorySession = session;
  try {
    window[remember ? 'localStorage' : 'sessionStorage'].setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked: the session lasts until this page closes.
  }
}
function clearSession() {
  state.memorySession = null;
  for (const store of ['localStorage', 'sessionStorage']) {
    try {
      window[store].removeItem(SESSION_KEY);
    } catch {
      // Nothing to clear.
    }
  }
}
function signOut() {
  clearSession();
  state.cache = {};
  state.siteCache = {};
  state.adsCache = {};
  state.drafts = {};
  state.teamData = null;
  state.prints = {};
  go('#/');
}

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'value') {
      el.value = value;
      el.setAttribute('value', value);
    } else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

function setBrand(name) {
  const slot = document.getElementById('brand-name');
  const label = name ? `Forever Gold CRM / ${name}` : 'Forever Gold CRM';
  if (slot) slot.textContent = label;
  document.title = label;
}
const appEl = () => document.getElementById('app');
function show(...nodes) {
  const app = appEl();
  app.replaceChildren(...nodes.flat().filter(Boolean));
  if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  if (typeof app.focus === 'function') app.focus({ preventScroll: true });
}
// A live redraw: same page, same scroll spot, and focus stays where the person left it.
function showQuietly(...nodes) {
  const y = typeof window.scrollY === 'number' ? window.scrollY : 0;
  appEl().replaceChildren(...nodes.flat().filter(Boolean));
  if (y && typeof window.scrollTo === 'function') window.scrollTo(0, y);
}
function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

const fmtMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
function fmtWhen(ms) {
  if (ms === null || ms === undefined) return 'No date recorded';
  return new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
}
function fmtClock(ms) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(ms));
}
// Speed to lead: how long an inquiry has sat with nobody recorded as contacting it.
// It counts from when the inquiry came in, so it is only as right as the Contact column.
function waitedFor(ms) {
  const minutes = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  if (minutes < 1) return 'under 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} days`;
}
function waitTier(ms) {
  const minutes = (Date.now() - ms) / 60000;
  if (minutes < 5) return 'fresh';
  return minutes < 60 ? 'warm' : 'late';
}
function fmtDay(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text || '');
  if (!match) return text;
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', dateStyle: 'medium' }).format(new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])));
}
function fmtPhone(phone) {
  const digits = digitsOnly(phone);
  return digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : phone;
}
function telHref(phone) {
  const digits = digitsOnly(phone);
  if (digits.length === 10) return `tel:+1${digits}`;
  return digits.length > 10 && digits.length <= 15 ? `tel:+${digits}` : null;
}
const safeMail = (email) => (/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email || '') ? `mailto:${email}` : null);

const SOURCE_LABEL = { ad: 'From an ad', other: 'Other source', none: 'Source not recorded' };

function errorBox(error, retry) {
  return h('div', { class: 'page wrap' },
    h('h1', {}, 'That did not load'),
    h('p', { class: 'message', role: 'alert' }, error.message),
    h('p', { class: 'note' }, `This does not mean there are no records. If it keeps happening, call ${HELP_PHONE}.`),
    retry && h('button', { class: 'btn', type: 'button', onClick: retry }, 'Try again'));
}

// A session expired or the PIN changed: back to the sign-in for that business.
function handleSignedOut(error, slug) {
  if (error.status !== 401) return false;
  clearSession();
  go(`#/sign-in/${encodeURIComponent(slug)}`);
  return true;
}

async function loadBusinesses() {
  if (state.businesses) return state.businesses;
  const data = await api().businesses();
  state.businesses = data.businesses;
  state.teamSlug = data.teamSlug || state.teamSlug;
  return state.businesses;
}

// ---------- Picker ----------
const JOURNEY = [
  ['Inquiry', 'A customer reaches out from your ad or website.'],
  ['Reached', 'You talked to them, or you tried and logged it.'],
  ['Booked', 'They are on your schedule.'],
  ['Finished', 'The job is done.'],
  ['Paid', 'The money is in, and you can see what the ads really brought back.'],
];

function lightUpJourney(root) {
  const steps = [...root.querySelectorAll('.step')];
  const calm = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || typeof window.IntersectionObserver !== 'function') {
    steps.forEach((step) => step.classList.add('on'));
    return;
  }
  const watcher = new window.IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('on');
        watcher.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -20% 0px' });
  steps.forEach((step) => watcher.observe(step));
}

async function renderPicker(ticket) {
  setBrand('');
  const session = getSession();
  const list = h('ul', { class: 'picker', 'aria-label': 'Businesses' }, h('li', { class: 'note' }, 'Loading businesses...'));
  const journey = h('section', { class: 'journey wrap', 'aria-labelledby': 'journey-title' },
    h('h2', { id: 'journey-title' }, 'What you see inside'),
    h('p', {}, 'One place to follow every customer, from the first message to the money.'),
    h('ol', { class: 'steps' }, JOURNEY.map(([title, text]) => h('li', { class: 'step' }, h('h3', {}, title), h('p', {}, text)))));
  const teamHref = session?.isTeam ? '#/team' : `#/sign-in/${encodeURIComponent(state.teamSlug)}`;
  show(
    h('section', { class: 'hero wrap' },
      h('h1', {}, 'Forever Gold CRM'),
      h('p', {}, 'Tap your business. Enter your PIN. See your website and your customers.')),
    h('section', { class: 'wrap', 'aria-label': 'Choose your business' }, list,
      h('p', { class: 'team-link' }, h('a', { href: teamHref }, 'Forever Gold team sign-in'))),
    journey,
  );
  lightUpJourney(journey);
  try {
    const businesses = await loadBusinesses();
    if (ticket !== state.ticket) return;
    list.replaceChildren(...businesses.map((business) => {
      const signedIn = session && (session.isTeam || session.slug === business.slug);
      return h('li', {}, h('a', {
        class: 'pick',
        href: signedIn ? `#/b/${encodeURIComponent(business.slug)}` : `#/sign-in/${encodeURIComponent(business.slug)}`,
      }, h('span', {}, business.name), h('span', { 'aria-hidden': 'true' }, '>')));
    }));
  } catch (error) {
    if (ticket !== state.ticket) return;
    list.replaceChildren(h('li', { class: 'message', role: 'alert' }, `${error.message} You can call ${HELP_PHONE}.`));
  }
}

// ---------- Sign in ----------
async function renderSignIn(slug, ticket) {
  let name = 'Forever Gold team';
  try {
    const businesses = await loadBusinesses();
    if (ticket !== state.ticket) return;
    if (slug !== state.teamSlug) {
      const business = businesses.find((item) => item.slug === slug);
      if (!business) {
        go('#/');
        return;
      }
      name = business.name;
    }
    setBrand(slug === state.teamSlug ? '' : name);
  } catch (error) {
    if (ticket === state.ticket) show(errorBox(error, route));
    return;
  }
  const message = h('p', { class: 'message', role: 'alert' });
  const pin = h('input', { id: 'pin', name: 'pin', type: 'password', inputmode: 'numeric', autocomplete: 'current-password', required: true, maxlength: 64 });
  const remember = h('input', { id: 'remember', type: 'checkbox', checked: true });
  const submit = h('button', { class: 'btn btn-gold', type: 'submit' }, 'Sign in');
  const form = h('form', {
    novalidate: true,
    onSubmit: async (event) => {
      event.preventDefault();
      message.textContent = '';
      if (!pin.value) {
        message.textContent = 'Enter your PIN.';
        pin.focus();
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Checking...';
      try {
        const keep = remember.checked !== false;
        const result = await api().login(slug, pin.value, keep);
        saveSession({ token: result.token, slug: result.slug, isTeam: result.isTeam, expiresAt: result.expiresAt }, keep);
        state.cache = {};
        state.siteCache = {};
        state.adsCache = {};
        state.drafts = {};
        state.teamData = null;
        state.prints = {};
        if (!result.isTeam) requestSite(slug, result.token, state.siteRange);
        go(result.isTeam ? '#/team' : `#/b/${encodeURIComponent(slug)}`);
      } catch (error) {
        message.textContent = error.message;
        pin.value = '';
        submit.disabled = false;
        submit.textContent = 'Sign in';
        pin.focus();
      }
    },
  },
  h('label', { for: 'pin' }, 'PIN', pin),
  h('label', { class: 'check', for: 'remember' }, remember, 'Keep me signed in on this device'),
  submit);
  show(h('section', { class: 'signin wrap' },
    h('a', { class: 'crumb', href: '#/' }, 'All businesses'),
    h('h1', {}, name),
    message,
    form,
    h('p', { class: 'note' }, `Forgot your PIN? Call ${HELP_PHONE}.`)));
}

// ---------- Dashboard ----------
function statBox(label, value, note, extra) {
  const known = value !== null && value !== undefined;
  return h('div', { class: 'stat' },
    h('dt', {}, label),
    h('dd', { class: known ? null : 'unknown' }, known ? value : 'Unknown'),
    note && h('small', {}, note),
    extra || null);
}

// The share of inquiries that reached a step. Shown only when every inquiry has that step recorded,
// because a blank is not a no and would make the rate look worse than it is.
function stageRate(stage, inquiries) {
  if (!inquiries || stage.key === 'inquiries' || stage.count === null || stage.notRecorded) return null;
  return h('span', { class: 'rate' }, `${Math.round((stage.count / inquiries) * 100)}% of inquiries`);
}

function statsBlock(summary) {
  const notRecorded = (count) => (count ? `${count} not recorded` : null);
  const moneyNote = (item) => (item.recorded ? `from ${item.recorded} lead${item.recorded === 1 ? '' : 's'}` : 'none recorded yet');
  const money = (item) => (item.total === null ? null : fmtMoney(item.total));
  const inquiries = summary.stages[0]?.count || 0;
  return [
    h('dl', { class: 'stats funnel', 'aria-label': 'Where your leads stand' },
      summary.stages.map((stage) => statBox(stage.label, stage.count, notRecorded(stage.notRecorded), stageRate(stage, inquiries)))),
    h('dl', { class: 'stats money', 'aria-label': 'Money recorded' },
      statBox('Potential money', money(summary.potential), summary.potential.recorded ? `on ${summary.potential.recorded} open lead${summary.potential.recorded === 1 ? '' : 's'}` : 'Add an amount on a lead'),
      statBox('Money collected', money(summary.collected), moneyNote(summary.collected)),
      statBox('Job costs', money(summary.directCosts), moneyNote(summary.directCosts)),
      statBox('Other costs', money(summary.otherCosts), moneyNote(summary.otherCosts))),
  ];
}

const VIEWS = [
  ['follow', 'Needs follow-up', needsFollowUp],
  ['all', 'All', () => true],
  ['booked', 'Booked', (lead) => ['Booked', 'Rescheduled'].includes(lead.bookingStatus)],
  ['paid', 'Paid', (lead) => ['Deposit paid', 'Paid in full'].includes(lead.paymentStatus)],
];

function filteredLeads(leads) {
  const { view, source, q, showTests } = state.filter;
  const test = VIEWS.find(([id]) => id === view)[2];
  const needle = q.trim().toLowerCase();
  const needleDigits = needle.replace(/\D/g, '');
  return leads.filter((lead) => {
    if (lead.isTest && !showTests) return false;
    if (!lead.isTest && !test(lead)) return false;
    if (source !== 'all' && lead.sourceKind !== source) return false;
    if (!needle) return true;
    if ([lead.name, lead.displayEmail, lead.project, lead.outcomeNotes].some((text) => (text || '').toLowerCase().includes(needle))) return true;
    return needleDigits.length >= 3 && digitsOnly(lead.phone).includes(needleDigits);
  });
}

function waitPill(lead) {
  if (lead.receivedAt === null || lead.receivedAt === undefined) return h('span', { class: 'pill todo' }, 'Needs follow-up');
  return h('span', { class: `pill wait ${waitTier(lead.receivedAt)}`, 'data-since': String(lead.receivedAt) }, `Waiting ${waitedFor(lead.receivedAt)}`);
}

// Live ticks keep every waiting time current without redrawing the page.
function refreshWaitTimes() {
  for (const pill of document.querySelectorAll('.pill.wait[data-since]')) {
    const since = Number(pill.getAttribute('data-since'));
    pill.textContent = `Waiting ${waitedFor(since)}`;
    pill.className = `pill wait ${waitTier(since)}`;
  }
  for (const slot of document.querySelectorAll('.wait-text[data-since]')) slot.textContent = waitedFor(Number(slot.getAttribute('data-since')));
}

// The one thing to do next: call whoever has waited longest. Nothing here is a guess; it reads the Contact column.
function callNext(slug, data) {
  const waiting = data.leads.filter(needsFollowUp);
  if (!data.leads.some((lead) => !lead.isTest)) return null;
  if (!waiting.length) {
    return h('section', { class: 'next-up clear', 'aria-label': 'Who to call next' },
      h('div', { class: 'next-copy' },
        h('h2', {}, 'No one is waiting on a call'),
        h('p', {}, 'Every inquiry on your records has a contact or booking recorded.')));
  }
  const dated = waiting.filter((lead) => lead.receivedAt !== null && lead.receivedAt !== undefined).sort((a, b) => a.receivedAt - b.receivedAt);
  const first = dated[0] || waiting[0];
  const name = first.name || 'No name recorded';
  const tel = telHref(first.phone);
  const n = waiting.length;
  return h('section', { class: 'next-up', 'aria-label': 'Who to call next' },
    h('div', { class: 'next-copy' },
      h('h2', {}, `${count(n)} ${n === 1 ? 'person is' : 'people are'} waiting on a call`),
      dated.length
        ? h('p', {}, 'Longest wait: ', h('strong', {}, name), ', ', h('span', { class: 'wait-text', 'data-since': String(first.receivedAt) }, waitedFor(first.receivedAt)), '.')
        : h('p', {}, 'Next up: ', h('strong', {}, name), '.')),
    h('div', { class: 'next-actions' },
      tel && h('a', { class: 'btn btn-gold', href: tel, 'aria-label': `Call ${name} at ${fmtPhone(first.phone)}` }, 'Call now'),
      h('a', { class: 'btn', href: `#/b/${encodeURIComponent(slug)}/lead/${encodeURIComponent(first.key)}` }, 'Open')));
}

function leadCard(slug, lead, labels, onContacted = () => {}) {
  const pills = [
    lead.isTest && h('span', { class: 'pill test' }, 'Test'),
    needsFollowUp(lead) && waitPill(lead),
    lead.contactStatus && h('span', { class: 'pill' }, lead.contactStatus),
    lead.bookingStatus && h('span', { class: 'pill' }, lead.bookingStatus),
    lead.jobStatus && h('span', { class: 'pill' }, `Job: ${lead.jobStatus}`),
    lead.paymentStatus && h('span', { class: 'pill' }, lead.paymentStatus),
  ];
  const tel = telHref(lead.phone);
  const name = lead.name || 'No name recorded';
  const contacted = ['Reached', 'Qualified', 'Not a fit'].includes(lead.contactStatus);
  const box = h('input', { type: 'checkbox', checked: contacted, 'aria-label': `Did we contact ${name}?` });
  box.addEventListener('change', () => onContacted(lead, box));
  return h('li', { class: 'lead' },
    h('a', { class: 'lead-main', href: `#/b/${encodeURIComponent(slug)}/lead/${encodeURIComponent(lead.key)}` },
      h('span', { class: 'lead-name' }, name),
      h('span', { class: 'lead-meta' }, fmtWhen(lead.receivedAt)),
      h('span', { class: 'lead-meta' }, [lead.project && `${labels.project || 'Project'}: ${lead.project}`, state.adNames[adIdFromSource(lead.source)] ? `Ad: ${state.adNames[adIdFromSource(lead.source)]}` : SOURCE_LABEL[lead.sourceKind]].filter(Boolean).join(' · ')),
      h('span', { class: 'pills' }, pills)),
    !lead.isTest && h('label', { class: 'lead-contacted' }, box, h('span', {}, 'Contacted?')),
    tel && h('a', { class: 'lead-call', href: tel, 'aria-label': `Call ${name} at ${fmtPhone(lead.phone)}` }, 'Call'));
}

// One tap: yes means Reached, no clears it. It only changes once the server confirms the save.
async function saveContacted(slug, data, lead, box) {
  const session = getSession();
  box.disabled = true;
  state.saving += 1;
  try {
    const result = await api().update({ business: slug, key: lead.key, changes: { contactStatus: box.checked ? 'Reached' : '' }, expectedUpdatedAt: lead.crmUpdatedAt }, session.token);
    const index = data.leads.findIndex((item) => item.key === lead.key);
    if (index >= 0) data.leads[index] = result.lead;
    data.summary = result.summary;
    data.fetchedAt = result.fetchedAt;
    route();
  } catch (error) {
    if (handleSignedOut(error, slug)) return;
    box.checked = !box.checked;
    box.disabled = false;
    const card = box.closest('.lead');
    if (card) card.append(h('p', { class: 'message', role: 'alert' }, error.message));
  } finally {
    state.saving -= 1;
  }
}

function renderList(container, slug, data) {
  const shown = filteredLeads(data.leads);
  const labels = data.business.labels || {};
  if (shown.length) {
    container.replaceChildren(h('ul', { class: 'leads', 'aria-label': `${shown.length} leads` }, shown.map((lead) => leadCard(slug, lead, labels, (item, box) => saveContacted(slug, data, item, box)))));
    return;
  }
  const words = data.leads.some((lead) => !lead.isTest)
    ? 'Nothing matches this view. Try All.'
    : 'No inquiries on your records yet. New ones show up here when you refresh.';
  container.replaceChildren(h('p', { class: 'empty' }, words));
}

// ---------- Ad numbers ----------
const AD_RANGES = [['launch', 'Since launch'], ['7d', 'Last 7 days'], ['today', 'Today']];
const count = (value) => new Intl.NumberFormat('en-US').format(value);
const moneyOr = (value, fallback) => (value === null || value === undefined ? fallback : fmtMoney(value));

function adCard(ad) {
  return h('li', { class: 'ad-card' },
    h('h3', {}, ad.name),
    h('dl', { class: 'ad-facts' },
      h('div', {}, h('dt', {}, 'Spent'), h('dd', {}, fmtMoney(ad.spend))),
      h('div', {}, h('dt', {}, 'Link clicks'), h('dd', {}, count(ad.linkClicks))),
      h('div', {}, h('dt', {}, 'Page views'), h('dd', {}, count(ad.landingPageViews))),
      h('div', {}, h('dt', {}, 'Inquiries'), h('dd', {}, count(ad.forms))),
      h('div', {}, h('dt', {}, 'Booked'), h('dd', {}, ad.booked === null ? 'Unknown' : count(ad.booked))),
      h('div', {}, h('dt', {}, 'Paid'), h('dd', {}, ad.paid === null ? 'Unknown' : count(ad.paid))),
      h('div', {}, h('dt', {}, 'Potential'), h('dd', {}, moneyOr(ad.potential, 'Unknown'))),
      h('div', {}, h('dt', {}, 'Collected'), h('dd', {}, moneyOr(ad.collected, 'Unknown')))));
}

// The whole story in one line: dollars in, customers, dollars back. Meta knows the first two links,
// only the owner's records know the rest, so an unrecorded link says Unknown instead of zero.
function moneyChain(board) {
  const { totals, forms, funnel } = board;
  const known = (value, show) => (value === null || value === undefined ? 'Unknown' : show(value));
  const links = [
    ['Ad spend', fmtMoney(totals.spend), 'meta'],
    ['Link clicks', count(totals.linkClicks), 'meta'],
    ['Inquiries from ads', count(forms.fromAds), 'records'],
    ['Booked', known(funnel.booked, count), 'records'],
    ['Paying', known(funnel.paid, count), 'records'],
    ['Collected', known(board.collected, fmtMoney), 'records'],
  ];
  return h('div', { class: 'chain-wrap' },
    h('ol', { class: 'chain', 'aria-label': 'From ad dollars to money collected' },
      links.map(([label, value, from]) => h('li', { class: `chain-link ${from}${value === 'Unknown' ? ' unknown' : ''}` },
        h('span', { class: 'chain-label' }, label),
        h('strong', { class: 'chain-value' }, value)))),
    h('p', { class: 'chain-verdict' }, board.backPerDollar === null || board.backPerDollar === undefined
      ? 'Money back per $1 shows once a payment is recorded on a lead from an ad.'
      : `${fmtMoney(board.backPerDollar)} back for every $1 of ads.`));
}

function adsBoard(board) {
  const { totals, forms, funnel, costs } = board;
  const fromYourRecords = funnel.notRecorded ? `${funnel.notRecorded} not recorded` : null;
  return [
    (board.alerts || []).length > 0 && h('ul', { class: 'alerts', 'aria-label': 'Alerts' }, board.alerts.map((alert) => h('li', { class: 'message' }, alert.text))),
    moneyChain(board),
    h('h3', { class: 'board-title' }, 'From Meta'),
    h('dl', { class: 'stats' },
      statBox('Ad spend', fmtMoney(totals.spend)),
      statBox('Times shown', count(totals.impressions)),
      statBox('Reach', count(totals.reach)),
      statBox('Link clicks', count(totals.linkClicks), moneyOr(costs.perLinkClick, null) && `${fmtMoney(costs.perLinkClick)} per click`),
      statBox('Page views', count(totals.landingPageViews)),
      statBox('Call button taps', count(totals.callTaps), 'A tap, not a finished call')),
    h('h3', { class: 'board-title' }, 'From your records'),
    h('dl', { class: 'stats' },
      statBox('Inquiries in these dates', count(forms.total), `${count(forms.fromAds)} from ads, ${count(forms.otherSource)} other${forms.addedByHand ? `, ${count(forms.addedByHand)} added by hand` : ''}`),
      statBox('Cost per ad inquiry', moneyOr(costs.perForm, 'None yet')),
      statBox('Booked from ads', funnel.booked === null ? null : count(funnel.booked), fromYourRecords),
      statBox('Paying from ads', funnel.paid === null ? null : count(funnel.paid), fromYourRecords),
      statBox('Cost per paying customer', costs.perPaidCustomer === null ? null : fmtMoney(costs.perPaidCustomer)),
      statBox('Potential money from ads', moneyOr(board.potential, null)),
      statBox('Collected from ads', moneyOr(board.collected, null), board.backPerDollar === null ? null : `${fmtMoney(board.backPerDollar)} back per $1 of ads`)),
    board.formsWithoutAdId > 0 && h('p', { class: 'note' }, `${board.formsWithoutAdId} came from an ad but do not say which one, so they are not in the ad by ad list.`),
    board.ads.length > 0 && h('h3', { class: 'board-title' }, 'Ad by ad'),
    board.ads.length > 0 && h('ul', { class: 'ad-list' }, board.ads.map(adCard)),
    h('p', { class: 'note' }, 'Spend and clicks come from Meta and can lag by a few minutes. Paying customers only count once someone marks the payment on a lead.'),
  ];
}

function adsPanel(slug, token, onNames) {
  const body = h('div', { 'aria-live': 'polite' });
  const panel = h('section', { class: 'ads-panel', 'aria-labelledby': 'ads-title' }, h('h2', { id: 'ads-title' }, 'Your ads'));
  const chips = h('div', { class: 'filters', role: 'group', 'aria-label': 'Which dates to show' });
  // fresh: a person asked (tapped a range), so Meta is asked again. Otherwise a board under half a live tick old is reused.
  const load = async (fresh) => {
    chips.replaceChildren(...AD_RANGES.map(([id, label]) => h('button', {
      class: 'chip',
      type: 'button',
      'aria-pressed': String(state.adsRange === id),
      onClick: () => {
        state.adsRange = id;
        load(true);
      },
    }, label)));
    const asked = state.adsRange;
    const key = `${slug}:${asked}`;
    const paint = (board) => {
      if (!board.connected) {
        panel.replaceChildren(panel.firstChild, h('p', { class: 'note' }, 'Ad numbers are not connected yet. This does not mean your ads have no results.'));
        return;
      }
      for (const ad of board.ads) state.adNames[ad.adId] = ad.name;
      onNames();
      body.replaceChildren(...adsBoard(board).filter(Boolean));
    };
    // A live redraw paints the board it just fetched instead of flashing a loading line.
    const cached = state.adsCache[key];
    if (cached) paint(cached.board);
    else body.replaceChildren(h('p', { class: 'note' }, 'Loading your ad numbers...'));
    if (!fresh && cached && Date.now() - cached.at < LIVE_EVERY_MS / 2) return;
    try {
      const board = await api().ads(slug, asked, token);
      if (asked !== state.adsRange) return;
      state.adsCache[key] = { board, at: Date.now() };
      paint(board);
    } catch (error) {
      if (asked !== state.adsRange) return;
      body.replaceChildren(h('p', { class: 'message', role: 'alert' }, error.message));
    }
  };
  panel.append(chips, body);
  load(false);
  return panel;
}

// ---------- Website numbers ----------
const SITE_RANGES = [['today', 'Today'], ['7d', 'Last 7 days'], ['month', 'Whole month'], ['all', 'Entire time']];

function syncMark() {
  return h('span', { class: 'sync-mark', role: 'status', 'aria-label': 'Syncing' });
}

function waitingSite() {
  return [
    h('p', { class: 'note sync-line' }, syncMark(), ' Syncing with your website.'),
    h('dl', { class: 'stats' },
      statBox('Viewed', syncMark(), 'People who opened the site'),
      statBox('Started a form', syncMark(), 'Filled in, then left without submit'),
      statBox('Hit submit', syncMark(), 'The tap. It still has to reach the owner.'),
      statBox('Call button', syncMark(), 'A tap. This does not show whether the owner answered.')),
    h('h3', { class: 'board-title' }, 'Top sections'),
    h('p', { class: 'note sync-line' }, syncMark(), ' Syncing'),
    h('h3', { class: 'board-title' }, 'From the form'),
    h('p', { class: 'note sync-line' }, syncMark(), ' Syncing'),
  ];
}

function siteKey(slug, range) {
  return `${slug}:${range}`;
}

function clearAds(slug) {
  for (const key of Object.keys(state.adsCache)) {
    if (key.startsWith(`${slug}:`)) delete state.adsCache[key];
  }
}

function clearSite(slug) {
  for (const key of Object.keys(state.siteCache)) {
    if (key.startsWith(`${slug}:`)) delete state.siteCache[key];
  }
}

function requestSite(slug, token, range, fresh) {
  const key = siteKey(slug, range || state.siteRange);
  if (fresh) delete state.siteCache[key];
  const hit = state.siteCache[key];
  if (hit?.board) return Promise.resolve(hit.board);
  if (hit?.promise) return hit.promise;
  const promise = api().site(slug, range || state.siteRange, token).then((board) => {
    state.siteCache[key] = { board };
    return board;
  }).catch((error) => {
    if (state.siteCache[key]?.promise === promise) delete state.siteCache[key];
    throw error;
  });
  state.siteCache[key] = { promise };
  return promise;
}

function dialHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}

function siteBoard(board) {
  const rangeNote = board.range?.key === 'all'
    ? 'Entire time starts the day counting began on this site. Earlier visits are not here.'
    : (board.range?.key === 'month' ? 'This calendar month, Denver time.' : '');
  const top = Array.isArray(board.sections) ? board.sections.slice(0, 3) : [];
  const contacts = Array.isArray(board.contacts) ? board.contacts : [];
  return [
    rangeNote && h('p', { class: 'note' }, rangeNote),
    h('dl', { class: 'stats' },
      statBox('Viewed', count(board.people), 'People who opened the site'),
      statBox('Started a form', count(board.formStarts), 'Filled in, then left without submit'),
      statBox('Hit submit', count(board.forms), 'The tap. It still has to reach the owner.'),
      statBox('Call button', count(board.calls), 'A tap. This does not show whether the owner answered.')),
    h('h3', { class: 'board-title' }, 'Top sections'),
    top.length === 0
      ? h('p', { class: 'note' }, 'No section clicks in this range.')
      : h('ol', { class: 'ad-list' }, top.map((section) => h('li', { class: 'ad-card' },
        h('h3', {}, section.label),
        h('p', { class: 'note' }, `${count(section.clicks)} clicks`)))),
    h('h3', { class: 'board-title' }, 'From the form'),
    contacts.length === 0
      ? h('p', { class: 'note' }, 'No one has hit submit in this range.')
      : h('ul', { class: 'ad-list' }, contacts.map((person) => h('li', { class: 'ad-card site-contact' },
        h('h3', {}, person.name || 'Name not given'),
        person.phone
          ? h('p', {}, h('a', { href: dialHref(person.phone) }, person.phone))
          : h('p', { class: 'note' }, 'No phone'),
        person.email
          ? h('p', {}, h('a', { href: `mailto:${person.email}` }, person.email))
          : h('p', { class: 'note' }, 'No email')))),
  ];
}

function sitePanel(slug, token) {
  const body = h('div', { 'aria-live': 'polite' });
  const panel = h('section', { class: 'site-panel', 'aria-labelledby': 'site-title' }, h('h2', { id: 'site-title' }, 'Your website'));
  const chips = h('div', { class: 'filters', role: 'group', 'aria-label': 'Which website dates to show' });
  const paint = (board) => {
    const when = Date.parse(board?.fetchedAt || '') || Date.now();
    const waiting = !board || !board.collecting || !board.seen;
    const stamp = h('p', { class: 'fetched' }, `${waiting ? 'Checked' : 'Counted'} ${fmtWhen(when)}`);
    body.replaceChildren(stamp, ...(waiting ? waitingSite() : siteBoard(board)).filter(Boolean));
  };
  const load = async (fresh) => {
    if (typeof api().site !== 'function') {
      paint(null);
      return;
    }
    chips.replaceChildren(...SITE_RANGES.map(([id, label]) => h('button', {
      class: 'chip',
      type: 'button',
      'aria-pressed': String(state.siteRange === id),
      onClick: () => {
        state.siteRange = id;
        load(true);
      },
    }, label)));
    const asked = state.siteRange;
    const ready = !fresh && state.siteCache[siteKey(slug, asked)]?.board;
    if (ready) paint(ready);
    else body.replaceChildren(...waitingSite());
    try {
      const board = await requestSite(slug, token, asked, fresh);
      if (asked !== state.siteRange) return;
      paint(board);
    } catch (error) {
      if (asked !== state.siteRange) return;
      body.replaceChildren(...waitingSite(), h('p', { class: 'message', role: 'alert' }, error.message));
    }
  };
  panel.append(chips, body);
  load(false);
  return panel;
}

function websiteLine(site) {
  if (!site) return '';
  if (!site.collecting || !site.seen) return 'Syncing with the website.';
  return `Last 7 days: ${count(site.people)} people, ${count(site.formStarts)} started a form, ${count(site.forms)} submitted, ${count(site.calls)} call taps.`;
}

function dashboardView(slug, data) {
  const session = getSession();
  const listArea = h('div', { 'aria-live': 'polite' });
  const refreshList = () => renderList(listArea, slug, data);
  const summary = data.summary || summarize(data.leads);
  const testCount = data.leads.filter((lead) => lead.isTest).length;

  const chips = VIEWS.map(([id, label, test]) => {
    const count = data.leads.filter((lead) => !lead.isTest && test(lead)).length;
    return h('button', {
      class: 'chip',
      type: 'button',
      'aria-pressed': String(state.filter.view === id),
      onClick: (event) => {
        state.filter.view = id;
        event.currentTarget.parentElement.querySelectorAll('.chip').forEach((chip) => chip.setAttribute('aria-pressed', String(chip === event.currentTarget)));
        refreshList();
      },
    }, `${label} (${count})`);
  });

  const sourceSelect = h('select', {
    id: 'source',
    onChange: (event) => {
      state.filter.source = event.target.value;
      refreshList();
    },
  }, [['all', 'All sources'], ['ad', 'From an ad'], ['other', 'Other source'], ['none', 'Source not recorded']]
    .map(([value, label]) => h('option', { value, selected: state.filter.source === value }, label)));

  const head = h('div', { class: 'page-head' },
    h('div', {},
      h('h1', {}, data.business.name),
      h('p', { class: 'fetched' }, data.fetchedAt ? `Updated ${fmtWhen(Date.parse(data.fetchedAt))}` : ''),
      livePill(data.fetchedAt)),
    h('div', { class: 'page-tools' },
      h('a', { class: 'btn btn-gold', href: `#/b/${encodeURIComponent(slug)}/add` }, 'Add a customer'),
      session?.isTeam && h('a', { class: 'btn', href: '#/team' }, 'All businesses'),
      h('button', {
        class: 'btn',
        type: 'button',
        onClick: () => {
          delete state.cache[slug];
          clearSite(slug);
          clearAds(slug);
          route();
        },
      }, 'Refresh'),
      h('button', { class: 'text-btn', type: 'button', onClick: signOut }, 'Sign out')));

  // Reading order: who to call, your customers, what the ads brought, what the website did.
  const customers = h('section', { class: 'panel customers-panel', 'aria-labelledby': 'customers-title' },
    h('h2', { id: 'customers-title' }, 'Your customers'),
    statsBlock(summary),
    h('p', { class: 'note' }, 'Unknown means nobody has recorded it yet. It does not mean zero.'),
    h('div', { class: 'filters', role: 'group', 'aria-label': 'Which leads to show' }, chips),
    h('div', { class: 'search-row' },
      h('label', { for: 'search' }, 'Search',
        h('input', {
          id: 'search',
          type: 'search',
          value: state.filter.q,
          autocomplete: 'off',
          onInput: (event) => {
            state.filter.q = event.target.value;
            refreshList();
          },
        })),
      h('label', { for: 'source' }, 'Where they came from', sourceSelect)),
    data.isTeam && testCount > 0 && h('label', { class: 'check', for: 'show-tests' },
      h('input', {
        id: 'show-tests',
        type: 'checkbox',
        checked: state.filter.showTests,
        onChange: (event) => {
          state.filter.showTests = event.target.checked;
          refreshList();
        },
      }),
      `Show ${testCount} test rows (team only, never counted)`),
    listArea);
  const page = h('div', { class: 'page wrap' },
    head,
    callNext(slug, data),
    customers,
    session && adsPanel(slug, session.token, refreshList),
    session && sitePanel(slug, session.token));
  refreshList();
  return page;
}

// Says the page keeps itself current. The dot is still on purpose: this is the working tool.
function livePill(fetchedAt) {
  const when = Date.parse(fetchedAt || '');
  // Not a live region: its stamp changes every minute and a screen reader would announce each one.
  return h('p', { class: 'live' },
    h('span', { class: 'live-dot', 'aria-hidden': 'true' }),
    h('span', {}, 'Live'),
    h('span', { class: 'live-when' }, Number.isNaN(when) ? ' checks every minute' : ` checked ${fmtClock(when)}, checks every minute`));
}

function notConnectedView(data) {
  const session = getSession();
  const slug = data.business.slug;
  return h('div', { class: 'page wrap' },
    h('div', { class: 'page-head' },
      h('div', {}, h('h1', {}, data.business.name), livePill(data.fetchedAt)),
      h('div', { class: 'page-tools' },
        h('button', {
          class: 'btn',
          type: 'button',
          onClick: () => {
            delete state.cache[slug];
            clearSite(slug);
            clearAds(slug);
            route();
          },
        }, 'Refresh'),
        h('button', { class: 'text-btn', type: 'button', onClick: signOut }, 'Sign out'))),
    session && sitePanel(slug, session.token),
    h('p', { class: 'empty' }, `Your records are not connected yet. This does not mean you have no customers. Call ${HELP_PHONE} with any questions.`));
}

async function loadBusinessData(slug, ticket) {
  const session = getSession();
  if (!session || !(session.isTeam || session.slug === slug)) {
    go(`#/sign-in/${encodeURIComponent(slug)}`);
    return null;
  }
  const siteJob = requestSite(slug, session.token, state.siteRange).catch(() => null);
  const siteReady = Promise.race([
    siteJob,
    new Promise((resolve) => {
      const timer = setTimeout(resolve, 4000);
      if (timer && typeof timer.unref === 'function') timer.unref();
    }),
  ]);
  if (state.cache[slug]) {
    await siteReady;
    return state.cache[slug];
  }
  show(h('p', { class: 'wrap note' }, 'Loading your records...'));
  try {
    const data = await api().leads(slug, session.token);
    await siteReady;
    if (ticket !== state.ticket) return null;
    state.cache[slug] = data;
    return data;
  } catch (error) {
    if (ticket !== state.ticket) return null;
    if (!handleSignedOut(error, slug)) show(errorBox(error, route));
    return null;
  }
}

async function renderBusiness(slug, ticket) {
  const data = await loadBusinessData(slug, ticket);
  if (!data || ticket !== state.ticket) return;
  setBrand(data.business.name);
  show(data.connected ? dashboardView(slug, data) : notConnectedView(data));
}

// ---------- One lead ----------
function fact(label, value, node) {
  return h('div', {},
    h('dt', {}, label),
    value ? h('dd', {}, node || value) : h('dd', { class: 'blank' }, 'Not recorded'));
}

const OUTCOME_LABELS = {
  contactStatus: 'Contact',
  bookingStatus: 'Booking',
  jobStatus: 'Job',
  paymentStatus: 'Payment',
  potentialMoney: 'Potential money',
  collectedRevenue: 'Money collected',
  directJobCosts: 'Job costs',
  otherCosts: 'Other costs',
  outcomeNotes: 'Notes',
};

function outcomeForm(slug, data, lead) {
  const session = getSession();
  const draft = state.drafts[lead.key] || (state.drafts[lead.key] = {});
  const status = h('p', { class: 'message', role: 'status' });
  const save = h('button', { class: 'btn btn-gold', type: 'submit' }, 'Save changes');
  const discard = h('button', { class: 'btn', type: 'button' }, 'Undo changes');

  const refreshButtons = () => {
    const dirty = Object.keys(draft).length > 0;
    save.disabled = !dirty;
    discard.hidden = !dirty;
  };
  const note = (field, value) => {
    if (value === (lead[field] || '')) delete draft[field];
    else draft[field] = value;
    status.textContent = '';
    status.className = 'message';
    refreshButtons();
  };
  const currentValue = (field) => (field in draft ? draft[field] : lead[field] || '');

  const selectFor = (field) => {
    const value = currentValue(field);
    const options = [...STATUS_OPTIONS[field]];
    if (value && !options.includes(value)) options.unshift(value); // Keep anything typed into the sheet by hand.
    return h('label', { for: field }, OUTCOME_LABELS[field],
      h('select', { id: field, name: field, onChange: (event) => note(field, event.target.value) },
        h('option', { value: '', selected: !value }, 'Not recorded'),
        options.map((option) => h('option', { value: option, selected: option === value }, option))));
  };
  const moneyFor = (field) => h('label', { for: field }, OUTCOME_LABELS[field],
    h('input', { id: field, name: field, type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'Not recorded', value: currentValue(field), onInput: (event) => note(field, event.target.value) }));

  discard.addEventListener('click', () => {
    delete state.drafts[lead.key];
    route();
  });

  const form = h('form', {
    class: 'outcome-form',
    novalidate: true,
    onSubmit: async (event) => {
      event.preventDefault();
      if (!Object.keys(draft).length) return;
      save.disabled = true;
      save.textContent = 'Saving...';
      status.className = 'message good';
      status.textContent = '';
      try {
        const result = await api().update({ business: slug, key: lead.key, changes: { ...draft }, expectedUpdatedAt: lead.crmUpdatedAt }, session.token);
        const index = data.leads.findIndex((item) => item.key === lead.key);
        if (index >= 0) data.leads[index] = result.lead;
        data.summary = result.summary;
        data.fetchedAt = result.fetchedAt;
        delete state.drafts[lead.key];
        state.notice = { key: lead.key, text: 'Saved to your records.', good: true };
        route();
      } catch (error) {
        if (handleSignedOut(error, slug)) return;
        if (error.code === 'changed' && error.data.lead) {
          // Show the latest values and keep what this person typed, so nothing is silently overwritten.
          const index = data.leads.findIndex((item) => item.key === lead.key);
          if (index >= 0) data.leads[index] = error.data.lead;
          state.notice = { key: lead.key, text: error.message, good: false };
          route();
          return;
        }
        status.className = 'message';
        status.textContent = error.message;
        save.textContent = 'Save changes';
        refreshButtons();
      }
    },
  },
  h('div', { class: 'pair' }, selectFor('contactStatus'), selectFor('bookingStatus')),
  h('div', { class: 'pair' }, selectFor('jobStatus'), selectFor('paymentStatus')),
  h('div', { class: 'pair' }, MONEY_FIELDS.map(moneyFor)),
  h('label', { for: 'outcomeNotes' }, OUTCOME_LABELS.outcomeNotes,
    h('textarea', { id: 'outcomeNotes', name: 'outcomeNotes', rows: 4, maxlength: NOTES_MAX, onInput: (event) => note('outcomeNotes', event.target.value) }, currentValue('outcomeNotes'))),
  h('div', { class: 'save-row' }, save, discard),
  status);
  refreshButtons();
  if (state.notice?.key === lead.key) {
    status.className = state.notice.good ? 'message good' : 'message';
    status.textContent = state.notice.text;
    state.notice = null;
  } else if (Object.keys(draft).length) {
    status.className = 'message';
    status.textContent = 'You have changes that are not saved yet.';
  }
  return form;
}

function leadView(slug, data, lead) {
  const labels = data.business.labels || {};
  const name = lead.name || 'No name recorded';
  const tel = telHref(lead.phone);
  const mail = safeMail(lead.displayEmail);
  return h('div', { class: 'page wrap' },
    h('a', { class: 'crumb', href: `#/b/${encodeURIComponent(slug)}` }, `Back to ${data.business.name}`),
    h('h1', {}, name),
    h('p', { class: 'fetched' }, `Came in ${fmtWhen(lead.receivedAt)}`),
    lead.isTest && h('p', { class: 'message' }, 'This is a test row. It is never counted.'),
    h('div', { class: 'actions' },
      tel && h('a', { class: 'btn btn-gold', href: tel, 'aria-label': `Call ${name} at ${fmtPhone(lead.phone)}` }, `Call ${fmtPhone(lead.phone)}`),
      mail && h('a', { class: 'btn', href: mail }, 'Email')),
    h('div', { class: 'detail' },
      h('section', { class: 'panel', 'aria-labelledby': 'stand' },
        h('h2', { id: 'stand' }, 'Where this lead stands'),
        outcomeForm(slug, data, lead),
        h('dl', { class: 'facts' }, fact('Last updated', lead.crmUpdatedAt && fmtWhen(Date.parse(lead.crmUpdatedAt))))),
      h('div', { class: 'detail-side' },
        h('section', { class: 'panel', 'aria-labelledby': 'contact' },
          h('h2', { id: 'contact' }, 'Contact'),
          h('dl', { class: 'facts' },
            fact('Name', lead.name),
            fact('Phone', lead.phone, tel ? h('a', { href: tel }, fmtPhone(lead.phone)) : lead.phone),
            fact('Email', lead.displayEmail, mail ? h('a', { href: mail }, lead.displayEmail) : lead.displayEmail))),
        h('section', { class: 'panel', 'aria-labelledby': 'job' },
          h('h2', { id: 'job' }, 'The job'),
          h('dl', { class: 'facts' },
            fact(labels.project || 'Project', lead.project),
            fact('Preferred day', fmtDay(lead.preferredDay)),
            fact('Appointment date', fmtDay(lead.appointmentDate)),
            fact('Appointment time', lead.appointmentTime))),
        h('section', { class: 'panel', 'aria-labelledby': 'origin' },
          h('h2', { id: 'origin' }, 'Where it came from'),
          h('dl', { class: 'facts' },
            fact('Source', lead.source && !/^unknown$/i.test(lead.source) ? lead.source : ''),
            fact('Website', lead.website),
            fact('Lead ID', lead.leadId),
            fact('Conversation ID', lead.conversationId),
            data.isTeam && fact('QA', lead.qa),
            data.isTeam && lead.mergedRows > 1 && fact('Sheet rows merged', String(lead.mergedRows)))),
        h('section', { class: 'panel', 'aria-labelledby': 'said' },
          h('h2', { id: 'said' }, 'What was said'),
          lead.transcript ? h('p', { class: 'transcript' }, lead.transcript) : h('p', { class: 'note' }, 'Not recorded')))));
}

async function renderLead(slug, key, ticket) {
  const data = await loadBusinessData(slug, ticket);
  if (!data || ticket !== state.ticket) return;
  setBrand(data.business.name);
  const lead = data.leads.find((item) => item.key === key);
  if (!lead) {
    show(h('div', { class: 'page wrap' },
      h('h1', {}, 'That lead is not here'),
      h('p', { class: 'note' }, 'It may have moved. Go back and refresh.'),
      h('a', { class: 'btn', href: `#/b/${encodeURIComponent(slug)}` }, 'Back to the list')));
    return;
  }
  show(leadView(slug, data, lead));
}

// ---------- Add a customer by hand ----------
async function renderAdd(slug, ticket) {
  const data = await loadBusinessData(slug, ticket);
  if (!data || ticket !== state.ticket) return;
  setBrand(data.business.name);
  if (!data.connected) {
    show(notConnectedView(data));
    return;
  }
  const session = getSession();
  const labels = data.business.labels || {};
  const message = h('p', { class: 'message', role: 'alert' });
  const submit = h('button', { class: 'btn btn-gold', type: 'submit' }, 'Add to my customers');
  const field = (id, label, attrs = {}) => h('label', { for: id }, label, h('input', { id, name: id, type: 'text', autocomplete: 'off', ...attrs }));
  const form = h('form', {
    class: 'outcome-form',
    novalidate: true,
    onSubmit: async (event) => {
      event.preventDefault();
      message.textContent = '';
      submit.disabled = true;
      submit.textContent = 'Saving...';
      try {
        const result = await api().add({
          business: slug,
          name: document.getElementById('name').value,
          phone: document.getElementById('phone').value,
          project: document.getElementById('project').value,
          howFound: document.getElementById('howFound').value,
          notes: document.getElementById('notes').value,
        }, session.token);
        data.leads.unshift(result.lead);
        data.summary = result.summary;
        data.fetchedAt = result.fetchedAt;
        state.notice = { key: result.lead.key, text: 'Saved to your records.', good: true };
        go(`#/b/${encodeURIComponent(slug)}/lead/${encodeURIComponent(result.lead.key)}`);
      } catch (error) {
        if (handleSignedOut(error, slug)) return;
        message.textContent = error.message;
        submit.disabled = false;
        submit.textContent = 'Add to my customers';
      }
    },
  },
  field('name', 'Their name', { required: true, autocomplete: 'name' }),
  field('phone', 'Their phone', { required: true, inputmode: 'tel', autocomplete: 'tel' }),
  field('project', labels.project || 'What they need'),
  h('label', { for: 'howFound' }, 'How they found you',
    h('select', { id: 'howFound', name: 'howFound' },
      h('option', { value: '' }, 'Choose one'),
      HAND_SOURCES.map((option) => h('option', { value: option }, option)))),
  h('label', { for: 'notes' }, 'Notes', h('textarea', { id: 'notes', name: 'notes', rows: 3, maxlength: NOTES_MAX })),
  message,
  h('div', { class: 'save-row' }, submit));
  show(h('div', { class: 'page wrap add-page' },
    h('a', { class: 'crumb', href: `#/b/${encodeURIComponent(slug)}` }, `Back to ${data.business.name}`),
    h('h1', {}, 'Add a customer'),
    h('p', { class: 'fetched' }, 'For someone who called, messaged or walked in. Website forms show up on their own.'),
    form));
}

// ---------- Team overview: the owner's view of every business ----------
const sumKnown = (values) => {
  const known = values.filter((value) => value !== null && value !== undefined);
  return known.length ? known.reduce((total, value) => total + value, 0) : null;
};
const countOrNull = (value) => (value === null || value === undefined ? null : count(value));
const moneyOrNull = (value) => (value === null || value === undefined ? null : fmtMoney(value));
const stageOf = (summary, key) => summary?.stages?.find((stage) => stage.key === key)?.count ?? null;

function ownerTotals(businesses) {
  const summaries = businesses.map((business) => business.summary).filter(Boolean);
  const sites = businesses.map((business) => business.website).filter((site) => site?.collecting && site?.seen);
  return [
    h('dl', { class: 'stats owner-totals', 'aria-label': 'Every business together' },
      statBox('Inquiries', summaries.length ? countOrNull(sumKnown(summaries.map((summary) => summary.total))) : null),
      statBox('Waiting on a call', summaries.length ? countOrNull(sumKnown(summaries.map((summary) => summary.needsFollowUp))) : null),
      statBox('Booked', countOrNull(sumKnown(summaries.map((summary) => stageOf(summary, 'booked'))))),
      statBox('Paid', countOrNull(sumKnown(summaries.map((summary) => stageOf(summary, 'paid'))))),
      statBox('Money collected', moneyOrNull(sumKnown(summaries.map((summary) => summary.collected?.total)))),
      statBox('Website visitors', sites.length ? countOrNull(sumKnown(sites.map((site) => site.people))) : null, sites.length ? `last 7 days, ${sites.length} site${sites.length === 1 ? '' : 's'}` : 'No site counted yet')),
    h('p', { class: 'note' }, `Customer numbers come from ${summaries.length} of ${businesses.length} businesses with records connected. Unknown means nobody has recorded it yet.`),
  ];
}

function miniStats(summary) {
  return h('dl', { class: 'stats mini', 'aria-label': 'At a glance' },
    statBox('Inquiries', countOrNull(summary.total)),
    statBox('Waiting on a call', countOrNull(summary.needsFollowUp)),
    statBox('Booked', countOrNull(stageOf(summary, 'booked'))),
    statBox('Paid', countOrNull(stageOf(summary, 'paid'))),
    statBox('Collected', moneyOrNull(summary.collected?.total)));
}

// Plug and play, made visible: what each business still needs before every number on its board is live.
const SETUP_STEPS = [
  ['records', 'Customer records', 'Connected', 'Not connected'],
  ['pinSet', 'Client PIN', 'Set', 'Not set'],
  ['website', 'Website on the CRM', 'Listed', 'Not listed'],
  ['websiteSeen', 'Website tracker', 'Counting', 'No visit yet'],
  ['adAccount', 'Meta ad account', 'Added', 'Not added'],
  ['adTokenSet', 'Meta read token', 'Set', 'Not set'],
];

function setupCard(setup) {
  const done = SETUP_STEPS.filter(([key]) => setup[key]).length;
  return h('details', { class: 'setup' },
    h('summary', {},
      h('span', { class: 'setup-meter', 'aria-hidden': 'true' }, SETUP_STEPS.map(([key]) => h('span', { class: setup[key] ? 'seg on' : 'seg' }))),
      h('span', {}, `Setup ${done} of ${SETUP_STEPS.length}`)),
    h('ul', { class: 'setup-list' }, SETUP_STEPS.map(([key, label, yes, no]) => h('li', { class: setup[key] ? 'on' : 'off' },
      h('span', {}, label),
      h('strong', {}, setup[key] ? yes : no)))),
    h('p', { class: 'note' }, 'Set means it is configured, not that it has been proven to work. The board itself proves that.'),
    setup.joinedFrom === 'command-center' && h('p', { class: 'note' }, 'Joined on its own from the Command Center registry.'));
}

function statusChip(business) {
  if (business.error) return h('span', { class: 'status bad' }, 'Records error');
  if (business.summary) return h('span', { class: 'status good' }, 'Records live');
  return h('span', { class: 'status' }, business.website?.collecting ? 'Website only' : 'Not set up');
}

function teamCard(business) {
  const href = `#/b/${encodeURIComponent(business.slug)}`;
  const line = websiteLine(business.website);
  return h('li', { class: 'team-card' },
    h('div', { class: 'team-card-head' }, h('h2', {}, h('a', { href }, business.name)), statusChip(business)),
    business.summary
      ? miniStats(business.summary)
      : h('p', { class: business.error ? 'message' : 'note' }, business.error ? business.message : 'Records not connected yet.'),
    line ? h('p', { class: 'note' }, line) : null,
    business.setup ? setupCard(business.setup) : null,
    h('a', { class: 'btn open-business', href, 'aria-label': `Open ${business.name}` }, 'Open'));
}

// Attention first: a broken sheet, then whoever has the most people waiting on a call, then the rest as listed.
function attentionOrder(businesses) {
  const weight = (business) => (business.error ? 1e6 : 0) + (business.summary?.needsFollowUp || 0) * 10 + (business.summary ? 1 : 0);
  return businesses.map((business, index) => ({ business, index }))
    .sort((a, b) => weight(b.business) - weight(a.business) || a.index - b.index)
    .map(({ business }) => business);
}

function teamView(data) {
  return h('div', { class: 'page wrap' },
    h('div', { class: 'page-head' },
      h('div', {},
        h('h1', {}, 'All businesses'),
        h('p', { class: 'fetched' }, `Updated ${fmtWhen(Date.parse(data.fetchedAt))}`),
        livePill(data.fetchedAt)),
      h('div', { class: 'page-tools' },
        h('button', { class: 'btn', type: 'button', onClick: () => route() }, 'Refresh'),
        h('button', { class: 'text-btn', type: 'button', onClick: signOut }, 'Sign out'))),
    h('section', { class: 'owner-board', 'aria-label': 'Every business together' }, ownerTotals(data.businesses)),
    h('ul', { class: 'team-grid' }, attentionOrder(data.businesses).map(teamCard)));
}

async function renderTeam(ticket) {
  const session = getSession();
  if (!session?.isTeam) {
    go(`#/sign-in/${encodeURIComponent(state.teamSlug)}`);
    return;
  }
  setBrand('');
  show(h('p', { class: 'wrap note' }, 'Loading all businesses...'));
  try {
    const data = await api().overview(session.token);
    if (ticket !== state.ticket) return;
    for (const business of data.businesses) requestSite(business.slug, session.token, '7d').catch(() => null);
    state.teamData = data;
    state.prints.team = printOf(data.businesses);
    show(teamView(data));
  } catch (error) {
    if (ticket !== state.ticket) return;
    if (!handleSignedOut(error, state.teamSlug)) show(errorBox(error, route));
  }
}

// ---------- Live updates ----------
// fetchedAt changes on every read, so it is left out when deciding whether anything really changed.
const printOf = (value) => JSON.stringify(value === undefined ? null : value, (key, inner) => (key === 'fetchedAt' ? undefined : inner));

function currentParts() {
  return (location.hash || '').replace(/^#\/?/, '').split('/').map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return '';
    }
  });
}

function stampLive(fetchedAt) {
  const when = Date.parse(fetchedAt || '') || Date.now();
  for (const slot of document.querySelectorAll('.live-when')) slot.textContent = ` checked ${fmtClock(when)}, checks every minute`;
}

// Someone is mid-task: saving, typing, or touched the page moments ago. A live redraw waits for the next tick.
function busy(ignoreQuiet) {
  if (state.saving > 0) return true;
  if (!ignoreQuiet && Date.now() - state.lastTouch < QUIET_MS) return true;
  const active = document.activeElement;
  return Boolean(active && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName || ''));
}

// Exported for the smoke test, which passes ignoreQuiet because its own clicks count as touches.
export async function liveTick(ignoreQuiet = false) {
  if (document.visibilityState === 'hidden' || busy(ignoreQuiet)) return;
  const session = getSession();
  if (!session) return;
  const parts = currentParts();
  const ticket = state.ticket;
  try {
    if (parts[0] === 'team' && parts.length === 1 && session.isTeam) {
      const data = await api().overview(session.token);
      if (ticket !== state.ticket || busy(ignoreQuiet)) return;
      const print = printOf(data.businesses);
      if (print === state.prints.team) {
        stampLive(data.fetchedAt);
        return;
      }
      state.teamData = data;
      state.prints.team = print;
      showQuietly(teamView(data));
      return;
    }
    // Only the business page. The lead page and Add a customer never redraw on their own.
    if (parts[0] !== 'b' || !parts[1] || parts.length !== 2 || !(session.isTeam || session.slug === parts[1])) return;
    const slug = parts[1];
    const before = state.cache[slug];
    if (!before) return;
    const [data, site, ads] = await Promise.all([
      api().leads(slug, session.token),
      typeof api().site === 'function' ? requestSite(slug, session.token, state.siteRange, true).catch(() => null) : null,
      before.connected && typeof api().ads === 'function' ? api().ads(slug, state.adsRange, session.token).catch(() => null) : null,
    ]);
    if (ticket !== state.ticket || busy(ignoreQuiet)) return;
    if (ads) state.adsCache[`${slug}:${state.adsRange}`] = { board: ads, at: Date.now() };
    const key = `b:${slug}`;
    const boards = printOf([site, ads]);
    const leadsChanged = printOf([data.leads, data.summary, data.connected]) !== printOf([before.leads, before.summary, before.connected]);
    const boardsChanged = state.prints[key] !== undefined && state.prints[key] !== boards;
    state.prints[key] = boards;
    if (!leadsChanged && !boardsChanged) {
      stampLive(data.fetchedAt);
      refreshWaitTimes();
      return;
    }
    state.cache[slug] = data;
    showQuietly(data.connected ? dashboardView(slug, data) : notConnectedView(data));
  } catch (error) {
    // A missed tick shows nothing; the next one tries again. A signed-out session goes back to its sign-in.
    if (ticket === state.ticket && error?.status === 401) handleSignedOut(error, parts[0] === 'team' ? state.teamSlug : parts[1]);
  }
}

function startLive() {
  if (state.liveTimer || typeof setInterval !== 'function') return;
  const touch = () => {
    state.lastTouch = Date.now();
  };
  for (const type of ['pointerdown', 'keydown', 'input', 'wheel', 'touchstart']) document.addEventListener(type, touch, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') liveTick();
  });
  state.liveTimer = setInterval(() => liveTick(), LIVE_EVERY_MS);
  if (typeof state.liveTimer?.unref === 'function') state.liveTimer.unref();
}

// ---------- Routes ----------
export async function route() {
  if (location.hash === '#app') {
    // The skip link is not a page. Move focus and leave the screen as it is.
    if (typeof appEl().focus === 'function') appEl().focus();
    return undefined;
  }
  state.ticket += 1;
  const ticket = state.ticket;
  const parts = currentParts();
  if (parts[0] === 'sign-in' && parts[1]) return renderSignIn(parts[1], ticket);
  if (parts[0] === 'team') return renderTeam(ticket);
  if (parts[0] === 'b' && parts[1] && parts[2] === 'lead' && parts[3]) return renderLead(parts[1], parts[3], ticket);
  if (parts[0] === 'b' && parts[1] && parts[2] === 'add') return renderAdd(parts[1], ticket);
  if (parts[0] === 'b' && parts[1]) return renderBusiness(parts[1], ticket);
  return renderPicker(ticket);
}

if (window.CRM_DEMO) {
  const banner = document.getElementById('demo-banner');
  if (banner) banner.hidden = false;
}
window.addEventListener('hashchange', route);
route();
startLive();
