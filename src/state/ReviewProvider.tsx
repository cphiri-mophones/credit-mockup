import { useEffect, useState, type ReactNode } from 'react';
import { initialState, loadState, ReviewContext, saveState, withLog, type ReviewContextValue, type ReviewState } from './review';

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReviewState>(loadState);
  const stage = state.activation.stage;

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
            { ...s, outcome: 'activated', completed: [...s.completed, 'activate'], activation: { ...s.activation, stage: 'done' } },
            `${s.activation.activateAs === 'loan' ? 'Loan' : 'Cash sale'} activated`,
          );
        }
        return s;
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, [stage]);

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
