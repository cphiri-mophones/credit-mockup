import { FileText, ListChecks, NotebookPen } from 'lucide-react';
import type { ReactNode } from 'react';
import { cashApplication, kes } from '../data/application';
import { navigate, viewMemory, type Route } from '../navigation';
import { CASH_STEPS, cashDevice, currentCashStep, useReview, type CashStep } from '../state/review';
import { MoosShell } from './MoosShell';
import { CheckCircle, Chip } from './ui';

const stepMeta: Record<CashStep, { label: string; hint: string; route: Route }> = {
  device: { label: 'Device', hint: 'Choose the phone', route: 'cash-device' },
  activate: { label: 'Activate', hint: 'Payment, hand-over, sale', route: 'cash-activate' },
};

export function CashStepper({ active }: { active?: CashStep }) {
  const { state } = useReview();
  const reachable = currentCashStep(state);
  const device = cashDevice(state);
  const doneHint: Record<CashStep, string> = {
    device: device?.name ?? 'Chosen',
    activate: 'Cash sale completed',
  };
  return (
    <nav aria-label="Cash sale steps">
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CASH_STEPS.map((step, i) => {
          const done = state.cash.completed.includes(step);
          const isActive = step === active;
          const locked = !done && step !== reachable;
          const style = isActive ? 'border-2 border-indigo-700 bg-indigo-50' : done ? 'border border-green-200 bg-green-50' : 'border border-gray-200 bg-white';
          return (
            <li key={step}>
              <button
                type="button"
                disabled={locked}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => navigate(stepMeta[step].route)}
                className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left ${style} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {done && !isActive ? (
                  <CheckCircle />
                ) : (
                  <span
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold ${
                      isActive ? 'bg-indigo-700 text-white' : 'border border-gray-400 text-gray-700'
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="flex flex-col">
                  <span className={`text-sm ${isActive ? 'font-bold' : 'font-semibold'}`}>{stepMeta[step].label}</span>
                  <span className={`text-xs ${done && !isActive ? 'text-green-800' : 'text-gray-600'}`}>{done ? doneHint[step] : stepMeta[step].hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CashViewToggle({ view }: { view: 'flow' | 'details' }) {
  const { state } = useReview();
  const toDetails = view === 'flow';
  const Icon = toDetails ? FileText : ListChecks;
  const flowRoute = stepMeta[(viewMemory.cashFlowStep as CashStep | null) ?? currentCashStep(state)].route;
  return (
    <button
      type="button"
      onClick={() => (toDetails ? navigate('cash-details', viewMemory.cashDetailsTab) : navigate(flowRoute))}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {toDetails ? 'View application details' : 'Back to cash sale'}
    </button>
  );
}

function RailSection({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-1.5 last:border-b-0">
      <dt className="text-gray-600">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

function CashRail() {
  const { state } = useReview();
  const { customer } = cashApplication;
  const device = cashDevice(state);
  return (
    <aside aria-label="Cash sale context" className="flex flex-col gap-4">
      <RailSection title="Customer">
        <div className="text-base font-bold">{customer.name}</div>
        <dl className="text-sm">
          <Row label="National ID" value={customer.idNumber} />
          <Row label="M-Pesa" value={customer.phone} />
        </dl>
      </RailSection>
      <RailSection title="Sale" aside={<Chip tone="amber">Cash</Chip>}>
        <dl className="text-sm">
          <Row label="Device" value={device?.name ?? 'Not chosen yet'} />
          <Row label="Amount to collect" value={device ? kes(device.cashPrice) : '—'} />
          <Row label="Credit checks" value="Not needed for cash" />
        </dl>
      </RailSection>
      <RailSection title="From the sales agent">
        <dl className="text-sm">
          <Row label="Agent" value={customer.salesAgent} />
          <Row label="Channel" value={customer.channel} />
          <Row label="Submitted" value={customer.submitted} />
        </dl>
      </RailSection>
      <RailSection title="Activity">
        <ol className="flex flex-col gap-2.5 text-sm">
          {state.cash.log.slice(0, 8).map((entry, i) => (
            <li key={`${entry.at}-${i}`}>
              <div className="text-xs text-gray-600">{entry.at}</div>
              <div>{entry.text}</div>
            </li>
          ))}
        </ol>
      </RailSection>
    </aside>
  );
}

export function CashLayout({ step, view = 'flow', children }: { step?: CashStep; view?: 'flow' | 'details'; children: ReactNode }) {
  const { customer } = cashApplication;
  if (view === 'flow' && step) viewMemory.cashFlowStep = step;
  return (
    <MoosShell>
      <div className="mx-auto flex max-w-[1360px] flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href="#/queue" className="text-sm font-semibold text-indigo-700 no-underline">
            ← Credit work
          </a>
          <CashViewToggle view={view} />
        </div>
        <section className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold">{customer.name}</h1>
                <Chip tone="amber">Cash</Chip>
                <Chip tone="blue">{customer.saleType}</Chip>
                <Chip>Sample customer</Chip>
              </div>
              <p className="text-sm text-gray-600">
                Cash sale · submitted {customer.submitted} by {customer.salesAgent} · no scoring or credit call
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">
                Owner: <strong className="text-gray-900">You</strong>
              </span>
              <button type="button" className="min-h-9 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
                Transfer Application
              </button>
              <button
                type="button"
                onClick={() => navigate('cash-details', 'notes')}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-indigo-700 px-3 text-xs font-semibold text-white hover:bg-indigo-800"
              >
                <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
                Add Note
              </button>
            </div>
          </div>
          {view === 'flow' && <CashStepper active={step} />}
        </section>
        {view === 'flow' ? (
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-5">{children}</div>
            <div className="min-w-0 flex-[1_1_320px]">
              <CashRail />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </MoosShell>
  );
}
