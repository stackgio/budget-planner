import type {Region} from '../../story/components/Screenshot';

const dir = 'motion/robinhood-gold-card/assets';

/** Creator's real screenshots. Regions are in natural pixels; pixels are never altered. */
export const DASH = {
	src: `${dir}/dashboard.jpg`,
	natural: {w: 1189, h: 1398},
	/** app header + gold "Gold Card" label — stops above the balance */
	top: {x: 0, y: 0, w: 1189, h: 310} as Region,
	/** card area of the dashboard (balance + available credit are above it, excluded) */
	cardArea: {x: 0, y: 690, w: 1189, h: 708} as Region,
	/** the card itself, edge to edge */
	card: {x: 72, y: 717, w: 1061, h: 668} as Region,
	cardRadius: 34,
	/** gold "Gold Card" label inside `top` */
	goldLabel: {x: 482, y: 228, w: 238, h: 62} as Region,
};

export const CASHBACK = {
	src: `${dir}/cashback.png`,
	natural: {w: 1206, h: 2622},
	/** enlarged middle: points side → arrow → Robinhood (APY text and Redeem button excluded) */
	middle: {x: 200, y: 1040, w: 860, h: 520} as Region,
	/** natural y of the transfer arrow row */
	arrowY: 1308,
};

export const PREAPPROVAL = {
	src: `${dir}/preapproval.jpg`,
	natural: {w: 1206, h: 1948},
	/** "for 3% cash back" line only */
	rate: {x: 253, y: 300, w: 700, h: 110} as Region,
};

/**
 * VOO holdings row from IMG_0756.jpeg. Set `src`, `natural` and `row` once the
 * creator's screenshot is in public/motion/robinhood-gold-card/assets/.
 * While `src` is null the shot renders a clearly marked placeholder.
 */
export const HOLDINGS: {src: string | null; natural: {w: number; h: number}; row: Region} = {
	src: `${dir}/holdings.jpg`, // IMG_0756.jpeg
	natural: {w: 1158, h: 814},
	/** VOO row only, between the divider lines (SOFI and NVDA excluded) */
	row: {x: 0, y: 353, w: 1158, h: 226},
};
