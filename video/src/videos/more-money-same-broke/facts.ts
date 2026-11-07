import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. All figures are the script's
 * illustrative example (labelled "EXAMPLE" on screen) — not the creator's
 * personal data and not investment returns.
 */
const oldIncome = fact(3000, 'hypothetical', 'script: "making $3,000 a month"');
const newIncome = fact(5000, 'hypothetical', 'script: "now you\'re making five thousand"');
const leftOver = fact(0, 'hypothetical', 'script: "every dollar was gone" / "gone too"');
const savePerMonth = fact(500, 'hypothetical', 'script: "saving just five hundred dollars of that raise every month"');
const months = fact(12, 'hypothetical', 'script: "in one year"');

export const FACTS = {
	oldIncome,
	newIncome,
	leftOver,
	raise: fact(newIncome.value - oldIncome.value, 'computed', 'newIncome − oldIncome'),
	savePerMonth,
	months,
	yearSaved: fact(savePerMonth.value * months.value, 'computed', 'savePerMonth × months (plain savings, no interest or returns)'),
};

// guards: the spoken numbers must equal the computed ones
if (FACTS.raise.value !== 2000) throw new Error('raise must be $2,000 per script');
if (FACTS.yearSaved.value !== 6000) throw new Error('$500 × 12 must be $6,000');

export const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
