import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. All inputs are HYPOTHETICAL
 * placeholders (shown with an "EXAMPLE" label) until the creator supplies
 * their real figures. Derived values are computed here, never typed.
 */
const carPayment = 450;
const salary = 40000;
const cardBalance = 3000;
const apr = 0.24;
const minPctOfBalance = 0.01; // common card minimum: 1% of balance + that month's interest
const matchRate = 0.04;

const monthlyInterest = (cardBalance * apr) / 12;
const minPayment = cardBalance * minPctOfBalance + monthlyInterest;

export const FACTS = {
	carPayment: fact(carPayment, 'hypothetical', 'example monthly car payment'),
	salary: fact(salary, 'hypothetical', 'example gross salary at 22'),
	carYear: fact(carPayment * 12, 'computed', 'carPayment × 12'),
	cardBalance: fact(cardBalance, 'hypothetical', 'example card balance'),
	aprPct: fact(apr * 100, 'hypothetical', 'example APR (typical US card rate)'),
	monthlyInterest: fact(monthlyInterest, 'computed', 'balance × APR / 12'),
	minPayment: fact(minPayment, 'computed', '1% of balance + monthly interest'),
	toBalance: fact(minPayment - monthlyInterest, 'computed', 'minPayment − interest'),
	matchPct: fact(matchRate * 100, 'hypothetical', 'example employer 401(k) match'),
	matchYear: fact(salary * matchRate, 'computed', 'salary × match rate'),
};

export const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

/** Small "EXAMPLE" chip every scene with a hypothetical number shows. */
export const EXAMPLE_LABEL = 'EXAMPLE NUMBERS';
