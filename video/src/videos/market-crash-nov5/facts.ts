import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. Components import from here —
 * never type a figure into a scene.
 *
 * Market data: Thursday Nov 5, 2026 close. Cross-checked across AP, Reuters
 * (via Investing.com), Schwab and MT Newswires (via Fidelity) — see
 * projects/market-crash-nov5/SOURCES.md. Shown rounded to one decimal, as
 * every source reports it.
 *
 * NOTE: the Nasdaq closing LEVEL conflicts between sources (AP/MT: 24,315;
 * Schwab: 24,414.99) so only the percentage is displayed.
 */
export const FACTS = {
	nasdaqPct: fact(-5.5, 'historical', 'Nasdaq Composite −5.52% Nov 5 2026 close (Schwab; AP & Reuters −5.5%)'),
	spxPct: fact(-4.4, 'historical', 'S&P 500 −4.36% to 7,353.73 Nov 5 2026 close (Schwab, AP, MT Newswires)'),
	nvdaPct: fact(-9.3, 'historical', 'Nvidia −9.26% (−$18.53) to $181.60 Nov 5 2026 close — Investing.com, Yahoo Finance, MT Newswires (9.3%); shown at one decimal like the indexes'),
	nasdaqPts: fact(-1421.5, 'historical', 'Nasdaq Composite −1,421.5 pts Nov 5 2026 (Schwab −1,421.51; AP −1,421.52)'),
	// The creator's genuine SoFi order confirmation (screenshot sofi-order.png). Never edit.
	sofiShares: fact(6, 'personal', 'screenshot: "Shares purchased 6 of 6"'),
	sofiAvg: fact(16.2, 'personal', 'screenshot: "Average price per share $16.20"'),
	sofiTotal: fact(97.18, 'personal', 'screenshot: "Total cost $97.18"'),
};

export const SRC = {
	close: 'SOURCES: AP · SCHWAB · NOV 5, 2026 CLOSE',
	election: 'SOURCE: REUTERS · SCHWAB · NOV 5, 2026',
	reg: 'SOURCE: REUTERS · MT NEWSWIRES (ING) · NOV 5, 2026',
	roi: 'SOURCE: SCHWAB · REUTERS · NOV 5, 2026',
	nvda: 'SOURCE: MT NEWSWIRES · NOV 5, 2026 CLOSE',
};
