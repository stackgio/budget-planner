import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. Retrieved 2026-11-04 from the
 * official fund pages (via Firecrawl, live fetch). Screenshots of the same
 * pages are in public/motion/invest-first-100/assets (crops, pixels untouched)
 * and projects/invest-first-100/evidence (full pages).
 */
const VG_VTI = 'investor.vanguard.com/investment-products/etfs/profile/vti';
const VG_VXUS = 'investor.vanguard.com/investment-products/etfs/profile/vxus';
const VXUS_FS = 'fund-docs.vanguard.com/F3369.pdf (VXUS fact sheet)';
const SCHWAB = 'schwabassetmanagement.com/products/schd';

export const SOURCES = {
	vti: 'Vanguard · VTI fund page',
	vxus: 'Vanguard · VXUS fund page',
	vxusFactSheet: 'Vanguard · VXUS fact sheet',
	schd: 'Schwab Asset Management · SCHD page',
};

// The plan (the creator's script): these are the allocation, not data.
export const PLAN = {
	total: fact(100, 'personal', "creator's script"),
	vti: fact(70, 'personal', "creator's script"),
	schd: fact(20, 'personal', "creator's script"),
	vxus: fact(10, 'personal', "creator's script"),
};
export const planSum = PLAN.vti.value + PLAN.schd.value + PLAN.vxus.value; // must equal PLAN.total
export const pct = (v: number) => Math.round((v / PLAN.total.value) * 100);

export const VTI = {
	name: 'Vanguard Morningstar Total Stock Market ETF',
	indexCoverage: fact(100, 'historical', `${VG_VTI} · Fund management: index ≈ 100% of the investable U.S. stock market`),
	stocks: fact(3519, 'historical', `${VG_VTI} · Characteristics, Number of stocks, as of 09/30/2026`),
	asOf: '09/30/2026',
	// Holding details (% of fund), as of 09/30/2026
	aapl: fact(6.63, 'historical', `${VG_VTI} · Holding details, as of 09/30/2026`),
	msft: fact(5.19, 'historical', `${VG_VTI} · Holding details, as of 09/30/2026`),
	amzn: fact(3.3, 'historical', `${VG_VTI} · Holding details, as of 09/30/2026`),
	close: fact(371.21, 'historical', `${VG_VTI} · Market price (close) as of 11/03/2026`),
};

export const SCHD = {
	name: 'Schwab U.S. Dividend Equity ETF',
	holdings: fact(102, 'historical', `${SCHWAB} · Fund Profile, Total Holdings, as of 11/03/2026`),
	holdingsAsOf: '11/03/2026',
	objective: 'Track the total return of the Dow Jones U.S. Dividend 100™ Index',
	highlight: 'Tracks an index focused on the quality and sustainability of dividends',
	// Top holdings, % of assets, as of 11/03/2026
	top: [
		{t: 'TXN', w: 4.8},
		{t: 'PG', w: 4.3},
		{t: 'KO', w: 4.21},
		{t: 'CVX', w: 4.17},
		{t: 'COP', w: 4.12},
	],
	close: fact(35.55, 'historical', `${SCHWAB} · NAV / previous close as of 11/03/2026`),
};

export const VXUS = {
	name: 'Vanguard Total International Stock ETF',
	stocks: fact(8901, 'historical', `${VG_VXUS} + ${VXUS_FS} · Number of stocks, as of 09/30/2026`),
	asOf: '09/30/2026',
	// Ten largest market allocations, % of common stock (fact sheet), as of 09/30/2026
	japan: fact(16.1, 'historical', `${VXUS_FS} · market allocation, as of 09/30/2026`),
	germany: fact(4.6, 'historical', `${VXUS_FS} · market allocation, as of 09/30/2026`),
	canada: fact(7.9, 'historical', `${VXUS_FS} · market allocation, as of 09/30/2026`),
	close: fact(82.25, 'historical', `${VG_VXUS} · Market price (close) as of 11/03/2026`),
};

/** Fractional shares the plan would buy at the 11/03/2026 closing prices (computed). */
export const SHARES = {
	vti: fact(PLAN.vti.value / VTI.close.value, 'computed', '$70 / VTI close 11/03/2026'),
	schd: fact(PLAN.schd.value / SCHD.close.value, 'computed', '$20 / SCHD close 11/03/2026'),
	vxus: fact(PLAN.vxus.value / VXUS.close.value, 'computed', '$10 / VXUS close 11/03/2026'),
};

/** Ending: recurring contributions (EXAMPLE — contributions only, no returns). */
export const RECURRING = {
	monthly: fact(100, 'hypothetical', 'example: the same $100 each month'),
	months: fact(12, 'hypothetical', 'example: one year'),
};
export const recurringTotal = RECURRING.monthly.value * RECURRING.months.value;

if (planSum !== PLAN.total.value) throw new Error(`allocation adds to ${planSum}, not ${PLAN.total.value}`);
