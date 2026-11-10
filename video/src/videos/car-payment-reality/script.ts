import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'CarPaymentReality',
	slug: 'car-payment-reality',
	title: 'The Real Cost of a $750 Car Payment',
	mode: 'budget',
	looks: ['matte', 'matte', 'matte'],
	hookStyle: 'surprising-number',
	signatureMoves: [
		'car key lands beside $750, which becomes line one of a receipt',
		'receipt itemizes on the spoken words, then folds into half of the example',
		'the key returns on "me personally" beside a reliable used car',
		'all matte black / white / bright green, no Marcus, no music',
	],
};

/**
 * Narration exactly as SPOKEN in the creator's ElevenLabs voiceover
 * (public/voice/car-payment-reality/script-lines.json). Numbers stay as spoken
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
	L1: [['Can we talk about how', 5], ['people are casually paying', 4], ['$750 a month for a car?', 10]],
	L2: [["Like, that's actually crazy to me.", 6]],
	L3: [['And the worst part?', 4]],
	L4: [["That's JUST the car payment.", 5]],
	L5: [['You still gotta pay', 4], ['insurance, gas, maintenance, all that.', 5]],
	L6: [["Let's say you're paying", 4], ['$200 for insurance', 5], ['and another $200 for gas.', 7]],
	L7: [['Bro,', 1], ["that's $1,150 a month", 10], ['just to drive your car.', 5]],
	L8: [["That's almost $14,000 a year.", 7], ["And we haven't even talked", 5], ['about tires or repairs yet.', 5]],
	L9: [['Now imagine what you could do', 6], ['with even half of that money.', 6]],
	L10: [['You could be saving,', 4], ['investing, traveling,', 2], ['actually enjoying your life.', 4]],
	L11: [['And look,', 2], ["I'm not saying you shouldn't", 5], ['have a nice car.', 4]],
	L12: [['If you can comfortably afford it,', 6], ['go for it.', 3]],
	L13: [['But me personally?', 3], ["I'd rather get a good,", 5], ['reliable used car', 3], ['and keep that extra money', 5], ['in my pocket.', 3]],
	L14: [["Because what's the point", 4], ['of driving a nice car', 5], ["if you're stressed about money", 5], ['every single month?', 3]],
	L15: [["But I'm curious,", 3], ["what's the MOST you'd be willing", 6], ['to pay for a car payment?', 6]],
};

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'bill' | 'choice' | 'ask'>[] = [
	{id: 'bill', firstLine: 'L1'}, // key + $750 → receipt → $1,150 → $13,800 → fold → $575
	{id: 'choice', firstLine: 'L11', transitionFrames: 14}, // slide: from the money to the personal choice
	{id: 'ask', firstLine: 'L15', transitionFrames: 12}, // wipe up to the question card
];

/** Seconds held after the last word (room to answer the question). */
export const TAIL_SEC = 1.8;
