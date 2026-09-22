import { useState, useEffect } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { fmtDate } from '../lib/dateUtils.js';
import { round } from '../lib/stats.js';
import { CORE_SECTIONS, SECTIONS } from '../lib/constants.js';
import { Badge, Btn, Card, DateInput, Field, Modal, PageHeader, ProgressBar, SelectInput, TextArea, TextInput, useUI } from '../components/ui.jsx';

function Stars({ value, onChange }) {
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Confidence">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)} aria-label={`${n} of 5`}>
          <Star size={18} fill={n <= value ? 'var(--exam)' : 'none'} style={{ color: n <= value ? 'var(--exam)' : 'var(--line)' }} />
        </button>
      ))}
    </div>
  );
}

const STATUS_TONE = { completed: 'done', in_progress: 'progress', needs_revision: 'revise', not_started: 'pending', not_scheduled: 'mixed' };
const STATUS_LABEL = { completed: 'Completed', in_progress: 'In progress', needs_revision: 'Needs revision', not_started: 'Not started', not_scheduled: 'Not scheduled' };

function TopicModal({ entry, onClose }) {
  const { actions } = useApp();
  const { toast, confirm } = useUI();
  const [f, setF] = useState(entry ? { confidence: entry.topic.confidence, notes: entry.topic.notes || '', nextRevision: entry.topic.nextRevision || '' } : null);
  useEffect(() => {
    if (entry) setF({ confidence: entry.topic.confidence, notes: entry.topic.notes || '', nextRevision: entry.topic.nextRevision || '' });
  }, [entry]);
  if (!entry || !f) return null;
  const { topic, ...s } = entry;

  const save = () => { actions.updateTopic(topic.id, f); toast('Topic updated.'); onClose(); };
  const remove = async () => {
    const ok = await confirm({ title: `Remove "${topic.name}"?`, message: 'Untouched tasks for this topic will be removed from your plan. Completed history is kept.', danger: true, confirmLabel: 'Remove' });
    if (ok) { actions.removeTopic(topic.id); toast('Topic removed.'); onClose(); }
  };

  return (
    <Modal open={!!entry} onClose={onClose} title={topic.name}
      footer={<><Btn variant="danger" icon={Trash2} onClick={remove}>Remove</Btn><Btn variant="primary" onClick={save}>Save</Btn></>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={SECTIONS[topic.section].tone}>{SECTIONS[topic.section].short}</Badge>
          <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-surface2 p-3">
            <div className="text-xs font-bold text-muted">Completion</div>
            <div className="font-display text-xl font-extrabold">{s.completed}/{s.total}</div>
          </div>
          <div className="rounded-2xl bg-surface2 p-3">
            <div className="text-xs font-bold text-muted">Accuracy</div>
            <div className="font-display text-xl font-extrabold">{s.accuracy != null ? `${round(s.accuracy)}%` : '—'}</div>
          </div>
        </div>
        <p className="text-xs text-muted">Last studied: {s.lastStudied ? fmtDate(s.lastStudied) : 'not yet'}</p>

        <Field label="Confidence" hint="Higher confidence pushes the suggested revision date further out">
          <Stars value={f.confidence} onChange={(v) => setF((x) => ({ ...x, confidence: v }))} />
        </Field>
        <Field label="Next revision date" hint="Leave blank to auto-calculate from confidence">
          <DateInput value={f.nextRevision} onChange={(e) => setF((x) => ({ ...x, nextRevision: e.target.value }))} />
        </Field>
        <Field label="Notes"><TextArea value={f.notes} onChange={(e) => setF((x) => ({ ...x, notes: e.target.value }))} placeholder="Formulas, shortcuts, common traps..." /></Field>
      </div>
    </Modal>
  );
}

function AddTopicModal({ open, onClose }) {
  const { actions } = useApp();
  const { toast } = useUI();
  const [f, setF] = useState({ section: 'quant', name: '' });
  const submit = () => {
    if (!f.name.trim()) { toast('Give the topic a name.', 'error'); return; }
    actions.addTopic({ section: f.section, name: f.name.trim() });
    toast('Topic added.');
    setF({ section: 'quant', name: '' });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Add a topic" footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={submit}>Add topic</Btn></>}>
      <div className="space-y-3">
        <Field label="Section">
          <SelectInput value={f.section} onChange={(e) => setF((x) => ({ ...x, section: e.target.value }))}>
            {CORE_SECTIONS.map((k) => <option key={k} value={k}>{SECTIONS[k].label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Topic name"><TextInput value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} placeholder="e.g. Data Sufficiency" /></Field>
        <p className="text-xs text-muted">New topics aren't scheduled into your plan automatically — add tasks for them from the Daily tracker, or regenerate your plan in Settings.</p>
      </div>
    </Modal>
  );
}

export default function Topics() {
  const { derived } = useApp();
  const [entry, setEntry] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <PageHeader title="Topics" subtitle="Confidence and notes per topic, used to schedule spaced revision." actions={<Btn variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>Add topic</Btn>} />
      <div className="space-y-6">
        {CORE_SECTIONS.map((key) => {
          const list = derived.topicList.filter((e) => e.topic.section === key);
          if (!list.length) return null;
          return (
            <div key={key}>
              <h2 className="mb-2 font-display text-lg font-extrabold" style={{ color: `var(--${SECTIONS[key].tone}-ink)` }}>{SECTIONS[key].label}</h2>
              <Card className="!p-0 divide-y divide-line">
                {list.map((e) => (
                  <button key={e.topic.id} type="button" onClick={() => setEntry(e)} className="flex w-full items-center gap-3 p-3.5 text-left transition hover:bg-surface2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-bold">{e.topic.name}</span>
                        <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                        {e.needsRevision && <Badge tone="revise">Revise</Badge>}
                      </div>
                      <div className="mt-1.5 w-full max-w-xs"><ProgressBar value={e.pct} tone={SECTIONS[key].tone} label={e.topic.name} /></div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} fill={n <= (e.topic.confidence || 3) ? 'var(--exam)' : 'none'} style={{ color: n <= (e.topic.confidence || 3) ? 'var(--exam)' : 'var(--line)' }} />)}
                    </div>
                  </button>
                ))}
              </Card>
            </div>
          );
        })}
      </div>
      <TopicModal entry={entry} onClose={() => setEntry(null)} />
      <AddTopicModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
