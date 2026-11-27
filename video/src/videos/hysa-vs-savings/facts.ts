import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. Example rates (not a specific bank),
 * compounded once a year, rate held for 3 years. Labelled "EXAMPLE" on screen.
 */
const DEPOSIT = 5000;
const BIG_APY = 0.0001; // 0.01%
const HYSA_APY = 0.045; // 4.50%
const YEARS = 3;

const balance = (apy: number, y: number) => DEPOSIT * Math.pow(1 + apy, y);
const r2 = (v: number) => Math.round(v * 100) / 100;

export const FACTS = {
	deposit: fact(DEPOSIT, 'hypothetical', 'example deposit (creator script)'),
	bigApyPct: fact(0.01, 'hypothetical', 'typical big-bank savings APY, example (creator script)'),
	hysaApyPct: fact(4.5, 'hypothetical', 'example HYSA APY (creator script); rates are variable'),
	years: fact(YEARS, 'hypothetical', 'example holding period'),
	/** balances after year 1..3 */
	bigBalances: [1, 2, 3].map((y) => fact(r2(balance(BIG_APY, y)), 'computed', `$5,000 × 1.0001^${y}`)),
	hysaBalances: [1, 2, 3].map((y) => fact(r2(balance(HYSA_APY, y)), 'computed', `$5,000 × 1.045^${y}`)),
	bigEarned: fact(r2(balance(BIG_APY, YEARS) - DEPOSIT), 'computed', '$5,000 × (1.0001³ − 1) = $1.50'),
	hysaEarned: fact(Math.floor(balance(HYSA_APY, YEARS) - DEPOSIT), 'computed', '$5,000 × (1.045³ − 1) = $705.83 → $705'),
	/** "costing you hundreds every year": interest missed per year, averaged over 3 years */
	missedPerYear: fact(Math.round((balance(HYSA_APY, YEARS) - balance(BIG_APY, YEARS)) / YEARS), 'computed', '($705.83 − $1.50) / 3 ≈ $235'),
	gumPrice: fact(1.99, 'hypothetical', 'illustrative price of a pack of gum'),
	fdicLimit: fact(250000, 'historical', 'FDIC standard maximum deposit insurance amount (fdic.gov), per depositor, per insured bank, per ownership category'),
};

export const usd2 = (v: number) => `$${v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
export const usd0 = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
