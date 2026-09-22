import { CURRICULUM } from './topics.js';
import { TOTAL_WEEKS } from './constants.js';
import { addDays, diffDays, weekdayOf } from './dateUtils.js';

export const uid = (p = 't') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);

const DIFFICULTY = { foundation: 'easy', intermediate: 'medium', advanced: 'hard', revision: 'medium' };

/** turn the four split percentages into fractions that add up to 1 */
export function normSplit(split = {}) {
  const s = { learn: +split.learn || 0, practice: +split.practice || 0, review: +split.review || 0, revise: +split.revise || 0 };
  const total = s.learn + s.practice + s.review + s.revise || 1;
  return { learn: s.learn / total, practice: s.practice / total, review: s.review / total, revise: s.revise / total };
}

/**
 * Every generated task remembers its share of the day (`w`) and of the day's questions (`qw`).
 * That is what lets "retime" rescale upcoming tasks when you change your daily hours later.
 */
export function timing(settings, w, qw) {
  return {
    plannedMinutes: round5(settings.dailyMinutes * w),
    questionsPlanned: qw ? Math.max(1, Math.round(settings.questionsPerDay * qw)) : 0,
  };
}

/** Rescale planned minutes and questions on upcoming, untouched, non-customised tasks. */
export function retimeTasks(tasks, settings, today) {
  return tasks.map((t) => {
    if (t.status !== 'not_started' || t.date < today || t.customPlan || t.w == null) return t;
    return { ...t, ...timing(settings, t.w, t.qw) };
  });
}

// ------------------------------------------------------------------ wording
function describe(type, section, name) {
  if (type === 'learn') {
    if (section === 'quant') return `Study the core concepts, formulas and standard shortcuts for ${name}. Work through 4-5 solved examples before you start practising.`;
    if (section === 'logical') return `Understand the rules and common patterns in ${name}. Follow the solved examples step by step and note recurring tricks.`;
    return `Study the rules, examples and common traps in ${name}. Note new words or exceptions in your notebook.`;
  }
  if (type === 'practice') return `Solve today's ${name} question set: start with easy questions, then finish with a timed block. Log how many you got right.`;
  if (type === 'review') return `Re-attempt every wrong or guessed question from today (${name}). Write down the shortcut or rule you missed.`;
  if (type === 'revise') {
    if (section === 'quant') return `Revise formulas and shortcuts for ${name}: write them from memory first, then check.`;
    if (section === 'logical') return `Revisit the patterns and tricks for ${name} and redo 3-4 solved examples quickly.`;
    return `Revise the rules and word lists for ${name} and test yourself with flash notes.`;
  }
  return '';
}

