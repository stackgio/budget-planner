import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'BankEvidence',
	slug: 'chase-boa-wells-evidence',
	title: "3 Banks I'd Think Twice About",
	mode: 'education',
	looks: ['editorial', 'editorial', 'editorial', 'cinematic', 'editorial'],
	hookStyle: 'surprising-number',
	signatureMoves: [
		'v3 cold open: $180/yr on frame 0, the number flies into ranking card #3',
		'phone-readable source crops (CFPB logo + headline + date) with green highlights',
		'$15 × 12 = $180 beside the real Chase heading, then "$0 if you qualify"',
		'plain-language "what the CFPB found" lines under each regulator headline',
		'HISTORICAL vs CURRENT tags on every claim',
	],
};

/**
 * v3 narration = the ORIGINAL ElevenLabs take, tightened (whole clauses only, cuts in silence)
 * by projects/chase-boa-wells-evidence/edit_voice.py → public/voice/<slug>/voice_v3.wav.
 * Cold open re-uses the Chase clause "$180 a year if you can't avoid the fee."
 * Dropped: "These are three banks…", "That's", "I'd rather keep that money.",
 * "When it comes to my money, trust matters.", "That's a pretty big red flag for me.", "Like,".
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: "$180 a year if you can't avoid the fee."},
	{id: 'L2', text: 'Number three: Chase.'},
	{id: 'L3', text: 'Their Total Checking account can charge $15 a month unless you meet certain criteria.'},
	{id: 'L4', text: 'Number two: Bank of America.'},
	{id: 'L5', text: 'In 2023, regulators took action against them over improper fees and unauthorized accounts.'},
	{id: 'L6', text: 'Number one: Wells Fargo.'},
	{id: 'L7', text: "They had employees opening accounts without customers' permission."},
	{id: 'L8', text: "I'm 22, still learning personal finance."},
	{id: 'L9', text: "I'm not saying these banks are bad for everybody, but I'm learning that choosing the right bank matters."},
	{id: 'L10', text: 'What bank would you never use again?'},
];

export type SceneId = 'hook' | 'chase' | 'boa' | 'wells' | 'end';

export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'chase', firstLine: 'L2', transitionFrames: 12},
	{id: 'boa', firstLine: 'L4', transitionFrames: 14},
	{id: 'wells', firstLine: 'L6', transitionFrames: 14},
	{id: 'end', firstLine: 'L8', transitionFrames: 14},
];

/** final question stays on screen this long after the last word */
export const TAIL_SEC = 2.4;
