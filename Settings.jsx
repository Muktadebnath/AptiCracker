import { useRef, useState } from 'react';
import { AlertTriangle, Check, Download, RefreshCw, RotateCcw, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { go } from '../lib/router.js';
import { settingsImpact } from '../lib/settingsLogic.js';
import { downloadBackup, parseImport } from '../lib/storage.js';
import { ACCENTS } from '../lib/constants.js';
import { WEEKDAYS } from '../lib/dateUtils.js';
import { Btn, Card, DateInput, Field, NumInput, PageHeader, SelectInput, Segmented, TextInput, Toggle, cx, useUI } from '../components/ui.jsx';

export default function Settings() {
  const { data, actions } = useApp();
  const { toast, confirm } = useUI();
  const [f, setF] = useState(data.settings);
  const fileRef = useRef(null);
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const setSplit = (k, v) => setF((x) => ({ ...x, split: { ...x.split, [k]: v } }));
  const splitTotal = Object.values(f.split).reduce((a, b) => a + Number(b || 0), 0);

  const save = async () => {
    if (!data.meta?.isSample) {
      const impact = settingsImpact(data, f);
      if (impact.erases) {
        const ok = await confirm({
          title: 'This will regenerate your plan',
          message: 'Changing the rest-day setting (or the start date with no progress yet) rebuilds your 12-week schedule from scratch and clears any progress you have logged. This can\'t be undone.',
          danger: true, confirmLabel: 'Regenerate plan',
        });
        if (!ok) return;
      }
    }
    const notes = actions.saveSettings(f);
    (notes || []).forEach((n) => toast(n));
  };

  const regenerate = async () => {
    const ok = await confirm({
      title: 'Regenerate your plan?',
      message: 'This rebuilds all 12 weeks of tasks and exams from your current settings and topic list. Any progress you have logged will be lost.',
      danger: true, confirmLabel: 'Regenerate',
    });
    if (ok) { actions.regeneratePlan(); toast('Plan regenerated.'); go('dashboard'); }
  };

  const factoryReset = async () => {
    const ok = await confirm({
      title: 'Reset everything?',
      message: 'This deletes all your data — plan, progress, exam results and settings — and loads fresh sample data. This can\'t be undone.',
      danger: true, confirmLabel: 'Reset everything',
    });
    if (ok) { actions.factoryReset(); toast('Reset. You\'re looking at sample data again.'); go('dashboard'); }
  };

  const exportBackup = () => { downloadBackup(data); toast('Backup downloaded.'); };
  const onImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const res = parseImport(String(reader.result));
      if (!res.ok) { toast(res.error, 'error'); return; }
      const ok = await confirm({ title: 'Import this backup?', message: 'This replaces everything currently in AptiCrack on this device.', danger: true, confirmLabel: 'Import & replace' });
      if (ok) { actions.importData(res.data); toast('Backup imported.'); go('dashboard'); }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your plan adapts automatically when you change these — see a note after saving." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Profile & plan</h2>
          <div className="space-y-3">
            <Field label="Dashboard name"><TextInput value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Plan start date"><DateInput value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} /></Field>
              <Field label="Target end date (optional)"><DateInput value={f.targetEndDate} onChange={(e) => set({ targetEndDate: e.target.value })} /></Field>
            </div>
            <Field label="Weekly exam day">
              <SelectInput value={f.examDay} onChange={(e) => set({ examDay: Number(e.target.value) })}>
                {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </SelectInput>
            </Field>
            <Toggle checked={f.sundayRest} onChange={(v) => set({ sundayRest: v })} label="Rest on Sundays" hint="Skip study tasks on Sunday (exam still happens if Sunday is your exam day). Changes rebuild the plan." />
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Daily targets</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Daily study time (minutes)"><NumInput value={f.dailyMinutes} onChange={(v) => set({ dailyMinutes: v })} min={15} step={5} /></Field>
              <Field label="Questions per day"><NumInput value={f.questionsPerDay} onChange={(v) => set({ questionsPerDay: v })} min={0} step={5} /></Field>
            </div>
            <Field label="Target accuracy (%)"><NumInput value={f.targetAccuracy} onChange={(v) => set({ targetAccuracy: v })} min={0} max={100} /></Field>
            <Field label={`Time split — Learn / Practice / Review / Revise ${splitTotal !== 100 ? `(sums to ${splitTotal}%, will be normalised)` : ''}`}>
              <div className="grid grid-cols-4 gap-2">
                <NumInput value={f.split.learn} onChange={(v) => setSplit('learn', v)} min={0} max={100} />
                <NumInput value={f.split.practice} onChange={(v) => setSplit('practice', v)} min={0} max={100} />
                <NumInput value={f.split.review} onChange={(v) => setSplit('review', v)} min={0} max={100} />
                <NumInput value={f.split.revise} onChange={(v) => setSplit('revise', v)} min={0} max={100} />
              </div>
            </Field>
            <Field label="Negative marking (per wrong answer)">
              <NumInput value={f.marking.wrong} onChange={(v) => set({ marking: { ...f.marking, wrong: v } })} min={0} max={1} step={0.25} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Appearance</h2>
          <div className="space-y-3">
            <Field label="Theme"><Segmented value={f.mode} onChange={(v) => set({ mode: v })} label="Theme" options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'auto', label: 'Auto' }]} /></Field>
            <Field label="Accent colour">
              <div className="flex flex-wrap gap-2">
                {Object.entries(ACCENTS).map(([key, a]) => (
                  <button key={key} type="button" onClick={() => set({ accent: key })} aria-label={a.label} aria-pressed={f.accent === key}
                    className={cx('grid h-10 w-10 place-items-center rounded-full border-2 transition', f.accent === key ? 'border-ink' : 'border-transparent')}>
                    <span className="h-7 w-7 rounded-full" style={{ background: a.swatch }}>{f.accent === key && <Check size={16} className="mx-auto mt-1.5 text-white" />}</span>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg font-extrabold">Topics</h2>
          <p className="text-sm text-muted">Add, remove, or edit confidence and notes for individual topics on the Topics page.</p>
          <Btn variant="soft" className="mt-3" onClick={() => go('topics')}>Open topics</Btn>
        </Card>
      </div>

      <div className="sticky bottom-20 z-20 mt-5 flex justify-end gap-2 rounded-2xl border border-line bg-surface/95 p-3 backdrop-blur md:bottom-4">
        <Btn variant="primary" icon={Check} onClick={save}>Save settings</Btn>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 font-display text-lg font-extrabold">Backup</h2>
          <p className="mb-3 text-sm text-muted">Your data lives only in this browser. Export a backup regularly, especially before clearing site data.</p>
          <div className="flex flex-wrap gap-2">
            <Btn variant="soft" icon={Download} onClick={exportBackup}>Export backup (.json)</Btn>
            <Btn variant="ghost" icon={Upload} onClick={() => fileRef.current?.click()}>Import backup</Btn>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
          </div>
        </Card>

        <Card style={{ borderColor: 'var(--overdue-soft)' }}>
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-extrabold" style={{ color: 'var(--overdue-ink)' }}>
            <AlertTriangle size={18} aria-hidden="true" /> Danger zone
          </h2>
          <p className="mb-3 text-sm text-muted">These rebuild or erase your plan. Export a backup first if you want to keep what you have.</p>
          <div className="flex flex-wrap gap-2">
            <Btn variant="ghost" icon={RefreshCw} onClick={regenerate}>Regenerate plan</Btn>
            <Btn variant="danger" icon={RotateCcw} onClick={factoryReset}>Factory reset</Btn>
          </div>
        </Card>
      </div>
    </>
  );
}
