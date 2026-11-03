/**
 * Per-video metadata for /motion. Read by scripts/motion/report.ts and
 * render.sh, and by the /motion skill to keep consecutive videos visually
 * varied (it reads META of recent videos before designing a new one).
 */
export type MotionMode =
	| 'personal-journey'
	| 'education'
	| 'historical-graph'
	| 'budget'
	| 'meme'
	| 'dividend'
	| 'motivational';

export type VideoMeta = {
	compositionId: string;
	slug: string;
	title: string;
	mode: MotionMode;
	/** looks used, in order, e.g. ['editorial', 'cinematic', 'editorial'] */
	looks: string[];
	/** e.g. 'surprising-number', 'question', 'relatable-situation', 'pov', 'object-metaphor' */
	hookStyle: string;
	/** the 2–4 visual ideas that define this video, e.g. ['balance leans on Marcus', 'iris from desk lamp'] */
	signatureMoves: string[];
};

/**
 * Every number shown on screen lives in facts.ts with its provenance.
 *  personal     — supplied by the creator (screenshot, statement). Never edit.
 *  historical   — downloaded/verified market data (cite source + date).
 *  hypothetical — illustrative example; MUST be labelled "Example" on screen.
 *  computed     — derived in code from the above (say from what).
 */
export type FactKind = 'personal' | 'historical' | 'hypothetical' | 'computed';
export type Fact = {value: number; kind: FactKind; source: string};
export const fact = (value: number, kind: FactKind, source: string): Fact => ({value, kind, source});
