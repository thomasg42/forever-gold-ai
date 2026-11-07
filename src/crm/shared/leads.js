// Shared rules for Forever Gold CRM. The browser and the Worker both import this file,
// so a lead is counted, merged and validated the same way everywhere.
// A blank cell means "not recorded". It is never treated as zero or as "no".

// Stable field names, and the sheet headers each one reads from.
// Headers are matched after trimming and lowercasing because the live sheet has
// headers with trailing spaces ("Timestamp ", "Contact Name ").
export const FIELD_HEADERS = {
  timestamp: ['Timestamp'],
  name: ['Contact Name'],
  phone: ['Phone'],
  project: ['Surface Type', 'Project', 'Vehicle and Need'],
  preferredDay: ['Preferred Day'],
  appointmentDate: ['Appointment Date'],
  appointmentTime: ['Appointment Time'],
  conversationId: ['Conversation ID'],
  transcript: ['Transcript'],
  leadId: ['Lead ID'],
  source: ['Source'],
  website: ['Website'],
  email: ['Email'],
  qa: ['QA'],
  contactStatus: ['Contact Status'],
  bookingStatus: ['Booking Status'],
  jobStatus: ['Job Status'],
  paymentStatus: ['Payment Status'],
  collectedRevenue: ['Collected Revenue'],
  directJobCosts: ['Direct Job Costs'],
  otherCosts: ['Other Attributable Costs'],
  outcomeNotes: ['Outcome Notes'],
  crmUpdatedAt: ['CRM Updated At'],
};

export const STATUS_OPTIONS = {
  contactStatus: ['Attempted', 'Reached', 'Qualified', 'Not a fit', 'Bad number'],
  bookingStatus: ['Not booked', 'Booked', 'Rescheduled', 'Canceled'],
  jobStatus: ['Pending', 'In progress', 'Completed', 'Canceled', 'No-show'],
  paymentStatus: ['Unpaid', 'Deposit paid', 'Paid in full', 'Refunded'],
};
export const MONEY_FIELDS = ['collectedRevenue', 'directJobCosts', 'otherCosts'];
export const OUTCOME_FIELDS = [...Object.keys(STATUS_OPTIONS), ...MONEY_FIELDS, 'outcomeNotes'];
const REQUIRED_FIELDS = ['timestamp', 'name', 'phone', ...OUTCOME_FIELDS, 'crmUpdatedAt'];

export const NOTES_MAX = 2000;
const MERGE_WINDOW_MS = 10 * 60 * 1000;

const headerKey = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const cell = (value) => String(value ?? '').trim();

export function mapHeaders(headerRow = []) {
  const positions = new Map();
  headerRow.forEach((header, index) => {
    const key = headerKey(header);
    if (key && !positions.has(key)) positions.set(key, index);
  });
  const columns = {};
  for (const [field, names] of Object.entries(FIELD_HEADERS)) {
    for (const name of names) {
      const at = positions.get(headerKey(name));
      if (at !== undefined) {
        columns[field] = at;
        break;
      }
    }
  }
  const missing = REQUIRED_FIELDS.filter((field) => columns[field] === undefined);
  return { columns, missing };
}

