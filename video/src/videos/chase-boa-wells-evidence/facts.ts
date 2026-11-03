import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. Full URLs + capture date in
 * projects/chase-boa-wells-evidence/EVIDENCE_REPORT.md.
 */
export const CHASE_URL = 'https://www.chase.com/personal/checking/total-checking';
export const BOA_URL =
	'https://www.consumerfinance.gov/archive/newsroom/bank-of-america-for-illegally-charging-junk-fees-withholding-credit-card-rewards-opening-fake-accounts/';
export const WF_URL =
	'https://www.consumerfinance.gov/archive/newsroom/consumer-financial-protection-bureau-fines-wells-fargo-100-million-widespread-illegal-practice-secretly-opening-unauthorized-accounts/';

export const ACCESSED = 'Nov 3, 2026';

export const FACTS = {
	chaseFee: fact(15, 'historical', `${CHASE_URL} — "Otherwise a $15 Monthly Service Fee will apply." (footnote 1, captured ${ACCESSED})`),
	months: fact(12, 'computed', 'months in a year'),
	boaYear: fact(2023, 'historical', `${BOA_URL} — dated JUL 11, 2023`),
	wfYear: fact(2016, 'historical', `${WF_URL} — dated SEP 08, 2016`),
};

/** $15 × 12 — the POTENTIAL yearly cost if the fee is charged all 12 months. */
export const CHASE_YEARLY = FACTS.chaseFee.value * FACTS.months.value;
