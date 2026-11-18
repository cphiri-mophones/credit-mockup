import { ApplicationLayout, StepFooter } from '../components/layout';
import { Button, Card, ChoiceCards, SelectField, TextArea } from '../components/ui';
import { application, kes } from '../data/application';
import { navigate, type Route } from '../navigation';
import { finalRiskScore, initialPayment, selectedPlan, useReview, type DecisionChoice } from '../state/review';

function SummaryTile({ title, edit, headline, detail }: { title: string; edit: Route; headline: string; detail: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-gray-200 p-3.5">
      <div className="flex justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-600">{title}</span>
        <a href={`#/${edit}`} className="text-sm font-semibold text-indigo-700">
          Edit
        </a>
      </div>
      <span className="text-[15px] font-bold">{headline}</span>
      <span className="text-sm text-gray-700">{detail}</span>
    </div>
  );
}

export function Decide() {
  const { state, update, completeStep, addLog } = useReview();
  const d = state.decision;
  const c = state.call;
  const plan = selectedPlan(state);
  const upfront = initialPayment(state);
  const decided = state.completed.includes('decide');

  const set = (patch: Partial<typeof d>) => update((s) => ({ ...s, decision: { ...s.decision, ...patch } }));

  const choices: { value: Exclude<DecisionChoice, ''>; label: string; help: string }[] = [
    { value: 'loan', label: 'Approve loan', help: 'Deposit and delivery on the offer above, then activation' },
    { value: 'cash', label: 'Approve cash offer', help: 'Customer pays the full price, then activation' },
    { value: 'reject', label: 'Reject', help: 'Ends the application with a reason' },
  ];

  const ready = d.choice !== '' && (d.choice !== 'reject' || (d.rejectReason !== '' && d.note.trim() !== ''));
  const sms = d.choice === 'reject' ? 'No SMS is sent for a rejection.' : d.choice === 'cash' ? 'The customer gets one SMS: cash offer.' : d.choice === 'loan' ? 'The customer gets one SMS: loan offer approved.' : '';

  const submit = () => {
    if (d.choice === 'reject') {
      update((s) => ({ ...s, outcome: 'rejected' }));
      completeStep('decide', `Rejected: ${d.rejectReason}`);
      navigate('details', 'decision');
      return;
    }
    update((s) => ({
      ...s,
      activation: { ...s.activation, stage: 'creating', activateAs: d.choice === 'cash' ? 'cash' : 'loan' },
    }));
    completeStep('decide', d.choice === 'cash' ? `Cash offer approved (${d.cashType}), converted to a cash application` : 'Loan approved, order requested');
    addLog('Order creation started');
    navigate('activate');
  };

  return (
    <ApplicationLayout step="decide">
      <Card title="What you are deciding on">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SummaryTile
            title="Offer"
            edit="offer"
            headline={`S23 Ultra 256GB · ${plan.name}`}
            detail={`${upfront !== null ? `${kes(upfront)} upfront` : 'Upfront amount not in mock data'} · ${plan.weekly !== null ? `${kes(plan.weekly)} a week` : ''} · ${state.offer.deposit} deposit`}
          />
          <SummaryTile
            title="Call"
            edit="call"
            headline={c.outcome === 'ended' ? `Cannot go ahead: ${c.endReason}` : 'Reached · offer confirmed'}
            detail={c.outcome === 'ended' ? c.notes : `ID and name checked · understanding: ${c.understanding.split(':')[0] || '—'} · ${c.primaryUse || '—'}`}
          />
          <SummaryTile
            title="Risk"
            edit="verify"
            headline={`${finalRiskScore(state)} · ${application.riskFlag.toLowerCase()} · ${state.risk.flag.toLowerCase()}`}
            detail={`All documents valid · ${state.risk.previousLoans.toLowerCase()}`}
          />
          <SummaryTile
            title="Delivery"
            edit="call"
            headline={c.pickupPlace ? `${c.pickupPlace}` : 'Not set'}
            detail={[c.pickupDate, c.pickupTime].filter(Boolean).join(', ') || 'Set on the call'}
          />
        </div>
      </Card>

      <Card title="Decision" emphasis>
        <ChoiceCards value={d.choice} onChange={(v) => set({ choice: v })} options={choices} columns={3} />
        {d.choice === 'cash' && (
          <SelectField label="Cash offer type" required value={d.cashType} onChange={(v) => set({ cashType: v })} options={['Credit', 'Wants cash', 'No consent', 'Out of zone', 'Not on terms']} />
        )}
        {d.choice === 'reject' && (
          <SelectField label="Reason" required value={d.rejectReason} onChange={(v) => set({ rejectReason: v })} options={['Not on terms', 'Not ready', 'Other suitable credit', 'Lost', 'No data consent', 'Out of zone', 'Impersonation']} />
        )}
        {d.choice === 'cash' && (
          <div role="alert" className="flex flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <strong>This converts the application to a cash application.</strong>
            <span>
              The loan offer is dropped and the customer pays the full cash price of {kes(application.product.cashPrice)}. It can then only be activated as a cash sale, not as a
              loan.
            </span>
          </div>
        )}
        {d.choice !== '' && d.choice !== 'reject' && (
          <p className="text-sm text-gray-600">
            The order and delivery are created as soon as you approve, using the pick-up details from the call. You go straight to activation.
          </p>
        )}
        <TextArea label={d.choice === 'reject' ? 'Note (required for a rejection)' : 'Note (optional)'} required={d.choice === 'reject'} value={d.note} onChange={(v) => set({ note: v })} />
      </Card>

      <StepFooter back={{ label: 'Back to call', to: 'call' }}>
        <span className="text-sm text-gray-700">{sms}</span>
        {decided ? (
          <Button variant="secondary" onClick={() => navigate(d.choice === 'reject' ? 'queue' : 'activate')}>
            Decision saved · {d.choice === 'reject' ? 'back to queue' : 'go to activation'}
          </Button>
        ) : (
          <Button variant={d.choice === 'reject' ? 'danger' : 'primary'} disabled={!ready} onClick={submit}>
            {d.choice === 'reject' ? 'Reject application' : d.choice === 'cash' ? 'Convert to cash and approve' : 'Approve and create order'}
          </Button>
        )}
      </StepFooter>
    </ApplicationLayout>
  );
}
