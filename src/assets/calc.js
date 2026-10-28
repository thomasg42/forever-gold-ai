// Pure math. No DOM. The page shows the formula in plain words under each result.

function toNum(value) {
  if (value == null) return null;
  const s = String(value).trim().replace(/,/g, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function zeroed(hint) {
  return { yearly: 0, monthly: 0, weekly: 0, dollars: 0, hint };
}

const HINT = 'Enter each number above zero to see a result.';

export function missedCallLeak({ callsPerWeek, missPercent, bookPercent, jobValue } = {}) {
  const calls = toNum(callsPerWeek);
  const miss = toNum(missPercent);
  const book = toNum(bookPercent);
  const value = toNum(jobValue);
  const parts = [calls, miss, book, value];
  if (parts.some((n) => n == null) || parts.some((n) => n === 0)) return { yearly: 0, monthly: 0, hint: HINT };
  if (calls < 0 || value < 0 || miss < 0 || miss > 80 || book < 0 || book > 100) {
    return { yearly: 0, monthly: 0, hint: 'Check the sliders and the job value.' };
  }
  const yearly = Math.round(calls * (miss / 100) * (book / 100) * value * 52);
  const monthly = Math.round(yearly / 12);
  return { yearly, monthly, hint: '' };
}

export function hoursBack({ parts, takeoverPercent, hourlyValue } = {}) {
  const nums = (Array.isArray(parts) ? parts : []).map(toNum);
  const take = toNum(takeoverPercent);
  const rate = toNum(hourlyValue);
  if (!nums.length || nums.some((n) => n == null) || take == null || rate == null) return zeroed(HINT);
  const sum = nums.reduce((total, n) => total + n, 0);
  if (take === 0 || rate === 0 || sum === 0) return zeroed(HINT);
  if (nums.some((n) => n < 0) || take < 0 || take > 100 || rate < 0) {
    return zeroed('Check the hours, the share, and the hourly value.');
  }
  const weekly = Math.round((sum * (take / 100)) * 10) / 10;
  const yearly = Math.round(weekly * 52);
  const dollars = Math.round(yearly * rate);
  return { weekly, yearly, dollars, hint: '' };
}
