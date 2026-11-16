import { createContext, useContext } from 'react';
import { application, plans, type DocId, type PlanId } from '../data/application';

export type Step = 'verify' | 'offer' | 'call' | 'decide' | 'activate';
export const STEPS: Step[] = ['verify', 'offer', 'call', 'decide', 'activate'];

export type Validity = 'valid' | 'invalid' | null;
export type CallOutcome = 'reached' | 'callback' | 'ended' | '';
export type DecisionChoice = 'loan' | 'cash' | 'reject' | '';
export type ActivationStage = 'none' | 'creating' | 'review' | 'waiting' | 'activating' | 'done';
export type Outcome = 'in-progress' | 'sent-back' | 'callback' | 'rejected' | 'activated';

export interface CallAnswers {
  proceed: string;
  idNumber: string;
  fullName: string;
  otherPhone: string;
  dataConsent: string;
  location: string;
  payer: string;
  mpesaAsked: string[];
  mpesaSatisfactory: string;
  offerConfirmed: string;
  primaryUse: string;
  income: string;
  renewedAware: string;
  terms: string;
  hospicash: string;
  homeLocation: string;
  pickupPlace: string;
  pickupDate: string;
  pickupTime: string;
  understanding: string;
  outcome: CallOutcome;
  callbackDate: string;
  callbackTime: string;
  endReason: string;
  notes: string;
}

export interface ReviewState {
  completed: Step[];
  outcome: Outcome;
  docs: Record<DocId, Validity>;
  risk: { finalScore: string; flag: string; previousLoans: string; highDepositOverride: string };
  offer: { planId: PlanId; deposit: 'normal' | 'high'; initialWeeks: number };
  call: CallAnswers;
  decision: { choice: DecisionChoice; cashType: string; rejectReason: string; note: string; afterApproval: 'delivery' | 'sell-cash' };
  activation: { stage: ActivationStage; paid: boolean; payerMatches: boolean; handedOver: boolean; locked: boolean; activateAs: 'loan' | 'cash' };
  log: { at: string; text: string }[];
  notes: { at: string; by: string; text: string }[];
}

export const initialState: ReviewState = {
  completed: [],
  outcome: 'in-progress',
  docs: { front: null, back: null, selfie: null, mpesa: null, nok: null },
  risk: { finalScore: '', flag: 'No flag', previousLoans: 'First time loan', highDepositOverride: 'None' },
  offer: { planId: 'ms35', deposit: 'high', initialWeeks: 1 },
  call: {
    proceed: '',
    idNumber: '',
    fullName: '',
    otherPhone: '',
    dataConsent: '',
    location: '',
    payer: '',
    mpesaAsked: [],
    mpesaSatisfactory: '',
    offerConfirmed: '',
    primaryUse: '',
    income: '',
    renewedAware: '',
    terms: '',
    hospicash: '',
    homeLocation: '',
    pickupPlace: 'Mophones shop',
    pickupDate: '',
    pickupTime: '',
    understanding: '',
    outcome: '',
    callbackDate: '',
    callbackTime: '',
    endReason: '',
    notes: '',
  },
  decision: { choice: '', cashType: 'Credit', rejectReason: '', note: '', afterApproval: 'delivery' },
  activation: { stage: 'none', paid: false, payerMatches: true, handedOver: false, locked: false, activateAs: 'loan' },
  log: [
    { at: '9 Nov, 11:07', text: 'Sales agent submitted the application' },
    { at: '9 Nov, 11:05', text: 'Next of kin consent verified' },
    { at: '9 Nov, 11:02', text: 'Consent code sent to next of kin' },
  ],
  notes: [],
};

const STORAGE_KEY = 'credit-review-mockup:v1';

export function loadState(): ReviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...(JSON.parse(raw) as Partial<ReviewState>) } : initialState;
  } catch {
    return initialState;
  }
}

export function saveState(state: ReviewState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: the mockup still works for this session.
  }
}

export function now(): string {
  return new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function withLog(s: ReviewState, text: string): ReviewState {
  return { ...s, log: [{ at: now(), text }, ...s.log] };
}

export interface ReviewContextValue {
  state: ReviewState;
  update: (fn: (s: ReviewState) => ReviewState) => void;
  completeStep: (step: Step, logText: string) => void;
  addLog: (text: string) => void;
  reset: () => void;
}

export const ReviewContext = createContext<ReviewContextValue | null>(null);

export function useReview(): ReviewContextValue {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReview must be used inside ReviewProvider');
  return ctx;
}

export function selectedPlan(state: ReviewState) {
  return plans.find((p) => p.id === state.offer.planId) ?? plans[0];
}

// One figure used everywhere the customer is told what to pay upfront.
export function initialPayment(state: ReviewState): number | null {
  const plan = selectedPlan(state);
  if (plan.deposit === null || plan.weekly === null) return null;
  return plan.deposit + plan.weekly * state.offer.initialWeeks;
}

export function offerWithinLimit(state: ReviewState): boolean {
  const limit = state.offer.deposit === 'high' ? application.fateGuide.highDepositLimit : application.fateGuide.normalDepositLimit;
  return application.product.cashPrice <= limit;
}

export function currentStep(state: ReviewState): Step {
  return STEPS.find((s) => !state.completed.includes(s)) ?? 'activate';
}

// The final risk score is optional; without an override the system CRB score stands.
export function finalRiskScore(state: ReviewState): string {
  return state.risk.finalScore || application.crb.systemScore;
}