/** Task templates for special days. w = share of the day's time, q = share of the day's questions. */
const TEMPLATES = {
  revision: {
    qMult: 1,
    tasks: [
      { type: 'revise', title: 'Concept and formula revision', w: 0.3, q: 0, desc: (l) => `Skim your notes and formula sheet for: ${l}. Redo the trickiest solved examples.` },
      { type: 'practice', title: 'Mixed practice on revised topics', w: 0.4, q: 1, desc: () => 'Solve a mixed set from these topics. Time yourself and mark every guess.' },
      { type: 'review', title: 'Mistake review', w: 0.18, q: 0, desc: () => 'Re-attempt every wrong or guessed question and write down why you missed it.' },
      { type: 'revise', title: 'Shortcuts and speed recap', w: 0.12, q: 0, desc: () => 'Rewrite your top shortcuts and formulas from memory.' },
    ],
  },
  sectional: {
    qMult: 1,
    tasks: [
      { type: 'practice', title: 'Timed sectional test', w: 0.45, q: 1, desc: (l) => `${l}. Sit it like the real thing: one sitting, no pausing, strict timer.` },
      { type: 'review', title: 'Analyse the test and review mistakes', w: 0.3, q: 0, desc: () => 'Sort mistakes into concept gaps, silly errors and time pressure.' },
      { type: 'revise', title: 'Revise weak topics from the test', w: 0.25, q: 0, desc: () => 'Pick the 2-3 weakest topics from this test and revise them.' },
    ],
  },
  fulltest: {
    qMult: 1.75,
    tasks: [
      { type: 'practice', title: 'Full-length aptitude test (timed)', w: 0.55, q: 1, desc: () => 'Take a full mixed paper (Quant, Logical, Verbal) in one sitting.' },
      { type: 'review', title: 'Full test analysis', w: 0.35, q: 0, desc: () => 'Go through every wrong answer and every lucky guess.' },
      { type: 'revise', title: 'Note weak areas and recap formulas', w: 0.1, q: 0, desc: () => 'List the topics to fix before the final exam.' },
    ],
  },
  weak: {
    qMult: 1,
    tasks: [
      { type: 'revise', title: 'Weak-topic concept refresh', w: 0.3, q: 0, desc: () => 'Open Analytics, pick your weakest topics and re-read their notes.' },
      { type: 'practice', title: 'Targeted practice on weak topics', w: 0.45, q: 1, desc: () => 'Solve questions only from your weakest topics.' },
      { type: 'review', title: 'Mistake review', w: 0.25, q: 0, desc: () => 'Close the loop: understand every mistake made today.' },
    ],
  },
  speed: {
    qMult: 1,
    tasks: [
      { type: 'practice', title: 'Speed drills (timed 10-question sets)', w: 0.5, q: 1, desc: () => 'Do short timed sets and try to beat your previous time.' },
      { type: 'review', title: 'Mistake review', w: 0.2, q: 0, desc: () => 'Review errors made under time pressure.' },
      { type: 'revise', title: 'Shortcut and mental-maths drills', w: 0.3, q: 0, desc: () => 'Squares, cubes, tables, fraction-percentage conversions.' },
    ],
  },
  mix: {
    qMult: 1,
    tasks: [
      { type: 'practice', title: 'Mixed practice (all three sections)', w: 0.55, q: 1, desc: () => 'A mixed set across Quant, Logical and Verbal, like a real assessment.' },
      { type: 'review', title: 'Mistake review', w: 0.2, q: 0, desc: () => 'Review every wrong or guessed question.' },
      { type: 'revise', title: 'Formula and vocabulary sheet', w: 0.25, q: 0, desc: () => 'Revise your formula sheet and 10 vocabulary words.' },
    ],
  },
};

// ------------------------------------------------------------------ calendar
/** Work out the date range of each week. Every week ends on the exam day. */
export function buildWeekRanges(settings, weeks = TOTAL_WEEKS) {
  const examDay = ((Number(settings.examDay) || 0) % 7 + 7) % 7;
  const startDate = settings.startDate;
  let end = startDate;
  for (let i = 0; i < 7 && weekdayOf(end) !== examDay; i++) end = addDays(end, 1);
  // if the first exam day is too close to the start, use the following one so week 1 is a proper week
  if (diffDays(end, startDate) + 1 < 4) end = addDays(end, 7);

  const out = [];
  let start = startDate;
  for (let i = 0; i < weeks; i++) {
    if (i > 0) {
      start = addDays(out[i - 1].endDate, 1);
      end = addDays(start, 6);
    }
    const dates = [];
    for (let d = start; diffDays(end, d) >= 0; d = addDays(d, 1)) dates.push(d);
    const studyDates = dates.filter((d) => d !== end && !(settings.sundayRest && weekdayOf(d) === 0));
    out.push({ week: i + 1, startDate: start, endDate: end, examDate: end, studyDates });
  }
  return out;
}

// ------------------------------------------------------------------ building tasks
const normBlock = (b) => {
  if (typeof b === 'string') return { kind: 'topic', keys: [b] };
  if (Array.isArray(b)) return { kind: 'topic', keys: b };
  return { kind: 'custom', ...b };
};

function templateTasks(tpl, block, topicsById) {
  const ids = (block.topics || []).filter((k) => topicsById[k]);
  const sumW = tpl.tasks.reduce((a, t) => a + t.w, 0);
  const sumQ = tpl.tasks.reduce((a, t) => a + t.q, 0) || 1;
  return tpl.tasks.map((t) => ({
    type: t.type,
    title: t.title,
    description: t.desc(block.label),
    section: block.section,
    topicId: ids[0] || null,
    topicIds: ids,
    topicName: block.label,
    w: t.w / sumW,
    qw: (t.q / sumQ) * tpl.qMult * (t.q ? 1 : 0),
  }));
}

