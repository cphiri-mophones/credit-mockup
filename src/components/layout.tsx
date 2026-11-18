import type { ReactNode } from 'react';
import { application, details, kes } from '../data/application';
import { navigate, viewMemory, type Route } from '../navigation';
import { initialPayment, purchaseMode, STEPS, currentStep, selectedPlan, useReview, type Step } from '../state/review';
import { FileText, ListChecks, NotebookPen } from 'lucide-react';
import { MoosShell } from './MoosShell';
import { CheckCircle, Chip, CopyButton } from './ui';

const stepMeta: Record<Step, { label: string; hint: string }> = {
  verify: { label: 'Verify', hint: 'Documents and risk' },
  offer: { label: 'Offer', hint: 'Device and plan' },
  call: { label: 'Call', hint: 'Script and outcome' },
  decide: { label: 'Decide', hint: 'Approve or reject' },
  activate: { label: 'Activate', hint: 'Payment, hand-over, sale' },
};

export function Stepper({ active }: { active?: Step }) {
  const { state } = useReview();
  const reachable = currentStep(state);
  const doneHint: Partial<Record<Step, string>> = {
    verify: 'Done',
    offer: selectedPlan(state).name,
    call: state.call.outcome === 'ended' ? 'Cannot go ahead' : 'Reached',
    decide: state.decision.choice === 'reject' ? 'Rejected' : state.decision.choice === 'cash' ? 'Cash offer' : 'Loan approved',
    activate: 'Activated',
  };

  return (
    <nav aria-label="Credit steps">
      <ol className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {STEPS.map((step, i) => {
          const done = state.completed.includes(step);
          const isActive = step === active;
          const locked = !done && step !== reachable;
          const base = 'flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left';
          const style = isActive
            ? 'border-2 border-indigo-700 bg-indigo-50'
            : done
              ? 'border border-green-200 bg-green-50'
              : 'border border-gray-200 bg-white';
          return (
            <li key={step}>
              <button
                type="button"
                disabled={locked}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => navigate(step)}
                className={`${base} ${style} disabled:cursor-not-allowed disabled:opacity-60`}
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
                  <span className={`text-xs ${done && !isActive ? 'text-green-800' : 'text-gray-600'}`}>
                    {done ? doneHint[step] : stepMeta[step].hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Top-right button in the title bar: flips between working the application
// and reading all of its details, returning to where each view was left.
function ViewToggle({ view }: { view: 'flow' | 'details' }) {
  const { state } = useReview();
  const toDetails = view === 'flow';
  const Icon = toDetails ? FileText : ListChecks;
  return (
    <button
      type="button"
      onClick={() => (toDetails ? navigate('details', viewMemory.detailsTab) : navigate((viewMemory.flowStep as Step | null) ?? currentStep(state)))}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {toDetails ? 'View application details' : 'Back to credit flow'}
    </button>
  );
}

function PurchaseModeChip() {
  const { state } = useReview();
  const mode = purchaseMode(state);
  return <Chip tone={mode === 'Cash' ? 'amber' : 'neutral'}>{mode === 'Cash' ? 'Cash (converted from loan)' : 'Loan'}</Chip>;
}

export function ApplicationLayout({ step, view = 'flow', children }: { step?: Step; view?: 'flow' | 'details'; children: ReactNode }) {
  const { customer, product } = application;
  if (view === 'flow' && step) viewMemory.flowStep = step;
  return (
    <MoosShell>
      <div className="mx-auto flex max-w-[1360px] flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href="#/queue" className="text-sm font-semibold text-indigo-700 no-underline">
            ← Credit work
          </a>
          <ViewToggle view={view} />
        </div>
        <section className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold">{customer.name}</h1>
                <Chip tone="green">{customer.loanType}</Chip>
                <Chip tone="blue">{customer.saleType}</Chip>
                <PurchaseModeChip />
              </div>
              <p className="text-sm text-gray-600">
                {product.name} · submitted {customer.submitted} by {customer.salesAgent}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">
                Owner: <strong className="text-gray-900">You</strong>
              </span>
              <button type="button" className="min-h-9 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
                Transfer Application
              </button>
              <button type="button" className="min-h-9 rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-900 hover:bg-gray-50">
                Apply Exemption
              </button>
              <button
                type="button"
                onClick={() => navigate('details', 'notes')}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-indigo-700 px-3 text-xs font-semibold text-white hover:bg-indigo-800"
              >
                <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
                Add Note
              </button>
            </div>
          </div>
          {view === 'flow' && <Stepper active={step} />}
        </section>
        {view === 'flow' ? (
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-5">{children}</div>
            {step === 'call' ? (
              // Stays in view while the agent scrolls the call script.
              <div className="sticky top-4 max-h-[calc(100vh-7rem)] min-w-0 flex-[1_1_320px] overflow-y-auto">
                <CallRail />
              </div>
            ) : (
              <div className="min-w-0 flex-[1_1_320px]">
                <ContextRail />
              </div>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </MoosShell>
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

export function ContextRail() {
  const { state } = useReview();
  const { customer, fateGuide, crb, nok, checks, riskFlag } = application;
  return (
    <aside aria-label="Application context" className="flex flex-col gap-4">
      <RailSection title="Customer">
        <div className="text-base font-bold">{customer.name}</div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-600">National ID</dt>
            <dd className="font-semibold">{customer.idNumber}</dd>
          </div>
          <div>
            <dt className="text-gray-600">M-Pesa</dt>
            <dd className="font-semibold">{customer.phone}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Sales agent</dt>
            <dd className="font-semibold">{customer.salesAgent}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Submitted</dt>
            <dd className="font-semibold">{customer.submitted}</dd>
          </div>
        </dl>
      </RailSection>

      <RailSection title="Fate Guide" aside={<Chip tone="orange">{`${fateGuide.band} · SDI ${fateGuide.sdi}`}</Chip>}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-600">High deposit</div>
            <div className="text-lg font-bold">{kes(fateGuide.highDepositLimit)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Normal deposit</div>
            <div className="text-lg font-bold">{kes(fateGuide.normalDepositLimit)}</div>
          </div>
        </div>
        <p className="text-sm text-gray-700">Plans: {fateGuide.plans.join(', ')}</p>
      </RailSection>

      <RailSection title="CRB" aside={<span className="text-sm font-bold">{crb.systemScore}</span>}>
        <ul className="flex flex-col gap-1.5 text-sm">
          {crb.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </RailSection>

      <RailSection title="Checks" aside={<Chip tone="green">{riskFlag}</Chip>}>
        <ul className="flex flex-col gap-1.5 text-sm">
          {checks.map((c) => (
            <li key={c.label} className="flex justify-between gap-2">
              <span>{c.label}</span>
              <span className={`font-semibold ${c.result === 'Passed' ? 'text-green-800' : 'text-amber-800'}`}>{c.result}</span>
            </li>
          ))}
        </ul>
      </RailSection>

      <RailSection title="Next of kin">
        <div className="text-sm font-semibold">{nok.name}</div>
        <div className="text-sm text-gray-700">
          {nok.relationship} · ID {nok.idNumber}
        </div>
        <div className="text-sm font-semibold text-green-800">{nok.consent}</div>
      </RailSection>

      <RailSection title="Activity">
        <ol className="flex flex-col gap-2.5 text-sm">
          {state.log.slice(0, 8).map((entry, i) => (
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

export function StepFooter({ back, children }: { back?: { label: string; to: Route }; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
      {back ? (
        <a href={`#/${back.to}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 no-underline">
          ← {back.label}
        </a>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap items-center justify-end gap-3">{children}</div>
    </div>
  );
}

function Row({ label, value, check, copy }: { label: string; value: ReactNode; check?: boolean | null; copy?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-1.5 last:border-b-0">
      <dt className="text-gray-600">{label}</dt>
      <dd className="flex items-center gap-1.5 text-right font-semibold">
        {value}
        {check === true && <span className="text-xs font-semibold text-green-800">✓ matches</span>}
        {check === false && <span className="text-xs font-semibold text-red-800">✗ differs</span>}
        {copy && <CopyButton value={copy} label={label} size="sm" />}
      </dd>
    </div>
  );
}

// What the agent cross-checks the customer's answers against during the call.
function CallRail() {
  const { state } = useReview();
  const { customer, product, crb, nok, fateGuide } = application;
  const c = state.call;
  const plan = selectedPlan(state);
  const upfront = initialPayment(state);
  const idCheck = c.idNumber ? c.idNumber.trim() === customer.idNumber : null;
  const nameCheck = c.fullName ? c.fullName.trim().toLowerCase() === customer.name.toLowerCase() : null;

  return (
    <aside aria-label="Call cross-check" className="flex flex-col gap-4">
      <RailSection title="Customer on the call">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-bold">{customer.name}</span>
          <CopyButton value={customer.name} label="customer name" size="sm" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{customer.phone}</span>
          <CopyButton value={customer.phone} label="phone number" size="sm" />
        </div>
        <dl className="text-sm">
          <Row label="National ID" value={customer.idNumber} check={idCheck} copy={customer.idNumber} />
          <Row label="Name on record" value={customer.name} check={nameCheck} />
          <Row label="Email" value={customer.email} />
          <Row label="M-Pesa on WhatsApp" value="Yes" />
        </dl>
      </RailSection>

      <RailSection title="Offer to read out" aside={<Chip tone="indigo">{plan.name}</Chip>}>
        <dl className="text-sm">
          <Row label="Device" value={product.name} />
          <Row label="Deposit" value={`${plan.deposit !== null ? kes(plan.deposit) : '—'} (${state.offer.deposit})`} />
          <Row label="Upfront incl. initial weeks" value={upfront !== null ? kes(upfront) : '—'} />
          <Row label="Weekly instalment" value={plan.weekly !== null ? kes(plan.weekly) : '—'} />
          <Row label="Term" value={plan.term} />
          <Row label="Total loan" value={plan.totalLoan !== null ? kes(plan.totalLoan) : '—'} />
        </dl>
        <a href="#/offer" className="text-xs font-semibold text-indigo-700">
          Customer wants something else? Change the offer →
        </a>
      </RailSection>

      <RailSection title="Next of kin" aside={<Chip tone="green">Consent verified</Chip>}>
        <dl className="text-sm">
          <Row label="Name" value={nok.name} />
          <Row label="Relationship" value={nok.relationship} />
          <Row label="Phone" value={details.nokConsent.sentTo} />
          <Row label="ID number" value={nok.idNumber} />
        </dl>
      </RailSection>

      <RailSection title="M-Pesa cross-check">
        <p className="text-xs text-gray-600">Check the customer's answers to the M-Pesa questions against the statement.</p>
        <dl className="text-sm">
          <Row label="Statement" value="Passed · no gaps" />
          <Row label="Frequent recipient" value="[from statement analysis]" />
          <Row label="Highest amount sent" value="[from statement analysis]" />
          <Row label="Highest amount received" value="[from statement analysis]" />
        </dl>
        <button type="button" className="self-start text-xs font-semibold text-indigo-700">
          Open statement analysis →
        </button>
      </RailSection>

      <RailSection title="Credit" aside={<span className="text-sm font-bold">{crb.systemScore}</span>}>
        <dl className="text-sm">
          <Row label="Fate Guide" value={`${fateGuide.band} · SDI ${fateGuide.sdi}`} />
          <Row label="Past defaults" value="Up to KES 50,000" />
          <Row label="Open loans" value="Up to KES 200,000" />
          <Row label="Previous MoPhones loans" value={details.history.previousLoans} />
        </dl>
      </RailSection>

      <RailSection title="From the sales agent">
        <dl className="text-sm">
          <Row label="Agent" value={customer.salesAgent} />
          <Row label="Channel" value={details.agentSubmitted.channel} />
          <Row label="Submitted" value={customer.submitted} />
          <Row label="Device needed by" value={details.agentSubmitted.deviceNeeded} />
          <Row label="Employment" value={details.agentSubmitted.employment} />
        </dl>
      </RailSection>
    </aside>
  );
}
