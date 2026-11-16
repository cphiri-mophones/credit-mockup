import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';

const variantClass: Record<Variant, string> = {
  primary: 'bg-indigo-700 text-white hover:bg-indigo-800 disabled:bg-gray-200 disabled:text-gray-600',
  secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 disabled:text-gray-500',
  danger: 'bg-white text-red-800 border border-red-300 hover:bg-red-50',
  success: 'bg-green-800 text-white hover:bg-green-900 disabled:bg-gray-200 disabled:text-gray-600',
  ghost: 'bg-transparent text-indigo-700 hover:text-indigo-900 px-1',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  emphasis = false,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  emphasis?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={`flex flex-col gap-4 rounded-xl bg-white p-5 ${emphasis ? 'border-2 border-indigo-700' : 'border border-gray-200'}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-lg font-bold">{title}</h2>}
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

type Tone = 'neutral' | 'indigo' | 'blue' | 'purple' | 'green' | 'amber' | 'red' | 'orange';

const toneClass: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  indigo: 'bg-indigo-50 text-indigo-800',
  blue: 'bg-blue-50 text-blue-800',
  purple: 'bg-violet-50 text-violet-800',
  green: 'bg-green-50 text-green-800',
  amber: 'bg-amber-50 text-amber-800',
  red: 'bg-red-50 text-red-800',
  orange: 'bg-orange-50 text-orange-800',
};

export function Chip({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass[tone]}`}>{children}</span>;
}

export function CheckCircle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';
  return (
    <span className={`flex flex-none items-center justify-center rounded-full bg-green-800 text-white ${box}`}>
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5L20 7" />
      </svg>
    </span>
  );
}

export function PendingCircle() {
  return <span aria-hidden="true" className="h-5 w-5 flex-none rounded-full border-2 border-amber-700" />;
}

export function Spinner() {
  return <span aria-hidden="true" className="h-7 w-7 flex-none animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-700" />;
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-gray-700">
      {label}
      {required && <span className="ml-1 text-red-800">*</span>}
    </span>
  );
}

function FieldMessage({ error, hint, ok }: { error?: string; hint?: string; ok?: string }) {
  if (error) return <span className="text-xs font-semibold text-red-800">{error}</span>;
  if (ok) return <span className="text-xs font-semibold text-green-800">{ok}</span>;
  if (hint) return <span className="text-xs text-gray-600">{hint}</span>;
  return null;
}

const inputClass = 'min-h-11 rounded-lg border bg-white px-3 text-sm text-gray-900';

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  error,
  hint,
  placeholder = 'Choose…',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel label={label} required={required} />
      <select className={`${inputClass} ${error ? 'border-red-400' : 'border-gray-300'}`} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <FieldMessage error={error} hint={hint} />
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  required,
  error,
  hint,
  ok,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  ok?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel label={label} required={required} />
      <input
        type={type}
        className={`${inputClass} ${error ? 'border-red-400' : ok ? 'border-green-400' : 'border-gray-300'}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldMessage error={error} hint={hint} ok={ok} />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  required,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel label={label} required={required} />
      <textarea
        rows={2}
        className={`rounded-lg border px-3 py-2 text-sm ${error ? 'border-red-400' : 'border-gray-300'}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldMessage error={error} />
    </label>
  );
}

export function Segmented({
  label,
  value,
  onChange,
  options,
  required,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5">
        <FieldLabel label={label} required={required} />
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              className={`min-h-11 rounded-lg px-4 text-sm ${
                selected ? 'bg-indigo-700 font-semibold text-white' : `border bg-white text-gray-700 ${error ? 'border-red-400' : 'border-gray-300'}`
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <FieldMessage error={error} hint={hint} />
    </fieldset>
  );
}

export function ChoiceCards<T extends string>({
  label,
  value,
  onChange,
  options,
  columns = 1,
}: {
  label?: string;
  value: T | '';
  onChange: (v: T) => void;
  options: { value: T; label: string; help?: ReactNode }[];
  columns?: 1 | 2 | 3;
}) {
  const grid = columns === 3 ? 'md:grid-cols-3' : columns === 2 ? 'md:grid-cols-2' : '';
  return (
    <fieldset className="flex flex-col gap-2">
      {label && <legend className="mb-2 text-sm font-bold">{label}</legend>}
      <div className={`grid grid-cols-1 gap-2 ${grid}`}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              className={`flex min-h-11 flex-col gap-1 rounded-lg px-4 py-3 text-left ${
                selected ? 'border-2 border-indigo-700 bg-indigo-50' : 'border border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className={`text-[15px] ${selected ? 'font-bold' : 'font-semibold'}`}>{o.label}</span>
              {o.help && <span className="text-sm text-gray-600">{o.help}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'green' | 'amber' }) {
  const color = tone === 'green' ? 'text-green-800' : tone === 'amber' ? 'text-amber-800' : 'text-gray-900';
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-gray-600">{label}</dt>
      <dd className={`text-sm font-bold ${color}`}>{value}</dd>
    </div>
  );
}

export function MockPanel({ children }: { children: ReactNode }) {
  return (
    <aside className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-amber-500 bg-amber-50 p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold uppercase tracking-wide text-amber-900">Mock only</span>
        <span className="text-sm text-amber-900">Stand-ins for things that happen outside this screen (payment, rider, device management).</span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </aside>
  );
}
