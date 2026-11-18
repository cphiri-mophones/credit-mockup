import { Columns3, ExternalLink, FileText, MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoosShell } from '../components/MoosShell';
import { Chip } from '../components/ui';
import { application, cashApplication, details, sampleQueueRows } from '../data/application';
import { navigate, type Route } from '../navigation';
import { cashDevice, currentStep, useReview, type ReviewState } from '../state/review';

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
  Device: 'indigo',
  Completed: 'green',
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

function cashRow(state: ReviewState): { stage: StageLabel; next: string; tab: Tab; open: Route } {
  const c = state.cash;
  if (c.stage === 'done') return { stage: 'Completed', next: 'Cash sale completed', tab: 'closed', open: 'cash-activate' };
  if (c.stage === 'creating' || c.stage === 'activating') {
    return { stage: 'Waiting on system', next: c.stage === 'creating' ? 'Order being created' : 'Cash sale being recorded', tab: 'waiting', open: 'cash-activate' };
  }
  if (c.stage === 'none') return { stage: 'Device', next: 'Choose the device', tab: 'mine', open: 'cash-device' };
  if (c.stage === 'review') return { stage: 'Activate', next: 'Order failed, retry', tab: 'mine', open: 'cash-activate' };
  return { stage: 'Activate', next: `Waiting for payment and hand-over (${cashDevice(state)?.name ?? 'device'})`, tab: 'mine', open: 'cash-activate' };
}

interface QueueRow {
  key: string;
  name: string;
  idNumber: string;
  phone: string;
  type: ReactNode;
  stage: string;
  next: string;
  waiting: string;
  callStatus: string;
  fpm: string;
  fateGuide: string;
  product: string;
  seller: string;
  channel: string;
  location: string;
  agent: string;
  submitted: string;
  owner: string;
  links?: { details: string; open: Route };
}

type ColumnId = 'idNumber' | 'phone' | 'type' | 'stage' | 'next' | 'waiting' | 'callStatus' | 'fpm' | 'fateGuide' | 'product' | 'seller' | 'channel' | 'location' | 'agent' | 'submitted' | 'owner';

const fateGuideTone = { Green: 'green', Orange: 'orange', Red: 'red' } as const;
const callStatusTone: Record<string, 'green' | 'amber' | 'red' | 'neutral'> = { 'OK reached': 'green', 'Not reached': 'amber', 'Cannot go ahead': 'red' };

const dash = <span className="text-gray-500">—</span>;

const COLUMNS: { id: ColumnId; label: string; defaultVisible: boolean; render: (r: QueueRow) => ReactNode }[] = [
  { id: 'idNumber', label: 'ID number', defaultVisible: true, render: (r) => r.idNumber },
  { id: 'phone', label: 'Phone', defaultVisible: true, render: (r) => r.phone },
  { id: 'type', label: 'Type', defaultVisible: true, render: (r) => r.type },
  { id: 'stage', label: 'Stage', defaultVisible: true, render: (r) => <Chip tone={stageTone[r.stage as StageLabel] ?? 'neutral'}>{r.stage}</Chip> },
  { id: 'next', label: 'Next action', defaultVisible: true, render: (r) => r.next },
  { id: 'callStatus', label: 'Call status', defaultVisible: true, render: (r) => (r.callStatus ? <Chip tone={callStatusTone[r.callStatus] ?? 'neutral'}>{r.callStatus}</Chip> : dash) },
  { id: 'fateGuide', label: 'Fate Guide', defaultVisible: true, render: (r) => (r.fateGuide ? <Chip tone={fateGuideTone[r.fateGuide as keyof typeof fateGuideTone] ?? 'neutral'}>{r.fateGuide}</Chip> : dash) },
  { id: 'fpm', label: 'FPM', defaultVisible: true, render: (r) => r.fpm || dash },
  { id: 'waiting', label: 'Time in queue', defaultVisible: true, render: (r) => r.waiting },
  { id: 'product', label: 'Device', defaultVisible: false, render: (r) => r.product },
  { id: 'location', label: 'Location', defaultVisible: false, render: (r) => r.location },
  { id: 'channel', label: 'Channel type', defaultVisible: false, render: (r) => r.channel },
  { id: 'seller', label: 'Seller', defaultVisible: false, render: (r) => r.seller },
  { id: 'agent', label: 'Sales agent', defaultVisible: false, render: (r) => r.agent },
  { id: 'submitted', label: 'Submitted', defaultVisible: false, render: (r) => r.submitted },
  { id: 'owner', label: 'Owner', defaultVisible: false, render: (r) => r.owner },
];