function topicBlockTasks(block, ctx, repeat) {
  const { topicsById, split, history } = ctx;
  const tps = block.keys.map((k) => topicsById[k]).filter(Boolean);
  if (!tps.length) return templateTasks(TEMPLATES.mix, { label: 'Mixed practice', section: 'mixed', topics: [] }, topicsById);

  const m = tps.length;
  const out = [];
  const mk = (type, tp, w, qw, title) => ({
    type, title, description: describe(type, tp.section, tp.name), section: tp.section,
    topicId: tp.id, topicIds: [tp.id], topicName: tp.name, w, qw,
  });
  tps.forEach((tp) => {
    if (!repeat) out.push(mk('learn', tp, split.learn / m, 0, `Learn: ${tp.name}`));
    out.push(mk('practice', tp, (repeat ? split.learn + split.practice : split.practice) / m, 1 / m, `${repeat ? 'Practice set 2' : 'Practice'}: ${tp.name}`));
  });

  const names = tps.map((t) => t.name).join(' and ');
  const ids = tps.map((t) => t.id);
  out.push({
    type: 'review', title: 'Mistake review', description: describe('review', tps[0].section, names),
    section: tps[0].section, topicId: ids[0], topicIds: ids, topicName: names, w: split.review, qw: 0,
  });

  // spaced revision: revisit the topic you studied about three study-days ago
  const past = [...history].reverse().filter((id) => !ids.includes(id));
  const rid = past[2] ?? past[past.length - 1] ?? ids[0];
  const rt = topicsById[rid] || tps[0];
  out.push({
    type: 'revise', title: `Revise: ${rt.name}`, description: describe('revise', rt.section, rt.name), section: rt.section,
    topicId: rt.id, topicIds: [rt.id], topicName: rt.name, w: split.revise, qw: 0,
  });
  history.push(...ids);
  return out;
}

/** When two blocks land on one day, keep a single review and a single revise task. */
function mergeDay(parts) {
  const m = parts.length;
  let all = parts.flatMap((p) => p.map((t) => ({ ...t, w: t.w / m, qw: t.qw / m })));
  if (m > 1) {
    for (const ty of ['review', 'revise']) {
      const idx = all.map((t, i) => (t.type === ty ? i : -1)).filter((i) => i >= 0);
      if (idx.length > 1) {
        const [first, ...rest] = idx;
        rest.forEach((i) => {
          all[first].w += all[i].w;
          all[first].topicIds = [...new Set([...all[first].topicIds, ...all[i].topicIds])];
          if (ty === 'review') all[first].topicName = `${all[first].topicName} and ${all[i].topicName}`;
        });
        if (ty === 'review') all[first].description = describe('review', all[first].section, all[first].topicName);
        all = all.filter((_, i) => !rest.includes(i));
      }
    }
  }
  // learn/practice first, then review, then revise (stable sort keeps the rest in order)
  const rank = { review: 1, revise: 2 };
  return all.map((t, i) => [t, i]).sort((a, b) => (rank[a[0].type] || 0) - (rank[b[0].type] || 0) || a[1] - b[1]).map((x) => x[0]);
}

/**
 * Build the full plan: weeks, daily tasks and one exam per week.
 * @returns {{weeks: object[], tasks: object[], exams: object[]}}
 */
