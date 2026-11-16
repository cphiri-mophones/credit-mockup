import { useState } from 'react';
import { MoosShell } from '../components/MoosShell';
import { Chip } from '../components/ui';
import { application, sampleQueueRows } from '../data/application';
import { navigate, type Route } from '../navigation';
import { currentStep, useReview, type ReviewState } from '../state/review';

type Tab = 'mine' | 'callbacks' | 'waiting' | 'closed';

const stageTone = {
  Verify: 'indigo',
  Offer: 'indigo',
  Call: 'blue',
  Decide: 'purple',
  Activate: 'green',
  'Waiting on system': 'amber',
  'Call back due': 'blue',
  'Sent back to agent': 'red',
  Rejected: 'red',
  Activated: 'green',
} as const;

type StageLabel = keyof typeof stageTone;

function exampleRow(state: ReviewState): { stage: StageLabel; next: string; tab: Tab; open: Route } {
  if (state.outcome === 'activated') return { stage: 'Activated', next: 'Loan activated', tab: 'closed', open: 'activate' };
  if (state.outcome === 'rejected') return { stage: 'Rejected', next: 'Application closed', tab: 'closed', open: 'decide' };
  if (state.outcome === 'sent-back') return { stage: 'Sent back to agent', next: 'Waiting for the sales agent to resubmit', tab: 'closed', open: 'verify' };
  if (state.outcome === 'callback') {
    const when = [state.call.callbackDate, state.call.callbackTime].filter(Boolean).join(' ');
    return { stage: 'Call back due', next: `Call back ${when}`, tab: 'callbacks', open: 'call' };
  }
  const stage = state.activation.stage;
  if (stage === 'creating' || stage === 'activating') {
    return { stage: 'Waiting on system', next: stage === 'creating' ? 'Order being created' : 'Sale and loan being created', tab: 'waiting', open: 'activate' };
  }
  const step = currentStep(state);
  const next: Record<typeof step, string> = {
    verify: 'Mark documents, pick final risk score',
    offer: 'Confirm device and plan',
    call: 'Call the customer',
    decide: 'Approve, offer cash or reject',
    activate: 'Waiting for payment and hand-over',
  };
  const label = (step.charAt(0).toUpperCase() + step.slice(1)) as StageLabel;
  return { stage: label, next: next[step], tab: 'mine', open: step };
}

export function Queue() {
  const { state } = useReview();
  const [tab, setTab] = useState<Tab>('mine');
  const example = exampleRow(state);
  const { customer } = application;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'mine', label: 'Mine' },
    { id: 'callbacks', label: 'Call backs due' },
    { id: 'waiting', label: 'Waiting on system' },
    { id: 'closed', label: 'Closed' },
  ];

  const samples = sampleQueueRows.filter((r) => {
    if (tab === 'mine') return r.stage === 'Call' || r.stage === 'Decide';
    if (tab === 'waiting') return r.stage === 'Waiting on system';
    return false;
  });

  return (
    <MoosShell>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold">Credit work</h1>
            <p className="max-w-2xl text-sm text-gray-600">
              One list from scoring to activation. Open an application and work it end to end; it stays yours until it is activated, rejected or sent back.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(example.tab === 'closed' ? 'queue' : example.open)}
            disabled={example.tab === 'closed'}
            className="min-h-11 rounded-lg bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:bg-gray-200 disabled:text-gray-600"
          >
            Take next application
          </button>
        </div>

        <div role="tablist" aria-label="Queue views" className="flex flex-wrap gap-1 self-start rounded-xl bg-[#E9EBF2] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-10 rounded-lg px-4 text-sm ${tab === t.id ? 'bg-white font-semibold' : 'text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-600">
                <th scope="col" className="px-4 py-3 font-semibold">Applicant</th>
                <th scope="col" className="px-4 py-3 font-semibold">Loan</th>
                <th scope="col" className="px-4 py-3 font-semibold">Stage</th>
                <th scope="col" className="px-4 py-3 font-semibold">Next action</th>
                <th scope="col" className="px-4 py-3 font-semibold">In queue</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {example.tab === tab && (
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold">{customer.name}</div>
                    <div className="text-xs text-gray-600">
                      ID {customer.idNumber} · {customer.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {customer.loanType} · {customer.saleType}
                  </td>
                  <td className="px-4 py-3.5">
                    <Chip tone={stageTone[example.stage]}>{example.stage}</Chip>
                  </td>
                  <td className="px-4 py-3.5">{example.next}</td>
                  <td className="px-4 py-3.5">4 days</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-4">
                      <a href="#/details/overview" className="font-semibold text-gray-700">
                        Details
                      </a>
                      <a href={`#/${example.open}`} className="font-semibold text-indigo-700">
                        Open
                      </a>
                    </div>
                  </td>
                </tr>
              )}
              {samples.map((r) => (
                <tr key={r.name} className="border-t border-gray-200 text-gray-600">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs">Sample row, not clickable</div>
                  </td>
                  <td className="px-4 py-3.5">{r.loan}</td>
                  <td className="px-4 py-3.5">
                    <Chip tone={stageTone[r.stage as StageLabel] ?? 'neutral'}>{r.stage}</Chip>
                  </td>
                  <td className="px-4 py-3.5">{r.next}</td>
                  <td className="px-4 py-3.5">{r.waiting}</td>
                  <td className="px-4 py-3.5" />
                </tr>
              ))}
              {example.tab !== tab && samples.length === 0 && (
                <tr className="border-t border-gray-200">
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                    Nothing here right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <p className="max-w-3xl text-sm text-gray-600">
          The Stage column replaces the separate Scoring, Calling and Decisioning queues. "Waiting on system" holds applications whose CRB report, Fate Guide, order or sale is still
          being prepared; they come back to Mine when ready.
        </p>
      </div>
    </MoosShell>
  );
}
