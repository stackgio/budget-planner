import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'SavingsVsRetirement',
	slug: 'savings-vs-retirement',
	title: 'Savings vs High-Yield, Roth IRA vs 401(k)',
	mode: 'education',
	looks: ['desk (warm off-white, top-down)', 'desk'],
	hookStyle: 'object-comparison (two account cards, "what\'s the difference?")',
	signatureMoves: [
		'no Marcus: top-down desk shoot, white account cards locked in left/right slots for the whole video',
		'hard cut to car keys on a repair estimate; the $500 note splits into both savings cards',
		'match cut: same two cards, savings labels swap to Roth IRA / 401(k)',
		'deposit then purchase inside the Roth card; paycheck slice + separate employer piece into the 401(k)',
	],
};

/** Narration exactly as spoken (ElevenLabs Scribe transcript of the locked voiceover). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'This is a regular savings account.'},
	{id: 'L2', text: 'This is a high-yield savings account.'},
	{id: 'L3', text: "What's the difference?"},
	{id: 'L4', text: "Say you've got five hundred dollars set aside in case your car breaks down."},
	{id: 'L5', text: 'Either account can hold that money.'},
	{id: 'L6', text: 'The difference is how much the bank pays you while it sits there.'},
	{id: 'L7', text: 'That money the bank pays you is called interest.'},
	{id: 'L8', text: 'A regular savings account can pay interest, and a high-yield savings account usually pays more.'},
	{id: 'L9', text: "So while you're waiting for that surprise repair, the same five hundred dollars could earn you more."},
	{id: 'L10', text: 'This is a Roth IRA, and this is a 401k.'},
	{id: 'L11', text: "What's the difference?"},
	{id: 'L12', text: 'Both help you invest for retirement.'},
	{id: 'L13', text: 'A Roth IRA is one you open yourself.'},
	{id: 'L14', text: "You put in money you've already paid taxes on, and you can use it to buy investments."},
	{id: 'L15', text: 'Later, if you follow the withdrawal rules, you can take out your money and what it earned tax-free.'},
	{id: 'L16', text: 'A 401k is offered through work.'},
	{id: 'L17', text: 'You choose how much to put in, and it comes straight out of your paycheck.'},
	{id: 'L18', text: 'If your job offers a match, your employer adds some of its own money when you put in yours.'},
	{id: 'L19', text: 'And yes, you can have both a Roth IRA and a 401k.'},
];

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'savings' | 'retire'>[] = [
	{id: 'savings', firstLine: 'L1'},
	{id: 'retire', firstLine: 'L10', transitionFrames: 8}, // match cut: identical card framing, labels swap
];

/** Seconds held on "You can have both" after the last word. */
export const TAIL_SEC = 1.5;
