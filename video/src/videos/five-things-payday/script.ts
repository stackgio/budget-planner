import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'FiveThingsPayday',
	slug: 'five-things-payday',
	title: '5 Things to Do When You Get Paid',
	mode: 'education',
	looks: ['cinematic'],
	hookStyle: 'relatable situation (just got paid) + numbered promise, deposit card moving on frame 0',
	signatureMoves: [
		'faceless: no Marcus — paycheck cards + checklist rows carry the story',
		'matte black throughout (creator brief), green only for numbers and completed checks',
		'persistent 5-step progress pills that fill as each action completes',
		'checklist row 1 carries into the bills heading (object continuity); ending pulls back to the full checklist',
		'every step = one action (rent → set aside, cards → budget bracket, $20 → savings, extra → highest rate, $80 → shared bracket)',
		'phrase captions (sentence case) kept distinct from uppercase headlines',
	],
};

/** Narration exactly as spoken in the approved Stack voice file (ElevenLabs Scribe transcript). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'Just got paid?'},
	{id: 'L2', text: 'Do these five things before that money starts disappearing.'},
	{id: 'L3', text: 'One, check which bills are due before your next paycheck.'},
	{id: 'L4', text: "If rent's due before you get paid again, set that money aside now so it's there when you need it."},
	{id: 'L5', text: "Two, figure out how much you'll need for gas and groceries till next payday."},
	{id: 'L6', text: 'Look at what you spent last time.'},
	{id: 'L7', text: 'That gives you a number to start with.'},
	{id: 'L8', text: 'Three, move some money into savings on payday.'},
	{id: 'L9', text: "Even if it's 20 bucks, transfer it now."},
	{id: 'L10', text: "It's easy to spend it when it's still sitting in your checking account."},
	{id: 'L11', text: "Four, if you've got credit card debt, cover the minimum on every card."},
	{id: 'L12', text: 'Then put any extra toward the card with the highest interest rate.'},
	{id: 'L13', text: "That's the one charging you the most for every dollar you owe."},
	{id: 'L14', text: 'Five, give yourself a limit for fun money.'},
	{id: 'L15', text: "If you set aside 80 bucks, that's 80 total for eating out, hanging out, whatever, until your next check."},
	{id: 'L16', text: 'Save this and pull it up next payday.'},
];

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'hook' | 'bills' | 'groceries' | 'savings' | 'debt' | 'fun' | 'end'>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'bills', firstLine: 'L3', transitionFrames: 8}, // match cut: checklist row 1 continues
	{id: 'groceries', firstLine: 'L5', transitionFrames: 14}, // slide: next step
	{id: 'savings', firstLine: 'L8', transitionFrames: 16}, // slide up
	{id: 'debt', firstLine: 'L11', transitionFrames: 14}, // slide
	{id: 'fun', firstLine: 'L14', transitionFrames: 16}, // slide up
	{id: 'end', firstLine: 'L16', transitionFrames: 6}, // match cut into the pull-back
];

/** ~1 s of screenshot hold after the last word (voice ends 50.8 s). */
export const TAIL_SEC = 1.15;

/** When each step's action completes (line, word, offset sec) — drives the progress pills. */
export const STEP_DONE: [string, string, number][] = [
	['L4', 'now', 0.3],
	['L7', 'with', 0.1],
	['L9', 'now', 0.3],
	['L12', 'highest', 0.2],
	['L15', 'until', 0.3],
];
/** First line of each step (the pill becomes "current"). */
export const STEP_START = ['L3', 'L5', 'L8', 'L11', 'L14'];
