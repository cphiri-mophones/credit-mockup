// Illustrated stand-ins for the uploaded KYC documents. Watermarked SAMPLE so
// they are never mistaken for a real customer's documents.
import type { ReactNode } from 'react';
import { application } from '../data/application';
import type { DocId } from '../data/application';

const ink = '#1f2937';
const muted = '#6b7280';

function Watermark({ x, y }: { x: number; y: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize="96" fontWeight="800" fill="#4338ca" opacity="0.12" transform={`rotate(-18 ${x} ${y})`}>
      SAMPLE
    </text>
  );
}

function Portrait({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const cx = x + w / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="10" fill="#cbd5e1" />
      <circle cx={cx} cy={y + h * 0.38} r={w * 0.22} fill="#64748b" />
      <path d={`M${x + w * 0.12} ${y + h} Q${cx} ${y + h * 0.52} ${x + w * 0.88} ${y + h} Z`} fill="#64748b" />
    </g>
  );
}

function Field({ x, y, label, value }: { x: number; y: number; label: string; value: string }) {
  return (
    <g>
      <text x={x} y={y} fontSize="18" fill={muted} fontWeight="600" letterSpacing="1">
        {label}
      </text>
      <text x={x} y={y + 30} fontSize="26" fill={ink} fontWeight="700">
        {value}
      </text>
    </g>
  );
}

export interface IdHolder {
  name: string;
  idNumber: string;
  dob: string;
}

const defaultHolder: IdHolder = { name: application.customer.name, idNumber: application.customer.idNumber, dob: '25.02.1997' };

function mrz(line: string): string {
  return line.padEnd(30, '<').slice(0, 30);
}

function IdFrontArt({ holder }: { holder: IdHolder }) {
  return (
    <g>
      <rect width="860" height="540" rx="28" fill="#e6f4ea" />
      <rect x="0" y="0" width="860" height="84" rx="28" fill="#166534" />
      <rect x="0" y="56" width="860" height="28" fill="#166534" />
      <text x="40" y="54" fontSize="28" fontWeight="800" fill="#fff" letterSpacing="2">
        NATIONAL IDENTITY CARD
      </text>
      <Portrait x={40} y={120} w={220} h={280} />
      <Field x={300} y={140} label="FULL NAME" value={holder.name.toUpperCase()} />
      <Field x={300} y={225} label="ID NUMBER" value={holder.idNumber} />
      <Field x={300} y={310} label="DATE OF BIRTH" value={holder.dob} />
      <path d="M300 440 q30 -30 60 0 t60 0 t60 0" stroke={ink} strokeWidth="3" fill="none" />
      <text x="300" y="480" fontSize="16" fill={muted}>
        HOLDER'S SIGNATURE
      </text>
      <Watermark x={560} y={330} />
    </g>
  );
}

function IdFront() {
  return (
    <svg viewBox="0 0 860 540" role="img" aria-label="Sample ID card, front">
      <IdFrontArt holder={defaultHolder} />
    </svg>
  );
}

function IdBackArt({ holder }: { holder: IdHolder }) {
  const bars = Array.from({ length: 60 }, (_, i) => ({ x: 40 + i * 13, w: i % 3 === 0 ? 7 : i % 2 === 0 ? 4 : 2 }));
  const [first, ...rest] = holder.name.toUpperCase().split(' ');
  const lines = [mrz(`ID<<${holder.idNumber}`), mrz(`${holder.dob.split('.').reverse().join('').slice(2)}M3001012`), mrz(`${rest.join('<')}<<${first}`)];
  return (
    <g>
      <rect width="860" height="540" rx="28" fill="#e6f4ea" />
      <text x="40" y="70" fontSize="22" fill={muted} fontWeight="600" letterSpacing="1">
        PLACE OF ISSUE
      </text>
      <text x="40" y="104" fontSize="26" fill={ink} fontWeight="700">
        NAIROBI
      </text>
      <text x="460" y="70" fontSize="22" fill={muted} fontWeight="600" letterSpacing="1">
        DATE OF ISSUE
      </text>
      <text x="460" y="104" fontSize="26" fill={ink} fontWeight="700">
        14.03.2015
      </text>
      <rect x="40" y="150" width="780" height="140" rx="8" fill="#fff" />
      {bars.map((b) => (
        <rect key={b.x} x={b.x + 10} y={165} width={b.w} height={110} fill={ink} />
      ))}
      <rect x="40" y="330" width="780" height="160" rx="8" fill="#fff" />
      {lines.map((line, i) => (
        <text key={i} x="60" y={380 + i * 44} fontSize="28" fontFamily="ui-monospace, monospace" fill={ink} letterSpacing="3">
          {line}
        </text>
      ))}
      <Watermark x={430} y={300} />
    </g>
  );
}

function IdBack() {
  return (
    <svg viewBox="0 0 860 540" role="img" aria-label="Sample ID card, back">
      <IdBackArt holder={defaultHolder} />
    </svg>
  );
}

function Selfie() {
  return (
    <svg viewBox="0 0 860 540" role="img" aria-label="Sample selfie">
      <rect width="860" height="540" fill="#dbeafe" />
      <rect x="0" y="380" width="860" height="160" fill="#bfdbfe" />
      <circle cx="430" cy="210" r="95" fill="#64748b" />
      <path d="M250 540 Q430 290 610 540 Z" fill="#475569" />
      <ellipse cx="430" cy="230" rx="170" ry="210" fill="none" stroke="#16a34a" strokeWidth="6" strokeDasharray="18 12" />
      <rect x="20" y="20" width="250" height="44" rx="22" fill="#fff" opacity="0.9" />
      <text x="40" y="50" fontSize="20" fontWeight="700" fill="#166534">
        ● Liveness check
      </text>
      <Watermark x={430} y={420} />
    </svg>
  );
}

