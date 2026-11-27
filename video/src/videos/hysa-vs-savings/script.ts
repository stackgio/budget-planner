import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'HysaVsSavings',
	slug: 'hysa-vs-savings',
	title: 'HYSA vs Regular Savings',
	mode: 'education',
	looks: ['editorial', 'editorial', 'cinematic', 'editorial', 'editorial', 'cinematic'],
	hookStyle: 'bold-claim',
	signatureMoves: [
		'same three cash stacks match-cut from flat (big bank) to growing (HYSA)',
		'bank building as a recurring object: deposit, cost tags fly off it',
		'comparison ladder: balances under each year, counters land on the spoken amount',
		'iris out of the vault handle into the CTA',
	],
};

/**
 * Narration, one entry per spoken line. The voiceover is generated from this
 * text with ElevenLabs (voice "Stack voice"), so the character timestamps
 * map 1:1 onto these tokens.
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'Keeping $5,000 in a traditional bank is quietly costing you hundreds every single year.', pauseAfter: 0.2},
	{id: 'L2', text: "Here's the math."},
	{id: 'L3', text: 'A big bank pays 0.01%.'},
	{id: 'L4', text: 'After three years, your $5,000 earns... a dollar fifty.'},
	{id: 'L5', text: 'A pack of gum costs more than that.', pauseAfter: 0.2},
	{id: 'L6', text: 'A high-yield savings account pays 4.5%.'},
	{id: 'L7', text: 'Same money, same three years: seven hundred and five dollars. For doing nothing.', pauseAfter: 0.2},
	{id: 'L8', text: "Why? Online banks don't pay for branches, rent, or tellers."},
	{id: 'L9', text: 'So they pass that cash to you.'},
	{id: 'L10', text: "And it's just as safe, as long as the bank is FDIC insured, up to $250,000."},
	{id: 'L11', text: 'Save this, and switch your savings before Monday.'},
];

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'hook' | 'bank' | 'hysa' | 'why' | 'safe' | 'end'>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'bank', firstLine: 'L3', transitionFrames: 8}, // match cut: the bank keeps its place
	{id: 'hysa', firstLine: 'L6', transitionFrames: 18}, // iris out of the phone screen
	{id: 'why', firstLine: 'L8', transitionFrames: 22}, // green panel sweep: new chapter
	{id: 'safe', firstLine: 'L10', transitionFrames: 16}, // slide
	{id: 'end', firstLine: 'L11', transitionFrames: 20}, // iris from the vault handle
];

/** Seconds held after the last word. */
export const TAIL_SEC = 1.8;
