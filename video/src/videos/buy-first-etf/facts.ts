import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. All order figures are read off Gio's
 * real Robinhood recording (ScreenRecording_11-08-2026_18-22-01_1.MP4).
 */
const SRC = "Gio's Robinhood VOO order recording, 11-08-2026 6:22 PM";
export const FACTS = {
	estCost: fact(10.01, 'personal', `${SRC}: "Estimated cost $10.01" (buy, review and queued screens)`),
	shares: fact(0.014771, 'personal', `${SRC}: "Number of shares 0.014771"`),
	sharesPurchased: fact(0, 'personal', `${SRC}: queued screen "Shares purchased 0 of 0.014771"`),
	// expense ratios — live issuer pages re-checked 2026-11-13
	erVOO: fact(0.03, 'historical', 'investor.vanguard.com VOO profile: expense ratio 0.03% as of 04/28/2026'),
	erSPY: fact(0.0945, 'historical', 'ssga.com SPY: gross expense ratio 0.0945% (page as of Nov 11 2026)'),
	erIVV: fact(0.03, 'historical', 'ishares.com IVV: expense ratio 0.03% (fees as stated in the prospectus)'),
	erSPYM: fact(0.02, 'historical', 'ssga.com SPYM: gross expense ratio 0.02% as of Oct 31 2026'),
	sp500Companies: fact(500, 'computed', 'narration "about 500 big US companies" (the index holds ~503 stocks); the grid is illustrative'),
};

export const usd = (v: number) => `$${v.toFixed(2)}`;
