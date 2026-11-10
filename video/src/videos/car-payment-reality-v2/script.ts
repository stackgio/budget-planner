import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'CarPaymentRealityV2',
	slug: 'car-payment-reality-v2',
	title: 'The Real Cost of a $750 Car Payment (hybrid)',
	mode: 'budget',
	looks: ['matte', 'matte', 'matte'],
	hookStyle: 'surprising-number',
	signatureMoves: [
		'key drops beside $750/MO while a lit side-profile car rises beneath it',
		'one white EXAMPLE receipt: $750, +$200, +$200 on their words → $1,150 → $13,800/YR focal box',
		'receipt folds and tears into $575/MO; silver everyday car on "me personally"',
		'draining paycheck bar (illustrative, no figures) on "stressed about money every single month"',
	],
};

/**
 * Narration exactly as SPOKEN in the creator's ElevenLabs voiceover
 * (public/voice/car-payment-reality/script-lines.json); cues come from the
 * silence-tightened alignment in public/voice/car-payment-reality-v2/. Numbers stay as spoken
 * words so every cue aligns; captions show them as figures (CAPTIONS below).
 */
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

/**
 * Phrase-level captions: [text shown, number of spoken words it covers].
 * Word counts must add up to each line's word count (checked at runtime).
 * Wording follows the locked script (figures as written, "JUST"/"MOST" stressed).
 */
export const CAPTIONS: Record<string, [string, number][]> = {
	L1: [['Can we talk about', 4], ['how people are', 3], ['casually paying', 2], ['$750 a month', 7], ['for a car?', 3]],
	L2: [['Like,', 1], ["that's actually", 2], ['crazy to me.', 3]],
	L3: [['And the worst part?', 4]],
	L4: [["That's JUST", 2], ['the car payment.', 3]],
	L5: [['You still gotta pay', 4], ['insurance, gas,', 2], ['maintenance, all that.', 3]],
	L6: [["Let's say you're paying", 4], ['$200 for insurance', 5], ['and another', 2], ['$200 for gas.', 5]],
	L7: [['Bro,', 1], ["that's $1,150 a month", 10], ['just to drive your car.', 5]],
	L8: [["That's almost $14,000", 5], ['a year.', 2], ["And we haven't", 3], ['even talked about', 3], ['tires or repairs yet.', 4]],
	L9: [['Now imagine', 2], ['what you could do', 4], ['with even half', 3], ['of that money.', 3]],
	L10: [['You could be saving,', 4], ['investing,', 1], ['traveling,', 1], ['actually enjoying your life.', 4]],
	L11: [['And look,', 2], ["I'm not saying", 3], ["you shouldn't have", 3], ['a nice car.', 3]],
	L12: [['If you can', 3], ['comfortably afford it,', 3], ['go for it.', 3]],
	L13: [['But me personally?', 3], ["I'd rather get", 3], ['a good,', 2], ['reliable used car', 3], ['and keep that', 3], ['extra money', 2], ['in my pocket.', 3]],
	L14: [["Because what's the point", 4], ['of driving a nice car', 5], ["if you're stressed", 3], ['about money', 2], ['every single month?', 3]],
	L15: [["But I'm curious,", 3], ["what's the MOST", 3], ["you'd be willing", 3], ['to pay for', 3], ['a car payment?', 3]],
};

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'bill' | 'choice' | 'ask'>[] = [
	{id: 'bill', firstLine: 'L1'}, // key + $750 → receipt → $1,150 → $13,800 → fold → $575
	{id: 'choice', firstLine: 'L11', transitionFrames: 14}, // slide: from the money to the personal choice
	{id: 'ask', firstLine: 'L15', transitionFrames: 12}, // wipe up to the question card
];

/** Seconds held after the last word (~½ s, per the recut brief). */
export const TAIL_SEC = 0.5;
