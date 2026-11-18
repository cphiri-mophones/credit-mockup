import { useState, type ReactNode } from 'react';
import { ApplicationLayout, StepFooter } from '../components/layout';
import { Button, CheckCircle, ChoiceCards, MockPanel, Segmented, SelectField, TextArea, TextField } from '../components/ui';
import { application, kes } from '../data/application';
import { navigate } from '../navigation';
import { callAttempts, initialPayment, selectedPlan, startCallBack, useReview, type CallAnswers, type CallOutcome } from '../state/review';

const YES_NO = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const MPESA_QUESTIONS = [
  'Name or last 3 digits of someone you send money to most often',
  'Details of a recent payment or purchase from the last week',
  'Highest amount you recently sent, and to whom',
  'Highest amount you recently received, and from whom',
  'Shops or supermarkets you pay via M-Pesa',
  'Last airtime purchase and amount',
];

type Field = keyof CallAnswers;

const labels: Partial<Record<Field, string>> = {
  proceed: 'May I proceed?',
  idNumber: 'ID number',
  fullName: 'Full name',
  otherPhone: 'Other phone number',
  dataConsent: 'Data use consent',
  location: 'General location',
  payer: 'Who pays for the phone',
  mpesaSatisfactory: 'M-Pesa answers satisfactory',
  offerConfirmed: 'Offer confirmed',
  primaryUse: 'Main use of the phone',
  income: 'Main source of income',
  renewedAware: 'Renewed-phone notice',
  terms: 'Contract terms',
  hospicash: 'Hospicash consent',
  homeLocation: 'Home location',
  pickupPlace: 'Pick up or delivery',
  pickupDate: 'Pick-up day',
  pickupTime: 'Pick-up time',
  understanding: "Customer's understanding",
  outcome: 'How the call ended',
  callbackDate: 'Call back date',
  callbackTime: 'Call back time',
  endReason: 'Reason the customer cannot go ahead',
  notes: 'Call notes',
};

function requiredFields(c: CallAnswers): Field[] {
  const fields: Field[] = ['proceed', 'outcome', 'notes'];
  if (c.proceed === 'Yes') {
    fields.push(
      'idNumber',
      'fullName',
      'otherPhone',
      'dataConsent',
      'location',
      'payer',
      'mpesaSatisfactory',
      'offerConfirmed',
      'primaryUse',
      'income',
      'renewedAware',
      'terms',
      'hospicash',
      'homeLocation',
      'pickupPlace',
      'pickupDate',
      'pickupTime',
      'understanding',
    );
  }
  if (c.outcome === 'callback') fields.push('callbackDate', 'callbackTime');
  if (c.outcome === 'ended') fields.push('endReason');
  return fields;
}

function tomorrow() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fullCall(): Partial<CallAnswers> {
  return {
    proceed: 'Yes',
    idNumber: application.customer.idNumber,
    fullName: application.customer.name,
    otherPhone: 'No',
    dataConsent: 'Yes',
    location: 'Nairobi',
    payer: 'The customer, the full loan',
    mpesaAsked: MPESA_QUESTIONS.slice(0, 3),
    mpesaSatisfactory: 'Yes',
    offerConfirmed: 'Yes',
    primaryUse: 'Personal use',
    income: 'Salaried / formal employment',
    renewedAware: 'Aware',
    terms: 'I agree',
    hospicash: 'Yes',
    homeLocation: 'Kilimani, Argwings Kodhek Road, Elgon Court, block B',
    pickupPlace: 'Mophones shop',
    pickupDate: tomorrow(),
    pickupTime: '10am – 1pm',
    understanding: 'Good: fully aware of pricing and terms',
  };
}

const callPresets: { label: string; answers: () => Partial<CallAnswers> }[] = [
  { label: 'Reached, ready for decision', answers: () => ({ ...fullCall(), outcome: 'reached', notes: 'Customer confirmed everything, no concerns.' }) },
  {
    label: 'Not reached, call back tomorrow',
    answers: () => ({ proceed: 'Not reached', outcome: 'callback', callbackDate: tomorrow(), callbackTime: '10:00', notes: 'Phone rang out twice.' }),
  },
  {
    label: 'Asked to call later',
    answers: () => ({ proceed: 'Call later', outcome: 'callback', callbackDate: tomorrow(), callbackTime: '15:00', notes: 'Customer was driving, asked for a call in the afternoon.' }),
  },
  { label: 'Not ready for a loan', answers: () => ({ proceed: 'Not ready', outcome: 'ended', endReason: 'Not ready', notes: 'Customer wants to save up first.' }) },
  {
    label: 'Full call, not on terms',
    answers: () => ({ ...fullCall(), terms: 'Not on terms', outcome: 'ended', endReason: 'Not on terms', notes: 'Customer did not accept the repayment terms.' }),
  },
];

