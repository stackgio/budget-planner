import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. All money figures in this episode
 * are HYPOTHETICAL (from the locked script) and labelled on screen.
 */
const acRepair = fact(5000, 'hypothetical', 'Script L1/L12: "five thousand dollars for a new AC" — illustrative estimate, no real contractor or quote');
const buyPrice = fact(300_000, 'hypothetical', 'Script L18: "buy for three hundred grand"');
const sellPrice = fact(400_000, 'hypothetical', 'Script L18: "sell for four hundred"');

export const FACTS = {
	acRepair,
	buyPrice,
	sellPrice,
	/** sale price − purchase price. NOT profit: the script gives no profit figure. */
	priceIncrease: fact(sellPrice.value - buyPrice.value, 'computed', 'sellPrice − buyPrice (before interest, repairs, fees)'),
};

export const usdK = (v: number) => `$${Math.round(v / 1000)}K`;
