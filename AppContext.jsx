import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DATA_VERSION, DEFAULT_SETTINGS } from '../lib/constants.js';
import { todayISO } from '../lib/dateUtils.js';
import { generatePlan, placeTask, uid } from '../lib/planGenerator.js';
import { applySettings } from '../lib/settingsLogic.js';
import { createSampleData } from '../lib/sample.js';
import { loadData, saveData } from '../lib/storage.js';
import { makeDefaultTopics } from '../lib/topics.js';
import { overall, planPosition, questionStats, streak, studyMinutes, topicStats } from '../lib/stats.js';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const NUM_FIELDS = ['plannedMinutes', 'actualMinutes', 'questionsPlanned', 'questionsSolved', 'correct'];

/** Apply an edit to one task and keep related fields consistent (status, dates, correct <= solved). */
function patchTask(t, patch, today, weeks) {
  const n = { ...t, ...patch };
  NUM_FIELDS.forEach((k) => { if (k in patch) n[k] = Math.max(0, Math.floor(Number(patch[k]) || 0)); });
  if (n.correct > n.questionsSolved) n.correct = n.questionsSolved;

  if ('date' in patch && patch.date && patch.date !== t.date) Object.assign(n, placeTask(weeks, patch.date));

  if ('status' in patch) {
    if (patch.status === 'completed') {
      n.doneDate = n.doneDate || today;
      if (!n.actualMinutes) n.actualMinutes = n.plannedMinutes;
    }
    if (patch.status === 'needs_revision') {
      n.revisionRequired = true;
      n.doneDate = n.doneDate || today;
    }
    if (patch.status === 'not_started' && !n.actualMinutes) n.doneDate = '';
    if (patch.status !== 'skipped' && t.status === 'skipped') n.skipReason = '';
  } else {
    if ('revisionRequired' in patch && !patch.revisionRequired && n.status === 'needs_revision') n.status = 'in_progress';
    if (n.status === 'not_started' && (n.actualMinutes > 0 || n.questionsSolved > 0)) {
      n.status = 'in_progress';
      n.doneDate = n.doneDate || today;
    }
  }
  return n;
}

const freshData = (data, keepPrefs = true) => {
  const s = keepPrefs ? data.settings : DEFAULT_SETTINGS;
  return { name: s.name, accent: s.accent, mode: s.mode };
};

