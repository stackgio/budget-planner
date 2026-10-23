import { useState } from 'react';
import { useStore } from '../store';
import { Segmented } from '../components/ui';
import { Overview } from '../components/budget/Overview';
import { Plan } from '../components/budget/Plan';
import { Paychecks } from '../components/budget/Paychecks';
import { Review } from '../components/budget/Review';

type Sub = 'overview' | 'plan' | 'paychecks' | 'review';
const SUB_KEY = 'spend-smarter:budget-tab';

function initialSub(): Sub {
  try {
    const v = window.sessionStorage.getItem(SUB_KEY);
    if (v === 'overview' || v === 'plan' || v === 'paychecks' || v === 'review') return v;
  } catch {
    // storage blocked; fall back to the dashboard
  }
  return 'overview';
}

/** The 55/20/15/10 Budget Manager. */
export function Budget() {
  const { data } = useStore();
  const [sub, setSubState] = useState<Sub>(initialSub);
  const setSub = (s: Sub) => {
    setSubState(s);
    try {
      window.sessionStorage.setItem(SUB_KEY, s);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0 });
  };
  const p = data.budget.percents;

  return (
    <>
      <header className="page-header">
        <h1>Budget</h1>
        <span className={`pill ${data.budget.debtPayoff.enabled ? 'debt' : ''}`}>
          {data.budget.debtPayoff.enabled ? 'Debt Payoff Mode' : `${p.needs / 100}/${p.investing / 100}/${p.goals / 100}/${p.fun / 100}`}
        </span>
      </header>
      <div className="subtabs no-print">
        <Segmented
          label="Budget section"
          value={sub}
          onChange={setSub}
          options={[
            { value: 'overview', label: 'Dashboard' },
            { value: 'plan', label: 'Plan' },
            { value: 'paychecks', label: 'Paychecks' },
            { value: 'review', label: 'Review' },
          ]}
        />
      </div>
      {sub === 'overview' && <Overview goPlan={() => setSub('plan')} />}
      {sub === 'plan' && <Plan />}
      {sub === 'paychecks' && <Paychecks />}
      {sub === 'review' && <Review />}
    </>
  );
}
