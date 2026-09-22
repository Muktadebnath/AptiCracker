/**
 * ALL PROGRESS MATH LIVES HERE
 * ----------------------------
 *  Overall completion  = completed tasks / total planned tasks x 100
 *  Topic completion    = completed topic tasks / total topic tasks x 100
 *  Daily completion    = completed tasks that day / planned tasks that day x 100
 *  Exam accuracy       = correct answers / attempted questions x 100   (attempted = correct + wrong)
 *  Skipped tasks are counted separately. They are never counted as completed.
 */
import { addDays, diffDays } from './dateUtils.js';

export const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);
export const round = (n, d = 0) => {
  const f = 10 ** d;
  return Math.round((Number(n) || 0) * f) / f;
};
const sum = (arr, fn) => arr.reduce((a, x) => a + (Number(fn(x)) || 0), 0);

export const taskTopics = (t) => (t.topicIds && t.topicIds.length ? t.topicIds : t.topicId ? [t.topicId] : []);
export const isOpen = (t) => t.status === 'not_started' || t.status === 'in_progress';

/** completed | skipped | revision | overdue | pending */
export function bucketOf(t, today) {
  if (t.status === 'completed') return 'completed';
  if (t.status === 'skipped') return 'skipped';
  if (t.status === 'needs_revision') return 'revision';
  return t.date < today ? 'overdue' : 'pending';
}

export function overall(tasks, today) {
  const c = { completed: 0, skipped: 0, revision: 0, overdue: 0, pending: 0 };
  tasks.forEach((t) => { c[bucketOf(t, today)]++; });
  const total = tasks.length;
  return { total, ...c, pct: pct(c.completed, total) };
}

export function dayStats(tasks, date, today) {
  const ts = tasks.filter((t) => t.date === date);
  const o = overall(ts, today);
  return { ...o, plannedMinutes: sum(ts, (t) => t.plannedMinutes), actualMinutes: sum(ts, (t) => t.actualMinutes) };
}

export function questionStats(tasks) {
  const solved = sum(tasks, (t) => t.questionsSolved);
  const correct = sum(tasks, (t) => t.correct);
  return { solved, correct, accuracy: solved ? (correct / solved) * 100 : null };
}
export const taskAccuracy = (t) => (t.questionsSolved > 0 ? (t.correct / t.questionsSolved) * 100 : null);
export const studyMinutes = (tasks) => sum(tasks, (t) => t.actualMinutes);

export function sectionStats(tasks, today, section) {
  const ts = tasks.filter((t) => t.section === section);
  return { ...overall(ts, today), ...questionStats(ts), minutes: studyMinutes(ts) };
}

// ------------------------------------------------------------------ topics
export const CONFIDENCE_INTERVAL = { 1: 2, 2: 4, 3: 7, 4: 14, 5: 21 }; // days until the next revision

export function topicStats(topic, tasks, today, targetAccuracy = 80) {
  const ts = tasks.filter((t) => taskTopics(t).includes(topic.id));
  const total = ts.length;
  const completed = ts.filter((t) => t.status === 'completed').length;
  // questions are only attributed to a topic when the task covers that single topic
  const single = ts.filter((t) => taskTopics(t).length === 1);
  const solved = sum(single, (t) => t.questionsSolved);
  const correct = sum(single, (t) => t.correct);
  const accuracy = solved ? (correct / solved) * 100 : null;

  const studiedDates = ts.filter((t) => t.status === 'completed' || t.actualMinutes > 0).map((t) => t.doneDate || t.date).sort();
  const lastStudied = studiedDates.length ? studiedDates[studiedDates.length - 1] : null;
  const conf = topic.confidence || 3;
  const nextRevision = topic.nextRevision || (lastStudied ? addDays(lastStudied, CONFIDENCE_INTERVAL[conf]) : null);

  const flagged = ts.some((t) => t.status === 'needs_revision' || t.revisionRequired);
  let status = 'not_started';
  if (!total) status = 'not_scheduled';
  else if (flagged) status = 'needs_revision';
  else if (completed === total) status = 'completed';
  else if (completed > 0 || ts.some((t) => t.status === 'in_progress' || t.actualMinutes > 0)) status = 'in_progress';

  const reasons = [];
  if (flagged) reasons.push('Marked for revision');
  if (lastStudied && conf <= 2) reasons.push('Low confidence');
  if (accuracy != null && solved >= 10 && accuracy < targetAccuracy - 15) reasons.push('Low accuracy');
  if (!reasons.length && lastStudied && nextRevision && nextRevision <= today) reasons.push('Revision due');

  return { total, completed, pct: pct(completed, total), solved, correct, accuracy, lastStudied, nextRevision, status, reasons, needsRevision: reasons.length > 0 };
}

// ------------------------------------------------------------------ weeks and exams
export function weekStats(week, tasks, exams, today) {
  const ts = tasks.filter((t) => t.week === week.week);
  const o = overall(ts, today);
  const exam = exams.find((e) => e.week === week.week);
  const studyDays = new Set(ts.map((t) => t.date)).size;
  let status = 'upcoming';
  if (today >= week.startDate && today <= week.endDate) status = 'current';
  if (today > week.endDate) status = 'behind';
  if (o.total && o.completed === o.total && (!exam || exam.submitted)) status = 'done';
  return { ...o, studyDays, exam, status };
}

export const WEEK_STATUS = {
  upcoming: { label: 'Upcoming', tone: 'mixed' },
  current: { label: 'This week', tone: 'progress' },
  behind: { label: 'Needs catch-up', tone: 'pending' },
  done: { label: 'Completed', tone: 'done' },
};