export function AppProvider({ children }) {
  const [data, setData] = useState(() => loadData() || createSampleData(todayISO()));
  const [today, setToday] = useState(todayISO);
  const [saveState, setSaveState] = useState('saved'); // saved | saving | error
  const ref = useRef({ data, today });
  ref.current = { data, today };

  // roll over at midnight
  useEffect(() => {
    const id = setInterval(() => setToday((t) => { const n = todayISO(); return n === t ? t : n; }), 30000);
    return () => clearInterval(id);
  }, []);

  // save to localStorage a moment after every change (and once more when the tab is hidden or closed)
  useEffect(() => {
    setSaveState('saving');
    const id = setTimeout(() => setSaveState(saveData(data) ? 'saved' : 'error'), 250);
    return () => clearTimeout(id);
  }, [data]);
  useEffect(() => {
    const flush = () => saveData(ref.current.data);
    const onVis = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // theme
  const { mode, accent } = data.settings;
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const apply = () => root.classList.toggle('dark', mode === 'dark' || (mode === 'auto' && !!mq?.matches));
    apply();
    root.dataset.accent = accent || 'coral';
    if (mode === 'auto' && mq?.addEventListener) { mq.addEventListener('change', apply); return () => mq.removeEventListener('change', apply); }
  }, [mode, accent]);

  const actions = useMemo(() => {
    const set = (fn) => setData((d) => fn(d));
    const mapTask = (id, fn) => set((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? fn(t, d) : t)) }));
    return {
      // ---------- tasks ----------
      updateTask: (id, patch) => mapTask(id, (t, d) => patchTask(t, patch, ref.current.today, d.weeks)),
      toggleComplete: (id) =>
        mapTask(id, (t, d) => patchTask(t, { status: t.status === 'completed' ? (t.actualMinutes > 0 ? 'in_progress' : 'not_started') : 'completed' }, ref.current.today, d.weeks)),
      skipTask: (id, reason) => mapTask(id, (t, d) => patchTask(t, { status: 'skipped', skipReason: reason }, ref.current.today, d.weeks)),
      unskipTask: (id) => mapTask(id, (t, d) => patchTask(t, { status: 'not_started' }, ref.current.today, d.weeks)),
      addTask: (task) =>
        set((d) => {
          const topic = d.topics.find((x) => x.id === task.topicId);
          const t = {
            id: uid('t'), order: 999, type: 'custom', title: 'New task', description: '', section: topic?.section || 'mixed',
            topicId: task.topicId || null, topicIds: task.topicId ? [task.topicId] : [], topicName: topic?.name || 'General',
            plannedMinutes: 30, actualMinutes: 0, questionsPlanned: 0, questionsSolved: 0, correct: 0,
            status: 'not_started', difficulty: 'medium', notes: '', mistakeReviewed: false, revisionRequired: false,
            skipReason: '', doneDate: '', customPlan: true, ...task, ...placeTask(d.weeks, task.date),
          };
          return { ...d, tasks: [...d.tasks, t] };
        }),
      deleteTask: (id) => set((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })),
      moveToToday: (ids) =>
        set((d) => ({
          ...d,
          tasks: d.tasks.map((t) => (ids.includes(t.id) ? { ...t, ...placeTask(d.weeks, ref.current.today), date: ref.current.today, customPlan: true } : t)),
        })),

      // ---------- topics ----------
      updateTopic: (id, patch) =>
        set((d) => {
          const old = d.topics.find((t) => t.id === id);
          const renamed = patch.name && old && patch.name !== old.name;
          return {
            ...d,
            topics: d.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)),
            tasks: renamed
              ? d.tasks.map((t) => {
                  if (!(t.topicIds || []).includes(id)) return t;
                  const r = (s) => (s || '').split(old.name).join(patch.name);
                  return { ...t, title: r(t.title), description: r(t.description), topicName: r(t.topicName) };
                })
              : d.tasks,
          };
        }),
      addTopic: ({ section, name }) => {
        const id = uid(section[0]);
        set((d) => ({ ...d, topics: [...d.topics, { id, section, name: name.trim(), confidence: 3, notes: '', nextRevision: '' }] }));
        return id;
      },
      removeTopic: (id) =>
        set((d) => ({
          ...d,
          topics: d.topics.filter((t) => t.id !== id),
          // untouched tasks that were only about this topic are removed; everything else keeps its history
          tasks: d.tasks
            .filter((t) => !(t.status === 'not_started' && (t.topicIds || []).length === 1 && t.topicIds[0] === id))
            .map((t) => ((t.topicIds || []).includes(id) ? { ...t, topicIds: t.topicIds.filter((x) => x !== id), topicId: t.topicId === id ? null : t.topicId } : t)),
        })),

      // ---------- exams ----------
      saveExam: (id, patch) => set((d) => ({ ...d, exams: d.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

      // ---------- settings and plan ----------
      saveSettings: (next) => {
        const r = applySettings(ref.current.data, next, ref.current.today);
        setData(r.data);
        return r.notes;
      },
      setPrefs: (patch) => set((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      regeneratePlan: () =>
        set((d) => {
          const settings = d.meta?.isSample ? { ...d.settings, ...d.meta.realSettings } : d.settings;
          const topics = d.meta?.isSample ? makeDefaultTopics() : d.topics;
          return { ...d, settings, topics, ...generatePlan(settings, topics), meta: { isSample: false, createdAt: ref.current.today } };
        }),
      clearSample: () =>
        set((d) => {
          const settings = { ...d.settings, ...d.meta.realSettings };
          const topics = makeDefaultTopics();
          return { version: DATA_VERSION, settings, topics, ...generatePlan(settings, topics), meta: { isSample: false, createdAt: ref.current.today } };
        }),
      loadSample: () => set((d) => createSampleData(ref.current.today, freshData(d))),
      factoryReset: () => set(() => createSampleData(ref.current.today)),
      importData: (next) => set(() => next),
    };
  }, []);

  const derived = useMemo(() => {
    const { tasks, exams, weeks, topics, settings } = data;
    return {
      overall: overall(tasks, today),
      position: planPosition(weeks, today, settings),
      streak: streak(tasks, exams, today),
      questions: questionStats(tasks),
      minutes: studyMinutes(tasks),
      topicList: topics.map((topic) => ({ topic, ...topicStats(topic, tasks, today, settings.targetAccuracy) })),
    };
  }, [data, today]);

  const value = useMemo(() => ({ data, today, actions, derived, saveState }), [data, today, actions, derived, saveState]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

