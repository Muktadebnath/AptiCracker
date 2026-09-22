import { useMemo, useState } from 'react';
import { ChevronDown, Trophy, TrendingDown, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { fmtFull, relativeDay } from '../lib/dateUtils.js';
import { examCompare, examMetrics, examTopicsToRevise, round } from '../lib/stats.js';
import { SECTIONS } from '../lib/constants.js';
import { Badge, Btn, Card, CheckField, Field, NumInput, PageHeader, ProgressBar, SelectInput, TextArea, cx, useUI } from '../components/ui.jsx';

const SECS = ['quant', 'logical', 'verbal'];

function ScoreEntry({ exam, onSave }) {
  const { data } = useApp();
  const [f, setF] = useState(() => ({
    quant: { ...exam.quant }, logical: { ...exam.logical }, verbal: { ...exam.verbal },
    timeTaken: exam.timeTaken || 0, weakTopics: exam.weakTopics || [], reviewDone: exam.reviewDone || false, notes: exam.notes || '',
  }));
  const setSec = (k, patch) => setF((x) => ({ ...x, [k]: { ...x[k], ...patch, correct: Math.min(patch.correct ?? x[k].correct, x[k].total - (patch.wrong ?? x[k].wrong)) } }));
  const weekTopics = data.topics.filter((t) => data.tasks.some((task) => task.week === exam.week && (task.topicIds || []).includes(t.id)));
  const toggleTopic = (name) => setF((x) => ({ ...x, weakTopics: x.weakTopics.includes(name) ? x.weakTopics.filter((n) => n !== name) : [...x.weakTopics, name] }));

  return (
    <div className="space-y-4">
      {SECS.map((k) => (
        <div key={k} className="grid grid-cols-3 items-end gap-3">
          <div>
            <div className="text-xs font-extrabold" style={{ color: `var(--${SECTIONS[k].tone}-ink)` }}>{SECTIONS[k].label}</div>
            <div className="text-xs text-muted">{f[k].total} questions</div>
          </div>
          <Field label="Correct"><NumInput value={f[k].correct} onChange={(v) => setSec(k, { correct: v })} min={0} max={f[k].total} /></Field>
          <Field label="Wrong"><NumInput value={f[k].wrong} onChange={(v) => setSec(k, { wrong: v })} min={0} max={f[k].total} /></Field>
        </div>
      ))}
      <Field label="Time taken (minutes)"><NumInput value={f.timeTaken} onChange={(v) => setF((x) => ({ ...x, timeTaken: v }))} min={0} /></Field>

      {weekTopics.length > 0 && (
        <Field label="Topics you got wrong / feel weak on" hint="Select any that apply">
          <div className="flex flex-wrap gap-1.5">
            {weekTopics.map((t) => (
              <button key={t.id} type="button" onClick={() => toggleTopic(t.name)}
                className={cx('rounded-full border px-2.5 py-1 text-xs font-bold transition', f.weakTopics.includes(t.name) ? 'border-transparent bg-accent text-accent-on' : 'border-line text-muted hover:text-ink')}>
                {t.name}
              </button>
            ))}
          </div>
        </Field>
      )}
      <CheckField checked={f.reviewDone} onChange={(v) => setF((x) => ({ ...x, reviewDone: v }))}>I've reviewed all my mistakes for this exam</CheckField>
      <Field label="Notes"><TextArea value={f.notes} onChange={(e) => setF((x) => ({ ...x, notes: e.target.value }))} placeholder="How did it feel? Time management issues?" /></Field>
      <Btn variant="primary" onClick={() => onSave({ ...f, submitted: true })}>Submit result</Btn>
    </div>
  );
}

function ExamResult({ exam }) {
  const { data, today } = useApp();
  const m = examMetrics(exam);
  const cmp = examCompare(data.exams, exam);
  const toRevise = examTopicsToRevise(exam, data.tasks, data.topics, today, data.settings.targetAccuracy);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-3">
        <div className="rounded-2xl p-3" style={{ background: 'var(--done-soft)', color: 'var(--done-ink)' }}>
          <div className="text-xs font-bold opacity-90">Score</div>
          <div className="font-display text-xl font-extrabold">{m.score}/{m.maxScore}</div>
        </div>
        <div className="rounded-2xl p-3" style={{ background: 'var(--progress-soft)', color: 'var(--progress-ink)' }}>
          <div className="text-xs font-bold opacity-90">Accuracy</div>
          <div className="font-display text-xl font-extrabold">{round(m.accuracy)}%</div>
        </div>
        <div className="rounded-2xl p-3" style={{ background: m.result === 'pass' ? 'var(--done-soft)' : 'var(--pending-soft)', color: m.result === 'pass' ? 'var(--done-ink)' : 'var(--pending-ink)' }}>
          <div className="text-xs font-bold opacity-90">Target</div>
          <div className="font-display text-xl font-extrabold">{m.result === 'pass' ? 'Hit' : 'Below'}</div>
        </div>
      </div>

      {cmp && (
        <div className="flex items-center gap-2 text-sm font-semibold">
          {cmp.scoreDelta >= 0 ? <TrendingUp size={16} style={{ color: 'var(--done)' }} /> : <TrendingDown size={16} style={{ color: 'var(--overdue)' }} />}
          {cmp.scoreDelta >= 0 ? 'Up' : 'Down'} {Math.abs(round(cmp.scoreDelta))} pts vs Week {cmp.prev.week} exam
        </div>
      )}

      <div className="space-y-2.5">
        {m.secs.filter((s) => s.total > 0).map((s) => (
          <div key={s.key}>
            <div className="mb-1 flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                {SECTIONS[s.key].label}
                {m.strongest === s.key && <Badge tone="done">Strongest</Badge>}
                {m.weakest === s.key && <Badge tone="revise">Weakest</Badge>}
              </span>
              <span className="text-muted">{s.correct} correct · {s.wrong} wrong · {s.unattempted} skipped</span>
            </div>
            <ProgressBar value={s.scorePct} tone={SECTIONS[s.key].tone} label={SECTIONS[s.key].label} />
          </div>
        ))}
      </div>

      {toRevise.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">Revise before next week</div>
          <div className="flex flex-wrap gap-1.5">{toRevise.map((n) => <Badge key={n} tone="revise">{n}</Badge>)}</div>
        </div>
      )}
      {exam.notes && <p className="rounded-2xl bg-surface2 p-3 text-sm text-muted">{exam.notes}</p>}
    </div>
  );
}

