import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { DocumentViewer, ValidityToggle } from '../components/DocumentViewer';
import { DocumentImage } from '../components/SampleDocs';
import { ApplicationLayout, StepFooter } from '../components/layout';
import { Button, Card, SelectField } from '../components/ui';
import { application, documents, type DocId } from '../data/application';
import { navigate } from '../navigation';
import { finalRiskScore, useReview, type Validity } from '../state/review';

export function Verify() {
  const { state, update, completeStep, addLog } = useReview();
  const marked = documents.filter((d) => state.docs[d.id] !== null).length;
  const anyInvalid = documents.some((d) => state.docs[d.id] === 'invalid');
  const ready = marked === documents.length && !anyInvalid;
  const [riskOpen, setRiskOpen] = useState(false);
  const [viewing, setViewing] = useState<DocId | null>(null);
  const sentBack = state.outcome === 'sent-back';

  const setDoc = (id: (typeof documents)[number]['id'], v: Validity) => update((s) => ({ ...s, docs: { ...s.docs, [id]: v } }));
  const setRisk = (key: keyof typeof state.risk, v: string) => update((s) => ({ ...s, risk: { ...s.risk, [key]: v } }));

  const blockReason = anyInvalid ? 'An item is invalid: send it back to the sales agent' : `Mark all ${documents.length} items to continue`;
  const riskSummary = [
    `Final score ${finalRiskScore(state)}${state.risk.finalScore ? ' (overridden)' : ' (system)'}`,
    state.risk.flag,
    state.risk.previousLoans,
    state.risk.highDepositOverride === 'None' ? 'no deposit override' : `${state.risk.highDepositOverride} deposit override`,
  ].join(' · ');

  return (
    <ApplicationLayout step="verify">
      {sentBack && (
        <div role="status" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          Sent back to the sales agent. It returns to your queue as a resubmission.
        </div>
      )}

      <Card title="Documents and next of kin" description="Click a document to open it. Every choice saves as you go." actions={<span className="text-sm font-semibold text-gray-700">{marked} of {documents.length} marked</span>}>
        <ul className="-mx-5 flex flex-col">
          {documents.map((d) => {
            const v = state.docs[d.id];
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-4 border-t border-gray-100 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setViewing(d.id)}
                  aria-label={`Open ${d.name}`}
                  className="group flex flex-[1_1_260px] items-center gap-4 rounded-lg text-left"
                >
                  <span aria-hidden="true" className="rounded-lg ring-indigo-700 transition group-hover:ring-2">
                    <DocumentImage id={d.id} variant="thumb" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[15px] font-semibold group-hover:text-indigo-700 group-hover:underline">{d.name}</span>
                    <span className="text-sm text-gray-600">{d.meta}</span>
                  </span>
                </button>
                <ValidityToggle label={d.name} value={v} onChange={(nv) => setDoc(d.id, nv)} />
              </li>
            );
          })}
        </ul>
      </Card>

      <section className="rounded-xl border border-gray-200 bg-white">
        <button
          type="button"
          aria-expanded={riskOpen}
          aria-controls="risk-fields"
          onClick={() => setRiskOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 rounded-xl p-5 text-left hover:bg-gray-50"
        >
          <span className="flex flex-col gap-1">
            <span className="text-lg font-bold">Risk</span>
            <span className="text-sm text-gray-600">{riskSummary}</span>
          </span>
          <span className="inline-flex flex-none items-center gap-1 text-sm font-semibold text-indigo-700">
            {riskOpen ? 'Hide' : 'Change'}
            <ChevronDown className={`h-4 w-4 transition-transform ${riskOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </span>
        </button>
        {riskOpen && (
          <div id="risk-fields" className="grid grid-cols-1 gap-4 border-t border-gray-100 p-5 md:grid-cols-2">
            <SelectField
              label="Final risk score"
              value={state.risk.finalScore}
              onChange={(v) => setRisk('finalScore', v)}
              options={['1_score', '2_score', '3_score', '4_score', '5_score', '6_Ynoscore', '7_Cscore', '7_score', '8_Znoscore']}
              placeholder={`Same as system score (${application.crb.systemScore})`}
              hint="Optional. Only pick a score to override the system score."
            />
            <SelectField
              label="Risk flag"
              value={state.risk.flag}
              onChange={(v) => setRisk('flag', v)}
              options={['No flag', 'Flagged for risk – manager approval required', 'Confirmed risk – manager approval required']}
            />
            <SelectField label="Previous loans" value={state.risk.previousLoans} onChange={(v) => setRisk('previousLoans', v)} options={['First time loan', 'Paid off previous loans']} />
            <SelectField label="High deposit override" value={state.risk.highDepositOverride} onChange={(v) => setRisk('highDepositOverride', v)} options={['None', 'High', 'Normal']} />
          </div>
        )}
      </section>

      <StepFooter>
        <div className="mr-auto flex flex-col gap-1">
          <Button
            variant="danger"
            disabled={!anyInvalid || sentBack}
            onClick={() => {
              update((s) => ({ ...s, outcome: 'sent-back' }));
              addLog('Sent back to the sales agent for KYC fixes');
              navigate('details', 'documents');
            }}
          >
            Send back to sales agent
          </Button>
          <span className="text-xs text-gray-600">For an ID, selfie, M-Pesa or next-of-kin problem</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            disabled={!ready}
            onClick={() => {
              completeStep('verify', `Verified documents, final risk score ${finalRiskScore(state)}`);
              navigate('offer');
            }}
          >
            Continue to offer →
          </Button>
          {!ready && <span className="text-xs text-gray-600">{blockReason}</span>}
        </div>
      </StepFooter>
      {viewing && (
        <DocumentViewer id={viewing} docs={state.docs} onChange={setDoc} onNavigate={setViewing} onClose={() => setViewing(null)} />
      )}
    </ApplicationLayout>
  );
}
