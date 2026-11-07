import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'MoreMoneySameBroke',
	slug: 'more-money-same-broke',
	title: 'More Money, Same Broke Life',
	mode: 'education',
	looks: ['editorial', 'editorial', 'editorial', 'editorial', 'cinematic', 'cinematic', 'editorial', 'editorial', 'editorial'],
	hookStyle: 'surprising-number (contradiction: income up, balance still $0)',
	signatureMoves: [
		'hook dashboard: $3,000 rolls to $5,000 while LEFT IN BANK stays $0',
		'income bar grows a +$2,000 block that becomes the spending meter',
		'object-to-object spending trap (car → takeout → shopping) draining the meter',
		'cinematic before/after ledger: $0 → $0',
		'raise bar splits $500 off into a 12-month savings bar ($500 × 12 = $6,000)',
		'split-screen choice ending',
	],
};

/** Narration exactly as spoken (ElevenLabs Scribe transcript of the creator's voiceover). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'More money, same broke life.'},
	{id: 'L2', text: 'You were making $3,000 a month, and by the end of the month, every dollar was gone.'},
	{id: 'L3', text: 'Then boom, you get a raise.'},
	{id: 'L4', text: "Now you're making five thousand."},
	{id: 'L5', text: "But what's the first thing you do?"},
	{id: 'L6', text: 'You get a nicer car, order more DoorDash, and start shopping whenever you feel like it.'},
	{id: 'L7', text: 'Before you know it, that extra $2,000 is gone too.'},
	{id: 'L8', text: "Your paycheck went up, but your bank account didn't."},
	{id: 'L9', text: "That's called lifestyle inflation."},
	{id: 'L10', text: 'Basically, every time you make more money, you find new ways to spend it.'},
	{id: 'L11', text: "And look, there's nothing wrong with enjoying your money."},
	{id: 'L12', text: 'But imagine saving just five hundred dollars of that raise every month.'},
	{id: 'L13', text: "That's six thousand dollars in one year you could save, invest, or use to pay off debt."},
	{id: 'L14', text: "I'm learning that it's not just about making more money."},
	{id: 'L15', text: "It's about actually keeping some of it."},
	{id: 'L16', text: 'Be real.'},
	{id: 'L17', text: 'Are you saving that raise or upgrading your lifestyle?'},
];

export type SceneId = 'hook' | 'old' | 'raise' | 'spend' | 'realize' | 'inflation' | 'solution' | 'takeaway' | 'end';

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'old', firstLine: 'L2', transitionFrames: 12}, // slide from left: "rewind" to the old paycheck
	{id: 'raise', firstLine: 'L3', transitionFrames: 10}, // green panel sweep: the raise lands
	{id: 'spend', firstLine: 'L5', transitionFrames: 12}, // slide: the +$2,000 block becomes the meter
	{id: 'realize', firstLine: 'L8', transitionFrames: 14}, // iris out of the meter's empty end
	{id: 'inflation', firstLine: 'L10', transitionFrames: 8}, // match cut: the title stays, the bars arrive
	{id: 'solution', firstLine: 'L11', transitionFrames: 12}, // cream panel sweep: the light comes back
	{id: 'takeaway', firstLine: 'L14', transitionFrames: 12}, // slide up
	{id: 'end', firstLine: 'L16', transitionFrames: 12}, // wipe into the split
];

/** Seconds held after the last word (question needs a beat). */
export const TAIL_SEC = 1.6;
