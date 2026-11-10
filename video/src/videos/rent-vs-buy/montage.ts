/**
 * Cold-open edit decision list (plain data — no JSX, so scripts can import it).
 *
 * Sources: the three creator clips supplied for this episode (576×1024, 30 fps).
 * Copies in public/motion/rent-vs-buy/assets/ have the video stream copied
 * bit-for-bit; only the audio gain differs, to match dialogue to the VO
 * (−19.9 LUFS integrated, measured with ffmpeg ebur128 over each in/out range).
 * Word times are ElevenLabs Scribe timestamps on each clip (source seconds).
 */
export type ClipCut = {
	id: string;
	sourceFile: string;
	src: string;
	handle: string;
	/** source frames @30fps: [in, out) */
	inFrame: number;
	outFrame: number;
	gainDb: number;
	captionTop: number;
	captionSize: number;
	words: {text: string; start: number; end: number}[];
};

export const CLIPS: ClipCut[] = [
	{
		id: 'regret',
		sourceFile: 'b5141dfb-v12300gd0001d1e99kfog65pi9nem8kg.mov',
		src: 'motion/rent-vs-buy/assets/clip1_bkmortgagepro_b5141dfb.mp4',
		handle: '@bkmortgagepro',
		inFrame: 7, // 0.233 s — first audible word "I" starts 0.26 s
		outFrame: 48, // 1.600 s — after "house." (ends 1.42 s), before "I regret it a lot"
		gainDb: -1.5,
		captionTop: 312, // under her burned-in top text, above the red title box
		captionSize: 56,
		words: [
			{text: 'I', start: 0.3, end: 0.36},
			{text: 'regret', start: 0.38, end: 0.7},
			{text: 'buying', start: 0.74, end: 0.96},
			{text: 'a', start: 1.0, end: 1.04},
			{text: 'house.', start: 1.08, end: 1.42},
		],
	},
	{
		id: 'instant-regret',
		sourceFile: 'cfed7a62-v15044gf0000ctga40fog65v7flmobh0.mov',
		src: 'motion/rent-vs-buy/assets/clip2_maliksmindset_cfed7a62.mp4',
		handle: '@maliksmindset',
		inFrame: 10, // 0.333 s — "I" starts 0.36 s
		outFrame: 132, // 4.400 s — after "regretted that" (4.34 s); cuts before the expletive (4.46 s) and before the watermark jumps (4.50 s)
		gainDb: -0.4,
		captionTop: 1430,
		captionSize: 56,
		words: [
			{text: 'I', start: 0.42, end: 0.44},
			{text: 'became', start: 0.5, end: 0.78},
			{text: 'a', start: 0.82, end: 0.86},
			{text: 'homeowner', start: 0.88, end: 1.3},
			{text: 'at', start: 1.34, end: 1.46},
			{text: '22', start: 1.6, end: 1.86},
			{text: 'years', start: 1.88, end: 2.04},
			{text: 'old,', start: 2.1, end: 2.32},
			{text: 'and', start: 2.98, end: 3.3},
			{text: 'I', start: 3.38, end: 3.46},
			{text: 'instantly', start: 3.54, end: 3.84},
			{text: 'regretted', start: 3.88, end: 4.22},
			{text: 'that.', start: 4.26, end: 4.34},
		],
	},
	{
		id: 'house-poor',
		sourceFile: '74faeb1d-v12044gd0000cnlsfunog65ppcae6pdg.mov',
		src: 'motion/rent-vs-buy/assets/clip3_headmedincharge_74faeb1d.mp4',
		handle: '@headmedincharge',
		inFrame: 2, // 0.067 s — speech onset ~0.10 s
		outFrame: 93, // 3.100 s — after "poverty" (~3.0 s); file ends 3.155 s
		gainDb: 7.1,
		captionTop: 1512, // below her burned-in caption, above the bottom UI zone
		captionSize: 48,
		words: [
			{text: 'I', start: 0.2, end: 0.22},
			{text: 'bought', start: 0.3, end: 0.4},
			{text: 'a', start: 0.46, end: 0.48},
			{text: 'house', start: 0.52, end: 0.68},
			{text: 'when', start: 0.7, end: 0.76},
			{text: 'I', start: 0.8, end: 0.82},
			{text: 'was', start: 0.84, end: 0.9},
			{text: '26', start: 0.98, end: 1.32},
			{text: 'and', start: 1.34, end: 1.4},
			{text: 'fell', start: 1.48, end: 1.64},
			{text: 'immediately', start: 1.82, end: 2.56},
			{text: 'into', start: 2.6, end: 2.78},
			{text: 'poverty.', start: 2.82, end: 3.05},
		],
	},
];

export const MONTAGE_FRAMES = CLIPS.reduce((s, c) => s + (c.outFrame - c.inFrame), 0);
