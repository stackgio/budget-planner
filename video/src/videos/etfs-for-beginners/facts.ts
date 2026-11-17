import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. No dollar amounts, weights,
 * allocations, payout schedules or returns are shown in this video.
 */
export const FACTS = {
	vooHoldings: fact(500, 'historical', 'VOO tracks the S&P 500 Index (~500 large U.S. companies) — Vanguard fund page; shown as "~500"'),
};

/**
 * Creator assets. The real cropped VOO holdings screenshot goes here
 * (copy it to public/motion/etfs-for-beginners/assets/). While it is null
 * the "This is one I own" beat shows a clean VOO fund card with an
 * "I OWN THIS ONE" tag — never a mock brokerage screen.
 *  redact: regions (in the image's natural pixels) to blur — balances, account numbers, names.
 */
export const ASSETS: {
	vooScreenshot: null | {src: string; natural: {w: number; h: number}; redact: {x: number; y: number; w: number; h: number}[]};
} = {
	vooScreenshot: null,
};

/** Example holdings named on tiles. All are S&P 500 members (so held by VOO, VTI and VT); tiles are equal-size examples, not weights. */
export const US_TILES = {
	top: ['Amazon', 'Nvidia', 'Visa'],
	mid: ['Apple', 'Microsoft'],
	bottom: ['Walmart', 'Netflix', 'Costco'],
};
/** Example non-U.S. holdings of VXUS (FTSE Global All Cap ex US Index). */
export const INTL_TILES = ['Toyota', 'Nestlé'];
