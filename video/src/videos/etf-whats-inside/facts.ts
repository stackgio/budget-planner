import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. No prices, returns, yields or
 * dollar amounts appear in this video.
 */
export const FACTS = {
	/** VGT: Vanguard Information Technology ETF tracks the MSCI US IMI Information Technology 25/50 index — shown as "U.S. INFORMATION TECHNOLOGY" (no number). */
	vooHoldings: fact(
		500,
		'historical',
		'VOO tracks the S&P 500 index (~500 large U.S. companies; holding count is ~500, shown as "ABOUT 500" as narrated). Source: Vanguard VOO fund page.',
	),
	nasdaq100: fact(
		100,
		'historical',
		'QQQM tracks the Nasdaq-100 index: the 100 largest nonfinancial companies listed on the Nasdaq (Invesco QQQM fund page / Nasdaq index methodology). Shown as "100 LARGE NONFINANCIAL NASDAQ-LISTED COMPANIES".',
	),
};
