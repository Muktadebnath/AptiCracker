import { useMemo, useState } from 'react';
import { ChevronDown, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { go } from '../lib/router.js';
import { fmtDate, fmtYear } from '../lib/dateUtils.js';
import { round, weekStats, WEEK_STATUS } from '../lib/stats.js';
import { PHASES } from '../lib/constants.js';
import { Badge, Card, PageHeader, ProgressBar, cx } from '../components/ui.jsx';
import { TaskEditModal, TaskRow, useTaskModal } from '../components/TaskCard.jsx';

function WeekCard({ week, tasks, exams, today, defaultOpen, onOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const stats = weekStats(week, tasks, exams, today);
  const phase = PHASES[week.phase];
  const ws = WEEK_STATUS[stats.status];
  const days = useMemo(() => {
    const byDate = {};
    tasks.filter((t) => t.week === week.week).forEach((t) => { (byDate[t.date] ||= []).push(t); });
    return Object.keys(byDate).sort().map((date) => ({ date, tasks: byDate[date].sort((a, b) => a.order - b.order) }));
  }, [tasks, week.week]);

  return (
    <Card className="overflow-hidden !p-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={open}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-lg font-extrabold" style={{ background: `var(--${phase.tone}-soft)`, color: `var(--${phase.tone}-ink)` }}>
            {week.week}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate font-bold">{week.title}</span>
              <Badge tone={ws.tone}>{ws.label}</Badge>
            </div>
            <div className="text-xs text-muted">{fmtDate(week.startDate)} – {fmtYear(week.endDate)} · {phase.label}</div>
          </div>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="w-32"><ProgressBar value={stats.pct} tone={ws.tone === 'mixed' ? 'accent' : ws.tone} label={`Week ${week.week} progress`} /></div>
          <span className="w-12 text-right text-sm font-bold">{round(stats.pct)}%</span>
        </div>
        <ChevronDown size={18} className={cx('shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="space-y-4 border-t border-line px-4 pb-4 pt-3">
          <p className="text-sm text-muted">{week.focus}</p>
          {stats.exam && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3" style={{ background: 'var(--exam-soft)', color: 'var(--exam-ink)' }}>
              <span className="flex items-center gap-2 text-sm font-bold"><Trophy size={16} aria-hidden="true" /> Week {week.week} exam · {fmtDate(week.examDate)}</span>
              <button type="button" onClick={() => go('exams')} className="text-xs font-extrabold underline underline-offset-2">
                {stats.exam.submitted ? 'View result' : 'Go to exam'}
              </button>
            </div>
          )}
          {days.map((d) => (
            <div key={d.date}>
              <div className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">{fmtDate(d.date)}{d.date === today ? ' · Today' : ''}</div>
              <div className="space-y-2">{d.tasks.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} />)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function Plan() {
  const { data, today } = useApp();
  const { openTask, onOpen, onClose } = useTaskModal();
  const currentWeek = data.weeks.find((w) => today >= w.startDate && today <= w.endDate)?.week;

  return (
    <>
      <PageHeader title="3-month plan" subtitle="12 weeks, four phases: foundation, intermediate, advanced, then revision & exam practice." />
      <div className="space-y-3">
        {data.weeks.map((w) => (
          <WeekCard key={w.week} week={w} tasks={data.tasks} exams={data.exams} today={today} defaultOpen={w.week === currentWeek} onOpen={onOpen} />
        ))}
      </div>
      <TaskEditModal task={openTask} onClose={onClose} />
    </>
  );
}
