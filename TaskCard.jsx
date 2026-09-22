import { useEffect, useState } from 'react';
import { Check, ChevronRight, Clock, ListChecks, Redo2, SkipForward, Trash2, Undo2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { taskAccuracy } from '../lib/stats.js';
import { fmtMinutes } from '../lib/dateUtils.js';
import { DIFFICULTIES } from '../lib/constants.js';
import { Btn, CheckField, Field, Modal, NumInput, SectionBadge, StatusBadge, TextArea, TextInput, useUI } from './ui.jsx';

export function TaskRow({ task, onOpen, showDate }) {
  const { actions } = useApp();
  const done = task.status === 'completed';
  const skipped = task.status === 'skipped';
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition ${skipped ? 'opacity-60' : ''}`}>
      <button
        type="button" aria-label={done ? 'Mark not completed' : 'Mark completed'} onClick={() => actions.toggleComplete(task.id)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition"
        style={{ borderColor: done ? 'var(--done)' : 'var(--line)', background: done ? 'var(--done)' : 'transparent', color: done ? 'var(--done-on, #fff)' : 'transparent' }}
      >
        {done && <Check size={18} />}
      </button>
      <button type="button" onClick={() => onOpen(task)} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-1.5">
          <SectionBadge section={task.section} />
          <span className={`truncate text-sm font-bold ${done ? 'line-through opacity-70' : ''}`}>{task.title}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          {showDate && <span>{task.date}</span>}
          <span className="inline-flex items-center gap-1"><Clock size={12} />{fmtMinutes(task.plannedMinutes)}</span>
          {task.questionsPlanned > 0 && <span className="inline-flex items-center gap-1"><ListChecks size={12} />{task.questionsPlanned} qs</span>}
          {task.status === 'in_progress' && <StatusBadge status="in_progress" />}
          {skipped && <StatusBadge status="skipped" />}
          {task.status === 'needs_revision' && <StatusBadge status="needs_revision" />}
        </div>
      </button>
      <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden="true" />
    </div>
  );
}

export function TaskEditModal({ task, onClose }) {
  const { actions } = useApp();
  const { toast, confirm } = useUI();
  const [t, setT] = useState(task);
  useEffect(() => { if (task) setT(task); }, [task]);
  if (!task || !t) return null;
  const acc = taskAccuracy(t);
  const patch = (p) => setT((x) => ({ ...x, ...p }));

  const save = () => {
    actions.updateTask(task.id, {
      actualMinutes: t.actualMinutes, questionsSolved: t.questionsSolved, correct: t.correct,
      notes: t.notes, mistakeReviewed: t.mistakeReviewed, status: t.status, revisionRequired: t.revisionRequired,
    });
    toast('Task updated.');
    onClose();
  };
  const skip = () => { actions.skipTask(task.id, t.skipReason || 'Skipped'); toast('Task skipped.'); onClose(); };
  const unskip = () => { actions.unskipTask(task.id); onClose(); };
  const del = async () => {
    if (!task.customPlan) { toast('Only custom tasks you added can be deleted — try skipping instead.', 'error'); return; }
    const ok = await confirm({ title: 'Delete this task?', message: 'This removes it from your plan for good.', danger: true, confirmLabel: 'Delete' });
    if (ok) { actions.deleteTask(task.id); toast('Task deleted.'); onClose(); }
  };

  return (
    <Modal open={!!task} onClose={onClose} title={task.title} size="md"
      footer={
        <>
          {task.customPlan && <Btn variant="danger" icon={Trash2} onClick={del}>Delete</Btn>}
          {task.status === 'skipped'
            ? <Btn variant="ghost" icon={Undo2} onClick={unskip}>Unskip</Btn>
            : <Btn variant="ghost" icon={SkipForward} onClick={skip}>Skip</Btn>}
          <Btn variant="primary" icon={Check} onClick={save}>Save</Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <SectionBadge section={task.section} />
          <StatusBadge status={t.status} />
          <span className="text-xs font-bold text-muted">{DIFFICULTIES[task.difficulty]} · Week {task.week}, Day {task.weekDay}</span>
        </div>
        {task.description && <p className="text-sm text-muted">{task.description}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Planned time" hint={fmtMinutes(task.plannedMinutes)}>
            <NumInput value={t.actualMinutes} onChange={(v) => patch({ actualMinutes: v })} min={0} />
          </Field>
          <Field label="Questions planned" hint={String(task.questionsPlanned)}>
            <NumInput value={t.questionsSolved} onChange={(v) => patch({ questionsSolved: v, correct: Math.min(t.correct, v) })} min={0} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Questions correct" hint={acc != null ? `${Math.round(acc)}% accuracy` : 'Enter questions solved first'}>
            <NumInput value={t.correct} onChange={(v) => patch({ correct: Math.min(v, t.questionsSolved) })} min={0} max={t.questionsSolved} />
          </Field>
          <Field label="Status">
            <select value={t.status} onChange={(e) => patch({ status: e.target.value })} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm">
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="needs_revision">Needs revision</option>
            </select>
          </Field>
        </div>

        <CheckField checked={t.mistakeReviewed} onChange={(v) => patch({ mistakeReviewed: v })}>
          I reviewed my mistakes for this task
        </CheckField>
        <CheckField checked={t.revisionRequired} onChange={(v) => patch({ revisionRequired: v })}>
          Flag this topic for revision
        </CheckField>

        <Field label="Notes">
          <TextArea value={t.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="Mistakes, tricky concepts, formulas to remember..." />
        </Field>

        {task.status !== 'skipped' && (
          <Field label="Skip reason (optional, used if you skip this task)">
            <TextInput value={t.skipReason} onChange={(e) => patch({ skipReason: e.target.value })} placeholder="e.g. ran out of time today" />
          </Field>
        )}
      </div>
    </Modal>
  );
}

export function useTaskModal() {
  const [task, setTask] = useState(null);
  return { openTask: task, onOpen: setTask, onClose: () => setTask(null) };
}
