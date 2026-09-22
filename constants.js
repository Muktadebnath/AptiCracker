export const STORAGE_KEY = 'apticrack.v1';
export const DATA_VERSION = 1;
export const TOTAL_WEEKS = 12;

/** Sections. `tone` is the CSS colour family (see index.css). */
export const SECTIONS = {
  quant: { key: 'quant', label: 'Quantitative Aptitude', short: 'Quant', tone: 'quant' },
  logical: { key: 'logical', label: 'Logical Reasoning', short: 'Logical', tone: 'logic' },
  verbal: { key: 'verbal', label: 'Verbal Aptitude', short: 'Verbal', tone: 'verbal' },
  mixed: { key: 'mixed', label: 'Mixed & Tests', short: 'Mixed', tone: 'mixed' },
};
export const CORE_SECTIONS = ['quant', 'logical', 'verbal'];

export const STATUSES = {
  not_started: { label: 'Not started', tone: 'pending' },
  in_progress: { label: 'In progress', tone: 'progress' },
  completed: { label: 'Completed', tone: 'done' },
  skipped: { label: 'Skipped', tone: 'skip' },
  needs_revision: { label: 'Needs revision', tone: 'revise' },
};

export const TASK_TYPES = {
  learn: { label: 'Learn concepts' },
  practice: { label: 'Practice' },
  review: { label: 'Review mistakes' },
  revise: { label: 'Revise' },
  custom: { label: 'Custom' },
};

export const DIFFICULTIES = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export const PHASES = {
  foundation: { label: 'Foundation', tone: 'logic', weeks: 'Weeks 1-4' },
  intermediate: { label: 'Intermediate', tone: 'verbal', weeks: 'Weeks 5-8' },
  advanced: { label: 'Advanced', tone: 'quant', weeks: 'Weeks 9-10' },
  revision: { label: 'Revision & exams', tone: 'exam', weeks: 'Weeks 11-12' },
};

export const ACCENTS = {
  coral: { label: 'Coral', swatch: '#ff7f6b' },
  lavender: { label: 'Lavender', swatch: '#9b87f5' },
  sky: { label: 'Sky', swatch: '#4da6e8' },
  mint: { label: 'Mint', swatch: '#4cc38a' },
};

/**
 * Defaults. Edit these to change what a brand-new plan looks like.
 *  - dailyMinutes: total study time per day (120 = 2 hours)
 *  - split: how a study day is divided (percent). Learn / Practice / Review mistakes / Revise formulas.
 *  - examDay: 0 = Sunday ... 6 = Saturday
 */
export const DEFAULT_SETTINGS = {
  name: 'Mission 15lpa',
  startDate: '2026-09-22',
  targetEndDate: '',
  dailyMinutes: 120,
  questionsPerDay: 40,
  split: { learn: 30, practice: 42, review: 17, revise: 11 },
  examDay: 0,
  sundayRest: false,
  targetAccuracy: 80,
  marking: { correct: 1, wrong: 0 }, // set wrong to 0.25 for 1/4 negative marking
  accent: 'coral',
  mode: 'light', // 'light' | 'dark' | 'auto'
};

/** CSS helpers: soft background + readable text for a tone, or the solid colour. */
export const toneStyle = (t) => ({ background: `var(--${t}-soft)`, color: `var(--${t}-ink)` });
export const solid = (t) => `var(--${t})`;
