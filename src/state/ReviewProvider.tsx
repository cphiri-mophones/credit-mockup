import { useEffect, useState, type ReactNode } from 'react';
import { initialState, loadState, ReviewContext, saveState, withCashLog, withLog, type ReviewContextValue, type ReviewState } from './review';

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReviewState>(loadState);
  const stage = state.activation.stage;
  const cashStage = state.cash.stage;

  useEffect(() => saveState(state), [state]);

  // Stand-ins for the background jobs: order creation and sale creation.
  useEffect(() => {
    if (stage !== 'creating' && stage !== 'activating') return;
    const timer = setTimeout(() => {
      setState((s) => {
        if (s.activation.stage === 'creating') {
          return withLog({ ...s, activation: { ...s.activation, stage: 'waiting' } }, 'Order created');
        }
        if (s.activation.stage === 'activating') {
          return withLog(
            withLog(
              { ...s, outcome: 'activated', completed: [...s.completed, 'activate'], activation: { ...s.activation, stage: 'done' } },
              `${s.activation.activateAs === 'loan' ? 'Loan' : 'Cash sale'} activated`,
            ),
            'Device unlocked',
          );
        }
        return s;
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, [stage]);

  // Same background jobs for the cash sale.
  useEffect(() => {
    if (cashStage !== 'creating' && cashStage !== 'activating') return;
    const timer = setTimeout(() => {
      setState((s) => {
        if (s.cash.stage === 'creating') return withCashLog({ ...s, cash: { ...s.cash, stage: 'waiting' } }, 'Order created');
        if (s.cash.stage === 'activating') {
          return withCashLog({ ...s, cash: { ...s.cash, stage: 'done', completed: [...s.cash.completed, 'activate'] } }, 'Cash sale completed');
        }
        return s;
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, [cashStage]);

  const value: ReviewContextValue = {
    state,
    update: (fn) => setState(fn),
    completeStep: (step, logText) =>
      setState((s) => withLog({ ...s, completed: s.completed.includes(step) ? s.completed : [...s.completed, step] }, logText)),
    addLog: (text) => setState((s) => withLog(s, text)),
    reset: () => setState(initialState),
  };

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}
