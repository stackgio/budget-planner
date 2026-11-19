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
	src: `${dir}/cashback.png`, // IMG_0754.png
	natural: {w: 1206, h: 2622},
	/** Banking → arrow → Robinhood plus the slider (APY copy above and Redeem button below are excluded) */
	view: {x: 100, y: 980, w: 1006, h: 950} as Region,
	/** measured from the screenshot (natural px) */
	bg: '#0D0B08',
	valueColor: '#878682',
	pointsCenterX: 307,
	cashCenterX: 899,
	valueTop: 1373, // top of the digits
	valueH: 71, // digit height
	/** areas whose original static values / slider are replaced by animated layers */
	pointsPatch: {x: 160, y: 1345, w: 300, h: 125} as Region,
	cashPatch: {x: 690, y: 1345, w: 416, h: 125} as Region,
	sliderPatch: {x: 120, y: 1740, w: 986, h: 180} as Region,
	track: {x: 144, y: 1820, w: 918, h: 24, color: '#1C1A17'},
	knob: {cx: 215.5, cy: 1831.5, r: 71.5, top: '#9D8446', bottom: '#69572C'},
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
