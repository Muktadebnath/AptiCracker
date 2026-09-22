import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, TriangleAlert, X } from 'lucide-react';
import { SECTIONS, STATUSES, solid, toneStyle } from '../lib/constants.js';

export const cx = (...a) => a.filter(Boolean).join(' ');

/* ------------------------------------------------------------ layout bits */
export function Card({ children, className = '', hover = false, style, ...rest }) {
  return (
    <div
      className={cx('rounded-3xl border border-line bg-surface p-5 shadow-card', hover && 'transition duration-200 hover:-translate-y-0.5 hover:shadow-pop', className)}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ tone = 'accent', icon: Icon, children, className = '', title }) {
  return (
    <span title={title} className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold', className)} style={toneStyle(tone)}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

export const SectionBadge = ({ section }) => {
  const s = SECTIONS[section] || SECTIONS.mixed;
  return <Badge tone={s.tone}>{s.short}</Badge>;
};
export const StatusBadge = ({ status }) => {
  const s = STATUSES[status] || STATUSES.not_started;
  return <Badge tone={s.tone}>{s.label}</Badge>;
};

export function ProgressBar({ value, tone = 'accent', label, height = 'h-2.5' }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className={cx('w-full overflow-hidden rounded-full', height)} style={{ background: 'var(--line)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v}%`, background: solid(tone) }} />
    </div>
  );
}

/* ------------------------------------------------------------ buttons */
const BTN = {
  primary: 'bg-accent text-accent-on hover:brightness-110',
  soft: 'bg-accent-soft text-accent-ink hover:brightness-95',
  ghost: 'border border-line bg-surface text-ink hover:bg-surface2',
  danger: 'text-[color:var(--overdue-ink)] bg-[color:var(--overdue-soft)] hover:brightness-95',
  quiet: 'text-muted hover:bg-surface2 hover:text-ink',
};
export function Btn({ variant = 'soft', size = 'md', icon: Icon, children, className = '', type = 'button', ...rest }) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  return (
    <button type={type} className={cx('inline-flex items-center justify-center gap-1.5 rounded-full font-bold transition active:scale-[0.97]', sz, BTN[variant], className)} {...rest}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------ form controls */
const inputCls = 'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent';

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={cx('block text-sm', className)}>
      <span className="mb-1 block font-bold">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-bold" style={{ color: 'var(--overdue-ink)' }}>{error}</span>}
    </label>
  );
}
export const TextInput = ({ className = '', ...p }) => <input type="text" className={cx(inputCls, className)} {...p} />;
export const DateInput = ({ className = '', ...p }) => <input type="date" className={cx(inputCls, className)} {...p} />;
export const TextArea = ({ className = '', rows = 3, ...p }) => <textarea rows={rows} className={cx(inputCls, 'resize-y', className)} {...p} />;
export const SelectInput = ({ className = '', children, ...p }) => (
  <select className={cx(inputCls, 'pr-8', className)} {...p}>{children}</select>
);

/** number field that lets you clear it while typing, and re-syncs on blur */
export function NumInput({ value, onChange, min = 0, max, step = 1, className = '', ...rest }) {
  const [text, setText] = useState(String(value ?? ''));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setText(String(value ?? '')); }, [value]);
  return (
    <input
      type="number" inputMode="decimal" min={min} max={max} step={step} value={text} className={cx(inputCls, className)}
      onFocus={() => { focused.current = true; }}
      onBlur={() => { focused.current = false; setText(String(value ?? '')); }}
      onChange={(e) => {
        setText(e.target.value);
        const n = e.target.value === '' ? 0 : Number(e.target.value);
        if (!Number.isNaN(n)) onChange(n);
      }}
      {...rest}
    />
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-sm">
        <div className="font-bold">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      <button
        type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition" style={{ background: checked ? 'var(--accent)' : 'var(--skip)' }}
      >
        <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: checked ? '22px' : '2px' }} />
      </button>
    </div>
  );
}

export function CheckField({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: 'var(--accent)' }} />
      <span>{children}</span>
    </label>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full bg-surface2 p-1">
      {options.map((o) => (
        <button
          key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={cx('rounded-full px-3 py-1.5 text-xs font-bold transition', value === o.value ? 'bg-accent text-accent-on shadow' : 'text-muted hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ stat tile */
export function Stat({ icon: Icon, label, value, sub, tone = 'accent' }) {
  return (
    <div className="rounded-2xl p-3.5" style={toneStyle(tone)}>
      <div className="flex items-center gap-1.5 text-xs font-bold opacity-90">
        {Icon && <Icon size={14} aria-hidden="true" />}
        {label}
      </div>
      <div className="font-display mt-1 text-2xl font-extrabold leading-none">{value}</div>
      {sub && <div className="mt-1 text-xs opacity-80">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ empty state */
export function EmptyState({ title, text, action, tone = 'accent' }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-10 text-center">
      <svg width="96" height="72" viewBox="0 0 96 72" aria-hidden="true" className="mb-3">
        <circle cx="30" cy="38" r="24" style={{ fill: `var(--${tone}-soft)` }} />
        <rect x="46" y="14" width="34" height="34" rx="10" transform="rotate(12 63 31)" style={{ fill: 'var(--exam-soft)' }} />
        <circle cx="70" cy="56" r="8" style={{ fill: 'var(--verbal-soft)' }} />
        <path d="M20 40l8 8 16-18" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: `var(--${tone})` }} />
      </svg>
      <h3 className="text-lg font-extrabold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ modal */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => box.current?.querySelector('input:not([type=hidden]),select,textarea')?.focus(), 30);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (prev && prev.focus) prev.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  const width = size === 'lg' ? 'sm:max-w-2xl' : size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden="true" />
      <div ref={box} role="dialog" aria-modal="true" aria-label={title} className={cx('view-in relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-surface shadow-pop sm:rounded-3xl', width)}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-surface2 hover:text-ink">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ toast + confirm */
const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const toast = useCallback((message, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  const confirm = useCallback((opts) => new Promise((resolve) => setDialog({ ...opts, resolve })), []);
  const close = (v) => { dialog?.resolve(v); setDialog(null); };
  const api = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <UICtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="view-in pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-sm font-bold text-bg shadow-pop">
            {t.kind === 'error' ? <TriangleAlert size={16} aria-hidden="true" /> : <CircleCheck size={16} aria-hidden="true" />}
            {t.message}
          </div>
        ))}
      </div>
      <Modal
        open={!!dialog} onClose={() => close(false)} title={dialog?.title || 'Are you sure?'} size="sm"
        footer={
          <>
            <Btn variant="ghost" onClick={() => close(false)}>{dialog?.cancelLabel || 'Cancel'}</Btn>
            <Btn variant={dialog?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{dialog?.confirmLabel || 'Confirm'}</Btn>
          </>
        }
      >
        <p className="text-sm text-muted">{dialog?.message}</p>
      </Modal>
    </UICtx.Provider>
  );
}
