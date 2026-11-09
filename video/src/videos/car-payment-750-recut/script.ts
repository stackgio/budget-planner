import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'CarPayment750Recut',
	slug: 'car-payment-750-recut',
	title: 'The $750 Car Payment (Recut)',
	mode: 'education',
	looks: ['cinematic', 'white', 'white', 'split'],
	hookStyle: 'surprising-number',
	signatureMoves: [
		'frame-one $750 → $1,150/mo over the dark car',
		'hard cut to a white EXAMPLE receipt that lands on $1,150 then a stable $13,800',
		'silver used car in a white studio',
		'two-car split with one question, no preset answers',
	],
};

/**
 * Creator's recut script. Numbers are written the way they'll be SPOKEN so
 * temp timing is realistic and an ElevenLabs transcript of the new voiceover
 * matches with no edits (captions turn them back into "$750" etc.).
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'A seven hundred and fifty dollar car payment can turn into one thousand one hundred and fifty dollars a month.'},
	{id: 'L2', text: "Here's where the extra four hundred dollars goes.", pauseAfter: 0.45},
	{id: 'L3', text: "That's thirteen thousand eight hundred dollars a year before tires or repairs."},
	{id: 'L4', text: "Me personally, I'd rather get a reliable used car and keep more of my paycheck."},
	{id: 'L5', text: "What's the most you'd pay per month for the car payment alone?"},
];

export type SceneId = 'hook' | 'receipt' | 'used' | 'ask';

export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'receipt', firstLine: 'L2', transitionFrames: 0}, // straight cut
	{id: 'used', firstLine: 'L4', transitionFrames: 0}, // straight cut
	{id: 'ask', firstLine: 'L5', transitionFrames: 10},
];

export const TAIL_SEC = 1.2;
