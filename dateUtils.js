// All dates in the app are plain local-date strings: "YYYY-MM-DD".
// Working with strings (not Date objects) avoids timezone and daylight-saving surprises.

const pad = (n) => String(n).padStart(2, '0');

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s) => {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const todayISO = () => toISO(new Date());
export const isValidISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s)) && !Number.isNaN(parseISO(s).getTime());

export const addDays = (iso, n) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
/** whole days from b to a (a - b) */
export const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 86400000);
export const weekdayOf = (iso) => parseISO(iso).getDay();

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const LOCALE = 'en-GB';
export const fmtDate = (iso) => (iso ? parseISO(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }) : '-');
export const fmtDay = (iso) => (iso ? parseISO(iso).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' }) : '-');
export const fmtFull = (iso) =>
  iso ? parseISO(iso).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-';
export const fmtYear = (iso) => (iso ? parseISO(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

/** the n dates ending on endISO (oldest first) */
export const dateRange = (endISO, n) => Array.from({ length: n }, (_, i) => addDays(endISO, i - (n - 1)));

export const fmtMinutes = (m) => {
  m = Math.round(Number(m) || 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}m`;
  return r ? `${h}h ${r}m` : `${h}h`;
};

export const relativeDay = (iso, today) => {
  const d = diffDays(iso, today);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d === -1) return 'yesterday';
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
};
