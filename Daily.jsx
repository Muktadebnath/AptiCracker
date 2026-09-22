import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, ListChecks, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { go } from '../lib/router.js';
import { addDays, fmtFull, fmtMinutes, relativeDay, todayISO } from '../lib/dateUtils.js';
import { dayStats, round } from '../lib/stats.js';
import { CORE_SECTIONS, SECTIONS } from '../lib/constants.js';
import { Btn, Card, EmptyState, Field, Modal, NumInput, PageHeader, SelectInput, TextInput, useUI } from '../components/ui.jsx';
import { TaskEditModal, TaskRow, useTaskModal } from '../components/TaskCard.jsx';

function AddTaskModal({ open, onClose, date }) {
  const { data, actions } = useApp();
  const { toast } = useUI();
  const [f, setF] = useState({ title: '', section: 'quant', topicId: '', plannedMinutes: 30, questionsPlanned: 10, type: 'practice' });
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const topicsForSection = data.topics.filter((t) => t.section === f.section);

  const submit = () => {
    if (!f.title.trim()) { toast('Give the task a title first.', 'error'); return; }
    const topic = topicsForSection.find((t) => t.id === f.topicId);
    actions.addTask({
      title: f.title.trim(), section: f.section, topicId: f.topicId || null, type: f.type, date,
      plannedMinutes: f.plannedMinutes, questionsPlanned: f.questionsPlanned,
      topicName: topic?.name || SECTIONS[f.section].label, description: '',
    });
    toast('Task added.');
    setF({ title: '', section: 'quant', topicId: '', plannedMinutes: 30, questionsPlanned: 10, type: 'practice' });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Add task · ${fmtFull(date)}`}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={submit}>Add task</Btn></>}
    >
      <div className="space-y-3">
        <Field label="Title"><TextInput value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Extra practice: Time & Work" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Section">
            <SelectInput value={f.section} onChange={(e) => set({ section: e.target.value, topicId: '' })}>
              {CORE_SECTIONS.map((k) => <option key={k} value={k}>{SECTIONS[k].label}</option>)}
              <option value="mixed">Mixed & Tests</option>
            </SelectInput>
          </Field>
          <Field label="Topic (optional)">
            <SelectInput value={f.topicId} onChange={(e) => set({ topicId: e.target.value })}>
              <option value="">General</option>
              {topicsForSection.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </SelectInput>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Planned minutes"><NumInput value={f.plannedMinutes} onChange={(v) => set({ plannedMinutes: v })} min={5} step={5} /></Field>
          <Field label="Questions planned"><NumInput value={f.questionsPlanned} onChange={(v) => set({ questionsPlanned: v })} min={0} /></Field>
        </div>
      </div>
    </Modal>
  );
}

export default function Daily({ params }) {
  const { data, today, actions } = useApp();
  const { openTask, onOpen, onClose } = useTaskModal();
  const [addOpen, setAddOpen] = useState(false);
  const date = params?.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;

  const dayTasks = useMemo(() => data.tasks.filter((t) => t.date === date).sort((a, b) => a.order - b.order), [data.tasks, date]);
  const overdue = useMemo(
    () => (date === today ? data.tasks.filter((t) => t.date < today && (t.status === 'not_started' || t.status === 'in_progress')) : []),
    [data.tasks, date, today],
  );
  const stats = dayStats(data.tasks, date, today);

  const nav = (d) => go('daily', { date: addDays(date, d) });
  const moveOverdue = () => { actions.moveToToday(overdue.map((t) => t.id)); };

  return (
    <>
      <PageHeader
        title="Daily tracker"
        subtitle={fmtFull(date)}
        actions={
          <div className="flex items-center gap-2">
            <Btn variant="ghost" size="sm" icon={ChevronLeft} onClick={() => nav(-1)} aria-label="Previous day" />
            {date !== today && <Btn variant="soft" size="sm" onClick={() => go('daily')}>Today</Btn>}
            <Btn variant="ghost" size="sm" icon={ChevronRight} onClick={() => nav(1)} aria-label="Next day" />
            <Btn variant="primary" size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add task</Btn>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3.5" style={{ background: 'var(--done-soft)', color: 'var(--done-ink)' }}>
          <div className="text-xs font-bold opacity-90">Completed</div>
          <div className="font-display text-2xl font-extrabold">{stats.completed}/{stats.total}</div>
        </div>
        <div className="rounded-2xl p-3.5" style={{ background: 'var(--progress-soft)', color: 'var(--progress-ink)' }}>
          <div className="flex items-center gap-1 text-xs font-bold opacity-90"><Clock size={12} />Time</div>
          <div className="font-display text-2xl font-extrabold">{fmtMinutes(stats.actualMinutes)}</div>
          <div className="text-xs opacity-80">of {fmtMinutes(stats.plannedMinutes)} planned</div>
        </div>
        <div className="rounded-2xl p-3.5" style={{ background: 'var(--verbal-soft)', color: 'var(--verbal-ink)' }}>
          <div className="flex items-center gap-1 text-xs font-bold opacity-90"><ListChecks size={12} />Day progress</div>
          <div className="font-display text-2xl font-extrabold">{round(stats.pct)}%</div>
        </div>
      </div>

      {overdue.length > 0 && (
        <Card className="mb-4" style={{ background: 'var(--overdue-soft)', borderColor: 'transparent' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--overdue-ink)' }}>
              <AlertTriangle size={16} aria-hidden="true" /> {overdue.length} overdue {overdue.length === 1 ? 'task' : 'tasks'} from earlier days
            </p>
            <Btn size="sm" variant="primary" onClick={moveOverdue}>Move to today</Btn>
          </div>
        </Card>
      )}

      <Card>
        {dayTasks.length ? (
          <div className="space-y-2">{dayTasks.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} />)}</div>
        ) : (
          <EmptyState
            title={date === today ? 'Nothing planned for today' : `Nothing planned for ${relativeDay(date, today)}`}
            text="This might be a rest day, or you can add a custom task."
            action={<Btn variant="soft" icon={Plus} onClick={() => setAddOpen(true)}>Add task</Btn>}
          />
        )}
      </Card>

      <TaskEditModal task={openTask} onClose={onClose} />
      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} date={date} />
    </>
  );
}