export function examMetrics(exam) {
  const m = exam.marking || { correct: 1, wrong: 0 };
  const secs = ['quant', 'logical', 'verbal'].map((k) => {
    const s = exam[k] || { total: 0, correct: 0, wrong: 0 };
    const attempted = s.correct + s.wrong;
    const score = s.correct * m.correct - s.wrong * m.wrong;
    return {
      key: k, total: s.total, correct: s.correct, wrong: s.wrong, attempted,
      unattempted: Math.max(0, s.total - attempted), score,
      accuracy: attempted ? (s.correct / attempted) * 100 : 0,
      scorePct: s.total ? (Math.max(0, score) / (s.total * m.correct)) * 100 : 0,
    };
  });
  const total = sum(secs, (s) => s.total);
  const correct = sum(secs, (s) => s.correct);
  const wrong = sum(secs, (s) => s.wrong);
  const attempted = correct + wrong;
  const score = correct * m.correct - wrong * m.wrong;
  const maxScore = total * m.correct;
  const attemptedSecs = secs.filter((s) => s.total > 0);
  const strongest = exam.submitted && attemptedSecs.length ? [...attemptedSecs].sort((a, b) => b.scorePct - a.scorePct)[0].key : null;
  const weakest = exam.submitted && attemptedSecs.length ? [...attemptedSecs].sort((a, b) => a.scorePct - b.scorePct)[0].key : null;
  let result = 'pending';
  if (exam.submitted) result = score >= exam.targetScore ? 'pass' : 'improve';
  return {
    secs, total, correct, wrong, attempted, unattempted: Math.max(0, total - attempted), score, maxScore,
    scorePct: maxScore ? (Math.max(0, score) / maxScore) * 100 : 0,
    accuracy: attempted ? (correct / attempted) * 100 : 0,
    strongest, weakest, result,
  };
}

/** how this exam compares with the previous submitted one */
export function examCompare(exams, exam) {
  const prev = exams.filter((e) => e.submitted && e.examNumber < exam.examNumber).sort((a, b) => b.examNumber - a.examNumber)[0];
  if (!prev) return null;
  const a = examMetrics(exam), b = examMetrics(prev);
  return { prev, scoreDelta: a.scorePct - b.scorePct, accuracyDelta: a.accuracy - b.accuracy };
}

/** topics to revise after an exam: what you flagged, plus topics from that week that need work */
export function examTopicsToRevise(exam, tasks, topics, today, targetAccuracy) {
  const out = new Set(exam.weakTopics || []);
  const weekTopicIds = new Set(tasks.filter((t) => t.week === exam.week).flatMap(taskTopics));
  topics.filter((t) => weekTopicIds.has(t.id)).forEach((tp) => {
    const s = topicStats(tp, tasks, today, targetAccuracy);
    if (s.needsRevision && s.reasons[0] !== 'Revision due') out.add(tp.name);
  });
  return [...out].slice(0, 8);
}

// ------------------------------------------------------------------ position in the plan
export function planPosition(weeks, today, settings) {
  if (!weeks.length) return { state: 'none' };
  const start = weeks[0].startDate;
  const end = weeks[weeks.length - 1].endDate;
  const totalDays = diffDays(end, start) + 1;
  const target = settings.targetEndDate || end;
  const daysRemaining = Math.max(0, diffDays(target, today));
  const base = { start, end, totalDays, target, daysRemaining, totalWeeks: weeks.length };
  if (today < start) return { ...base, state: 'before', daysToStart: diffDays(start, today) };
  if (today > end) return { ...base, state: 'after', dayNumber: totalDays, week: weeks[weeks.length - 1] };
  const week = weeks.find((w) => today >= w.startDate && today <= w.endDate);
  return { ...base, state: 'during', week, dayNumber: diffDays(today, start) + 1, weekDay: diffDays(today, week.startDate) + 1 };
}

/**
 * Study streak: consecutive days with at least one completed task (or a saved exam).
 * Days with nothing planned (rest / exam days) neither break nor extend the streak.
 */
export function streak(tasks, exams, today) {
  const active = new Set();
  const planned = new Set();
  tasks.forEach((t) => {
    planned.add(t.date);
    if (t.doneDate && (t.status === 'completed' || t.actualMinutes > 0)) active.add(t.doneDate);
  });
  exams.forEach((e) => { if (e.submitted) active.add(e.date); });
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const d = addDays(today, -i);
    if (active.has(d)) n++;
    else if (i === 0) continue; // today may not be done yet
    else if (!planned.has(d)) continue; // rest day
    else break;
  }
  return n;
}

// ------------------------------------------------------------------ chart series
export function dailySeries(tasks, dates) {
  return dates.map((date) => {
    const ts = tasks.filter((t) => (t.doneDate || t.date) === date && (t.actualMinutes > 0 || t.questionsSolved > 0));
    const solved = sum(ts, (t) => t.questionsSolved);
    const correct = sum(ts, (t) => t.correct);
    return { date, hours: round(sum(ts, (t) => t.actualMinutes) / 60, 2), solved, correct, accuracy: solved ? round((correct / solved) * 100, 1) : null };
  });
}

export function cumulativeQuestions(tasks, today) {
  const byDate = {};
  tasks.forEach((t) => {
    if (t.questionsSolved > 0) { const d = t.doneDate || t.date; byDate[d] = (byDate[d] || 0) + t.questionsSolved; }
  });
  const dates = Object.keys(byDate).sort();
  if (!dates.length) return [];
  const out = [];
  let run = 0;
  for (let d = dates[0]; diffDays(today, d) >= 0; d = addDays(d, 1)) {
    run += byDate[d] || 0;
    out.push({ date: d, total: run });
  }
  return out;
}
