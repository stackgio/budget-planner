import {cinematic, editorial, type Palette} from '../../story/theme';

/** Clean white "evidence" look (matte black / white / bright green brief). */
export const white: Palette = {
	...editorial,
	bg: '#FFFFFF',
	bg2: '#F3F4F2',
	paper: '#FFFFFF',
	ink: '#0E0F12',
	body: '#2B2F36',
	muted: '#6B7280',
	line: '#E5E7EB',
	accent: '#16A34A',
	accentDeep: '#13703C',
	accentSoft: 'rgba(22,163,74,0.12)',
	shadow: 'rgba(15,20,30,0.16)',
};
export const dark = cinematic;

/** Fund colours carry meaning: core market = green, dividends = gold, international = blue. */
export const FUND = {
	vti: {dark: cinematic.accent, light: white.accent},
	schd: {dark: cinematic.gold, light: '#C98A12'},
	vxus: {dark: '#5AA9E6', light: '#2563EB'},
};

/** Hook note geometry (shared with the VTI iris origin). */
export const NOTE = {w: 800, cx: 540, cy: 790};
export const NOTE_H = NOTE.w * 0.43;
export const SPLIT = {
	gap: 24,
	left: 100,
	// fractions of the note
	cuts: [
		[0, 0.7],
		[0.7, 0.9],
		[0.9, 1],
	] as [number, number][],
};
/** Left x of each strip after the split. */
export const stripX = (i: number) => {
	let x = SPLIT.left;
	for (let k = 0; k < i; k++) x += (SPLIT.cuts[k][1] - SPLIT.cuts[k][0]) * NOTE.w + SPLIT.gap;
	return x;
};
/** where the strips rest at the end of the hook */
export const STRIP_TOP = 560;
export const VTI_STRIP_CENTER = {x: stripX(0) + 0.35 * NOTE.w, y: STRIP_TOP + NOTE_H / 2};

/** Logo tiles at the end of the VTI scene = start of the market scene (match cut). */
export const TILES = {y: 1180, w: 240, h: 170, xs: [100, 390, 680]};

/** VTI top-holding bars (logo boxes) — the market scene's logos fly out of these. */
export const BARS = {x: 100, ys: [700, 860, 1020], logoW: 150, h: 120};