export function digitsOnly(phone) {
  const digits = cell(phone).replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

export function toMoney(value) {
  const text = cell(value).replace(/[$,\s]/g, '');
  if (!text || !/^-?\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

function parseTime(value) {
  const text = cell(value);
  if (!text) return null;
  const ms = Date.parse(text);
  return Number.isNaN(ms) ? null : ms;
}

export function isTestRecord(fields) {
  if (/^(yes|y|true|1|test|qa)$/i.test(cell(fields.qa))) return true;
  const name = cell(fields.name);
  return /\b(test|qa probe)\b/i.test(name) || /^zzz/i.test(name);
}

// "ad" only when the source says so. Blank or "unknown" stays not recorded, never assumed.
export function sourceKind(source) {
  const text = cell(source);
  if (!text || /^unknown$/i.test(text)) return 'none';
  if (/facebook|instagram|\bmeta\b|\bfb\b|\big\b|fbclid|\bad_id=|\bcampaign_id=|utm_medium=paid/i.test(text)) return 'ad';
  return 'other';
}

function hashText(text) {
  let a = 0xdeadbeef;
  let b = 0x41c6ce57;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    a = Math.imul(a ^ code, 2654435761);
    b = Math.imul(b ^ code, 1597334677);
  }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
  b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
  return (4294967296 * (2097151 & b) + (a >>> 0)).toString(36);
}

function belongsTogether(group, record) {
  if (record.fields.leadId) {
    if (group.leadIds.has(record.fields.leadId)) return true;
    if (group.leadIds.size) return false; // Two different IDs are two different submissions.
  }
  const phone = digitsOnly(record.fields.phone);
  if (!phone || phone !== group.phone) return false;
  if (record.time === null || group.lastTime === null) return false;
  return Math.abs(record.time - group.lastTime) <= MERGE_WINDOW_MS;
}

// Turns the raw sheet values (header row first) into leads.
// The live automations can write one inquiry to two rows seconds apart, so those merge.
// The sheet itself is never changed. Writes go to the lead's primary row only.
export function buildLeads(values = []) {
  const { columns, missing } = mapHeaders(values[0] || []);
  if (missing.length) return { missing, leads: [], columns };

  const records = [];
  values.slice(1).forEach((row, index) => {
    const fields = {};
    for (const field of Object.keys(FIELD_HEADERS)) {
      fields[field] = columns[field] === undefined ? '' : cell(row[columns[field]]);
    }
    if (Object.values(fields).some(Boolean)) {
      records.push({ rowNumber: index + 2, fields, time: parseTime(fields.timestamp) });
    }
  });

  const ordered = [...records].sort((x, y) => {
    if (x.time === null && y.time === null) return x.rowNumber - y.rowNumber;
    if (x.time === null) return 1;
    if (y.time === null) return -1;
    return x.time - y.time || x.rowNumber - y.rowNumber;
  });

  const groups = [];
  for (const record of ordered) {
    let group = groups.find((candidate) => belongsTogether(candidate, record));
    if (!group) {
      group = { rows: [], leadIds: new Set(), phone: digitsOnly(record.fields.phone), lastTime: record.time };
      groups.push(group);
    }
    group.rows.push(record);
    if (record.fields.leadId) group.leadIds.add(record.fields.leadId);
    if (record.time !== null) group.lastTime = record.time;
  }

  const leads = groups.map((group) => {
    const primary = group.rows.find((row) => row.fields.leadId) || group.rows[0];
    const merged = {};
    for (const field of Object.keys(FIELD_HEADERS)) {
      merged[field] = primary.fields[field]
        || group.rows.map((row) => row.fields[field]).find(Boolean)
        || '';
    }
    const key = primary.fields.leadId
      ? `id_${hashText(primary.fields.leadId)}`
      : `k_${hashText([primary.fields.timestamp, digitsOnly(primary.fields.phone), primary.fields.name].join('|'))}`;
    const emailInText = merged.email ? '' : (merged.transcript.match(/[\w.+-]+@[\w-]+\.[\w.-]*\w/) || [''])[0];
    return {
      ...merged,
      key,
      primaryRow: primary.rowNumber,
      mergedRows: group.rows.length,
      receivedAt: primary.time ?? group.rows.map((row) => row.time).find((t) => t !== null) ?? null,
      isTest: group.rows.some((row) => isTestRecord(row.fields)),
      sourceKind: sourceKind(merged.source),
      displayEmail: merged.email || emailInText,
    };
  });

  leads.sort((x, y) => (y.receivedAt ?? -Infinity) - (x.receivedAt ?? -Infinity));
  return { missing: [], leads, columns };
}

export const needsFollowUp = (lead) => !lead.isTest && !lead.contactStatus && !lead.bookingStatus;

function stage(key, label, leads, recordedField, values) {
  const recorded = leads.filter((lead) => lead[recordedField]).length;
  return {
    key,
    label,
    count: recorded === 0 ? null : leads.filter((lead) => values.includes(lead[recordedField])).length,
    notRecorded: leads.length - recorded,
  };
}

function moneyTotal(leads, field) {
  const known = leads.map((lead) => toMoney(lead[field])).filter((value) => value !== null);
  return {
    total: known.length ? Math.round(known.reduce((sum, value) => sum + value, 0) * 100) / 100 : null,
    recorded: known.length,
  };
}

// Tests never count. A stage with nothing recorded is null (shown as Unknown), not 0.
export function summarize(allLeads = []) {
  const leads = allLeads.filter((lead) => !lead.isTest);
  return {
    total: leads.length,
    needsFollowUp: leads.filter(needsFollowUp).length,
    stages: [
      { key: 'inquiries', label: 'Inquiries', count: leads.length, notRecorded: 0 },
      stage('reached', 'Reached', leads, 'contactStatus', ['Reached', 'Qualified', 'Not a fit']),
      stage('qualified', 'Qualified', leads, 'contactStatus', ['Qualified']),
      stage('booked', 'Booked', leads, 'bookingStatus', ['Booked', 'Rescheduled']),
      stage('completed', 'Finished', leads, 'jobStatus', ['Completed']),
      stage('paid', 'Paid', leads, 'paymentStatus', ['Deposit paid', 'Paid in full']),
    ],
    collected: moneyTotal(leads, 'collectedRevenue'),
    directCosts: moneyTotal(leads, 'directJobCosts'),
    otherCosts: moneyTotal(leads, 'otherCosts'),
  };
}

// Only outcome fields can ever change from the portal. Inquiry data stays as the customer gave it.
export function validateChanges(changes) {
  const clean = {};
  const errors = [];
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    return { clean, errors: ['Nothing to save.'] };
  }
  for (const [field, raw] of Object.entries(changes)) {
    if (!OUTCOME_FIELDS.includes(field)) {
      errors.push(`${field} cannot be changed here.`);
      continue;
    }
    const text = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw : null;
    if (text === null) {
      errors.push(`${field} is not valid.`);
    } else if (STATUS_OPTIONS[field]) {
      const value = text.trim();
      if (value && !STATUS_OPTIONS[field].includes(value)) errors.push(`${field} is not one of the choices.`);
      else clean[field] = value;
    } else if (MONEY_FIELDS.includes(field)) {
      const value = text.replace(/[$,\s]/g, '');
      if (value && !/^\d{1,9}(\.\d{1,2})?$/.test(value)) errors.push(`${field} must be a dollar amount.`);
      else clean[field] = value;
    } else {
      // eslint-disable-next-line no-control-regex
      const value = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
      if (value.length > NOTES_MAX) errors.push(`Notes must be under ${NOTES_MAX} characters.`);
      else clean[field] = value;
    }
  }
  if (!errors.length && !Object.keys(clean).length) errors.push('Nothing to save.');
  return { clean, errors };
}
