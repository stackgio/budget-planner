import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'BankEvidence',
	slug: 'chase-boa-wells-evidence',
	title: "3 Banks I'd Think Twice About",
	mode: 'education',
	looks: ['cinematic', 'editorial', 'editorial', 'editorial', 'cinematic', 'editorial'],
	hookStyle: 'countdown-ranking',
	signatureMoves: [
		'real-source evidence cards (official screenshots, cropped, never retouched) with green highlight + source/date label',
		'logo chip → evidence card push-in per bank',
		'$15 lifts out of the real Chase footnote into the ×12 equation',
		'2023 → CFPB action mini timeline; 2016 account-opening stack',
		'HISTORICAL vs CURRENT tags on every claim',
	],
};

/**
 * Narration as SPOKEN in the ElevenLabs voiceover (offline-recognized + force-aligned).
 * Words flagged as uncertain in the evidence report: "criteria", "can't", "pretty big", "What".
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: "These are three banks I'd personally think twice about trusting with my money."},
	{id: 'L2', text: 'Number three: Chase.'},
	{id: 'L3', text: 'Their Total Checking account can charge $15 a month unless you meet certain criteria.'},
	{id: 'L4', text: "That's $180 a year if you can't avoid the fee."},
	{id: 'L5', text: "I'd rather keep that money."},
	{id: 'L6', text: 'Number two: Bank of America.'},
	{id: 'L7', text: 'In 2023, regulators took action against them over improper fees and unauthorized accounts.'},
	{id: 'L8', text: 'When it comes to my money, trust matters.'},
	{id: 'L9', text: 'Number one: Wells Fargo.'},
	{id: 'L10', text: "They had employees opening accounts without customers' permission."},
	{id: 'L11', text: "That's a pretty big red flag for me."},
	{id: 'L12', text: "Like, I'm 22, still learning personal finance."},
	{id: 'L13', text: "I'm not saying these banks are bad for everybody, but I'm learning that choosing the right bank matters."},
	{id: 'L14', text: 'What bank would you never use again?'},
];

export type SceneId = 'hook' | 'chase' | 'chaseMath' | 'boa' | 'wells' | 'end';

export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'chase', firstLine: 'L2', transitionFrames: 14},
	{id: 'chaseMath', firstLine: 'L4', transitionFrames: 12},
	{id: 'boa', firstLine: 'L6', transitionFrames: 16},
	{id: 'wells', firstLine: 'L9', transitionFrames: 16},
	{id: 'end', firstLine: 'L12', transitionFrames: 16},
];

export const TAIL_SEC = 1.4;
