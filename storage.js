import { STORAGE_KEY, DATA_VERSION, DEFAULT_SETTINGS } from './constants.js';
import { todayISO } from './dateUtils.js';

/** Fill in anything missing so older backups and hand-edited files still load. */
export function normalize(raw) {
  const s = raw.settings || {};
  const settings = {
    ...DEFAULT_SETTINGS,
    ...s,
    split: { ...DEFAULT_SETTINGS.split, ...(s.split || {}) },
    marking: { ...DEFAULT_SETTINGS.marking, ...(s.marking || {}) },
  };
  return {
    version: DATA_VERSION,
    settings,
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    weeks: Array.isArray(raw.weeks) ? raw.weeks : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    exams: Array.isArray(raw.exams) ? raw.exams : [],
    meta: { isSample: false, ...(raw.meta || {}) },
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tasks) || !parsed.settings) return null;
    return normalize(parsed);
  } catch {
    return null;
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Validate and read a backup file. Accepts the export wrapper or a bare data object. */
export function parseImport(text) {
  let obj;
  try { obj = JSON.parse(text); } catch { return { ok: false, error: 'That file is not valid JSON.' }; }
  const data = obj && obj.app === 'apticrack' && obj.data ? obj.data : obj;
  if (!data || typeof data !== 'object' || !data.settings || !Array.isArray(data.tasks) || !Array.isArray(data.weeks) || !Array.isArray(data.exams)) {
    return { ok: false, error: 'This does not look like an AptiCrack backup (missing settings, weeks, tasks or exams).' };
  }
  return { ok: true, data: normalize(data) };
}

export function downloadBackup(data) {
  const payload = { app: 'apticrack', version: DATA_VERSION, exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `apticrack-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
