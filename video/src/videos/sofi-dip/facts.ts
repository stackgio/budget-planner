import {fact} from '../../story/lib/meta';
import closes from './closes.json';

const pct = (a: number, b: number) => (b / a - 1) * 100;
const n = closes.IXIC.length;

/** Every number on screen, with provenance. */
export const FACTS = {
	// historical — Yahoo Finance daily closes; Nov 5 closes cross-checked vs Reuters & CNBC
	nasdaqClose: fact(closes.IXIC[n - 1], 'historical', 'Nasdaq Composite close Nov 5, 2026: 24,315.00 (Yahoo Finance; Reuters/CNBC)'),
	spxClose: fact(closes.GSPC[n - 1], 'historical', 'S&P 500 close Nov 5, 2026: 7,353.73 (Yahoo Finance; Reuters/CNBC)'),
	nasdaqPct: fact(pct(closes.IXIC[n - 2], closes.IXIC[n - 1]), 'computed', 'Nov 4 → Nov 5 close: -5.52% (Reuters: -5.52%)'),
	spxPct: fact(pct(closes.GSPC[n - 2], closes.GSPC[n - 1]), 'computed', 'Nov 4 → Nov 5 close: -4.36% (Reuters: -4.36%)'),
	// historical — SoFi Q3 2026 earnings release (Oct 27, 2026), investors.sofi.com
	revenueQ3: fact(1385.099, 'historical', 'SoFi Q3 2026 GAAP total net revenue $1,385.1M (adjusted $1,371.1M) — both round to $1.4B'),
	membersQ3: fact(17.074272, 'historical', 'SoFi members Sep 30, 2026: 17,074,272'),
	// personal — the creator's order confirmation screenshot (unaltered)
	shares: fact(6, 'personal', 'screenshot: 6 of 6 shares purchased'),
	avgPrice: fact(16.2, 'personal', 'screenshot: average price $16.20'),
	totalCost: fact(97.18, 'personal', 'screenshot: total cost $97.18 (6 × $16.20 = $97.20; avg price is rounded)'),
};

/** SoFi quarterly series, Q3 2024 → Q3 2026 (Table 5/6 of the Q3 2026 release). */
export const QUARTERS = ["Q3'24", "Q4'24", "Q1'25", "Q2'25", "Q3'25", "Q4'25", "Q1'26", "Q2'26", "Q3'26"];
export const REVENUE_M = [697.121, 734.125, 771.759, 854.944, 961.6, 1025.051, 1100.368, 1218.676, 1385.099]; // GAAP total net revenue, $M
export const MEMBERS_M = [9.372615, 10.127323, 10.915811, 11.745572, 12.642375, 13.651002, 14.706040, 15.814418, 17.074272];

export const NASDAQ = closes.IXIC;
export const SPX = closes.GSPC;
export const DATES = closes.dates;
