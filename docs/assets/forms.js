// Lead form behavior. No endpoint: hand the visitor a prefilled text. Never claim a send without { ok: true }.

const STAGES = {
  'Just me': 'Start',
  '2 to 5': 'Grow',
  '6 to 20': 'Scale',
  '21 or more': 'Scale',
};

const NEED_TO_BOX = {
  'missed-calls': 'missed-calls',
  'ai-receptionist': 'missed-calls',
  'speed-to-lead': 'slow-follow-up',
  'slow-follow-up': 'slow-follow-up',
  scheduling: 'scheduling',
  booking: 'scheduling',
  'job-to-invoice': 'quotes-and-invoices',
  'quotes-and-invoices': 'quotes-and-invoices',
  documents: 'paperwork',
  paperwork: 'paperwork',
  'team-apps': 'team-time',
  'team-time': 'team-time',
  websites: 'website',
  website: 'website',
  'not-sure': 'not-sure',
  'ai-operations': 'not-sure',
  hours: '',
};

function isChecked(el) {
  if (typeof el.checked === 'boolean') return el.checked;
  return el.hasAttribute('checked');
}

function field(form, name) {
  const listed = [...form.querySelectorAll(`[name="${name}"]`)];
  if (!listed.length) return '';
  const first = listed[0];
  if (first.type === 'radio') {
    const picked = listed.find((el) => isChecked(el));
    return picked ? picked.value : '';
  }
  if (first.type === 'checkbox') return isChecked(first) ? first.value : '';
  return first.value || '';
}

function checkedValues(form, name) {
  return [...form.querySelectorAll(`[name="${name}"]`)].filter(isChecked).map((el) => el.value);
}

export function stageForTeam(teamSize) {
  return STAGES[teamSize] || '';
}

export function readForm(form) {
  const teamSize = field(form, 'teamSize');
  const leakRaw = field(form, 'leakYearly').trim();
  const hoursRaw = field(form, 'hoursYearly').trim();
  const leakN = leakRaw === '' ? null : Number(leakRaw);
  const hoursN = hoursRaw === '' ? null : Number(hoursRaw);
  const calc = leakN == null && hoursN == null ? null : {
    leakYearly: Number.isFinite(leakN) ? leakN : null,
    hoursYearly: Number.isFinite(hoursN) ? hoursN : null,
  };
  const kind = field(form, 'type') || form.getAttribute('data-form') || 'contact';
  return {
    form: kind === 'audit' || kind === 'call' || kind === 'contact' ? kind : 'contact',
    name: field(form, 'name').trim(),
    phone: field(form, 'phone').trim(),
    email: field(form, 'email').trim(),
    business: field(form, 'business').trim(),
    industry: field(form, 'industry').trim(),
    teamSize,
    stage: stageForTeam(teamSize),
    needs: checkedValues(form, 'needs'),
    contactPref: field(form, 'contactPref'),
    notes: field(form, 'notes').trim(),
    smsConsent: field(form, 'smsConsent') === 'yes',
    calc,
    page: '',
    submittedAt: '',
    website: '',
  };
}

