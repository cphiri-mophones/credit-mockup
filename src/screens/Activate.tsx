import { useState } from 'react';
import { HandoverPhotos } from '../components/HandoverPhotos';
import { ApplicationLayout, StepFooter } from '../components/layout';
import { DocumentImage } from '../components/SampleDocs';
import { Button, Card, CheckCircle, Chip, MockPanel, PendingCircle, Segmented, Spinner, Stat } from '../components/ui';
import { application, kes } from '../data/application';
import { navigate } from '../navigation';
import { initialPayment, isCashApplication, useReview } from '../state/review';

export function Activate() {
  const { state, update, addLog } = useReview();
  const a = state.activation;
  const { customer, device, product } = application;
  const upfront = initialPayment(state);
  const [payerConfirmed, setPayerConfirmed] = useState(false);

  const setActivation = (patch: Partial<typeof a>, log?: string) => {
    update((s) => ({ ...s, activation: { ...s.activation, ...patch } }));
    if (log) addLog(log);
  };

  if (!state.completed.includes('decide') || a.stage === 'none') {
    return (
      <ApplicationLayout step="activate">
        <Card title="Activate" description="Approve the application in Decide first. The order is created as soon as you approve." />
      </ApplicationLayout>
    );
  }

  const cashOnly = isCashApplication(state);
  const orderReady = a.stage === 'waiting' || a.stage === 'activating' || a.stage === 'done';
  const payerOk = a.paid && (a.payerMatches || payerConfirmed);
  const checks = [
    { label: 'Order created', ok: orderReady, state: !orderReady ? 'Being created' : a.handedOver ? 'Collected' : 'Pending collection' },
    { label: 'Initial payment', ok: a.paid, state: a.paid ? 'Received and verified' : 'Not received yet' },
    { label: 'Payer', ok: payerOk, state: !a.paid ? 'Shown after payment' : a.payerMatches ? 'Same as customer' : payerConfirmed ? 'Different, confirmed by you' : 'Different from customer' },
    { label: 'Hand-over code', ok: a.handedOver, state: a.handedOver ? 'Codes match' : 'Waiting for hand-over' },
  ];
  const ready = a.stage === 'waiting' && checks.every((c) => c.ok);
  const done = a.stage === 'done';
  const saleLabel = a.activateAs === 'loan' ? 'loan' : 'cash sale';

  return (
    <ApplicationLayout step="activate">
      {a.stage === 'creating' && (
        <section className="flex flex-wrap items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <Spinner />
          <div className="flex flex-[1_1_320px] flex-col gap-1 text-blue-950">
            <h2 className="text-[17px] font-bold">Creating the order and delivery</h2>
            <p className="text-sm">This usually takes a few seconds. You can leave: the application waits under "Waiting on system" and comes back to Mine when it is ready.</p>
          </div>
        </section>
      )}

      {a.stage === 'review' && (
        <Card
          title={<span className="text-red-800">The order could not be created</span>}
          description="A duplicate order already exists for this application (mock reason)."
          actions={<Button onClick={() => setActivation({ stage: 'creating' }, 'Retried order creation')}>Retry order creation</Button>}
        >
          <ol className="list-decimal pl-5 text-sm text-gray-700">
            <li>Ask the ops team to cancel duplicate or wrong orders, keeping only the one that should go ahead.</li>
            <li>Retry order creation once they confirm.</li>
          </ol>
        </Card>
      )}

      {orderReady && (
        <>
          <Card
            title={done ? `${saleLabel.charAt(0).toUpperCase()}${saleLabel.slice(1)} activated` : 'Ready to activate?'}
            description={done ? 'The sale and loan account are created and the customer gets one SMS. The application has left your queue.' : ready ? 'Everything is in place. Activate below.' : 'Waiting for the customer to pay and collect the phone. Each item ticks as it comes in.'}
          >
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                  {c.ok ? <CheckCircle size="sm" /> : <PendingCircle />}
                  <span className="flex flex-col">
                    <span className="text-sm font-bold">{c.label}</span>
                    <span className="text-xs text-gray-600">{c.state}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Payment" actions={<Chip tone={a.paid ? 'green' : 'amber'}>{a.paid ? 'Verified' : 'Not received'}</Chip>}>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Stat label="Upfront payment due" value={upfront !== null ? kes(upfront) : '—'} />
              <Stat label="Wallet balance" value={a.paid && upfront !== null ? kes(upfront) : 'KES 0'} />
              <Stat label="Paid at" value={a.paid ? 'Just now (mock)' : '—'} />
            </dl>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border border-gray-200 text-sm">
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
                  {[
                    { field: 'Name', customer: customer.name, payer: a.payerMatches ? customer.name : 'Another person' },
                    { field: 'Phone', customer: customer.phone, payer: a.payerMatches ? customer.phone : '2547•••••901' },
                    { field: 'ID number', customer: customer.idNumber, payer: a.payerMatches ? customer.idNumber : 'Not given' },
                  ].map((row) => (
                    <tr key={row.field} className="border-t border-gray-200">
                      <th scope="row" className="px-3 py-2 text-left font-semibold">
                        {row.field}
                      </th>
                      <td className="px-3 py-2">{row.customer}</td>
                      <td className="px-3 py-2">{a.paid ? row.payer : '—'}</td>
                      <td className={`px-3 py-2 font-semibold ${!a.paid ? 'text-gray-600' : a.payerMatches ? 'text-green-800' : 'text-red-800'}`}>
                        {!a.paid ? '—' : a.payerMatches ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {a.paid && !a.payerMatches && (
              <label className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                <input type="checkbox" className="mt-0.5 h-4 w-4" checked={payerConfirmed} onChange={(e) => setPayerConfirmed(e.target.checked)} disabled={done} />
                Someone else paid. I checked with the customer that this payer is allowed to pay for them.
              </label>
            )}
          </Card>

          <Card title="Hand-over" actions={<Chip tone={a.handedOver ? 'green' : 'amber'}>{a.handedOver ? 'Collected' : 'Ready for pick-up'}</Chip>}>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Stat label="Where" value={state.call.pickupPlace || '—'} />
              <Stat label="When" value={[state.call.pickupDate, state.call.pickupTime].filter(Boolean).join(', ') || '—'} />
              <Stat label="Device" value={product.name} />
              <Stat label="Hand-over code (system)" value="••••••" />
              <Stat label="Code entered at hand-over" value={a.handedOver ? '••••••' : 'Not entered yet'} />
              <Stat label="Codes match" value={a.handedOver ? 'Yes' : 'Waiting'} tone={a.handedOver ? 'green' : 'amber'} />
            </dl>
            <HandoverPhotos
              taken={a.handedOver}
              holder={{ name: customer.name, idNumber: customer.idNumber, dob: '25.02.1997' }}
              stamp={`Rider · ${[state.call.pickupDate, state.call.pickupTime].filter(Boolean).join(' ') || '16 Nov 2026 14:20'}`}
              compare={[
                { label: 'ID front, from Verify', image: <DocumentImage id="front" variant="full" /> },
                { label: 'ID back, from Verify', image: <DocumentImage id="back" variant="full" /> },
              ]}
            />
          </Card>

          <Card
            title="Device"
            description="Ops enrols and locks the device before hand-over. Activating the sale unlocks it; nothing to do here."
            actions={<Chip tone={done ? 'green' : 'neutral'}>{done ? 'Unlocked' : 'Locked by ops'}</Chip>}
          >
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Stat label="IMEI / serial" value={a.handedOver ? device.imei : 'Assigned at hand-over'} />
              <Stat label="Device management" value={device.mdmProvider} />
              <Stat label="Lock" value={done ? 'Unlocked at activation' : 'Locked at enrolment'} tone={done ? 'green' : undefined} />
            </dl>
          </Card>

          {!done && (
            <MockPanel>
              <Button variant="secondary" disabled={a.paid} onClick={() => setActivation({ paid: true, payerMatches: true }, 'Initial payment received')}>
                Customer pays
              </Button>
              <Button variant="secondary" disabled={a.paid} onClick={() => setActivation({ paid: true, payerMatches: false }, 'Initial payment received from another payer')}>
                Someone else pays
              </Button>
              <Button variant="secondary" disabled={a.handedOver} onClick={() => setActivation({ handedOver: true }, 'Rider completed the hand-over, codes match')}>
                Rider hands over the phone
              </Button>
            </MockPanel>
          )}

          <Card title="Activate" emphasis>
            {cashOnly ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-gray-700">Activate as</span>
                <span className="self-start rounded-lg border-2 border-indigo-700 bg-indigo-50 px-4 py-2.5 text-sm font-semibold">Cash sale</span>
                <span className="text-xs text-gray-600">This is a cash application (converted in Decide), so it can only be activated as a cash sale.</span>
              </div>
            ) : (
              <Segmented
                label="Activate as"
                value={a.activateAs}
                onChange={(v) => !done && setActivation({ activateAs: v as 'loan' | 'cash' })}
                options={[
                  { value: 'loan', label: 'Loan' },
                  { value: 'cash', label: 'Cash sale' },
                ]}
                hint="Approved as a loan in Decide. Switch to cash sale only if the customer paid the full price."
              />
            )}
            {a.stage === 'activating' && (
              <div className="flex items-center gap-3">
                <Spinner />
                <span className="text-sm font-semibold">Creating the sale and {a.activateAs === 'loan' ? 'loan account' : 'cash sale'}…</span>
              </div>
            )}
          </Card>
        </>
      )}

      {a.stage === 'creating' && (
        <MockPanel>
          <Button variant="secondary" onClick={() => setActivation({ stage: 'review' }, 'Order creation failed')}>
            Make order creation fail
          </Button>
        </MockPanel>
      )}

      <StepFooter back={{ label: 'Back to decide', to: 'decide' }}>
        {done ? (
          <>
            <span className="text-sm font-semibold text-green-800">Activated. Nothing left to do here.</span>
            <Button onClick={() => navigate('queue')}>Back to Credit work</Button>
          </>
        ) : (
          <>
            {!ready && orderReady && <span className="text-sm text-gray-600">Activate unlocks when payment, payer and hand-over code are all in.</span>}
            <Button variant="success" disabled={!ready} onClick={() => setActivation({ stage: 'activating' }, `Activation requested as ${saleLabel}`)}>
              Activate {saleLabel}
            </Button>
          </>
        )}
      </StepFooter>
    </ApplicationLayout>
  );
}
