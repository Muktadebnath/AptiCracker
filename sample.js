import { DEFAULT_SETTINGS, DATA_VERSION } from './constants.js';
import { addDays, weekdayOf } from './dateUtils.js';
import { generatePlan } from './planGenerator.js';
import { makeDefaultTopics } from './topics.js';
import { examMetrics } from './stats.js';

// small seeded random generator so the sample data is the same every time
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const NOTES = [
  'Learn squares up to 30 by heart.', 'Silly mistakes in the last 5 questions. Slow down.', 'Shortcut clicked today!',
  'Need to revisit the formula sheet.', 'Good session. Timed set went well.', 'Struggled with the trickier ones, come back to it.',
];
const SKIP_REASONS = ['Travel day', 'Felt unwell', 'College event ran late'];

/** A demo plan that started about three weeks ago, with realistic progress. Clearly labelled in the UI. */
export function createSampleData(today, keep = {}) {
  const d = addDays(today, -21);
  const startDate = addDays(d, -((weekdayOf(d) + 6) % 7)); // the Monday on or before
  const settings = { ...DEFAULT_SETTINGS, ...keep, startDate };
  const topics = makeDefaultTopics();
  const plan = generatePlan(settings, topics);
  const rand = rng(42);

  const tasks = plan.tasks.map((t) => {
    if (t.date > today) return t;
    const isToday = t.date === today;
    let status = 'completed';
    if (!isToday) {
      const r = rand();
      if (r < 0.06) status = 'skipped';
      else if (r < 0.12) status = 'needs_revision';
    } else {
      status = t.order === 0 ? 'completed' : t.order === 1 ? 'in_progress' : 'not_started';
    }
    if (status === 'not_started') return t;
    if (status === 'skipped') return { ...t, status, skipReason: SKIP_REASONS[Math.floor(rand() * SKIP_REASONS.length)] };

    const actual = status === 'in_progress' ? Math.round(t.plannedMinutes / 2) : Math.max(10, t.plannedMinutes + Math.round(((rand() - 0.4) * 10) / 5) * 5);
    const out = { ...t, status, actualMinutes: actual, doneDate: t.date, revisionRequired: status === 'needs_revision' };
    if (t.type === 'practice' && t.questionsPlanned) {
      const base = 0.55 + (hash(t.topicId || 'x') % 36) / 100 + t.week * 0.01;
      out.questionsSolved = Math.round(t.questionsPlanned * (0.8 + rand() * 0.25));
      out.correct = Math.min(out.questionsSolved, Math.round(out.questionsSolved * Math.min(0.97, base + (rand() - 0.5) * 0.1)));
    }
    if (t.type === 'review' || t.type === 'practice') out.mistakeReviewed = rand() < 0.85;
    if (rand() < 0.12) out.notes = NOTES[Math.floor(rand() * NOTES.length)];
    return out;
  });

  const exams = plan.exams.map((e) => {
    if (e.date >= today) return e;
    const base = 0.5 + 0.07 * (e.week - 1);
    const offs = { quant: -0.03, logical: 0.03, verbal: 0.06 };
    const done = { ...e, submitted: true, reviewDone: e.week < 3, notes: e.week === 1 ? 'First real test. Ran out of time in Quant.' : '' };
    ['quant', 'logical', 'verbal'].forEach((k) => {
      const total = e[k].total;
      const attempted = Math.round(total * (0.88 + rand() * 0.08));
      const acc = Math.min(0.96, base + offs[k] + 0.15 + (rand() - 0.5) * 0.1);
      const correct = Math.min(attempted, Math.round(attempted * acc));
      done[k] = { total, correct, wrong: attempted - correct };
    });
    done.timeTaken = Math.max(20, e.timeAllowed - Math.round(rand() * 6) * 2);
    const m = examMetrics(done);
    const weekNames = [...new Set(tasks.filter((t) => t.week === e.week && t.section === m.weakest).map((t) => t.topicName))];
    done.weakTopics = weekNames.filter((n) => !n.includes(' and ') || n.length < 26).slice(0, 2);
    return done;
  });

  const topicsOut = topics.map((tp) => {
    const studied = tasks.some((t) => t.topicId === tp.id && t.status === 'completed');
    return studied ? { ...tp, confidence: 2 + Math.floor(rand() * 3) } : tp;
  });

  return {
    version: DATA_VERSION,
    settings,
    topics: topicsOut,
    weeks: plan.weeks,
    tasks,
    exams,
    meta: {
      isSample: true,
      // the real plan that appears when you press "Clear sample data"
      realSettings: { startDate: DEFAULT_SETTINGS.startDate, examDay: settings.examDay, sundayRest: settings.sundayRest },
    },
  };
}