function ExamCard({ exam, defaultOpen }) {
  const { today, actions } = useApp();
  const { toast } = useUI();
  const [open, setOpen] = useState(defaultOpen);
  const status = exam.submitted ? 'Submitted' : exam.date < today ? 'Missed — enter your score' : relativeDay(exam.date, today);
  const tone = exam.submitted ? 'done' : exam.date < today ? 'overdue' : 'exam';

  return (
    <Card className="overflow-hidden !p-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={open}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: `var(--${tone}-soft)`, color: `var(--${tone}-ink)` }}>
            <Trophy size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="font-bold">Week {exam.week} exam</div>
            <div className="text-xs text-muted">{fmtFull(exam.date)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{status}</Badge>
          <ChevronDown size={18} className={cx('transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </div>
      </button>
      {open && (
        <div className="border-t border-line p-4">
          {exam.submitted
            ? <ExamResult exam={exam} />
            : <ScoreEntry exam={exam} onSave={(patch) => { actions.saveExam(exam.id, patch); toast('Exam result saved.'); }} />}
        </div>
      )}
    </Card>
  );
}

export default function Exams() {
  const { data, today } = useApp();
  const nextUnsubmitted = useMemo(() => data.exams.find((e) => !e.submitted && e.date <= today) || data.exams.find((e) => !e.submitted), [data.exams, today]);
  return (
    <>
      <PageHeader title="Weekly exams" subtitle="One sectional test at the end of every week. Enter your score manually once you're done." />
      <div className="space-y-3">
        {data.exams.map((e) => <ExamCard key={e.id} exam={e} defaultOpen={e.id === nextUnsubmitted?.id} />)}
      </div>
    </>
  );
}