function Section({ number, title, done, children }: { number: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        {done ? (
          <CheckCircle size="sm" />
        ) : (
          <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-gray-400 text-xs font-bold text-gray-700">{number}</span>
        )}
        <h2 className="text-[17px] font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Script({ children }: { children: ReactNode }) {
  return <blockquote className="rounded-lg bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800">{children}</blockquote>;
}

export function Call() {
  const { state, update, completeStep, addLog } = useReview();
  const [showErrors, setShowErrors] = useState(false);
  const c = state.call;
  const { customer, product } = application;
  const plan = selectedPlan(state);
  const upfront = initialPayment(state);

  const set = <K extends Field>(key: K, value: CallAnswers[K]) => update((s) => ({ ...s, call: { ...s.call, [key]: value } }));

  const missing = requiredFields(c).filter((f) => {
    const v = c[f];
    return Array.isArray(v) ? v.length === 0 : v === '';
  });
  const err = (f: Field) => (showErrors && missing.includes(f) ? 'Answer this to save the call' : undefined);
  const filled = (...fields: Field[]) => fields.every((f) => !missing.includes(f) && c[f] !== '');

  const idCheck = c.idNumber === '' ? undefined : c.idNumber.trim() === customer.idNumber;
  const nameCheck = c.fullName === '' ? undefined : c.fullName.trim().toLowerCase() === customer.name.toLowerCase();
  const reached = c.proceed === 'Yes';

  const outcomeOptions: { value: Exclude<CallOutcome, ''>; label: string; help: string }[] = [
    ...(reached ? [{ value: 'reached' as const, label: 'Reached: ready for a decision', help: 'Goes straight on to Decide, still with you' }] : []),
    { value: 'callback', label: 'Not reached or asked to call later', help: 'Moves to Call backs due at the time you set; answers so far are kept' },
    { value: 'ended', label: 'Customer cannot go ahead', help: 'Not ready, not on terms, no consent, out of zone or impersonation' },
  ];

  const fillCall = (answers: Partial<CallAnswers>) => {
    update((s) => ({ ...s, call: { ...s.call, ...answers } }));
    setShowErrors(false);
  };

  const save = () => {
    if (missing.length > 0) {
      setShowErrors(true);
      return;
    }
    if (c.outcome === 'callback') {
      update((s) => ({ ...s, outcome: 'callback' }));
      addLog(`Call back scheduled for ${c.callbackDate} ${c.callbackTime}`);
      navigate('details', 'call');
      return;
    }
    if (c.outcome === 'ended') {
      update((s) => ({ ...s, outcome: 'in-progress', decision: { ...s.decision, choice: 'reject', rejectReason: c.endReason } }));
      completeStep('call', `Call saved: customer cannot go ahead (${c.endReason})`);
      navigate('decide');
      return;
    }
    update((s) => ({ ...s, outcome: 'in-progress' }));
    completeStep('call', 'Call saved: reached, offer confirmed');
    navigate('decide');
  };

  return (
    <ApplicationLayout step="call">
      {state.outcome === 'callback' && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold">
              Call back due {c.callbackDate} {c.callbackTime}
            </span>
            <span className="text-sm">The answers from the last call are kept. Starting the call back asks "May I proceed?" again and needs a new outcome.</span>
          </div>
          <Button onClick={() => update(startCallBack)}>Start call back</Button>
        </div>
      )}
      {state.outcome !== 'callback' && callAttempts(state) > 1 && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          Attempt {callAttempts(state)}. Answers from earlier attempts are filled in; check them with the customer.
        </div>
      )}

      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div className="flex flex-[1_1_260px] flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Call the customer</span>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-xl font-bold">{customer.phone}</span>
            <span className="text-lg font-semibold">{customer.name}</span>
          </div>
          <span className="text-sm text-gray-600">Short script: next of kin already gave consent, no next-of-kin call needed</span>
        </div>
      </section>

      <MockPanel note="Fills the call form for the outcome you pick, so you don't have to answer every question. Review it, then save.">
        {callPresets.map((p) => (
          <Button key={p.label} variant="secondary" onClick={() => fillCall(p.answers())}>
            {p.label}
          </Button>
        ))}
      </MockPanel>

      <Section number={1} title="Introduction and identity" done={filled('proceed') && (!reached || filled('idNumber', 'fullName', 'otherPhone'))}>
        <Script>
          “Hello, my name is Chris and I am calling from MoPhones for the final step of your phone loan application. Am I speaking with {customer.name}? This call is recorded and takes
          about 5 minutes. May I proceed?”
        </Script>
        <Segmented
          label="May I proceed?"
          required
          value={c.proceed}
          onChange={(v) => {
            set('proceed', v);
            if (v !== 'Yes' && c.outcome === 'reached') set('outcome', '');
          }}
          options={[
            { value: 'Yes', label: 'Yes' },
            { value: 'Call later', label: 'Call me later' },
            { value: 'Not ready', label: 'Not ready for a loan' },
            { value: 'Not reached', label: 'Not reached' },
          ]}
          error={err('proceed')}
        />
        {reached && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField
                label="ID number the customer reads out"
                required
                value={c.idNumber}
                onChange={(v) => set('idNumber', v)}
                error={err('idNumber') ?? (idCheck === false ? 'Does not match the record' : undefined)}
                ok={idCheck ? 'Matches the record' : undefined}
              />
              <TextField
                label="Full name as on the ID"
                required
                value={c.fullName}
                onChange={(v) => set('fullName', v)}
                error={err('fullName') ?? (nameCheck === false ? 'Does not match the record' : undefined)}
                ok={nameCheck ? 'Matches the record' : undefined}
              />
            </div>
            <Segmented label="Any other phone number we can reach you on?" required value={c.otherPhone} onChange={(v) => set('otherPhone', v)} options={YES_NO} error={err('otherPhone')} />
          </>
        )}
      </Section>

      {reached && (
        <>
          <Section number={2} title="Consent, location and payer" done={filled('dataConsent', 'location', 'payer')}>
            <Segmented
              label="Do you allow MoPhones to use your data for the credit decision, the loan contract and as set out in our terms and privacy policy?"
              required
              value={c.dataConsent}
              onChange={(v) => set('dataConsent', v)}
              options={YES_NO}
              error={err('dataConsent')}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField label="General location" required value={c.location} onChange={(v) => set('location', v)} options={['Nairobi', 'Nakuru', 'Mombasa', 'Other']} error={err('location')} />
              <SelectField
                label="Who pays for the phone?"
                required
                value={c.payer}
                onChange={(v) => set('payer', v)}
                options={['The customer, the full loan', 'Someone else']}
                error={err('payer')}
              />
            </div>
          </Section>

          <Section number={3} title="M-Pesa check" done={filled('mpesaSatisfactory')}>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-sm font-semibold text-gray-700">Questions asked</legend>
              {MPESA_QUESTIONS.map((q) => (
                <label key={q} className="flex min-h-9 items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={c.mpesaAsked.includes(q)}
                    onChange={(e) => set('mpesaAsked', e.target.checked ? [...c.mpesaAsked, q] : c.mpesaAsked.filter((x) => x !== q))}
                  />
                  {q}
                </label>
              ))}
            </fieldset>
            <Segmented
              label="Were the answers satisfactory?"
              required
              value={c.mpesaSatisfactory}
              onChange={(v) => set('mpesaSatisfactory', v)}
              options={[...YES_NO, { value: 'Did not ask', label: 'Did not ask' }]}
              error={err('mpesaSatisfactory')}
            />
          </Section>

          <Section number={4} title="Confirm the offer" done={filled('offerConfirmed', 'primaryUse', 'income')}>
            <Script>
              “You have applied for a <strong>{product.name}</strong> with a deposit of <strong>{plan.deposit !== null ? kes(plan.deposit) : '—'}</strong>
              {upfront !== null && (
                <>
                  , so you pay <strong>{kes(upfront)}</strong> upfront including {state.offer.initialWeeks} initial week(s)
                </>
              )}
              . Your weekly instalment will be <strong>{plan.weekly !== null ? kes(plan.weekly) : '—'}</strong> on <strong>{plan.name}</strong>. Are these the details you want?”
            </Script>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented label="Offer confirmed?" required value={c.offerConfirmed} onChange={(v) => set('offerConfirmed', v)} options={[{ value: 'Yes', label: 'Yes, confirmed' }]} error={err('offerConfirmed')} />
              <a href="#/offer" className="mt-7 inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-4 text-sm text-gray-700 no-underline">
                Wants a different offer: back to Offer
              </a>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField
                label="Main use of the phone"
                required
                value={c.primaryUse}
                onChange={(v) => set('primaryUse', v)}
                options={['Income-generating use', 'Personal use', 'Work-required device', 'Household / shared', 'Gifting it to someone', 'Buying on behalf of someone else', 'Other']}
                error={err('primaryUse')}
              />
              <SelectField
                label="Main source of income"
                required
                value={c.income}
                onChange={(v) => set('income', v)}
                options={['Salaried / formal employment', 'Business owner', 'Gig or platform work', 'Casual labour', 'Student', 'Unemployed', 'Other']}
                error={err('income')}
              />
            </div>
          </Section>

          <Section number={5} title="Terms and cover" done={filled('renewedAware', 'terms', 'hospicash')}>
            <Segmented
              label="Our phones are renewed and quality-checked. Any questions?"
              required
              value={c.renewedAware}
              onChange={(v) => set('renewedAware', v)}
              options={[
                { value: 'Aware', label: 'Yes, I am aware' },
                { value: 'Now aware', label: 'No, but now aware' },
                { value: 'Needs more info', label: 'Needs more info' },
              ]}
              error={err('renewedAware')}
            />
            <Script>
              Read the contract terms: 12-month warranty, refund or swap within 2 working days, repayments continue while the device is serviced or lost, no tampering with MoPhones software,
              and buying for someone else without saying so breaches the agreement.
            </Script>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Segmented
                label="Contract terms"
                required
                value={c.terms}
                onChange={(v) => set('terms', v)}
                options={[
                  { value: 'I agree', label: 'I agree' },
                  { value: 'Not on terms', label: 'Not on terms' },
                ]}
                error={err('terms')}
              />
              <Segmented label="Share details with Jubilee for Hospicash?" required value={c.hospicash} onChange={(v) => set('hospicash', v)} options={YES_NO} error={err('hospicash')} />
            </div>
          </Section>

          <Section number={6} title="Home and delivery" done={filled('homeLocation', 'pickupPlace', 'pickupDate', 'pickupTime', 'understanding')}>
            <TextArea
              label="Home location: estate, road, building or landmark"
              required
              value={c.homeLocation}
              onChange={(v) => set('homeLocation', v)}
              error={err('homeLocation')}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SelectField label="Pick up or delivery" required value={c.pickupPlace} onChange={(v) => set('pickupPlace', v)} options={['Mophones shop', 'Merchant shop', 'Home', 'Work']} error={err('pickupPlace')} />
              <TextField label="Day" type="date" required value={c.pickupDate} onChange={(v) => set('pickupDate', v)} error={err('pickupDate')} />
              <SelectField
                label="Time"
                required
                value={c.pickupTime}
                onChange={(v) => set('pickupTime', v)}
                options={['8am – 10am', '10am – 1pm', '2pm – 5pm', 'Will advise when ready']}
                error={err('pickupTime')}
              />
            </div>
            <SelectField
              label="Customer's understanding of product, terms and price"
              required
              value={c.understanding}
              onChange={(v) => set('understanding', v)}
              options={['Good: fully aware of pricing and terms', 'Average: aware of most', 'Low: had many questions', 'Poor: had to be told everything']}
              error={err('understanding')}
            />
          </Section>
        </>
      )}

      <section className="flex flex-col gap-4 rounded-xl border-2 border-indigo-700 bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">How did the call end?</h2>
          <p className="text-sm text-gray-600">This decides what happens next.</p>
        </div>
        {showErrors && missing.length > 0 && (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">Answer these before saving:</p>
            <ul className="mt-1 list-disc pl-5">
              {missing.map((f) => (
                <li key={f}>{labels[f] ?? f}</li>
              ))}
            </ul>
          </div>
        )}
        <ChoiceCards value={c.outcome} onChange={(v) => set('outcome', v)} options={outcomeOptions} />
        {c.outcome === 'callback' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label="Call back on" type="date" required value={c.callbackDate} onChange={(v) => set('callbackDate', v)} error={err('callbackDate')} />
            <TextField label="At" type="time" required value={c.callbackTime} onChange={(v) => set('callbackTime', v)} error={err('callbackTime')} />
          </div>
        )}
        {c.outcome === 'ended' && (
          <SelectField
            label="Reason"
            required
            value={c.endReason}
            onChange={(v) => set('endReason', v)}
            options={['Not ready', 'Not on terms', 'No data consent', 'Out of zone', 'Impersonation']}
            error={err('endReason')}
          />
        )}
        <TextArea label="Call notes" required value={c.notes} onChange={(v) => set('notes', v)} placeholder="Anything the decision should know" error={err('notes')} />
      </section>

      <StepFooter back={{ label: 'Back to offer', to: 'offer' }}>
        <Button onClick={save}>{c.outcome === 'callback' ? 'Save and schedule call back' : 'Save call and continue to decision →'}</Button>
      </StepFooter>
    </ApplicationLayout>
  );
}
