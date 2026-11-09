import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'CarPayment750V2',
	slug: 'car-payment-750-v2',
	title: 'The $750 Car Payment (v2)',
	mode: 'education',
	looks: ['cinematic', 'cinematic', 'white', 'white', 'white', 'cinematic', 'white', 'cinematic', 'split'],
	hookStyle: 'surprising-number',
	signatureMoves: [
		'studio-lit luxury car with a light sweep under a giant $750 (no Marcus)',
		'$750 match-cuts from the car into a stark cost interface',
		'calculator total collapses into a $1,150 hero number, then ×12',
		'dark → warm daylight: $13,800 splits in half, luxury pans to a used sedan',
		'paycheck bar drains every month → IS IT WORTH IT? → split-screen debate',
	],
};

/** Exactly as spoken in the ElevenLabs voiceover (from voice.py transcribe). Matches the locked script. */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'Can we talk about how people are casually paying seven hundred and fifty dollars a month for a car?'},
	{id: 'L2', text: "Like, that's actually crazy to me."},
	{id: 'L3', text: 'And the worst part?'},
	{id: 'L4', text: "That's just the car payment."},
	{id: 'L5', text: 'You still gotta pay insurance, gas, maintenance, all that.'},
	{id: 'L6', text: "Let's say you're paying two hundred dollars for insurance and another two hundred dollars for gas."},
	{id: 'L7', text: "Bro, that's one thousand one hundred and fifty dollars a month just to drive your car."},
	{id: 'L8', text: "That's almost fourteen thousand dollars a year, and we haven't even talked about tires or repairs yet."},
	{id: 'L9', text: 'Now, imagine what you could do with even half of that money.'},
	{id: 'L10', text: 'You could be saving, investing, traveling, actually enjoying your life.'},
	{id: 'L11', text: "And look, I'm not saying you shouldn't have a nice car."},
	{id: 'L12', text: 'If you can comfortably afford it, go for it.'},
	{id: 'L13', text: "But me personally, I'd rather get a good, reliable used car and keep that extra money in my pocket."},
	{id: 'L14', text: "Because what's the point of driving a nice car if you're stressed about money every single month?"},
	{id: 'L15', text: "But I'm curious, what's the most you'd be willing to pay for a car payment?"},
];

export type SceneId = 'hook' | 'hidden' | 'receipt' | 'half' | 'montage' | 'afford' | 'used' | 'worth' | 'ask';

/** Same narration and word timing as the original cut; only the visuals change. */
export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'}, // L1–L4: $750/MONTH · JUST THE PAYMENT, extra costs pile up
	{id: 'hidden', firstLine: 'L5', transitionFrames: 8},
	{id: 'receipt', firstLine: 'L6', transitionFrames: 10}, // L6–L8: one white receipt through $13,800
	{id: 'half', firstLine: 'L9', transitionFrames: 14},
	{id: 'montage', firstLine: 'L10', transitionFrames: 12},
	{id: 'afford', firstLine: 'L11', transitionFrames: 14},
	{id: 'used', firstLine: 'L13', transitionFrames: 16},
	{id: 'worth', firstLine: 'L14', transitionFrames: 14},
	{id: 'ask', firstLine: 'L15', transitionFrames: 12},
];

/** Voice ends at 57.55 s; hold just long enough for the question to land. */
export const TAIL_SEC = 0.55;
