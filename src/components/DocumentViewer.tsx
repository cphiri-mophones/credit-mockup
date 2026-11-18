import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { application, details, documents, type DocId } from '../data/application';
import type { Validity } from '../state/review';
import { DocumentImage } from './SampleDocs';
import { Chip } from './ui';

export function ValidityToggle({ label, value, onChange }: { label: string; value: Validity; onChange: (v: Validity) => void }) {
  return (
    <div role="group" aria-label={`${label} validity`} className="flex overflow-hidden rounded-lg border border-gray-300">
      <button
        type="button"
        aria-pressed={value === 'valid'}
        onClick={() => onChange('valid')}
        className={`min-h-11 px-4 text-sm font-semibold ${value === 'valid' ? 'bg-green-800 text-white' : 'bg-white text-gray-700'}`}
      >
        Valid
      </button>
      <button
        type="button"
        aria-pressed={value === 'invalid'}
        onClick={() => onChange('invalid')}
        className={`min-h-11 border-l border-gray-300 px-4 text-sm font-semibold ${value === 'invalid' ? 'bg-red-800 text-white' : 'bg-white text-gray-700'}`}
      >
        Invalid
      </button>
    </div>
  );
}

function Rows({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label} className="flex justify-between gap-3 border-b border-gray-100 py-1.5">
          <dt className="text-gray-600">{i.label}</dt>
          <dd className="text-right font-semibold">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DocumentBody({ id }: { id: DocId }) {
  const { customer, nok } = application;
  if (id === 'mpesa') {
    return (
      <div className="flex flex-col gap-4">
        <DocumentImage id="mpesa" variant="full" />
        <h3 className="text-sm font-bold">Statement analysis</h3>
        <Rows
          items={[
            { label: 'Statement check', value: 'Passed' },
            { label: 'Gaps', value: details.mpesaGaps },
            { label: 'Statement name', value: customer.name },
            { label: 'M-Pesa number', value: customer.phone },
            { label: 'Income and spending', value: '[from statement analysis]' },
            { label: 'Frequent recipients', value: '[from statement analysis]' },
          ]}
        />
      </div>
    );
  }
  if (id === 'nok') {
    return (
      <div className="flex flex-col gap-4">
        <DocumentImage id="nok" variant="full" />
        <Rows
          items={[
            { label: 'Name', value: nok.name },
            { label: 'Relationship', value: nok.relationship },
            { label: 'ID number', value: nok.idNumber },
            { label: 'Phone', value: details.nokConsent.sentTo },
          ]}
        />
        <h3 className="text-sm font-bold">Checks</h3>
        <ul className="flex flex-wrap gap-2">
          {details.validations.nextOfKin.map((c) => (
            <li key={c.check}>
              <Chip tone="green">{`${c.check}: ${c.result}`}</Chip>
            </li>
          ))}
          <li>
            <Chip tone="green">Consent verified</Chip>
          </li>
        </ul>
        <p className="text-sm text-gray-600">
          Consent code sent {details.nokConsent.sentAt}, verified {details.nokConsent.verifiedAt} by {details.nokConsent.verifiedBy}.
        </p>
      </div>
    );
  }
  const compare = id === 'selfie' ? 'Compare with the photo on the ID.' : 'Check the name, ID number and photo against the record.';
  return (
    <div className="flex flex-col gap-4">
      <DocumentImage id={id} variant="full" />
      <p className="text-sm text-gray-600">{compare}</p>
      <Rows
        items={[
          { label: 'Name on record', value: customer.name },
          { label: 'ID number on record', value: customer.idNumber },
        ]}
      />
    </div>
  );
}

export function DocumentViewer({
  id,
  docs,
  onChange,
  onNavigate,
  onClose,
}: {
  id: DocId;
  docs: Record<DocId, Validity>;
  onChange: (id: DocId, v: Validity) => void;
  onNavigate: (id: DocId) => void;
  onClose: () => void;
}) {
  const index = documents.findIndex((d) => d.id === id);
  const doc = documents[index];
  const prev = documents[index - 1];
  const next = documents[index + 1];
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-viewer-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex flex-col">
            <h2 id="doc-viewer-title" className="text-lg font-bold">
              {doc.name}
            </h2>
            <span className="text-sm text-gray-600">
              {doc.meta} · {index + 1} of {documents.length}
            </span>
          </div>
          <button ref={closeRef} type="button" aria-label="Close" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <DocumentBody id={doc.id} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!prev}
              onClick={() => prev && onNavigate(prev.id)}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
            </button>
            <button
              type="button"
              disabled={!next}
              onClick={() => next && onNavigate(next.id)}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <ValidityToggle
            label={doc.name}
            value={docs[doc.id]}
            onChange={(v) => {
              onChange(doc.id, v);
              if (v === 'valid' && next) onNavigate(next.id);
            }}
          />
        </div>
      </div>
    </div>
  );
}