export function smsText(payload) {
  const calc = payload.calc;
  return [
    'Hi Thomas, this is a Forever Gold AI website request.',
    `Form: ${payload.form}`,
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Email: ${payload.email}`,
    `Business: ${payload.business}`,
    `Industry: ${payload.industry}`,
    `Team size: ${payload.teamSize}`,
    `Stage: ${payload.stage}`,
    `Needs: ${payload.needs.join(', ')}`,
    `Reach me by: ${payload.contactPref}`,
    `Notes: ${payload.notes}`,
    `Text consent: ${payload.smsConsent ? 'yes' : 'no'}`,
    `Yearly leak: ${calc && calc.leakYearly != null ? calc.leakYearly : ''}`,
    `Hours back: ${calc && calc.hoursYearly != null ? calc.hoursYearly : ''}`,
  ].join('\n');
}

export function smsHref(phoneE164, text) {
  return `sms:${phoneE164}?&body=${encodeURIComponent(text)}`;
}

function phoneOk(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function emailOk(value) {
  const v = String(value || '').trim();
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function problems(form) {
  const name = field(form, 'name').trim();
  const phone = field(form, 'phone').trim();
  const email = field(form, 'email').trim();
  const notes = field(form, 'notes').trim();
  const contact = form.getAttribute('data-form') === 'contact';
  const issues = [];
  if (!name) issues.push('Add your name.');
  if (!phoneOk(phone)) issues.push('Add a phone number with at least 10 digits.');
  if (!emailOk(email)) issues.push('Check the email or leave it blank.');
  if (contact && !notes) issues.push('Add a message.');
  return issues;
}

export function applyPrefill(form, search) {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const type = params.get('type');
  if (type === 'audit' || type === 'call') {
    form.querySelectorAll('[name="type"]').forEach((el) => {
      const on = el.value === type;
      el.checked = on;
      if (on) el.setAttribute('checked', '');
      else el.removeAttribute('checked');
    });
  }
  const box = NEED_TO_BOX[params.get('need') || ''];
  if (box) {
    const input = form.querySelector(`[name="needs"][value="${box}"]`);
    if (input) {
      input.checked = true;
      input.setAttribute('checked', '');
    }
  }
  const leak = form.querySelector('[name="leakYearly"]');
  const hours = form.querySelector('[name="hoursYearly"]');
  if (leak && params.get('leak')) leak.value = params.get('leak');
  if (hours && params.get('hours')) hours.value = params.get('hours');
}

function show(el, on) {
  if (el) el.hidden = !on;
}

export function bootForms(doc, config = {}, opts = {}) {
  const root = doc;
  const phone = (config && config.phoneE164) || '+14066986693';
  const endpoint = (config && config.leadEndpoint) || '';
  const doFetch = opts.fetch || ((typeof globalThis !== 'undefined' && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : null);
  const view = root.defaultView || (typeof window !== 'undefined' ? window : null);
  const search = opts.search != null ? opts.search : (view && view.location ? view.location.search : '');
  const pagePath = opts.page != null ? opts.page : (view && view.location ? view.location.pathname : '');

  root.querySelectorAll('form[data-lead]').forEach((form) => {
    applyPrefill(form, search);
    const alert = form.querySelector('[data-form-alert]');
    const handoff = form.querySelector('[data-handoff]');
    const thanks = form.querySelector('[data-thanks]');
    const error = form.querySelector('[data-error]');
    const sms = form.querySelector('[data-sms]');
    const team = form.querySelector('[name="teamSize"]');
    const echo = form.querySelector('[data-stage-echo]');
    const paintStage = () => {
      if (!echo || !team) return;
      const stage = stageForTeam(team.value);
      echo.hidden = !stage;
      echo.textContent = stage ? `Stage: ${stage}` : '';
    };
    if (team) team.addEventListener('change', paintStage);
    paintStage();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (form.dataset.busy === '1' || form.dataset.sent === '1') return;
      show(thanks, false);
      show(error, false);
      show(handoff, false);
      const issues = problems(form);
      if (issues.length) {
        if (alert) {
          alert.hidden = false;
          alert.textContent = issues[0];
        }
        return;
      }
      if (alert) alert.hidden = true;
      const trap = field(form, 'website').trim();
      if (trap) return;

      form.dataset.busy = '1';
      const payload = readForm(form);
      payload.page = pagePath;
      payload.submittedAt = new Date().toISOString();
      const text = smsText(payload);
      if (sms) sms.setAttribute('href', smsHref(phone, text));

      if (!endpoint) {
        show(handoff, true);
        form.dataset.busy = '0';
        return;
      }

      try {
        const res = await doFetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        let json = null;
        try { json = await res.json(); } catch { json = null; }
        if (res && res.ok && json && json.ok === true) {
          show(thanks, true);
          show(handoff, false);
          form.dataset.sent = '1';
        } else {
          show(error, true);
          show(handoff, true);
        }
      } catch {
        show(error, true);
        show(handoff, true);
      } finally {
        if (form.dataset.sent !== '1') form.dataset.busy = '0';
      }
    });
  });
}
