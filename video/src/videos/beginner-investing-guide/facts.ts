import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. Components import from here —
 * never type a figure into a scene.
 */
const REC = "creator's Robinhood screen recording (ScreenRecording_11-08-2026_18-22-01), order screen";
const DIV = "creator's VOO dividend screenshot (Robinhood, Individual investing)";

export const FACTS = {
	// --- real order from the screen recording (queued for market open, NOT shown as filled) ---
	orderShares: fact(0.014771, 'personal', `${REC}: Number of shares`),
	orderEstCost: fact(10.01, 'personal', `${REC}: Estimated cost`),
	vooMarketPrice: fact(677.04, 'personal', `${REC}: Market price at time of recording`),

	// --- real dividend (screenshot) ---
	dividendTotal: fact(5.35, 'personal', `${DIV}: Total amount`),
	dividendPerShare: fact(1.82, 'personal', `${DIV}: Amount per share`),
	dividendShares: fact(2.938, 'personal', `${DIV}: Number of shares`),
	reinvestShares: fact(0.007628, 'personal', `${DIV}: Reinvestment amount (shares)`),
	reinvestPrice: fact(701.34, 'personal', `${DIV}: Reinvestment price per share`),

	// --- general / educational ---
	sp500Companies: fact(500, 'historical', 'S&P 500 index: ~500 large U.S. companies (shown as "~500")'),

	// --- illustrative example (labelled EXAMPLE on screen) ---
	examplePerPaycheck: fact(10, 'hypothetical', 'illustrative contribution per paycheck'),
	examplePaychecks: fact(4, 'hypothetical', 'illustrative number of paychecks'),
};

/** $10 as a share of one VOO share at the recorded market price (computed). */
export const tenDollarFractionPct = (10 / FACTS.vooMarketPrice.value) * 100; // ≈ 1.48 %
export const exampleTotal = FACTS.examplePerPaycheck.value * FACTS.examplePaychecks.value; // $40

// Dates exactly as shown on the dividend screenshot.
export const DIV_DATES = {exDiv: 'Sep 28, 2026', paid: 'Sep 30, 2026', reinvested: 'Oct 1, 2026'};
