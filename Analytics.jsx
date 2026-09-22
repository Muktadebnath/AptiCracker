import { useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { dateRange, fmtDate } from '../lib/dateUtils.js';
import { cumulativeQuestions, dailySeries, examMetrics, round, sectionStats } from '../lib/stats.js';
import { CORE_SECTIONS, SECTIONS } from '../lib/constants.js';
import { Card, PageHeader, ProgressBar } from '../components/ui.jsx';
import { Donut, TrendArea, TrendBar, TrendLine } from '../components/charts.jsx';

export default function Analytics() {
  const { data, today } = useApp();
  const { tasks, exams, topics, settings } = data;

  const last14 = useMemo(() => dateRange(today, 14), [today]);
  const series = useMemo(() => dailySeries(tasks, last14).map((d) => ({ ...d, x: fmtDate(d.date) })), [tasks, last14]);
  const cumulative = useMemo(() => cumulativeQuestions(tasks, today).map((d) => ({ ...d, x: fmtDate(d.date) })), [tasks, today]);

  const examSeries = useMemo(
    () => exams.filter((e) => e.submitted).map((e) => { const m = examMetrics(e); return { x: `W${e.week}`, score: round(m.scorePct, 1), accuracy: round(m.accuracy, 1) }; }),
    [exams],
  );

  const topicDonut = useMemo(() => {
    const buckets = { completed: 0, in_progress: 0, needs_revision: 0, not_started: 0, not_scheduled: 0 };
    topics.forEach((t) => {
      const ts = tasks.filter((task) => (task.topicIds || []).includes(t.id));
      if (!ts.length) { buckets.not_scheduled++; return; }
      if (ts.some((x) => x.status === 'needs_revision' || x.revisionRequired)) buckets.needs_revision++;
      else if (ts.every((x) => x.status === 'completed')) buckets.completed++;
      else if (ts.some((x) => x.status === 'completed' || x.actualMinutes > 0)) buckets.in_progress++;
      else buckets.not_started++;
    });
    return buckets;
  }, [topics, tasks]);

  return (
    <>
      <PageHeader title="Progress analytics" subtitle="How your prep is trending across the last two weeks and across every exam." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Daily study hours (last 14 days)</h2>
          <TrendBar data={series} dataKey="hours" name="Hours" tone="progress" fmt={(v) => `${v}h`} unit="h" />
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Questions solved (last 14 days)</h2>
          <TrendLine data={series} lines={[{ key: 'solved', name: 'Solved', tone: 'quant' }, { key: 'correct', name: 'Correct', tone: 'done' }]} />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Cumulative questions solved</h2>
          <TrendArea data={cumulative} dataKey="total" name="Total solved" tone="verbal" />
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Exam score & accuracy trend</h2>
          {examSeries.length ? (
            <TrendLine data={examSeries} lines={[{ key: 'score', name: 'Score %', tone: 'exam' }, { key: 'accuracy', name: 'Accuracy %', tone: 'progress' }]} fmt={(v) => `${v}%`} unit="%" />
          ) : (
            <div className="flex h-[220px] items-center justify-center text-xs font-semibold text-muted">Submit your first weekly exam to see a trend here.</div>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Topic-wise completion</h2>
          <Donut
            center={topics.length ? `${topicDonut.completed}/${topics.length}` : '0'} sub="topics complete"
            data={[
              { name: 'Completed', value: topicDonut.completed, tone: 'done' },
              { name: 'In progress', value: topicDonut.in_progress, tone: 'progress' },
              { name: 'Needs revision', value: topicDonut.needs_revision, tone: 'revise' },
              { name: 'Not started', value: topicDonut.not_started, tone: 'pending' },
              { name: 'Not scheduled', value: topicDonut.not_scheduled, tone: 'mixed' },
            ]}
          />
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Accuracy by section</h2>
          <div className="space-y-4">
            {CORE_SECTIONS.map((key) => {
              const s = sectionStats(tasks, today, key);
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm font-bold">
                    <span>{SECTIONS[key].label}</span>
                    <span className="text-muted">{s.accuracy != null ? `${round(s.accuracy)}%` : '—'} · {s.solved} solved</span>
                  </div>
                  <ProgressBar value={s.accuracy || 0} tone={SECTIONS[key].tone} label={`${SECTIONS[key].label} accuracy`} />
                </div>
              );
            })}
            <p className="text-xs text-muted">Target accuracy: {settings.targetAccuracy}%</p>
          </div>
        </Card>
      </div>
    </>
  );
}
