import type {VideoMeta} from '../../story/lib/meta';

/**
 * Silent, fixed-timeline video: the creative brief's timeline is the timing
 * authority (no narration). Rendered with a direct `remotion render --muted`
 * (see projects/one-good-day/STORYBOARD.md), not scripts/motion/render.sh,
 * which derives timing from narration.
 */
export const META: VideoMeta = {
	compositionId: 'OneGoodDay',
	slug: 'one-good-day',
	title: 'It all starts with 1 good day',
	mode: 'motivational',
	looks: ['footage'],
	hookStyle: 'bold-claim',
	signatureMoves: [
		'one continuous pre-sunrise street shot, no cuts',
		'light lifts as "1 good day" lands',
		'masked line reveals in a fixed, slightly-high type block',
		'green numeral 1 → full green payoff',
	],
};

export const FPS = 30;
export const DURATION_SEC = 10;

/** Footage: seconds into the source clip where the shot starts (the sun flares into frame from ~12 s, so the shot runs 0.5–10.5 s). */
export const BG_SRC = 'motion/one-good-day/assets/street-predawn-pexels-19688504.mp4';
export const BG_START_SEC = 0.5;

export type Beat = {
	id: string;
	start: number; // sec
	end: number; // sec
	setup?: string;
	/** payoff line; a leading "1" is rendered in green */
	payoff: string;
	/** seconds after `start` when the payoff line starts revealing */
	payoffDelay?: number;
	/** highlight the whole payoff (minus final period) in green */
	fullGreen?: boolean;
};

export const BEATS: Beat[] = [
	{id: 'year', start: 0, end: 1.8, setup: 'A lot can change', payoff: 'in 1 good year.'},
	{id: 'season', start: 1.8, end: 3.5, setup: 'It can start with', payoff: '1 good season.'},
	{id: 'month', start: 3.5, end: 5.3, payoff: 'Or 1 good month.'},
	{id: 'day', start: 5.3, end: 10, setup: 'And it all starts with', payoff: '1 good day.', payoffDelay: 0.3, fullGreen: true},
];
