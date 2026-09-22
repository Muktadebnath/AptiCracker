import { BarChart3, CalendarRange, Flame, Layers, LayoutDashboard, ListChecks, Moon, Settings as SettingsIcon, Sun, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { go } from '../lib/router.js';
import { round } from '../lib/stats.js';
import { Btn, ProgressBar, cx, useUI } from './ui.jsx';

export const NAV = [
  { id: 'dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { id: 'plan', label: '3-month plan', short: 'Plan', icon: CalendarRange },
  { id: 'daily', label: 'Daily tracker', short: 'Today', icon: ListChecks },
  { id: 'exams', label: 'Weekly exams', short: 'Exams', icon: Trophy },
  { id: 'analytics', label: 'Analytics', short: 'Stats', icon: BarChart3 },
  { id: 'topics', label: 'Topics', short: 'Topics', icon: Layers },
  { id: 'settings', label: 'Settings', short: 'Settings', icon: SettingsIcon },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="18" fill="#ff7f6b" />
        <path d="M32 12 46 50h-7l-2.6-7.5H27.6L25 50h-7Zm0 13-3.2 10h6.4Z" fill="#fff" />
        <circle cx="49" cy="15" r="6" fill="#f6c945" />
      </svg>
      <span className="font-display text-xl font-extrabold tracking-tight">AptiCrack</span>
    </div>
  );
}

function SaveState() {
  const { saveState } = useApp();
  const text = saveState === 'error' ? 'Could not save. Export a backup.' : saveState === 'saving' ? 'Saving...' : 'Saved on this device';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted" role="status">
      <span className="h-2 w-2 rounded-full" style={{ background: saveState === 'error' ? 'var(--overdue)' : saveState === 'saving' ? 'var(--exam)' : 'var(--done)' }} />
      {text}
    </span>
  );
}

function ModeToggle({ className }) {
  const { data, actions } = useApp();
  const dark = document.documentElement.classList.contains('dark');
  const next = dark ? 'light' : 'dark';
  return (
    <button
      type="button" onClick={() => actions.setPrefs({ mode: next })} aria-label={`Switch to ${next} mode`}
      className={cx('rounded-full border border-line bg-surface p-2 text-ink hover:bg-surface2', className)} data-mode={data.settings.mode}
    >
      {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

function SampleBanner() {
  const { data, actions } = useApp();
  const { confirm, toast } = useUI();
  if (!data.meta?.isSample) return null;
  const clear = async () => {
    const ok = await confirm({
      title: 'Clear sample data?',
      message: 'This removes the demo plan, demo progress and demo exam scores, and starts your real 12-week plan with zero progress. Your name and settings stay.',
      confirmLabel: 'Clear sample data',
    });
    if (ok) { actions.clearSample(); toast('Sample data cleared. Your real plan is ready.'); go('dashboard'); }
  };
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--exam-soft)', color: 'var(--exam-ink)' }}>
      <p className="max-w-3xl">
        <strong>You are looking at sample data.</strong> It is a demo plan that started three weeks ago, so you can see how everything works. Your real plan is waiting.
      </p>
      <Btn variant="primary" size="sm" onClick={clear}>Clear sample data</Btn>
    </div>
  );
}

export default function Layout({ route, children }) {
  const { derived } = useApp();
  return (
    <div className="min-h-screen md:pl-64">
      {/* soft background shapes */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60" style={{ background: 'var(--verbal-soft)' }} />
        <div className="absolute -left-20 bottom-10 h-64 w-64 rounded-full opacity-50" style={{ background: 'var(--logic-soft)' }} />
        <div className="absolute right-1/4 top-1/2 h-40 w-40 rotate-12 rounded-[2.5rem] opacity-40" style={{ background: 'var(--exam-soft)' }} />
      </div>

      {/* sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 border-r border-line bg-surface/90 p-5 backdrop-blur md:flex">
        <Logo />
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = route === n.id;
            return (
              <a key={n.id} href={`#/${n.id}`} aria-current={active ? 'page' : undefined}
                className={cx('flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition', active ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-surface2 hover:text-ink')}>
                <n.icon size={18} aria-hidden="true" />
                {n.label}
              </a>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl p-3.5" style={{ background: 'var(--done-soft)', color: 'var(--done-ink)' }}>
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
              <span>Overall progress</span>
              <span>{round(derived.overall.pct)}%</span>
            </div>
            <ProgressBar value={derived.overall.pct} tone="done" label="Overall progress" />
            <div className="mt-2 flex items-center gap-1 text-xs font-bold">
              <Flame size={14} aria-hidden="true" /> {derived.streak}-day streak
            </div>
          </div>
          <div className="flex items-center justify-between">
            <SaveState />
            <ModeToggle />
          </div>
        </div>
      </aside>

      {/* top bar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur md:hidden" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
        <Logo />
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">
        <SampleBanner />
        <div key={route} className="view-in">{children}</div>
        <div className="mt-8 flex justify-center md:hidden"><SaveState /></div>
      </main>

      {/* bottom tab bar (mobile) */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-line bg-surface/95 backdrop-blur md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map((n) => {
          const active = route === n.id;
          return (
            <a key={n.id} href={`#/${n.id}`} aria-current={active ? 'page' : undefined} aria-label={n.label}
              className={cx('flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold', active ? 'text-accent' : 'text-muted')}>
              <n.icon size={20} aria-hidden="true" />
              {n.short}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