function Statement() {
  const { customer } = application;
  const rows = [
    ['01 Nov', 'Customer transfer', '-1,200.00'],
    ['01 Nov', 'Airtime purchase', '-100.00'],
    ['31 Oct', 'Funds received', '+5,000.00'],
    ['30 Oct', 'Pay bill', '-2,350.00'],
    ['29 Oct', 'Buy goods', '-640.00'],
    ['28 Oct', 'Funds received', '+12,000.00'],
  ];
  return (
    <svg viewBox="0 0 860 540" role="img" aria-label="Sample M-Pesa statement">
      <rect width="860" height="540" fill="#f8fafc" />
      <rect x="60" y="20" width="740" height="520" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
      <rect x="60" y="20" width="740" height="70" fill="#16a34a" />
      <text x="90" y="66" fontSize="28" fontWeight="800" fill="#fff" letterSpacing="1">
        M-PESA STATEMENT
      </text>
      <text x="90" y="128" fontSize="18" fill={muted}>
        Customer
      </text>
      <text x="90" y="154" fontSize="22" fontWeight="700" fill={ink}>
        {customer.name}
      </text>
      <text x="470" y="128" fontSize="18" fill={muted}>
        Mobile number
      </text>
      <text x="470" y="154" fontSize="22" fontWeight="700" fill={ink}>
        {customer.phone}
      </text>
      <rect x="90" y="182" width="680" height="34" fill="#f1f5f9" />
      {['Date', 'Details', 'Amount (KES)'].map((h, i) => (
        <text key={h} x={[100, 230, 630][i]} y="205" fontSize="17" fontWeight="700" fill={ink}>
          {h}
        </text>
      ))}
      {rows.map((r, i) => (
        <g key={`${r[0]}-${i}`}>
          <text x="100" y={250 + i * 44} fontSize="18" fill={ink}>
            {r[0]}
          </text>
          <text x="230" y={250 + i * 44} fontSize="18" fill={ink}>
            {r[1]}
          </text>
          <text x="630" y={250 + i * 44} fontSize="18" fill={r[2].startsWith('+') ? '#166534' : ink}>
            {r[2]}
          </text>
          <line x1="90" x2="770" y1={264 + i * 44} y2={264 + i * 44} stroke="#e5e7eb" />
        </g>
      ))}
      <Watermark x={430} y={380} />
    </svg>
  );
}

function NextOfKin() {
  const { nok } = application;
  return (
    <svg viewBox="0 0 860 540" role="img" aria-label="Sample next of kin card">
      <rect width="860" height="540" fill="#f5f3ff" />
      <rect x="60" y="60" width="740" height="420" rx="24" fill="#fff" stroke="#ddd6fe" strokeWidth="3" />
      <Portrait x={100} y={110} w={200} h={240} />
      <Field x={340} y={140} label="NEXT OF KIN" value={nok.name} />
      <Field x={340} y={225} label="RELATIONSHIP" value={nok.relationship} />
      <Field x={340} y={310} label="ID NUMBER" value={nok.idNumber} />
      <rect x="100" y="390" width="250" height="46" rx="23" fill="#dcfce7" />
      <text x="122" y="421" fontSize="20" fontWeight="700" fill="#166534">
        ✓ Consent verified
      </text>
      <Watermark x={560} y={420} />
    </svg>
  );
}

const images: Record<DocId, () => ReactNode> = {
  front: IdFront,
  back: IdBack,
  selfie: Selfie,
  mpesa: Statement,
  nok: NextOfKin,
};

// `thumb` fills a small square by cropping; `full` shows the whole document.
export function DocumentImage({ id, variant }: { id: DocId; variant: 'thumb' | 'full' }) {
  const Image = images[id];
  return (
    <div
      className={
        variant === 'thumb'
          ? 'h-14 w-20 flex-none overflow-hidden rounded-lg border border-gray-200 bg-white [&>svg]:h-full [&>svg]:w-full'
          : 'w-full overflow-hidden rounded-lg border border-gray-200 bg-white [&>svg]:h-auto [&>svg]:w-full'
      }
    >
      <Image />
    </div>
  );
}

// Photos of the ID the rider takes at hand-over: snapshots on a table, not
// scans, so they read differently from the KYC uploads they are compared against.
export type HandoverShot = 'id-front' | 'id-back';

export function HandoverPhoto({ shot, holder, stamp }: { shot: HandoverShot; holder: IdHolder; stamp: string }) {
  return (
    <svg viewBox="0 0 860 540" role="img" aria-label={`Sample photo of the ID ${shot === 'id-front' ? 'front' : 'back'} at hand-over`}>
      <defs>
        <linearGradient id="table" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b6b4a" />
          <stop offset="1" stopColor="#5b4330" />
        </linearGradient>
      </defs>
      <rect width="860" height="540" fill="url(#table)" />
      <g transform="translate(130 70) rotate(-4 300 190) scale(0.7)">{shot === 'id-front' ? <IdFrontArt holder={holder} /> : <IdBackArt holder={holder} />}</g>
      <rect x="0" y="490" width="860" height="50" fill="#000" opacity="0.45" />
      <text x="20" y="522" fontSize="20" fill="#fff" fontFamily="ui-monospace, monospace">
        {stamp}
      </text>
    </svg>
  );
}
