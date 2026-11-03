import type {Region} from '../../story/components/Screenshot';

/**
 * Authentic captures (Firecrawl headless browser, 2026-11-03), cropped with ffmpeg
 * only — no pixel edits. Full-page originals live in public/motion/<slug>/raw/.
 * Regions are in each crop's natural pixels.
 */
const A = 'motion/chase-boa-wells-evidence/assets';

export const LOGO = {
	chase: {src: `${A}/logo_chase.png`, natural: {w: 150, h: 44}},
	boa: {src: `${A}/logo_boa.png`, natural: {w: 250, h: 44}},
	wf: {src: `${A}/logo_wf.png`, natural: {w: 250, h: 60}},
};

export const CHASE_FEE = {
	src: `${A}/chase_fee.png`,
	natural: {w: 460, h: 500},
	heading: {x: 60, y: 14, w: 326, h: 98} as Region, // "$15 or $0 Monthly Service Fee"
	fee15: {x: 60, y: 16, w: 86, h: 50} as Region, // "$15"
	waive: {x: 36, y: 132, w: 384, h: 54} as Region, // "You can avoid the fee by doing ONE of the following…"
	options: {x: 76, y: 196, w: 344, h: 294} as Region, // the four ways to avoid it
};

export const CHASE_NOTE = {
	src: `${A}/chase_footnote.png`,
	natural: {w: 1000, h: 80},
	view: {x: 560, y: 24, w: 430, h: 56} as Region,
	phrase: {x: 692, y: 43, w: 262, h: 18} as Region, // "Otherwise a $15 Monthly Service Fee will"
	apply: {x: 38, y: 61, w: 40, h: 16} as Region, // "apply."
};

export const CFPB_BOA = {
	src: `${A}/cfpb_boa_2023.png`,
	natural: {w: 730, h: 1000},
	headline: {x: 24, y: 368, w: 672, h: 178} as Region,
	junkFees: {x: 92, y: 414, w: 414, h: 48} as Region, // "Illegally Charging Junk Fees,"
	fakeAccounts: {x: 26, y: 500, w: 364, h: 48} as Region, // "Opening Fake Accounts"
	date: {x: 24, y: 652, w: 106, h: 28} as Region, // "JUL 11, 2023"
	top: {x: 0, y: 0, w: 730, h: 700} as Region,
};

export const CFPB_WF = {
	src: `${A}/cfpb_wf_2016.png`,
	natural: {w: 730, h: 960},
	secretly: {x: 508, y: 456, w: 112, h: 48} as Region, // "Secretly"
	unauthorized: {x: 26, y: 500, w: 504, h: 48} as Region, // "Opening Unauthorized Accounts"
	date: {x: 24, y: 625, w: 106, h: 28} as Region, // "SEP 08, 2016"
	top: {x: 0, y: 0, w: 730, h: 680} as Region,
};
