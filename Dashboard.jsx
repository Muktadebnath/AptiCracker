import { CalendarClock, Flame, ListChecks, Plus, Target, TrendingUp, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { go } from '../lib/router.js';
import { fmtFull, fmtMinutes, relativeDay } from '../lib/dateUtils.js';
import { round, sectionStats } from '../lib/stats.js';
import { CORE_SECTIONS, SECTIONS } from '../lib/constants.js';
import { Btn, Card, EmptyState, PageHeader, ProgressBar, Stat } from '../components/ui.jsx';
import { Donut } from '../components/charts.jsx';
import { TaskEditModal, TaskRow, useTaskModal } from '../components/TaskCard.jsx';

export default function Dashboard() {
  const { data, today, derived } = useApp();
  const { tasks, exams, settings } = data;
  const { openTask, onOpen, onClose } = useTaskModal();
  const { overall, position, streak, questions, minutes } = derived;

  const todays = tasks.filter((t) => t.date === today).sort((a, b) => a.order - b.order);
  const upcoming = tasks
    .filter((t) => t.date > today && t.status === 'not_started')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const nextExam = exams.filter((e) => !e.submitted && e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];

  const greeting = position.state === 'before'
    ? `Your plan starts ${relativeDay(position.start, today)}.`
    : position.state === 'after'
      ? 'Your 12 weeks are complete — great work! Keep revising to stay sharp.'
      : `Day ${position.dayNumber} of ${position.totalDays} · Week ${position.week.week} of ${position.totalWeeks}`;

  return (
    <>
      <PageHeader
        title={`Hey, ${settings.name}`}
        subtitle={greeting}
        actions={<Btn variant="primary" icon={Plus} onClick={() => go('daily')}>Go to today</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Target} label="Overall progress" value={`${round(overall.pct)}%`} sub={`${overall.completed}/${overall.total} tasks`} tone="done" />
        <Stat icon={Flame} label="Study streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} sub={streak > 0 ? 'keep it going' : 'start today'} tone="exam" />
        <Stat icon={ListChecks} label="Questions solved" value={questions.solved} sub={questions.accuracy != null ? `${round(questions.accuracy)}% accuracy` : 'no data yet'} tone="progress" />
        <Stat icon={CalendarClock} label="Time studied" value={fmtMinutes(minutes)} sub="total logged" tone="verbal" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">Today · {fmtFull(today)}</h2>
            <Btn size="sm" variant="ghost" onClick={() => go('daily')}>Open daily tracker</Btn>
          </div>
          {todays.length ? (
            <div className="space-y-2">
              {todays.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} />)}
            </div>
          ) : (
            <EmptyState title="Nothing scheduled today" text="Enjoy the rest, or jump ahead and pull a task from tomorrow in the Daily tracker." tone="mixed" />
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Progress breakdown</h2>
          <Donut
            center={`${round(overall.pct)}%`} sub={`${overall.completed} of ${overall.total}`}
            data={[
              { name: 'Completed', value: overall.completed, tone: 'done' },
              { name: 'In progress / pending', value: overall.pending, tone: 'pending' },
              { name: 'Needs revision', value: overall.revision, tone: 'revise' },
              { name: 'Overdue', value: overall.overdue, tone: 'overdue' },
              { name: 'Skipped', value: overall.skipped, tone: 'skip' },
            ]}
          />
          <div className="mt-4 space-y-1.5 text-xs font-semibold">
            {[
              ['Completed', overall.completed, 'done'], ['Pending', overall.pending, 'pending'],
              ['Needs revision', overall.revision, 'revise'], ['Overdue', overall.overdue, 'overdue'], ['Skipped', overall.skipped, 'skip'],
            ].map(([label, val, tone]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full" style={{ background: `var(--${tone})` }} />{label}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-extrabold">Section-wise progress</h2>
          <div className="space-y-4">
            {CORE_SECTIONS.map((key) => {
              const s = sectionStats(tasks, today, key);
              const meta = SECTIONS[key];
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm font-bold">
                    <span>{meta.label}</span>
                    <span className="text-muted">{s.completed}/{s.total} · {round(s.pct)}%</span>
                  </div>
                  <ProgressBar value={s.pct} tone={meta.tone} label={meta.label} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">Next exam</h2>
            <Trophy size={18} className="text-muted" aria-hidden="true" />
          </div>
          {nextExam ? (
            <div>
              <div className="text-sm font-bold">Week {nextExam.week} exam</div>
              <div className="text-xs text-muted">{fmtFull(nextExam.date)} · {relativeDay(nextExam.date, today)}</div>
              <div className="mt-3 flex gap-2 text-xs font-bold">
                <span className="rounded-full px-2.5 py-1" style={{ background: 'var(--quant-soft)', color: 'var(--quant-ink)' }}>{nextExam.quant.total} Quant</span>
                <span className="rounded-full px-2.5 py-1" style={{ background: 'var(--logic-soft)', color: 'var(--logic-ink)' }}>{nextExam.logical.total} Logical</span>
                <span className="rounded-full px-2.5 py-1" style={{ background: 'var(--verbal-soft)', color: 'var(--verbal-ink)' }}>{nextExam.verbal.total} Verbal</span>
              </div>
              <Btn size="sm" variant="soft" className="mt-3" icon={TrendingUp} onClick={() => go('exams')}>View exams</Btn>
            </div>
          ) : (
            <p className="text-sm text-muted">No upcoming exam scheduled.</p>
          )}

          {upcoming.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">Coming up</h3>
              <ul className="space-y-1.5 text-xs">
                {upcoming.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{t.title}</span>
                    <span className="shrink-0 text-muted">{relativeDay(t.date, today)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <TaskEditModal task={openTask} onClose={onClose} />
    </>
  );
}
