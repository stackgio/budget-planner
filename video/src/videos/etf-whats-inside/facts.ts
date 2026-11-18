import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. No prices, returns, yields or
 * dollar amounts appear in this video.
 */
export const FACTS = {
	vooHoldings: fact(
		500,
		'historical',
		'VOO tracks the S&P 500 index (~500 large U.S. companies; holding count is ~500, shown as "ABOUT 500" as narrated). Source: Vanguard VOO fund page.',
	),
	nasdaq100: fact(100, 'historical', 'QQQM tracks the Nasdaq-100 index (Invesco QQQM fund page). Index name, not a statistic.'),
};