const defaultColumns = Object.fromEntries(COLUMNS.map((c) => [c.id, c.defaultVisible])) as Record<ColumnId, boolean>;

// Per user, like the saved views on the Applications explorer. The mockup has
// one signed-in user, so the key is fixed.
const COLUMNS_KEY = 'credit-review-mockup:queue-columns:chris-phiri';

function loadColumns(): Record<ColumnId, boolean> {
  try {
    const raw = localStorage.getItem(COLUMNS_KEY);
    return raw ? { ...defaultColumns, ...(JSON.parse(raw) as Partial<Record<ColumnId, boolean>>) } : defaultColumns;
  } catch {
    return defaultColumns;
  }
}

function saveColumns(columns: Record<ColumnId, boolean>) {
  try {
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns));
  } catch {
    // Private windows can refuse storage; the choice then lasts for this visit only.
  }
}

function callStatus(state: ReviewState): string {
  if (state.outcome === 'callback') return 'Not reached';
  if (!state.completed.includes('call')) return '';
  return state.call.outcome === 'ended' ? 'Cannot go ahead' : 'OK reached';
}

function ColumnsMenu({ visible, onChange }: { visible: Record<ColumnId, boolean>; onChange: (v: Record<ColumnId, boolean>) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const shown = COLUMNS.filter((c) => visible[c.id]).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="queue-columns"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
      >
        <Columns3 className="h-4 w-4" aria-hidden="true" />
        Columns
        <span className="text-xs font-normal text-gray-600">
          {shown} of {COLUMNS.length}
        </span>
      </button>
      {open && (
        <div id="queue-columns" className="absolute right-0 z-20 mt-2 flex w-64 flex-col gap-1 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <span className="px-1 pb-1 text-xs text-gray-600">Applicant and the ⋯ menu always show. Your choice is saved for you.</span>
          {COLUMNS.map((c) => (
            <label key={c.id} className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-1 text-sm hover:bg-gray-50">
              <input type="checkbox" className="h-4 w-4" checked={visible[c.id]} onChange={(e) => onChange({ ...visible, [c.id]: e.target.checked })} />
              {c.label}
            </label>
          ))}
          <button type="button" onClick={() => onChange(defaultColumns)} className="mt-1 self-start px-1 text-sm font-semibold text-indigo-700">
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}

function RowMenu({ name, links, open, onOpenChange }: { name: string; links: NonNullable<QueueRow['links']>; open: boolean; onOpenChange: (open: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const [position, setPosition] = useState({ top: 0, right: 0 });

  // Fixed so the table's horizontal scroll area cannot clip the menu.
  const toggle = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    onOpenChange(!open);
  };

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const close = () => onOpenChangeRef.current(false);
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const item = 'flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm text-gray-800 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none';
  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" aria-label={`Actions for ${name}`} style={position} className="fixed z-30 flex w-52 flex-col rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
          <button type="button" role="menuitem" className={item} onClick={() => navigate(links.open)}>
            <ExternalLink className="h-4 w-4 text-gray-600" aria-hidden="true" />
            Open application
          </button>
          <button type="button" role="menuitem" className={item} onClick={() => (location.hash = links.details)}>
            <FileText className="h-4 w-4 text-gray-600" aria-hidden="true" />
            View details
          </button>
        </div>
      )}
    </div>
  );
}

export function Queue() {
  const { state } = useReview();
  const [tab, setTab] = useState<Tab>('mine');
  const [visible, setVisible] = useState(loadColumns);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const example = exampleRow(state);
  const cash = cashRow(state);
  const { customer, product } = application;

  const changeColumns = (v: Record<ColumnId, boolean>) => {
    setVisible(v);
    saveColumns(v);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'mine', label: 'Mine' },
    { id: 'callbacks', label: 'Call backs due' },
    { id: 'waiting', label: 'Waiting on system' },
    { id: 'closed', label: 'Closed' },
  ];

  const rows: QueueRow[] = [];
  if (example.tab === tab) {
    rows.push({
      key: 'example',
      name: customer.name,
      idNumber: customer.idNumber,
      phone: customer.phone,
      type: `${customer.loanType} · ${customer.saleType}`,
      stage: example.stage,
      next: example.next,
      waiting: '4 days',
      callStatus: callStatus(state),
      fpm: '',
      fateGuide: application.fateGuide.band,
      product: product.name,
      seller: 'Mophones',
      channel: details.agentSubmitted.channel,
      location: state.call.pickupPlace || '—',
      agent: customer.salesAgent,
      submitted: customer.submitted,
      owner: 'You',
      links: { details: '#/details/overview', open: example.open },
    });
  }
  if (cash.tab === tab) {
    const c = cashApplication.customer;
    rows.push({
      key: 'cash',
      name: c.name,
      idNumber: c.idNumber,
      phone: c.phone,
      type: (
        <span className="inline-flex items-center gap-1.5">
          <Chip tone="amber">Cash</Chip> {c.saleType}
        </span>
      ),
      stage: cash.stage,
      next: cash.next,
      waiting: '10 minutes',
      callStatus: 'Not needed (cash)',
      fpm: '',
      fateGuide: '',
      product: cashDevice(state)?.name ?? 'Not chosen yet',
      seller: 'Mophones',
      channel: c.channel,
      location: c.channel,
      agent: c.salesAgent,
      submitted: c.submitted,
      owner: 'You',
      links: { details: '#/cash-details/overview', open: cash.open },
    });
  }
  for (const r of sampleQueueRows) {
    const inTab = tab === 'mine' ? r.stage === 'Call' || r.stage === 'Decide' : tab === 'waiting' ? r.stage === 'Waiting on system' : false;
    if (inTab) rows.push({ ...r, key: r.name, type: r.loan });
  }

  const columns = COLUMNS.filter((c) => visible[c.id]);

  return (
    <MoosShell>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold">Credit work</h1>
            <p className="max-w-2xl text-sm text-gray-600">
              One list from scoring to activation. Open an application and work it end to end; it stays yours until it is activated, rejected or sent back. Cash applications skip straight
              to device and activation.
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Queue views" className="flex flex-wrap gap-1 rounded-xl bg-[#E9EBF2] p-1">
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
          <ColumnsMenu visible={visible} onChange={changeColumns} />
        </div>

        <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-600">
                <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                  Applicant
                </th>
                {columns.map((c) => (
                  <th key={c.id} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                    {c.label}
                  </th>
                ))}
                <th scope="col" className="sticky right-0 bg-white px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.key}
                  onClick={r.links ? () => navigate(r.links!.open) : undefined}
                  className={`group border-t border-gray-200 ${r.links ? 'cursor-pointer hover:bg-indigo-50/40' : 'text-gray-600'}`}
                >
                  <td className="px-4 py-3.5">
                    {r.links ? (
                      <a href={`#/${r.links.open}`} onClick={(e) => e.stopPropagation()} className="whitespace-nowrap font-semibold text-gray-900 no-underline group-hover:text-indigo-800">
                        {r.name}
                      </a>
                    ) : (
                      <>
                        <div className="whitespace-nowrap font-semibold">{r.name}</div>
                        <div className="text-xs">Sample row, not clickable</div>
                      </>
                    )}
                  </td>
                  {columns.map((c) => (
                    <td key={c.id} className={`px-4 py-3.5 ${c.id === 'next' ? 'min-w-[200px]' : 'whitespace-nowrap'}`}>
                      {c.render(r)}
                    </td>
                  ))}
                  <td className="sticky right-0 bg-white px-2 py-2 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)] group-hover:bg-[#f7f8fd]">
                    {r.links && <RowMenu name={r.name} links={r.links} open={menuFor === r.key} onOpenChange={(o) => setMenuFor(o ? r.key : null)} />}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="border-t border-gray-200">
                  <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-600">
                    Nothing here right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <p className="max-w-3xl text-sm text-gray-600">
          The Stage column replaces the separate Scoring, Calling and Decisioning queues. "Waiting on system" holds applications whose CRB report, Fate Guide, order or sale is still
          being prepared; they come back to Mine when ready. Click a row to open it; the ⋯ menu on the right, always in view, also has View details.
        </p>
      </div>
    </MoosShell>
  );
}
