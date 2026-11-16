import { ApplicationLayout, StepFooter } from '../components/layout';
import { Button, Card, Chip, Segmented, TextField } from '../components/ui';
import { application, kes, plans } from '../data/application';
import { navigate } from '../navigation';
import { initialPayment, offerWithinLimit, selectedPlan, useReview } from '../state/review';

export function Offer() {
  const { state, update, completeStep } = useReview();
  const { fateGuide, product } = application;
  const plan = selectedPlan(state);
  const upfront = initialPayment(state);
  const withinLimit = offerWithinLimit(state);
  const hasFigures = plan.deposit !== null;
  const ready = withinLimit && hasFigures;

  const setOffer = (patch: Partial<typeof state.offer>) => update((s) => ({ ...s, offer: { ...s.offer, ...patch } }));

  return (
    <ApplicationLayout step="offer">
      <Card title="Offer" description="Chosen once here. The call script, the decision and activation all use this offer; change it here if the customer asks for something else.">
        <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-[1_1_200px] flex-col">
            <span className="text-xs font-semibold text-gray-600">Fate Guide limit, high deposit</span>
            <span className="text-xl font-bold">{kes(fateGuide.highDepositLimit)}</span>
          </div>
          <div className="flex flex-[1_1_200px] flex-col">
            <span className="text-xs font-semibold text-gray-600">Fate Guide limit, normal deposit</span>
            <span className="text-xl font-bold">{kes(fateGuide.normalDepositLimit)}</span>
          </div>
          <div className="flex flex-[1_1_200px] items-center">
            <Chip tone="orange">{`${fateGuide.band} · SDI ${fateGuide.sdi}`}</Chip>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 p-4">
          <div aria-hidden="true" className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-gray-200 text-xs font-bold text-gray-700">
            S23
          </div>
          <div className="flex flex-[1_1_240px] flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold">{product.name}</span>
              <Chip tone="indigo">Customer's choice</Chip>
            </div>
            <span className="text-sm text-gray-600">Cash price {kes(product.cashPrice)}</span>
          </div>
          <Button variant="secondary">Change device</Button>
        </div>

        <Segmented
          label="Deposit"
          value={state.offer.deposit}
          onChange={(v) => setOffer({ deposit: v as 'normal' | 'high' })}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'High' },
          ]}
          error={withinLimit ? undefined : `Normal deposit allows up to ${kes(fateGuide.normalDepositLimit)}. This device is above the limit: choose High or change device.`}
          hint={`High deposit allows up to ${kes(fateGuide.highDepositLimit)}. This device fits.`}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">Price plan</legend>
          {plans.map((p) => {
            const selected = p.id === state.offer.planId;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setOffer({ planId: p.id })}
                className={`flex min-h-11 flex-wrap items-center gap-4 rounded-lg px-4 py-3 text-left ${
                  selected ? 'border-2 border-indigo-700 bg-indigo-50' : 'border border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <span className="flex flex-[1_1_180px] flex-col">
                  <span className={`text-[15px] ${selected ? 'font-bold' : 'font-semibold'}`}>{p.name}</span>
                  <span className="text-sm text-gray-600">{p.term}</span>
                </span>
                {p.deposit !== null && p.weekly !== null && p.totalLoan !== null ? (
                  <>
                    <PlanFigure label="Deposit" value={kes(p.deposit)} />
                    <PlanFigure label="Weekly" value={kes(p.weekly)} />
                    <PlanFigure label="Total loan" value={kes(p.totalLoan)} />
                  </>
                ) : (
                  <span className="flex-[3_1_360px] text-sm text-gray-600">Figures not in the mock data</span>
                )}
              </button>
            );
          })}
        </fieldset>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            label="Initial weeks"
            type="number"
            value={String(state.offer.initialWeeks)}
            onChange={(v) => setOffer({ initialWeeks: Math.max(0, Number(v) || 0) })}
            hint="Weeks paid upfront with the deposit"
          />
          <div className="flex flex-col justify-center rounded-lg bg-indigo-50 p-4">
            <span className="text-xs font-semibold text-indigo-900">Customer pays upfront</span>
            <span className="text-xl font-bold text-indigo-950">{upfront === null ? '—' : kes(upfront)}</span>
            <span className="text-xs text-indigo-900">Deposit + {state.offer.initialWeeks} initial week(s). The same figure is read on the call and collected at activation.</span>
          </div>
        </div>
      </Card>

      <StepFooter back={{ label: 'Back to verify', to: 'verify' }}>
        <div className="flex flex-col items-end gap-1">
          <Button
            disabled={!ready}
            onClick={() => {
              completeStep('offer', `Offer set: ${plan.name}, ${state.offer.deposit} deposit`);
              navigate('call');
            }}
          >
            Continue to call →
          </Button>
          <span className="text-xs text-gray-600">
            {!withinLimit ? 'The device is above the limit for this deposit' : !hasFigures ? 'Pick a plan with figures to continue' : 'No message goes to the customer at this step'}
          </span>
        </div>
      </StepFooter>
    </ApplicationLayout>
  );
}

function PlanFigure({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-[1_1_120px] flex-col">
      <span className="text-xs text-gray-600">{label}</span>
      <span className="text-[15px] font-bold">{value}</span>
    </span>
  );
}
