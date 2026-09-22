import { generatePlan, moveExamDates, retimeTasks, shiftPlan } from './planGenerator.js';
import { diffDays } from './dateUtils.js';

export const hasProgress = (data) =>
  data.tasks.some((t) => t.status !== 'not_started' || t.actualMinutes > 0) || data.exams.some((e) => e.submitted);

/** what would saving these settings do to the existing plan? (used to ask before erasing progress) */
export function settingsImpact(data, next) {
  const prev = data.settings;
  if (data.meta?.isSample) return { regenerate: false, erases: false, shift: false };
  const restChanged = !!next.sundayRest !== !!prev.sundayRest;
  const startChanged = next.startDate !== prev.startDate;
  const progress = hasProgress(data);
  const regenerate = restChanged || (startChanged && !progress);
  return { regenerate, erases: regenerate && progress, shift: startChanged && !regenerate };
}

/**
 * Apply edited settings to the data.
 *  - Start date change, no progress yet -> plan is regenerated
 *  - Start date change, progress exists -> every date shifts by the same number of days
 *  - Sunday rest day toggled -> plan is regenerated (structure changes)
 *  - Exam day changed -> exams without results move to the new weekday
 *  - Daily hours, questions per day or time split changed -> upcoming untouched tasks are rescaled
 */
export function applySettings(data, next, today) {
  const prev = data.settings;
  const notes = [];

  if (data.meta?.isSample) {
    const { startDate, examDay, sundayRest, ...rest } = next;
    const settings = { ...prev, ...rest };
    return {
      data: {
        ...data,
        settings,
        tasks: retimeTasks(data.tasks, settings, today),
        meta: { ...data.meta, realSettings: { startDate, examDay, sundayRest } },
      },
      notes: ['Saved. Start date, exam day and rest-day choices apply when you clear the sample data.'],
    };
  }

  const impact = settingsImpact(data, next);
  let d = { ...data, settings: next };

  if (impact.regenerate) {
    const plan = generatePlan(next, d.topics);
    d = { ...d, ...plan };
    notes.push('Plan regenerated from your new settings.');
  } else {
    if (next.startDate !== prev.startDate) {
      d = shiftPlan(d, diffDays(next.startDate, prev.startDate));
      notes.push('All plan dates shifted to the new start date.');
    }
    if (next.examDay !== prev.examDay) {
      d = moveExamDates(d, next.examDay);
      notes.push('Upcoming exams moved to the new exam day.');
    }
    const timingChanged =
      next.dailyMinutes !== prev.dailyMinutes || next.questionsPerDay !== prev.questionsPerDay || JSON.stringify(next.split) !== JSON.stringify(prev.split);
    if (timingChanged) {
      d = { ...d, tasks: retimeTasks(d.tasks, next, today) };
      notes.push('Upcoming tasks rescaled to your new daily target.');
    }
  }
  // exams that have no result yet follow the current marking scheme; finished exams keep the one they were scored with
  d = { ...d, exams: d.exams.map((e) => (e.submitted ? e : { ...e, marking: { ...next.marking } })) };
  return { data: d, notes: notes.length ? notes : ['Settings saved.'] };
}
