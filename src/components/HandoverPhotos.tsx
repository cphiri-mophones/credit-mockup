import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HandoverPhoto, type HandoverShot, type IdHolder } from './SampleDocs';

const shots: { id: HandoverShot; label: string }[] = [
  { id: 'id-front', label: 'ID front' },
  { id: 'id-back', label: 'ID back' },
];

export interface ExtraPhoto {
  label: string;
  image: ReactNode;
}

export function HandoverPhotos({
  taken,
  holder,
  stamp,
  compare = [],
}: {
  taken: boolean;
  holder: IdHolder;
  stamp: string;
  compare?: ExtraPhoto[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const photos: ExtraPhoto[] = [
    ...(taken ? shots.map((s) => ({ label: `${s.label}, at hand-over`, image: <HandoverPhoto shot={s.id} holder={holder} stamp={stamp} /> })) : []),
    ...compare,
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold">{compare.length ? 'ID photos from the hand-over next to the ID from Verify' : 'ID photos from the hand-over'}</span>
      {!taken && <p className="text-sm text-gray-600">The rider's ID photos show here once the hand-over is done.</p>}
      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {photos.map((p, i) => (
            <li key={p.label}>
              <button type="button" onClick={() => setOpen(i)} className="group flex w-full flex-col gap-1 text-left" aria-label={`Open ${p.label}`}>
                <span className="block overflow-hidden rounded-lg border border-gray-200 bg-white group-hover:border-indigo-400 [&_svg]:h-auto [&_svg]:w-full">{p.image}</span>
                <span className="text-xs text-gray-600 group-hover:text-indigo-700">{p.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open !== null && <PhotoViewer photos={photos} index={open} onNavigate={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

function PhotoViewer({ photos, index, onNavigate, onClose }: { photos: ExtraPhoto[]; index: number; onNavigate: (i: number) => void; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const photo = photos[index];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-viewer-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex flex-col">
            <h2 id="photo-viewer-title" className="text-lg font-bold">
              {photo.label}
            </h2>
            <span className="text-sm text-gray-600">
              {index + 1} of {photos.length}
            </span>
          </div>
          <button ref={closeRef} type="button" aria-label="Close" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 [&_svg]:h-auto [&_svg]:w-full">{photo.image}</div>
        <div className="flex gap-2 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onNavigate(index - 1)}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
          </button>
          <button
            type="button"
            disabled={index === photos.length - 1}
            onClick={() => onNavigate(index + 1)}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
