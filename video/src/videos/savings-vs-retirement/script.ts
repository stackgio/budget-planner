import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'SavingsVsRetirement',
	slug: 'savings-vs-retirement',
	title: 'Regular vs High-Yield Savings, Roth IRA vs 401(k)',
	mode: 'education',
	looks: ['stone-desk', 'stone-desk'],
	hookStyle: 'object-reveal ("This is…" cards sliding onto a real desk, readable on frame 0)',
	signatureMoves: [
		'top-down stone desk in daylight, no presenter — props carry the story',
		'close-up of car keys landing on a repair estimate, pulling back to the two $500 cards',
		'match cut: savings cards become retirement cards in the same positions',
		'paycheck line lifts off a sample pay stub into the 401(k); employer match arrives as a separate gold deposit',
	],
};

/**
 * Narration, one entry per spoken line — verbatim from the locked voiceover
 * (word timings: public/voice/savings-vs-retirement/alignment.json, ElevenLabs Scribe).
 * Punctuation/format follows the locked script ("401(k)"); tokens normalise to the spoken words.
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'This is a regular savings account.'},
	{id: 'L2', text: 'This is a high-yield savings account.'},
	{id: 'L3', text: 'What’s the difference?'},
	{id: 'L4', text: 'Say you’ve got five hundred dollars set aside in case your car breaks down.'},
	{id: 'L5', text: 'Either account can hold that money.'},
	{id: 'L6', text: 'The difference is how much the bank pays you while it sits there.'},
	{id: 'L7', text: 'That money the bank pays you is called interest.'},
	{id: 'L8', text: 'A regular savings account can pay interest, and a high-yield savings account usually pays more.'},
	{id: 'L9', text: 'So while you’re waiting for that surprise repair, the same five hundred dollars could earn you more.'},
	{id: 'L10', text: 'This is a Roth IRA.'},
	{id: 'L11', text: 'And this is a 401(k).'},
	{id: 'L12', text: 'What’s the difference?'},
	{id: 'L13', text: 'Both help you invest for retirement.'},
	{id: 'L14', text: 'A Roth IRA is one you open yourself.'},
	{id: 'L15', text: 'You put in money you’ve already paid taxes on, and you can use it to buy investments.'},
	{id: 'L16', text: 'Later, if you follow the withdrawal rules, you can take out your money and what it earned tax-free.'},
	{id: 'L17', text: 'A 401(k) is offered through work.'},
	{id: 'L18', text: 'You choose how much to put in, and it comes straight out of your paycheck.'},
	{id: 'L19', text: 'If your job offers a match, your employer adds some of its own money when you put in yours.'},
	{id: 'L20', text: 'And yes, you can have both a Roth IRA and a 401(k).'},
];

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'savings' | 'retire'>[] = [
	{id: 'savings', firstLine: 'L1'},
	{id: 'retire', firstLine: 'L10', transitionFrames: 8}, // match cut: same card positions
];

/** Seconds held after the last word — end cleanly on the final frame. */
export const TAIL_SEC = 1.2;
