import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'MoneyMistakes22',
	slug: 'money-mistakes-22',
	title: '3 Money Mistakes I Made at 22',
	mode: 'education',
	looks: ['cinematic', 'editorial', 'cinematic', 'editorial', 'editorial'],
	hookStyle: 'bold-claim',
	signatureMoves: [
		'black cold open: Marcus refuses a cash stack with a stop hand (called back in the match scene)',
		'12-month grid fills while $450/mo rolls into $5,400/yr',
		'minimum-payment split bar: interest vs balance',
		'SKIPPED stamp slammed onto the free match money',
	],
};

/**
 * Narration, one entry per spoken line. When a voiceover exists this text
 * must match what is SPOKEN (the audio is the timing authority) — build it
 * from public/voice/money-mistakes-22/script-lines.json after `voice.py transcribe`.
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'At twenty-two, I said no to free money.', pauseAfter: 0.2},
	{id: 'L2', text: "And that wasn't even my worst mistake.", pauseAfter: 0.25},
	{id: 'L3', text: 'Mistake one: I bought a car to look like I had money.'},
	{id: 'L4', text: 'Four hundred fifty dollars a month, on a forty thousand dollar salary.'},
	{id: 'L5', text: "That's fifty-four hundred dollars a year, just to drive to work.", pauseAfter: 0.4},
	{id: 'L6', text: 'Mistake two: I only paid the minimum on my credit card.'},
	{id: 'L7', text: 'Three thousand dollars at twenty-four percent.'},
	{id: 'L8', text: 'Sixty dollars of my ninety dollar payment was just interest.', pauseAfter: 0.4},
	{id: 'L9', text: 'Mistake three: I skipped my four-oh-one-k match.'},
	{id: 'L10', text: "My job matched four percent. That's sixteen hundred dollars a year."},
	{id: 'L11', text: 'Free money. And I said no.', pauseAfter: 0.35},
	{id: 'L12', text: 'Which one are you making right now?'},
];

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'hook' | 'car' | 'card' | 'match' | 'end'>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'car', firstLine: 'L3', transitionFrames: 14}, // slide up: new topic
	{id: 'card', firstLine: 'L6', transitionFrames: 20}, // iris opens from where the card will sit
	{id: 'match', firstLine: 'L9', transitionFrames: 22}, // green chapter sweep
	{id: 'end', firstLine: 'L12', transitionFrames: 16}, // slide up to the recap
];

/** Seconds held after the last word (the comment prompt needs a beat). */
export const TAIL_SEC = 2.4;
