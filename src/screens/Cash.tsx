import { useState, type ReactNode } from 'react';
import { CashLayout, CashStepper } from '../components/CashLayout';
import { HandoverPhotos } from '../components/HandoverPhotos';
import { StepFooter } from '../components/layout';
import { Button, Card, CheckCircle, Chip, MockPanel, PendingCircle, Spinner, Stat } from '../components/ui';
import { cashApplication, cashCatalog, kes, type CashDeviceId } from '../data/application';
import { navigate, viewMemory } from '../navigation';
import { cashDevice, now, useReview, withCashLog, type ReviewState } from '../state/review';

const SHORTFALL = 5000;

export function CashDevice() {
  const { state, update } = useReview();
  const [query, setQuery] = useState('');
  const locked = state.cash.stage !== 'none';
  const device = cashDevice(state);
  const shown = cashCatalog.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()));

  const choose = (id: CashDeviceId) => update((s) => ({ ...s, cash: { ...s.cash, deviceId: id } }));
  const confirm = () => {
    if (!device) return;
    update((s) =>
      withCashLog(
        withCashLog({ ...s, cash: { ...s.cash, completed: [...s.cash.completed.filter((c) => c !== 'device'), 'device'], stage: 'creating' } }, `Device chosen: ${device.name}`),
        'Order creation started',
      ),
    );
    navigate('cash-activate');
  };

  return (
    <CashLayout step="device">
      <Card
        title="Choose the device"
        description={locked ? 'The order has been created for this device. To change it, ask ops to cancel the order first.' : 'Pick the phone the customer is buying. The cash price is what they pay in full at activation.'}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-700">Search devices</span>
          <input
            type="search"
            value={query}
            disabled={locked}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Brand, model or storage"
            className="min-h-11 rounded-lg border border-gray-300 px-3 text-sm disabled:bg-gray-50"
          />
        </label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {shown.map((d) => {
            const selected = d.id === state.cash.deviceId;
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={selected}
                disabled={!d.inStock || locked}
                onClick={() => choose(d.id)}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-left disabled:cursor-not-allowed ${
                  selected ? 'border-2 border-indigo-700 bg-indigo-50' : 'border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50'
                }`}
              >
                <span aria-hidden="true" className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-gray-200 text-[10px] font-bold text-gray-700">
                  {d.name.split(' ')[0]}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className={`text-sm ${selected ? 'font-bold' : 'font-semibold'}`}>{d.name}</span>
                  <span className="text-sm text-gray-700">
                    {kes(d.cashPrice)}
                    {!d.seen && <span className="text-xs text-gray-500"> · illustrative price</span>}
                  </span>
                </span>
                <Chip tone={d.inStock ? 'green' : 'red'}>{d.inStock ? 'In stock' : 'Out of stock'}</Chip>
              </button>
            );
          })}
          {shown.length === 0 && <p className="text-sm text-gray-600">No devices match "{query}".</p>}
        </div>
      </Card>

      <Card title="Amount to collect">
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Stat label="Device" value={device?.name ?? 'Not chosen'} />
          <Stat label="Cash price" value={device ? kes(device.cashPrice) : '—'} />
          <Stat label="Paid at" value="Activation, in full" />
        </dl>
      </Card>

      <StepFooter>
        <div className="flex flex-col items-end gap-1">
          {locked ? (
            <Button variant="secondary" onClick={() => navigate('cash-activate')}>
              Go to activation →
            </Button>
          ) : (
            <Button disabled={!device} onClick={confirm}>
              Create order and go to activation →
            </Button>
          )}
          <span className="text-xs text-gray-600">{device ? 'The order and delivery are created as soon as you continue.' : 'Choose a device to continue'}</span>
        </div>
      </StepFooter>
    </CashLayout>
  );
}

export function CashActivate() {
  const { state, update } = useReview();
  const c = state.cash;
  const device = cashDevice(state);
  const [payerConfirmed, setPayerConfirmed] = useState(false);

  const set = (patch: Partial<typeof c>, log?: string) =>
    update((s) => {
      const next = { ...s, cash: { ...s.cash, ...patch } };
      return log ? withCashLog(next, log) : next;
    });

  if (!device || c.stage === 'none') {
    return (
      <CashLayout step="activate">
        <Card title="Activate" description="Choose the device first. The order is created when you continue from the Device step." />
      </CashLayout>
    );
  }

  const price = device.cashPrice;
  const paidAmount = c.payment === 'full' ? price : c.payment === 'short' ? price - SHORTFALL : 0;
  const orderReady = c.stage === 'waiting' || c.stage === 'activating' || c.stage === 'done';
  const done = c.stage === 'done';
  const paidInFull = c.payment === 'full';
  const payerOk = c.payment !== 'none' && (c.payerMatches || payerConfirmed);
  const checks = [
    { label: 'Order created', ok: orderReady, state: orderReady ? (c.handedOver ? 'Collected' : 'Pending collection') : 'Being created' },
    { label: 'Paid in full', ok: paidInFull, state: c.payment === 'full' ? kes(price) : c.payment === 'short' ? `${kes(SHORTFALL)} still due` : 'Not received yet' },
    { label: 'Payer', ok: payerOk, state: c.payment === 'none' ? 'Shown after payment' : c.payerMatches ? 'Same as customer' : payerConfirmed ? 'Different, confirmed by you' : 'Different from customer' },
    { label: 'Hand-over code', ok: c.handedOver, state: c.handedOver ? 'Codes match' : 'Waiting for hand-over' },
    { label: 'IMEI recorded', ok: c.handedOver, state: c.handedOver ? 'Recorded at hand-over' : 'Recorded at hand-over' },
  ];
  const ready = c.stage === 'waiting' && checks.every((x) => x.ok);

  return (
    <CashLayout step="activate">
      {c.stage === 'creating' && (
        <section className="flex flex-wrap items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <Spinner />
          <div className="flex flex-[1_1_320px] flex-col gap-1 text-blue-950">
            <h2 className="text-[17px] font-bold">Creating the order and delivery</h2>
            <p className="text-sm">This usually takes a few seconds. You can leave; it comes back to Mine when ready.</p>
          </div>
        </section>
      )}

      {c.stage === 'review' && (
        <Card
          title={<span className="text-red-800">The order could not be created</span>}
          description="A duplicate order already exists for this application (mock reason). Ask ops to cancel it, then retry."
          actions={<Button onClick={() => set({ stage: 'creating' }, 'Retried order creation')}>Retry order creation</Button>}
        />
      )}

      {orderReady && (
        <>
          <Card
            title={done ? 'Cash sale completed' : 'Ready to complete the sale?'}
            description={done ? 'The sale is recorded. The application has left your queue.' : ready ? 'Everything is in place. Complete the sale below.' : 'Waiting for the full payment and the hand-over.'}
          >
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
              {checks.map((x) => (
                <li key={x.label} className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                  {x.ok ? <CheckCircle size="sm" /> : <PendingCircle />}
                  <span className="flex flex-col">
                    <span className="text-sm font-bold">{x.label}</span>
                    <span className="text-xs text-gray-600">{x.state}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Payment" actions={<Chip tone={paidInFull ? 'green' : c.payment === 'short' ? 'red' : 'amber'}>{paidInFull ? 'Paid in full' : c.payment === 'short' ? 'Short' : 'Not received'}</Chip>}>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Cash price" value={kes(price)} />
              <Stat label="Received" value={kes(paidAmount)} tone={paidInFull ? 'green' : undefined} />
              <Stat label="Balance due" value={kes(price - paidAmount)} tone={price - paidAmount > 0 ? 'amber' : 'green'} />
              <Stat label="Paid at" value={c.payment === 'none' ? '—' : 'Just now (mock)'} />
            </dl>
            {c.payment !== 'none' && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border border-gray-200 text-sm">
                  <caption className="pb-2 text-left text-sm font-bold">Who paid</caption>
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600">
                      <th scope="col" className="px-3 py-2 font-semibold" />
                      <th scope="col" className="px-3 py-2 font-semibold">Customer</th>
                      <th scope="col" className="px-3 py-2 font-semibold">Payer</th>
                      <th scope="col" className="px-3 py-2 font-semibold">Same?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <th scope="row" className="px-3 py-2 text-left font-semibold">Name</th>
                      <td className="px-3 py-2">{cashApplication.customer.name}</td>
                      <td className="px-3 py-2">{c.payerMatches ? cashApplication.customer.name : 'Another person'}</td>
                      <td className={`px-3 py-2 font-semibold ${c.payerMatches ? 'text-green-800' : 'text-red-800'}`}>{c.payerMatches ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <th scope="row" className="px-3 py-2 text-left font-semibold">Phone</th>
                      <td className="px-3 py-2">{cashApplication.customer.phone}</td>
                      <td className="px-3 py-2">{c.payerMatches ? cashApplication.customer.phone : '2547•••••901'}</td>
                      <td className={`px-3 py-2 font-semibold ${c.payerMatches ? 'text-green-800' : 'text-red-800'}`}>{c.payerMatches ? 'Yes' : 'No'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {c.payment !== 'none' && !c.payerMatches && (
              <label className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                <input type="checkbox" className="mt-0.5 h-4 w-4" checked={payerConfirmed} onChange={(e) => setPayerConfirmed(e.target.checked)} disabled={done} />
                Someone else paid. I checked with the customer that this payer is allowed to pay for them.
              </label>
            )}
          </Card>

          <Card title="Hand-over" actions={<Chip tone={c.handedOver ? 'green' : 'amber'}>{c.handedOver ? 'Collected' : 'Ready for pick-up'}</Chip>}>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Stat label="Device" value={device.name} />
              <Stat label="IMEI" value={c.handedOver ? cashApplication.imei : 'Recorded at hand-over'} />
              <Stat label="Codes match" value={c.handedOver ? 'Yes' : 'Waiting'} tone={c.handedOver ? 'green' : 'amber'} />
            </dl>
            <HandoverPhotos
              taken={c.handedOver}
              holder={cashApplication.customer}
              stamp="Rider · 16 Nov 2026 14:20"
            />
          </Card>

          {!done && (
            <MockPanel>
              <Button variant="secondary" disabled={paidInFull} onClick={() => set({ payment: 'full', payerMatches: true }, `Payment received: ${kes(price)}`)}>
                Customer pays in full
              </Button>
              <Button variant="secondary" disabled={c.payment !== 'none'} onClick={() => set({ payment: 'short', payerMatches: true }, `Payment received: ${kes(price - SHORTFALL)}`)}>
                Customer pays {kes(SHORTFALL)} short
              </Button>
              <Button variant="secondary" disabled={c.payment !== 'none'} onClick={() => set({ payment: 'full', payerMatches: false }, 'Payment received from another payer')}>
                Someone else pays in full
              </Button>
              <Button variant="secondary" disabled={c.handedOver} onClick={() => set({ handedOver: true }, 'Rider completed the hand-over, codes match')}>
                Rider hands over the phone
              </Button>
            </MockPanel>
          )}

          {c.stage === 'activating' && (
            <section className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5">
              <Spinner />
              <span className="text-sm font-semibold">Recording the cash sale…</span>
            </section>
          )}
        </>
      )}

      {c.stage === 'creating' && (
        <MockPanel>
          <Button variant="secondary" onClick={() => set({ stage: 'review' }, 'Order creation failed')}>
            Make order creation fail
          </Button>
        </MockPanel>
      )}

      <StepFooter back={{ label: 'Back to device', to: 'cash-device' }}>
        {done ? (
          <>
            <span className="text-sm font-semibold text-green-800">Cash sale completed. Nothing left to do here.</span>
            <Button onClick={() => navigate('queue')}>Back to Credit work</Button>
          </>
        ) : (
          <>
            {!ready && orderReady && <span className="text-sm text-gray-600">Completing unlocks when the full payment, payer and hand-over are all in.</span>}
            <Button variant="success" disabled={!ready} onClick={() => set({ stage: 'activating' }, 'Cash sale completion requested')}>
              Complete cash sale
            </Button>
          </>
        )}
      </StepFooter>
    </CashLayout>
  );
}

const CASH_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sale', label: 'Device and payment' },
  { id: 'activity', label: 'Audit trail' },
  { id: 'notes', label: 'Notes' },
  { id: 'raw', label: 'Raw details' },
] as const;

type CashTabId = (typeof CASH_TABS)[number]['id'];

function Fields({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5 border-b border-gray-100 pb-2">
          <dt className="text-xs text-gray-600">{item.label}</dt>
          <dd className="text-sm font-semibold text-gray-900">{item.value === '' ? '—' : item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function cashStageLabel(state: ReviewState): string {
  const c = state.cash;
  if (c.stage === 'done') return 'Cash sale completed';
  if (c.stage === 'creating' || c.stage === 'activating') return 'Waiting on system';
  return c.completed.includes('device') ? 'Activate' : 'Device';
}

function CashNotes() {
  const { state, update } = useReview();
  const [text, setText] = useState('');
  const add = () => {
    if (!text.trim()) return;
    const note = { at: now(), by: 'Chris Phiri', text: text.trim() };
    update((s) => withCashLog({ ...s, cash: { ...s.cash, notes: [note, ...s.cash.notes] } }, 'Note added'));
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
      {state.cash.notes.length === 0 ? (
        <p className="text-sm text-gray-600">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {state.cash.notes.map((n, i) => (
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

export function CashDetails({ tab }: { tab: string }) {
  const { state } = useReview();
  const active: CashTabId = (CASH_TABS.find((t) => t.id === tab)?.id ?? 'overview') as CashTabId;
  viewMemory.cashDetailsTab = active;
  const { customer } = cashApplication;
  const device = cashDevice(state);
  const c = state.cash;

  const content: Record<CashTabId, ReactNode> = {
    overview: (
      <>
        <Card title="Progress" description="Cash sales skip scoring and the credit call. Open a step to work on it.">
          <CashStepper />
        </Card>
        <Card title="Application">
          <Fields
            items={[
              { label: 'Stage', value: cashStageLabel(state) },
              { label: 'Purchase mode', value: 'Cash' },
              { label: 'Submitted', value: `${customer.submitted} by ${customer.salesAgent}` },
              { label: 'Channel', value: customer.channel },
              { label: 'Application ID', value: cashApplication.id },
            ]}
          />
        </Card>
        <Card title="Customer">
          <Fields
            items={[
              { label: 'Full name', value: customer.name },
              { label: 'National ID', value: customer.idNumber },
              { label: 'M-Pesa number', value: customer.phone },
            ]}
          />
        </Card>
      </>
    ),
    sale: (
      <Card title="Device and payment" actions={<button type="button" onClick={() => navigate(c.completed.includes('device') ? 'cash-activate' : 'cash-device')} className="text-sm font-semibold text-indigo-700">Go to the sale →</button>}>
        <Fields
          items={[
            { label: 'Device', value: device?.name ?? 'Not chosen' },
            { label: 'Cash price', value: device ? kes(device.cashPrice) : '' },
            { label: 'Payment', value: c.payment === 'full' ? 'Paid in full' : c.payment === 'short' ? `Short by ${kes(SHORTFALL)}` : 'Not received' },
            { label: 'Payer', value: c.payment === 'none' ? '' : c.payerMatches ? 'Same as customer' : 'Another person' },
            { label: 'Hand-over', value: c.handedOver ? 'Collected, codes match' : 'Not yet' },
            { label: 'Order', value: c.stage === 'none' ? 'Not created' : c.stage === 'creating' ? 'Being created' : c.stage === 'review' ? 'Needs review' : 'Created' },
          ]}
        />
      </Card>
    ),
    activity: (
      <Card title="Audit trail" description="Every change to this application, newest first.">
        <ol className="flex flex-col">
          {c.log.map((entry, i) => (
            <li key={`${entry.at}-${i}`} className="flex flex-wrap gap-x-6 gap-y-0.5 border-t border-gray-100 py-2.5 text-sm first:border-t-0">
              <span className="w-32 flex-none text-gray-600">{entry.at}</span>
              <span>{entry.text}</span>
            </li>
          ))}
        </ol>
      </Card>
    ),
    notes: <CashNotes />,
    raw: (
      <Card title="Raw details" description="The application as stored by this mockup.">
        <pre className="max-h-[520px] overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
          {JSON.stringify({ application: cashApplication, ...c }, null, 2)}
        </pre>
      </Card>
    ),
  };

  return (
    <CashLayout view="details">
      <div className="flex flex-col gap-5">
        <div role="tablist" aria-label="Application details" className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {CASH_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === active}
              onClick={() => navigate('cash-details', t.id)}
              className={`min-h-10 whitespace-nowrap rounded-lg px-3.5 text-sm ${t.id === active ? 'bg-white font-semibold text-indigo-800 shadow-sm' : 'text-gray-700 hover:text-gray-900'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="flex flex-col gap-5">
          {content[active]}
        </div>
      </div>
    </CashLayout>
  );
}
