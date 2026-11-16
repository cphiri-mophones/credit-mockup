import { useState, type ReactNode } from 'react';
import { ApplicationLayout, Stepper } from '../components/layout';
import { Button, Card, CheckCircle, Chip, PendingCircle } from '../components/ui';
import { application, details, documents, kes, plans } from '../data/application';
import { navigate, viewMemory } from '../navigation';
import { initialPayment, now, selectedPlan, useReview, type ReviewState, type Step } from '../state/review';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'checks', label: 'Validation checks' },
  { id: 'documents', label: 'KYC documents' },
  { id: 'prescreening', label: 'Pre-screening' },
  { id: 'product', label: 'Product and offer' },
  { id: 'crb', label: 'CRB' },
  { id: 'risk', label: 'Risk assessment' },
  { id: 'call', label: 'Credit call' },
  { id: 'decision', label: 'Decision and activation' },
  { id: 'activity', label: 'Audit trail' },
  { id: 'notes', label: 'Notes' },
  { id: 'raw', label: 'Raw details' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function Fields({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5 border-b border-gray-100 pb-2">
          <dt className="text-xs text-gray-600">{item.label}</dt>
          <dd className="text-sm font-semibold text-gray-900">{item.value === '' || item.value === null ? '—' : item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EditIn({ step, label }: { step: Step; label?: string }) {
  return (
    <button type="button" onClick={() => navigate(step)} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">
      {label ?? 'Edit in the flow'} →
    </button>
  );
}

function ResultChip({ result }: { result: string }) {
  const tone = result === 'Passed' ? 'green' : result.startsWith('Waiting') ? 'amber' : 'red';
  return <Chip tone={tone}>{result}</Chip>;
}

function CheckTable({ title, rows }: { title: string; rows: readonly { check: string; result: string; checked: string }[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
              <th scope="col" className="px-3 py-2 font-semibold">Check</th>
              <th scope="col" className="px-3 py-2 font-semibold">Result</th>
              <th scope="col" className="px-3 py-2 font-semibold">Checked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.check} className="border-t border-gray-200">
                <td className="px-3 py-2 font-medium">{r.check}</td>
                <td className="px-3 py-2">
                  <ResultChip result={r.result} />
                </td>
                <td className="px-3 py-2 text-gray-700">{r.checked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function stageLabel(state: ReviewState): string {
  if (state.outcome === 'activated') return 'Activated';
  if (state.outcome === 'rejected') return 'Rejected';
  if (state.outcome === 'sent-back') return 'Sent back to agent';
  if (state.outcome === 'callback') return 'Call back due';
  const done = state.completed.length;
  return ['Verify', 'Offer', 'Call', 'Decide', 'Activate'][Math.min(done, 4)];
}

function Overview({ state }: { state: ReviewState }) {
  const { customer, product } = application;
  const plan = selectedPlan(state);
  const upfront = initialPayment(state);
  return (
    <>
      <Card title="Progress" description="Where the application is in the credit flow. Open a step to work on it.">
        <Stepper />
      </Card>
      <Card title="Application">
        <Fields
          items={[
            { label: 'Stage', value: stageLabel(state) },
            { label: 'Loan type', value: `${customer.loanType} · ${customer.saleType}` },
            { label: 'Purchase mode', value: customer.purchaseMode },
            { label: 'Submitted', value: `${customer.submitted} by ${customer.salesAgent}` },
            { label: 'Channel', value: details.agentSubmitted.channel },
            { label: 'Application ID', value: application.id },
          ]}
        />
      </Card>
      <Card title="Customer">
        <Fields
          items={[
            { label: 'Full name', value: customer.name },
            { label: 'National ID', value: customer.idNumber },
            { label: 'M-Pesa number', value: customer.phone },
            { label: 'Email', value: customer.email },
            { label: 'M-Pesa number on WhatsApp', value: 'Yes' },
            { label: 'Most recent phone', value: details.history.mostRecentPhone },
            { label: 'Previous loans', value: details.history.previousLoans },
            { label: 'Open loans', value: details.history.openLoans },
            { label: 'Defaulted loan', value: details.history.defaultedLoan },
          ]}
        />
      </Card>
      <Card title="Offer at a glance" actions={<EditIn step="offer" />}>
        <Fields
          items={[
            { label: 'Device', value: product.name },
            { label: 'Plan', value: plan.name },
            { label: 'Deposit', value: `${state.offer.deposit === 'high' ? 'High' : 'Normal'}${plan.deposit !== null ? ` · ${kes(plan.deposit)}` : ''}` },
            { label: 'Upfront payment', value: upfront !== null ? kes(upfront) : '—' },
            { label: 'Weekly instalment', value: plan.weekly !== null ? kes(plan.weekly) : '—' },
            { label: 'Total loan', value: plan.totalLoan !== null ? kes(plan.totalLoan) : '—' },
          ]}
        />
      </Card>
    </>
  );
}

function Checks() {
  const { validations, nokConsent } = details;
  return (
    <Card title="Validation checks" description="Run automatically when the sales agent submitted the application." actions={<Button variant="secondary">Re-run checks</Button>}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CheckTable title="Customer" rows={validations.customer} />
        <CheckTable title="Next of kin" rows={validations.nextOfKin} />
        <CheckTable title="Prospect" rows={validations.prospect} />
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Next of kin consent</h3>
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2">
              <Chip tone="green">Verified</Chip>
            </div>
            <Fields
              items={[
                { label: 'Code sent to', value: nokConsent.sentTo },
                { label: 'Sent', value: nokConsent.sentAt },
                { label: 'Verified', value: nokConsent.verifiedAt },
                { label: 'Verified by', value: nokConsent.verifiedBy },
              ]}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function Documents({ state }: { state: ReviewState }) {
  return (
    <Card title="KYC documents" description="Validity is set in the Verify step." actions={<EditIn step="verify" />}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {documents.map((d) => {
          const v = state.docs[d.id];
          return (
            <div key={d.id} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
              <div aria-hidden="true" className="flex h-28 items-center justify-center rounded-md bg-gray-200 text-sm font-bold text-gray-700">
                {d.thumb}
              </div>
              <span className="text-sm font-semibold">{d.name}</span>
              <span className="text-xs text-gray-600">{d.meta}</span>
              <Chip tone={v === 'valid' ? 'green' : v === 'invalid' ? 'red' : 'amber'}>{v === 'valid' ? 'Valid' : v === 'invalid' ? 'Invalid' : 'Not marked'}</Chip>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PreScreening() {
  const { fateGuide } = application;
  return (
    <>
      <Card title="M-Pesa gaps and recent airtime">
        <Fields items={[{ label: 'Gaps', value: details.mpesaGaps }]} />
      </Card>
      <Card title="Fate Guide" actions={<Chip tone="orange">{`${fateGuide.band} · SDI ${fateGuide.sdi}`}</Chip>}>
        <p className="text-sm text-gray-800">
          SDI {fateGuide.sdi} is {fateGuide.band} (35.0%–100.0%). {kes(fateGuide.highDepositLimit)} approved at high deposit. Max at normal deposit: {kes(fateGuide.normalDepositLimit)}. On the
          following available plans: {fateGuide.plans.join(', ')}.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary">View devices</Button>
          <Button variant="secondary">See why</Button>
        </div>
      </Card>
    </>
  );
}

function Product({ state }: { state: ReviewState }) {
  const { product } = application;
  return (
    <>
      <Card title={product.name} description={`Cash price ${kes(product.cashPrice)}`} actions={<EditIn step="offer" label="Change device or plan" />}>
        <Fields items={details.productSpecs.map((s) => ({ label: s.label, value: s.value }))} />
      </Card>
      <Card title="Price plans">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <th scope="col" className="px-3 py-2 font-semibold">Plan</th>
                <th scope="col" className="px-3 py-2 font-semibold">Term</th>
                <th scope="col" className="px-3 py-2 font-semibold">Deposit</th>
                <th scope="col" className="px-3 py-2 font-semibold">Weekly</th>
                <th scope="col" className="px-3 py-2 font-semibold">Total loan</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className={`border-t border-gray-200 ${p.id === state.offer.planId ? 'bg-indigo-50 font-semibold' : ''}`}>
                  <td className="px-3 py-2">
                    {p.name} {p.id === state.offer.planId && <Chip tone="indigo">Selected</Chip>}
                  </td>
                  <td className="px-3 py-2">{p.term}</td>
                  <td className="px-3 py-2">{p.deposit !== null ? kes(p.deposit) : '—'}</td>
                  <td className="px-3 py-2">{p.weekly !== null ? kes(p.weekly) : '—'}</td>
                  <td className="px-3 py-2">{p.totalLoan !== null ? kes(p.totalLoan) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Crb({ state }: { state: ReviewState }) {
  return (
    <>
      <Card title="CRB report" actions={<div className="flex gap-2"><Button variant="secondary">View report</Button><Button variant="secondary">Download</Button></div>}>
        <Fields items={details.crbReport.map((r) => ({ label: r.label, value: r.value }))} />
      </Card>
      <Card title="Score" actions={<EditIn step="verify" />}>
        <Fields
          items={[
            { label: 'System score', value: application.crb.systemScore },
            { label: 'Final risk score', value: state.risk.finalScore ? `${state.risk.finalScore} (overridden)` : `${application.crb.systemScore} (system)` },
          ]}
        />
      </Card>
    </>
  );
}

function Risk({ state }: { state: ReviewState }) {
  return (
    <Card title="Risk assessment" actions={<EditIn step="verify" />}>
      <Fields
        items={[
          { label: 'Combined risk flag', value: application.riskFlag },
          { label: 'Risk flag', value: state.risk.flag },
          { label: 'Previous loans', value: state.risk.previousLoans },
          { label: 'High deposit override', value: state.risk.highDepositOverride },
        ]}
      />
    </Card>
  );
}

function CallDetails({ state }: { state: ReviewState }) {
  const c = state.call;
  const saved = state.completed.includes('call') || state.outcome === 'callback';
  if (!saved) {
    return <Card title="Credit call" description="No call saved yet." actions={<EditIn step="call" label="Go to the call" />} />;
  }
  const outcome = c.outcome === 'reached' ? 'Reached: ready for a decision' : c.outcome === 'callback' ? `Call back ${c.callbackDate} ${c.callbackTime}` : `Cannot go ahead: ${c.endReason}`;
  return (
    <>
      <Card title="Call" actions={<EditIn step="call" />}>
        <Fields
          items={[
            { label: 'Outcome', value: outcome },
            { label: 'Script', value: 'Short script (next of kin consent verified)' },
            { label: 'May I proceed?', value: c.proceed },
            { label: 'Notes', value: c.notes },
          ]}
        />
      </Card>
      <Card title="Identity and consent">
        <Fields
          items={[
            { label: 'ID number given', value: c.idNumber ? `${c.idNumber}${c.idNumber === application.customer.idNumber ? ' (matches)' : ' (does not match)'}` : '' },
            { label: 'Full name given', value: c.fullName },
            { label: 'Other phone number', value: c.otherPhone },
            { label: 'Data use consent', value: c.dataConsent },
            { label: 'Hospicash consent', value: c.hospicash },
            { label: 'Contract terms', value: c.terms },
          ]}
        />
      </Card>
      <Card title="Customer information from the call">
        <Fields
          items={[
            { label: 'General location', value: c.location },
            { label: 'Who pays', value: c.payer },
            { label: 'Main use of the phone', value: c.primaryUse },
            { label: 'Main source of income', value: c.income },
            { label: 'Renewed-phone notice', value: c.renewedAware },
            { label: 'Understanding', value: c.understanding },
            { label: 'M-Pesa questions asked', value: c.mpesaAsked.length ? `${c.mpesaAsked.length} asked` : '' },
            { label: 'M-Pesa answers satisfactory', value: c.mpesaSatisfactory },
          ]}
        />
      </Card>
      <Card title="Agent submitted vs credit call">
        <Fields
          items={[
            { label: 'Location (agent)', value: details.agentSubmitted.location },
            { label: 'Home location (call)', value: c.homeLocation },
            { label: 'Employment (agent)', value: details.agentSubmitted.employment },
            { label: 'Income (call)', value: c.income },
            { label: 'Pick-up', value: [c.pickupPlace, c.pickupDate, c.pickupTime].filter(Boolean).join(' · ') },
          ]}
        />
      </Card>
    </>
  );
}

function Decision({ state }: { state: ReviewState }) {
  const d = state.decision;
  const a = state.activation;
  const decided = state.completed.includes('decide');
  const checks = [
    { label: 'Order created', ok: a.stage === 'waiting' || a.stage === 'activating' || a.stage === 'done' },
    { label: 'Initial payment verified', ok: a.paid },
    { label: 'Hand-over code matched', ok: a.handedOver },
    { label: 'Device locked', ok: a.locked },
    { label: 'Sale activated', ok: a.stage === 'done' },
  ];
  return (
    <>
      <Card title="Decision" actions={<EditIn step="decide" />}>
        {decided ? (
          <Fields
            items={[
              { label: 'Decision', value: d.choice === 'loan' ? 'Approve loan' : d.choice === 'cash' ? `Approve cash offer (${d.cashType})` : `Reject (${d.rejectReason})` },
              { label: 'After approval', value: d.choice === 'reject' ? '—' : d.afterApproval === 'delivery' ? 'Deposit and delivery' : 'Sell cash' },
              { label: 'Note', value: d.note },
            ]}
          />
        ) : (
          <p className="text-sm text-gray-600">No decision yet.</p>
        )}
      </Card>
      <Card title="Activation" actions={a.stage !== 'none' ? <EditIn step="activate" label="Go to activation" /> : undefined}>
        {a.stage === 'none' ? (
          <p className="text-sm text-gray-600">Starts when the application is approved.</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold">
                {c.ok ? <CheckCircle size="sm" /> : <PendingCircle />}
                {c.label}
              </li>
            ))}
          </ul>
        )}
        {a.stage !== 'none' && (
          <Fields
            items={[
              { label: 'Device IMEI', value: a.handedOver ? application.device.imei : 'Assigned at hand-over' },
              { label: 'Device management', value: application.device.mdmProvider },
              { label: 'Activated as', value: a.stage === 'done' ? (a.activateAs === 'loan' ? 'Loan' : 'Cash sale') : '—' },
            ]}
          />
        )}
      </Card>
    </>
  );
}

function Activity({ state }: { state: ReviewState }) {
  return (
    <Card title="Audit trail" description="Every change to this application, newest first.">
      <ol className="flex flex-col">
        {state.log.map((entry, i) => (
          <li key={`${entry.at}-${i}`} className="flex flex-wrap gap-x-6 gap-y-0.5 border-t border-gray-100 py-2.5 text-sm first:border-t-0">
            <span className="w-32 flex-none text-gray-600">{entry.at}</span>
            <span>{entry.text}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Notes({ state }: { state: ReviewState }) {
  const { update } = useReview();
  const [text, setText] = useState('');
  const add = () => {
    if (!text.trim()) return;
    const note = { at: now(), by: 'Chris Phiri', text: text.trim() };
    update((s) => ({ ...s, notes: [note, ...s.notes], log: [{ at: note.at, text: 'Note added' }, ...s.log] }));
    setText('');
  };
  return (
    <Card title="Notes">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-gray-700">Add a note</span>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </label>
      <div>
        <Button onClick={add} disabled={!text.trim()}>
          Add note
        </Button>
      </div>
      {state.notes.length === 0 ? (
        <p className="text-sm text-gray-600">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {state.notes.map((n, i) => (
            <li key={`${n.at}-${i}`} className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-600">
                {n.by} · {n.at}
              </div>
              <p className="mt-1 whitespace-pre-line text-sm">{n.text}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Raw({ state }: { state: ReviewState }) {
  return (
    <Card title="Raw details" description="The application as stored by this mockup.">
      <pre className="max-h-[520px] overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
        {JSON.stringify({ application: { id: application.id, customer: application.customer, product: application.product }, ...state }, null, 2)}
      </pre>
    </Card>
  );
}

export function Details({ tab }: { tab: string }) {
  const { state } = useReview();
  const active: TabId = (TABS.find((t) => t.id === tab)?.id ?? 'overview') as TabId;
  viewMemory.detailsTab = active;

  const content: Record<TabId, ReactNode> = {
    overview: <Overview state={state} />,
    checks: <Checks />,
    documents: <Documents state={state} />,
    prescreening: <PreScreening />,
    product: <Product state={state} />,
    crb: <Crb state={state} />,
    risk: <Risk state={state} />,
    call: <CallDetails state={state} />,
    decision: <Decision state={state} />,
    activity: <Activity state={state} />,
    notes: <Notes state={state} />,
    raw: <Raw state={state} />,
  };

  return (
    <ApplicationLayout view="details">
      <div className="flex flex-col gap-5">
        <div role="tablist" aria-label="Application details" className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === active}
              onClick={() => navigate('details', t.id)}
              className={`min-h-10 whitespace-nowrap rounded-lg px-3.5 text-sm ${
                t.id === active ? 'bg-white font-semibold text-indigo-800 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="flex flex-col gap-5">
          {content[active]}
        </div>
      </div>
    </ApplicationLayout>
  );
}
