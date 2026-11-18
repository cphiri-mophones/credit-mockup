// Mock data for the example application walked through in the
// "Credit Process: Current State" doc. Figures not seen in Mo.OS are null.

export type PlanId = 'saver' | 'ms25' | 'ms35';

export interface Plan {
  id: PlanId;
  name: string;
  term: string;
  deposit: number | null;
  weekly: number | null;
  totalLoan: number | null;
}

export const application = {
  id: '6af18a7fa1bedcaf02d23ef7',
  customer: {
    name: 'Jeff Clooney',
    idNumber: '33582798',
    phone: '254723938444',
    email: 'clooneyjeff3@gmail.com',
    salesAgent: '225_Terry',
    submitted: '9 Nov 2026',
    loanType: 'First loan',
    saleType: '1P',
    purchaseMode: 'Loan',
  },
  product: {
    name: 'Samsung Galaxy S23 Ultra 256GB',
    cashPrice: 56999,
  },
  fateGuide: {
    band: 'Orange',
    sdi: '48.78%',
    highDepositLimit: 56999,
    normalDepositLimit: 40898,
    plans: ['MoSaver', 'MoStandard 25', 'MoStandard 35'],
  },
  crb: {
    systemScore: '7_Cscore',
    notes: [
      'Past defaults up to KES 50,000',
      'Open loans up to KES 200,000, with overdues',
      'Not paid any recent loan over 5k',
    ],
  },
  nok: {
    name: 'Teddy Mungai Kamunyu',
    relationship: 'Father / mother',
    idNumber: '22183255',
    consent: "Consent verified 9 Nov by Teresia Kirung'o",
  },
  checks: [
    { label: 'Customer: duplicate, IPRS, M-Pesa', result: 'Passed' },
    { label: 'Next of kin: duplicate, IPRS, M-Pesa', result: 'Passed' },
    { label: 'M-Pesa statement', result: 'Passed' },
    { label: 'Liveness', result: 'Waiting' },
  ],
  riskFlag: 'Low risk',
  device: {
    imei: '3554641137516D5B',
    mdmProvider: 'NuovoPay',
  },
} as const;

export const plans: Plan[] = [
  { id: 'saver', name: 'MoSaver', term: '6 months, weekly', deposit: null, weekly: null, totalLoan: null },
  { id: 'ms25', name: 'MoStandard 25', term: 'Weekly', deposit: null, weekly: null, totalLoan: null },
  { id: 'ms35', name: 'MoStandard 35', term: '12 months, weekly', deposit: 19899, weekly: 1290, totalLoan: 102598.2 },
];

export const documents = [
  { id: 'front', thumb: 'ID', name: 'ID front', meta: 'National ID · uploaded 9 Nov' },
  { id: 'back', thumb: 'ID', name: 'ID back', meta: 'National ID · uploaded 9 Nov' },
  { id: 'selfie', thumb: 'IMG', name: 'Selfie', meta: 'Liveness check waiting' },
  { id: 'mpesa', thumb: 'PDF', name: 'M-Pesa statement', meta: 'No gaps in recent months' },
  { id: 'nok', thumb: 'NOK', name: 'Next of kin', meta: 'Teddy Mungai Kamunyu · consent verified' },
] as const;

export type DocId = (typeof documents)[number]['id'];

// Illustrative rows: values other than Jeff Clooney's were not taken from Mo.OS.
export const sampleQueueRows = [
  {
    name: 'Sample applicant A', idNumber: '2•••••41', phone: '2547•••••118', loan: 'First loan · 3P', stage: 'Call', next: 'Call back due 14:00', waiting: '2 hours',
    callStatus: 'Not reached', fpm: 'F2', fateGuide: 'Green', product: 'Tecno Spark 20 Pro 128GB', seller: 'Partner shop 12', channel: 'Offline agent', location: 'Thika', agent: '118_Wanjiru', submitted: '14 Nov 2026', owner: 'You',
  },
  {
    name: 'Sample applicant B', idNumber: '3•••••07', phone: '2547•••••562', loan: 'Second loan · 1P', stage: 'Decide', next: 'Approve, offer cash or reject', waiting: '1 day',
    callStatus: 'OK reached', fpm: 'F1', fateGuide: 'Orange', product: 'Apple iPhone 13 Pro Max 512GB', seller: 'Mophones', channel: 'Online agent', location: 'Mophones shop', agent: '225_Terry', submitted: '15 Nov 2026', owner: 'You',
  },
  {
    name: 'Sample applicant C', idNumber: '2•••••93', phone: '2547•••••730', loan: 'First loan · 1P', stage: 'Waiting on system', next: 'Fate Guide still processing the statement', waiting: '20 minutes',
    callStatus: '', fpm: 'F4', fateGuide: '', product: 'Moto G Power (2023) 128GB', seller: 'Mophones', channel: 'Online agent', location: 'Kisumu', agent: '301_Otieno', submitted: '16 Nov 2026', owner: 'You',
  },
];

