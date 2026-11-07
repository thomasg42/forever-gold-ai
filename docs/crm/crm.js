// Forever Gold CRM front end. Plain ES modules with no build step.
// This file is public, so it holds no client names and no customer data. Everything comes from the Worker
// after sign-in. All sheet text is untrusted (it comes from callers and forms), so it is only ever
// placed with text nodes, never as HTML.
import { MONEY_FIELDS, NOTES_MAX, STATUS_OPTIONS, digitsOnly, needsFollowUp, summarize } from './shared/leads.js';

const API_BASE = 'https://forever-gold-crm.forevergoldai.workers.dev';
const SESSION_KEY = 'fg_crm_session';
const TIME_ZONE = 'America/Denver';
const HELP_PHONE = '(406) 698-6693';

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
};
const api = () => window.CRM_API || liveApi;

const state = {
  ticket: 0,
  businesses: null,
  teamSlug: 'forever-gold',
  cache: {},
  drafts: {},
  filter: { view: 'follow', source: 'all', q: '', showTests: false },
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
  state.drafts = {};
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

const appEl = () => document.getElementById('app');
function show(...nodes) {
  const app = appEl();
  app.replaceChildren(...nodes.flat().filter(Boolean));
  if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  if (typeof app.focus === 'function') app.focus({ preventScroll: true });
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
      h('p', {}, 'Tap your business. Enter your PIN. See your customers.')),
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
        state.drafts = {};
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
function statBox(label, value, note) {
  const known = value !== null && value !== undefined;
  return h('div', { class: 'stat' },
    h('dt', {}, label),
    h('dd', { class: known ? null : 'unknown' }, known ? value : 'Unknown'),
    note && h('small', {}, note));
}

function statsBlock(summary) {
  const notRecorded = (count) => (count ? `${count} not recorded` : null);
  const moneyNote = (item) => (item.recorded ? `from ${item.recorded} lead${item.recorded === 1 ? '' : 's'}` : 'none recorded yet');
  const money = (item) => (item.total === null ? null : fmtMoney(item.total));
  return [
    h('dl', { class: 'stats', 'aria-label': 'Where your leads stand' },
      summary.stages.map((stage) => statBox(stage.label, stage.count, notRecorded(stage.notRecorded)))),
    h('dl', { class: 'stats money', 'aria-label': 'Money recorded' },
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

function leadCard(slug, lead, labels) {
  const pills = [
    lead.isTest && h('span', { class: 'pill test' }, 'Test'),
    needsFollowUp(lead) && h('span', { class: 'pill todo' }, 'Needs follow-up'),
    lead.contactStatus && h('span', { class: 'pill' }, lead.contactStatus),
    lead.bookingStatus && h('span', { class: 'pill' }, lead.bookingStatus),
    lead.jobStatus && h('span', { class: 'pill' }, `Job: ${lead.jobStatus}`),
    lead.paymentStatus && h('span', { class: 'pill' }, lead.paymentStatus),
  ];
  const tel = telHref(lead.phone);
  const name = lead.name || 'No name recorded';
  return h('li', { class: 'lead' },
    h('a', { class: 'lead-main', href: `#/b/${encodeURIComponent(slug)}/lead/${encodeURIComponent(lead.key)}` },
      h('span', { class: 'lead-name' }, name),
      h('span', { class: 'lead-meta' }, fmtWhen(lead.receivedAt)),
      h('span', { class: 'lead-meta' }, [lead.project && `${labels.project || 'Project'}: ${lead.project}`, SOURCE_LABEL[lead.sourceKind]].filter(Boolean).join(' · ')),
      h('span', { class: 'pills' }, pills)),
    tel && h('a', { class: 'lead-call', href: tel, 'aria-label': `Call ${name} at ${fmtPhone(lead.phone)}` }, 'Call'));
}

function renderList(container, slug, data) {
  const shown = filteredLeads(data.leads);
  const labels = data.business.labels || {};
  if (shown.length) {
    container.replaceChildren(h('ul', { class: 'leads', 'aria-label': `${shown.length} leads` }, shown.map((lead) => leadCard(slug, lead, labels))));
    return;
  }
  const words = data.leads.some((lead) => !lead.isTest)
    ? 'Nothing matches this view. Try All.'
    : 'No inquiries on your records yet. New ones show up here when you refresh.';
  container.replaceChildren(h('p', { class: 'empty' }, words));
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
      h('p', { class: 'fetched' }, data.fetchedAt ? `Updated ${fmtWhen(Date.parse(data.fetchedAt))}` : '')),
    h('div', { class: 'page-tools' },
      session?.isTeam && h('a', { class: 'btn', href: '#/team' }, 'All businesses'),
      h('button', {
        class: 'btn',
        type: 'button',
        onClick: () => {
          delete state.cache[slug];
          route();
        },
      }, 'Refresh'),
      h('button', { class: 'text-btn', type: 'button', onClick: signOut }, 'Sign out')));

  const page = h('div', { class: 'page wrap' },
    head,
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
  refreshList();
  return page;
}

function notConnectedView(data) {
  return h('div', { class: 'page wrap' },
    h('div', { class: 'page-head' },
      h('h1', {}, data.business.name),
      h('div', { class: 'page-tools' }, h('button', { class: 'text-btn', type: 'button', onClick: signOut }, 'Sign out'))),
    h('p', { class: 'empty' }, `Your records are not connected yet. This does not mean you have no customers. Call ${HELP_PHONE} with any questions.`));
}

async function loadBusinessData(slug, ticket) {
  const session = getSession();
  if (!session || !(session.isTeam || session.slug === slug)) {
    go(`#/sign-in/${encodeURIComponent(slug)}`);
    return null;
  }
  if (state.cache[slug]) return state.cache[slug];
  show(h('p', { class: 'wrap note' }, 'Loading your records...'));
  try {
    const data = await api().leads(slug, session.token);
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

// ---------- Team overview ----------
async function renderTeam(ticket) {
  const session = getSession();
  if (!session?.isTeam) {
    go(`#/sign-in/${encodeURIComponent(state.teamSlug)}`);
    return;
  }
  show(h('p', { class: 'wrap note' }, 'Loading all businesses...'));
  try {
    const data = await api().overview(session.token);
    if (ticket !== state.ticket) return;
    show(h('div', { class: 'page wrap' },
      h('div', { class: 'page-head' },
        h('div', {}, h('h1', {}, 'All businesses'), h('p', { class: 'fetched' }, `Updated ${fmtWhen(Date.parse(data.fetchedAt))}`)),
        h('div', { class: 'page-tools' }, h('button', { class: 'text-btn', type: 'button', onClick: signOut }, 'Sign out'))),
      h('ul', { class: 'team-grid' }, data.businesses.map((business) => h('li', { class: 'team-card' },
        h('h2', {}, h('a', { href: `#/b/${encodeURIComponent(business.slug)}` }, business.name)),
        business.summary
          ? statsBlock(business.summary)
          : h('p', { class: business.error ? 'message' : 'note' }, business.error ? business.message : 'Records not connected yet.'))))));
  } catch (error) {
    if (ticket !== state.ticket) return;
    if (!handleSignedOut(error, state.teamSlug)) show(errorBox(error, route));
  }
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
  const parts = (location.hash || '').replace(/^#\/?/, '').split('/').map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return '';
    }
  });
  if (parts[0] === 'sign-in' && parts[1]) return renderSignIn(parts[1], ticket);
  if (parts[0] === 'team') return renderTeam(ticket);
  if (parts[0] === 'b' && parts[1] && parts[2] === 'lead' && parts[3]) return renderLead(parts[1], parts[3], ticket);
  if (parts[0] === 'b' && parts[1]) return renderBusiness(parts[1], ticket);
  return renderPicker(ticket);
}

if (window.CRM_DEMO) {
  const banner = document.getElementById('demo-banner');
  if (banner) banner.hidden = false;
}
window.addEventListener('hashchange', route);
route();
