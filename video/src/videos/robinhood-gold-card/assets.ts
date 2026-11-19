import type {Region} from '../../story/components/Screenshot';

const dir = 'motion/robinhood-gold-card/assets';

/** Creator's real screenshots. Regions are in natural pixels; pixels are never altered. */
export const DASH = {
	src: `${dir}/dashboard.jpg`,
	natural: {w: 1189, h: 1398},
	/** the gold card only (balance + available credit excluded) */
	card: {x: 44, y: 698, w: 1100, h: 700} as Region,
	/** the gold "Gold Card" heading */
	heading: {x: 390, y: 208, w: 420, h: 100} as Region,
};

export const CASHBACK = {
	src: `${dir}/cashback.png`,
	natural: {w: 1206, h: 2622},
	/** points side → arrow → Robinhood (APY text and Redeem button excluded) */
	middle: {x: 100, y: 1000, w: 1006, h: 630} as Region,
	pointsX: 308, // natural x of the Banking / points column centre
	robinhoodX: 899,
};

export const PREAPPROVAL = {
	src: `${dir}/preapproval.jpg`,
	natural: {w: 1206, h: 1948},
	/** "for 3% cash back" line only */
	rate: {x: 253, y: 300, w: 700, h: 110} as Region,
};
