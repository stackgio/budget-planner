import {fact} from '../../story/lib/meta';

/** Every number on screen, with provenance. */
export const FACTS = {
	monthlySpend: fact(2500, 'personal', "creator's estimate in the voiceover (L4) — shown on screen as 'Estimated'"),
	cashBackRate: fact(0.03, 'personal', 'Robinhood Gold Card 3% cash back (creator preapproval email screenshot + voiceover L5)'),
	examplePoints: fact(1000, 'hypothetical', 'illustrative redemption: 1,000 points — labelled EXAMPLE on screen'),
	exampleRedemption: fact(10, 'hypothetical', 'illustrative $10.00 cash back for those 1,000 points — labelled EXAMPLE on screen'),
};

/** Derived in code, never typed by hand. */
export const monthlyCashBack = FACTS.monthlySpend.value * FACTS.cashBackRate.value; // 75
export const yearlyCashBack = monthlyCashBack * 12; // 900 (projection, before Gold membership cost)

export const fmt$ = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