export function generatePlan(settings, topics) {
  const topicsById = Object.fromEntries(topics.map((t) => [t.id, t]));
  const split = normSplit(settings.split);
  const ranges = buildWeekRanges(settings);
  const planStart = ranges[0].startDate;
  const weeks = [], tasks = [], exams = [];
  const history = [];
  const marking = settings.marking || { correct: 1, wrong: 0 };

  ranges.forEach((r, wi) => {
    const cur = CURRICULUM[wi];
    weeks.push({ week: r.week, phase: cur.phase, title: cur.title, focus: cur.focus, startDate: r.startDate, endDate: r.endDate, examDate: r.examDate });

    const blocks = cur.blocks.map(normBlock);
    const n = blocks.length;
    const d = r.studyDates.length;
    let prevFrom = -1;

    r.studyDates.forEach((date, di) => {
      const from = Math.floor((di * n) / d);
      const to = Math.floor(((di + 1) * n) / d);
      const dayBlocks = blocks.slice(from, Math.max(to, from + 1));
      const repeat = dayBlocks.length === 1 && from === prevFrom && dayBlocks[0].kind === 'topic';
      prevFrom = from;

      const parts = dayBlocks.map((b) =>
        b.kind === 'topic' ? topicBlockTasks(b, { topicsById, split, history }, repeat) : templateTasks(TEMPLATES[b.template] || TEMPLATES.mix, b, topicsById),
      );
      mergeDay(parts).forEach((t, order) => {
        tasks.push({
          id: uid('t'), week: r.week, day: diffDays(date, planStart) + 1, weekDay: diffDays(date, r.startDate) + 1, date, order,
          section: t.section, topicId: t.topicId, topicIds: t.topicIds, topicName: t.topicName,
          type: t.type, title: t.title, description: t.description,
          ...timing(settings, t.w, t.qw), w: t.w, qw: t.qw,
          actualMinutes: 0, questionsSolved: 0, correct: 0,
          status: 'not_started', difficulty: DIFFICULTY[cur.phase], notes: '',
          mistakeReviewed: false, revisionRequired: false, skipReason: '', doneDate: '', customPlan: false,
        });
      });
    });

    const total = cur.exam.q + cur.exam.l + cur.exam.v;
    exams.push({
      id: `e_${r.week}`, examNumber: r.week, week: r.week, date: r.examDate,
      quant: { total: cur.exam.q, correct: 0, wrong: 0 },
      logical: { total: cur.exam.l, correct: 0, wrong: 0 },
      verbal: { total: cur.exam.v, correct: 0, wrong: 0 },
      timeAllowed: round5(total * 1.2), timeTaken: 0,
      targetScore: Math.round(total * marking.correct * (cur.exam.pct / 100)),
      marking: { ...marking }, weakTopics: [], reviewDone: false, submitted: false, notes: '',
    });
  });

  return { weeks, tasks, exams };
}

// ------------------------------------------------------------------ editing an existing plan
export const weekFor = (weeks, date) => {
  if (!weeks.length) return null;
  return weeks.find((w) => date >= w.startDate && date <= w.endDate) || (date < weeks[0].startDate ? weeks[0] : weeks[weeks.length - 1]);
};

/** week / day numbers for a task that has been moved to `date` */
export function placeTask(weeks, date) {
  const wk = weekFor(weeks, date);
  if (!wk) return { week: 1, day: 1, weekDay: 1 };
  return { week: wk.week, day: diffDays(date, weeks[0].startDate) + 1, weekDay: Math.max(1, diffDays(date, wk.startDate) + 1) };
}

/** shift every date in a plan by `delta` days (used when you change the start date mid-plan) */
export function shiftPlan(data, delta) {
  const mv = (d) => (d ? addDays(d, delta) : d);
  return {
    ...data,
    weeks: data.weeks.map((w) => ({ ...w, startDate: mv(w.startDate), endDate: mv(w.endDate), examDate: mv(w.examDate) })),
    tasks: data.tasks.map((t) => ({ ...t, date: mv(t.date) })),
    exams: data.exams.map((e) => ({ ...e, date: mv(e.date) })),
  };
}

/** put every exam that has no result yet on the chosen weekday inside its week */
export function moveExamDates(data, examDay) {
  const newDate = (w) => {
    for (let i = 0; i < 7; i++) {
      const d = addDays(w.startDate, i);
      if (weekdayOf(d) === examDay) return d;
    }
    return w.examDate;
  };
  const byWeek = Object.fromEntries(data.weeks.map((w) => [w.week, w]));
  const exams = data.exams.map((e) => (e.submitted || !byWeek[e.week] ? e : { ...e, date: newDate(byWeek[e.week]) }));
  const dateOf = Object.fromEntries(exams.map((e) => [e.week, e.date]));
  return { ...data, exams, weeks: data.weeks.map((w) => ({ ...w, examDate: dateOf[w.week] || w.examDate })) };
}