// Read-only detail seen on the old Mo.OS detail tabs for this application.
export const details = {
  validations: {
    customer: [
      { check: 'Duplicate', result: 'Passed', checked: '9 Nov 2026' },
      { check: 'IPRS', result: 'Passed', checked: '9 Nov 2026' },
      { check: 'M-Pesa', result: 'Passed', checked: '9 Nov 2026' },
    ],
    nextOfKin: [
      { check: 'Duplicate', result: 'Passed', checked: '9 Nov 2026' },
      { check: 'IPRS', result: 'Passed', checked: '9 Nov 2026' },
      { check: 'M-Pesa', result: 'Passed', checked: '9 Nov 2026' },
    ],
    prospect: [
      { check: 'M-Pesa statement', result: 'Passed', checked: '9 Nov 2026' },
      { check: 'Liveness', result: 'Waiting for input', checked: '9 Nov 2026' },
      { check: 'Risk', result: 'Passed', checked: '9 Nov 2026' },
    ],
  },
  nokConsent: {
    sentTo: '254722622098',
    sentAt: '9 Nov 2026, 11:02',
    verifiedAt: '9 Nov 2026, 11:05',
    verifiedBy: "Teresia Kirung'o",
  },
  mpesaGaps: 'No gaps',
  crbReport: [
    { label: 'Recent loans', value: 'Not paid any recent loan over 5k' },
    { label: 'Date of birth', value: '25 Feb 1997' },
    { label: 'Open loan overdues', value: 'Has open loan overdues' },
    { label: 'Past default record', value: 'Up to KES 50,000' },
    { label: 'Past defaults', value: 'Past defaults' },
    { label: 'Open loan record', value: 'Up to KES 200,000' },
  ],
  productSpecs: [
    { label: 'SKU', value: 'SAMSUNG-GALAXY-S23-ULTRA-256' },
    { label: 'Seller', value: 'Mophones' },
    { label: 'Retail price', value: 'KES 91,499' },
    { label: 'Release year', value: '2023' },
    { label: 'Chipset', value: 'Snapdragon 8 Gen 2' },
    { label: 'Display', value: 'Quad HD+ (1440p)' },
    { label: 'OS', value: 'Android 13 / One UI 5.1' },
    { label: 'SIM', value: 'Dual SIM (Nano + eSIM)' },
    { label: 'IP rating', value: 'IP68' },
  ],
  agentSubmitted: {
    channel: 'Online agent',
    location: 'MOPHONES_S…',
    employment: 'Not given',
    deviceNeeded: '9 Nov 2026',
  },
  history: {
    mostRecentPhone: 'Huawei',
    previousLoans: 'No',
    openLoans: 'No',
    defaultedLoan: 'No',
  },
} as const;

// A fictional cash application: cash sales skip scoring and the credit call.
export const cashApplication = {
  id: 'sample-cash-0001',
  customer: {
    name: 'Grace Atieno',
    idNumber: '12345678',
    phone: '254700000012',
    salesAgent: '225_Terry',
    submitted: '16 Nov 2026',
    saleType: '1P',
    channel: 'Mophones shop',
    dob: '08.07.1994',
  },
  imei: '356789104455120',
} as const;

// Devices offered for a cash sale. Only the S23 Ultra price was seen in Mo.OS;
// the others are illustrative.
export const cashCatalog = [
  { id: 's23u', name: 'Samsung Galaxy S23 Ultra 256GB', cashPrice: 56999, inStock: true, seen: true },
  { id: 'ip13pm', name: 'Apple iPhone 13 Pro Max 512GB', cashPrice: 89999, inStock: true, seen: false },
  { id: 'ip13p', name: 'Apple iPhone 13 Pro 256GB', cashPrice: 74999, inStock: false, seen: false },
  { id: 'flip2', name: 'Tecno Phantom V Flip2 256GB', cashPrice: 49999, inStock: true, seen: false },
  { id: 'spark20', name: 'Tecno Spark 20 Pro 128GB', cashPrice: 18499, inStock: true, seen: false },
  { id: 'motog', name: 'Moto G Power (2023) 128GB', cashPrice: 17999, inStock: true, seen: false },
] as const;

export type CashDeviceId = (typeof cashCatalog)[number]['id'];

export function kes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
}
